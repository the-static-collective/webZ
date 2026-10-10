"""ROOTLINE 005: humans A/B/C independently opt into each step.
Test-only clipboard copying; there is no SMS, provider API, or server transfer.
"""
import json,pathlib,threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
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
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/post-office/rootline/'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  requests=[];errors=[]
  contexts=[browser.new_context(viewport={'width':width,'height':810},accept_downloads=True) for width in [390,1440,390]]
  for ctx in contexts:ctx.on('request',lambda req:requests.append(req.url))
  a,b,c=[ctx.new_page() for ctx in contexts]
  for page in (a,b,c):page.on('pageerror',lambda err:errors.append(str(err)))
  a.goto(base+'?station=A');b.goto(base+'?station=B');c.goto(base+'?station=C')
  assert a.locator('#compose').is_visible()
  assert not b.locator('#compose').is_visible()
  assert c.locator('#receive').is_visible()
  assert a.locator('#download').is_disabled()
  assert not any('buttondown' in u for u in requests)
  a.locator('#initial-note').fill("On a hard day, I'm glad you are here.")
  a.locator('#plant').click()
  assert 'PUBLIC_SHARING_PERMISSION_REQUIRED' in a.locator('#status').inner_text()
  a.locator('#plant-consent').check();a.locator('#plant').click()
  a.wait_for_function("()=>document.querySelector('#status').textContent.includes('SEED CREATED')")
  assert a.locator('#rendered .note').count()==1
  a.locator('#keep').click()
  assert 'NO MESSAGE SENT' in a.locator('#status').inner_text()
  a.locator('#copy-json').click()
  a.wait_for_function("()=>document.querySelector('#outbox').value.includes('rootline-encouragement')")
  seed_a=a.locator('#outbox').input_value()
  origin=json.loads(seed_a)
  assert len(origin['additions'])==0
  # Origin A disappears before B opts into receiving.
  a.close();contexts[0].close()
  b.locator('#inbox').fill(seed_a)
  b.locator('#import-paste').click()
  b.wait_for_function("()=>document.querySelector('#status').textContent.includes('CONTENT DIGEST VERIFIED')")
  assert b.locator('#rendered .note').count()==1
  b.locator('#keep').click()
  assert 'NO MESSAGE SENT' in b.locator('#status').inner_text()
  b.locator('#grow-note').fill("It reached me. That is already enough.")
  b.locator('#grow').click()
  assert 'EXPLICIT_PUBLIC_NOTE_PERMISSION_REQUIRED' in b.locator('#status').inner_text()
  b.locator('#grow-consent').check();b.locator('#grow').click()
  b.wait_for_function("()=>document.querySelector('#status').textContent.includes('YOUR ADDITION')")
  assert b.locator('#rendered .note').count()==2
  b.locator('#copy-json').click()
  b.wait_for_function("()=>document.querySelector('#outbox').value.includes('optional-encouragement')")
  seed_b=b.locator('#outbox').input_value()
  parsed_b=json.loads(seed_b)
  assert parsed_b['origin']==origin['origin']
  assert parsed_b['additions'][0]['previous']==origin['origin']['link']
  # B disappears and C processes a deliberately pasted text parcel offline.
  b.close();contexts[1].close()
  contexts[2].set_offline(True)
  c.locator('#inbox').fill(seed_b);c.locator('#import-paste').click()
  c.wait_for_function("()=>document.querySelector('#status').textContent.includes('CONTENT DIGEST VERIFIED')")
  assert c.locator('#rendered .note').count()==2
  c.locator('#keep').click()
  assert 'NO MESSAGE SENT' in c.locator('#status').inner_text()
  c.locator('#grow-note').fill("Passing along a little warmth today.")
  c.locator('#grow-consent').check();c.locator('#grow').click()
  c.wait_for_function("()=>document.querySelector('#status').textContent.includes('YOUR ADDITION')")
  assert c.locator('#rendered .note').count()==3
  assert c.locator('#grow').is_disabled()
  c.locator('#copy-text').click()
  c.wait_for_function("()=>document.querySelector('#outbox').value.includes('KEEP') || document.querySelector('#outbox').value.includes('Keep this')")
  readable=c.locator('#outbox').input_value()
  assert 'Keep this if it helps. No need to reply or pass it on.' in readable
  assert 'ROOTLINE' in readable
  with c.expect_download() as d:c.locator('#download').click()
  end=json.loads(pathlib.Path(d.value.path()).read_text())
  assert len(end['additions'])==2
  assert end['origin']==origin['origin']
  assert end['additions'][0]==parsed_b['additions'][0]
  c.locator('#clear').click()
  assert c.locator('#rendered .note').count()==0
  assert c.locator('#download').is_disabled()
  # Re-import a tampered parcel and verify zero visible content remains.
  bad=json.loads(seed_b);bad['origin']['message']='a forged encouragement'
  c.locator('#inbox').fill(json.dumps(bad));c.locator('#import-paste').click()
  c.wait_for_function("()=>document.querySelector('#status').textContent.includes('ROOTLINE_ORIGIN_HASH')")
  assert c.locator('#rendered .note').count()==0
  assert c.locator('#download').is_disabled()
  assert len(errors)==0,errors
  assert all(urlparse(req).netloc==urlparse(base).netloc for req in requests),requests
  assert c.evaluate("localStorage.length+sessionStorage.length")==0
  assert c.evaluate("document.documentElement.scrollWidth<=innerWidth")
  c.close();contexts[2].close();browser.close()
 print(json.dumps({'schema':'abundent/rootline-human-chain-browser/v0','participants':3,
 'A_offline_before_B':True,'B_offline_before_C':True,'C_offline_during_growth':True,
 'separate_additions':2,'consent_gates':True,'keep_without_forward':True,
 'manual_text_carry':True,'tamper_rejected':True,'third_party_http':0,'saved_browser_storage':0},indent=2))
finally:
 server.shutdown();server.server_close()
