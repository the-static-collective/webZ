"""Seed 004: a third browser reconstructs after source A closes; B persists HOLD.
This tests local file handoff, not a live multi-hop network or physical devices.
"""
import json,pathlib,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
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
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/post-office/seed-lab/courier/'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  network=[];errors=[]
  opts=dict(accept_downloads=True)
  a=browser.new_context(viewport={'width':390,'height':820},**opts)
  b=browser.new_context(viewport={'width':390,'height':820},**opts)
  c=browser.new_context(viewport={'width':390,'height':820},**opts)
  for cx in (a,b,c):cx.on('request',lambda req:network.append(req.url))
  origin=a.new_page();courier=b.new_page();destination=c.new_page()
  for page in (origin,courier,destination):page.on('pageerror',lambda e:errors.append(str(e)))
  origin.goto(base+'?station=A')
  courier.goto(base+'?station=B')
  destination.goto(base+'?station=C')
  assert origin.locator('#station-A').is_visible()
  assert courier.locator('#station-B').is_visible()
  assert destination.locator('#station-C').is_visible()
  assert origin.locator('#source-export').is_disabled()
  assert courier.locator('#save-hold').is_disabled()
  assert destination.locator('#accept-c').is_disabled()
  origin.locator('#create-a').click()
  origin.wait_for_function("()=>document.querySelector('#status').textContent.includes('ORIGIN A')")
  with origin.expect_download() as d:origin.locator('#source-export').click()
  parcel_a=pathlib.Path(d.value.path()).read_bytes()
  oa=json.loads(parcel_a)
  assert oa['journey']['hops'][0]['action']=='ISSUE'
  # A is genuinely gone before B relays the letter.
  origin.close();a.close()
  courier.locator('#import-b').set_input_files({'name':'seed-A.json','mimeType':'application/json','buffer':parcel_a})
  courier.wait_for_function("()=>document.querySelector('#status').textContent.includes('CONSENT TO HOLD')")
  assert courier.locator('#save-hold').is_disabled()
  courier.locator('#hold-consent').check()
  courier.locator('#save-hold').click()
  courier.wait_for_function("()=>document.querySelector('#status').textContent.includes('B HELD')")
  assert courier.locator('#forward-export').is_disabled()
  # Browser reload is not a transport effect. The intentionally saved HOLD survives.
  courier.reload()
  assert courier.locator('#forward-export').is_disabled()
  courier.locator('#restore').click()
  courier.wait_for_function("()=>document.querySelector('#status').textContent.includes('REOPENED LOCAL HOLD')")
  assert courier.locator('#journey').inner_text().startswith(oa['journey']['id'])
  courier.locator('#forward-consent').check()
  with courier.expect_download() as d:courier.locator('#forward-export').click()
  parcel_b=pathlib.Path(d.value.path()).read_bytes()
  ob=json.loads(parcel_b)
  assert ob['seed']==oa['seed']
  assert len(ob['journey']['hops'])==2
  assert ob['journey']['hops'][1]['station']=='B'
  # The last receiver has no access to A or the B sender at reconstruction time.
  courier.close();b.close()
  c.set_offline(True)
  destination.locator('#import-c').set_input_files({'name':'seed-B.json','mimeType':'application/json','buffer':parcel_b})
  destination.wait_for_function("()=>document.querySelector('#status').textContent.includes('RECEIVE CONSENT REQUIRED')")
  assert destination.locator('#export-page').is_disabled()
  destination.locator('#receive-consent').check()
  destination.locator('#accept-c').click()
  destination.wait_for_function("()=>document.querySelector('#status').textContent.includes('C RECEIVED')")
  with destination.expect_download() as d:destination.locator('#export-page').click()
  html=pathlib.Path(d.value.path()).read_text(encoding='utf8')
  assert 'We play where we arrive' in html
  assert '<script' not in html and '<iframe' not in html
  with destination.expect_download() as d:destination.locator('#export-receipt').click()
  receipt=json.loads(pathlib.Path(d.value.path()).read_text())
  assert receipt['journey']==oa['journey']['id']
  assert receipt['seedDigest']==oa['seed']['digest']
  assert receipt['authority']=='unsigned-device-observation'
  offline=c.new_page();offline.set_content(html)
  assert 'A letter before the letters' in offline.locator('h1').inner_text()
  assert offline.locator('main').get_by_text('We play where we arrive.').count()==1
  # A/ B never needed to come back, C's source files were local.
  assert len(errors)==0,errors
  assert all(urlparse(url).netloc==urlparse(base).netloc for url in network),network
  assert destination.evaluate('localStorage.length+sessionStorage.length')==0
  assert destination.evaluate('document.documentElement.scrollWidth<=innerWidth')
  c.close();browser.close()
 print(json.dumps({'schema':'abundent/wandering-letter-browser/v0','stations':3,
 'A_disconnected_before_B_forward':True,'B_local_HOLD_survives_reload':True,
 'B_disconnected_before_C_receive':True,'C_offline_at_receive':True,
 'C_grew_offline_html':True,'unsigned_receipt':True,'no_third_party_http':True},indent=2))
finally:
 server.shutdown();server.server_close()
