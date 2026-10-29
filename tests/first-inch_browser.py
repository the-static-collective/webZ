"""FIRST-INCH-001: a mobile stranger can make an unsent, downloadable card."""
import json
import pathlib
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kw):
        super().__init__(*args, directory=str(ROOT), **kw)

    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}/"

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            accept_downloads=True,
            service_workers="block",
        )
        page = context.new_page()
        errors, requests = [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("request", lambda request: requests.append(request.url))
        page.goto(base + "start/")
        expect(page.locator("h1")).to_contain_text("What are you trying")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        expect(page.locator("#result")).to_be_hidden()

        page.locator("#goal").fill("short")
        page.get_by_role("button", name="Make a first-step card").click()
        expect(page.locator("#form-message")).to_contain_text("10–600")
        expect(page.locator("#result")).to_be_hidden()

        page.locator("#goal").fill("We want one volunteer-led grocery pickup table")
        page.locator(".optional summary").click()
        page.locator("#kind").select_option("community")
        page.locator("#have").fill("one willing cook and two folding tables")
        page.locator("#needs").fill("permission to use a site")
        page.get_by_role("button", name="Make a first-step card").click()

        expect(page.locator("#result")).to_be_visible()
        output = page.locator("#card-preview").inner_text()
        assert "DRAFT — NOT SENT OR VERIFIED" in output
        assert "willing cook and two folding tables" in output
        assert "permission to use a site" in output
        assert "Ask one willing local steward" in output
        assert "not an AI response" in output
        assert "mailto:us@abundent.org" in page.locator("#email").get_attribute("href")
        assert page.evaluate("localStorage.length === 0 && sessionStorage.length === 0")

        # Editing a form field must invalidate the earlier, shareable draft.
        page.locator("#needs").fill("permission and a volunteer signoff")
        expect(page.locator("#result")).to_be_hidden()
        page.get_by_role("button", name="Make a first-step card").click()
        expect(page.locator("#result")).to_be_visible()
        output = page.locator("#card-preview").inner_text()
        assert "permission and a volunteer signoff" in output

        with page.expect_download() as d:
            page.locator("#save").click()
        saved = pathlib.Path(d.value.path()).read_text()
        assert saved == output

        # Optional Toaster-style SIX-UP opens without changing first-screen simplicity.
        page.locator("#planning-lab > summary").click()
        expect(page.locator(".six-card")).to_have_count(6)
        expect(page.locator("#lab-message")).to_contain_text("Round 1")
        assert "OVER DECLARED EFFORT BUDGET" not in page.locator(".six-card").first.inner_text()
        assert "HOLD" in page.locator('[data-role="TRIAL"]').inner_text()

        first_approach = page.locator('[data-role="QUESTION"]').inner_text()
        page.get_by_role("button", name="KEEP Design a tiny field trial").click()
        expect(page.locator("#card-preview")).to_contain_text("NO EXECUTION AUTHORITY")
        expect(page.locator("#card-preview")).to_contain_text("HOLD — independent human evidence required")

        page.locator("#scrape").click()
        expect(page.locator("#lab-message")).to_contain_text("Round 2")
        assert page.locator('[data-role="QUESTION"]').inner_text() != first_approach
        expect(page.locator("#card-preview")).not_to_contain_text("KEPT PLANNING DRAFT")

        with page.expect_download() as ablation:
            page.locator("#dogram-export").click()
        specimen = json.loads(pathlib.Path(ablation.value.path()).read_text())
        assert specimen["schema"] == "dogram.specimen/v0"
        assert specimen["operator"] == "ablate"
        assert specimen["inputs"]["target"] == {"kind": "node", "node": "approval"}
        assert "volunteer-led grocery" not in json.dumps(specimen)
        assert "site permission" not in json.dumps(specimen)

        page.locator("#effort-budget").fill("2")
        page.locator("#effort-budget").dispatch_event("change")
        expect(page.locator("#lab-message")).to_contain_text("Round 1")
        assert "above declared budget" in page.locator('[data-role="DRAFT"]').inner_text()
        assert "within declared budget" in page.locator('[data-role="QUESTION"]').inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert page.evaluate("localStorage.length === 0 && sessionStorage.length === 0")

        assert all(url.startswith(base) for url in requests), requests
        assert not errors, errors
        print(json.dumps({
            "schema": "abundent/first-inch-browser-witness/v1",
            "viewport": "390x844",
            "short_goal_held": True,
            "unsent_draft_generated": True,
            "optional_resources_preserved": True,
            "local_text_saved": True,
            "external_requests": 0,
            "js_errors": 0,
        }))
        browser.close()
finally:
    server.shutdown()
