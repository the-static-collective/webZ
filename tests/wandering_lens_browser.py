"""Playwright witness for a portrait scene and locally held question traces.
Uses synthetic, non-user media; no private original files leave the user's device.
"""
import base64
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
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
out=ROOT/'evidence/browser'
out.mkdir(parents=True,exist_ok=True)
errors=[];external=[]
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
        page=context.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:external.append(r.url) if not r.url.startswith(base) else None)
        page.goto(base+'worlds/wandering-lens/')
        page.get_by_role('heading',name='There is more inside.').wait_for()
        assert page.get_by_role('heading',name='The Miracle Automaton').is_visible()
        ratio=page.locator('#room').evaluate('(e)=>getComputedStyle(e).aspectRatio')
        assert ratio=='1404 / 1536',ratio
        assert page.evaluate('localStorage.length')==0
        assert page.locator('#hotspots button').count()==11
        assert page.locator('#audio').evaluate('(a)=>a.paused')
        assert 'MWF1/t06g06' in page.locator('#address').inner_text()

        # The question organ asks. It never silently answers or saves.
        page.locator('#answer').fill('A visitor notices a lantern; this is not evidence.')
        page.get_by_role('button',name='Hold reflection locally').click()
        assert '1 visitor reflections' in page.locator('#trace-status').inner_text()
        assert page.locator('#answer').input_value()==''
        assert page.evaluate('localStorage.length')==0
        page.get_by_role('button',name='Review export').click()
        page.locator('#export-preview').wait_for(state='visible')
        document=json.loads(page.locator('#export-preview').inner_text())
        assert document['signed'] is False and document['published'] is False
        assert document['record']['entries'][0]['attribution']=='UNVERIFIED_VISITOR_REFLECTION'
        assert document['record']['entries'][0]['address']=='MWF1/t06g06'

        # One physical particular, one deliberate focus. No new answer or stream.
        page.get_by_role('button',name='Inspect The Camera').click()
        assert page.get_by_role('heading',name='The Camera').is_visible()
        assert page.locator('#audio').evaluate('(a)=>a.paused')
        assert 'MWF1/t04g06' in page.locator('#address').inner_text()
        page.get_by_role('button',name='Enter this particular').click()
        assert 'MWF1/t04g06/t06g06' in page.locator('#address').inner_text()
        page.locator('#rise').click()
        assert 'MWF1/t04g06' in page.locator('#address').inner_text()

        # Non-user synthetic media is read via in-browser object URL, never uploaded.
        png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ewAAAABJRU5ErkJggg==')
        page.locator('#image-input').set_input_files({
            'name':'test-only.png','mimeType':'image/png','buffer':png})
        page.wait_for_function("()=>document.querySelector('#image-status').textContent.includes('Local file')")
        assert 'source not matched' in page.locator('#image-status').inner_text()
        assert not page.locator('#scene-image').is_hidden()
        page.locator('#audio-input').set_input_files({
            'name':'synthetic.mp3','mimeType':'audio/mpeg','buffer':b'not-real-audio-bits'})
        page.wait_for_function("()=>document.querySelector('#audio-status').textContent.includes('Local file')")
        assert page.locator('#audio').evaluate('(a)=>a.paused')
        assert page.evaluate('localStorage.length')==0

        # The reviewed JSON import must have separate, explicit restore.
        page.get_by_role('button',name='Erase journal').click()
        assert '0 visitor reflections' in page.locator('#trace-status').inner_text()
        page.locator('#import-file').set_input_files({
            'name':'local.json','mimeType':'application/json','buffer':json.dumps(document).encode()})
        page.wait_for_function("()=>!document.querySelector('#restore').hidden")
        assert '0 visitor reflections' in page.locator('#trace-status').inner_text()
        page.get_by_role('button',name='Restore inspected journal').click()
        assert '1 visitor reflections' in page.locator('#trace-status').inner_text()
        tampered=json.loads(json.dumps(document))
        tampered['record']['entries'][0]['question']='fabricated evidence'
        page.locator('#import-file').set_input_files({
            'name':'tampered.json','mimeType':'application/json','buffer':json.dumps(tampered).encode()})
        page.wait_for_function("()=>document.querySelector('#import-preview').textContent.includes('REJECTED')")
        assert page.locator('#restore').is_hidden()

        page.screenshot(path=str(out/'wandering-lens-mobile.png'),full_page=True)
        page.reload()
        assert '0 visitor reflections' in page.locator('#trace-status').inner_text()
        assert page.locator('#scene-image').is_hidden()
        assert page.locator('#audio').evaluate('(a)=>a.paused')
        assert page.evaluate('localStorage.length')==0
        assert 'MWF1/t04g06' in page.locator('#address').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors,errors
        assert not external,external
        print(json.dumps({
           'status':'WANDERING_LENS_BROWSER_VERIFIED',
           'nested_base':True,'portrait_geometry':True,
           'objects':11,'manual_media':True,'no_external_requests':True,
           'private_trace_default':True,'tamper_refused':True,
           'restored_address_only':True,'page_errors':errors
        },indent=2))
        browser.close()
finally:
    server.shutdown()
