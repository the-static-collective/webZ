"""Smoke-test the real browser artifact. Remote private receiver is mocked; no submissions."""
import json, pathlib, threading, time, shutil
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/jubilee/live/'
requests=[];errors=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
  context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True,permissions=['microphone','camera'])
  page=context.new_page();page.on('pageerror',lambda x: errors.append(str(x)))
  def route(request):
   body=request.request.post_data_json
   requests.append(body)
   origin=request.request.headers.get('origin','')
   if body['action']=='submit':d={'state':'PENDING','receiptId':'123e4567-e89b-42d3-a456-426614174000','receiptKey':'A'*43,'expiresAt':'2026-12-04T01:00:00.000Z'}
   elif body['action']=='status':d={'state':'REPLY_AVAILABLE','reply':'A steward reviewed the music offer. They have not accepted a booking.'}
   else:d={'state':'WITHDRAWN'}
   request.fulfill(status=201 if body['action']=='submit' else 200,content_type='application/json',body=json.dumps(d),headers={'access-control-allow-origin':origin,'content-type':'application/json','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type'})
  page.route('https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/porch-receiver-009',route)
  page.goto(base)
  assert 'What can happen' in page.locator('h1').inner_text()
  assert 'guitar' in page.locator('#offer-text').input_value()
  assert page.locator('#interpretation').is_visible()
  assert page.locator('#action-deck button').count() >= 6
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(ROOT/'preview-mobile.png'),full_page=True)
  # Active mode detects now, suggests direct recording.
  page.locator('[data-sample="I can play guitar for 20 minutes right now"]').click()
  assert 'now.' in page.locator('#interpretation').inner_text()
  assert page.locator('#action-deck button').first.get_attribute('data-action')=='record-audio'
  # Action creates an actual PNG.
  page.locator('[data-action="art"]').click()
  page.locator('#card-title').fill('A Test Guitar Session')
  page.locator('#card-render').click()
  page.locator('#card-download').wait_for(state='visible')
  with page.expect_download() as ev:page.locator('#card-download').click()
  d=ev.value;f=ROOT/'test-card.png';d.save_as(str(f));assert f.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
  # Generate actual manifest, no fake upload.
  page.locator('#next-actions button').filter(has_text='Catalog').click()
  page.locator('#catalog-make').click()
  with page.expect_download() as ev:page.locator('#catalog-download').click()
  f=ROOT/'test-catalog.json';ev.value.save_as(str(f));v=json.loads(f.read_text());assert v['status']=='LOCAL_DRAFT_NOT_PUBLISHED' and not v['received_by_human']
  # Record microphone (fake hardware) and produce a media blob.
  page.locator('[data-action="record-audio"]').click()
  page.locator('#record-start').click()
  page.locator('#record-stop').wait_for(state='enabled',timeout=10000)
  page.wait_for_timeout(1600)
  page.locator('#record-stop').click()
  page.locator('#record-download').wait_for(state='visible',timeout=15000)
  with page.expect_download() as ev:page.locator('#record-download').click()
  f=ROOT/'test-take.webm';ev.value.save_as(str(f));assert f.stat().st_size>100
  # No private call before deliberate consent.
  assert len(requests)==0
  page.locator('[data-action="private-offer"]').click()
  assert page.locator('#review-consent').is_checked() is False
  page.locator('#review-submit').click()
  assert len(requests)==0
  page.locator('#review-consent').check()
  page.locator('#review-submit').click()
  page.locator('#receipt-panel').wait_for(state='visible',timeout=10000)
  assert requests[0]['action']=='submit' and requests[0]['consent'] is True
  assert requests[0]['kind']=='offer' and 'guitar' in requests[0]['particular']
  assert page.locator('#receipt-id').input_value().startswith('123e')
  page.locator('#receipt-check').click()
  assert 'reviewed' in page.locator('#receipt-reply').inner_text()
  assert len(requests)==2 and requests[-1]['action']=='status'
  # No raw offer text saved in localStorage.
  assert page.evaluate('localStorage.length')==0
  assert errors==[],errors
  browser.close()
 print(json.dumps({'browser':'Chromium','mobile':'390x844','real_media_created':True,'png_created':True,'json_created':True,'submit_only_after_consent':True,'remote_receiver_mocked':True,'errors':errors,'requests':len(requests)},indent=2))
finally:
 server.shutdown()
