"""SUITCASE-002: two isolated browsers establish seed/child relationship and opt-in listing by signed files."""
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
def create_room(p,label):
 p.locator("#room-label").fill(label)
 p.locator("#room-kind").select_option("PERSON")
 p.locator("#room-consent").check()
 p.get_by_role("button",name="CREATE LOCAL ROOM + NONEXPORTABLE KEY").click()
 expect(p.locator("#room-count")).to_have_text("1",timeout=15000)
def parcel_bytes(p,kind):
 card=p.locator(".packet-item").filter(has_text=kind).first
 with p.expect_download() as dl:card.get_by_role("button",name="Download signed JSON").click()
 return pathlib.Path(dl.value.path()).read_bytes()
def import_bytes(p,filename,data):
 p.locator("#import").set_input_files({"name":filename,"mimeType":"application/json","buffer":data})
 expect(p.locator("#status")).to_contain_text("Valid P-256 signature",timeout=15000)
try:
 with sync_playwright() as pl:
  browser=pl.chromium.launch(headless=True)
  ctx_a=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="allow")
  ctx_b=browser.new_context(viewport={"width":390,"height":844},accept_downloads=True,service_workers="allow")
  a=ctx_a.new_page();b=ctx_b.new_page();errors=[]
  for p in (a,b):
   p.on("pageerror",lambda err:errors.append(str(err)))
   p.goto(base,wait_until="load")
  create_room(a,"Ancestor demonstration room")
  create_room(b,"New independent descendant")
  a.locator("#seed-form button").click()
  expect(a.locator("#packet-count")).to_have_text("1",timeout=15000)
  seed=parcel_bytes(a,"SEED:")
  seed_json=json.loads(seed)
  assert seed_json["payload"]["body"]["authority"]=="INVITATION_NOT_CONTROL"
  import_bytes(b,"seed.json",seed)
  b.locator("#genesis-seed").select_option(seed_json["digest"])
  b.locator("#genesis-consent").check()
  b.locator("#genesis-form button").click()
  expect(b.locator("#packet-count")).to_have_text("2",timeout=15000)
  genesis=parcel_bytes(b,"GENESIS:")
  genesis_json=json.loads(genesis)
  assert genesis_json["payload"]["body"]["ancestorFingerprint"]==seed_json["payload"]["issuer"]["fingerprint"]
  assert genesis_json["payload"]["issuer"]["fingerprint"]!=seed_json["payload"]["issuer"]["fingerprint"]
  import_bytes(a,"genesis.json",genesis)
  b.locator("#cap-consent").check()
  b.locator("#cap-form button").click()
  expect(b.locator("#packet-count")).to_have_text("3",timeout=15000)
  cap=parcel_bytes(b,"CAPABILITY:")
  cap_json=json.loads(cap)
  assert cap_json["payload"]["body"]["visibility"]=="PUBLIC_OPT_IN"
  import_bytes(a,"capability.json",cap)
  expect(a.locator("#cap-list article")).to_have_count(1,timeout=15000)
  a.locator("#cap-list article button").click()
  expect(a.locator("#offer-to")).to_have_value(genesis_json["payload"]["issuer"]["fingerprint"])
  assert "NODE ALIVE: NOT VERIFIED" in b.locator("#node-evidence").inner_text()
  b.locator("#withdraw-form button").click()
  expect(b.locator("#packet-count")).to_have_text("4",timeout=15000)
  expect(b.locator("#cap-list article")).to_have_count(0,timeout=15000)
  withdrawal=parcel_bytes(b,"WITHDRAW:")
  import_bytes(a,"withdrawal.json",withdrawal)
  expect(a.locator("#cap-list article")).to_have_count(0,timeout=15000)
  # A second unrelated key's withdrawal could not have revoked the child's capability.
  assert "NODE ALIVE: NOT VERIFIED" in a.locator("#node-evidence").inner_text()
  for p in (a,b):
   assert p.evaluate("document.documentElement.scrollWidth<=window.innerWidth")
  b.evaluate("navigator.serviceWorker.ready")
  b.reload(wait_until="load")
  b.evaluate("navigator.serviceWorker.ready")
  ctx_b.set_offline(True)
  b.reload(wait_until="load")
  expect(b.locator("#packet-count")).to_have_text("4",timeout=15000)
  expect(b.locator("#cap-list article")).to_have_count(0,timeout=15000)
  assert not errors,errors
  print(json.dumps({"schema":"abundent/suitcase-independent-genesis-browser-v1",
   "contexts":2,"ancestor_and_child_different_keys":True,"signed_genesis_and_opt_in_capability":True,
   "receiver_local_discovery_only":True,"issuer_withdrawal_imported":True,"node_alive_unverified":True,
   "offline_restart":True,"errors":errors}))
  browser.close()
finally:srv.shutdown()
