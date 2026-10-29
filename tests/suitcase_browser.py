"""SUITCASE-001: two independent browser devices exchange signed files, not HTTP packets."""
import json,pathlib,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright,expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def log_message(self,*args):pass
srv=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=srv.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{srv.server_port}/bridge/suitcase/"
def make_room(page,label,kind):
 page.locator("#room-label").fill(label)
 page.locator("#room-kind").select_option(kind)
 page.locator("#room-consent").check()
 page.get_by_role("button",name="CREATE LOCAL ROOM + NONEXPORTABLE KEY").click()
 expect(page.locator("#room-count")).to_have_text("1",timeout=15000)
def transport_from(page,kind):
 selector=page.locator(".packet-item").filter(has_text=kind).first
 with page.expect_download() as dl:selector.get_by_role("button",name="Download signed JSON").click()
 return pathlib.Path(dl.value.path()).read_bytes()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  a=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="allow")
  b=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="allow")
  pa=a.new_page();pb=b.new_page()
  errors=[];requests=[]
  for tab in [pa,pb]:
   tab.on("pageerror",lambda err:errors.append(str(err)))
   tab.on("request",lambda req:requests.append(req.url))
   tab.goto(base,wait_until="load")
  make_room(pa,"Garden fictional sender room","PERSON")
  make_room(pb,"Church fictional receiver room","CHURCH_CANDIDATE")
  pa.get_by_role("button",name="SIGN OFFER · SAVE LOCALLY").click()
  expect(pa.locator("#packet-count")).to_have_text("1",timeout=16000)
  offer=transport_from(pa,"OFFER:")
  p_offer=json.loads(offer);assert p_offer["payload"]["kind"]=="OFFER"
  assert "privateKey" not in offer.decode()
  pb.locator("#import").set_input_files({"name":"offer.json","mimeType":"application/json","buffer":offer})
  expect(pb.locator("#packet-count")).to_have_text("1",timeout=16000)
  expect(pb.locator("#status")).to_contain_text("Valid P-256 signature")
  pb.locator("#reply-decision").select_option("REFUSE")
  pb.get_by_role("button",name="SIGN INDEPENDENT RESPONSE").click()
  expect(pb.locator("#packet-count")).to_have_text("2",timeout=16000)
  receipt=transport_from(pb,"RESPONSE:")
  p_receipt=json.loads(receipt)
  assert p_receipt["payload"]["body"]["onDigest"]==p_offer["digest"]
  assert p_receipt["payload"]["issuer"]["fingerprint"]!=p_offer["payload"]["issuer"]["fingerprint"]
  pa.locator("#import").set_input_files({"name":"response.json","mimeType":"application/json","buffer":receipt})
  expect(pa.locator("#packet-count")).to_have_text("2",timeout=16000)
  assert "cryptographically references" in pa.locator(".packet-item").first.inner_text()
  tampered=json.loads(offer);tampered["payload"]["body"]["title"]="After-signature rewrite"
  pb.locator("#import").set_input_files({"name":"bad.json","mimeType":"application/json","buffer":json.dumps(tampered).encode()})
  expect(pb.locator("#status")).to_contain_text("HOLD",timeout=16000)
  expect(pb.locator("#packet-count")).to_have_text("2")
  pb.locator("#node-cards button").filter(has_text="Church").click()
  pb.get_by_role("button",name="SIGN UNVERIFIED HOST PROPOSAL").click()
  expect(pb.locator("#packet-count")).to_have_text("3",timeout=16000)
  assert "NOT permission" in pb.locator("#status").inner_text()
  expect(pa.locator("#room-count")).to_have_text("1")
  if not pa.evaluate("document.documentElement.scrollWidth<=window.innerWidth"):
   print("OVERFLOW_A",pa.evaluate("""()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,parts:[...document.querySelectorAll("*")].filter(el=>el.getBoundingClientRect().right>innerWidth+2).slice(0,8).map(el=>({tag:el.tagName,id:el.id,klass:el.className,right:Math.round(el.getBoundingClientRect().right)}))})"""),flush=True)
  assert pa.evaluate("document.documentElement.scrollWidth<=window.innerWidth")
  if not pb.evaluate("document.documentElement.scrollWidth<=window.innerWidth"):
   print("OVERFLOW_B",pb.evaluate("""()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,parts:[...document.querySelectorAll("*")].filter(el=>el.getBoundingClientRect().right>innerWidth+2).slice(0,8).map(el=>({tag:el.tagName,id:el.id,klass:el.className,right:Math.round(el.getBoundingClientRect().right)}))})"""),flush=True)
  assert pb.evaluate("document.documentElement.scrollWidth<=window.innerWidth")
  # A new visit should work with network disabled after the SW cached its public shell.
  pa.evaluate("navigator.serviceWorker.ready")
  pa.reload(wait_until="load")
  pa.evaluate("navigator.serviceWorker.ready")
  a.set_offline(True)
  pa.reload(wait_until="load")
  expect(pa.locator("#hero-title")).to_contain_text("SUITCASE")
  expect(pa.locator("#room-count")).to_have_text("1",timeout=16000)
  assert not errors,errors
  assert requests and all(url.startswith(f"http://127.0.0.1:{srv.server_port}/bridge/") for url in requests),requests
  print(json.dumps({"schema":"abundent/suitcase-browser-proof-v1","independent_browser_contexts":2,"nonexportable_local_keys":2,"signed_offer_and_response":True,"tampering_rejected":True,"unverified_church_host_only":True,"offline_reload":True,"browser_errors":errors}))
  browser.close()
finally:srv.shutdown()
