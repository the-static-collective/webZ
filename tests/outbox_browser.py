"""OUTBOX-001 mobile Chromium: encrypted local letters, no network, no hidden send."""
import json,pathlib,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright,expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*a):pass
srv=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=srv.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{srv.server_port}/bridge/outbox/"
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  context=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="block")
  page=context.new_page()
  exceptions=[];req=[]
  page.on("pageerror",lambda e:exceptions.append(str(e)))
  page.on("request",lambda e:req.append(e.url))
  page.goto(base,wait_until="load")
  expect(page.locator("#create")).to_be_visible()
  page.locator("#new-pass").fill("A private local-only prototype passphrase 29")
  page.locator("#new-pass-confirm").fill("A private local-only prototype passphrase 29")
  page.get_by_role("button",name="Create encrypted outbox and import source drafts").click()
  expect(page.locator("#workspace")).to_be_visible(timeout=15000)
  assert page.locator("#rack button").count()>=33
  page.locator("#find").fill("Waseca food shelf")
  assert page.locator("#rack button").count()>=1
  page.locator("#rack button").first.click()
  page.locator("#body").fill("private marker FOR-ONLY-OWNER-SECRET-MESSAGE")
  page.locator("#note").fill("needs independent recipient approval")
  page.get_by_role("button",name="Save encrypted revision").click()
  expect(page.locator("#message")).to_contain_text("Encrypted draft saved")
  enc=page.evaluate("""async()=>new Promise((resolve,reject)=>{const r=indexedDB.open('abundent_outbox_ciphertext_v1');r.onsuccess=()=>{const d=r.result,s=d.transaction('vault','readonly').objectStore('vault').get('owned-outbox');s.onsuccess=()=>resolve(s.result);s.onerror=()=>reject('read')};r.onerror=()=>reject('open')})""")
  assert "FOR-ONLY-OWNER" not in json.dumps(enc)
  assert enc["schema"]=="abundent/outbox-ciphertext-v1"
  assert len(enc["ciphertext"])>100
  with page.expect_download() as dl:page.get_by_role("button",name="Download encrypted backup").click()
  backup=json.loads(pathlib.Path(dl.value.path()).read_text())
  assert "FOR-ONLY-OWNER" not in json.dumps(backup)
  page.get_by_role("button",name="Lock",exact=True).click()
  expect(page.locator("#unlock")).to_be_visible()
  page.locator("#pass").fill("A private local-only prototype passphrase 29")
  page.get_by_role("button",name="Unlock existing outbox").click()
  expect(page.locator("#workspace")).to_be_visible(timeout=15000)
  page.locator("#find").fill("Waseca food shelf")
  page.locator("#rack button").first.click()
  assert "FOR-ONLY-OWNER" in page.locator("#body").input_value()
  page.locator("#letter-status").select_option("SENT_REPORTED")
  page.get_by_role("button",name="Save encrypted revision").click()
  expect(page.locator("#message")).to_contain_text("Reporting sent requires")
  page.locator("#letter-status").select_option("DRAFT")
  page.locator("#find").fill("")
  assert not exceptions,exceptions
  assert req and all(url.startswith(f"http://127.0.0.1:{srv.server_port}/bridge/") for url in req),req 
  assert all("/api/" not in url for url in req),req
  assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
  print(json.dumps({"schema":"abundent/outbox-mobile-proof-v1","seeded_letters":33,"encrypted_at_rest":True,"edit_recovered_after_unlock":True,"reported_sent_requires_evidence":True,"no_network":True,"page_errors":0}))
  browser.close()
finally:srv.shutdown()
