"""Real Chromium against loopback Worker; source reads use explicit synthetic fixtures."""
import json, os, subprocess, time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

root=Path(__file__).resolve().parents[2]
out=root/'evidence'/'ask-jarvis-return-002'
out.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen(['node','ask-jarvis/scripts/serve.mjs','--fixtures'],cwd=root,env={**os.environ,'PORT':'8799'},stdout=subprocess.PIPE,stderr=subprocess.PIPE)
try:
    for _ in range(100):
        try:
            urlopen('http://127.0.0.1:8799/api/health',timeout=1);break
        except Exception:
            if server.poll() is not None: raise RuntimeError(server.stderr.read().decode())
            time.sleep(.1)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':1280,'height':900},accept_downloads=True,reduced_motion='reduce')
        page=context.new_page(); errors=[];requests=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        page.goto('http://127.0.0.1:8799/')
        expect(page.locator('#return-kind')).to_be_visible()
        def ask(question,kind='auto'):
            page.locator('#question').fill(question)
            page.locator('#return-kind').select_option(kind)
            page.locator('#ask').click()
            expect(page.locator('#reply')).to_be_visible(timeout=12000)
            expect(page.locator('#receipt-state')).to_have_text('Receipt verified in this browser · unsigned')
        ask('How could neighbors share extra garden produce?')
        expect(page.locator('#return-body')).to_contain_text('Choose one kind of surplus')
        page.screenshot(path=str(out/'desktop-question.png'),full_page=True)
        with page.expect_download() as download: page.locator('#download').click()
        text=Path(download.value.path()).read_text()
        assert 'Sources inspected' in text and 'QUESTION CARD' in text
        page.locator('.receipt > summary').click()
        with page.expect_download() as download: page.locator('#download-receipt').click()
        receipt=json.loads(Path(download.value.path()).read_text())
        assert receipt['workbenchRequest']['authority']=='NONE'
        page.get_by_text('Prepare a local Workbench handoff',exact=True).click()
        with page.expect_download() as download: page.locator('#download-handoff').click()
        handoff=json.loads(Path(download.value.path()).read_text())
        assert handoff['dispatch']=='MANUAL_EXPORT_ONLY'
        ask('Can we make an invitation to an arts gathering?')
        expect(page.locator('#invitation-editor')).to_be_visible()
        page.locator('#invitation-editor').fill('Our edited draft, with our chosen words.')
        expect(page.locator('#draft-status')).to_contain_text('Edited unsigned draft')
        with page.expect_download() as download: page.locator('#download-edited').click()
        edited=Path(download.value.path()).read_text()
        assert 'Edited unsigned draft' in edited and 'Our edited draft' in edited
        assert receipt['receiptHash'] not in edited
        ask('Where can I explore the source code?')
        assert page.locator('#return-doors a').count()==3
        for a in page.locator('#return-doors a').all():
            assert a.get_attribute('href').startswith('https://github.com/the-static-collective/')
        ask('A song for a little garden, please')
        audio=page.locator('#song-audio')
        expect(audio).to_be_visible()
        assert audio.evaluate('(a)=>a.paused && !a.autoplay')
        with page.expect_download() as download: page.locator('#download-song').click()
        assert Path(download.value.path()).read_bytes()[:4]==b'RIFF'
        audio.evaluate('(a)=>a.play()')
        page.wait_for_function('()=>document.querySelector("#song-audio").currentTime > 0')
        old_audio=audio.get_attribute('src')
        page.screenshot(path=str(out/'desktop-song.png'),full_page=True)
        page.locator('#ask-next').click()
        assert audio.evaluate('(a)=>a.paused && !a.hasAttribute("src")')
        assert page.evaluate('(url)=>fetch(url).then(()=>false,()=>true)',old_audio)
        ask('<img src=x onerror=alert(1)> can we make a card?', 'question')
        assert page.locator('#return-body img').count()==0
        expect(page.locator('#return-body')).to_contain_text('<img')
        page.locator('#question').fill('Please email someone@example.com with this')
        page.locator('#ask').click()
        expect(page.locator('#mode')).to_have_text('NO RESULT CLAIMED')
        expect(page.locator('#reply')).to_be_hidden()
        # A short invalid input must recover on typing (customValidity regression).
        page.locator('#question').fill('        ')
        page.locator('#ask').click()
        ask('A useful question after invalid input', 'question')
        # A failing server hides any previous result and lets the visitor retry.
        page.route('**/api/ask',lambda route:route.fulfill(status=503,content_type='application/json',body='{"error":"Temporarily unavailable"}'))
        page.locator('#ask').click()
        expect(page.locator('#mode')).to_have_text('NO RESULT CLAIMED')
        page.unroute('**/api/ask')
        ask('A useful question after a failed request')
        # Keep one old reply pending, then complete the next question first.
        delayed=[]
        def delay_once(route):
            if not delayed:
                delayed.append((route,route.fetch()))
            else:
                route.continue_()
        page.route('**/api/ask',delay_once)
        page.locator('#question').fill('The old question should never replace the new one')
        page.locator('#ask').click()
        page.wait_for_timeout(200)
        assert len(delayed)==1
        ask('The new question is the one that should remain')
        try: delayed[0][0].fulfill(response=delayed[0][1])
        except Exception: pass  # The browser has already cancelled this request.
        expect(page.locator('#asked')).to_have_text('The new question is the one that should remain')
        page.unroute('**/api/ask')
        # Tampered evidence must be refused before render.
        def tamper(route):
            response=route.fetch();data=response.json();data['return']['body']='Counterfeit result'
            route.fulfill(response=response,json=data)
        page.route('**/api/ask',tamper)
        page.locator('#ask').click()
        expect(page.locator('#mode')).to_have_text('NO RESULT CLAIMED')
        expect(page.locator('#reply')).to_be_hidden()
        page.unroute('**/api/ask')
        page.set_viewport_size({'width':320,'height':740})
        ask('An invitation to a small garden table')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(out/'mobile-invitation.png'),full_page=True)
        assert not errors,errors
        assert all(u.startswith(('http://127.0.0.1:8799/','blob:')) for u in requests),requests
        assert context.cookies()==[]
        assert page.evaluate('localStorage.length')==0
        summary={'browser':browser.version,'sourceMode':'SYNTHETIC_TEST_FIXTURES','checks':['four returns','explicit selection','exports','edited draft separation','WAV playback and download','audio cleanup','injection','input recovery','network recovery','stale reply cancellation','tampered receipt refusal','320px layout','no storage or external browser requests'],'pageErrors':errors}
        (out/'result.json').write_text(json.dumps(summary,indent=2)+'\n')
        print(json.dumps(summary,indent=2))
        browser.close()
finally:
    server.terminate();server.wait(timeout=10)
