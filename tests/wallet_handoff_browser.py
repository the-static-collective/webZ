"""Wallet Handoff 002 — real Chromium inbox and Switchboard → encrypted wallet.
No private URL in popup navigation, browser storage, query or backend. Synthetic only.
"""
import json,pathlib,mimetypes
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
root="https://apps.abundent.org/"
def serve_static(route):
 path=urlparse(route.request.url).path
 if path=="/":file=ROOT/"apps/index.html"
 elif path in {"/style.css","/main.mjs","/manifest.mjs"}:file=ROOT/"apps"/path.lstrip("/")
 elif path.endswith("/"):file=ROOT/path.lstrip("/")/"index.html"
 else:file=ROOT/path.lstrip("/")
 if not file.is_file():
  route.fulfill(status=404,body="Not Found")
  return
 mime=mimetypes.guess_type(str(file))[0] or "application/octet-stream"
 route.fulfill(status=200,body=file.read_bytes(),content_type=mime,
  headers={"cache-control":"no-store"})
room="a1234567-b123-4234-8234-123456789abc"
owner="SYNTHETIC_OWNER_KEY_12345678901234567890123"
reviewer="SYNTHETIC_REVIEWER_KEY_12345678901234567890"
submitter="SYNTHETIC_SUBMITTER_KEY_1234567890123456789"
assert len(owner)==43 and len(reviewer)==43 and len(submitter)==43
passphrase="Handoff test sufficiently long passphrase"
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  ctx=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,
    service_workers="block",accept_downloads=True)
  ctx.route("https://apps.abundent.org/**",serve_static)
  inbox=ctx.new_page()
  requests=[];errors=[]
  inbox.on("pageerror",lambda e:errors.append(str(e)))
  def mock_api(route):
   body=json.loads(route.request.post_data)
   assert body["action"]=="create"
   route.fulfill(status=200,content_type="application/json",
    headers={"access-control-allow-origin":"https://apps.abundent.org"},
    body=json.dumps({"room":{"id":room,"title":"SYNTHETIC Local Pantry Room","region":"Fictional test",
     "createdAt":"2026-10-28T20:00:00.000Z","closed":False},
     "role":"owner","keys":{"owner":owner,"reviewer":reviewer,"submitter":submitter}}))
  inbox.route("https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/commons-inbox",mock_api)
  inbox.goto(root+"commons/inbox/")
  inbox.locator("#createForm input[name=title]").fill("SYNTHETIC Local Pantry Room")
  inbox.locator("#createForm input[name=region]").fill("Fictional test")
  inbox.locator("#createForm input[name=consent]").check()
  inbox.get_by_role("button",name="Create inbox and invitation links").click()
  inbox.locator("#newKeys").wait_for(state="visible")
  expected_url=inbox.locator("#ownerLink").input_value()
  assert owner in expected_url
  with inbox.expect_popup() as popup:
   inbox.get_by_role("button",name="Keep owner link in wallet").click()
  wallet=popup.value
  wallet.on("request",lambda req:requests.append(req.url))
  wallet.on("pageerror",lambda e:errors.append(str(e)))
  wallet.get_by_role("heading",name="Your worlds. One keyring.").wait_for()
  wallet.locator("#handoff").wait_for(state="visible")
  assert wallet.get_by_text("SYNTHETIC Local Pantry Room · owner access").is_visible()
  assert owner not in wallet.url and "room=" not in wallet.url
  assert not any(owner in x for x in requests),requests
  assert wallet.get_by_role("button",name="Keep link in wallet").is_disabled()
  wallet.locator("#createForm input[name=pass]").fill(passphrase)
  wallet.locator("#createForm input[name=repeat]").fill(passphrase)
  wallet.get_by_role("button",name="Create encrypted wallet").click()
  wallet.locator("#vault").wait_for(state="visible")
  assert wallet.locator("#handoff").is_visible()
  assert wallet.locator("#entries .linkcard").count()==0
  wallet.get_by_role("button",name="Keep link in wallet").click()
  wallet.get_by_role("heading",name="SYNTHETIC Local Pantry Room · owner access").wait_for()
  assert wallet.locator("#handoff").is_hidden()
  assert owner not in wallet.locator("#entries").inner_text()
  # Confirm ciphertext, not the credential, is stored.
  vault=str(wallet.evaluate("""async()=> {
   const q=indexedDB.open('abundent_link_wallet_001');
   const db=await new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
   const tx=db.transaction('ciphertext'),r=tx.objectStore('ciphertext').get('vault');
   const data=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
   db.close();return JSON.stringify(data)
  }"""))
  assert owner not in vault
  # Newly opened same-origin app index offers a public bookmark.
  switch=ctx.new_page()
  switch.on("pageerror",lambda e:errors.append(str(e)))
  switch.goto(root)
  switch.get_by_role("heading",name="One garden. Many doors.").wait_for()
  keep=switch.get_by_role("button",name="Keep",exact=False).first
  with switch.expect_popup() as popup2:keep.click()
  wallet2=popup2.value
  wallet2.locator("#handoff").wait_for(state="visible")
  assert wallet2.locator("#handoffSave").is_disabled()
  wallet2.get_by_role("button",name="Discard offered link").click()
  assert wallet2.locator("#handoff").is_hidden()
  # The original link wasn't automatically saved a second time.
  assert wallet.locator("#entries .linkcard").count()==1
  assert all(owner not in u for u in requests)
  assert not errors,errors
  print(json.dumps({"schema":"webz/wallet-handoff-browser-proof/v1",
    "mobile":True,"inbox_owner_offer":True,"wallet_confirm_required":True,
    "link_not_in_wallet_navigation":True,"private_key_not_in_requests":True,
    "ciphertext_storage_only":True,"switchboard_offer":True,
    "discard_without_save":True,"page_errors":errors}))
  browser.close()
# All test state was in isolated Playwright contexts, no remote partner inbox was created.
