"""POSTAL-PORCH-001: two independent real Chromium browser profiles, QR
payload transfer, nested webZ hosting path, and offline storage recovery.
Synthetic keys/parcel only; it neither scans physical cameras nor carries mail.
"""
import json
import pathlib
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
 def do_GET(self):
  if self.path.startswith("/nested/webZ/"):
   self.path=self.path[len("/nested/webZ"):]
  super().do_GET()
 def log_message(self,*a):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/nested/webZ/"
dispatch={
 "dispatch_version":"dispatch-gate-001","packet_id":"parcel-specimen-001",
 "work_id":"synthetic-work","edition_id":"synthetic-edition",
 "recipient_id":"specimen:fictional-recipient",
 "packet_manifest_sha256":"f"*64,
 "carrier_selection":{"carrier":"POSTAL-CORPS-SIMULATION","service":"offline-specimen",
                       "state":"human_selected","selected_at_utc":"2026-10-09T19:00:00+00:00"},
 "postage":None,"state":"service_selected",
 "events":[{"event":"service_selected","at_utc":"2026-10-09T19:00:00+00:00","note":"synthetic"}],
 "privacy":{"record_disposition":"local_only","rule":"DELIVERY DATA != PUBLICATION METADATA"},
 "law":["LABEL != POSTAGE","POSTAGE != TENDER","TRACKING CREATED != IN TRANSIT",
        "TENDER != DELIVERY","DELIVERED != READ"],
}
def packet(page):return page.evaluate("JSON.parse(JSON.stringify(lastPacket))")
def receive(page,packet_value):
 page.locator("#in").fill(json.dumps(packet_value))
 page.locator("#read-in").click()
 page.wait_for_timeout(80)
 assert not page.locator("#status").inner_text().startswith("HOLD:"),page.locator("#status").inner_text()
try:
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(headless=True)
  ctx_a=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True)
  ctx_b=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True)
  a=ctx_a.new_page();b=ctx_b.new_page()
  errors=[];requests=[]
  for page in (a,b):
   page.on("pageerror",lambda e:errors.append(str(e)))
   page.on("request",lambda r:requests.append(r.url))
   page.goto(base+"postal/pocket/two-phones.html")
   page.wait_for_function("() => document.querySelector('#status').textContent.includes('Storage prepared')")
  b.locator("#role").select_option("carrier1")
  a.locator("#key-setup").click()
  b.locator("#key-setup").click()
  for page in (a,b):
   page.wait_for_function("() => document.querySelector('#key-pub').textContent.includes('P-256')")
  pin_a=json.loads(a.locator("#key-pub").inner_text())
  pin_b=json.loads(b.locator("#key-pub").inner_text())
  assert pin_a!=pin_b
  pins=a.evaluate("""async ([origin,carrier1]) => {
    const others={};
    for(const name of ['relay','carrier2','recipient','witness'])
      others[name]=(await C.newKey()).publicJwk;
    return {origin,carrier1,...others};
  }""",[pin_a,pin_b])
  a.locator("#setup-in").fill(json.dumps({
   "dispatch":dispatch,"role_pins":pins,"parcel_sha256":"e"*64}))
  a.locator("#sign-route").click()
  a.wait_for_function("() => document.querySelector('#route-summary').textContent.includes('Signed route-specimen')")
  signed=a.evaluate("JSON.parse(JSON.stringify(setup))")
  b.locator("#setup-in").fill(json.dumps(signed))
  b.locator("#load-route").click()
  b.wait_for_function("() => document.querySelector('#route-summary').textContent.includes('Signed route-specimen')")
  b.locator("#accept").click()
  a_packet=packet(b)
  assert a_packet["type"]=="accept"
  receive(a,a_packet)
  a.locator("#issue").click()
  issue_packet=packet(a)
  assert issue_packet["type"]=="offer"
  receive(b,issue_packet)
  assert "PICKUP_LEG1" in b.locator("#scope").inner_text()
  b.locator("#consent").check()
  b.locator("#approve").click()
  reply_packet=packet(b)
  assert reply_packet["type"]=="reply"
  receive(a,reply_packet)
  a.locator("#commit").click()
  sync_packet=packet(a)
  assert sync_packet["type"]=="sync"
  receive(b,sync_packet)
  head_a=a.evaluate("C.hexhash(events.at(-1))")
  head_b=b.evaluate("C.hexhash(events.at(-1))")
  assert head_a==head_b
  assert "LEG1_MOVING_CLAIM" in a.locator("#head").inner_text()
  assert "LEG1_MOVING_CLAIM" in b.locator("#head").inner_text()
  assert a.evaluate("document.documentElement.scrollWidth <= innerWidth")
  if not b.evaluate("document.documentElement.scrollWidth <= innerWidth"):
   print("POSTAL-MOBILE-OVERFLOW",b.evaluate("""() => ({
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    elements:[...document.querySelectorAll('*')].filter(e=>{
     const box=e.getBoundingClientRect();
     return box.right>innerWidth+1 || box.left<-1;
    }).slice(0,18).map(e=>({tag:e.tagName,id:e.id,cls:e.className,
      right:Math.round(e.getBoundingClientRect().right),
      width:Math.round(e.getBoundingClientRect().width),
      scroll:e.scrollWidth,client:e.clientWidth}))
   })"""))
  assert b.evaluate("document.documentElement.scrollWidth <= innerWidth")
  # Both phone profiles install first-party static-only service workers.
  for page in (a,b):
   page.wait_for_function("() => navigator.serviceWorker.controller !== null",timeout=12000)
  ctx_a.set_offline(True);ctx_b.set_offline(True)
  a.reload();b.reload()
  for page in (a,b):
   page.wait_for_function("() => document.querySelector('#status').textContent.includes('Storage prepared')")
   page.locator("#key-setup").click()
   page.wait_for_function("() => document.querySelector('#head').textContent.includes('LEG1_MOVING_CLAIM')")
   assert head_a in page.locator("#head").inner_text()
   assert not page.locator("#status").inner_text().startswith("HOLD:")
  cache_a=a.evaluate("""async () => {
   const all=[];
   for(const name of await caches.keys())
    for(const req of await (await caches.open(name)).keys())all.push(req.url);
   return all;
  }""")
  assert any("/postal/pocket/two-phone-core.js" in x for x in cache_a)
  assert all("fieldkit" not in x for x in cache_a)
  assert all(u.startswith(base) for u in requests),requests
  assert not errors,errors
  print(json.dumps({"schema":"webz/postal-two-chromium-browsers/v0",
   "separate_browser_profiles":2,"offline_reloads":2,
   "matching_signed_history":True,"real_camera_scanned":False,
   "physical_parcel_moved":False,"penny_units":0,"errors":errors}))
  browser.close()
finally:server.shutdown()
