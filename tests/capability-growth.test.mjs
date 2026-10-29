import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {GOALS,proposeNextCapability,SOURCE_DOORS} from "../bridge/mit-solve/capability-growth.mjs";

test("four explicitly classified growth goals remain held with zero machine effects",()=>{
  assert.deepEqual(GOALS,["arm","body","printer","outreach"]);
  for(const goal of GOALS){
    const c=proposeNextCapability(goal);
    assert.equal(c.goal,goal);
    assert.equal(c.proposed_outcome,"PROPOSAL_ONLY_HOLD");
    assert.ok(c.potentially_printable.length>0);
    assert.ok(c.not_printed_by_ordinary_fff.length>0);
    assert.ok(c.proposed_independent_tests.length>0);
    assert.ok(c.gates.some(x=>x.includes("second independent operator")));
    for(const [k,v] of Object.entries(c.effects)) assert.equal(v,false,k);
    for(const [k,v] of Object.entries(c.evidence))
      if(typeof v==="boolean") assert.equal(v,false,k);
    const {content_sha256_integrity_only,...body}=c;
    assert.equal(content_sha256_integrity_only,createHash("sha256").update(JSON.stringify(body)).digest("hex"));
    assert.equal(proposeNextCapability(goal).content_sha256_integrity_only,content_sha256_integrity_only);
  }
});
test("a full robot, medical device or printer start cannot be proposed through this narrow tool",()=>{
  for(const goal of ["","self-replicating-robot","motor-actuation","print-job","../secrets","arm\nprint_now",null,{},[]])
    assert.throws(()=>proposeNextCapability(goal),RangeError);
  assert.notEqual(proposeNextCapability("arm").content_sha256_integrity_only,proposeNextCapability("body").content_sha256_integrity_only);
});
test("the original owner sources are explicit and none is represented as live field integration",()=>{
  for(const source of SOURCE_DOORS){
    assert.match(source.source,/^https:\/\/github\.com\/the-static-collective\//);
    assert.match(source.status,/^UNMERGED_/);
  }
  const text=readFileSync(new URL("../docs/RECURSIVE-WORKSHOP-001.md",import.meta.url),"utf8");
  for(const marker of ["STATIC-PRINT-011","SOVEREIGN-PRINT-SHOP-002","ROBOT-GARDEN-001","PENNY-018","PRINTED PART != FUNCTIONAL ROBOT","Still Here"])
    assert.ok(text.includes(marker),marker);
});
test("MIT presentation exposes a source-informed fabrication route without a physical claim",()=>{
  const html=readFileSync(new URL("../bridge/mit-solve/index.html",import.meta.url),"utf8");
  const page=readFileSync(new URL("../bridge/mit-solve/growth.html",import.meta.url),"utf8");
  assert.match(html,/\.\/growth\.html/);
  assert.match(page,/RECURSIVE-WORKSHOP-001/);
  assert.match(page,/not a working robot/i);
  assert.match(page,/no physical.*printed/i);
  assert.doesNotMatch(page,/<script|<form|<input|\bfetch\s*\(/i);
  assert.match(page,/script-src 'none'/);
});
