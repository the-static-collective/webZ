"""RECEIPT GLASS 001 — actual static browser witness, root and nested, 320px."""
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
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
host=f'http://127.0.0.1:{server.server_port}'
result=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for prefix in ('/','/nested/webZ/'):
   ctx=browser.new_context(viewport={'width':320,'height':730})
   page=ctx.new_page();requests=[];errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   ctx.on('request',lambda req:requests.append(req.url))
   page.goto(host+prefix+'receipts/')
   assert page.locator('#mode').inner_text()=='NOT INSPECTED'
   page.locator('#input-file').set_input_files({'name':'gr o.json'.replace(' ',''),'mimeType':'application/json','buffer':raw})
   page.wait_for_function("()=>document.querySelector('#mode').textContent.includes('SIGNED JOURNAL')")
   assert page.locator('#timeline li').count()==3
   assert page.locator('#lenses button').count()==11
   assert page.locator('#ancestry li').count()==5
   with page.expect_download() as info:
    page.locator('#goatExport').click()
   packet=json.loads(pathlib.Path(info.value.path()).read_text())
   assert packet['schema']=='webz.goatnote-receipt-handoff/v0'
   assert packet['source']['json']==raw.decode()
   assert packet['inspection']['mode']=='LOCAL_JOURNAL_VERIFIED'
   assert packet['authority']=='NO_AUTHORITY_TRANSFER'
   page.get_by_role('button',name='Ancestry',exact=True).click()
   assert 'two-event' in page.locator('#lens-detail').inner_text()
   altered=json.loads(raw);altered['events'][1]['receipt']['note']='forged'
   page.locator('#input-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(altered).encode()})
   page.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('REFUSED')")
   assert page.locator('#inspection').is_hidden()
   page.locator('#example').click()
   page.wait_for_function("()=>document.querySelector('#mode').textContent.includes('UNVERIFIED')")
   assert page.locator('#timeline li').count()==3
   assert 'NOT INSPECTED' not in page.locator('#mode').inner_text()
   assert page.evaluate('localStorage.length+sessionStorage.length')==0
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert all(urlparse(u).netloc==urlparse(host).netloc for u in requests)
   assert not errors,errors
   page.locator('#clear').click()
   assert page.locator('#inspection').is_hidden()
   result.append({'prefix':prefix,'gr o_crypto':'VALID'.replace(' ',''),'archive':'UNVERIFIED','mobile':True,'external_requests':0})
   ctx.close()
  browser.close()
 print(json.dumps({'schema':'webz/receipt-glass-browser/v0','results':result},indent=2))
finally:server.shutdown();server.server_close()
