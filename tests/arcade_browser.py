"""FINITE-DELIGHT-001: real mobile Chromium, local gifts, hard stop, no network or tracking."""
import json, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/apps/arcade/"
try:
    with sync_playwright() as pl:
        browser=pl.chromium.launch(headless=True)
        ctx=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
        page=ctx.new_page(); errors=[]; requests=[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.on("request",lambda req:requests.append(req.url))
        page.goto(base,wait_until="load")
        expect(page.locator("h1")).to_contain_text("Your time back.")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        topic="A one-hour community song party"
        page.locator("#topic").fill(topic)
        page.locator("#start button[type=submit]").click()
        expect(page.locator("#progress")).to_have_text("CARD 1 OF 3")
        first=page.locator("#artifact").inner_text()
        assert topic in first and "Fiction" in first
        with page.expect_download() as download:
            page.locator("#save").click()
        data=pathlib.Path(download.value.path()).read_text()
        assert topic in data and "No real-world event" in data
        # Export original-source-compatible preparation contracts only after human choice.
        page.locator(".creative-door summary").click()
        with page.expect_download() as press_dl:
            page.locator("#press-handoff").click()
        press=json.loads(pathlib.Path(press_dl.value.path()).read_text())
        assert press["lane"]=="lemonpress"
        assert press["owner"]["repo"]=="the-static-collective/lemonPRESS"
        assert press["nativeContract"]["status"]=="forming"
        assert press["nativeContract"]["admission"]["state"]=="pending"
        assert press["safety"]["networkSent"] is False
        with page.expect_download() as deck_dl:
            page.locator("#playdeck-handoff").click()
        deck=json.loads(pathlib.Path(deck_dl.value.path()).read_text())
        assert deck["lane"]=="playdeck"
        assert deck["owner"]["repo"]=="the-static-collective/playdeck"
        assert deck["nativeContract"]["renderedVideo"] is False
        assert deck["nativeContract"]["execution"].startswith("ONLY_BY_EXPLICIT")
        assert deck["createdFrom"]["artifact"]==first
        expect(page.locator("#handoff-status")).to_contain_text("Nothing was sent")

        page.locator("#advance").click()
        expect(page.locator("#progress")).to_have_text("CARD 2 OF 3")
        assert "permission" in page.locator("#artifact").inner_text()
        page.locator("#advance").click()
        expect(page.locator("#progress")).to_have_text("CARD 3 OF 3")
        assert "No meeting, obligation or reply expected" in page.locator("#artifact").inner_text()
        page.locator("#advance").click()
        expect(page.locator("#complete")).to_be_visible()
        expect(page.locator("#active")).to_be_hidden()
        expect(page.locator("#start")).to_be_hidden()
        assert page.locator("#complete a[href='../use/']").count()==1

        # An early voluntary stop must not require consuming the rest.
        other=ctx.new_page()
        other.goto(base,wait_until="load")
        other.locator("#start button[type=submit]").click()
        expect(other.locator("#progress")).to_have_text("CARD 1 OF 3")
        other.locator("#finish").click()
        expect(other.locator("#complete")).to_be_visible()
        expect(other.locator("#active")).to_be_hidden()
        assert not errors,errors
        assert requests and all(url.startswith(base) for url in requests),requests
        assert page.evaluate("localStorage.length===0 && sessionStorage.length===0")
        assert other.evaluate("localStorage.length===0 && sessionStorage.length===0")
        print(json.dumps({"schema":"abundent/finite-delight-browser-proof-v1","cards":3,
            "early_exit":True,"downloaded_gift":True,"mobile_width":390,
            "no_external_requests":True,"errors":0}))
        browser.close()
finally:
    server.shutdown()
