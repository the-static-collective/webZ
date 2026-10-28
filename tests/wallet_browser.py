"""Abundent Link Wallet 001 — real mobile Chromium private keyring verification."""
import json
import pathlib
import threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
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
base=f"http://127.0.0.1:{server.server_port}/nested/webZ/commons/wallet/"
secret="https://apps.abundent.org/commons/inbox/#room=12345678-1234-4234-8234-123456789abc&key=SHOULD_NOT_BE_VISIBLE_IN_INDEXEDDB_123456789"
passphrase="A secure but reproducible test passphrase 123!"
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  ctx=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,
    accept_downloads=True,service_workers="block")
  page=ctx.new_page()
  outgoing=[]
  errors=[]
  page.on("request",lambda req:outgoing.append(req.url))
  page.on("pageerror",lambda err:errors.append(str(err)))
  page.goto(base)
  page.get_by_role("heading",name="Your worlds. One keyring.").wait_for()
  assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
  page.locator("#createForm input[name=pass]").fill(passphrase)
  page.locator("#createForm input[name=repeat]").fill(passphrase)
  page.get_by_role("button",name="Create encrypted wallet").click()
  page.locator("#vault").wait_for(state="visible")
  page.locator("#addForm input[name=title]").fill("Test Garden owner")
  page.locator("#addForm input[name=url]").fill(secret)
  page.locator("#addForm select[name=scope]").select_option("owner")
  page.locator("#addForm input[name=group]").fill("Waseca")
  page.get_by_role("button",name="Encrypt and save link").click()
  page.get_by_role("heading",name="Test Garden owner").wait_for()
  assert "SHOULD_NOT_BE_VISIBLE" not in page.locator("#entries").inner_text()
  assert "Test Garden owner" in page.locator("#entries").inner_text()
  disk=page.evaluate("""async () => {
    const db=await new Promise((res,rej)=>{const q=indexedDB.open('abundent_link_wallet_001');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
    const value=await new Promise((res,rej)=>{const q=db.transaction('ciphertext').objectStore('ciphertext').get('vault');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
    db.close();
    return JSON.stringify(value);
  }""")
  assert "SHOULD_NOT_BE_VISIBLE" not in disk
  assert "Test Garden owner" not in disk
  assert '"ciphertext"' in disk
  assert page.evaluate("localStorage.length")==0
  with page.expect_download() as download:
   page.get_by_role("button",name="Download encrypted backup").click()
  raw=pathlib.Path(download.value.path()).read_text()
  backup=json.loads(raw)
  assert backup["schema"]=="abundent.link-wallet/v1"
  assert "SHOULD_NOT_BE_VISIBLE" not in raw and "Test Garden owner" not in raw
  page.get_by_role("button",name="Lock wallet").click()
  assert page.locator("#vault").is_hidden()
  page.reload()
  assert page.locator("#unlockForm").is_visible()
  page.locator("#unlockForm input[name=pass]").fill("A completely wrong password that is long")
  page.get_by_role("button",name="Unlock this device").click()
  page.wait_for_function("()=>document.querySelector('#status').textContent.includes('Incorrect')")
  assert page.locator("#vault").is_hidden()
  page.locator("#unlockForm input[name=pass]").fill(passphrase)
  page.get_by_role("button",name="Unlock this device").click()
  page.locator("#vault").wait_for(state="visible")
  assert "Test Garden owner" in page.locator("#entries").inner_text()
  # Different browser context: zero shared storage, authenticated backup import.
  second=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,
   accept_downloads=True,service_workers="block")
  imported=second.new_page();imported.goto(base)
  assert imported.locator("#createForm").is_visible()
  imported.get_by_role("button",name="Restore an encrypted backup").click()
  imported.locator("#restoreForm input[name=file]").set_input_files({
   "name":"wallet-encrypted.json","mimeType":"application/json","buffer":raw.encode("utf8")})
  imported.locator("#restoreForm input[name=pass]").fill(passphrase)
  imported.get_by_role("button",name="Validate and restore backup").click()
  imported.locator("#vault").wait_for(state="visible")
  assert imported.get_by_role("heading",name="Test Garden owner").is_visible()
  assert imported.evaluate("localStorage.length")==0
  assert not errors,errors
  assert all(u.startswith(base) for u in outgoing),outgoing
  print(json.dumps({"schema":"webz/link-wallet-browser-proof/v1",
    "mobile":True,"nested_base":True,"encrypted_at_rest":True,
    "backup_is_ciphertext":True,"wrong_password":"REFUSED",
    "cross_context_encrypted_restore":True,"no_network_upload":True,
    "no_plaintext_localstorage":True,"page_errors":errors}))
  second.close();browser.close()
finally:
 server.shutdown()
