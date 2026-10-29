"""FESTIVAL-FORK-011: local-only visual browser proof of real station-interest + next-festival branches."""
import json, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/bridge/first/festival-forks.html"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
        page=context.new_page();errors=[];requests=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.on("request",lambda r:requests.append(r.url))
        page.goto(base,wait_until="load")
        expect(page.locator("#station-list input")).to_have_count(10)
        page.locator('input[value="road-stage"]').check()
        page.locator('input[value="welcome"]').check()
        page.locator('input[value="fork"]').check()
        page.locator("#time").select_option("2_hours")
        page.locator("#venue").select_option("both_independent")
        page.locator("#propose").click()
        expect(page.locator("#message")).to_contain_text("No contact")
        expect(page.locator("#result")).to_contain_text("Two independently governed successor ideas")
        assert page.locator("#save").is_enabled()
        assert page.locator("#print").is_enabled()
        with page.expect_download() as dl:
            page.locator("#save").click()
        exported=json.loads(pathlib.Path(dl.value.path()).read_text())
        assert exported["schema"]=="abundent/festival-fork-plan-v1"
        assert exported["status"]=="PROPOSAL_HOLD_UNFUNDED_NOT_BOOKED"
        assert len(exported["chosenPublicStations"])==3
        assert len(exported["branches"])==2
        assert [b["venueOption"] for b in exported["branches"]]==["harmony_park","another_venue"]
        assert exported["branches"][0]["siteDecision"]=="HOLD"
        assert exported["branches"][1]["publicLaunch"]=="HOLD"
        assert exported["branches"][0]["fundedByVoqal"] is False
        assert all(v is False for v in exported["sideEffects"].values())
        assert exported["fullHarmonyFestivalBooked"] is False
        assert exported["currentFellowshipBudgetUSD"]==30000
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert all(url.startswith(f"http://127.0.0.1:{server.server_port}/bridge/") for url in requests),requests
        assert not errors,errors
        print(json.dumps({"schema":"festival-forks-browser-proof-v1","mobile_width":390,"real_source_module":True,"stations":10,"selected":3,"branches":2,"outbound_requests":0,"bookings":0,"page_errors":0}))
        browser.close()
finally:
    server.shutdown()
