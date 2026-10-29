import test from "node:test";
import assert from "node:assert/strict";
import {makeCreativeCarry,verifyCreativeCarry,OWNERS} from "../apps/arcade/source-carry.mjs";
import {makePocketEdition} from "../apps/arcade/edition.mjs";
import {readFileSync} from "node:fs";
const example="A song for the neighbors";

test("one selected card carries exact source-owned manifest in forming/pending state",()=>{
  const a=makeCreativeCarry(example,0,"lemonpress");
  assert.equal(a.status,"PREPARATION_ONLY_NO_PUBLICATION_OR_RENDER");
  assert.equal(a.owner.repo,"the-static-collective/lemonPRESS");
  assert.match(a.owner.schemaBlob,/^[a-f0-9]{40}$/);
  assert.equal(a.nativeContract.status,"forming");
  assert.equal(a.nativeContract.admission.state,"pending");
  assert.equal(a.nativeContract.admission.receipt,null);
  assert.deepEqual(a.nativeContract.lanes,["digital","crawler"]);
  assert.equal(a.safety.externalExecutionAuthorized,false);
  assert.equal(a.createdFrom.artifact.includes(example),true);
  assert.deepEqual(makeCreativeCarry(example,0,"lemonpress"),a);
  assert.equal(verifyCreativeCarry(a),true);
});
test("PlayDeck handoff is real source-bound intent, but never pretends to render",()=>{
  const p=makeCreativeCarry(example,1,"playdeck");
  assert.equal(p.owner.repo,"the-static-collective/playdeck");
  assert.match(p.owner.commit,/^[a-f0-9]{40}$/);
  assert.equal(p.nativeContract.renderedVideo,false);
  assert.equal(p.nativeContract.defaultMode,"NO_RENDER_PROJECTED_RECEIPT_ONLY");
  assert.equal(p.nativeContract.requires.length,2);
  assert.equal(p.safety.rightsEstablished,false);
  assert.equal(verifyCreativeCarry(p),true);
  assert.notDeepEqual(p,makeCreativeCarry(example,1,"lemonpress"));
});
test("tampered authority, content, or claimed publication fails closed",()=>{
  const packet=makeCreativeCarry(example,2,"lemonpress");
  const changed=structuredClone(packet);changed.nativeContract.status="published";
  assert.equal(verifyCreativeCarry(changed),false);
  const changedOwner=structuredClone(packet);changedOwner.owner.commit="0".repeat(40);
  assert.equal(verifyCreativeCarry(changedOwner),false);
  const changedText=structuredClone(packet);changedText.createdFrom.artifact="invented partner";
  assert.equal(verifyCreativeCarry(changedText),false);
  assert.throws(()=>makeCreativeCarry(example,3,"lemonpress"),RangeError);
  assert.throws(()=>makeCreativeCarry(example,1,"anything"),RangeError);
});
test("browser gives explicit choice, original app link, no uploads or implicit render",()=>{
  const page=readFileSync(new URL("../apps/arcade/index.html",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../apps/arcade/app.mjs",import.meta.url),"utf8");
  assert.match(page,/Make something bigger from this card/);
  assert.match(page,/id="press-handoff"/);
  assert.match(page,/id="playdeck-handoff"/);
  assert.match(page,/the-haunted-toaster\/releases\/tag/);
  assert.match(page,/connect-src 'none'/);
  assert.match(ui,/makeCreativeCarry/);
  assert.match(ui,/new Blob\(\[content\]/);
  assert.doesNotMatch(ui,/fetch\(|sendBeacon|localStorage|sessionStorage|eval\(/);
  assert.equal(Object.keys(OWNERS).length,2);
});

test("standalone pocket edition is an actual user take-away, printable and safe on arbitrary text",()=>{
  const html=makePocketEdition("<img src=x onerror=alert(1)> A song",0);
  assert.match(html,/PRIVATE PRINT PROOF/);
  assert.match(html,/@page\{size:6in 9in/);
  assert.match(html,/&lt;img src=x/);
  assert.doesNotMatch(html,/<img|<script/);
  assert.match(html,/ADMISSION PENDING/);
  assert.equal(html,makePocketEdition("<img src=x onerror=alert(1)> A song",0));
});
