"""WEBZ–GrO Field Porch: real Chromium phone, original bytes, no implicit crossing."""
import json
import pathlib
import subprocess
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]


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
            accept_downloads=True
        )
        page = context.new_page()
        errors, requests = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("request", lambda req: requests.append(req.url))
        page.goto(base)
        page.get_by_role("link", name="Field Porch · GrO").click()
        page.get_by_role("heading", name="The world has a pantry. Not a free-for-all.").wait_for()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert page.get_by_text("LOCAL HOLD · NO DELIVERY · NO COLLECTION").is_visible()

        page.get_by_role("button", name="Prepare local WEBZ invitation").click()
        assert "REVIEW_AND_CONSENT" in page.locator("#message").inner_text()
        assert page.locator("#result").is_hidden()

        fixture = page.evaluate("""async () => {
          const {buildLead,photoEvidence}=await import('./contracts/scout-core.mjs');
          const {createHeldForageEncounter}=await import('./contracts/gro-hold.mjs');
          const data=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==');
          const bytes=Uint8Array.from(data,c=>c.charCodeAt(0));
          const lead=buildLead({
            description:'PRIVATE abandoned-looking little motor from driveway',
            observation:'SECRET SIDE NOTE not intended for public delivery',
            category:'TECH_PARTS', source_kind:'CURBSIDE_UNVERIFIED',
            land_class:'UNKNOWN',site_ref:'place:PRIVATE-LOCATION-123',
            steward_ref:'person:PRIVATE-OWNER-REF',
            purpose:'COMMUNITY_NONCOMMERCIAL',amount:1,unit:'ITEM',
            hazards:['BATTERY_PRESENT']
          },'webz-chromium-001');
          const evidence=await photoEvidence(bytes,lead.lead_ref);
          const held=await createHeldForageEncounter({
            lead,evidence,originalBytes:bytes,actorId:'actor:PRIVATE-PERSON',
            worldId:'world:gro-local-phone',placeId:lead.site_ref});
          return {lead,evidence,held,bytes:Array.from(bytes)};
        }""")
        for ident, data, filename in [
            ("held", fixture["held"], "gro-hold.json"),
            ("lead", fixture["lead"], "forage-lead.json"),
            ("evidence", fixture["evidence"], "photo-evidence.json"),
        ]:
            page.locator("#" + ident).set_input_files({
                "name": filename,
                "mimeType": "application/json",
                "buffer": json.dumps(data).encode("utf-8"),
            })
        original_photo = bytes(fixture["bytes"])
        page.locator("#photo").set_input_files({
            "name": "original.png", "mimeType": "image/png",
            "buffer": original_photo,
        })
        page.locator("#consent").check()
        page.get_by_role("button", name="Prepare local WEBZ invitation").click()
        page.wait_for_function("""()=>
          document.querySelector('#result').hidden===false &&
          document.querySelector('#message').textContent.includes('Ready for your review')""")
        public = page.locator("#public-text").inner_text()
        assert "UNREVIEWED_HOLD" in public
        assert "TECH_PARTS" in public
        for sensitive in ["PRIVATE-LOCATION", "PRIVATE-OWNER",
                          "SECRET SIDE NOTE", "PRIVATE-PERSON",
                          fixture["evidence"]["original_bytes_sha256"]]:
            assert sensitive not in public, sensitive
        assert "sha256:" in page.locator("#digest").inner_text()

        with page.expect_download() as event:
            page.get_by_role("button", name="Save proposal JSON").click()
        record = json.loads(pathlib.Path(event.value.path()).read_text())
        assert record["permission_to_collect"] is False
        assert record["receiver_choice"] == "NOT_TAKEN"
        assert record["private_source_transported"] is False
        assert record["webz_world_admission"] is False
        assert record["public_text"] == public
        assert page.evaluate("localStorage.length") == 0

        # Real tamper: JSON records unchanged, *different original photo bytes*.
        page.locator("#photo").set_input_files({
            "name": "counterfeit.png", "mimeType": "image/png",
            "buffer": original_photo + b"changed",
        })
        page.get_by_role("button", name="Prepare local WEBZ invitation").click()
        page.wait_for_function("""()=>
          document.querySelector('#message').textContent.includes('HOLD —')""")
        assert page.locator("#result").is_hidden()
        assert "ORIGINAL_PHOTO_AND_EVIDENCE_DO_NOT_MATCH" in page.locator("#message").inner_text()

        # Verify same URL works after actual service worker cache warmup / offline.
        context.set_offline(False)
        page.goto(base)
        page.wait_for_function("()=>navigator.serviceWorker.controller!==null")
        page.goto(base+"forage/")
        context.set_offline(True)
        page.reload()
        page.get_by_role("heading", name="The world has a pantry. Not a free-for-all.").wait_for()
        assert page.get_by_role("button", name="Prepare local WEBZ invitation").is_visible()
        assert page.evaluate("localStorage.length")==0
        cached = page.evaluate("""async () => {
          const all=[];
          for (const k of await caches.keys())
            for (const r of await (await caches.open(k)).keys()) all.push(r.url);
          return all;
        }""")
        assert any("/forage/bridge.mjs" in x for x in cached)
        assert not any("original.png" in x or "photo-evidence.json" in x for x in cached)
        assert all(x.startswith(base) for x in requests)
        assert not errors, errors
        browser.close()
    print(json.dumps({
        "schema": "webz/gro-forage-browser-witness/v0",
        "browser": "Chromium",
        "viewport": "390x844",
        "nested_base": True,
        "missing_consent": "HOLD",
        "valid_original_photo": "proposal prepared with human consent",
        "altered_photo": "REFUSED",
        "private_leak": False,
        "automatic_transfer": False,
        "collection_authorized": False,
        "offline_field_porch": True,
        "page_errors": errors,
    }, indent=2))
finally:
    server.shutdown()
