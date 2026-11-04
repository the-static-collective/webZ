"""Field proof: a completed Jubilee kit can be carried to First Circle without a service."""
import pathlib,json,threading
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
  ctx=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True,service_workers='block')
  page=ctx.new_page();outgoing=[];errors=[]
  page.on('request',lambda r:outgoing.append(r.url))
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'jubilee/')
  page.locator('[data-jubilee-role="food"]').click()
  assert 'INGREDIENTS:' in page.locator('#jubilee-moment-next').inner_text()
  with page.expect_download() as d:
   page.locator('#jubilee-carry').click()
  payload=json.loads(pathlib.Path(d.value.path()).read_text())
  assert payload['payload']['schema']=='abundent/first-circle-card/v1'
  assert payload['payload']['work']['status']=='BOUNDED_GUIDE'
  assert 'METHOD:' in payload['payload']['work']['body']
  assert payload['payload']['returns']==[]
  assert page.locator('#jubilee-carried-door').is_visible()
  second=ctx.new_page()
  second.on('request',lambda r:outgoing.append(r.url))
  second.on('pageerror',lambda e:errors.append(str(e)))
  second.goto(base+'first-circle/')
  second.locator('#import').set_input_files({'name':'kit.json','mimeType':'application/json','buffer':json.dumps(payload).encode('utf8')})
  second.locator('#work-section').wait_for(state='visible')
  assert 'INGREDIENTS:' in second.locator('#work-body').inner_text()
  second.locator('[data-outcome="not-yet"]').click()
  second.locator('#return-note').fill('This was only a kitchen rehearsal, not a public service.')
  second.locator('#return-form button[type=submit]').click()
  assert 'self-reported' in second.locator('#returns').inner_text().lower()
  assert second.locator('#method-zone').is_hidden()
  assert not errors,errors
  assert all(url.startswith(base) for url in outgoing),outgoing
  print(json.dumps({'schema':'webz/jubilee-first-circle-handoff/v0','mobile':True,'kit_body_carried':True,'no_account':True,'no_network':True,'return_unverified':True,'page_errors':errors}))
  browser.close()
finally:
 server.shutdown()
