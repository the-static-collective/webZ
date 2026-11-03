"""LINK WALLET 003 — synthetic mobile Chromium owner-delegation + encrypted shortcut test.
No actual user's signing key, grant or real person is put in CI.
"""
import json, pathlib, mimetypes, subprocess
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE="https://apps.abundent.org"
DESK=BASE+"/commons/wallet/authority/"
WALLET=BASE+"/commons/wallet/"
passphrase="A long synthetic Link Wallet 003 test passphrase!"
generation=r"""
import {
createGrantBody,createRevocationBody,normalizePublicKey,signBody,grantDigest,randomNonce
} from './commons/wallet/authority/delegation-core.mjs';
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
const pub=normalizePublicKey({kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y});
const issued=new Date(Date.now()-60000).toISOString();
const expiry=new Date(Date.now()+86400000).toISOString();
const grant=await signBody(createGrantBody({ownerPublicKey:pub,issuedAt:issued,
 expiresAt:expiry,nonce:randomNonce(),scopes:['DRAFT_EXPERIMENT','PROPOSE_PULL_REQUEST','CHECK_MATH']
}),pair.privateKey);
const revoke=await signBody(createRevocationBody({ownerPublicKey:pub,
 grantHash:await grantDigest(grant),revokedAt:new Date().toISOString(),nonce:randomNonce()
}),pair.privateKey);
console.log(JSON.stringify({grant,revoke}));
"""
items=json.loads(subprocess.check_output(["node","--input-type=module","-e",generation],
 cwd=ROOT,text=True))
grant=json.dumps(items["grant"],separators=(",",":")).encode()
rev=json.dumps(items["revoke"],separators=(",",":")).encode()
secret_signature=items["grant"]["signature"]
assert len(secret_signature)>50

def serve(route):
 path=urlparse(route.request.url).path
 if path.endswith("/"):
  file=ROOT/path.lstrip("/")/"index.html"
 else:
  file=ROOT/path.lstrip("/")
 if not file.is_file():
  route.fulfill(status=404,body="Not Found")
  return
 mime=mimetypes.guess_type(str(file))[0] or "application/octet-stream"
 route.fulfill(status=200,body=file.read_bytes(),content_type=mime,
  headers={"cache-control":"no-store"})

