"""Abundent newsletter: no passive data transfer; form only after explicit local consent.
This witness deliberately never submits a real visitor address to Buttondown.
"""
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
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for width in [320,1440]:
            context=browser.new_context(viewport={'width':width,'height':820},is_mobile=(width==320))
            events={'requests':[],'errors':[]}
            context.on('request',lambda req:events['requests'].append(req.url))
            page=context.new_page()
            page.on('pageerror',lambda err:events['errors'].append(str(err)))
            response=page.goto(base+'post-office/')
            assert response.status==200
            page.get_by_role('heading',name='Letters from the Field.').wait_for()
            form=page.locator('#subscribe')
            form.wait_for(state='visible')
            assert form.get_attribute('action')=='https://buttondown.com/api/emails/embed-subscribe/luv'
            assert form.get_attribute('method')=='post'
            email=page.locator('#subscriber-email')
            assert email.is_enabled()
            assert not form.evaluate('(f)=>f.checkValidity()')
            email.fill('example@example.com') # synthetic; never submitted
            assert not form.evaluate('(f)=>f.checkValidity()')
            page.get_by_label('I want to receive Letters from the Field by email.').check()
            assert form.evaluate('(f)=>f.checkValidity()')
            assert page.locator('#post-office-status').inner_text().startswith('SUBSCRIPTIONS OPEN')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert page.evaluate('localStorage.length+sessionStorage.length')==0
            page.goto(base+'post-office/archive/')
            assert page.get_by_text('ISSUE 000').count()>0
            page.goto(base+'post-office/archive/000/')
            assert page.get_by_text('NOT EMAILED').count()>0
            assert not events['errors'],events['errors']
            assert all(urlparse(u).netloc==urlparse(base).netloc for u in events['requests']),events['requests']
            context.close()
        context=browser.new_context(java_script_enabled=False,viewport={'width':320,'height':820})
        page=context.new_page()
        response=page.goto(base+'post-office/')
        assert response.status==200
        assert page.locator('#subscribe').is_hidden()
        assert page.locator('#waiting').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        context.close()
        browser.close()
    print(json.dumps({'schema':'abundent/post-office-browser-witness/v0','buttondownUsername':'luv',
    'mobileWidth':320,'desktopWidth':1440,'requiredConsent':True,'submissionPerformed':False,
    'thirdPartyPassiveRequests':0,'localSubscriberStorage':0,'noJSHolds':True},indent=2))
finally:
    server.shutdown();server.server_close()
