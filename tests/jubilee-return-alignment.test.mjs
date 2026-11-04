import test from "node:test";
import assert from "node:assert/strict";
import {makeFieldKit} from "../jubilee/field-kit.mjs";
import {createCard,recordReturn,exportCard,importCard} from "../first-circle/core.mjs";
import {prepareReturnHelp} from "../first-circle/return-help.mjs";
for(const role of ["song","food","host","crew","tech","steward","translate","open"]){
 test("carried "+role+" kit returns another task-aligned piece of work",async()=>{
  const kit=makeFieldKit(role,role==="open"?"A music and soup rehearsal":"");
  const start=createCard("offer",kit.title,"Use the prepared kit then report what happened.",{title:kit.title,body:kit.body,status:"BOUNDED_GUIDE"});
  const returned=recordReturn(start,"not-yet","No field confirmation");
  const another=prepareReturnHelp(returned);
  assert.equal(another.status,"BOUNDED_GUIDE");
  assert.ok(another.body.length>120);
  assert.doesNotMatch(another.title,/ready-to-send version/i);
  assert.doesNotMatch(another.body,/I can consider one small/i);
  assert.deepEqual(prepareReturnHelp(await importCard(await exportCard(returned))),another);
 });
}
test("real ordinary offers still get a completed, honest second draft",()=>{
 const card=createCard("offer","I can lend a guitar","One afternoon",{title:"Ready offer",body:"I can lend a guitar Saturday afternoon if we confirm a time.",status:"READY_TO_USE_DRAFT"});
 const next=prepareReturnHelp(recordReturn(card,"not-yet"));
 assert.equal(next.status,"READY_TO_USE_DRAFT");
});
