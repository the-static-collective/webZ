import test from "node:test";
import assert from "node:assert/strict";
import {makeFieldKit,auditFieldKit,FIELD_KIT_ROLES} from "../jubilee/field-kit.mjs";
import {createCard,recordReturn,exportCard,importCard} from "../first-circle/core.mjs";
import {prepareWork} from "../first-circle/work.mjs";
import {prepareReturnHelp} from "../first-circle/return-help.mjs";

test("each Jubilee role now supplies a complete ready-to-run piece of material",()=>{
 const expectations={song:/RUN SHEET/,food:/INGREDIENTS:[\s\S]*METHOD:/,host:/READY-TO-RUN AGENDA/,crew:/PREFLIGHT/,tech:/TRIAGE/,steward:/FACILITATOR SCRIPT/,translate:/TEACHING SCRIPT/};
 for(const role of FIELD_KIT_ROLES){
  const kit=makeFieldKit(role);
  assert.equal(kit.status,"LOCAL_READY_KIT");
  assert.match(kit.body,expectations[role]);
  assert.equal(auditFieldKit(kit).pass,true);
  assert.doesNotMatch(kit.body,/^\s*make a simple invitation\.?\s*$/i);
 }
});
test("a custom Jubilee idea produces useful play instructions, not an echo",()=>{
 const kit=makeFieldKit("open","An outdoor guitar and soup gathering");
 assert.equal(kit.status,"LOCAL_PLAYABLE_KIT");
 assert.match(kit.body,/00–03:/);
 assert.match(kit.body,/11–15:/);
 assert.match(kit.body,/An outdoor guitar and soup gathering/);
 assert.equal(auditFieldKit(kit).pass,true);
});
test("public-first protects against contact data and unknown roles",()=>{
 assert.throws(()=>makeFieldKit("song","Write me at sample@example.com"),/private contact/);
 assert.throws(()=>makeFieldKit("outlaw"),/available role/);
 assert.throws(()=>makeFieldKit("open","hi"),/one public idea/);
});
test("an unresolved washer return produces another safe diagnostic step",async()=>{
 const work=prepareWork("need","Advice on fixing something","Washing machine won't drain");
 const card=createCard("need","Advice on fixing something",work.nextStep,work.work);
 assert.equal(prepareReturnHelp(card),null);
 const returned=recordReturn(card,"not-yet","Hose was not kinked.");
 const next=prepareReturnHelp(returned);
 assert.equal(next.status,"BOUNDED_GUIDE");
 assert.match(next.body,/model label/i);
 assert.match(next.body,/displayed error code/i);
 assert.doesNotMatch(next.body,/make a simple invitation/i);
 const pack=await exportCard(returned);
 assert.deepEqual(prepareReturnHelp(await importCard(pack)),next);
});
test("an unverified problem remains unresolved and a successful return has no fake additional action",()=>{
 const work=prepareWork("need","Help repair a strange engine","Engine makes clicking noise");
 const card=createCard("need","Help repair a strange engine",work.nextStep,work.work);
 const notYet=prepareReturnHelp(recordReturn(card,"not-yet"));
 assert.equal(notYet.status,"UNRESOLVED");
 assert.match(notYet.body,/can't claim a repair/i);
 assert.equal(prepareReturnHelp(recordReturn(card,"worked")),null);
});
test("second playable round and offer draft are already prepared",()=>{
 const play=prepareWork("play","A paper mini-game","One person ten minutes");
 const p=prepareReturnHelp(recordReturn(createCard("play","A paper mini-game",play.nextStep,play.work),"different"));
 assert.match(p.body,/Minute 0–1/);
 const offer=prepareWork("offer","I can lend my guitar","One afternoon");
 const o=prepareReturnHelp(recordReturn(createCard("offer","I can lend my guitar",offer.nextStep,offer.work),"not-yet"));
 assert.equal(o.status,"READY_TO_USE_DRAFT");
 assert.match(o.body,/I can lend my guitar/);
});
