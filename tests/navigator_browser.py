"""Real Chromium catalog witness, locally or against an explicitly supplied release URL."""
import hashlib, importlib.metadata, json, os, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
SITE=pathlib.Path(os.environ.get('WEBZ_TEST_SITE',ROOT))
OUT=ROOT/'evidence/abundent-launch-001'/os.environ.get('WEBZ_WITNESS_NAME','browser')
OUT.mkdir(parents=True,exist_ok=True)
server=None
base_url=os.environ.get('WEBZ_RELEASE_URL')
if not base_url:
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
  def do_GET(self):
   if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
   super().do_GET()
  def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 base_url=f'http://127.0.0.1:{server.server_port}/'
prefixes=[''] if os.environ.get('WEBZ_RELEASE_URL') else ['', 'nested/webZ/']
receipt=json.loads((ROOT/'field/public-field-receipt.json').read_text())
def overflow(page):assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),page.url
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,**({'proxy':{'server':os.environ['HTTPS_PROXY']}} if os.environ.get('WEBZ_RELEASE_URL') and os.environ.get('HTTPS_PROXY') else {}))
 requests=[];errors=[];violations=[];scopes=[]
 for prefix in prefixes:
  base=base_url.rstrip('/')+'/'+prefix
  context=browser.new_context(viewport={'width':320,'height':780},is_mobile=True,has_touch=True,reduced_motion='reduce')
  context.on('request',lambda r:requests.append(r.url))
  context.add_init_script("window.cspWitness=[];document.addEventListener('securitypolicyviolation',e=>window.cspWitness.push(e.violatedDirective))")
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  response=page.goto(base);assert response.status==200
  page.get_by_role('link',name='Explore with 11×11',exact=True).tap()
  page.locator('#instrument').wait_for(state='visible')
  page.wait_for_function("()=>document.querySelector('#notice').textContent.startsWith('Ready')")
  page.wait_for_function('()=>navigator.serviceWorker.controller !== null')
  assert page.locator('#results article').count()==11
  assert page.locator('#grid button').count()==121
  overflow(page)
  # Native keyboard slider controls and pad controls change real detail and set.
  page.locator('#granularity').focus();page.keyboard.press('End')
  assert page.locator('#granularity').input_value()=='10'
  assert page.locator('#results .held-door').count()>0
  assert page.locator('#results .held-door a').count()==0
  page.locator('#gesture').focus();page.keyboard.press('Home');page.keyboard.press('ArrowDown')
  assert page.locator('#tuning').input_value()=='1'
  parent=page.locator('#address').input_value();ids=page.locator('#results article').evaluate_all('(es)=>es.map(e=>e.dataset.catalogId)')
  page.keyboard.press('Enter');nested=page.locator('#address').input_value()
  assert nested.count('/')==parent.count('/')+1
  assert page.locator('#results article').evaluate_all('(es)=>es.map(e=>e.dataset.catalogId)')==ids
  page.keyboard.press('Escape');assert page.locator('#address').input_value()==parent
  page.get_by_role('button',name='Enter',exact=True).tap()
  page.locator('#tuning').focus();page.keyboard.press('End')
  page.get_by_role('heading',name='HOLD · no worlds in this position').wait_for()
  assert page.get_by_role('button',name='Enter',exact=True).is_disabled()
  page.go_back();assert page.locator('#address').input_value()==nested
  page.go_back();assert page.locator('#address').input_value()==parent
  page.go_forward();assert page.locator('#address').input_value()==nested
  # Independent cold browser can reconstruct exactly; no visitor storage needed.
  cold=browser.new_context(service_workers='block');cp=cold.new_page();cp.goto(page.url)
  cp.wait_for_function("()=>document.querySelector('#notice').textContent.startsWith('Ready')")
  assert cp.locator('#address').input_value()==nested
  assert cp.locator('#results article').evaluate_all('(es)=>es.map(e=>e.dataset.catalogId)')==ids
  cold.close()
  page.get_by_role('button',name='Root',exact=True).tap()
  # Use an independent protocol context for a genuine touch swipe; do not mix
  # Playwright taps and a second CDP input controller on the same phone page.
  swipe_context=browser.new_context(viewport={'width':320,'height':780},is_mobile=True,has_touch=True)
  swipe_page=swipe_context.new_page();swipe_page.goto(base+'field/navigate/')
  swipe_page.locator('#instrument').wait_for(state='visible')
  pad=swipe_page.locator('#gesture');pad.scroll_into_view_if_needed();box=pad.bounding_box()
  cdp=swipe_context.new_cdp_session(swipe_page)
  x=box['x']+box['width']/2;y=box['y']+box['height']/2
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+45,'y':y}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  expect(swipe_page.locator('#granularity')).to_have_value('1')
  swipe_context.close()
  # The full matrix is functional, including the endpoint pair at 10/10.
  page.get_by_text('11×11 local address grid',exact=True).click()
  assert page.locator('#grid').evaluate('(el)=>el.parentElement.open')
  if not prefix:
   for t in range(11):
    for g in range(11):
     page.locator(f'#grid button[data-t="{t}"][data-g="{g}"]').tap()
     expect(page.locator('#tuning')).to_have_value(str(t))
     expect(page.locator('#granularity')).to_have_value(str(g))
  page.get_by_role('button',name='Root',exact=True).tap()
  # Stale URL is preserved, explicitly held, and never silently replayed as current.
  stale=page.locator('#address').input_value().replace(receipt['fieldHash'][7:],'0'*64)
  page.goto(base+'field/navigate/#'+stale)
  page.wait_for_function("()=>document.querySelector('#notice').dataset.error==='true'")
  assert page.url.endswith('#'+stale);assert page.locator('#results article').count()==0
  assert page.get_by_role('button',name='Enter',exact=True).is_disabled()
  page.get_by_role('button',name='Root',exact=True).tap()
  page.locator('#granularity').focus();page.keyboard.press('End');overflow(page)
  page.screenshot(path=str(OUT/('navigator-mobile-320'+('-nested' if prefix else '')+'.png')),full_page=True)
  page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/('navigator-mobile-viewport'+('-nested' if prefix else '')+'.png')))
  page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path=str(OUT/('navigator-desktop'+('-nested' if prefix else '')+'.png')),full_page=True)
  page.set_viewport_size({'width':320,'height':780})
  for route in ['', 'field/', 'field/navigate/', 'press/', 'forage/', 'glean/', 'worlds/sanctuary/', 'worlds/orchard/']:
   response=page.goto(base+route);assert response.status==200;overflow(page)
   violations.extend(page.evaluate('window.cspWitness'))
  assert page.evaluate('localStorage.length+sessionStorage.length')==0
  context.set_offline(True)
  for route in ['', 'field/', 'field/navigate/', 'press/', 'forage/', 'glean/']:
   page.goto(base+route);page.reload();overflow(page)
  page.goto(base+'field/navigate/#'+nested)
  page.wait_for_function("()=>document.querySelector('#notice').textContent.startsWith('Ready')")
  assert page.locator('#address').input_value()==nested
  context.set_offline(False)
  missing=page.goto(base+'this-route-is-unissued/');assert missing.status==404
  scopes.append({'base':base,'mobileWidth':320,'routes':8,'offlineRoutes':6,'coldReplayAddress':nested,'keyboard':True,'touchSwipe':True,'backForward':True,'staleAddressHold':True,'http404':404})
  context.close()
 # Static field remains complete without JS and can expose exact provenance.
 context=browser.new_context(java_script_enabled=False,service_workers='block',viewport={'width':320,'height':780})
 page=context.new_page();page.goto(base_url.rstrip('/')+'/field/')
 assert page.locator('.field-card').count()==11
 assert page.locator('.field-door').count()==24
 page.locator('#fabrication summary').focus();page.keyboard.press('Enter')
 assert page.locator('#fabrication details').get_attribute('open') is not None
 overflow(page);context.close()
 external=[u for u in requests if urlparse(u).netloc!=urlparse(base_url).netloc]
 assert not external,external;assert not errors,errors;assert not violations,violations
 result={'schema':'webz/launch-browser-witness/v0','scope':'Scripted Chromium Android-sized touch and desktop emulation; no physical Android installation claimed.','browserVersion':browser.version,'playwrightVersion':importlib.metadata.version('playwright'),'fieldHash':receipt['fieldHash'],'scopes':scopes,'external_requests':0,'page_errors':errors,'csp_violations':violations,'no_js_worlds':11,'no_js_doors':24,'screenshots':{f.name:'sha256:'+hashlib.sha256(f.read_bytes()).hexdigest() for f in OUT.glob('*.png')}}
 (OUT/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));browser.close()
if server:server.shutdown();server.server_close()
