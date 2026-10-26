"""Browser contract for the public-only Abundent First Yes doorway.

Runs ONLY against a local static test server with a mocked public reviewed feed.
Never uses member accounts, production service keys or submits a real question.
"""
import json
import os
from playwright.sync_api import sync_playwright

BASE=os.environ.get("FIRST_YES_BROWSER_URL","http://127.0.0.1:8123")
PUBLIC="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/workboard-history"

sample={
 "schema":"abundent/workboard-history-v1","reviewedOnly":True,
 "entries":[{
  "id":"bd806742-7b1e-4ab7-8194-2c01c14a1121",
  "thread":"grocery","kind":"concern","status":"PUBLIC_REVIEWED",
  "text":"Would someone verify whether the planned food options are current before making claims?",
  "createdAt":"2026-10-24T12:00:00Z","publishedAt":"2026-10-25T12:00:00Z"
 }],
 "nextBefore":None
}

with sync_playwright() as play:
 browser=play.chromium.launch(headless=True,args=["--no-sandbox"])
 page=browser.new_page(viewport={"width":390,"height":844},
                       device_scale_factor=1,is_mobile=True,has_touch=True)
 observed=[]
 page.on("request",lambda req: observed.append((req.method,req.url)))
 page.goto(BASE+"/first-yes/",wait_until="networkidle",timeout=35000)
 assert page.title()=="The First Yes · Abundent"
 assert page.locator("#result").is_hidden()
 assert len([r for r in observed if PUBLIC in r[1]])==0,observed

 # The user submits one local question: no POST of text, no backend authority.
 page.locator("#prepare").click()
 assert page.locator("#result").is_visible()
 assert "Find the first willing witness" in page.locator("#resultTitle").inner_text()
 assert "Editorial starting point" in page.locator("#resultIntro").inner_text()
 assert page.locator("#save").is_enabled()
 assert len([r for r in observed if r[0]=="POST"])==0,observed
 assert len([r for r in observed if PUBLIC in r[1]])==0,observed
 with page.expect_download() as dl:
  page.locator("#save").click()
 assert dl.value.suggested_filename.endswith("-unsent.md")
 assert "/board/#v=1&topic=grocery" in page.locator("#threadLink").get_attribute("href")

 # Only an explicit click GETs already-reviewed history; text never leaves browser.
 def answer(route):
  assert route.request.method=="GET"
  assert "thread=grocery" in route.request.url
  assert "neighbors" not in route.request.url
  route.fulfill(status=200,content_type="application/json",body=json.dumps(sample))
 page.route(PUBLIC+"**",answer)
 page.locator("#readHistory").click()
 assert "1 public reviewed" in page.locator("#historyStatus").inner_text()
 page.locator("#prepare").click()
 assert "Reviewed public comment referenced" in page.locator("#resultIntro").inner_text()
 assert sample["entries"][0]["id"] in page.locator("#resultGrid").inner_text()
 assert sample["entries"][0]["text"] not in page.locator("#resultGrid").inner_text()
 assert len([r for r in observed if PUBLIC in r[1]])==1
 assert len([r for r in observed if r[0]=="POST"])==0

 # A personal-case question is held locally, not copied or exported.
 page.locator("#question").fill("My ex is controlling custody of my daughter and I need specific help")
 page.locator("#topic").select_option("care")
 page.locator("#prepare").click()
 assert page.locator("#result").is_visible()
 assert "Keep your personal story in your own hands" in page.locator("#resultTitle").inner_text()
 assert page.locator("#save").is_disabled()
 assert page.locator("#threadLink").get_attribute("href")=="/still-here/"
 assert len([r for r in observed if r[0]=="POST"])==0

 # Unrelated public question is not forced into Abundent's work.
 page.locator("#question").fill("Why does this compiler complain about an import?")
 page.locator("#topic").select_option("auto")
 page.locator("#prepare").click()
 assert "Choose the right subject first" in page.locator("#resultTitle").inner_text()
 assert page.locator("#save").is_disabled()

 # Mobile check: no x-overflow at normal phone width.
 width=page.evaluate("document.documentElement.scrollWidth")
 assert width<=390,f"horizontal overflow width={width}"
 print("FIRST-YES-030 browser acceptance: PASS (mobile, local preparation, optional reviewed GET, withheld case, no POST)")
 browser.close()
