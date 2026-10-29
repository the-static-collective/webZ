import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DEFAULTS,SCHEMA,CASE,cleanField,preparePacket,printableKit} from "../bridge/seed/model.mjs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("Waseca first true yes produces an UNSENT public draft with six unsatisfied human gates",()=>{
 const p=preparePacket(DEFAULTS);
 assert.equal(p.schema,SCHEMA);assert.equal(p.caseId,CASE);
 assert.equal(p.classification,"UNSENT_PUBLIC_SAFE_LOCAL_DRAFT");
 for(const k of ["recipientPermission","fieldActionAuthorized","outcomeVerified","publicMethodAuthorized"])assert.equal(p[k],false);
 assert.equal(p.transmission,"NONE");
 assert.deepEqual(p.humanGates.map(g=>g.state),["DRAFT_UNSENT","NOT_RECEIVED","NOT_AUTHORIZED","NOT_PERFORMED","NOT_CONFIRMED","WITHHELD"]);
 assert.equal(new Set(p.humanGates.map(g=>g.owner)).size,6);
 const paper=printableKit(p);
 for(let i=1;i<=6;i++)assert.match(paper,new RegExp("CARD "+i+" · "));
 assert.match(paper,/DECLINE \(valid end\)/);
 assert.match(paper,/independent/i);
 assert.match(paper,/WITHHELD UNTIL LOCAL PERMISSION/);
 assert.match(paper,/nothing sent, stored, signed, verified or published/);
});
test("private contacts, bearer secrets and HTML cannot enter portable packet",()=>{
 for(const dirty of [
  "Call me at (507) 555-1234 tomorrow.",
  "Email director@example.org with the request.",
  "Go to https://example.org/private-link",
  "Meet at 123 Main Street tomorrow.",
  "Here is a bearer token that works",
  "<script>alert('whoops')</script>",
  "This is my custody case statement"
 ])assert.throws(()=>preparePacket({...DEFAULTS,need:dirty}),/HOLD/);
});
test("bounded text and malformed inputs fail closed",()=>{
 assert.throws(()=>preparePacket({...DEFAULTS,context:"ok"}),/12/);
 assert.throws(()=>preparePacket({...DEFAULTS,measure:"x".repeat(361)}),/360/);
 assert.throws(()=>preparePacket({...DEFAULTS,stop:undefined}),/text required/);
 assert.equal(cleanField("  One   specific  public task  ","question"),"One specific public task");
 assert.throws(()=>printableKit({...preparePacket(DEFAULTS),classification:"CONFIRMED"}),/Unknown or promoted/);
});
test("page is static and local: no remote scripts, fetch, storage, sent buttons or prefilled replies",()=>{
 const page=read("../bridge/seed/index.html"),ui=read("../bridge/seed/app.mjs");
 assert.match(page,/connect-src 'none'/);
 assert.match(page,/form-action 'none'/);
 assert.doesNotMatch(page,/<form[^>]+action=/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|localStorage|sessionStorage|indexedDB|\.send\s*\(/);
 assert.match(ui,/textContent/);assert.match(ui,/window\.print/);
 assert.ok(page.includes("../suitcase/"));assert.ok(page.includes("../outbox/"));
});
