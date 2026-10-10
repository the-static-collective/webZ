"""Portable seed 002: two independent Chromium readers, manual file transfer, offline HTML."""
import hashlib,json,pathlib,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/post-office/seed-lab/'
seed_bytes=(ROOT/'post-office/seed-lab/seed-000.json').read_bytes()
try:
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(headless=True)
  c1=browser.new_context(viewport={'width':320,'height':780},accept_downloads=True)
  c2=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
  requests=[];errors=[]
  for c in [c1,c2]:
   c.on('request',lambda r:requests.append(r.url))
  first=c1.new_page();second=c2.new_page()
  for p in [first,second]:p.on('pageerror',lambda e:errors.append(str(e)))
  first.goto(base);second.goto(base+'?reader=b')
  assert first.locator('#reader-id').inner_text()=='READER A'
  assert second.locator('#reader-id').inner_text()=='READER B'
  assert first.locator('#result .seed-section').count()==0
  assert second.locator('#result .seed-section').count()==0
  first.get_by_role('button',name='Load public letter 000').click()
  first.wait_for_function("()=>document.querySelector('#status').textContent.includes('CONTENT VERIFIED')")
  # Explicit file handoff, no service or cloud transport: independent reader B
  second.locator('#source-file').set_input_files({'name':'seed-000.json','mimeType':'application/json','buffer':seed_bytes})
  second.wait_for_function("()=>document.querySelector('#status').textContent.includes('CONTENT VERIFIED')")
  assert first.locator('#result').inner_text()==second.locator('#result').inner_text()
  assert first.locator('#result .seed-section').count()==4
  for p in [first,second]:
   p.locator('#lens').evaluate("(el)=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}))}")
   p.locator('#detail').evaluate("(el)=>{el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}))}")
  assert first.locator('#result').inner_text()==second.locator('#result').inner_text()
  assert first.locator('#result .seed-section').count()==2
  first.locator('#lens').evaluate("(el)=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}))}")
  assert first.get_by_text('No authored material for this position.').count()==1
  first.locator('#lens').evaluate("(el)=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}))}")
  assert first.evaluate('document.documentElement.scrollWidth<=innerWidth')
  with first.expect_download() as dl:first.get_by_role('button',name='Grow offline page .html').click()
  generated=pathlib.Path(dl.value.path()).read_bytes()
  html=generated.decode('utf8')
  assert '<script' not in html and '<iframe' not in html and 'buttondown' not in html
  assert 'sha256:b335d30c' in html
  # Offline HTML reconstruction with zero network fetches, even without origin.
  offline=browser.new_context()
  offline.set_offline(True)
  offline_page=offline.new_page()
  offline_page.set_content(html)
  assert 'A letter before the letters' in offline_page.locator('h1').inner_text()
  assert 'We play where we arrive.' in offline_page.locator('main').inner_text()
  offline.close()
  # Mutate the file: the second reader must reject it, without rendering or persisting it.
  bad=json.loads(seed_bytes)
  bad['payload']['sections'][0]['text']='counterfeit claim'
  second.locator('#source-file').set_input_files({'name':'fake.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
  second.wait_for_function("()=>document.querySelector('#status').textContent.includes('SEED_HASH_MISMATCH')")
  assert second.locator('#result .seed-section').count()==0
  assert second.locator('#export-view').is_disabled()
  assert all('/nested/webZ/post-office/seed-lab/' in u for u in requests),requests
  assert not any('buttondown' in u for u in requests)
  assert all(p.evaluate('localStorage.length+sessionStorage.length')==0 for p in [first,second])
  assert not errors,errors
  browser.close()
 print(json.dumps({'schema':'abundent/seed-lab-chromium/v0','independentReaders':2,'equalProjection':True,'tamperRejected':True,'offlineHtml':True,'externalRequests':0,'privateStorageWrites':0,'htmlSha256':hashlib.sha256(generated).hexdigest()},indent=2))
finally:
 server.shutdown();server.server_close()
