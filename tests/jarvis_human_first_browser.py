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
        index_url='https://raw.githubusercontent.com/the-static-collective/JAR-VIS/main/commons/capability-index-v1.json'
        webz_url='https://raw.githubusercontent.com/the-static-collective/webZ/main/capabilities/passport.v1.json'
        relatte_url='https://raw.githubusercontent.com/the-static-collective/reLATTE/main/capabilities/passport.v1.json'
        index_data={'schema':'jarvis.capability-index/v1','version':'2026-11-04.1','reviewedOn':'2026-11-04',
          'authority':'PUBLIC_SOURCE_DIRECTORY_NOT_EXECUTION','sources':[
           {'repository':'the-static-collective/webZ','path':'capabilities/passport.v1.json'},
           {'repository':'the-static-collective/reLATTE','path':'capabilities/passport.v1.json'}]}
        webz_data=json.loads((ROOT/'capabilities/passport.v1.json').read_text())
        relatte_data={'schema':'jarvis.capability-passport/v1','repository':'the-static-collective/reLATTE',
          'version':'2026-11-04.1','authority':'PUBLIC_DESCRIPTION_ONLY_NOT_RUNTIME_OR_PERMISSION',
          'availability':'NOT_OBSERVED','capabilities':[{
           'id':'relatte.commuter','title':'Plan a consent-aware storefront-to-email connection',
           'intents':['grownby','sync email','newsletter integration'],
           'readiness':'LOCAL_LIBRARY','delivers':'A synthetic, source-owned signed crossing prototype, not a running farm or real email connection.',
           'entry':{'kind':'SOURCE_REFERENCE','href':'https://github.com/the-static-collective/reLATTE/blob/main/docs/COMMUTER-001.md'},
           'sourcePath':'docs/COMMUTER-001.md',
           'requires':'A provider account, real consent, owner policy, and a separately authorized destination adapter.',
           'contract':{'inputHint':'signed.source-event/v1','outputHint':'receiver.disposition/v1',
             'invocation':'NOT_CONNECTED_TO_JARVIS','receipt':'SIGNED_SYNTHETIC_TEST_ONLY','effect':'NO_CROSS_PROJECT_EFFECT'}}]}
        fixtures={index_url:index_data,webz_url:webz_data,relatte_url:relatte_data}
        def intercept_public_catalog(route):
            value=fixtures.get(route.request.url)
            if value is None:
                route.fulfill(status=404,content_type='text/plain',body='unavailable')
            else:
                route.fulfill(status=200,content_type='application/json',body=json.dumps(value))
        page.route('https://raw.githubusercontent.com/**',intercept_public_catalog)
        page.on('request',lambda req: sent.append((req.method,req.url)))
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
        assert "no one has been contacted" in page.locator('.wayfinder-work').inner_text().lower()
        page.locator('#wayfinder-input').fill('I want a potluck event')
        page.locator('#wayfinder-find').click()
        assert "75-minute community gathering" in page.locator('.wayfinder-result h3').inner_text()
        assert "0–10 min" in page.locator('.wayfinder-work').inner_text()
        # A real-world human offer gets immediate local work, then a relevant published tool.
        page.locator('#wayfinder-input').fill('I have extra fish to give a neighbor')
        page.locator('#wayfinder-find').click()
        assert 'I can offer:' in page.locator('.wayfinder-work').inner_text()
        page.locator('.wayfinder-passport').first.wait_for(state='visible')
        assert 'Prepare a consented surplus handoff' in page.locator('.wayfinder-passport').first.inner_text()
        assert 'live resource match' in page.locator('.wayfinder-passport').first.inner_text()
        assert page.locator('.wayfinder-passport').first.locator('a').get_attribute('href')=='./glean/'
        # No raw question string went into any browser request or URL.
        assert set(u for _,u in sent if u.startswith('https://raw.githubusercontent.com/'))<=set(fixtures)
        page.locator('#wayfinder-input').fill('My private note is for hello@example.org')
        page.locator('#wayfinder-find').click()
        assert "Keep private details private" in page.locator('.wayfinder-result h3').inner_text()
        assert "hello@example.org" not in page.locator('#wayfinder-answer').inner_text()
        page.locator('#wayfinder-input').fill('Can you book an airplane ticket?')
        page.locator('#wayfinder-find').click()
        assert "cannot verify a ready tool" in page.locator('.wayfinder-result h3').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        assert all(method=='GET' for method,_ in sent),sent
        assert all(u.startswith(url) or u in fixtures for _,u in sent),sent
        assert all('/api/' not in u and 'extra fish' not in u.lower() for _,u in sent),sent
        print(json.dumps({'schema':'webz/jarvis-human-first-browser/v1','mobile':True,
          'repair_work_on_first_answer':True,'volunteer_request_ready':True,
          'event_kit_ready':True,'private_details_not_echoed':True,
          'unknown_intent_held':True,'no_visitor_text_transmitted':True,'catalog_source_reads_are_fixed':True,
          'page_errors':errors}))
        context.close();browser.close()
finally:
    server.shutdown()
