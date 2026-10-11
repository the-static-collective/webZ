"""Signed RECEIVE/HOLD reader: browser verifies independent ephemeral reLATTE v0 signatures."""
import json,pathlib,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass
raw=subprocess.check_output(['node',str(ROOT/'tests/receipt-witness-002.mjs')],cwd=ROOT)
carrier=json.loads(raw)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
host=f'http://127.0.0.1:{server.server_port}'
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for prefix in ('/','/nested/webZ/'):
   requests=[];errors=[]
   ctx=browser.new_context(viewport={'width':320,'height':770})
   ctx.on('request',lambda req:requests.append(req.url))
   page=ctx.new_page()
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto(host+prefix+'arrivals/receipts/')
   assert page.locator('#result').text_content()=='Nothing verified.'
   page.locator('#journal').set_input_files({'name':'journal.json','mimeType':'application/json','buffer':raw})
   page.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('VALID')")
   r=json.loads(page.locator('#result').text_content())
   assert r['status']=='SIGNED_RECEIVED_AND_HELD'
   assert r['world_admission'] is False
   assert r['operator_identity']=='NOT_AUTHENTICATED_BY_THIS_BUNDLE'
   assert r['crossing_id']==carrier['carrier']['crossing']['crossing_id']
   assert r['receiver_key_fingerprint'] in page.locator('#claim').inner_text()
   altered=json.loads(raw);altered['events'][1]['receipt']['note']='counterfeit'
   page.locator('#journal').set_input_files({'name':'tampered.json','mimeType':'application/json',
     'buffer':json.dumps(altered).encode()})
   page.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('REJECTED')")
   assert page.locator('#result').text_content()=='No accepted receipt history.'
   assert page.evaluate('localStorage.length+sessionStorage.length')==0
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert all(urlparse(req).netloc==urlparse(host).netloc for req in requests)
   assert not errors,errors
   results.append({'scope':prefix,'receiver_signatures_verified':2,'tampering_rejected':True,
     'third_party_requests':0,'owner_identity':'UNAUTHENTICATED'})
   ctx.close()
  browser.close()
 print(json.dumps({'schema':'webz/gr o-signed-browser-witness/v0'.replace(' ',''),'results':results},indent=2))
finally:server.shutdown();server.server_close()
