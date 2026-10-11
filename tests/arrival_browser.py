"""ABUNDENT crossing 001: actual browser signature verification and manual A -> B carrier."""
import json
import pathlib
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
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
origin=f'http://127.0.0.1:{server.server_port}'
cases=[]
try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True)
        for prefix in ('/','/nested/webZ/'):
            requests=[]
            errors=[]
            a_ctx=browser.new_context(viewport={'width':390,'height':800},accept_downloads=True)
            b_ctx=browser.new_context(viewport={'width':320,'height':800},accept_downloads=True)
            for ctx in (a_ctx,b_ctx):
                ctx.on('request',lambda req:requests.append(req.url))
            a=a_ctx.new_page()
            b=b_ctx.new_page()
            for page in (a,b):page.on('pageerror',lambda e:errors.append(str(e)))
            a.goto(origin+prefix+'arrivals/')
            assert a.locator('#export').is_disabled()
            a.locator('#inspect').click()
            a.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('VERIFIED')")
            observed=json.loads(a.locator('#report').inner_text())
            assert observed['authority']=='EXPERIMENT_KEY_ONLY'
            assert observed['owner_signature']=='NOT_PRESENT'
            assert observed['receipt']=='NOT_ISSUED'
            with a.expect_download() as d:a.locator('#export').click()
            parcel=pathlib.Path(d.value.path()).read_bytes()
            raw=json.loads(parcel)
            assert raw['crossing']['crossing_id']==observed['crossing_id']
            a.close();a_ctx.close()
            b.goto(origin+prefix+'arrivals/gro/')
            assert b.locator('#hold').is_disabled()
            b.locator('#parcel').set_input_files({'name':'arrival.json','mimeType':'application/json','buffer':parcel})
            b.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('VERIFIED')")
            assert b.locator('#hold').is_enabled()
            assert b.locator('#export').is_disabled()
            b.locator('#hold').click()
            assert 'LOCAL HOLD RECORDED' in b.locator('#status').inner_text()
            with b.expect_download() as d:b.locator('#export').click()
            local=json.loads(pathlib.Path(d.value.path()).read_text())
            assert local['crossing_id']==raw['crossing']['crossing_id']
            assert local['decision']=='HOLD' and local['relatte_receipt_issued'] is False
            assert local['authority']=='browser-local-observation-only'
            forged=json.loads(parcel)
            forged['source']['content']=forged['source']['content'].replace('admitted','proposed')
            b.locator('#parcel').set_input_files({'name':'forged.json','mimeType':'application/json','buffer':json.dumps(forged).encode()})
            b.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('REJECTED')")
            assert b.locator('#hold').is_disabled() and b.locator('#export').is_disabled()
            assert b.locator('#observation').inner_text()=='No local decision.'
            assert b.evaluate('localStorage.length+sessionStorage.length')==0
            assert b.evaluate('document.documentElement.scrollWidth<=innerWidth')
            assert not errors, errors
            assert all(urlparse(req).netloc==urlparse(origin).netloc for req in requests),requests
            cases.append({'scope':prefix,'source_verified':True,'independent_import':True,
                'original_source_recovered':True,'local_hold_unsigned':True,
                'tamper_rejected':True,'third_party_requests':0})
            b.close();b_ctx.close()
        browser.close()
    print(json.dumps({'schema':'webz/arrival-crossing-browser-witness/v0','cases':cases},indent=2))
finally:
    server.shutdown()
    server.server_close()
