"""FIRST CONTACT 028: real mobile-browser choice and paper QR rehearsal.
No physical printer, external host, actual participant, or second phone used.
"""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[1]

class Quiet(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, *a):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), Quiet)
threading.Thread(target=server.serve_forever, daemon=True).start()
host=f"http://127.0.0.1:{server.server_port}"
base=host+"/field/first-contact/"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={"width":390,"height":844},
            device_scale_factor=1,accept_downloads=True)
        page=context.new_page()
        errors,requests=[],[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.on("request",lambda req:requests.append(req.url))
        page.goto(base)
        expect(page.get_by_role("heading",name="A place to come back to.")).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),"mobile overflow"
        assert "not a live help service" in page.locator("body").inner_text()
        assert page.locator("button[data-door]").count()==4
        assert page.locator("#answer").is_hidden()
        assert page.evaluate("localStorage.length===0")

        # First scan is NEVER a signup, and choosing need not make an offer.
        page.locator('button[data-door="help"]').click()
        assert "door=help" in page.url and "project=living-commons-listening-001" in page.url
        assert page.locator("#answer").is_visible()
        page.locator("#note").fill("Call 507-555-0133 please")
        page.locator("#understand").check()
        page.locator("#save").click()
        assert "no apparent contact details" in page.locator("#message").inner_text()
        assert page.locator("#receipt").is_hidden()

        # A meaningful local note can be exported, but no remote request occurs.
        page.locator("#note").fill("Could chairs be shared during the gathering?")
        page.locator("#save").click()
        expect(page.locator("#receipt")).to_be_visible()
        assert "Nothing was sent" in page.locator("#message").inner_text()
        assert "chairs" not in page.url
        with page.expect_download() as download:
            page.locator("#download").click()
        obj=json.loads(pathlib.Path(download.value.path()).read_text())
        assert obj["disposition"]=="UNSENT_DEVICE_LOCAL_DRAFT"
        assert obj["authority"]=="NONE" and obj["published"] is False
        assert obj["door"]=="help"
        assert obj["note"]=="Could chairs be shared during the gathering?"
        page.locator("#erase").click()
        assert page.locator("#note").input_value()==""
        assert page.locator("#receipt").is_hidden()
        page.locator("#clear").click()
        assert page.locator("#answer").is_hidden()
        assert page.url==base

        # All four doors are recognizable, including explicit nonparticipation.
        page.locator('button[data-door="browse"]').click()
        assert "Looking is enough" in page.locator("#door-explanation").inner_text()
        page.locator("#clear").click()
        page.locator('button[data-door="create"]').click()
        assert "separate review and permission" in page.locator("#door-explanation").inner_text()
        page.locator("#clear").click()

        # Operator can produce a beautiful *non-scannable* paper proof without
        # pretending a second phone is verified.
        page.locator("#operator summary").click()
        page.locator("#operator-tested").uncheck()
        page.locator("#layout").select_option("9")
        page.evaluate("window.print=()=>{window.__printed=(window.__printed||0)+1}")
        page.locator("#print").click()
        page.wait_for_function("window.__printed===1")
        assert page.locator(".print-sheet .print-card").count()==9
        assert page.locator(".print-sheet .print-qr canvas, .print-sheet .print-qr img").count()==0
        assert "QR is intentionally withheld" in page.locator("#print-status").inner_text()
        assert page.locator(".print-unscannable").count()==9

        # In this SAME-DEVICE browser simulation, an operator-attested
        # loopback address is marked private-network-test-only, not public.
        # The checkbox is not evidence of a real second-phone test.
        page.locator("#print-url").fill(base)
        page.locator("#operator-tested").check()
        page.locator("#layout").select_option("4")
        page.locator("#print").click()
        page.wait_for_function("window.__printed===2")
        assert page.locator(".print-sheet .print-card").count()==4
        expect(page.locator("#print-status")).to_contain_text("operator has attested")
        assert page.locator(".print-sheet .print-qr canvas, .print-sheet .print-qr img").count()==4
        for url_text in page.locator(".print-sheet .print-link").all_inner_texts():
            assert url_text.startswith(base+"#project="),url_text
            assert "note=" not in url_text and "chairs" not in url_text
        assert "DO NOT DISTRIBUTE" in page.locator(".print-sheet").inner_text()

        # Mismatched target URL must not produce a scannable card.
        page.locator("#print-url").fill(host+"/other-place/")
        page.locator("#print").click()
        page.wait_for_function("window.__printed===3")
        assert page.locator(".print-qr canvas, .print-qr img").count()==0

        assert not errors,errors
        assert all(url.startswith(host+"/") for url in requests),requests
        assert page.evaluate("localStorage.length===0 && sessionStorage.length===0")
        context.close()
        browser.close()
finally:
    server.shutdown()
