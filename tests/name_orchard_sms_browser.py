"""Mobile Chromium: signed Name Orchard claim through segmented SMS text without sending any SMS."""
import json,pathlib,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kwargs):super().__init__(*a,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass
raw=subprocess.run(['node','scripts/name-orchard-001.mjs','demo'],
 cwd=ROOT,capture_output=True,text=True,check=True).stdout
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];external=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:external.append(r.url) if not r.url.startswith(base.split('/nested/webZ/')[0]) else None)
  page.goto(base+'worlds/name-orchard/sms.html')
  assert 'No signed SMS segments prepared' in page.locator('#send-status').inner_text()
  page.locator('#witness').set_input_files({'name':'witness.json','mimeType':'application/json','buffer':raw.encode()})
  page.wait_for_function("()=>document.querySelector('#send-status').textContent.includes('individually copyable')")
  parts=page.locator('.sms-part code').all_inner_texts()
  assert len(parts)>1 and len(parts)<=24
  assert all(len(segment)<=140 and segment.startswith('NO2-') for segment in parts)
  assert page.locator('.sms-part a[href^="sms:"]').count()==len(parts)
  # A message is deliberately absent, so the receiver HOLDS with missing part index.
  page.locator('#inbox').fill('\n'.join(parts[1:]))
  page.locator('#inspect').click()
  page.wait_for_function("()=>document.querySelector('#receive-status').textContent.includes('Missing 1')")
  assert page.locator('#received-claim').inner_text()==''
  # A full out-of-order arrival may contain exact repeats.
  page.locator('#inbox').fill('\n'.join(list(reversed(parts))+[parts[0]]))
  page.locator('#inspect').click()
  page.wait_for_function("()=>document.querySelector('#receive-status').textContent.startsWith('Verified signed claim')")
  assert 'Let It Find Us' in page.locator('#received-claim').inner_text()
  assert 'not the sender phone number' in page.locator('#received-claim').inner_text()
  # A single malicious changed payload must fail closed without hanging onto old verification.
  tampered=parts[:]
  tampered[0]=tampered[0][:-1]+('X' if tampered[0][-1]!='X' else 'Y')
  page.locator('#inbox').fill('\n'.join(tampered))
  page.locator('#inspect').click()
  page.wait_for_function("()=>document.querySelector('#receive-status').textContent.startsWith('HOLD:')")
  assert page.locator('#received-claim').inner_text()==''
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  assert page.evaluate('document.querySelectorAll("audio,iframe").length')==0
  assert not errors,errors
  assert not external,external
  print(json.dumps({'schema':'webz/name-orchard-002-browser-witness/v1',
   'mobile_width':390,'segments':len(parts),'verified_claim':True,
   'missing_part_hold':True,'reorder_and_duplicate':True,'tamper_hold':True,
   'sms_send_attempts':0,'external_requests':external,'page_errors':errors},indent=2))
  browser.close()
finally: server.shutdown()
