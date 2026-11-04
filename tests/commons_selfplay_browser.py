"""Browser proof for the offline Commons Self-Play artifact; no real participants."""
import json, pathlib, threading, tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/commons-selfplay/'
errors=[];external=[]
try:
 with tempfile.TemporaryDirectory() as temp:
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True)
   context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
   page=context.new_page()
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('request',lambda req:external.append(req.url) if not req.url.startswith('http://127.0.0.1:') else None)
   page.goto(base)
   assert 'What happens when' in page.locator('h1').inner_text()
   assert page.locator('#parent option').count()==1
   page.locator('#simulate').click()
   page.locator('#compare').wait_for(state='visible',timeout=15000)
   assert page.locator('#map-a .tile').count()==64
   assert page.locator('#map-b .tile').count()==64
   assert 'Snapshot SHA-256' in page.locator('#hash-b').inner_text()
   assert 'rations met' in page.locator('#diff').inner_text()
   assert page.locator('#parent option').count()==3
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   with page.expect_download() as event:page.locator('#download').click()
   path=pathlib.Path(temp)/'family.json'
   event.value.save_as(str(path))
   family=json.loads(path.read_text())
   assert family['kind']=='FICTIONAL_WORLD_FAMILY_NOT_REAL_EVIDENCE'
   assert family['mode']=='SIMULATION_ONLY'
   assert family['pair']['commons']['world']['parentHash']==family['pair']['parent']['contentHash']
   assert family['pair']['isolated']['world']['parentHash']==family['pair']['parent']['contentHash']
   # Cold-replay verification on an imported saved family.
   page.locator('#import').set_input_files(str(path))
   assert 'Hash consistency checked' in page.locator('#status').inner_text()
   # Alter an actual inventory value without resealing the hash: refused.
   family['pair']['commons']['world']['actors'][0]['stock']['food']+=1
   fake=pathlib.Path(temp)/'tampered.json';fake.write_text(json.dumps(family))
   page.locator('#import').set_input_files(str(fake))
   assert 'Import refused' in page.locator('#status').inner_text()
   # World generations are preserved as selectable sources.
   page.locator('#parent').select_option('2')
   page.locator('#days').fill('3')
   page.locator('#simulate').click()
   assert 'day 10' in page.locator('#hash-b').inner_text()
   assert 'Two immutable branches saved' in page.locator('#status').inner_text()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
   assert external==[],external
   assert errors==[],errors
   browser.close()
 print(json.dumps({'artifact':'commons-selfplay','browser':'Chromium','mobile':'390x844','parent_fork':True,'hash_import':True,'tamper_rejected':True,'second_generation':True,'external_requests':len(external),'errors':errors},indent=2))
finally:
 server.shutdown()
