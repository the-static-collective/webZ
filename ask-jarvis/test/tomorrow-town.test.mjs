import test from "node:test";
import assert from "node:assert/strict";
import {
 composeQuestionKey,validQuestionKey,fragmentForKey,readKeyFragment,QUESTION_KEY_SCHEMA
} from "../public/games/tomorrow/key.mjs";
import {createTown,visitRoom,admitDonorConsequence,TOWN_ROOMS} from "../public/games/tomorrow/town/world.mjs";
import {
 initialState,step,benchCapabilities
} from "../public/games/tomorrow/town/alchematrix-core.mjs";
const solved={death:"NO",mover:"SE",cause:"UNVERIFIED_CLOSURE"};
const evidence=["A02","B02","C01"];
function sourceKey(){return composeQuestionKey({verdict:solved,evidence})}
test("three distinct exact fictional sources combine into a stable Question Key",()=>{
 const a=sourceKey(),b=composeQuestionKey({verdict:solved,evidence:[...evidence].reverse()});
 assert.equal(a.schema,QUESTION_KEY_SCHEMA);
 assert.deepEqual(a,b);assert.equal(a.authority,"none");assert.equal(a.status,"FICTIONAL_LOCAL");
 assert.equal(a.nextRoom,"town-001");assert.equal(a.evidence.length,3);
 assert.equal(validQuestionKey(a),true);
 assert.equal(readKeyFragment(fragmentForKey(a)).id,a.id);
});
test("key cannot be forged by verdict shortcut, absent evidence, foreign IDs, or inflation",()=>{
 for(const v of [{...solved,death:"YES"},{...solved,mover:"EA"},{...solved,cause:"PROVEN"}])
  assert.throws(()=>composeQuestionKey({verdict:v,evidence}),/CASE_NOT_SOLVED/);
 for(const arr of [[],["A02","B02"],["A02","A02","C01"],["A02","B02","B04"],["A02","B02","C01","C02"]])
  assert.throws(()=>composeQuestionKey({verdict:solved,evidence:arr}),/EVIDENCE_NOT_DISTINGUISHED/);
 const good=sourceKey();
 assert.equal(validQuestionKey({...good,authority:"witnessed"}),false);
 assert.equal(validQuestionKey({...good,status:"REAL_WORLD"}),false);
 assert.equal(validQuestionKey({...good,sourceInspiration:"other"}),false);
 assert.equal(validQuestionKey({...good,extra:true}),false);
 assert.equal(readKeyFragment("#key=%7Bbad"),null);
 assert.equal(readKeyFragment("#key="+encodeURIComponent(JSON.stringify({...good,authority:"authorized"}))),null);
 assert.equal(readKeyFragment("#key="+"x".repeat(6000)),null);
});
test("ordinary town exploration is not a project pledge and may happen without a key",()=>{
 let t=createTown();assert.equal(t.hasCaseKey,false);
 assert.equal(TOWN_ROOMS.length,8);
 const v=visitRoom(t,"porch");assert.equal(v.ok,true);
 assert.equal(t.visited.length,0);
 assert.deepEqual(v.state.visited,["porch"]);
 assert.equal(visitRoom(v.state,"workshop").code,"QUESTION_KEY_REQUIRED");
 assert.equal(visitRoom(v.state,"observatory").code,"NOT_YET_POSSIBLE");
 assert.equal(visitRoom(v.state,"nope").code,"ROOM_UNKNOWN");
});
test("the independently pinned Full Measure engine really composes a lab key via prerequisites",()=>{
 let d=initialState();let world=createTown(sourceKey());
 assert.equal(admitDonorConsequence(world,d).ok,false);
 assert.throws(()=>step(d,{type:"craft-telescope"}),/Need/);
 assert.deepEqual(d.events,[]);
 const actions=[
  {type:"mine",item:"quartz"},{type:"mine",item:"copper"},
  {type:"craft-telescope"},
  {type:"mine",item:"quartz"},{type:"mine",item:"copper"},{type:"mine",item:"echo"},
  {type:"install-probe"},{type:"install-memory"},
  {type:"observe",target:"prismA"},{type:"observe",target:"prismB"},
  {type:"socket-telescope"},{type:"craft-question-key"},{type:"open-door"}
 ];
 for(const action of actions)d=step(d,action);
 assert.equal(d.doorOpen,true);
 assert.equal(d.artifact.id,"question-key-001");
 assert.ok(d.artifact.dependsOn.includes("telescope-001"));
 assert.ok(benchCapabilities(d).includes("frequency-probe"));
 const result=admitDonorConsequence(world,d);assert.equal(result.ok,true);
 assert.equal(result.state.observatoryOpen,true);
 assert.equal(world.observatoryOpen,false);
 assert.equal(result.authority,"none");assert.equal(result.canonicalAdmission,false);
 const newDoor=visitRoom(result.state,"observatory");
 assert.equal(newDoor.ok,true);assert.equal(newDoor.room.id,"observatory");
});
test("fake imported lab consequences and missing case keys cannot open a town road",()=>{
 const visitor=createTown();
 const keyholder=createTown(sourceKey());
 const fake={doorOpen:true,artifact:{id:"question-key-001",constructor:"workbench+socketed-telescope",dependsOn:["telescope-001"]},events:[]};
 assert.equal(admitDonorConsequence(visitor,fake).code,"QUESTION_KEY_REQUIRED");
 assert.equal(admitDonorConsequence(keyholder,fake).code,"DONOR_CONSEQUENCE_NOT_PRESENT");
 assert.equal(admitDonorConsequence(keyholder,{...fake,artifact:{...fake.artifact,id:"SPOOF"}}).ok,false);
});
