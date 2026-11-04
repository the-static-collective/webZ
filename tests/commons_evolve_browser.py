"""Mobile Chromium proof of self-play evolution. Local-only static site, no requests off loopback."""
import pathlib,threading,json,tempfile
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
errors=[];external=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
  page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda req:external.append(req.url) if not req.url.startswith('http://127.0.0.1:') else None)
  page.goto(f'http://127.0.0.1:{server.server_port}/commons-evolve/')
  page.locator('#start').click()
  page.locator('#results').wait_for(state='visible',timeout=15000)
  assert page.locator('.leader').count()==8
  assert page.locator('#grid-a .cell').count()==64
  assert page.locator('#grid-b .cell').count()==64
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.locator('#evolve').click()
  assert page.locator('#generation').inner_text()=='02'
  page.locator('#climate').select_option('normal')
  page.locator('#duel').click()
  assert 'normal' in page.locator('#verdict-note').inner_text()
  with tempfile.TemporaryDirectory() as d:
   with page.expect_download() as ev:page.locator('#export').click()
   path=pathlib.Path(d)/'test.json';ev.value.save_as(str(path))
   packet=json.loads(path.read_text())
   assert packet['evidence']=='FICTIONAL_SIMULATION_NOT_HUMAN_EVIDENCE'
   assert packet['league']['generation']==2
   assert packet['duel']['champion']['metrics']['fed']+packet['duel']['champion']['metrics']['unmet']==168
  assert errors==[],errors
  assert external==[],external
  browser.close()
 print(json.dumps({'browser':'Chromium 390x844','generations':2,'external_requests':external,'errors':errors},indent=2))
finally:server.shutdown()
