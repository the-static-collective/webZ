import test from "node:test";
import assert from "node:assert/strict";
import {suspects,gates,postymon,reality,nextQuestion,verdict,blankCard} from "../public/games/tomorrow/case.mjs";
test("six fictional suspects with complete independent testimony",()=>{
 assert.equal(suspects.length,6);
 assert.equal(new Set(suspects.map(x=>x.id)).size,6);
 assert.ok(suspects.every(x=>x.line&&x.truth&&x.title));
});
test("three reveal gates yield ten immutable exact evidence codes",()=>{
 assert.deepEqual(gates.map(x=>x.gate),["A","B","C"]);
 assert.deepEqual(gates.map(x=>x.cards.length),[3,4,3]);
 assert.equal(new Set(gates.flatMap(x=>x.cards.map(c=>c.id))).size,10);
 assert.ok(gates.flatMap(x=>x.cards).every(c=>c.body&&c.question&&c.time));
});
test("the solution requires non-death, the actual mover, and a verified paperwork error",()=>{
 assert.equal(verdict({death:"NO",mover:"SE",cause:"UNVERIFIED_CLOSURE"}).correct,true);
 assert.equal(verdict({death:"YES",mover:"SE",cause:"UNVERIFIED_CLOSURE"}).correct,false);
 assert.equal(verdict({death:"NO",mover:"EA",cause:"UNVERIFIED_CLOSURE"}).correct,false);
 assert.equal(verdict({death:"NO",mover:"SE",cause:"PROVEN"}).correct,false);
});
test("actual field-deck identities match all eight distinct cards",()=>{
 assert.deepEqual(postymon.map(x=>x.id),["P05","P07","P10","P11"]);
 assert.deepEqual(reality.map(x=>x.id),["R06","R07","R10","R12"]);
 assert.equal(nextQuestion("P10","R10"),"Would an actual venue steward agree to one independently hosted test gathering?");
 assert.ok(nextQuestion("P11","R12").includes("decline"));
 assert.throws(()=>nextQuestion("P00","R10"),/UNKNOWN_CARD/);
});
test("printable question card does not assume authority or collect PII",()=>{
 const card=blankCard({p:"P05",r:"R10"});
 assert.ok(card.includes("licensed food host"));
 assert.ok(card.includes("not a commitment"));
 assert.ok(card.includes("Status: QUESTION / HOLD / DECLINE"));
 assert.ok(!card.includes("Email:"));
});
