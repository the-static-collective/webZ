"""Navigation Composer 001: real Chromium field/play/plant/fold/export/import witness."""
import json
import pathlib
import threading
import tempfile
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):
        pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/composer/"
out=ROOT/"evidence/browser"
out.mkdir(parents=True,exist_ok=True)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        mobile=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True)
        page=mobile.new_page()
        errors=[]
        requests=[]
        page.on("pageerror",lambda err: errors.append(str(err)))
        page.on("request",lambda request: requests.append(request.url))
        page.goto(base)
        assert "field is" in page.locator("h1").inner_text().lower()
        assert page.locator(".satellite").count()==7
        assert "UNPLAYED" in page.locator("#field-state").inner_text()
        # Keyboard arrival does the same thing as touch; visitors are not forced to draw.
        page.locator(".satellite").first.focus()
        page.keyboard.press("Enter")
        assert "Begin again." in page.locator("#selected-heading").inner_text()
        page.get_by_role("button",name="Arrive at Rosemary Bloom, recording").click()
        assert "suno.com/song/70b1d32e" in page.locator("#source-link").get_attribute("href")
        page.locator("#seed-title").fill("The kettle remembers")
        page.locator("#seed-phrase").fill("The house takes attendance.")
        page.get_by_role("button",name="Plant it here").click()
        assert "The kettle remembers" in page.locator("#selected-heading").inner_text()
        assert page.locator(".trail li").count()==3
        assert "VISITOR-AUTHORED" in page.locator("#source-description").inner_text()
        page.locator("#visitor-note").fill("This line came from my morning.")
        page.get_by_role("button",name="Fold my path into a door").click()
        assert "The house takes attendance." in page.locator("#invitation").inner_text()
        assert "unsigned" in page.locator("#invitation").inner_text().lower()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.screenshot(path=str(out/"composer-mobile.png"),full_page=True)
        with tempfile.TemporaryDirectory() as td:
            with page.expect_download() as download_info:
                page.get_by_role("button",name="Carry the score (.json)").click()
            downloaded=download_info.value
            target=pathlib.Path(td)/"score.json"
            downloaded.save_as(str(target))
            artifact=json.loads(target.read_text())
            assert artifact["schema"]=="static/navigation-score/v0"
            assert artifact["status"]=="unsigned-local-composition"
            assert artifact["seeds"][0]["title"]=="The kettle remembers"
            # Unfold in a different browser context; only local bounded data travels.
            fresh=browser.new_context(viewport={"width":1440,"height":960})
            cold=fresh.new_page()
            cold_errors=[]
            cold.on("pageerror",lambda err:cold_errors.append(str(err)))
            cold.goto(base)
            cold.locator("#import").set_input_files(str(target))
            assert "The kettle remembers" in cold.locator("#selected-heading").inner_text()
            assert "This line came from my morning." in cold.locator("#invitation").inner_text()
            assert "unsigned" in cold.locator("#status").inner_text().lower()
            assert cold.evaluate("document.documentElement.scrollWidth <= innerWidth")
            cold.screenshot(path=str(out/"composer-desktop.png"),full_page=True)
            # The visitor can review a forged score, but unsupported links do not get admitted.
            forged=dict(artifact)
            forged["path"]=[artifact["path"][0],"5195c966-d1da-4e87-a9d4-b48faacf0047"]
            cold.locator("#import").set_input_files({
                "name":"forged.json","mimeType":"application/json",
                "buffer":json.dumps(forged).encode()
            })
            assert "Could not unfold" in cold.locator("#status").inner_text()
            assert not cold_errors,cold_errors
            fresh.close()
        assert not errors,errors
        assert all(url.startswith(f"http://127.0.0.1:{server.server_port}/") for url in requests),requests
        mobile.close()
        browser.close()
    print("COMPOSER BROWSER PASS: keyboard/mobile/nested relations/plant/fold/download/fresh import/forged refusal")
finally:
    server.shutdown()