def configure(ctx,requests):
 def route(req):
  url=req.request.url
  requests.append(url)
  if url.startswith(BASE+"/"):serve(req)
  else:req.abort()
 ctx.route("**/*",route)

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 ctx=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1,
   accept_downloads=True,service_workers="block")
 outgoing=[];errors=[]
 configure(ctx,outgoing)
 page=ctx.new_page()
 page.on("pageerror",lambda e:errors.append(str(e)))
 page.goto(DESK)
 page.get_by_role("heading",name="Your keys. Your decisions.").wait_for()
 assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
 assert page.locator("#pinButton").is_disabled()
 assert page.locator("#hold").is_disabled()
 page.locator("#grantFile").set_input_files({
  "name":"WF008-SYNTHETIC-ONLY.json","mimeType":"application/json","buffer":grant
 })
 page.wait_for_function("()=>document.querySelector('#signature')?.textContent.includes('VALID')")
 fingerprint=page.locator("#fp").inner_text()
 assert len(fingerprint)==64
 assert page.locator("#grantPreview").is_visible()
 assert page.locator("#hold").is_disabled()
 assert "PROPOSE_PULL_REQUEST" in page.locator("#scopes").inner_text()
 assert page.locator("#grantHash").inner_text()!=fingerprint
 # Bad confirmation cannot create local trust root.
 page.locator("#confirmFingerprint").fill("0"*64)
 page.locator("#confirmIntent").check()
 page.get_by_role("button",name="Confirm and pin locally").click()
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.startsWith('REFUSED:')")
 assert page.locator("#hold").is_disabled()
 page.locator("#confirmFingerprint").fill(fingerprint)
 page.get_by_role("button",name="Confirm and pin locally").click()
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.includes('locally pinned')")
 assert page.locator("#hold").is_enabled()
 page.get_by_role("button",name="Sign review HOLD").click()
 page.wait_for_function("()=>document.querySelector('#receipt')?.textContent.includes('HOLD')")
 assert "native_relatte_r3" in page.locator("#receipt").inner_text()
 assert "actual_execution" in page.locator("#receipt").inner_text()
 with page.expect_download() as download:
  page.get_by_role("button",name="Download latest signed review receipt").click()
 public_receipt=json.loads(pathlib.Path(download.value.path()).read_text())
 assert public_receipt["body"]["decision"]["decision"]=="HOLD"
 assert public_receipt["body"]["decision"]["native_relatte_receipt"] is False
 check=r"""
import {readFileSync} from 'node:fs';
import {verifyReviewReceipt} from './commons/wallet/authority/core.mjs';
const r=JSON.parse(readFileSync(process.argv[1],'utf8'));
if(!(await verifyReviewReceipt(r)))process.exit(2);
"""
 subprocess.run(["node","--input-type=module","-e",check,str(download.value.path())],
  cwd=ROOT,check=True)
 # Unsafe actions are refused under that valid owner grant.
 page.locator("#action").select_option("MERGE_CODE")
 page.get_by_role("button",name="Sign review HOLD").click()
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.startsWith('REFUSED:')")
 page.get_by_role("button",name="Sign REFUSE").click()
 page.wait_for_function("()=>document.querySelector('#receipt')?.textContent.includes('REFUSE')")
 assert "REFUSE" in page.locator("#receipt").inner_text()
 # User-signed revocation of exact grant; never signed by the desk.
 page.locator("#revokeFile").set_input_files({
  "name":"WF008-SYNTHETIC-REVOCATION.json","mimeType":"application/json","buffer":rev
 })
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.includes('revocation verified')")
 page.get_by_role("button",name="Verify and apply local revocation").click()
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.includes('recorded locally')")
 page.locator("#action").select_option("CHECK_MATH")
 page.get_by_role("button",name="Sign review HOLD").click()
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.includes('REVOKED_BY_OWNER')")
 # Link Wallet 002 handoff: user deliberately saves only the PUBLIC desk door.
 with page.expect_popup() as popup:
  page.get_by_role("button",name="Keep this desk in Link Wallet").click()
 wallet=popup.value
 wallet.on("pageerror",lambda e:errors.append(str(e)))
 wallet.get_by_role("heading",name="Your worlds. One keyring.").wait_for()
 try:
  wallet.locator("#handoff").wait_for(state="visible",timeout=8000)
 except Exception:
  print("WF003_DEBUG_HANDOFF="+json.dumps({
   "popup_url":wallet.url,"source_url":page.url,
   "source_status":page.locator("#status").inner_text(),
   "popup_status":wallet.locator("#status").inner_text(),
   "opener":wallet.evaluate("Boolean(window.opener)"),
   "opener_path":wallet.evaluate("(()=>{try{return window.opener?.location?.pathname}catch(e){return String(e)}})()"),
   "errors":errors
  }))
  raise
 assert wallet.locator("#handoffSave").is_disabled()
 assert "Owner Authority Desk" in wallet.locator("#handoffName").inner_text()
 wallet.locator("#createForm input[name=pass]").fill(passphrase)
 wallet.locator("#createForm input[name=repeat]").fill(passphrase)
 wallet.get_by_role("button",name="Create encrypted wallet").click()
 wallet.locator("#vault").wait_for(state="visible")
 wallet.get_by_role("button",name="Keep link in wallet").click()
 wallet.get_by_role("heading",name="Owner Authority Desk · Local reviews").wait_for()
 assert wallet.locator("#entries .linkcard").count()==1
 assert wallet.locator("#entries .linkcard").get_by_text("apps.abundent.org").is_visible()
 # The encrypted Link Wallet has stored only the public link, not grant signature.
 disk=wallet.evaluate("""async()=>{
  const o=indexedDB.open('abundent_link_wallet_001');
  const db=await new Promise((ok,no)=>{o.onsuccess=()=>ok(o.result);o.onerror=()=>no(o.error)});
  const r=db.transaction('ciphertext').objectStore('ciphertext').get('vault');
  const v=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
  db.close();return JSON.stringify(v);
 }""")
 assert secret_signature not in disk
 assert fingerprint not in disk
 assert "Owner Authority Desk · Local reviews" not in disk
 assert "ciphertext" in disk
 # Authority DB only contains the small public pin, separate review CryptoKey, and a signed revocation.
 authority_db=page.evaluate("""async()=>{
  const o=indexedDB.open('abundent_link_wallet_authority_003');
  const db=await new Promise((ok,no)=>{o.onsuccess=()=>ok(o.result);o.onerror=()=>no(o.error)});
  const tx=db.transaction('local','readonly'),r=tx.objectStore('local').getAll();
  const v=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
  db.close();return JSON.stringify(v);
 }""")
 assert fingerprint in authority_db
 assert secret_signature not in authority_db
 assert "PRIVATE" not in authority_db
 assert wallet.evaluate("localStorage.length")==0
 assert page.evaluate("localStorage.length")==0
 # Desk restart: pin remains but owner must explicitly choose file again.
 page.reload()
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.includes('Owner desk ready')")
 assert page.locator("#hold").is_disabled()
 page.locator("#grantFile").set_input_files({
  "name":"WF008-SYNTHETIC-ONLY.json","mimeType":"application/json","buffer":grant
 })
 page.wait_for_function("()=>document.querySelector('#hold')?.disabled===false")
 page.locator("#action").select_option("DRAFT_EXPERIMENT")
 page.get_by_role("button",name="Sign review HOLD").click()
 page.wait_for_function("()=>document.querySelector('#status')?.textContent.includes('REVOKED_BY_OWNER')")
 assert all(url.startswith(BASE+"/") for url in outgoing),outgoing
 assert all("signature=" not in url and "owner_public_key" not in url for url in outgoing),outgoing
 assert not errors,errors
 print(json.dumps({
  "schema":"webz/link-wallet-authority-browser-proof/v1",
  "mobile":True,"synthetic_owner_only":True,
  "valid_WF008_signature_checked":True,
  "wrong_fingerprint_refused":True,"separate_local_pin":True,
  "local_hold_signed":True,"forbidden_merge_refused":True,
  "signed_revocation_blocks_reopen":True,
  "shortcut_saved_after_wallet_approval":True,
  "wallet_ciphertext_not_grant":True,
  "authority_metadata_separate_from_link_wallet":True,
  "private_owner_key_not_transferred":True,
  "no_native_R3_claim":True,
  "no_external_requests":True,"page_errors":errors
 }))
 browser.close()
