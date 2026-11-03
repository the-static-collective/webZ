"""Circuit 004 browser/bridge choreography. Fake Minecraft here; native test is CI Java jar.
Pass GHOT_REPO to use independent *actual* GHoT even in this fake Minecraft test.
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

HERE=Path(__file__).resolve().parent
APP=HERE.parent
sys.path.insert(0,str(APP))
import ghot_local_server as bridge_mod
from ghot_local_server import Handler,checked_ghot_directory
from minecraft_foundry import blueprint
from test_minecraft_foundry import FakeMinecraft

mock=FakeMinecraft()

class FakeRcon:
    def __init__(self,*_args,**_kwargs):pass
    def __enter__(self):return self
    def __exit__(self,*args):return None
    def command(self, text):return mock.command(text)

bridge_mod.VanillaRcon=FakeRcon
repo=checked_ghot_directory(os.environ.get('GHOT_REPO') or HERE/'fixtures'/'fake_ghot')
with tempfile.TemporaryDirectory(prefix='minecraft004browser') as temp:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(APP)))
    server.ghot_repo=repo
    server.ghot_home=Path(temp)/'donor'
    server.peer_lock=threading.Lock(); server.peer_binding=None
    server.minecraft_enabled=True
    server.minecraft_lock=threading.Lock()
    server.minecraft_plan=blueprint()
    server.minecraft_rcon_password='test-fake'
    server.minecraft_rcon_port=25575
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    try:
        with sync_playwright() as pw:
            cfg={'headless':True}
            if Path('/usr/bin/chromium').exists():cfg['executable_path']='/usr/bin/chromium'
            browser=pw.chromium.launch(**cfg)
            page=browser.new_page(viewport={'width':400,'height':900})
            errors=[]
            page.on('pageerror',lambda err:errors.append(str(err)))
            page.on('dialog',lambda dlg:dlg.accept())
            page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load')
            page.get_by_role('button',name='Load fictional two-harbor demo').click()
            page.get_by_role('tab',name='08 · Minecraft World').click()
            expect(page.locator('#mcStatus')).to_contain_text('ARMED',timeout=10000)
            page.locator('#mcStage').click()
            expect(page.locator('#mcLive')).to_contain_text('Staged 10 real blocks',timeout=13000)
            page.locator('#mcObserve').click()
            expect(page.locator('#mcObservations')).to_contain_text('WAITING FOR HARBORS',timeout=14000)
            mock.lever(server.minecraft_plan,'a')
            page.locator('#mcObserve').click()
            expect(page.locator('#mcObservations .item')).to_have_count(2,timeout=15000)
            mock.lever(server.minecraft_plan,'b')
            page.locator('#mcObserve').click()
            expect(page.locator('#mcObservations')).to_contain_text('BOTH HARBOR LAMPS LIT',timeout=15000)
            page.locator('#mcCelebrate').click()
            expect(page.locator('#mcObservations')).to_contain_text('FESTIVAL LIT IN GAME',timeout=15000)
            storage=page.evaluate("localStorage.getItem('abundent-circuit001-local-v1')")
            assert 'GAME_ONLY_HOLD' in storage
            assert 'FESTIVAL_LIT_IN_GAME' in storage
            assert '"state":"CONFIRMED"' not in storage
            assert len((Path(temp)/'donor'/'records').glob('*.json').__iter__().__next__().name)>0
            page.reload()
            page.get_by_role('tab',name='08 · Minecraft World').click()
            expect(page.locator('#mcObservations')).to_contain_text('FESTIVAL LIT IN GAME')
            assert not errors,errors
            print('PASS: Abundent browser → Minecraft fake RCON → real/native donor when GHOT_REPO set → game-only HOLD notebook, persistence, 0 JS errors')
            browser.close()
    finally:
        server.shutdown();server.server_close();thread.join(timeout=3)
