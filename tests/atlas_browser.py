"""Between Rooms Atlas 002 browser proof: real mobile Chromium, local static data and HOLD-first exports."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):
        super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*args):
        pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/bridge/atlas/"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        ctx=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,accept_downloads=True,service_workers="block")
        page=ctx.new_page()
        errors=[]
        outbound=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.on("request",lambda request:outbound.append(request.url))
        page.goto(base,wait_until="load")
        page.locator("#repoCount").get_by_text("89").wait_for()
        assert page.locator("#refCount").inner_text()=="2,207"
        assert page.locator("#prCount").inner_text()=="1,067"
        assert page.locator("#projects button").count()==89
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"),"mobile horizontal overflow"
        assert "CANDIDATE COMPOSITION" in page.locator("#trailStatus").inner_text()
        page.get_by_role("button",name="Spare machines → community work").click()
        assert "Spare machines" in page.locator("#trailName").inner_text()
        assert page.locator("#trailSteps button").count()==6
        with page.expect_download() as dl:
            page.get_by_role("button",name="Export proposed route JSON").click()
        exported=json.loads(pathlib.Path(dl.value.path()).read_text())
        assert exported["classification"]=="CANDIDATE_ONLY_NOT_APPROVED"
        assert exported["thirdPartyPermission"]=="NOT_ESTABLISHED"
        assert exported["executed"] is False
        assert "GHoT" in exported["route"]["nodes"]
        page.locator("#search").fill("GHoT")
        assert page.locator("#projects button").count()==1
        page.locator("#projects button").first.click()
        assert page.locator("#detailName").inner_text()=="GHoT"
        assert "energy" in page.locator("#detailExtra").inner_text().lower()
        assert "Proposed GHoT worship-stage" in page.locator("#detailExtra").inner_text()
        page.locator("#search").fill("")
        assert page.locator("#projects button").count()==89
        assert not errors,errors
        assert outbound and all(url.startswith(base) for url in outbound),outbound
        assert page.evaluate("localStorage.length == 0 && sessionStorage.length == 0")
        print(json.dumps({"schema":"abundent/bridge-atlas-browser-proof-v1",
           "mobile_width":390,"observed_repos":89,"trail_count":6,
           "compute_route":"CANDIDATE_ONLY_NOT_APPROVED","ghot_detail":True,
           "local_only":True,"page_errors":0}))
        browser.close()
finally:
    server.shutdown()
