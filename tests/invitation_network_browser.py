"""Chromium phone test of invitation creation, public discussion, notifications and dual-key matching.
Remote backend is intercepted; the test never writes public production data.
"""
import json, pathlib, threading, datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
THREAD='11111111-1111-4111-8111-111111111111'
POST='22222222-2222-4222-8222-222222222222'
MATCH='33333333-3333-4333-8333-333333333333'
OWNER='A'*43
REPLY='B'*43
WATCH='C'*43
created='2026-11-04T12:00:00Z'
expires='2026-12-04T12:00:00Z'
posts=[];matches=[];events=[];calls=[]
published=None
def backend(route):
 global published,posts,matches,events
 req=route.request
 headers={'access-control-allow-origin':'*','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','content-type':'application/json','cache-control':'no-store'}
 if req.method=='OPTIONS':route.fulfill(status=204,headers=headers,body='');return
 b=req.post_data_json;action=b.get('action');calls.append(action)
 if action=='publish':
  published={'id':THREAD,'invitationId':b['invitationId'],'words':b['words'],'lane':b['lane'],'timing':b['timing'],'intent':b['intent'],'state':'PUBLIC','createdAt':created,'expiresAt':expires}
  data={'schema':'abundent/invitation-thread-v1','thread':published,'ownerKey':OWNER}
 elif action=='read':
  data={'schema':'abundent/invitation-conversation-v1','thread':published,'posts':posts,'matches':matches}
 elif action=='watch':
  data={'watchKey':WATCH,'threadId':THREAD,'expiresAt':expires}
 elif action=='poll':
  data={'events':events if b['after']==0 else [],'nextCursor':1 if events else 0}
 elif action=='reply':
  posts.append({'id':POST,'kind':b['kind'],'words':b['words'],'createdAt':created})
  data={'post':posts[-1],'replyKey':REPLY}
  events=[{'seq':1,'kind':'REPLY','summary':'A new public response was posted.','at':created}]
 elif action=='propose-match':
  matches[:]=[{'id':MATCH,'postId':POST,'state':'PROPOSED','ownerAgreed':False,'responderAgreed':False}]
  data={'match':matches[0],'notice':'Proposed pending two receipts.'}
 elif action=='confirm-match':
  m=matches[0]
  if b['key']==OWNER:m['ownerAgreed']=True
  elif b['key']==REPLY:m['responderAgreed']=True
  if m['ownerAgreed'] and m['responderAgreed']:m['state']='MUTUALLY_ACKNOWLEDGED'
  data={'schema':'abundent/invitation-match-receipt-v1','match':m,'notice':'Two distinct keys have acknowledged the possibility.'}
 elif action=='unwatch':
  data={'state':'UNSUBSCRIBED','deleted':True,'notice':'Watch removed.'}
 elif action=='lookup':
  data={'schema':'abundent/invitation-publication-lookup/v1','published':bool(published and published['invitationId']==b['invitationId']),'threadId':THREAD if published else None}
 elif action=='discover':
  data={'candidates':[published] if published and (b['lane']=='any' or b['lane']==published['lane']) and b['intent']=='open' else []}
 elif action=='withdraw':
  data={'state':'WITHDRAWN','notice':'Hidden from the public service.'}
 elif action=='report':
  data={'state':'REPORTED','notice':'Report recorded.'}
 else:
  route.fulfill(status=400,headers=headers,body=json.dumps({'error':'UNEXPECTED_TEST_ACTION'}));return
 route.fulfill(status=200,headers=headers,body=json.dumps(data))
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];external=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.route('**/functions/v1/invitation-network-002',backend)
  page.on('request',lambda r:external.append(r.url) if r.url.startswith('http') and not r.url.startswith(base) and 'invitation-network-002' not in r.url else None)
  page.goto(base+'invites/')
  assert page.locator('#create-panel').is_visible()
  page.locator('#invite-words').fill('I can offer an acoustic guitar song right now.')
  page.locator('#create-invite').click()
  assert page.locator('#invitation-panel').is_visible()
  assert page.locator('#network-publish').is_visible()
  assert 'not a public post' in page.locator('#create-panel').text_content()
  original_url=page.url
  page.locator('#network-publish').click()
  try:
   expect(page.locator('#publish-panel')).to_be_visible(timeout=7000)
  except Exception:
   raise AssertionError({'url':page.url,'status':page.locator('#network-status').inner_text(),'errors':errors})
  assert 'acoustic guitar' in page.locator('#publish-words').inner_text()
  assert page.locator('#thread-panel').is_hidden()
  page.locator('#publish-consent').check()
  page.locator('#publish-button').click()
  expect(page.locator('#thread-panel')).to_be_visible(timeout=7000)
  expect(page.locator('#published-confirmation')).to_be_visible()
  expect(page.locator('#published-confirmation')).to_contain_text('People can find it')
  assert page.locator('#published-find').get_attribute('href')
  assert page.locator('#published-link').input_value().endswith('?thread='+THREAD)
  expect(page.locator('#receipt-preview')).to_contain_text('THREAD OWNER KEY')
  # A second visitor can see the newly published item through discovery.
  public_board=browser.new_page(viewport={'width':390,'height':844})
  public_board.route('**/functions/v1/invitation-network-002',backend)
  public_board.goto(page.locator('#published-find').get_attribute('href'))
  expect(public_board.locator('#browse-panel')).to_be_visible()
  expect(public_board.locator('#browse-results article')).to_have_count(1,timeout=7000)
  expect(public_board.locator('#browse-results')).to_contain_text('acoustic guitar song')
  expect(public_board.locator('.highlight-post')).to_have_count(1)
  # The original portable invitation now resolves to its real public conversation.
  old_link=browser.new_page(viewport={'width':390,'height':844})
  old_link.route('**/functions/v1/invitation-network-002',backend)
  old_link.goto(original_url)
  old_link.locator('#network-publish').click()
  expect(old_link.locator('#thread-panel')).to_be_visible(timeout=7000)
  expect(old_link.locator('#published-confirmation')).to_contain_text('Already posted')
  assert calls.count('publish')==1
  old_link.close();public_board.close()
  # The public desk works from a fresh visit too—no circular return to the first tool.
  direct=browser.new_page(viewport={'width':390,'height':844})
  direct.route('**/functions/v1/invitation-network-002',backend)
  direct.goto(base+'invites/network/')
  expect(direct.locator('#quick-post-panel')).to_be_visible()
  direct.locator('#quick-words').fill('I can repair a guitar today, if someone needs it.')
  assert direct.locator('[data-quick-when="now"]').get_attribute('aria-pressed')=='true'
  direct.locator('#quick-next').click()
  expect(direct.locator('#publish-panel')).to_be_visible()
  expect(direct.locator('#publish-words')).to_contain_text('repair a guitar')
  assert direct.locator('#publish-consent').is_checked() is False
  assert calls.count('publish')==1
  direct.close()
  assert page.url.endswith('?thread='+THREAD),page.url
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#watch-start').click()
  expect(page.locator('#receipt-preview')).to_contain_text('WATCH NOTIFICATION KEY')
  expect(page.locator('#watch-key')).to_have_value(WATCH)
  page.locator('#reply-kind').select_option('need')
  page.locator('#reply-words').fill('I need one acoustic set for a neighborhood supper this week.')
  page.locator('#reply-consent').check()
  page.locator('#reply-send').click()
  expect(page.locator('#reply-status')).to_contain_text('PUBLIC REPLY RECEIVED')
  expect(page.locator('#thread-posts article')).to_have_count(1)
  expect(page.locator('#receipt-preview')).to_contain_text('PUBLIC RESPONSE KEY')
  page.locator('#thread-posts button').click()
  expect(page.locator('#matching-panel')).to_be_visible()
  page.locator('#match-key').fill(OWNER)
  page.locator('#match-propose').click()
  expect(page.locator('#match-id')).to_have_value(MATCH)
  page.locator('#match-confirm').click()
  expect(page.locator('#match-status')).to_contain_text('PROPOSED')
  page.locator('#match-key').fill(REPLY)
  page.locator('#match-confirm').click()
  expect(page.locator('#match-status')).to_contain_text('MUTUALLY_ACKNOWLEDGED')
  expect(page.locator('#thread-posts')).to_contain_text('MUTUALLY_ACKNOWLEDGED')
  page.locator('#watch-stop').click()
  expect(page.locator('#watch-key')).to_have_value('')
  assert page.evaluate('localStorage.length')==0
  assert 'unwatch' in calls and 'poll' in calls and 'confirm-match' in calls
  assert not errors,errors
  assert not external,external
  browser.close()
 print(json.dumps({'schema':'abundent/invitation-network-browser/v1','viewport':'390x844','published_thread':True,'reply_persisted_mock':True,'watch_and_unwatch':True,'dual_match_acknowledged':True,'external_unmocked_requests':len(external),'errors':errors},indent=2))
finally:
 server.shutdown()
