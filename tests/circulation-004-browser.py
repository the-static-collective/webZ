"""PANDO-004 — true browser exercise, offline static, no external network."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):
        pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}"
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,accept_downloads=True)
        page=context.new_page()
        errors,requests=[],[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        page.on("request",lambda r:requests.append(r.url))
        page.goto(base+"/circulation/004/")
        expect(page.locator("#examples .example")).to_have_count(4)
        expect(page.locator("#capabilities .capability")).to_have_count(6)
        assert page.locator("#question").input_value().startswith("Could a willing local kitchen")
        assert page.locator("#capabilities input:checked").count()==3
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"),"Mobile layout overflows"
        page.locator("#run").click()
        expect(page.locator("#active-loop")).to_be_visible()
        expect(page.locator("#response-cards .response-card")).to_have_count(3)
        expect(page.locator("#receipt-summary")).to_contain_text("REAL-WORLD OUTCOMES")
        assert "0" in page.locator("#receipt-summary .receipt-stat").last.inner_text()
        page.get_by_role("button",name="Common Table: simulate Hold for discussion").click()
        expect(page.locator("#response-cards")).to_contain_text("SIMULATION: HOLD FOR DISCUSSION")
        page.get_by_role("button",name="Living Neighbor Network: simulate Decline").click()
        expect(page.locator("#response-cards")).to_contain_text("SIMULATION: DECLINE")
        with page.expect_download() as event:
            page.locator("#download").click()
        exported=json.loads(pathlib.Path(event.value.path()).read_text())
        assert exported["format"]=="abundent.pando-export/v0"
        assert exported["exercise"]["authority"]=="NONE"
        assert exported["exercise"]["effect"]=="NONE"
        assert exported["receipt"]["recipientVerified"] is False
        assert exported["receipt"]["organizerAdopted"] is False
        assert exported["receipt"]["outcome"]=="NO_REAL_WORLD_OUTCOME_CLAIMED"
        by_lane={row["lane"]:row for row in exported["exercise"]["invitations"]}
        assert by_lane["table"]["witness"]=="LOCAL_SIMULATION_ONLY"
        assert by_lane["network"]["status"]=="DECLINE"
        assert page.evaluate("localStorage.length===0 && sessionStorage.length===0")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")

        # Real schema/bytes from upstream Circulation-003, no relay and no owner authority.
        packet=page.evaluate("""async () => {
            const m = await import('/circulation/003/packet.mjs');
            return m.prepareFieldQuestion({kind:'QUESTION',
                text:'Could independent neighbors revisit one public question after a gathering?',
                authorRole:'AUTHOR',permissionReviewed:true,privacyReviewed:true});
        }""")
        page.locator("#import-003").set_input_files({
            "name":"question-003.json","mimeType":"application/json",
            "buffer":json.dumps(packet).encode()
        })
        expect(page.locator("#notification")).to_contain_text("structure and hash verified")
        page.locator("#run").click()
        expect(page.locator("#origin-text")).to_contain_text("independent neighbors")
        assert packet["id"] not in page.locator("#origin-text").inner_text()

        # Personal details are refused before any local packet is created.
        page.locator("#question").fill("Email somebody@example.org to join the project")
        page.locator("#permission").check()
        page.locator("#run").click()
        expect(page.locator("#notification")).to_contain_text("QUESTION_REFUSED")
        assert not errors, errors
        assert all(x.startswith(base+"/") for x in requests),requests
        context.close()
        browser.close()
finally:
    server.shutdown()
