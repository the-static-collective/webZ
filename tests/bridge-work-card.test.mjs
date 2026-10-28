import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {allDoors} from "../bridge/network/model.mjs";
import {WORK_SOURCE_COMMIT,WORK_SOURCE_URL,WORK_ACTIONS,buildWorkCard,verifyWorkCard} from "../bridge/desk/work-card.mjs";
const golden="bridge-work-v1:b901e29d73dec2879211254f1057df6c31cebd5dc37ee601bd6fc99d0ea24d3b";
test("BRIDGE-005 is a deterministic, source-pinned, public-only operator draft",async()=>{
 assert.equal(allDoors.length,23);
 const p=await buildWorkCard({doorId:"voqal",target:"JARVIS",actionCode:"VERIFY_ELIGIBILITY"},allDoors);
 assert.equal(p.candidateId,golden);
 assert.equal(p.sourceCommit,WORK_SOURCE_COMMIT);
 assert.equal(p.sourceUrl,WORK_SOURCE_URL);
 assert.equal(p.classification,"PUBLIC_ONLY_HOLD_FOR_LOCAL_REVIEW");
 assert.deepEqual([p.externalContact,p.applicationSubmitted,p.receiverAdmitted,p.fieldVerified],[false,false,false,false]);
 assert.equal((await verifyWorkCard(p,allDoors)).doorId,"voqal");
 assert.doesNotMatch(JSON.stringify(p),/person|token|recipientName|notes|email|password/i);
});
test("all 23 prospects and four bounded action types can be exported to separately identified receivers",async()=>{
 for(const d of allDoors)for(const [actionCode] of WORK_ACTIONS)for(const target of ["JARVIS","PLANZ"]){
  const p=await buildWorkCard({doorId:d.id,target,actionCode},allDoors);
  await verifyWorkCard(p,allDoors);
  assert.equal(p.authority,"NONE");
 }
});
test("foreign fields, changed signatures and unexpected targets are refused",async()=>{
 const p=await buildWorkCard({doorId:"voqal",target:"PLANZ",actionCode:"ASK_LOCAL_PERMISSION"},allDoors);
 await assert.rejects(()=>verifyWorkCard({...p,record:"private-note"},allDoors),/Unsupported/);
 await assert.rejects(()=>verifyWorkCard({...p,fieldVerified:true},allDoors),/Unsupported/);
 await assert.rejects(()=>verifyWorkCard({...p,actionCode:"REQUEST_CRITIQUE"},allDoors),/digest/);
 await assert.rejects(()=>buildWorkCard({doorId:"invalid",target:"PLANZ",actionCode:"VERIFY_ELIGIBILITY"},allDoors),/Unknown/);
 await assert.rejects(()=>buildWorkCard({doorId:"voqal",target:"RELATTE",actionCode:"VERIFY_ELIGIBILITY"},allDoors),/Unsupported/);
});
test("handoff appears only behind operator-controlled local review in private desk",()=>{
 const fs=requireFs();
 const app=fs.readFileSync(new URL("../bridge/desk/app.mjs",import.meta.url),"utf8");
 const html=fs.readFileSync(new URL("../bridge/desk/index.html",import.meta.url),"utf8");
 assert.match(html,/work-ack/);assert.match(html,/reviewed work card/i);
 assert.match(app,/if\(!\$\("work-ack"\)\.checked\)/);
 assert.match(app,/buildWorkCard/);
 assert.doesNotMatch(app,/fetch\s*\(/);
});
function requireFs(){return fs}
