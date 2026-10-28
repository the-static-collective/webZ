import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {proposal,doors,invitationFor,draftFor} from "../bridge/model.mjs";

test("bridge has a bounded, explicit synthetic case",()=>{
 assert.equal(proposal.schema,"abundent/bridge-proposal-v0");
 assert.equal(proposal.publicStatus,"PROTOTYPE_INVITATION_ONLY");
 assert.equal(proposal.pilot.classification,"FICTIONAL_DEMONSTRATION");
 assert.equal(proposal.institutionalStatus,"NO_TARGET_INVITED_OR_ENROLLED_BY_THIS_PAGE");
 assert.deepEqual(proposal.sequence.map(s=>s.name),["LISTEN","MAP","INVITE","RECEIVE","ACT","REPORT","VERIFY","RETURN"]);
 assert.ok(proposal.safeguards.some(s=>s.includes("REPORTED != VERIFIED")));
});
test("all nine institutional doors have distinct scoped asks and authority gates",()=>{
 assert.equal(doors.length,9);
 assert.equal(new Set(doors.map(d=>d.id)).size,doors.length);
 for(const d of doors){
  assert.ok(/^https:\/\//.test(d.url),d.id);
  for(const key of ["name","kind","alignment","request","offered","gate","due"])
   assert.ok(d[key]?.length>=(key==="name"?3:key==="kind"?5:key==="due"?4:14),d.id+" "+key);
  assert.match(d.gate,/no |not |must |require|cannot|Do not|Webinar|An invitation|An applicant|An application|A web|A city|BLOOM/i,d.id);
 }
});
test("export remains draft-only, public-safe and non-authoritative",()=>{
 for(const d of doors){
  const packet=invitationFor(d.id);
  assert.equal(packet.classification,"DRAFT_NOT_SENT");
  assert.equal(packet.relationship,"PROSPECTIVE_ONLY");
  assert.equal(packet.noPersonalData,true);
  assert.equal(packet.demonstration.classification,"FICTIONAL_DEMONSTRATION");
  assert.equal(packet.target,d.name);
  assert.doesNotMatch(JSON.stringify(packet),/secret_key|service_role|token=|access_token/i);
  assert.match(draftFor(d.id),/not a claim that your institution has joined/);
 }
 assert.throws(()=>invitationFor("missing"),RangeError);
 assert.throws(()=>draftFor("missing"),RangeError);
});
test("browser code is local-only and doesn't imply signed real dispositions",()=>{
 const html=readFileSync(new URL("../bridge/index.html",import.meta.url),"utf8");
 const script=readFileSync(new URL("../bridge/app.mjs",import.meta.url),"utf8");
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/No listed institution has been contacted/);
 assert.match(script,/SYNTHETIC_LOCAL_ONLY/);
 assert.match(script,/NO_REAL_REPORT/);
 assert.match(script,/NOT_VERIFIED/);
 assert.doesNotMatch(script,/\bfetch\s*\(/);
 assert.doesNotMatch(script,/\blocalStorage\b|\bsessionStorage\b/);
});
