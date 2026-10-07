"""Real Chromium mobile/offline/nested-base and fresh-browser replay witness."""
import json, pathlib, subprocess, threading, importlib.metadata
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ') :]
  super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
out=ROOT/'evidence/browser';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
 page=context.new_page();errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.url))
 page.goto(base+'worlds/sanctuary/');page.get_by_role('heading',name='Sanctuary',exact=True).wait_for(timeout=3000)
 page.get_by_label('Keep this non-sensitive local trace').check()
 page.get_by_role('button',name='Inspect door').click()
 assert 'Orchard' in page.locator('#door-contract').inner_text()
 page.get_by_role('button',name='Remain here').click();assert page.url.endswith('/sanctuary/')
 page.get_by_role('button',name='Inspect door').click()
 page.screenshot(path=str(out/'sanctuary-mobile.png'),full_page=True)
 page.get_by_role('button',name='Cross to Orchard').click()
 page.get_by_role('heading',name='Orchard',exact=True).wait_for()
 page.get_by_role('button',name='Return to Sanctuary').click()
 page.get_by_role('heading',name='Sanctuary',exact=True).wait_for()
 page.reload();assert '2 arrivals' in page.locator('#trace-status').inner_text()
 # Service worker ready/cache done is a real offline condition, not browser route interception.
 page.wait_for_function("()=>navigator.serviceWorker.controller !== null")
 page.wait_for_function("()=>document.documentElement.dataset.offlineReady === 'true'")
 context.set_offline(True)
 page.get_by_role('button',name='Inspect door').click();page.get_by_role('button',name='Cross to Orchard').click()
 page.get_by_role('heading',name='Orchard',exact=True).wait_for()
 page.get_by_role('button',name='Return to Sanctuary').click();page.get_by_role('heading',name='Sanctuary',exact=True).wait_for()
 page.get_by_role('link',name='Invitation porch').click()
 page.get_by_role('heading',name='An invitation is a choice.',exact=True).wait_for()
 assert page.get_by_role('button',name='Deliver proposal').is_disabled()
 page.get_by_label('Public text',exact=True).fill('A small seed, offered locally.')
 page.get_by_role('button',name='Prepare local proposal').click();assert 'consent' in page.locator('#proposal-status').inner_text().lower()
 page.get_by_label('I offer this public text for local inspection only.').check()
 page.get_by_role('button',name='Prepare local proposal').click()
 page.get_by_role('button',name='HOLD locally').click()
 page.get_by_label('Rehearsal world').select_option('1');page.get_by_role('button',name='REFUSE locally').click()
 assert 'REFUSE' in page.locator('#decision-history').inner_text()
 page.get_by_label('Rehearsal world').select_option('0');page.get_by_role('button',name='ADMIT locally').click()
 assert 'ADMIT' in page.locator('#decision-history').inner_text()
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.screenshot(path=str(out/'porch-mobile.png'),full_page=True)
 page.get_by_role('link',name='Crossing evidence').click()
 page.get_by_role('button',name='Inspect public simulation').click()
 page.wait_for_function("()=>document.querySelector('#proof-status').textContent.includes('4 verified crossings')")
 assert 'NOT EARNED' in page.locator('#rack').inner_text()
 page.get_by_text('Inspect deterministic verification result',exact=True).click()
 assert 'UNOBSERVED' in page.locator('#proof-result').inner_text()
 page.screenshot(path=str(out/'proof-mobile.png'),full_page=True)
 proof=json.loads(page.locator('#proof-result').inner_text())
 (out/'proof.observation.json').write_text(json.dumps(proof,indent=2)+'\n')
 assert proof==json.loads(subprocess.check_output(['node','scripts/verify-report.mjs','evidence/public-simulation.json'],cwd=ROOT,text=True))
 # Tampered imports never grant authority, even when supplied by the UI.
 bad=json.loads((ROOT/'evidence/public-simulation.json').read_text());bad['claims']={'live_two_host':True}
 page.locator('#proof-file').set_input_files({'name':'fake-live.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
 page.wait_for_function("()=>document.querySelector('#proof-status').textContent.includes('REJECTED')")
 assert 'NOT EARNED' in page.locator('#rack').inner_text()
 # Frozen observation export from this exact browser; replay in fresh Node and browser.
 page.get_by_role('button',name='Review trace export').click()
 page.wait_for_function("()=>document.querySelector('#export-preview').textContent.includes('webz/local-export/v0')")
 frozen=page.locator('#export-preview').inner_text();(out/'voyage.frozen.json').write_text(frozen+'\n')
 node=json.loads(subprocess.check_output(['node','scripts/replay.mjs',str(out/'voyage.frozen.json')],cwd=ROOT,text=True))
 cold=browser.new_context(viewport={'width':1440,'height':1000});coldpage=cold.new_page();coldpage.goto(base+'worlds/sanctuary/')
 coldpage.locator('#trace-file').set_input_files({'name':'voyage.json','mimeType':'application/json','buffer':frozen.encode()})
 coldpage.wait_for_function("()=>document.querySelector('#import-preview').textContent.includes('webz/local-projection/v0')")
 fresh=json.loads(coldpage.locator('#import-preview').inner_text());assert fresh==node
 assert coldpage.url.endswith('/sanctuary/') # Import is observation, not navigation.
 coldpage.get_by_role('button',name='Restore reviewed local trace').click()
 assert f"{node['arrivals']} arrivals" in coldpage.locator('#trace-status').inner_text()
 coldpage.screenshot(path=str(out/'sanctuary-desktop.png'),full_page=True)
 # Corrupt durable record is visible; no automatic repairs or missing events invented.
 coldpage.evaluate("localStorage.setItem('webz.observations.v0','{broken')");coldpage.reload()
 assert 'UNAVAILABLE' in coldpage.locator('#trace-status').inner_text()
 coldpage.get_by_role('button',name='Erase local trace').click();assert '0 arrivals' in coldpage.locator('#trace-status').inner_text()
 denied=browser.new_context();denied.add_init_script("Object.defineProperty(window, 'localStorage', {get(){throw new Error('denied')}})")
 dp=denied.new_page();dp.goto(base+'worlds/sanctuary/');assert 'UNAVAILABLE' in dp.locator('#trace-status').inner_text()
 dp.get_by_role('button',name='Inspect door').click();dp.get_by_role('button',name='Cross to Orchard').click();dp.get_by_role('heading',name='Orchard',exact=True).wait_for()
 # Genuine unavailable destination: no fabricated arrival; human remains with a visible return.
 missing=browser.new_context(service_workers='block');mp=missing.new_page();mp.goto(base+'worlds/sanctuary/')
 mp.get_by_label('Keep this non-sensitive local trace').check()
 mp.route('**/worlds/orchard/',lambda route:route.fulfill(status=404,body='Unavailable fixture'))
 mp.get_by_role('button',name='Inspect door').click();mp.get_by_role('button',name='Cross to Orchard').click()
 mp.wait_for_function("()=>document.querySelector('#door-status').textContent.includes('UNRESOLVED')")
 assert mp.url.endswith('/sanctuary/')
 assert '0 arrivals' in mp.locator('#trace-status').inner_text()
 assert 'UNRESOLVED' in mp.evaluate("localStorage.getItem('webz.observations.v0')")
 # Default browsing records no durable data, and discovery requests no other world.
 plain=browser.new_context(service_workers='block');pp=plain.new_page();seen=[];pp.on('request',lambda r:seen.append(r.url))
 pp.goto(base+'worlds/sanctuary/');pp.get_by_role('button',name='Inspect door').click()
 assert pp.evaluate("localStorage.length")==0
 assert not any('/worlds/orchard/' in u for u in seen)
 # No imported evidence or text enters either browser storage or the static asset cache.
 stored=page.evaluate("JSON.stringify({...localStorage})")
 assert 'A small seed' not in stored and 'ECDSA' not in stored
 cache_urls=page.evaluate("async()=>{const a=[];for(const k of await caches.keys()){for(const r of await (await caches.open(k)).keys())a.push(r.url)}return a}")
 assert not any('fake-live' in u or 'voyage' in u for u in cache_urls)
 assert not errors,errors
 assert all(u.startswith(base) for u in requests),requests
 result={'schema':'webz/browser-witness/v0','browser':'Chromium','browser_version':browser.version,'playwright_version':importlib.metadata.version('playwright'),'base_scope':'nested /nested/webZ/','offline_round_trip':True,'explicit_human_choices':['Sanctuary HOLD → ADMIT','Orchard REFUSE'],'mobile_no_overflow':True,'reload_durable_trace':True,'cold_node_browser_equal':True,'corrupt_storage':'UNAVAILABLE, explicit ERASE','denied_storage':'navigation works without durable trace','fake_live':'REJECTED; Rack locked','missing_target':'UNRESOLVED; no arrival','default_discovery':'no durable storage or destination fetch','proof_node_browser_equal':True,'external_requests':0,'page_errors':errors,'projection':node}
 (out/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
 browser.close()
server.shutdown()
