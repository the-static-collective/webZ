import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
import {PROJECT,PROSPECTS,ALLOCATION,SOURCES,DRAFTS,FOUNDER_GATES,budgetTotal,publicStatus} from "../bridge/first/model.mjs";
test("BRIDGE-006 has two real-source prospective doors and a truthful public status",()=>{
 assert.equal(PROSPECTS.length,2);
 assert.equal(PROSPECTS[0].id,"voqal");assert.equal(PROSPECTS[0].due,"2026-10-31T22:59:00-05:00");
 assert.equal(PROSPECTS[1].id,"wansc");assert.equal(PROSPECTS[1].email,"director@wasecaservicecenter.org");
 for(const p of PROSPECTS){assert.match(p.source,/^https:\/\//);assert.match(p.state,/NOT_SUBMITTED|NOT_SENT/);assert.ok(p.gate.length>20)}
 const state=publicStatus();
 assert.equal(state.schema,"abundent.bridge006-first-crossing/v1");
 for(const key of ["applicationSubmitted","outboundInquirySent","localStewardOptedIn","fieldPilotAuthorized","independentFieldResult","autoSend","liveSubmissionTracking"])assert.equal(state[key],false,key);
 assert.equal(state.relationshipStatus,"PROSPECTIVE_ONLY");
 assert.equal(PROJECT,"Between Rooms — Community-Owned Infrastructure for Cooperation");
});
test("working award draft totals $30,000 with no pre-claimed spending",()=>{
 assert.equal(budgetTotal(),30000);
 assert.equal(ALLOCATION.length,7);
 assert.ok(FOUNDER_GATES.length>=8);
});
test("drafts are copyable and within official character limits, never pre-populated with personal identity",()=>{
 assert.equal(DRAFTS.length,2);
 for(const d of DRAFTS){
   assert.ok(d.value.length>100);if(d.limit)assert.ok(d.value.length<=d.limit);
   assert.doesNotMatch(d.value,/\b(?:registered|submitted|awarded|partnered) with Voqal\b/i);
 }
 assert.match(DRAFTS[1].value,/one recurring step/i);
 assert.match(DRAFTS[1].value,/\[Sender: add your name/);
 assert.equal(SOURCES.length,5);
});
test("new public route is copied by build, linked from Bridge, and cannot fetch or submit",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const html=read("bridge/first/index.html"),js=read("bridge/first/app.mjs");
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/NOT SUBMITTED/);
 assert.match(html,/Official page & APPLY TODAY/);
 assert.match(read("bridge/index.html"),/\.\/first\//);
 assert.match(read("bridge/locus/index.html"),/\.\.\/first\//);
 assert.match(read("apps/build.mjs"),/cpSync\(join\(root,'\.\.\/bridge'\)/);
 assert.doesNotMatch(js,/\bfetch\s*\(|\bsendBeacon\s*\(|\blocalStorage\b|\bsessionStorage\b/);
});
