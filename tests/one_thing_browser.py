"""ONE THING 006 — phone-sized, offline and voluntary resource quest smoke test."""
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
        return super().do_GET()
    def log_message(self,*args):
        pass

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},
                                    device_scale_factor=1,service_workers='block',
                                    accept_downloads=True)
        page=context.new_page()
        requests=[];errors=[]
        page.on('request',lambda r: requests.append(r.url))
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.goto(base+'one-thing/')
        assert page.locator('#make').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert page.evaluate("localStorage.getItem('abundent.one-thing:v1')") is None

        page.locator('#thing').fill('Spare working screwdriver set')
        page.locator('#make').click()
        assert page.locator('#quest').is_visible()
        assert page.locator('#steps .step').count()==3
        assert 'Find it and check' in page.locator('#steps .step').first.inner_text()
        assert '0 / 3' in page.locator('#progress-status').inner_text()
        assert page.evaluate("localStorage.getItem('abundent.one-thing:v1')") is None

        url=page.locator('#make-invitation').get_attribute('href')
        assert '/invites/#i=' in url
        public_url=page.locator('#review-public').get_attribute('href')
        assert '/invites/network/#i=' in public_url
        invite=context.new_page()
        invite.on('request',lambda r: requests.append(r.url))
        invite.on('pageerror',lambda e: errors.append(str(e)))
        invite.goto(url)
        assert invite.locator('#invitation-panel').is_visible()
        assert 'screwdriver' in invite.locator('#invite-message').inner_text().lower()
        assert 'self-declared' in invite.locator('#invite-when').inner_text().lower()
        invite.close()

        page.locator('#steps .step').first.locator('button').click()
        assert '1 / 3' in page.locator('#progress-status').inner_text()
        page.locator('[data-outcome="not-yet"]').click()
        page.locator('#outcome-note').fill('Tool checked and ready, but not delivered.')
        page.locator('#make-report').click()
        assert 'Not yet' in page.locator('#report').inner_text()
        assert 'Unverified personal record' in page.locator('#report').inner_text()
        page.locator('#keep').click()
        assert page.evaluate("JSON.parse(localStorage.getItem('abundent.one-thing:v1')).done.length") == 1
        page.reload()
        assert page.locator('#quest').is_visible()
        assert '1 / 3' in page.locator('#progress-status').inner_text()

        with page.expect_download() as download:
            page.locator('#make-report').click()
            page.locator('#save-report').click()
        report=pathlib.Path(download.value.path()).read_text()
        assert 'Unverified personal record' in report

        page.locator('#reset').click()
        assert page.locator('#quest').is_hidden()
        assert page.evaluate("localStorage.getItem('abundent.one-thing:v1')") is None
        page.locator('#thing').fill('jane@example.org')
        page.locator('#make').click()
        assert 'Remove contact details' in page.locator('#entry-status').inner_text()
        assert page.locator('#quest').is_hidden()
        page.locator('[data-kind="food"]').click()
        page.locator('#examples button').first.click()
        page.locator('#make').click()
        assert 'food-safety' in page.locator('#steps').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        assert requests and all(url.startswith(base) for url in requests),requests
        context.close();browser.close()
        print(json.dumps({'schema':'webz/one-thing-phone-proof/v1',
                          'working_first_step':True,'opt_in_save':True,
                          'honest_return':True,'cross_device_invitation_link':True,
                          'privacy_hold':True,'no_external_requests':True,
                          'mobile':True,'errors':errors}))
finally:
    server.shutdown()
