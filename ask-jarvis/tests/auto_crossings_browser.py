"""Phone-sized one-tap crossing acceptance. All API calls are blocked/mocked.
Does not use real volunteers, credentials, private Firebox or live submissions.
"""
from playwright.sync_api import sync_playwright

BASE="http://127.0.0.1:8123"
with sync_playwright() as play:
    browser=play.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":390,"height":844},
                          device_scale_factor=1,is_mobile=True,has_touch=True)
    requests=[]
    def block_api(route):
        requests.append((route.request.method,route.request.url))
        route.fulfill(status=503,body='{"error":"test-offline"}',
                      headers={"Content-Type":"application/json"})
    page.route("**/functions/v1/**",block_api)
    page.goto(BASE+"/first-yes/",wait_until="domcontentloaded")
    page.locator("#prepare").click()
    assert page.locator("#open-crossing").is_enabled()
    # No save-to-file step anywhere in the primary user flow.
    page.locator("#open-crossing").click()
    page.wait_for_url("**/crossings/")
    page.wait_for_function("document.querySelector(\'#ticket-status\')?.textContent?.includes(\'AUTOMATIC CONTINUATION READY\')")
    status=page.locator("#ticket-status").inner_text()
    assert "Community grocery" in status,status
    assert "original question absent" in status,status
    assert page.locator("#save-return").is_enabled()
    assert len([r for r in requests if r[0]=="POST"])==0,requests
    assert page.evaluate("sessionStorage.length")>=1
    stored=page.evaluate("sessionStorage.getItem('abundent.crossings.public.session.v1')")
    assert 'How could willing neighbors' not in stored
    assert 'consentReceived":false' in stored or 'consentReceived": false' in stored

    # Workboard recognizes only the safe topic; posting still requires a new
    # explicit form submission and remains subject to human review.
    with page.expect_navigation():
        page.locator("#door-list a[href='/board/']").click()
    page.get_by_text("Continuing a public grocery starting point").wait_for()
    assert "What could a community grocery do first?" in page.locator("#thread-title").inner_text()
    assert len([r for r in requests if r[0]=="POST"])==0,requests

    page.goto(BASE+"/crossings/",wait_until="domcontentloaded")
    page.locator("#forget").click()
    assert page.locator("#save-return").is_disabled()
    assert page.evaluate("sessionStorage.getItem('abundent.crossings.public.session.v1')") is None

    # Care must not quietly appear on public Board under another topic.
    page.goto(BASE+"/first-yes/",wait_until="domcontentloaded")
    page.locator("#question").fill("Can willing people prepare a public safety stewardship checklist?")
    page.locator("#topic").select_option("care")
    page.locator("#prepare").click()
    assert page.locator("#open-crossing").is_enabled()
    page.locator("#open-crossing").click()
    page.wait_for_url("**/crossings/")
    assert page.locator("#door-list a[href='/still-here/']").count()==1
    assert page.locator("#door-list a[href='/board/']").count()==0
    assert page.locator("#door-list a[href='/tables/']").count()==0

    page.goto(BASE+"/first-yes/",wait_until="domcontentloaded")
    page.locator("#question").fill("My ex is controlling custody of my daughter and I need specific help")
    page.locator("#topic").select_option("care")
    page.locator("#prepare").click()
    assert page.locator("#open-crossing").is_disabled()
    assert len([r for r in requests if r[0]=="POST"])==0,requests
    print("AUTO-CROSSINGS-033: PASS, one tap, no downloads, no uploads, review gate, care boundary, forget")
    browser.close()
