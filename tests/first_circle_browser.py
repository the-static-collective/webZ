"""First Circle 002 — mobile browser proof that a repair request gets work, not a meta task."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_GET(self):
        if self.path.startswith("/nested/webZ/"):
            self.path = self.path[len("/nested/webZ"):]
        return super().do_GET()
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/nested/webZ/first-circle/"
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,
                                  accept_downloads=True,service_workers="block")
        page = ctx.new_page()
        requests=[]; errors=[]
        page.on("request", lambda r: requests.append(r.url))
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.locator('[data-direction="need"]').click()
        page.get_by_role("button",name="Advice on fixing something").click()
        page.locator("#continue").click()
        assert "What's broken" in page.locator("#talk-title").inner_text()
        page.get_by_role("button",name="Washing machine won't drain").click()
        page.locator("#continue").click()
        page.locator("#work-section").wait_for(state="visible")
        assert "drain hose" in page.locator("#work-body").inner_text()
        assert "Make a simple invitation" not in page.locator("#card-print").inner_text()
        assert "BOUNDED" not in page.locator("#work-state").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.get_by_role("button",name="Keep on this device").click()
        assert "Saved in this browser" in page.locator("#save-state").inner_text()
        page.locator('[data-outcome="not-yet"]').click()
        page.locator("#return-note").fill("Visible hose is not kinked, need model instructions.")
        page.locator('#return-form button[type="submit"]').click()
        assert page.locator("#method-zone").is_hidden()
        page.locator('[data-outcome="worked"]').click()
        page.locator("#return-note").fill("A second safe check helped narrow the issue.")
        page.locator('#return-form button[type="submit"]').click()
        page.locator("#method-zone").wait_for(state="visible")
        page.locator("#method").click()
        assert "PROPOSAL_ONLY" in page.evaluate("JSON.parse(localStorage.getItem('abundent-first-circle-001')).method.status")
        page.reload()
        assert page.locator("#work-section").is_visible()
        assert "drain hose" in page.locator("#work-body").inner_text()
        with page.expect_download() as dl:
            page.get_by_role("button",name="Download card").click()
        payload=json.loads(pathlib.Path(dl.value.path()).read_text())
        assert payload["payload"]["schema"]=="abundent/first-circle-card/v1"
        assert payload["payload"]["work"]["status"]=="BOUNDED_GUIDE"
        assert payload["payload"]["method"]["status"]=="PROPOSAL_ONLY"
        other=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
        fresh=other.new_page()
        fresh.goto(url)
        fresh.locator("#import").set_input_files({
           "name":"first-circle.json","mimeType":"application/json",
           "buffer":json.dumps(payload).encode("utf-8")})
        fresh.locator("#work-section").wait_for(state="visible")
        assert "drain hose" in fresh.locator("#work-body").inner_text()
        assert fresh.locator("#card-origin").inner_text().startswith("Imported card")
        assert fresh.evaluate("localStorage.getItem('abundent-first-circle-001')") is None
        assert not errors, errors
        assert all(u.startswith(url) for u in requests), requests
        print(json.dumps({"schema":"webz/first-circle-useful-browser/v1",
          "mobile":True,"no_horizontal_overflow":True,"repair_not_meta":True,
          "v1_export_import":True,"local_save_reload":True,"non_success_return_blocks_method":True,
          "method_proposal_not_verified":True,"no_external_requests":True,"page_errors":errors}))
        other.close()
        browser.close()
finally:
    server.shutdown()
