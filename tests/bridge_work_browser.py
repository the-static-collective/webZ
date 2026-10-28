"""BRIDGE-005: mobile browser proof of exact source-pinned, reviewed, unsent work-card export."""
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
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
        page=context.new_page();errs=[];requests=[]
        page.on("pageerror",lambda err:errs.append(str(err)))
        page.on("request",lambda req:requests.append(req.url))
        page.goto(base,wait_until="load")
        expect(page.locator("#create-form")).to_be_visible(timeout=20000)
        page.locator("#create-pass").fill("synthetic-browser-bridge005-passphrase")
        page.locator("#confirm-pass").fill("synthetic-browser-bridge005-passphrase")
        page.locator("#create-form button[type=submit]").click()
        expect(page.locator("#desk")).to_be_visible(timeout=20000)
        expect(page.locator(".packet-preview")).to_contain_text("bridge-work-v1:",timeout=15000)
        preview=json.loads(page.locator(".packet-preview").inner_text())
        assert preview["doorId"]=="voqal"
        assert preview["target"]=="JARVIS"
        assert preview["externalContact"] is False
        assert page.locator("#work-ack").is_checked() is False
        page.locator("#work-ack").check()
        page.locator("#work-action").select_option("PREPARE_SYNTHETIC_DEMO")
        assert not page.locator("#work-ack").is_checked()
        expect(page.locator(".packet-preview")).to_contain_text("PREPARE_SYNTHETIC_DEMO")
        page.locator("#work-ack").check()
        with page.expect_download() as dl:
            page.locator("#work-form button[type=submit]").click()
        exported=json.loads(pathlib.Path(dl.value.path()).read_text())
        assert exported["classification"]=="PUBLIC_ONLY_HOLD_FOR_LOCAL_REVIEW"
        assert exported["actionCode"]=="PREPARE_SYNTHETIC_DEMO"
        assert exported["sourceCommit"]=="27c280d5297e593512d85eb3c83d74904856cfdf"
        assert exported["applicationSubmitted"] is False
        assert all(k not in exported for k in ("notes","events","contact","credentials","privateJournal"))
        assert not page.locator("#work-ack").is_checked()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert all(url.startswith(f"http://127.0.0.1:{server.server_port}/bridge/") for url in requests),requests
        assert not errs,errs
        print(json.dumps({"schema":"abundent/bridge005-browser-proof/v1","mode":"download-only",
                           "public_only":True,"separate_manual_approval":True,"mobile_width":390,"pageerrors":0}))
        browser.close()
finally:
    server.shutdown()
