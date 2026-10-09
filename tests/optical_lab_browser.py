"""SKYMIRROR × webZ static first-visit/offline/synthetic-gate browser witness.

This test does NOT claim physical camera light capture.
"""
import pathlib
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.startswith('/nested/webZ/'):
            self.path = self.path[len('/nested/webZ'):]
        return super().do_GET()

    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/nested/webZ/'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()
        page_errors = []
        outgoing = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('request', lambda request: outgoing.append(request.url))

        page.goto(base)
        page.wait_for_function("() => navigator.serviceWorker.controller !== null", timeout=15000)
        page.get_by_role('link', name='Optical laboratory', exact=True).click()
        page.get_by_role('heading', name='SKYMIRROR 002').wait_for()
        assert page.url.endswith('/labs/skymirror/')
        assert page.locator('#webz-review').is_disabled()

        page.get_by_role('button', name='3 / Simulate').click()
        page.get_by_role('button', name='Run deterministic simulation').click()
        page.wait_for_function("() => document.querySelector('#sim-result').textContent.includes('VALID')")
        assert page.locator('#webz-review').is_disabled()
        assert page.locator('#webz-download').is_hidden()
        assert page.evaluate("() => localStorage.length") == 0

        page.wait_for_function("""async () => {
          const urls = [];
          for (const name of await caches.keys()) {
            for (const request of await (await caches.open(name)).keys()) urls.push(request.url);
          }
          return ['labs/skymirror/','labs/skymirror/protocol.mjs',
                  'labs/skymirror/webz-bridge.mjs','app/optical-observation.mjs']
                 .every(path => urls.some(url => url.endsWith(path)));
        }""", timeout=15000)

        context.set_offline(True)
        page.reload()
        page.get_by_role('heading', name='SKYMIRROR 002').wait_for()
        page.get_by_role('button', name='3 / Simulate').click()
        page.get_by_role('button', name='Run deterministic simulation').click()
        page.wait_for_function("() => document.querySelector('#sim-result').textContent.includes('VALID')")
        assert page.locator('#webz-review').is_disabled()
        assert page.locator('#webz-download').is_hidden()
        assert page.evaluate("() => localStorage.length") == 0
        assert not page_errors, page_errors
        assert all(url.startswith(base) for url in outgoing), outgoing
        print('webZ SKYMIRROR offline browser gate PASS; synthetic != camera != admission')
        browser.close()
finally:
    server.shutdown()
