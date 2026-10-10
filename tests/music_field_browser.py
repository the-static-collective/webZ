"""Mobile Chromium witness for 4-source Music Field and manual IndexedDB custody."""
import json,pathlib,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
  super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];external=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:external.append(r.url) if not (r.url.startswith(base.split('/nested/webZ/')[0]) or r.url.startswith('blob:')) else None)
  page.goto(base+'worlds/music-field/')
  page.get_by_role('heading',name='One library. Four doors.').wait_for()
  assert page.locator('#count-all').inner_text()=='0'
  assert page.locator('#snapshots option').count()==1
  # A deliberate real-song metadata admission; no media or network requests.
  page.locator('#load-first-capsule').click()
  assert page.locator('#count-all').inner_text()=='1'
  assert page.locator('#count-suno').inner_text()=='1'
  assert 'Let It Find Us' in page.locator('#records').inner_text()
  assert 'suno:G0cLbwecX7g0qFUB' in page.locator('#records').inner_text()
  assert 'No audio imported, played or saved' in page.locator('#status').inner_text()
  # The fourth provider can coexist without inferred equivalence.
  page.locator('#import-platform').select_option('AUDIUS')
  page.locator('#files').set_input_files({'name':'audius.json','mimeType':'application/json','buffer':
    json.dumps([{'source_id':'D7KyD','title':'Other Artist Recording','artist':'An Audius Artist',
      'source_url':'https://audius.co/artist/other-recording'}]).encode()})
  page.wait_for_function("()=>document.querySelector('#count-all').textContent==='2'")
  assert page.locator('#count-audius').inner_text()=='1'
  assert 'audius:D7KyD' in page.locator('#records').inner_text()
  assert '0 user-declared' in page.locator('#relations').inner_text()
  page.locator('#clear').click()
  assert page.locator('#count-all').inner_text()=='0'
  page.locator('#demo').click()
  assert page.locator('#count-all').inner_text()=='36'
  assert [page.locator('#count-'+provider).inner_text() for provider in ['suno','bandcamp','youtube']]==['12','12','12']
  assert page.locator('#timeline svg').count()==1
  assert page.locator('#graph svg').count()==1
  assert 'FICTIONAL EXAMPLE' in page.locator('#records').inner_text()

  page.locator('#platform').select_option('YOUTUBE')
  assert page.locator('#view-address').inner_text().find('/pYOUTUBE/')!=-1
  page.locator('#tuning').evaluate("(e)=>{e.value='2';e.dispatchEvent(new Event('input',{bubbles:true}))}")
  assert page.locator('#t-label').inner_text()=='02 / 11'
  page.locator('#grain').evaluate("(e)=>{e.value='1';e.dispatchEvent(new Event('input',{bubbles:true}))}")
  assert page.locator('#g-label').inner_text()=='01 / 11'
  page.locator('#enter').click()
  assert '/t02g01/t01g06' in page.locator('#view-address').inner_text()
  page.locator('#rise').click()
  assert page.locator('#view-address').inner_text().endswith('/t02g01')

  # Three independent operator-selected metadata sources.
  page.locator('#clear').click()
  assert page.locator('#count-all').inner_text()=='0'
  def importfile(provider,name,blob):
   page.locator('#import-platform').select_option(provider)
   page.locator('#files').set_input_files({'name':name,'mimeType':'application/json','buffer':json.dumps(blob).encode()})
  importfile('SUNO','suno.json',[{'id':'clip0123','title':'A Private Draft','style':'folk,ambient',
                                   'url':'https://suno.com/song/abcde123456'}])
  page.wait_for_function("()=>document.querySelector('#count-all').textContent==='1'")
  importfile('BANDCAMP','bandcamp.json',[{'id':'track0001','title':'A Bandcamp Release',
   'artist':'Example Artist','album':'First Album','tags':['folk','ambient'],
   'url':'https://artist.bandcamp.com/album/first-album'}])
  page.wait_for_function("()=>document.querySelector('#count-all').textContent==='2'")
  importfile('YOUTUBE','youtube.json',{'items':[{'id':'playlistItem345',
   'contentDetails':{'videoId':'abcDEF12345'},
   'snippet':{'title':'Video Companion','videoOwnerChannelTitle':'Example Channel',
    'resourceId':{'videoId':'abcDEF12345'}}}]})
  page.wait_for_function("()=>document.querySelector('#count-all').textContent==='3'")
  assert [page.locator('#count-'+provider).inner_text() for provider in ['suno','bandcamp','youtube']]==['1','1','1']
  assert page.locator('#records a').count()==3
  assert page.locator('#timeline svg').count()==1
  assert page.locator('#graph svg').count()==1
  before=page.locator('#view-address').inner_text()
  assert page.locator('#snapshots option').count()==1
  page.locator('#snapshot-name').fill('Three Sources')
  page.locator('#save').click()
  page.wait_for_function("()=>document.querySelector('#status').textContent.includes('Saved 3 metadata records')")
  assert page.locator('#snapshots option').count()==2
  page.locator('#clear').click()
  assert page.locator('#count-all').inner_text()=='0'
  page.locator('#snapshots').select_option('Three Sources')
  page.locator('#load').click()
  page.wait_for_function("()=>document.querySelector('#count-all').textContent==='3'")
  assert page.locator('#view-address').inner_text()==before
  # Conflict import cannot replace an existing original.
  importfile('SUNO','bad.json',[{'id':'clip0123','title':'Attempted Replacement'}])
  page.wait_for_function("()=>document.querySelector('#status').textContent.includes('SOURCE_CONFLICT')")
  assert page.locator('#count-all').inner_text()=='3'

  # Browser reload keeps no active in-memory index, despite previously saved snapshot.
  page.reload()
  assert page.locator('#count-all').inner_text()=='0'
  page.wait_for_function("()=>document.querySelectorAll('#snapshots option').length===2")
  page.locator('#snapshots').select_option('Three Sources')
  page.locator('#load').click()
  page.wait_for_function("()=>document.querySelector('#count-all').textContent==='3'")
  page.locator('#delete').click()
  page.wait_for_function("()=>document.querySelectorAll('#snapshots option').length===1")
  assert page.locator('#count-all').inner_text()=='3'
  assert page.evaluate('document.querySelectorAll("audio,iframe").length')==0
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  assert not errors,errors
  assert not external,external
  print(json.dumps({'schema':'webz/music-field-browser-witness/v0','mobile_390':True,
   'providers':4,'actual_imported_records':3,'synthetic_demo':True,
   'nested_address':True,'provider_qualified':True,'timeline_and_graph':True,
   'conflict_refusal':True,'opt_in_local_save_restore_delete':True,
   'no_external_requests':True,'no_autoplay':True,'browser_errors':errors},indent=2))
  browser.close()
finally:server.shutdown()
