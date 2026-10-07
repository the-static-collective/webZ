"""Two isolated Chromium processes/origins verify public fixtures; no field encounter claim."""
import json,pathlib,subprocess,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'evidence/first-encounter-002/browser';OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
servers=[ThreadingHTTPServer(('127.0.0.1',0),Handler) for _ in range(2)]
for s in servers:threading.Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browsers=[p.chromium.launch() for _ in range(2)];pages=[];observations=[];errors=[];requests=[]
  for i,browser in enumerate(browsers):
   context=browser.new_context(viewport={'width':390 if i==0 else 1280,'height':844 if i==0 else 1000},service_workers='block');page=context.new_page();pages.append(page)
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append((r.method,r.url)))
   base=f'http://127.0.0.1:{servers[i].server_port}/'
   page.goto(base+'encounter/');page.get_by_role('heading',name='A visitor may knock.',exact=True).wait_for(timeout=3000)
   page.get_by_text('Try a synthetic native receipt',exact=True).click();page.get_by_role('button',name='Load REFUSE fixture').click()
   page.wait_for_function('()=>document.querySelector("#encounter-status").textContent.includes("Loaded")')
   assert page.locator('#encounter-result').inner_text()=='No accepted observation.'
   page.get_by_role('button',name='Verify reviewed packet').click();assert 'pins' in page.locator('#encounter-status').inner_text().lower()
   page.get_by_label('Use these reviewed public pins for this local verification.').check()
   page.get_by_role('button',name='Verify reviewed packet').click()
   page.wait_for_function('()=>document.querySelector("#encounter-status").textContent.includes("RETURN VERIFIED")')
   observations.append(json.loads(page.locator('#encounter-result').inner_text()))
   assert page.get_by_role('button',name='Network delivery unavailable').is_disabled()
   assert 'UNOBSERVED' in page.locator('#encounter-result').inner_text()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   assert page.evaluate('localStorage.length + sessionStorage.length')==0
   page.screenshot(path=str(OUT/('receiver-mobile.png' if i==0 else 'visitor-desktop.png')),full_page=True)
  cold=json.loads(subprocess.check_output(['node','scripts/inspect-encounter.mjs','evidence/first-encounter-002/refuse.packet.json','evidence/first-encounter-002/refuse.trust.json'],cwd=ROOT,text=True))
  assert observations[0]==observations[1]==cold
  # Missing/forged independent trust is not replaced with keys from the signed packet.
  bad=json.loads((ROOT/'evidence/first-encounter-002/refuse.trust.json').read_text());bad['trust']['issuer_key_fingerprint']='sha256:'+'0'*64
  page=pages[1];page.locator('#encounter-trust').set_input_files({'name':'wrong-pins.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
  page.wait_for_function('()=>document.querySelector("#encounter-status").textContent.includes("Trust file loaded")')
  assert not page.get_by_label('Use these reviewed public pins for this local verification.').is_checked()
  page.get_by_label('Use these reviewed public pins for this local verification.').check();page.get_by_role('button',name='Verify reviewed packet').click()
  page.wait_for_function('()=>document.querySelector("#encounter-status").textContent.includes("REJECTED")')
  assert 'No accepted observation' in page.locator('#encounter-result').inner_text()
  page.get_by_role('button',name='Clear packet and pins').click();assert 'UNAVAILABLE' in page.locator('#encounter-status').inner_text()
  assert not errors,errors
  allowed={f'http://127.0.0.1:{s.server_port}' for s in servers}
  assert all(method=='GET' and any(url.startswith(origin+'/') for origin in allowed) for method,url in requests),requests
  result={'schema':'webz/encounter-browser-witness/v0','scope':'synthetic preflight; two automated isolated browser processes/origins, no human field proof','two_isolated_processes':True,'separate_origins':True,'node_browser_projections_equal':True,'wrong_pin_rejected':True,'approval_reset_on_pin_change':True,'delivery_requests':0,'browser_storage_entries':0,'page_errors':errors,'authenticated_transport':'UNOBSERVED','two_device_encounter':'UNOBSERVED','projection':cold}
  (OUT/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
  for browser in browsers:browser.close()
finally:
 for server in servers:server.shutdown();server.server_close()
