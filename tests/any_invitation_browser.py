"""Phone-sized no-account witness for INVITATION CHAIN 001."""
import json, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/invites/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,permissions=['clipboard-read','clipboard-write'])
  page=context.new_page();errors=[];external=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:external.append(r.url) if not r.url.startswith(base) else None)
  page.goto(base)
  assert page.locator('#create-panel').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#invite-words').fill('I can play guitar for twenty minutes right now.')
  assert page.locator('[data-when="now"]').get_attribute('aria-pressed')=='true'
  page.locator('#create-invite').click()
  assert page.locator('#invitation-panel').is_visible()
  assert 'AVAILABLE NOW' in page.locator('#invite-when').inner_text()
  assert 'guitar' in page.locator('#invite-message').inner_text()
  invitation_url=page.locator('#invitation-link').input_value()
  assert invitation_url.startswith(base+'#i=')
  # Recipient opens invitation, not a forced intake.
  recipient=context.new_page()
  recipient.on('pageerror',lambda e:errors.append(str(e)))
  recipient.on('request',lambda r:external.append(r.url) if not r.url.startswith(base) else None)
  recipient.goto(invitation_url)
  assert recipient.locator('#invitation-panel').is_visible()
  assert recipient.locator('#create-panel').is_hidden()
  assert recipient.locator('#invite-actions button').count()==6
  recipient.locator('[data-action="act"]').click()
  assert recipient.locator('#action-tool a').is_visible()
  assert recipient.locator('#action-tool a').get_attribute('href')=='../jubilee/live/'
  recipient.locator('#response-words').fill('I can record an acoustic take right now, pending permission.')
  recipient.locator('#make-response').click()
  assert recipient.locator('#response-result').is_visible()
  assert 'NOT been delivered' in recipient.locator('#action-status').inner_text()
  assert 'RESPONSE TO INVITATION' in recipient.locator('#response-preview').inner_text()
  # No wrong answers: inquiry and refusal are also complete pathways.
  recipient.locator('[data-action="question"]').click()
  assert recipient.locator('#response-compose').is_visible()
  recipient.locator('[data-action="decline"]').click()
  assert recipient.locator('#action-panel').is_visible()
  assert 'owe nothing' in recipient.locator('#action-intro').inner_text()
  recipient.locator('[data-action="fork"]').click()
  recipient.locator('#fork-words').fill('I can design a cover for the recording next week.')
  recipient.locator('[data-fork-when="soon"]').click()
  recipient.locator('#make-fork').click()
  assert 'branch' in recipient.locator('#invite-chain').inner_text().lower()
  assert 'cover' in recipient.locator('#invite-message').inner_text()
  assert recipient.locator('#invite-when').inner_text().startswith('AVAILABLE SOON')
  assert recipient.locator('#invitation-link').input_value()!=invitation_url
  recipient.locator('#new-invite').click()
  assert recipient.locator('#create-panel').is_visible()
  assert recipient.locator('#invitation-panel').is_hidden()
  assert recipient.evaluate('localStorage.length')==0
  assert page.evaluate('localStorage.length')==0
  assert not external,external
  assert not errors,errors
  browser.close()
 print(json.dumps({'schema':'abundent.any-invitation-browser/v1','mobile':'390x844','public_link_opened':True,'now_first_tool':True,'response_not_delivered':True,'fork_preserved':True,'external_requests':0,'errors':errors},indent=2))
finally:
 server.shutdown()
