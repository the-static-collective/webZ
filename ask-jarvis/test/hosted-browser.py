"""Actual preview smoke, including any Vercel share authentication cookie."""
import json, os
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

url=os.environ['ASK_JARVIS_PREVIEW_URL']
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(reduced_motion='reduce')
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(url,wait_until='networkidle')
    expect(page.locator('#return-kind')).to_be_visible()
    results=[]
    for kind,q in [('question','How could neighbors share extra garden produce?'),('invitation','An invitation to an arts gathering'),('door','Where can we explore source code?'),('song','A little song for our garden')]:
        page.locator('#question').fill(q)
        page.locator('#return-kind').select_option(kind)
        with page.expect_response(lambda r:r.url.endswith('/api/ask') and r.request.method=='POST') as response:
            page.locator('#ask').click()
        assert response.value.status==200, f'Hosted API returned {response.value.status}'
        data=response.value.json()
        expect(page.locator('#reply')).to_be_visible(timeout=15000)
        expect(page.locator('#receipt-state')).to_have_text('Receipt verified in this browser · unsigned')
        assert data['return']['kind']==kind
        assert all(s['status']=='INSPECTED' for s in data['sources']),data['sources']
        results.append({'kind':kind,'sources':[{'name':s['name'],'status':s['status']} for s in data['sources']]})
    assert not errors,errors
    print(json.dumps({'host':urlsplit(url).netloc,'mode':'ACTUAL_HOSTED_SOURCE_READS','returns':results,'pageErrors':errors},indent=2))
    browser.close()
