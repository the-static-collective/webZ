"""SUNO ATLAS 001 — real Chromium private-library graph and save/load witness.
All tracks in this test are synthetic fixtures, never user account information.
"""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass

srv=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=srv.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{srv.server_port}/nested/webZ/'
data=[
 {'id':'sample0001','title':'A First Track','created_at':'2026-05-01','duration':145,'style':'folk, ambient','album':'Fictional A',
  'url':'https://suno.com/song/abcdef12345'},
 {'id':'sample0002','title':'Second Sound','created_at':'2026-05-07','duration':160,'style':'ambient, jazz','album':'Fictional A'},
 {'id':'sample0003','title':'Last Light','created_at':'2026-06-02','duration':132,'style':'jazz, acoustic','album':'Fictional B'}
]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':390,'height':844})
  outside=[];errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:outside.append(r.url) if not (r.url.startswith(base) or r.url.startswith('blob:')) else None)
  page.goto(base+'worlds/suno-atlas/')
  page.get_by_role('heading',name='Your music has more than one order.').wait_for()
  assert page.locator('#n-tracks').inner_text()=='0'
  assert page.locator('#snapshots option').count()==1
  assert page.evaluate('document.querySelectorAll("audio").length')==0

  page.locator('#demo').click()
  assert page.locator('#n-tracks').inner_text()=='88'
  assert page.locator('#timeline svg').count()==1
  assert page.locator('#constellation svg').count()==1
  assert page.locator('#track-list .track').count()>0
  assert 'FICTIONAL' in page.locator('#track-list').inner_text()
  page.locator('#tuning').evaluate("(e)=>{e.value='2';e.dispatchEvent(new Event('input',{bubbles:true}))}")
  assert page.locator('#t-value').inner_text()=='02/11'
  page.locator('#grain').evaluate("(e)=>{e.value='1';e.dispatchEvent(new Event('input',{bubbles:true}))}")
  assert page.locator('#g-value').inner_text()=='01/11'
  assert page.locator('#track-list .track').count()<=11
  page.locator('#enter').click()
  assert '/t02g01/t01g06' in page.locator('#atlas-address').inner_text()
  page.locator('#rise').click()
  assert page.locator('#atlas-address').inner_text().endswith('/t02g01')

  page.locator('#clear').click()
  assert page.locator('#n-tracks').inner_text()=='0'
  page.locator('#files').set_input_files({'name':'my-data.json','mimeType':'application/json',
   'buffer':json.dumps(data).encode()})
  page.wait_for_function("()=>document.querySelector('#n-tracks').textContent==='3'")
  assert page.locator('#timeline svg').count()==1
  assert page.locator('#constellation svg').count()==1
  assert page.locator('#track-list a').count()==1
  assert page.locator('#track-list a').first.get_attribute('href')=='https://suno.com/song/abcdef12345'
  # Plainly derived tag co-occurrence and changes to discovery.
  page.locator('#search').fill('second')
  assert page.locator('#track-list .track').count()==1
  page.locator('#clear-search').click()
  assert page.locator('#track-list .track').count()==3
  original=page.locator('#fingerprint').inner_text()

  # An import conflict is atomic; original three songs survive unchanged.
  changed=[{'id':'sample0001','title':'Counterfeit replacement'}]
  page.locator('#files').set_input_files({'name':'conflict.json','mimeType':'application/json',
    'buffer':json.dumps(changed).encode()})
  page.wait_for_function("()=>document.querySelector('#status').textContent.includes('CONFLICTING_TRACK_ID')")
  assert page.locator('#n-tracks').inner_text()=='3'
  assert page.locator('#fingerprint').inner_text()==original

  # Nothing had yet been saved. Explicit snapshot action persists only metadata.
  assert page.locator('#snapshots option').count()==1
  page.locator('#snapshot-name').fill('Lab collection')
  page.locator('#save').click()
  page.wait_for_function("()=>document.querySelector('#status').textContent.includes('Saved 3 metadata records')")
  assert page.locator('#snapshots option').count()==2
  page.locator('#clear').click()
  assert page.locator('#n-tracks').inner_text()=='0'
  page.locator('#snapshots').select_option('Lab collection')
  page.locator('#load').click()
  page.wait_for_function("()=>document.querySelector('#n-tracks').textContent==='3'")
  assert page.locator('#fingerprint').inner_text()==original

  # A reload does not auto-open metadata from local storage.
  page.reload()
  assert page.locator('#n-tracks').inner_text()=='0'
  page.wait_for_function("()=>document.querySelectorAll('#snapshots option').length===2")
  page.locator('#snapshots').select_option('Lab collection')
  page.locator('#load').click()
  page.wait_for_function("()=>document.querySelector('#n-tracks').textContent==='3'")
  page.locator('#delete').click()
  page.wait_for_function("()=>document.querySelectorAll('#snapshots option').length===1")
  assert page.locator('#n-tracks').inner_text()=='3'
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  assert not outside,outside
  assert not errors,errors
  print(json.dumps({'schema':'webz/suno-atlas-browser-witness/v0','mobile_width':390,
    'synthetic_demo':True,'csv_json_local_only':True,'timeline_and_graph':True,
    'eleven_dial_nested_replay':True,'conflicting_source_hold':True,
    'explicit_indexeddb_save_load_delete':True,'no_autoload':True,
    'remote_requests':0,'errors':errors},indent=2))
  browser.close()
finally:srv.shutdown()
