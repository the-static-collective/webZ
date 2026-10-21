"""ABUNDENT FIELD 001 — real browser test of card → print → local return."""
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
        super().do_GET()
    def log_message(self, *args):
        pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/nested/webZ/field/cards/"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,accept_downloads=True)
        page=context.new_page()
        errors, requests=[],[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.on("request",lambda request:requests.append(request.url))
        page.goto(base)
        page.get_by_role("heading",name="Common goods. Local hands.").wait_for()
        assert page.locator("#count").inner_text()=="34 of 34 seed cards"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert "PREVIEW" in page.locator("#release-warning").inner_text()
        assert page.locator("#qr-preview img, #qr-preview canvas").count()>=1

        page.locator("#query").fill("THE GROWER")
        assert page.locator("#count").inner_text()=="1 of 34 seed cards"
        page.locator("#cards button").first.click()
        assert "THE GROWER" in page.locator("#active").inner_text()
        assert "card=waseca-p01" in page.url
        page.evaluate("window.print=()=>{window.__didPrint=true}")
        page.get_by_role("button",name="Print filtered sheet").click()
        page.wait_for_function("window.__didPrint===true")
        assert page.locator(".print-page").count()==1
        assert page.locator(".print-card").count()==1
        assert "PREVIEW URL ONLY" in page.locator(".print-card").inner_text()

        page.get_by_text("Make a descendant card (local draft)").click()
        page.locator("#new-kind").select_option("REALITY.2")
        page.locator("#new-title").fill("THE RETURNING TRUCK")
        page.locator("#new-question").fill("What existing approved route could move a crate?")
        page.locator("#new-parent").select_option("waseca-p04")
        page.locator("#ack").check()
        page.get_by_role("button",name="Create local card").click()
        assert "#draft=" in page.url
        assert "UNREVIEWED DRAFT" in page.locator("#active").inner_text()
        assert "not stored by Abundent" in page.locator("#release-warning").inner_text()
        with page.expect_download() as event:
            page.get_by_role("button",name="Save draft JSON").click()
        draft=json.loads(pathlib.Path(event.value.path()).read_text())
        assert draft["published"] is False and draft["authority"]=="NONE"
        assert draft["parentId"]=="waseca-p04"
        page.reload()
        assert "THE RETURNING TRUCK" in page.locator("#active").inner_text()
        assert "#draft=" in page.url
        page.get_by_text("Bring a question back (local return)").click()
        page.locator("#return-kind").select_option("QUESTION")
        page.locator("#return-note").fill("Ask whether a shared pickup schedule already exists.")
        page.locator("#return-ack").check()
        with page.expect_download() as event:
            page.get_by_role("button",name="Save return JSON").click()
        returned=json.loads(pathlib.Path(event.value.path()).read_text())
        assert returned["status"]=="UNVERIFIED_PERSONAL_NOTE"
        assert returned["externalAdoption"]=="NOT_CLAIMED"
        assert returned["cardRef"]==draft["id"]
        assert page.evaluate("localStorage.length")==0

        page.get_by_text("Make a descendant card (local draft)").click()
        page.locator("#new-title").fill("CONTACT")
        page.locator("#new-question").fill("Email private-person@example.org")
        page.locator("#ack").check()
        page.get_by_role("button",name="Create local card").click()
        assert "contact details" in page.locator("#message").inner_text()

        assert not errors, errors
        assert all(url.startswith(f"http://127.0.0.1:{server.server_port}/") for url in requests), requests
        context.close()
        browser.close()
finally:
    server.shutdown()
