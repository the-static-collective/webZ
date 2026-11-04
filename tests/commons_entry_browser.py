"""Chromium witness for HUMAN FIRST 002 at Porchlight Commons (no network submission)."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
  page=context.new_page();errors=[];requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:requests.append(r.url))
  page.goto(base+'commons/')
  assert page.locator('#play-title').is_visible()
  assert page.locator('#entry-question').is_hidden()
  page.locator('[data-play-action="deliver"]').click()
  assert page.locator('#play-outcome').is_visible()
  assert 'Not yet' in page.locator('#play-outcome-title').inner_text()
  assert 'Before anything is moved' in page.locator('#play-script').inner_text()
  page.locator('[data-play-action="ask"]').click()
  assert 'right door' in page.locator('#play-outcome-title').inner_text()
  assert 'I heard there might be extra produce' in page.locator('#play-script').inner_text()
  page.locator('#play-again').click()
  assert page.locator('#play-outcome').is_hidden()
  page.locator('.optional-intake > summary').click()
  assert page.locator('#entry-question').is_visible()
  assert not page.locator('#need-details').evaluate('(e)=>e.open')
  assert page.locator('#need-quick').is_hidden()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  # One-click, fully fictitious local draft. No claim a real partner participated.
  page.locator('#quick-fictional').click()
  assert page.locator('#need-details').evaluate('(e)=>e.open')
  result=json.loads(page.locator('#result').inner_text())
  assert result['dispatch']=='DISABLED'
  assert result['need']['status']=='HOLD'
  assert result['need']['source_kind']=='UNVERIFIED_OPERATOR_DRAFT'
  assert result['need']['origin_region'].startswith('Fictional')
  assert result['handoff']['recipient_confirmation']=='NOT_RECEIVED'
  assert result['possible_routes']['lowestStatedEligible'] is None
  assert 'FICTIONAL EXAMPLE ONLY' in page.locator('#quick-status').inner_text()
  page.locator('#clear').click()
  assert 'No draft created' in page.locator('#result').inner_text()
  # Actual person's one-sentence start cannot pretend the mandatory details exist.
  page.locator('#begin-need').click()
  assert page.locator('#need-quick').is_visible()
  page.locator('#quick-summary').fill('A public community pantry could use a handcart.')
  page.locator('#quick-continue').click()
  assert 'Tap the kind' in page.locator('#quick-status').inner_text()
  page.locator('[data-quick-kind="tools"]').click()
  page.locator('#quick-continue').click()
  assert page.locator('#need-details').evaluate('(e)=>e.open')
  assert page.locator('[name="summary"]').input_value()=='A public community pantry could use a handcart.'
  assert page.locator('[name="category"]').input_value()=='tools'
  assert page.locator('[name="region"]').input_value()==''
  assert page.locator('[name="quantity"]').input_value()==''
  page.locator('[name="region"]').fill('Southern Minnesota / exploratory')
  page.locator('[name="quantity"]').fill('1')
  page.locator('[name="unit"]').select_option('items')
  page.locator('#exchange-form button[type=submit]').click()
  result=json.loads(page.locator('#result').inner_text())
  assert result['need']['requirement']['summary']=='A public community pantry could use a handcart.'
  assert result['need']['local_operator_authorized'] is False
  assert result['dispatch']=='DISABLED'
  assert page.evaluate('localStorage.length')==0
  assert all(url.startswith(base) for url in requests),requests
  assert not errors,errors
  browser.close()
 print(json.dumps({'schema':'commons/human-first-browser/v0','viewport':'390x844','fictional_one_tap':True,'real_requires_details':True,'storage_writes':0,'external_requests':0,'errors':errors},indent=2))
finally:
 server.shutdown()
