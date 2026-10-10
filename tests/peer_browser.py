"""POST-OFFICE-PEER-003: two isolated browser profiles exchange one verified seed via WebRTC.
Manual SDP signaling is copied by the test harness; no websocket/signaling relay.
The fixture uses host ICE candidates only (STUN unchecked). No email addresses.
"""
import json, pathlib, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/post-office/seed-lab/peer/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  a=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
  b=browser.new_context(viewport={'width':1440,'height':960},accept_downloads=True)
  requests=[];errors=[]
  for ctx in (a,b):ctx.on('request',lambda req:requests.append(req.url))
  sender=a.new_page();receiver=b.new_page()
  for page in (sender,receiver):page.on('pageerror',lambda e:errors.append(str(e)))
  sender.goto(base);receiver.goto(base)
  assert sender.get_by_role('heading',name='Give a letter another home.').is_visible()
  assert receiver.locator('#peer-state').inner_text()=='NOT CONNECTED'
  assert sender.locator('#send').is_disabled()
  assert receiver.locator('#accept').is_disabled()
  assert not sender.locator('#stun').is_checked()
  # Explicit initial seed choice, no automatic first-party seed download on open.
  assert all('/seed-000.json' not in url for url in requests)
  sender.locator('#load').click()
  sender.wait_for_function("()=>document.querySelector('#status').textContent.includes('PUBLIC LETTER 000 VERIFIED')")
  sender.locator('#offer').click()
  sender.wait_for_function("()=>document.querySelector('#signal-out').value.includes('manual-webrtc-signal')",timeout=25000)
  offer=sender.locator('#signal-out').input_value()
  o=json.loads(offer)
  assert o['kind']=='offer'
  assert o['digest'].startswith('sha256:')
  receiver.locator('#signal-in').fill(offer)
  # Receiver can refuse pairing by withholding consent.
  receiver.locator('#answer').click()
  assert 'RECEIVE_CONSENT_REQUIRED' in receiver.locator('#status').inner_text()
  receiver.locator('#receive-consent').check()
  receiver.locator('#answer').click()
  receiver.wait_for_function("()=>document.querySelector('#signal-out').value.includes('manual-webrtc-signal')",timeout=25000)
  answer=receiver.locator('#signal-out').input_value()
  assert json.loads(answer)['kind']=='answer'
  sender.locator('#signal-in').fill(answer)
  sender.locator('#complete').click()
  sender.wait_for_function("()=>document.querySelector('#pairing').textContent.length===12",timeout=25000)
  receiver.wait_for_function("()=>document.querySelector('#pairing').textContent.length===12",timeout=25000)
  code=sender.locator('#pairing').inner_text()
  assert code==receiver.locator('#pairing').inner_text()
  # Host-only WebRTC in isolated browser contexts can connect without a public STUN server.
  sender.wait_for_function("()=>document.querySelector('#peer-state').textContent==='CONNECTED'",timeout=25000)
  receiver.wait_for_function("()=>document.querySelector('#peer-state').textContent==='CONNECTED'",timeout=25000)
  # Both content transfer choices still require explicit approval.
  sender.locator('#send').click()
  assert 'SEND_AND_CODE_CONSENT_REQUIRED' in sender.locator('#status').inner_text()
  receiver.locator('#accept').click()
  assert 'PAIRING_CODE_CONFIRMATION_REQUIRED' in receiver.locator('#status').inner_text()
  receiver.locator('#compare').check();receiver.locator('#accept').click()
  sender.locator('#compare').check();sender.locator('#send-consent').check();sender.locator('#send').click()
  receiver.wait_for_function("()=>document.querySelector('#status').textContent.includes('RECEIVED AND VERIFIED')",timeout=12000)
  sender.wait_for_function("()=>document.querySelector('#status').textContent.includes('PEER ACKNOWLEDGED')",timeout=12000)
  assert receiver.locator('#received-digest').inner_text()==o['digest']
  assert receiver.locator('#download').is_enabled()
  assert receiver.locator('#receipt-download').is_enabled()
  with receiver.expect_download() as d:receiver.locator('#receipt-download').click()
  rc=json.loads(pathlib.Path(d.value.path()).read_text())
  assert rc['session']==o['session'] and rc['digest']==o['digest']
  assert rc['authority']=='unsigned-local-peer-observation'
  with receiver.expect_download() as d:receiver.locator('#download').click()
  seed=json.loads(pathlib.Path(d.value.path()).read_text())
  assert seed['digest']==o['digest']
  assert seed['payload']['title']=='A letter before the letters'
  for page in (sender,receiver):
   assert page.evaluate("localStorage.length+sessionStorage.length") == 0
   assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
  assert not errors,errors
  assert all(urlparse(u).netloc==urlparse(base).netloc for u in requests),requests
  # No STUN/TURN was selected. Browser request observer only covers HTTP(S), not ICE traffic.
  sender.locator('#disconnect').click();receiver.locator('#disconnect').click()
  assert sender.locator('#send').is_disabled() and receiver.locator('#accept').is_disabled()
  a.close();b.close();browser.close()
 print(json.dumps({'schema':'abundent/manual-p2p-browser/v0','contexts':2,
  'manualSignal':True,'hostOnlyICE':True,'matchedCode':True,'explicitConsent':True,
  'verifiedDigest':o['digest'],'receiptAuthority':'unsigned-local-peer-observation',
  'noHTTPThirdPartyRequests':True,'noSubscriberStorage':True},indent=2))
finally:
 server.shutdown();server.server_close()
