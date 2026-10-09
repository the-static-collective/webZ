"""GLEAN-001 browser witness: mobile, consent, source replay and offline shell."""
import json
import pathlib
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OFFER = json.loads((ROOT / "tests/fixtures/glean-orchard-example.json").read_text())


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.startswith("/nested/webZ/"):
            self.path = self.path[len("/nested/webZ"):]
        super().do_GET()

    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}/nested/webZ/"

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
            accept_downloads=True,
        )
        page = context.new_page()
        errors, requests = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("request", lambda r: requests.append(r.url))
        page.goto(base)
        page.get_by_role("link", name="GLEAN · The Remainder").click()
        page.locator("h1").wait_for()
        assert "Leave something" in page.locator("h1").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.locator("#prepare").click()
        assert "EXPLICIT_GLEAN_POSTCARD_CONSENT_REQUIRED" in page.locator("#message").inner_text()
        assert page.locator("#result").is_hidden()

        held = page.evaluate("""async input => {
          const {holdGleanQuest}=await import('./contracts/glean-quest.mjs');
          return await holdGleanQuest({
            offer:input,actorId:'actor:synthetic-browser-gleaner',
            placeId:input.site_ref,
          });
        }""", OFFER)

        page.locator("#offer").set_input_files({
            "name": "synthetic-steward-offer.json",
            "mimeType": "application/json",
            "buffer": json.dumps(OFFER).encode(),
        })
        page.locator("#held").set_input_files({
            "name": "synthetic-gro-quest.json",
            "mimeType": "application/json",
            "buffer": json.dumps(held).encode(),
        })
        page.locator("#consent").check()
        page.locator("#prepare").click()
        page.wait_for_function("""() => !document.querySelector('#result').hidden
          && document.querySelector('#message').textContent.includes('Prepared locally')""")
        public = page.locator("#public").inner_text()
        assert "HOLD_PENDING_OWNER_PERMISSION" in public
        assert "AGRICULTURAL_CROP" in public
        for private in (
            OFFER["site_ref"], OFFER["steward_ref"],
            OFFER["owner_claim_ref"], OFFER["intended_recipient_ref"],
            OFFER["description"], OFFER["valid_from"], held["quest_id"],
        ):
            assert private not in public
        assert "sha256:" in page.locator("#hash").inner_text()

        with page.expect_download() as download:
            page.locator("#download").click()
        result = json.loads(pathlib.Path(download.value.path()).read_text())
        assert result["owner_verified"] is False
        assert result["pickup_authorized"] is False
        assert result["material_transported"] is False
        assert result["decision"] == "NOT_DELIVERED"
        assert page.evaluate("localStorage.length") == 0

        changed = {**OFFER, "owner_donation_asserted": False}
        page.locator("#offer").set_input_files({
            "name": "altered-offer.json",
            "mimeType": "application/json",
            "buffer": json.dumps(changed).encode(),
        })
        page.locator("#prepare").click()
        page.wait_for_function("""() => document.querySelector('#message').textContent.includes('HOLD —')""")
        assert "GRO_GLEAN_ORIGINAL_OFFER_COLD_REPLAY_DISAGREEMENT" in page.locator("#message").inner_text()
        assert page.locator("#result").is_hidden()

        page.goto(base)
        page.wait_for_function("() => navigator.serviceWorker.controller !== null")
        page.goto(base + "glean/")
        context.set_offline(True)
        page.reload()
        assert "Leave something" in page.locator("h1").inner_text()
        assert page.locator("#prepare").is_visible()
        assert page.evaluate("localStorage.length") == 0
        urls = page.evaluate("""async () => {
          const out=[];
          for(const name of await caches.keys())
            for(const request of await (await caches.open(name)).keys())
              out.push(request.url);
          return out;
        }""")
        assert any("/glean/contracts/glean-quest.mjs" in u for u in urls)
        assert not any("synthetic-steward-offer.json" in u for u in urls)
        assert all(x.startswith(base) for x in requests)
        assert not errors, errors
        browser.close()
        print(json.dumps({
            "schema": "webz/glean-browser-witness/v0",
            "viewport": "390x844",
            "consent_before_proposal": True,
            "original_source_replay": True,
            "altered_source_rejected": True,
            "private_fields_omitted": True,
            "offline_app_shell": True,
            "automatic_pickup": False,
            "automatic_delivery": False,
            "page_errors": errors,
        }, indent=2))
finally:
    server.shutdown()
