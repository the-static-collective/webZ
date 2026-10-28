import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {doors as original} from "../bridge/model.mjs";
import {capturedAt,organs,addedDoors,allDoors,relations,door,neighbors,invitationFor,draftFor,dossierFor,exportAtlas} from "../bridge/network/model.mjs";

test("new atlas extends all nine source-owned Bridge prospects to 23 distinct doors",()=>{
 assert.equal(original.length,9);
 assert.equal(addedDoors.length,14);
 assert.equal(allDoors.length,23);
 assert.equal(new Set(allDoors.map(x=>x.id)).size,23);
 assert.equal(capturedAt,"2026-10-28");
 assert.deepEqual(allDoors.slice(0,9).map(d=>d.id),original.map(d=>d.id));
 assert.deepEqual(organs.map(o=>o.id),["jarvis","planz","relatte","garden","porchlight","jubilee","graft","ghot","inbox"]);
});
test("every opportunity has source, requirements, internally valid candidate relations",()=>{
 const organIds=new Set(organs.map(x=>x.id));
 for(const d of allDoors){
  assert.match(d.url,/^https:\/\//,d.id);
  for(const k of ["name","kind","due","alignment","request","offered","gate","next","category","entry"])assert.ok(d[k]&&d[k].length>=3,d.id+" "+k);
  assert.ok(d.organs.length>=2,d.id);
  assert.equal(new Set(d.organs).size,d.organs.length,d.id+" duplicated organ");
  for(const id of d.organs)assert.ok(organIds.has(id),d.id+" "+id);
  assert.ok(d.deadline===null||/^2026-\d\d-\d\d$/.test(d.deadline),d.id+" deadline");
 }
 assert.equal(relations.length,allDoors.reduce((total,d)=>total+d.organs.length,0));
 assert.ok(relations.every(x=>x.kind==="POTENTIAL_CAPABILITY_FIT"&&x.status==="PROPOSAL_NOT_RELATIONSHIP"));
 assert.ok(relations.every(x=>door(x.from).organs.includes(x.to)));
});
test("stepstone suggestions are typed hypotheses and exclude the seed institution",()=>{
 for(const d of allDoors){
  const n=neighbors(d.id);
  assert.ok(n.length<=5);
  assert.ok(n.every(p=>p.id!==d.id&&p.overlap.length>0));
  assert.ok(n.every(p=>p.overlap.every(id=>d.organs.includes(id)&&p.organs.includes(id))));
 }
 assert.throws(()=>door("unknown"),RangeError);
 assert.throws(()=>dossierFor("unknown"),RangeError);
});
test("exports distinguish application, signed invitation and actual receiving",()=>{
 const atlas=exportAtlas();
 assert.equal(atlas.schema,"abundent/bridge-institutional-atlas-v1");
 assert.equal(atlas.liveFeed,false);
 assert.equal(atlas.status,"CANDIDATE_NETWORK_NOT_PARTNERS");
 assert.equal(atlas.partnerCountClaimed,0);
 assert.equal(atlas.submissionCountClaimed,0);
 assert.equal(atlas.verifiedOutcomeCountClaimed,0);
 for(const d of allDoors){
  const p=invitationFor(d.id),packet=dossierFor(d.id);
  assert.equal(p.classification,"DRAFT_NOT_SENT",d.id);
  assert.equal(p.relationship,"PROSPECTIVE_ONLY",d.id);
  assert.equal(p.noPersonalData,true,d.id);
  assert.equal(packet.classification,"UNSENT_REVIEW_DRAFT",d.id);
  assert.equal(packet.application,"NOT_SUBMITTED");
  assert.equal(packet.partner,"NOT_ESTABLISHED");
  assert.equal(packet.award,"NOT_GRANTED");
  assert.equal(packet.fieldResult,"NOT_VERIFIED");
  assert.equal(packet.proposedRelations.length,d.organs.length);
  assert.match(draftFor(d.id),/not a claim|No partnership/i);
  assert.doesNotMatch(JSON.stringify(packet),/service_role|secret_key|access_token|token=/i);
 }
});
test("browser is local-only, linked from the original proposal and copied by existing static build",()=>{
 const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
 const html=read("bridge/network/index.html"),script=read("bridge/network/app.mjs");
 const main=read("bridge/index.html"),bridgeScript=read("bridge/app.mjs");
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/23 prospective doors/);
 assert.match(html,/NOT an actual relationship|NOT an actual|NOT a|not an actual/);
 assert.match(script,/POTENTIAL|proposed capability fits|not introductions/i);
 assert.doesNotMatch(script,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b|\bsendBeacon\s*\(/);
 assert.match(main,/\.\/network\//);
 assert.match(main,/23 institutional rooms/);
 assert.match(bridgeScript,/network\/model.mjs/);
 assert.match(read("apps/build.mjs"),/cpSync\(join\(root,'\.\.\/bridge'\)/);
});
