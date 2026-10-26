"""WEBZ-036 — test the seed nursery in actual Chromium with strict local-only behavior."""
import json, os, pathlib, threading
from urllib.parse import urlparse
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright,expect

ROOT=pathlib.Path(__file__).resolve().parents[1]
SITE=pathlib.Path(os.environ.get('WEBZ_TEST_SITE',ROOT))
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(SITE),**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in (1280,320):
   ctx=browser.new_context(viewport={'width':width,'height':880},accept_downloads=True,service_workers='block',reduced_motion='reduce')
   pg=ctx.new_page()
   errs=[];reqs=[]
   pg.on('pageerror',lambda e:errs.append(str(e)))
   pg.on('request',lambda request:reqs.append(request.url))
   r=pg.goto(base+'/becoming/')
   assert r.status==200
   expect(pg.get_by_role('link',name='Explore the unformed organizations')).to_be_visible()
   pg.get_by_role('link',name='Explore the unformed organizations').click()
   expect(pg.get_by_role('heading',level=1)).to_contain_text("Doors into organizations")
   expect(pg.locator('#seed-count')).to_contain_text('6 of 6 unformed seed ideas')
   assert pg.locator('.seed-card').count()==6
   pg.locator('#search').fill('repair')
   expect(pg.locator('#seed-count')).to_contain_text('1 of 6')
   pg.locator('#search').fill('')
   pg.locator('.seed-card button').first.click()
   expect(pg.locator('#seed-state')).to_contain_text('UNFORMED')
   expect(pg.locator('#chosen-title')).to_have_text('The Garden Table')
   assert pg.locator('#charter-name').input_value()=='The Garden Table'
   assert pg.locator('#draft').is_hidden()
   pg.locator('#prepare').click()
   expect(pg.locator('#form-note')).to_contain_text('Review the proposal-only')
   assert pg.locator('#draft').is_hidden()
   pg.locator('#understand').check()
   pg.locator('#prepare').click()
   expect(pg.locator('#draft')).to_be_visible()
   expect(pg.locator('#draft-text')).to_contain_text('DOES NOT EXIST')
   with pg.expect_download() as saved:
    pg.locator('#save-json').click()
   card=json.loads(pathlib.Path(saved.value.path()).read_text())
   assert card['schema']=='webz/organization-seed-sheet/v1'
   assert card['status']=='UNFORMED_CANDIDATE'
   assert card['proposalOnly'] is True
   assert card['authority']['level']=='none'
   assert 'membership' in card['authority']['doesNotGrant']
   assert not any(k in card for k in ('phone','email','username','participant','password','owner'))
   pg.locator('#charter-name').fill('Another possible garden')
   assert pg.locator('#draft').is_hidden()
   pg.locator('#prepare').click()
   expect(pg.locator('#draft')).to_be_visible()
   expect(pg.locator('#draft-text')).to_contain_text('Another possible garden')
   pg.locator('#open-blank').click()
   expect(pg.locator('#chosen-title')).to_have_text('The Unnamed Chair')
   assert pg.locator('#charter-name').input_value()==''
   pg.locator('#charter-name').fill('Unnamed Repair Circle')
   pg.locator('#charter-why').fill('Try helping neighbors understand a repair option.')
   pg.locator('#charter-act').fill('Draft one safe repair card with fictional details.')
   pg.locator('#charter-question').fill('What permission would be required?')
   pg.locator('#charter-proof').fill('An independently reviewed card or an explicit no.')
   pg.locator('#understand').check()
   pg.locator('#prepare').click()
   expect(pg.locator('#draft')).to_be_visible()
   with pg.expect_download() as saved_md:
    pg.locator('#save-md').click()
   assert 'Unnamed Repair Circle' in pathlib.Path(saved_md.value.path()).read_text()
   assert pg.evaluate('localStorage.length + sessionStorage.length')==0
   assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
   assert not errs,errs
   assert all(urlparse(u).netloc==urlparse(base).netloc for u in reqs),reqs
   if (SITE/'for-computers/organizations/index.json').exists():
    machine_response=pg.goto(base+'/for-computers/organizations/index.json')
    assert machine_response.status==200
    machine=json.loads(pg.locator('body').inner_text())
    assert machine['status']=='PROPOSAL_ONLY' and len(machine['entries'])==6
    mf_response=pg.goto(base+'/for-computers/organizations/manifest.json')
    assert mf_response.status==200
    manifest=json.loads(pg.locator('body').inner_text())
    assert len(manifest['fragments'])==6 and manifest['organization_contract']['established'] is False
   ctx.close()
   results.append({'width':width,'seeds':6,'consentGate':True,'localExport':True,'status':'UNFORMED_CANDIDATE'})
  browser.close()
 print(json.dumps({'schema':'webz/organization-doors-browser/v1','results':results},indent=2))
finally:
 server.shutdown()
