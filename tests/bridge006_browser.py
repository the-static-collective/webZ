"""BRIDGE-006: exact public first-crossing page in mobile Chromium; no external requests or send."""
import json, pathlib, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
    def log_message(self,*a):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/bridge/first/"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
        page=context.new_page();errors=[];requests=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.on("request",lambda r:requests.append(r.url))
        page.goto(base,wait_until="load")
        expect(page.locator(".urgent")).to_contain_text("OCT 31",timeout=15000)
        expect(page.locator("#budget .total")).to_contain_text("$30,000")
        assert page.locator("#gates .gate-row").count()>=8
        assert page.locator(".draft-card").count()==2
        assert page.locator("#source-list a").count()==11
        assert "NO FIELD PARTICIPATION" in page.locator(".first-hero .status").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        with page.expect_download() as dl:
            page.locator("#export-review").click()
        record=json.loads(pathlib.Path(dl.value.path()).read_text())
        assert record["schema"]=="abundent.bridge006-first-crossing/v1"
        assert record["applicationSubmitted"] is False
        assert record["outboundInquirySent"] is False
        assert record["fieldPilotAuthorized"] is False
        assert record["independentFieldResult"] is False
        assert record["totalUSD"]==30000
        assert record["commonsCircuit"]["budgetUSD"]==30000
        assert record["commonsCircuit"]["claimedHosts"]==0
        assert record["commonsCircuit"]["applicationSubmitted"] is False
        assert len(record["commonsCircuit"]["weekly"])==4
        assert record["commonsCircuit"]["finale"]["initialSeedUSD"]==5000
        assert record["commonsCircuit"]["finale"]["venueBooked"] is False
        assert record["commonsCircuit"]["finale"]["voqalInvitationsSent"] is False
        assert record["commonsCircuit"]["finale"]["fullyFinanced"] is False
        assert all(url.startswith(f"http://127.0.0.1:{server.server_port}/bridge/") for url in requests),requests
        assert not errors,errors
        print(json.dumps({"schema":"bridge006-browser-proof/v1","drafts":2,"funding":30000,
          "local_only":True,"submitted":False,"sent":False,"width":390,"page_errors":0}))
        browser.close()
finally:server.shutdown()
