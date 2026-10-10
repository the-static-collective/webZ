"""Browser witness for a locally generated signed Name Orchard JSON capsule."""
import json,pathlib,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*a):pass

raw=subprocess.run(['node','scripts/name-orchard-001.mjs','demo'],
 cwd=ROOT,text=True,capture_output=True,check=True).stdout
bundle=json.loads(raw)
assert bundle['schema']=='webz/name-orchard-witness/v1'
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];foreign=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:foreign.append(r.url) if not r.url.startswith(base.split('/nested/webZ/')[0]) else None)
  page.goto(base+'worlds/name-orchard/')
  assert 'No witness admitted' in page.locator('#status').inner_text()
  assert page.locator('.claim').count()==0
  page.locator('#bundle').set_input_files({'name':'name-witness.json','mimeType':'application/json','buffer':raw.encode()})
  page.wait_for_function("()=>document.querySelector('#status').textContent.includes('Cryptographically checked 6 signatures')")
  assert 'AMBIGUOUS' in page.locator('#claims').inner_text()
  assert page.locator('.claim').count()==2
  assert 'Let It Find Us' in page.locator('#claims').inner_text()
  assert page.locator('#x-title').inner_text()=='Metadata received to HOLD'
  assert page.locator('#b-title').inner_text()=='No local file witnessed'
  assert page.evaluate('document.querySelectorAll("audio, iframe").length')==0
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')

  # Browser refuses a corrupted claim that still carries the original signature.
  forged=json.loads(raw)
  forged['claims'][0]['body']['subject']['title']='Forged title'
  page.locator('#bundle').set_input_files({'name':'forged.json','mimeType':'application/json','buffer':json.dumps(forged).encode()})
  page.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('HOLD:')")
  assert page.locator('.claim').count()==0
  assert 'Unverified' in page.locator('#a-title').inner_text()
  assert not errors,errors
  assert not foreign,foreign
  print(json.dumps({'schema':'webz/name-orchard-001-browser-witness/v1',
   'real_ed25519_browser_verification':True,'signed_records':6,
   'collision_unresolved':True,'metadata_only_receipt':True,
   'tamper_hold':True,'mobile_390_no_horizontal_overflow':True,
   'no_automatic_external_requests':True,'page_errors':errors},indent=2))
  browser.close()
finally:server.shutdown()
