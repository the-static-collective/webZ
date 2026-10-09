"""First visitor: declared intents, public history, HOLD and no passive network."""
import hashlib,json,pathlib,threading,tempfile,shutil,subprocess,os,importlib.metadata
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(os.environ.get('WEBZ_WITNESS_ROOT',pathlib.Path(__file__).resolve().parents[1]))
OUT=ROOT/'evidence/static-web-002/browser';OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def end_headers(self):self.send_header('Cache-Control','no-cache');self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
pointer=json.loads((ROOT/'field/current.json').read_text());snapshot=json.loads((ROOT/'field'/pointer['path']).read_text());requests=[];errors=[];violations=[];journeys=[]
def overflow(page):assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.url
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for prefix in ['/', '/nested/webZ/']:
  base=origin+prefix;context=browser.new_context(viewport={'width':320,'height':780},is_mobile=True,has_touch=True,reduced_motion='reduce');context.on('request',lambda r:requests.append(r.url))
  context.add_init_script("window.cspWitness=[];document.addEventListener('securitypolicyviolation',e=>window.cspWitness.push(e.violatedDirective))")
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'field/');page.wait_for_function('()=>navigator.serviceWorker.controller!==null')
  page.wait_for_function("()=>document.querySelector('#match-count').textContent.includes('matching admitted entries')")
  assert page.locator('.field-card').count()==len(snapshot['field']['worlds']);assert page.locator('.held-door a').count()==0
  assert page.evaluate('localStorage.length')==0;assert page.evaluate('sessionStorage.length')==0
  for intent,button,subject,owner in [('LISTEN','Listen','radio-world','Static Live'),('MAKE','Make','static-pressing','webZ'),('BUILD','Build','fabrication','Static OS'),('SEND','Send something','invitation-porch','webZ'),('WANDER','Wander','sanctuary-orchard','webZ'),('PRINT','Print something','fabrication','Static OS')]:
   page.get_by_role('button',name=button,exact=True).tap();card=page.locator('#'+subject);assert card.is_visible();assert owner in card.inner_text();assert 'Shown because:' in card.locator('.match-explanation').inner_text();assert intent in card.locator('.match-explanation').inner_text();assert page.locator('.held-door a').count()==0
   card.locator('summary').tap();assert card.locator('.provenance').get_attribute('open') is not None;assert 'Census hash' in card.inner_text();assert 'Snapshot hash' in card.inner_text();overflow(page)
   if intent in ['MAKE','BUILD','SEND','PRINT']:assert page.locator('.field-card:not([hidden]) .door-state').count()>0
   if intent=='PRINT':assert 'owner admission HOLD' in page.locator('#path-results').inner_text();assert 'PATH != EXECUTION' in page.locator('#path-results').inner_text()
   if prefix!='/' and intent=='PRINT':page.screenshot(path=str(OUT/'wayfinding-print-mobile-320.png'),full_page=True);page.locator('.wayfinding').scroll_into_view_if_needed();page.evaluate('window.scrollTo(0,document.querySelector(".wayfinding").getBoundingClientRect().top+scrollY-12)');page.screenshot(path=str(OUT/'wayfinding-print-mobile-320-viewport.png'))
   if prefix!='/' and intent=='MAKE':page.screenshot(path=str(OUT/'wayfinding-make-mobile-320.png'),full_page=True)
   if intent=='WANDER':
    card.get_by_role('link',name='Enter Sanctuary',exact=True).tap();page.wait_for_url('**/worlds/sanctuary/');assert '/worlds/sanctuary/' in page.url
   elif intent=='MAKE':
    card.get_by_role('link',name='Prepare a pressing',exact=True).tap();page.wait_for_url('**/press/');assert '/press/' in page.url
   elif intent=='SEND':
    card.get_by_role('link',name='Visit the invitation porch',exact=True).tap();page.wait_for_url('**/porch/');assert '/porch/' in page.url
   else:page.get_by_role('link',name='Porch home',exact=True).tap();page.wait_for_url(base);assert page.url==base,(page.url,base)
   page.goto(base);page.get_by_role('link',name='See what’s growing',exact=True).tap();page.wait_for_function("()=>document.querySelector('#match-count').textContent.includes('matching admitted entries')")
   journeys.append({'scope':prefix,'intent':intent,'owned_result':subject,'provenance':True,'hold_not_enabled':True,'return_home':True})
  # Search cannot leak private free text into URLs, storage, another corpus or requests.
  before=len(requests);page.get_by_label('Search admitted public text').fill('needle-private-intent-771');assert '0 matching' in page.locator('#match-count').inner_text();assert 'needle' not in page.url;assert len(requests)==before;assert page.evaluate('localStorage.length+sessionStorage.length')==0
  page.get_by_role('button',name='Clear search',exact=True).tap();page.get_by_label('Search admitted public text').fill('Suno');assert page.locator('.field-card:not([hidden])').count()==1
  assert page.locator('#suno-atlas').is_visible();assert 'No Suno account' in page.locator('#suno-atlas').inner_text();page.reload();page.wait_for_function("()=>document.querySelector('#match-count').textContent.includes('matching admitted entries')");assert page.get_by_label('Search admitted public text').input_value()==''
  # Deep links use only admitted IDs / bounded public intent enums.
  page.goto(base+'field/#intent-listen');page.wait_for_function("()=>document.querySelector('[data-intent=LISTEN]').getAttribute('aria-pressed')==='true'");assert page.locator('#radio-world').is_visible()
  page.goto(base+'field/#radio-world');assert page.locator('#radio-world').is_visible();overflow(page)
  page.get_by_role('link',name='What changed?',exact=True).tap();page.get_by_role('heading',name='What changed?',exact=True).wait_for();assert 'Not observed in this census' in page.locator('main').inner_text();assert 'no withdrawal' in page.locator('main').inner_text().lower();overflow(page)
  if prefix!='/':page.screenshot(path=str(OUT/'changes-mobile-320.png'),full_page=True);page.screenshot(path=str(OUT/'changes-mobile-320-viewport.png'))
  for route in ['', 'field/', 'field/changes/', 'field/history/', 'field/history/founding.html', 'porch/', 'press/', 'proof/']:
   page.goto(base+route);page.reload();overflow(page);violations.extend(page.evaluate('window.cspWitness'))
  # Attempt to fetch a non-admitted candidate explicitly; never cache it.
  page.goto(base+'field/');page.evaluate("async()=>{await fetch('../census/static-web-002/fragments/webz-16.json');await fetch('../census/static-web-002/inputs.json')}")
  cached=page.evaluate("async()=>{let urls=[];for(const k of await caches.keys())urls.push(...(await(await caches.open(k)).keys()).map(r=>r.url));return urls}")
  assert not any('/census/' in u or 'public-review-proposal' in u or not u.startswith(base) for u in cached)
  context.set_offline(True)
  for route in ['field/','field/changes/','field/history/','field/history/founding.html']:
   page.goto(base+route);page.reload();overflow(page)
  page.goto(base+'field/#intent-print');page.wait_for_function("()=>document.querySelector('#path-results').textContent.includes('HOLD')");page.locator('#fabrication summary').tap();assert snapshot['censusHash'] in page.locator('#fabrication').inner_text();overflow(page)
  got=page.evaluate("async()=>{const p=await(await fetch('current.json')).json();return await(await fetch(p.path)).json()}");assert got==snapshot
  old=page.evaluate("async()=>await(await fetch('snapshots/d3fa28fa3e1e2d2e370287422242fc8eab3c0362e27b61f54d0392430f8e21d1.json')).json()")
  raw=json.dumps(old['field'],sort_keys=True,separators=(',',':'),ensure_ascii=False).encode();assert 'sha256:'+hashlib.sha256(raw).hexdigest()==snapshot['parentSnapshotHash']
  assert len(old['field']['worlds'])==11;page.get_by_label('Search admitted public text').fill('printer');assert page.locator('#fabrication').is_visible()
  context.set_offline(False);page.goto(base+'field/changes/');page.set_viewport_size({'width':1440,'height':1000})
  if prefix!='/':page.screenshot(path=str(OUT/'changes-desktop.png'),full_page=True)
  page.set_viewport_size({'width':320,'height':780});page.goto(base+'field/');page.evaluate("()=>{document.styleSheets[0].insertRule('body{font-size:200%}',document.styleSheets[0].cssRules.length)}");page.locator('details').evaluate_all('(es)=>es.forEach(e=>e.open=true)');overflow(page);context.close()
 # Keyboard and no-JS retain every static card and provenance panel.
 context=browser.new_context(viewport={'width':320,'height':780},service_workers='block',java_script_enabled=False);page=context.new_page();page.goto(origin+'/field/');assert page.locator('.field-card').count()==len(snapshot['field']['worlds']);page.keyboard.press('Tab');assert page.locator('.skip').evaluate('(e)=>e===document.activeElement');page.keyboard.press('Enter');page.locator('#fabrication summary').focus();page.keyboard.press('Enter');assert page.locator('#fabrication details').get_attribute('open') is not None;overflow(page);context.close()
 # Explicit external navigation is intercepted so no donor is contacted.
 context=browser.new_context(service_workers='block');seen=[];context.on('request',lambda r:seen.append(r.url));context.route('https://kinshipradio.org/main/',lambda r:r.fulfill(status=200,content_type='text/html',body='<h1>Explicit owner handoff</h1>'));page=context.new_page();page.goto(origin+'/field/');assert all(u.startswith(origin) for u in seen);page.get_by_role('link',name='Open Kinship Radio’s site ↗',exact=True).click();page.get_by_role('heading',name='Explicit owner handoff').wait_for();assert [u for u in seen if not u.startswith(origin)]==['https://kinshipradio.org/main/'];context.close()
 external=[u for u in requests if urlparse(u).netloc!=urlparse(origin).netloc];assert not external,external;assert not errors,errors;assert not violations,violations
 result={'schema':'webz/first-human-field-witness/v0','scope':'Scripted first-visitor journeys; not a claim of independent human usability testing.','snapshotHash':snapshot['snapshotHash'],'fieldHash':snapshot['fieldHash'],'oldFieldHash':snapshot['parentSnapshotHash'],'browserVersion':browser.version,'playwrightVersion':importlib.metadata.version('playwright'),'journeys':journeys,'external_requests':len(external),'page_errors':errors,'csp_violations':violations,'offline_history_reconstructs':True,'candidate_cache_entries':0,'private_choice_storage_entries':0,'screenshots':{f.name:'sha256:'+hashlib.sha256(f.read_bytes()).hexdigest() for f in OUT.glob('*.png')}}
 (OUT/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));browser.close()
server.shutdown();server.server_close()
