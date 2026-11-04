"""HUMAN FIRST 005 — browser proof for immediate local prepared work."""
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
url=f'http://127.0.0.1:{server.server_port}/nested/webZ/'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,
            service_workers='block')
        page=context.new_page()
        sent=[];errors=[]
        page.on('request',lambda req: sent.append(req.url))
        page.on('pageerror',lambda err: errors.append(str(err)))
        page.goto(url)
        assert page.locator('#wayfinder-input').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        # A single sentence is enough. It does not turn into an invitation to make an invitation.
        page.locator('#wayfinder-input').fill("My phone won't charge")
        page.locator('#wayfinder-find').click()
        assert "known-working outlet" in page.locator('.wayfinder-work').inner_text()
        assert "SOMETHING YOU CAN USE NOW" in page.locator('.wayfinder-state').inner_text()
        assert "Copy the useful part" in page.locator('#wayfinder-answer').inner_text()
        assert "What existing machinery helped?" in page.locator('#wayfinder-answer').inner_text()
        page.locator('#wayfinder-input').fill('I need volunteers to set up chairs at a community meal Friday')
        page.locator('#wayfinder-find').click()
        assert "Could someone help" in page.locator('.wayfinder-work').inner_text()
        assert "No one has been contacted" in page.locator('.wayfinder-work').inner_text()
        page.locator('#wayfinder-input').fill('I want a potluck event')
        page.locator('#wayfinder-find').click()
        assert "75-minute community gathering" in page.locator('.wayfinder-result h3').inner_text()
        assert "0–10 min" in page.locator('.wayfinder-work').inner_text()
        page.locator('#wayfinder-input').fill('My private note is for hello@example.org')
        page.locator('#wayfinder-find').click()
        assert "Keep private details private" in page.locator('.wayfinder-result h3').inner_text()
        assert "hello@example.org" not in page.locator('#wayfinder-answer').inner_text()
        page.locator('#wayfinder-input').fill('Can you book an airplane ticket?')
        page.locator('#wayfinder-find').click()
        assert "cannot verify a ready tool" in page.locator('.wayfinder-result h3').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        assert all(x.startswith(url) for x in sent),sent
        assert all('/api/' not in x for x in sent),sent
        print(json.dumps({'schema':'webz/jarvis-human-first-browser/v1','mobile':True,
          'repair_work_on_first_answer':True,'volunteer_request_ready':True,
          'event_kit_ready':True,'private_details_not_echoed':True,
          'unknown_intent_held':True,'zero_external_requests':True,
          'page_errors':errors}))
        context.close();browser.close()
finally:
    server.shutdown()
