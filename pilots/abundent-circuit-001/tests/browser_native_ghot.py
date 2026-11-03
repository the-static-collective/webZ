"""Browser proof of Circuit UI -> loopback bridge -> native GHoT CLI -> local receipt.

Uses GHOT_REPO for ACTUAL donor, or a clearly marked source-path fixture for UI tests.
Requires playwright + Chrome/Chromium (on CI: playwright install chromium).
"""
from __future__ import annotations
import os
import sys
import tempfile
import threading
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from ghot_local_server import Handler, checked_ghot_directory  # noqa: E402

checkout = Path(os.environ.get('GHOT_REPO') or (HERE / 'fixtures' / 'fake_ghot'))
with tempfile.TemporaryDirectory(prefix='circuit-browser-') as tmp:
    with ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(HERE.parent))) as server:
        server.ghot_repo = checked_ghot_directory(checkout)
        server.ghot_home = Path(tmp) / 'native-ghot-records'
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        with sync_playwright() as p:
            chromium_opts={'headless': True}
            if Path('/usr/bin/chromium').exists(): chromium_opts['executable_path']='/usr/bin/chromium'
            browser=p.chromium.launch(**chromium_opts)
            page=browser.new_page(viewport={'width': 390, 'height': 844})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load')
            page.get_by_role('button',name='Load fictional two-harbor demo').click()
            page.get_by_role('tab',name='06 · Compute').click()
            expect(page.locator('#ghotStatus')).to_contain_text('LOCAL GHOT DETECTED',timeout=10000)
            page.locator('form[data-act=ghot-native] textarea[name=text]').fill('Festival Foundry / one harbor / next harbor')
            page.locator('#ghotRunButton').click()
            expect(page.locator('#computeList')).to_contain_text('NATIVE GHOT / LOCAL',timeout=20000)
            expect(page.locator('#computeList')).to_contain_text('native receipt:')
            assert not errors,errors
            # Reload exercises actual localStorage persistence and verifies no
            # compute receipt was promoted into a Full Measure Deed.
            page.reload(wait_until='load')
            page.get_by_role('tab',name='06 · Compute').click()
            expect(page.locator('#computeList')).to_contain_text('NATIVE GHOT / LOCAL')
            page.get_by_role('tab',name='03 · Build & Grow').click()
            expect(page.locator('#fullMeasure')).to_contain_text('Deeds')
            assert '0' in page.locator('#fullMeasure').inner_text()
            assert not errors,errors
            screenshot = HERE.parent / 'native-ghot-proof.png'
            page.get_by_role('tab',name='06 · Compute').click()
            page.screenshot(path=str(screenshot),full_page=True)
            browser.close()
        server.shutdown()
        thread.join(timeout=3)
        print('PASS: Circuit browser -> local GHoT bridge -> native-source CLI receipt; persistence; 0 JS exceptions')
        print('DONOR:', 'actual GHoT checkout' if os.environ.get('GHOT_REPO') else 'test-only fixture; requires CI for real GHoT')
