"""Chromium mobile witness for role-first Jubilee invitation drafting."""
import pathlib, threading, json
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
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
  page.goto(base+'jubilee/')
  assert page.locator('#jubilee-first-title').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('#role').input_value()==''
  assert not page.locator('#public-only').is_checked()
  page.locator('[data-jubilee-role="food"]').click()
  assert page.locator('#role').input_value()=='food'
  assert page.locator('[data-jubilee-role="food"]').get_attribute('aria-pressed')=='true'
  assert page.locator('#jubilee-moment').is_visible()
  assert 'pot of soup' in page.locator('#jubilee-moment-line').inner_text()
  assert page.locator('#email-draft').get_attribute('href') is None
  assert page.locator('#public-only').is_checked() is False
  page.locator('#jubilee-quick-text').fill('We could bring a pot of soup to a neighborhood supper.')
  page.locator('#jubilee-quick-next').click()
  assert page.locator('#offer').input_value()=='We could bring a pot of soup to a neighborhood supper.'
  assert page.locator('#jubilee-moment-line').inner_text()=='We could bring a pot of soup to a neighborhood supper.'
  assert not page.locator('#public-only').is_checked()
  assert page.locator('#email-draft').get_attribute('href') is None
  page.locator('#invitation-form button[type="submit"]').click()
  assert page.locator('#prepared').input_value()==''
  page.locator('#public-only').check()
  page.locator('#invitation-form button[type="submit"]').click()
  prepared=page.locator('#prepared').input_value()
  assert 'DRAFT INVITATION' in prepared
  assert 'Share food or kitchen skills' in prepared
  assert 'No partner, event, song license, resource transfer or service has been confirmed.' in prepared
  assert page.locator('#email-draft').get_attribute('href').startswith('mailto:')
  page.locator('#offer').fill('I can prepare a different public supper idea for a rehearsal.')
  assert page.locator('#email-draft').get_attribute('href') is None
  assert page.evaluate('localStorage.length')==0
  assert all(url.startswith(base) for url in requests),requests
  assert not errors,errors
  browser.close()
 print(json.dumps({'schema':'jubilee/human-first-browser/v0','mobile':'390x844','one_tap_role':True,'one_sentence_intent':True,'consent_auto_selected':False,'auto_sent':False,'errors':errors},indent=2))
finally:
 server.shutdown()
