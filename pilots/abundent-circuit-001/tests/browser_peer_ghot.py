"""Circuit 003 full real browser -> localhost bridge -> paired remote GHoT worker.

CI runs against actual pinned GHoT checkout. Local test fixture is visibly NOT
native GHoT and can only prove the browser/bridge/transport choreography.
"""
from __future__ import annotations

import os
import secrets
import sys
import tempfile
import threading
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

HERE=Path(__file__).resolve().parent
APP=HERE.parent
sys.path.insert(0,str(APP))
from ghot_lan_worker import WorkerServer, WorkerHandler  # noqa
from ghot_local_server import Handler, checked_ghot_directory  # noqa

repo=checked_ghot_directory(os.environ.get('GHOT_REPO') or HERE/'fixtures'/'fake_ghot')
with tempfile.TemporaryDirectory(prefix='abundent-browser-peer-') as temp:
    root=Path(temp)
    worker=WorkerServer(('127.0.0.1',0),WorkerHandler,repo,root/'ghot-worker',secrets.token_hex(32))
    bridge=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(APP)))
    bridge.ghot_repo=repo
    bridge.ghot_home=root/'ghot-local'
    bridge.peer_lock=threading.Lock();bridge.peer_binding=None
    threads=[]
    try:
        for server in (worker,bridge):
            thread=threading.Thread(target=server.serve_forever,daemon=True)
            thread.start();threads.append(thread)
        with sync_playwright() as playwright:
            options={'headless':True}
            if Path('/usr/bin/chromium').is_file(): options['executable_path']='/usr/bin/chromium'
            browser=playwright.chromium.launch(**options)
            page=browser.new_page(viewport={'width':390,'height':844})
            errors=[]
            page.on('pageerror',lambda exc:errors.append(str(exc)))
            page.goto(f'http://127.0.0.1:{bridge.server_port}/',wait_until='load')
            page.get_by_role('button',name='Load fictional two-harbor demo').click()
            page.get_by_role('tab',name='06 · Compute').click()
            expect(page.locator('#ghotStatus')).to_contain_text('LOCAL GHOT DETECTED',timeout=10000)
            expect(page.locator('#peerStatus')).to_contain_text('No remote worker paired',timeout=8000)
            page.locator('#peerUrl').fill(f'http://127.0.0.1:{worker.server_port}')
            page.locator('#peerSecret').fill(worker.key.hex())
            page.locator('#peerPairBtn').click()
            expect(page.locator('#peerStatus')).to_contain_text('PAIRED',timeout=13000)
            assert page.locator('#peerSecret').input_value()==''
            expect(page.locator('#peerRunForm')).to_be_visible()
            page.locator('#peerTaskText').fill('one harbor / two independent GHoT processes')
            page.locator('#peerRunButton').click()
            expect(page.locator('#computeList')).to_contain_text('NATIVE GHOT / PEER LOOPBACK TEST',timeout=30000)
            expect(page.locator('#computeList')).to_contain_text('native receipt:')
            # The pairing secret is never persisted in browser storage.
            storage=page.evaluate('localStorage.getItem("abundent-circuit001-local-v1")')
            assert worker.key.hex() not in storage
            assert worker.identity['nodeId'] in storage
            assert 'GHOT_NATIVE_EXECUTED_PEER_LOOPBACK_TEST' in storage
            # No unauthorized promotion of compute to human Deed.
            page.get_by_role('tab',name='03 · Build & Grow').click()
            assert 'Deeds' in page.locator('#fullMeasure').inner_text()
            assert '"state":"CONFIRMED"' not in storage
            page.reload()
            page.get_by_role('tab',name='06 · Compute').click()
            expect(page.locator('#computeList')).to_contain_text('NATIVE GHOT / PEER LOOPBACK TEST')
            expect(page.locator('#peerStatus')).to_contain_text('PAIRED')
            page.locator('#peerUnpairButton').click()
            expect(page.locator('#peerStatus')).to_contain_text('Unpaired')
            expect(page.locator('#peerRunForm')).to_be_hidden()
            assert not errors, errors
            assert list((worker.home/'records').glob('*.json'))
            browser.close()
            print('PASS: actual browser / local-bridge / HMAC-paired independent worker process / native donor receipt / persisted Circuit notebook / unpair / 0 JS exceptions')
            print('DONOR:', 'ACTUAL GHOT checkout' if os.environ.get('GHOT_REPO') else 'TEST FIXTURE ONLY')
    finally:
        for server,thread in zip((worker,bridge),threads):
            server.shutdown();server.server_close();thread.join(timeout=3)
