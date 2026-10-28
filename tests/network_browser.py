"""BRIDGE-NETWORK-003: mobile Chromium proves 23 opportunities, local-only files and unsent dossiers."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):
        super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*args): pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/bridge/network/"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        ctx=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,accept_downloads=True,service_workers="block")
        page=ctx.new_page()
        errors=[]
        requests=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.on("request",lambda request:requests.append(request.url))
        page.goto(base,wait_until="load")
        expect(page.locator("#room-count")).to_have_text("23",timeout=15000)
        expect(page.locator("#organ-count")).to_have_text("9")
        assert page.locator("#room-list button").count()==23
        assert page.locator(".map-node.institution").count()==23
        assert page.locator(".map-node.organ").count()==9
        assert not errors,errors
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"),"mobile horizontal overflow"
        page.locator("#find").fill("Nexus")
        assert page.locator("#room-list button").count()==1
        assert page.locator("#focus-name").inner_text()=="Nexus Community Wealth Building Cohort"
        assert "learning team" in page.locator("#focus-gate").inner_text().lower()
        with page.expect_download() as dl:
            page.locator("#export-dossier").click()
        d=json.loads(pathlib.Path(dl.value.path()).read_text())
        assert d["classification"]=="UNSENT_REVIEW_DRAFT"
        assert d["application"]=="NOT_SUBMITTED"
        assert d["partner"]=="NOT_ESTABLISHED"
        assert d["invitation"]["noPersonalData"] is True
        page.locator("#find").fill("")
        assert page.locator("#room-list button").count()==23
        with page.expect_download() as dl:
            page.locator("#export-all").click()
        atlas=json.loads(pathlib.Path(dl.value.path()).read_text())
        assert len(atlas["doors"])==23
        assert atlas["partnerCountClaimed"]==0
        assert atlas["submissionCountClaimed"]==0
        assert all(r["status"]=="PROPOSAL_NOT_RELATIONSHIP" for r in atlas["relations"])
        assert requests and all(url.startswith(base) or url.startswith(base.removesuffix("/").rsplit("/",1)[0]+"/") for url in requests),requests
        assert page.evaluate("localStorage.length == 0 && sessionStorage.length == 0")
        assert not errors,errors
        print(json.dumps({"schema":"abundent/bridge-network-browser-proof-v1","rooms":23,"organs":9,
          "dossier":"UNSENT_REVIEW_DRAFT","network":"POTENTIAL_CAPABILITY_FIT","mobile_width":390,
          "local_only":True,"page_errors":0}))
        browser.close()
finally:
    server.shutdown()
