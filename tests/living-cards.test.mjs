import test from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA, makeCard, makeReply, makeReport, makeReturn, validatePacket,
  fingerprint, encodePacket, decodePacket, cardOf, label
} from "../cards/model.mjs";

const now=Date.UTC(2026,9,31,17,0);
let counter=0;
const opts=()=>({now:now+1000*(++counter),createId:()=> "field-test-id-"+counter+"-abcdef"});
const make=()=>makeCard({kind:"HAVE",title:"A folding chair",detail:"May lend on Saturday",area:"Waseca area",deadline:"",consent:true},opts());

test("real field card remains self-described, not title or custody", async()=>{
  const c=make();
  assert.equal(c.schema,SCHEMA);
  assert.equal(c.type,"CARD");
  assert.match(label(c),/NOT VERIFIED/);
  assert.equal(c.verifiedOwner,undefined);
  assert.equal(c.paymentReceived,undefined);
  assert.equal(await validatePacket(c),c);
});
test("no card without consent; bad descriptions rejected",()=>{
  assert.throws(()=>makeCard({kind:"HAVE",title:"Chair",area:"Waseca",consent:false},opts()),/Confirm/);
  assert.throws(()=>makeCard({kind:"HAVE",title:"X",area:"Waseca",consent:true},opts()),/Title/);
  assert.throws(()=>makeCard({kind:"HAVE",title:"Chair",area:"X",consent:true},opts()),/General area/);
  assert.throws(()=>makeCard({kind:"UNKNOWN",title:"Chair",area:"Waseca",consent:true},opts()),/Choose/);
});
test("one linked real-world loop: card -> reply -> report -> return",async()=>{
  const card=make();
  const reply=await makeReply(card,"CAN_HELP","I can pick it up",opts());
  const report=await makeReport(reply,"DONE","Handed over chair in person.",opts());
  const returned=await makeReturn(report,"CONFIRMED","I received it.",opts());
  assert.equal(returned.type,"RETURN");
  assert.equal(cardOf(returned).id,card.id);
  assert.equal(returned.report.reply.card.id,card.id);
  assert.match(label(report),/NOT CONFIRMED/);
  assert.match(label(returned),/IDENTITIES NOT VERIFIED/);
  assert.equal(returned.payment,undefined);
  assert.equal((await validatePacket(returned)).decision,"CONFIRMED");
});
test("no volunteering needed: solo report is possible, remains unconfirmed",async()=>{
  const card=make();
  const report=await makeReport(card,"PARTIAL","Placed chair where agreed.",opts());
  assert.equal(report.reply,null);
  assert.match(label(report),/NOT CONFIRMED/);
  assert.equal((await validatePacket(report)).type,"REPORT");
});
test("portable unicode link round-trips nested physical report",async()=>{
  const c=makeCard({kind:"NEED",title:"Borrow a chair 🪑",detail:"Before lunch",area:"Waseca",consent:true},opts());
  const r=await makeReply(c,"INTERESTED","I could help 🤝",opts());
  const p=await makeReport(r,"DONE","Chair arrived 🎉",opts());
  const token=encodePacket(p);
  assert.match(token,/^[A-Za-z0-9_-]+$/);
  assert.deepEqual(await decodePacket(token),p);
});
test("accidental or adversarial changes fail linked fingerprint checks",async()=>{
  const c=make();
  const r=await makeReply(c,"QUESTION","Where is it?",opts());
  const p=await makeReport(r,"NOT_DONE","No action taken.",opts());
  const x=structuredClone(p); x.card.title="Another object";
  await assert.rejects(()=>validatePacket(x),/modified card/);
  const y=structuredClone(p); y.reply.card.title="Altered chair";
  await assert.rejects(()=>validatePacket(y),/fingerprint mismatch/);
  const z=await makeReturn(p,"DISPUTED","Not witnessed",opts());
  z.report.note="It happened differently";
  await assert.rejects(()=>validatePacket(z),/modified report/);
});
test("unknown fields, malformed links and oversized cards are refused",async()=>{
  const c=make();
  await assert.rejects(()=>validatePacket({...c,owner_verified:true}),/fields/);
  await assert.rejects(()=>decodePacket("http://example.com"),/missing or malformed/);
  await assert.rejects(()=>decodePacket(".".repeat(10000)),/missing or malformed/);
  assert.throws(()=>encodePacket({data:"x".repeat(12000)}),/size limit/);
});
test("no mixing unrelated cards in one event chain",async()=>{
  const c1=make(),c2=make();
  const reply=await makeReply(c1,"INTERESTED","",opts());
  const report=await makeReport(reply,"DONE","A chair moved.",opts());
  report.card=c2;
  report.cardFingerprint=await fingerprint(c2);
  await assert.rejects(()=>validatePacket(report),/another card/);
});
test("no false confirmation if reader merely opens a link",async()=>{
  const c=make(),reply=await makeReply(c,"PASS","Not available",opts());
  assert.equal(reply.response,"PASS");
  assert.equal(reply.status,undefined);
  assert.equal(reply.claim,undefined);
  assert.match(label(reply),/NOT A RESERVATION/);
});
