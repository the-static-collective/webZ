import test from "node:test";import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {draftNeed,compareRoutes,draftPacket} from "../commons/exchange.mjs";
import {inspectPacket,makeReceiverResponse,makeFieldReport,contentId} from "../commons/receiver-protocol.mjs";
const need=draftNeed({region:"Waseca, Minnesota",category:"food",
 summary:"Thirty shelf-stable food parcels",quantity:30,unit:"parcels",window:"7-days"});
const routes=compareRoutes([{route:"local-purchase",estimatedUSD:120,reviewed:true},
 {route:"remote-donation",estimatedUSD:"",reviewed:false,importCleared:false},
 {route:"knowledge-transfer",estimatedUSD:40,reviewed:false}]);
const source=draftPacket(need,routes);
const action={decision:"ACCEPT_FOR_LOCAL_REVIEW",reviewer_role:"local-steward",
 reason:"We may evaluate a safe local purchasing pilot.",attestation:true};
function planz(){
 const basis={planId:"GLOBAL-CROSSING-001",
  sourceIssue:"https://github.com/the-static-collective/BananaSpork/issues/29",
  sourceEdition:"ATTENTION-2026-10-28-001",sourceSha256:"b".repeat(64),
  weaveId:"weave:7f3baec7-03bc-4ff4-8d78-cac2f24e0410",
  publicMethodCandidate:"Review one locally approved food procurement route before seeking international shipments."};
 return {schema:"planz.return-candidate/v0",
  candidateId:"planz-return-v0:"+createHash("sha256").update("PLANZ-RETURN-001|"+JSON.stringify(basis)).digest("hex"),
  ...basis,preparedAt:"2026-10-28T20:00:00.000Z",localReport:"COMPLETED_REPORTED_UNVERIFIED",
  review:"SECOND_ALIAS_REVIEW_ASSERTED_NOT_AUTHENTICATED",disposition:"HOLD_FOR_OWNER_REVIEW",
  fieldVerified:false,sourceOwnerApproved:false,recipientConfirmed:false,
  sentExternally:false,authority:"NONE",
  notice:"Unverified local candidate. No personal notes, aliases or evidence exported."};
}
test("Commons source imported without granting any real-world authority",async()=>{
 const x=await inspectPacket(JSON.stringify(source));assert.equal(x.actionable,true);
 assert.equal(x.kind,"organizational-need");assert.equal(x.quantity,30);
 assert.equal(x.packet_id,await contentId(source));
 assert.deepEqual((await inspectPacket(JSON.stringify(source))).packet,source);
});
test("forged need authorization, contact data, and hidden case fields are refused",async()=>{
 const auth=structuredClone(source);auth.need.local_operator_authorized=true;
 await assert.rejects(inspectPacket(auth),/authority-escalated/);
 const pii=structuredClone(source);pii.need.requirement.summary="Reach client@example.org";
 await assert.rejects(inspectPacket(pii),/Remove contact information|Remove personal/);
 const extra=structuredClone(source);extra.private_guest_list=["name"];
 await assert.rejects(inspectPacket(extra),/Unexpected fields/);
});
test("planZ return digest verified, cannot impersonate field confirmation",async()=>{
 const p=planz();const x=await inspectPacket(p);assert.equal(x.kind,"method-candidate");
 const changed={...p,publicMethodCandidate:p.publicMethodCandidate+"!"};
 await assert.rejects(inspectPacket(changed),/digest/);
 await assert.rejects(inspectPacket({...p,recipientConfirmed:true}),/authority-escalated/);
});
test("explicit local decision is a self-attested review only, never a signed admission",async()=>{
 const x=await inspectPacket(source);
 await assert.rejects(makeReceiverResponse(x,{...action,attestation:false}),/attestation/);
 const y=await makeReceiverResponse(x,action,"2026-10-28T20:02:00.000Z");
 assert.equal(y.packet.field_verified,false);assert.equal(y.packet.dispatch,"DISABLED");
 assert.equal(y.packet.transport_signature,"NOT_SIGNED");
 const remote=await inspectPacket(JSON.stringify(y.packet));
 assert.equal(remote.kind,"review-response");assert.equal(remote.actionable,false);
 assert.equal(remote.packet.packet_id,x.packet_id);
});
test("HOLD/REFUSE cannot create reports; accepted trial can only report, not confirm",async()=>{
 const x=await inspectPacket(source);
 for(const d of ["HOLD","REFUSE"]){
  const y=await makeReceiverResponse(x,{...action,decision:d});
  await assert.rejects(makeFieldReport(x,y,{field_status:"REPORTED_COMPLETE",unit:"parcels",quantity_reported:5,summary:"A contributor says five parcels were delivered.",attestation:true}),/acceptance/);
 }
 const ok=await makeReceiverResponse(x,action);
 const report=await makeFieldReport(x,ok,{field_status:"REPORTED_PARTIAL",unit:"parcels",
 quantity_reported:5,summary:"A contributor reports that five parcels were prepared.",attestation:true},"2026-10-28T20:03:00.000Z");
 assert.equal(report.packet.recipient_confirmed,false);assert.equal(report.packet.field_verified,false);
 assert.equal((await inspectPacket(JSON.stringify(report.packet))).kind,"field-report");
 await assert.rejects(makeFieldReport(x,ok,{field_status:"REPORTED_COMPLETE",unit:"parcels",
  quantity_reported:31,summary:"An out-of-scope oversized delivery was reported.",attestation:true}),/exceed/);
});
test("response/report forgeries and undisclosed fields cannot enter reader",async()=>{
 const x=await inspectPacket(source);
 const y=await makeReceiverResponse(x,action);
 await assert.rejects(inspectPacket({...y.packet,transport_signature:"SIGNED"}),/falsely authorized/);
 await assert.rejects(inspectPacket({...y.packet,source_owner_permission:true}),/Unexpected fields/);
 const rep=await makeFieldReport(x,y,{field_status:"BLOCKED",unit:"parcels",quantity_reported:0,
 summary:"The pilot was blocked by a missing local steward.",attestation:true});
 await assert.rejects(inspectPacket({...rep.packet,field_verified:true}),/falsely confirmed/);
});
test("reject packets beyond size limits or unknown schemas",async()=>{
 await assert.rejects(inspectPacket("x".repeat(17000)),/16 KB/);
 await assert.rejects(inspectPacket("{notjson"),/Not valid JSON/);
 await assert.rejects(inspectPacket({schema:"relatte.receipt/v0",semantic_effect:"proof"}),/Unknown/);
});

test("blocked work cannot report delivered units or complete zero work",async()=>{
 const source=await inspectPacket(draftPacket(draftNeed({region:"Waseca MN",category:"food",summary:"Meals for a community food table",quantity:30,unit:"meals",window:"7-days"}),compareRoutes([{route:"local-purchase",estimatedUSD:30,reviewed:false},{route:"remote-donation",estimatedUSD:"",reviewed:false},{route:"knowledge-transfer",estimatedUSD:"",reviewed:false}])));
 const response=await makeReceiverResponse(source,action);
 await assert.rejects(makeFieldReport(source,response,{field_status:"BLOCKED",quantity_reported:3,unit:"meals",summary:"The delivery was blocked for safety.",attestation:true}),/zero completed/);
 await assert.rejects(makeFieldReport(source,response,{field_status:"REPORTED_COMPLETE",quantity_reported:0,unit:"meals",summary:"No meals were actually delivered yet.",attestation:true}),/positive quantity/);
});
