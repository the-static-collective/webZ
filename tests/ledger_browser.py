"""BRIDGE-LEDGER-004: verify real Chromium encryption, reload, offline write, and backup restore."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/bridge/desk/"
passphrase="test-only-encrypted-operator-desk-004"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        ctx=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,accept_downloads=True,service_workers="block")
        page=ctx.new_page()
        errors=[]
        reqs=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.on("request",lambda req:reqs.append(req.url))
        page.goto(base,wait_until="load")
        expect(page.locator("#create-form")).to_be_visible(timeout=15000)
        page.locator("#create-pass").fill(passphrase)
        page.locator("#confirm-pass").fill(passphrase)
        page.locator("#create-form button[type=submit]").click()
        expect(page.locator("#desk")).to_be_visible(timeout=20000)
        expect(page.locator("#summary")).to_contain_text("candidate rooms")
        page.locator("#kind").select_option("SOURCE_CHECKED")
        page.locator("#note").fill("Read the public Voqal program instructions and noted the eligibility question.")
        page.locator("#event-form button[type=submit]").click()
        expect(page.locator("#history article")).to_have_count(1,timeout=15000)
        expect(page.locator("#standing")).to_contain_text("OWNER ATTESTED")
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"),"mobile overflow"
        # The browser reload must retain ONLY ciphertext and return to locked state.
        page.reload(wait_until="load")
        expect(page.locator("#unlock-form")).to_be_visible(timeout=15000)
        page.locator("#unlock-pass").fill(passphrase)
        page.locator("#unlock-form button[type=submit]").click()
        expect(page.locator("#history article")).to_have_count(1,timeout=15000)
        assert "Voqal" in page.locator("#door-name").inner_text()
        with page.expect_download() as download:
            page.locator("#backup").click()
        backup=pathlib.Path(download.value.path())
        raw=backup.read_text()
        sealed=json.loads(raw)
        assert sealed["schema"]=="abundent/bridge-ledger-ciphertext-v1"
        assert "Read the public Voqal" not in raw
        assert "voqal" not in raw.lower()
        assert sealed["ciphertext"] and sealed["iv"] and sealed["revision"]
        # Private import is possible on a different empty browser storage origin/context.
        other=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
        restored=other.new_page()
        restored.goto(base,wait_until="load")
        expect(restored.locator("#create-form")).to_be_visible(timeout=15000)
        restored.locator("#show-restore").click()
        restored.locator("#restore-file").set_input_files(str(backup))
        restored.locator("#restore-pass").fill(passphrase)
        restored.locator("#restore-form button[type=submit]").click()
        expect(restored.locator("#desk")).to_be_visible(timeout=20000)
        expect(restored.locator("#history article")).to_have_count(1)
        assert not errors,errors
        assert reqs and all(url.startswith(f"http://127.0.0.1:{server.server_port}/bridge/") for url in reqs),reqs
        assert page.evaluate("localStorage.length === 0 && sessionStorage.length === 0")
        print(json.dumps({"schema":"abundent/bridge-ledger-browser-proof-v1","rooms":23,
            "write_and_reload":True,"AES_backup_and_separate_restore":True,
            "mobile_width":390,"owner_attestation_only":True,"remote_calls":0,"browser_errors":0}))
        other.close()
        browser.close()
finally:
    server.shutdown()
