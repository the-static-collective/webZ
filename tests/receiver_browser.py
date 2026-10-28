"""Living Receiver — real mobile Chromium, portable field card, no hidden upload."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):
  super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path.startswith("/nested/webZ/"):
   self.path=self.path[len("/nested/webZ"):]
  return super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{server.server_port}/nested/webZ/commons/receiver/"
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  context=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,
                              accept_downloads=True,service_workers="block")
  page=context.new_page()
  requests=[];errors=[]
  page.on("request",lambda r:requests.append(r.url))
  page.on("pageerror",lambda e:errors.append(str(e)))
  page.goto(url)
  page.get_by_role("heading",name="A door that can say yes, no, or not yet.").wait_for()
  assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
  page.get_by_role("button",name="Try a clearly synthetic sample").click()
  assert "SYNTHETIC SAMPLE" in page.locator("#kind").inner_text()
  assert not page.locator("#decisionSection").is_hidden()
  page.locator("#decisionForm").locator("select[name=decision]").select_option("ACCEPT_FOR_LOCAL_REVIEW")
  page.locator("#decisionForm").locator("textarea[name=reason]").fill(
      "We could test a small local food parcel route after permission from the actual operator.")
  page.locator("#decisionForm").locator("input[name=attestation]").check()
  page.get_by_role("button",name="Make review response").click()
  assert "NOT_SIGNED" in page.locator("#responseJson").inner_text()
  assert "NOT_VERIFIED" in page.locator("#responseJson").inner_text()
  assert page.locator("#reportSection").is_visible()
  with page.expect_download() as response_download:
   page.get_by_role("button",name="Download response JSON").click()
  response=json.loads(pathlib.Path(response_download.value.path()).read_text())
  assert response["decision"]=="ACCEPT_FOR_LOCAL_REVIEW"
  assert response["recipient_confirmed"] is False
  page.locator("#reportForm").locator("select[name=field_status]").select_option("REPORTED_PARTIAL")
  page.locator("#reportForm").locator("input[name=quantity_reported]").fill("2")
  page.locator("#reportForm").locator("textarea[name=summary]").fill(
       "The local volunteer reports preparing two parcels; receiving organization has not confirmed delivery.")
  page.locator("#reportForm").locator("input[name=attestation]").check()
  page.get_by_role("button",name="Prepare unverified report").click()
  with page.expect_download() as report_download:
   page.get_by_role("button",name="Download report JSON").click()
  report=json.loads(pathlib.Path(report_download.value.path()).read_text())
  assert report["field_verified"] is False and report["recipient_confirmed"] is False
  assert report["quantity_reported"]==2
  # Re-import a response without an account, in a fresh browser tab.
  fresh=context.new_page();fresh.goto(url)
  fresh.locator("#packetFile").set_input_files({
   "name":"response.json","mimeType":"application/json",
   "buffer":json.dumps(response).encode("utf8")})
  fresh.wait_for_function("()=>document.querySelector('#kind').textContent.includes('REVIEW RESPONSE')")
  assert fresh.locator("#decisionSection").is_hidden()
  assert "not been" not in fresh.locator("#detail").inner_text().lower()
  # Tamper with the claimed decision by attaching new approval.
  attack={**response,"recipient_confirmed":True}
  fresh.locator("#packetFile").set_input_files({
   "name":"fake.json","mimeType":"application/json",
   "buffer":json.dumps(attack).encode("utf8")})
  fresh.wait_for_function("()=>document.querySelector('#status').textContent.includes('Invalid')")
  assert fresh.locator("#inspection").is_hidden()
  page.reload()
  assert page.locator("#inspection").is_hidden()
  assert page.evaluate("localStorage.length")==0
  assert fresh.evaluate("localStorage.length")==0
  assert all(u.startswith(url.rsplit("commons/receiver/",1)[0]) for u in requests)
  assert not errors,errors
  print(json.dumps({"schema":"webz/living-receiver-browser-proof/v0",
      "mobile":True,"nested_base":True,"source_inspection":True,
      "self_attested_local_review":True,"download_and_import":True,
      "unverified_report":True,"tampered_confirmation":"REFUSED",
      "client_storage":False,"client_upload":False,"page_errors":errors}))
  browser.close()
finally:
 server.shutdown()
