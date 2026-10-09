"""Wandering Lens 002: real Chromium proposal/review/annex, nested base and privacy."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        if self.path.startswith('/nested/webZ/'):
            self.path=self.path[len('/nested/webZ'):]
        super().do_GET()
    def log_message(self,*args):pass

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
        page=context.new_page()
        errors=[];outside=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:outside.append(r.url) if not (r.url.startswith(base) or r.url.startswith('blob:')) else None)
        page.goto(base+'worlds/wandering-lens/')
        page.get_by_role('heading',name='Let the world grow—without rewriting its source.').wait_for()
        assert page.locator('#annex-propose').is_disabled()
        assert page.locator('#visitor-hotspots button').count()==0
        assert page.evaluate('localStorage.length')==0

        # Held source is the only legitimate starting point.
        page.locator('#answer').fill('I see a possible companion automaton.')
        page.locator('#hold-answer').click()
        page.wait_for_function("()=>document.querySelector('#annex-count').textContent.includes('1 held reflection')")
        page.locator('#annex-title-input').fill('A Gentle Counterpart')
        page.locator('#annex-detail').fill('An imagined companion, not part of the source artwork.')
        page.locator('#annex-propose').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('1 proposals')")
        assert 'PENDING' in page.locator('#annex-queue').inner_text()
        assert page.locator('#visitor-hotspots button').count()==0
        assert not page.locator('#annex-queue').get_by_text('Admit to local annex').is_visible() if page.locator('#annex-queue').get_by_text('Admit to local annex').count() else True

        # Inspect is a different action. The original reflection can be read.
        page.get_by_role('button',name='Inspect proposal').click()
        page.wait_for_function("()=>document.querySelector('#annex-queue').textContent.includes('INSPECTED')")
        assert 'I see a possible companion automaton.' in page.locator('#annex-queue').inner_text()
        assert page.locator('#visitor-hotspots button').count()==0
        page.get_by_role('button',name='Hold for later').click()
        page.wait_for_function("()=>document.querySelector('#annex-queue').textContent.includes('HOLD')")
        assert page.locator('#visitor-hotspots button').count()==0
        page.get_by_role('button',name='Inspect proposal').click()
        page.wait_for_function("()=>document.querySelector('#annex-queue').textContent.includes('INSPECTED')")
        page.get_by_role('button',name='Admit to local annex').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('1 local admits')")
        assert page.locator('#visitor-hotspots button').count()==1
        assert page.locator('#hotspots button').count()==11
        assert 'LOCALLY ADMITTED' in page.locator('#annex-queue').inner_text()
        assert page.evaluate('localStorage.length')==0

        # A second independent proposal is a world sketch, not an authenticated new world.
        page.locator('#annex-kind').select_option('WORLD_SKETCH')
        page.locator('#annex-title-input').fill('The Side Orchard')
        page.locator('#annex-detail').fill('A locally navigable, unsanctioned visitor sketch.')
        page.locator('#annex-propose').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('2 proposals')")
        sketch=page.locator('article[data-proposal="wl2-002"]')
        assert 'PENDING' in sketch.inner_text()
        assert not sketch.get_by_role('button',name='Enter local world sketch').count()
        sketch.get_by_role('button',name='Inspect proposal').click()
        page.wait_for_function("()=>document.querySelector('article[data-proposal=\"wl2-002\"]').textContent.includes('INSPECTED')")
        sketch.get_by_role('button',name='Refuse locally').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('1 refusals')")
        assert not sketch.get_by_role('button',name='Enter local world sketch').count()
        assert page.locator('#visitor-hotspots button').count()==1

        # Another world sketch admitted through its own inspection acquires only a local address.
        page.locator('#annex-title-input').fill('A Nested Library')
        page.locator('#annex-detail').fill('An imagined branch held in visitor custody.')
        page.locator('#annex-propose').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('3 proposals')")
        third=page.locator('article[data-proposal="wl2-003"]')
        third.get_by_role('button',name='Inspect proposal').click()
        page.wait_for_function("()=>document.querySelector('article[data-proposal=\"wl2-003\"]').textContent.includes('INSPECTED')")
        third.get_by_role('button',name='Admit to local annex').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('2 local admits')")
        third.get_by_role('button',name='Enter local world sketch').click()
        assert 'MWF1/t06g06/t06g06' in page.locator('#address').inner_text()
        assert page.locator('#audio').evaluate('(a)=>a.paused')

        # Review joined export, erase source, import requires a separate restore.
        page.locator('#annex-review-export').click()
        page.locator('#annex-export-preview').wait_for(state='visible')
        record=json.loads(page.locator('#annex-export-preview').inner_text())
        assert record['published'] is False
        assert record['signed'] is False
        assert [e['kind'] for e in record['payload']['annex']['events']].count('INSPECT')==4
        assert record['payload']['annex']['proposals'][2]['kind']=='WORLD_SKETCH'
        page.locator('#erase').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('0 proposals')")
        assert page.locator('#visitor-hotspots button').count()==0

        page.locator('#annex-import').set_input_files({
            'name':'visitor-private.json','mimeType':'application/json','buffer':json.dumps(record).encode()
        })
        page.wait_for_function("()=>!document.querySelector('#annex-restore').hidden")
        assert '0 proposals' in page.locator('#annex-summary').inner_text()
        page.locator('#annex-restore').click()
        page.wait_for_function("()=>document.querySelector('#annex-summary').textContent.includes('3 proposals')")
        assert page.locator('#visitor-hotspots button').count()==1
        assert '1 visitor reflections' in page.locator('#trace-status').inner_text()

        counterfeit=json.loads(json.dumps(record))
        counterfeit['payload']['annex']['events'][1]['decision']='REFUSE'
        page.locator('#annex-import').set_input_files({
            'name':'counterfeit.json','mimeType':'application/json','buffer':json.dumps(counterfeit).encode()
        })
        page.wait_for_function("()=>document.querySelector('#annex-import-preview').textContent.includes('REJECTED')")
        assert page.locator('#annex-restore').is_hidden()
        assert '3 proposals' in page.locator('#annex-summary').inner_text()

        # Closing/reloading only preserves exact URL address, not private ideas.
        page.reload()
        assert '0 proposals' in page.locator('#annex-summary').inner_text()
        assert '0 visitor reflections' in page.locator('#trace-status').inner_text()
        assert page.locator('#visitor-hotspots button').count()==0
        assert 'MWF1/t06g06/t06g06' in page.locator('#address').inner_text()
        assert page.evaluate('localStorage.length')==0
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not outside,outside
        assert not errors,errors
        print(json.dumps({
            'schema':'webz/wandering-lens-annex-browser/v0',
            'browser':'Chromium','mobile_390px':True,'nested_base':True,
            'inspection_required':True,'hold_then_reinspect':True,
            'refusal_preserved':True,'locally_admitted_overlay':True,
            'visitor_world_child_address':True,
            'private_round_trip':True,'tamper_refused':True,
            'source_original_objects':11,'no_external_requests':True,
            'no_default_persistence':True,'errors':errors
        },indent=2))
        browser.close()
finally:
    server.shutdown()
