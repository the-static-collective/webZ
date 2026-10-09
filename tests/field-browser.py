"""Public-field Chromium witness: mobile, root/nested, CSP, offline and real SW update."""
import hashlib, importlib.metadata, json, pathlib, shutil, subprocess, tempfile, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence/static-web-002/inherited-field-browser';OUT.mkdir(parents=True,exist_ok=True)
scratch=tempfile.TemporaryDirectory(prefix='webz-field-witness-')
SITE=pathlib.Path(scratch.name)/'site'
shutil.copytree(ROOT,SITE,ignore=shutil.ignore_patterns('.git','__pycache__','node_modules','browser'))
# Reconstruct the untouched founding shell for its inherited regression witness.
# Its scratch upgrade predates immutable admission; production replay separately
# refuses any founding-history mutation. No descendant admission is issued here.
for moving_input in ['census/static-web-002/human-admission.json','scripts/public-field-cache.json']:
 (SITE/moving_input).unlink(missing_ok=True)
subprocess.check_output(['node','scripts/build-field.mjs'],cwd=SITE,text=True)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def end_headers(self):
  self.send_header('Cache-Control','no-cache');self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
receipt=json.loads((ROOT/'field/public-field-receipt.json').read_text())
def no_overflow(page):assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),page.url
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 all_errors=[];passive_requests=[];violations=[];scope_results=[]
 for prefix in ['/', '/nested/webZ/']:
  base=origin+prefix
  context=browser.new_context(viewport={'width':320,'height':780},is_mobile=True,has_touch=True,reduced_motion='reduce')
  context.on('request',lambda r:passive_requests.append(r.url))
  context.add_init_script("window.cspWitness=[];document.addEventListener('securitypolicyviolation',e=>window.cspWitness.push(e.violatedDirective))")
  page=context.new_page();page.on('pageerror',lambda e:all_errors.append(str(e)))
  page.goto(base)
  page.get_by_role('heading',name='A porch for many worlds.',exact=True).wait_for()
  page.wait_for_function('()=>navigator.serviceWorker.controller !== null')
  page.get_by_role('link',name='See what’s growing',exact=True).tap()
  page.get_by_role('heading',name='See what’s growing.',exact=True).wait_for()
  assert page.locator('.field-card').count()==11
  assert page.locator('.held-door a').count()==0
  assert page.locator('#fabrication').inner_text().find('PHYSICAL START = HOLD')>=0
  assert 'No public execution service' in page.locator('#relatte-vm').inner_text()
  page.locator('#radio-world summary').tap()
  assert 'eb0048fe56f7125ec2a2e10ffaf00569c959c702' in page.locator('#radio-world .provenance').inner_text()
  assert 'Kinship or Rock Impact adoption' in page.locator('#radio-world .provenance').inner_text()
  no_overflow(page)
  # Four deliverable screenshots are from the actual committed static page.
  if prefix!='/':
   page.locator('#radio-world summary').tap()
   page.screenshot(path=str(OUT/'field-mobile-320.png'),full_page=True)
   page.evaluate('window.scrollTo(0,document.querySelector(".field-grid").getBoundingClientRect().top+scrollY-12)')
   page.screenshot(path=str(OUT/'field-mobile-320-viewport.png'))
   page.goto(base);page.screenshot(path=str(OUT/'home-mobile-320.png'),full_page=True)
   page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path=str(OUT/'home-desktop.png'),full_page=True)
   page.goto(base+'field/');page.screenshot(path=str(OUT/'field-desktop.png'),full_page=True)
   page.screenshot(path=str(OUT/'field-desktop-viewport.png'))
   page.locator('#fabrication').screenshot(path=str(OUT/'fabrication-hold-desktop.png'))
   page.set_viewport_size({'width':320,'height':780})
  for route in ['', 'field/', 'porch/', 'press/', 'proof/']:
   page.goto(base+route);page.reload();no_overflow(page)
   assert 'OFFLINE READY' in page.locator('#offline-state').inner_text()
   violations.extend(page.evaluate('window.cspWitness'))
  # An actual file operation emits no request and preserves source privacy.
  page.goto(base+'press/');page.get_by_label('Particular type').select_option('local-file')
  page.get_by_label('Public label').fill('public seed')
  before=len(passive_requests)
  page.locator('#source-file').set_input_files({'name':'private-mobile-source.txt','mimeType':'text/plain','buffer':b'private-field-witness-bytes'})
  page.get_by_role('button',name='Prepare pressing',exact=True).tap()
  page.wait_for_function("()=>document.querySelector('#pressing-preview').textContent.includes('webz/static-pressing-proposal/v0')")
  assert len(passive_requests)==before
  text=page.locator('#pressing-preview').inner_text();assert 'private-mobile-source' not in text and 'private-field-witness-bytes' not in text
  assert page.get_by_role('button',name='Deliver pressing',exact=True).is_disabled()
  assert page.evaluate('localStorage.length')==0
 # The fixed shell remains navigable while completely offline.
  context.set_offline(True)
  for route in ['', 'field/', 'porch/', 'press/', 'proof/']:
   page.goto(base+route);page.reload();no_overflow(page)
   # Chromium's network emulation can leave navigator.onLine true after reload;
   # successful cached navigation is the offline witness, not that indicator.
   page.wait_for_function("()=>document.documentElement.dataset.offlineReady==='true'")
   assert page.locator('#offline-state').inner_text() in ['OFFLINE','OFFLINE READY']
  page.goto(base+'field/');page.locator('#relatte-vm summary').tap();no_overflow(page)
  offline_manifest=page.evaluate("async()=>await (await fetch('../field/public-field.json')).json()")
  assert offline_manifest==json.loads((ROOT/'field/public-field.json').read_text())
  cache_urls=page.evaluate("async()=>{const result=[];for(const key of await caches.keys()){for(const r of await (await caches.open(key)).keys())result.push(r.url)}return result}")
  assert not any('private' in u or 'proposal' in u or not u.startswith(base) for u in cache_urls)
  context.set_offline(False)
  # Queries and arbitrary local resources must never enter the static cache.
  page.evaluate("async()=>{await fetch('../field/public-field.json?arbitrary=1');await fetch('../README.md')}")
  assert page.evaluate("async()=>{for(const k of await caches.keys())for(const r of await(await caches.open(k)).keys())if(r.url.includes('?')||r.url.endsWith('README.md'))return false;return true}")
  scope_results.append({'scope':prefix,'offline_routes':5,'mobile_width':320,'no_horizontal_overflow':True,'local_file_requests':0,'local_file_storage_entries':0,'first_party_cache_only':True})
  context.close()
 # Keyboard operates the page without scripts; native details expose provenance.
 context=browser.new_context(viewport={'width':320,'height':780},service_workers='block',java_script_enabled=False)
 page=context.new_page();page.goto(origin+'/field/');page.keyboard.press('Tab');assert page.locator('.skip').evaluate('(el)=>el===document.activeElement')
 page.keyboard.press('Enter');assert page.url.endswith('#main')
 page.locator('#fabrication summary').focus();page.keyboard.press('Enter');assert page.locator('#fabrication details').get_attribute('open') is not None
 no_overflow(page);assert page.locator('.field-card').count()==11;context.close()
 # A fresh slow bootstrap and reload use only first-party resources.
 context=browser.new_context(viewport={'width':320,'height':780});context.on('request',lambda r:passive_requests.append(r.url))
 page=context.new_page();cdp=context.new_cdp_session(page);cdp.send('Network.enable')
 cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':250,'downloadThroughput':32768,'uploadThroughput':32768})
 page.goto(origin+'/field/');page.wait_for_function('()=>navigator.serviceWorker.controller !== null');page.reload();assert page.locator('.field-card').count()==11;no_overflow(page);context.close()
 # Desktop 400% zoom equivalent: 1280px layout reduced to a 320 CSS-pixel viewport,
 # plus doubled text sizing with all details expanded.
 context=browser.new_context(viewport={'width':320,'height':780},reduced_motion='reduce')
 page=context.new_page();page.goto(origin+'/field/')
 page.evaluate("()=>{for(const rule of ['body{font-size:200%}', '.field-card p,.field-card dd{font-size:26px}', '.field-card h2{font-size:48px}'])document.styleSheets[0].insertRule(rule,document.styleSheets[0].cssRules.length)}")
 page.locator('details').evaluate_all('(els)=>els.forEach(el=>el.open=true)');no_overflow(page);context.close()
 # External navigation emits only after an explicit click, intercepted locally so
 # this witness never contacts or claims current availability of an owner site.
 context=browser.new_context(service_workers='block');seen=[];context.on('request',lambda r:seen.append(r.url))
 context.route('https://kinshipradio.org/main/',lambda route:route.fulfill(status=200,content_type='text/html',body='<h1>Intercepted owner-site handoff</h1>'))
 page=context.new_page();page.goto(origin+'/field/');assert all(u.startswith(origin) for u in seen)
 page.get_by_role('link',name='Open Kinship Radio’s site ↗',exact=True).click();page.get_by_role('heading',name='Intercepted owner-site handoff').wait_for()
 assert [u for u in seen if not u.startswith(origin)]==['https://kinshipradio.org/main/'];context.close()
 # Real service-worker upgrade with different committed-like field bytes in an
 # isolated scratch copy. Old manifest is never kept under the new asset version.
 context=browser.new_context();page=context.new_page();base=origin+'/nested/webZ/'
 page.goto(base+'field/');page.wait_for_function('()=>navigator.serviceWorker.controller !== null')
 page.evaluate("async()=>{for(const name of ['webz-static:/nested/webZ/:legacy','webz-offline-001:/nested/webZ/','neighbor-scope']){const c=await caches.open(name);await c.put(new URL('public-field.json',location.href).href,new Response('incompatible stale manifest'))}}")
 changed=json.loads((SITE/'field/public-field.json').read_text());changed['worlds'][0]['shortDescription']+=' Upgrade witness in scratch only.'
 (SITE/'field/public-field.json').write_text(json.dumps(changed,indent=2)+'\n')
 new_receipt=json.loads(subprocess.check_output(['node','scripts/build-field.mjs'],cwd=SITE,text=True))
 page.evaluate("async()=>{window.updated=false;navigator.serviceWorker.addEventListener('controllerchange',()=>window.updated=true,{once:true});await (await navigator.serviceWorker.getRegistration()).update()}")
 page.wait_for_function('()=>window.updated===true',timeout=15000)
 # controllerchange can precede completion of the activate waitUntil work.
 keys=page.evaluate("async()=>{const deadline=performance.now()+15000;while(performance.now()<deadline){const keys=await caches.keys();if(!keys.includes('webz-static:/nested/webZ/:legacy')&&!keys.includes('webz-offline-001:/nested/webZ/')&&keys.filter(k=>k.startsWith('webz-static:/nested/webZ/:')).length===1)return keys;await new Promise(resolve=>setTimeout(resolve,50));}throw Error('CACHE_UPGRADE_NOT_COMPLETE')}")
 assert 'neighbor-scope' in keys;assert 'webz-static:/nested/webZ/:legacy' not in keys;assert 'webz-offline-001:/nested/webZ/' not in keys
 assert len([k for k in keys if k.startswith('webz-static:/nested/webZ/:')])==1
 context.set_offline(True);page.reload()
 assert 'Upgrade witness in scratch only.' in page.locator('#sanctuary-orchard').inner_text()
 got=page.evaluate("async()=>await(await fetch('public-field-receipt.json')).json()")
 assert got==new_receipt and got['fieldHash']!=receipt['fieldHash'];context.close()
 # Cold offline visits cannot invent a successful bootstrap.
 cold=browser.new_context();cold.set_offline(True);cp=cold.new_page()
 try:cp.goto(origin+'/');raise AssertionError('Cold offline bootstrap unexpectedly succeeded')
 except Exception as error:assert 'ERR_INTERNET_DISCONNECTED' in str(error)
 cold.close()
 assert not all_errors,all_errors
 assert not violations,violations
 external=[u for u in passive_requests if urlparse(u).netloc!=urlparse(origin).netloc]
 assert not external,external
 screenshots={path.name:'sha256:'+hashlib.sha256(path.read_bytes()).hexdigest() for path in OUT.glob('*.png')}
 result={'schema':'webz/public-field-browser-witness/v0','browser':'Chromium','browserVersion':browser.version,'playwrightVersion':importlib.metadata.version('playwright'),'fieldHash':receipt['fieldHash'],'scopes':scope_results,'external_requests':len(external),'page_errors':all_errors,'passive_csp_violations':violations,'keyboard_and_no_js':True,'reduced_motion':True,'zoom_400_percent_layout':True,'explicit_external_click':'intercepted owner-site navigation; no availability or playback claimed','real_sw_upgrade':'new hash and offline field; same-scope stale caches removed, neighbor preserved','cold_offline_bootstrap':'unavailable, as required','screenshots':screenshots}
 (OUT/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
 browser.close()
server.shutdown();server.server_close();scratch.cleanup()
