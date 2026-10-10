"""Pocket Door 006: two addressed GrO rooms plus independent ROOTLINE relay.
The test does not send SMS or imply physical phone delivery. It simulates
explicit manual copying of a full bound packet, then ROOTLINE in a third context.
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
root=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  requests=[];errors=[]
  contexts=[browser.new_context(accept_downloads=True,viewport={'width':w,'height':850}) for w in [390,1440,390]]
  for ctx in contexts:ctx.on('request',lambda req:requests.append(req.url))
  a,b,c=[ctx.new_page() for ctx in contexts]
  for p in (a,b,c):p.on('pageerror',lambda e:errors.append(str(e)))
  a.goto(root+'d/MOSS-042/');b.goto(root+'d/MOSS-042/')
  c.goto(root+'post-office/rootline/?station=C')
  assert a.locator('#enter').is_enabled()
  assert a.locator('#carry-bundle').is_disabled()
  assert a.locator('#carry-html').is_disabled()
  assert 'HOLD' in a.locator('#field-status').inner_text()
  assert 'HOLD' in b.locator('#field-status').inner_text()
  # No automatic source handoff merely because a door link was visited.
  assert all('/api/' not in url for url in requests)
  a.locator('#enter').click()
  a.wait_for_function("()=>document.querySelector('#field-status').textContent.includes('GrO actor-local ENCOUNTER')")
  assert a.locator('#door-title').inner_text()=='The Moss Room'
  assert 'No' not in a.locator('#digest').inner_text()
  a.locator('#entrance').select_option('sound')
  a.wait_for_function("()=>document.querySelector('#room-title').textContent==='The broken radio'")
  assert 'not audio playback' in a.locator('#room-text').inner_text()
  # HTTP localhost must NOT pretend to be a textable public HTTPS address.
  a.locator('#carry-link').click()
  a.wait_for_function("()=>document.querySelector('#status').textContent.includes('NO_PUBLIC_HTTPS_ADDRESS')")
  with a.expect_download() as d:a.locator('#carry-html').click()
  exported=pathlib.Path(d.value.path()).read_text(encoding='utf8')
  assert 'broken radio' in exported.lower() and '<script' not in exported.lower()
  a.locator('#encouragement').fill("I'm glad you arrived. You may keep this message.")
  assert a.locator('#compose').is_disabled()
  a.locator('#share-consent').check()
  a.locator('#compose').click()
  a.wait_for_function("()=>document.querySelector('#status').textContent.includes('ROOTLINE ORIGIN LINKED')")
  assert a.locator('#carry-bundle').is_enabled()
  a.locator('#carry-bundle').click()
  a.wait_for_function("()=>document.querySelector('#manual-copy').value.includes('pocket-door-rootline-crossing')")
  bundled=a.locator('#manual-copy').input_value()
  origin=json.loads(bundled)
  assert origin['door']['body']['id']=='MOSS-042'
  assert len(origin['rootline']['additions'])==0
  assert origin['intent']=='HUMAN_VOLUNTARY_PUBLIC_NOTE_NOT_SENT'
  # A gone before B accepts, and B independently reconstructs the GrO encounter.
  a.close();contexts[0].close()
  b.locator('#bundle-paste').fill(bundled)
  b.locator('#import-paste').click()
  b.wait_for_function("()=>document.querySelector('#status').textContent.includes('PASTED DOOR + ROOTLINE VERIFIED')")
  assert 'GrO actor-local ENCOUNTER' in b.locator('#field-status').inner_text()
  assert b.locator('#rootline-message').inner_text()==origin['rootline']['origin']['message']
  assert b.locator('#digest').inner_text()==origin['door']['digest']
  with b.expect_download() as d:b.locator('#save-rootline').click()
  carried=json.loads(pathlib.Path(d.value.path()).read_text())
  assert carried==origin['rootline']
  # ROOTLINE recipient B imports a seed from an explicit local file: no contacts.
  b.goto(root+'post-office/rootline/?station=B')
  b.locator('#import-file').set_input_files({'name':'rootline.json','mimeType':'application/json',
       'buffer':json.dumps(carried).encode()})
  b.wait_for_function("()=>document.querySelector('#status').textContent.includes('LOCAL FILE VERIFIED')")
  b.locator('#keep').click()
  assert 'NO MESSAGE SENT' in b.locator('#status').inner_text()
  b.locator('#grow-note').fill('The radio still comes through sometimes.')
  assert b.locator('#grow').is_enabled()
  b.locator('#grow').click()
  assert 'EXPLICIT_PUBLIC_NOTE_PERMISSION_REQUIRED' in b.locator('#status').inner_text()
  b.locator('#grow-consent').check();b.locator('#grow').click()
  b.wait_for_function("()=>document.querySelector('#status').textContent.includes('YOUR ADDITION')")
  b.locator('#copy-json').click()
  b.wait_for_function("()=>document.querySelector('#outbox').value.includes('optional-encouragement')")
  after_b=b.locator('#outbox').input_value()
  assert json.loads(after_b)['origin']==origin['rootline']['origin']
  b.close();contexts[1].close()
  # C code loaded earlier; browser now disconnected. C independently verifies.
  contexts[2].set_offline(True)
  c.locator('#inbox').fill(after_b);c.locator('#import-paste').click()
  c.wait_for_function("()=>document.querySelector('#status').textContent.includes('CONTENT DIGEST VERIFIED')")
  assert c.locator('#rendered .note').count()==2
  c.locator('#keep').click()
  assert 'NO MESSAGE SENT' in c.locator('#status').inner_text()
  forged=json.loads(after_b);forged['additions'][0]['message']='forged encouragement'
  c.locator('#inbox').fill(json.dumps(forged));c.locator('#import-paste').click()
  c.wait_for_function("()=>document.querySelector('#status').textContent.includes('ROOTLINE_HOP_HASH')")
  assert c.locator('#rendered .note').count()==0
  assert all(urlparse(req).netloc==urlparse(root).netloc for req in requests),requests
  assert len(errors)==0,errors
  assert c.evaluate("localStorage.length+sessionStorage.length")==0
  assert c.evaluate("document.documentElement.scrollWidth<=innerWidth")
  c.close();contexts[2].close();browser.close()
 print(json.dumps({'schema':'abundent/pocket-door-crossing-browser/v0',
  'doors':3,'source':'GrO PR28 pinned modules','optionalRootline':True,
  'manualBundle':True,'recipientHasLocalGrOEncounter':True,
  'recipientCanKeepWithoutReply':True,'A_disconnected_before_B_receive':True,
  'B_disconnected_before_C_receive':True,'C_offline_verification':True,
  'ROOTLINE_tamper_rejected':True,'no_external_http':True},indent=2))
finally:
 server.shutdown();server.server_close()
