"""Read-only actual crossing receipt browser witness: no live executor, no external requests."""
import json, pathlib, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def do_GET(self):
        if self.path.startswith('/nested/webZ/'):self.path=self.path[len('/nested/webZ'):]
        return super().do_GET()
    def log_message(self,*args):pass

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for prefix in ('/','/nested/webZ/'):
            context=browser.new_context(viewport={'width':320,'height':780},is_mobile=True,has_touch=True)
            errors=[];requests=[]
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:requests.append(r.url))
            response=page.goto(origin+prefix+'workshop/receipts/')
            assert response.status==200
            page.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('Archived')")
            assert page.locator('.step').count()==4
            assert page.locator('#fields .row').count()==7
            assert page.get_by_text('One real job.').count()>=1
            assert 'HOLD' in page.locator('#status').inner_text()
            assert page.locator('script[src="./reader.mjs"]').count()==1
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.url
            assert not errors,errors
            assert all(url.startswith(origin+prefix) for url in requests),requests
            assert page.get_by_role('link',name='Inspect original GitHub Actions run').get_attribute('href')=='https://github.com/the-static-collective/CANNON/actions/runs/38134430085'
            # A forged public summary displays HOLD rather than trusted claims.
            context.route('**/branch-work-009.json',lambda route:route.fulfill(status=200,content_type='application/json',body='{}'))
            page.reload()
            page.wait_for_function("()=>document.querySelector('#status').textContent.startsWith('HOLD')")
            assert page.locator('.step').count()==0
            context.close()
        browser.close()
    print(json.dumps({'schema':'abundent/branch-receipt-browser-witness/v0',
        'root_and_nested_scopes':True,'no_external_requests':True,
        'tampered_archived_report':'HOLD','mobile_width':320,'live_execution':False},indent=2))
finally:
    server.shutdown();server.server_close()
