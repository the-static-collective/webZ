import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {SEEDS,seedById,makeDraft,validateDraft,seedLink,draftLink,readDraftHash,isProductionHost,makeReturn,publicCard} from "../field/cards/core.mjs";
const preview="http://localhost:8080/field/index.html";
test("seed census has exact deck splits and unique bounded identities",()=>{
  assert.equal(SEEDS.length,34);
  assert.equal(SEEDS.filter(c=>c.id.startsWith("coalition-")).length,18);
  assert.equal(SEEDS.filter(c=>c.id.startsWith("waseca-")).length,16);
  assert.equal(new Set(SEEDS.map(c=>c.id)).size,SEEDS.length);
  assert.equal(seedById("waseca-p01").title,"THE GROWER");
  assert.equal(seedById("waseca-r08").kind,"REALITY.2");
  assert.ok(SEEDS.every(x=>publicCard(x) && x.question && x.deck && x.sourceCode));
});
test("seed permalink is an actual card route and not a public launch claim",()=>{
  assert.equal(seedLink("waseca-p01",preview),"http://localhost:8080/field/?card=waseca-p01");
  assert.throws(()=>seedLink("not-a-card",preview),/Unknown seed/);
  assert.equal(isProductionHost(preview),false);
  assert.equal(isProductionHost("https://abundent.org/field/"),true);
  assert.equal(isProductionHost("https://abundent.org.evil.test/field/"),false);
});
function draft(overrides={},id="local-test-001"){
  return makeDraft({kind:"POSTYMON",title:"THE RETURNING TRUCK",question:"What existing approved route could carry a crate?",parentId:"waseca-p04",acknowledged:true,...overrides},id);
}
test("draft is local, no authority, source parent preserved",()=>{
  const d=draft();assert.equal(d.state,"UNREVIEWED_DRAFT");assert.equal(d.published,false);assert.equal(d.authority,"NONE");
  assert.equal(d.parentId,"waseca-p04");assert.equal(publicCard(d),false);
  assert.deepEqual(validateDraft(d),d);
});
test("draft portable URL round trips unicode in fragment without server request",()=>{
  const d=draft({title:"A ROAD FOR PEACHES",question:"Could 🍑 move along an already scheduled route?"},"local-peach-11");
  const u=new URL(draftLink(d,"https://abundent.org/field/?card=waseca-p01"));
  assert.equal(u.search,"");assert.match(u.hash,/^#draft=/);
  assert.deepEqual(readDraftHash(u.hash),d);
  assert.equal(readDraftHash("#anything=else"),null);
});
test("draft rejects contact data, markup, unknown parent, unsupported fields and forged publication",()=>{
  assert.throws(()=>draft({question:"Write to me@example.org"}),/contact details/);
  assert.throws(()=>draft({question:"Call 507-555-0188"}),/contact details/);
  assert.throws(()=>draft({question:"<img src=x>"}),/markup/);
  assert.throws(()=>draft({parentId:"unseen"}),/recognized seed/);
  assert.throws(()=>draft({acknowledged:false}),/Confirm/);
  assert.throws(()=>draft({junk:"foo"}),/Unsupported fields/);
  assert.throws(()=>validateDraft({...draft(),published:true}),/Not a local draft/);
  assert.throws(()=>readDraftHash("#draft=!!!"),/Invalid portable/);
});
test("long portable draft refuses oversize rather than printing bad QR",()=>{
  const d=draft({question:"a".repeat(150),title:"b".repeat(64)}, "local-verylong-01");
  const url=draftLink(d,preview);
  assert.ok(url.length<1100);
});
test("returns are unverified notes, never claimed completed work",()=>{
  const r=makeReturn("waseca-p04","OBSERVATION","One route appears promising, ask organizers.");
  assert.equal(r.status,"UNVERIFIED_PERSONAL_NOTE");assert.equal(r.externalAdoption,"NOT_CLAIMED");
  assert.throws(()=>makeReturn("waseca-p04","CONFIRMED","Help done"),/Choose a return kind/);
  assert.throws(()=>makeReturn("waseca-p04","QUESTION","Call 507-555-0100"),/contact details/);
});
test("static browser bundle keeps privacy and printing boundaries explicit",()=>{
  const html=readFileSync(new URL("../field/cards/index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../field/cards/app.mjs",import.meta.url),"utf8");
  const css=readFileSync(new URL("../field/cards/style.css",import.meta.url),"utf8");
  assert.match(html,/No accounts/);assert.match(html,/No public submissions/);
  assert.match(app,/window\.print\(\)/);assert.match(app,/PREVIEW URL ONLY/);
  assert.match(css,/@media print/);
  assert.ok(existsSync(new URL("../field/cards/vendor/LICENSE.qrcodejs.txt",import.meta.url)));
});
