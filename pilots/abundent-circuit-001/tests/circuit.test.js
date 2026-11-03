const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');
function setup() {
  const st=C.init();
  const a=C.createNode(st,'Fictional Fellowship Harbor','gathering');
  const b=C.createNode(st,'Fictional Workshop','maker');
  const p=C.createProject(st,a.id,'Tiny festival','One two-hour rehearsal with authorization','festival');
  return {st,a,b,p};
}
test('starts with separate harbors and no automatic commitments',()=>{
  const {st,a,b,p}=setup();
  assert.notEqual(a.id,b.id); assert.equal(p.state,'PROPOSED');
  assert.equal(C.projectView(st,a.id).deeds,0);
  assert.equal(C.projectView(st,b.id).seeds,0);
  assert.equal(C.checkStore(st),true);
});
test('report is not confirmation, reviewer cannot be the accepting actor',()=>{
  const {st,a,p}=setup();
  assert.throws(()=>C.report(st,a.id,p.id,'Eli','Done'),/Only accepted/);
  C.accept(st,a.id,p.id,'Eli','Allowed to rehearse, not to spend');
  assert.equal(C.projectView(st,a.id).deeds,0);
  assert.throws(()=>C.report(st,a.id,p.id,'Other','Done'),/match/);
  C.report(st,a.id,p.id,'Eli','The room was set up and restored.');
  assert.equal(C.projectView(st,a.id).deeds,0);
  assert.throws(()=>C.confirm(st,a.id,p.id,'ELI','CONFIRMED','portable setup skills'),/separate reviewer/);
  C.confirm(st,a.id,p.id,'Grace','CONFIRMED','A repeatable two-hour setup');
  assert.equal(C.projectView(st,a.id).deeds,1);
  assert.equal(C.projectView(st,a.id).affordances[0].name,'A repeatable two-hour setup');
  assert.throws(()=>C.confirm(st,a.id,p.id,'Morgan','CONFIRMED','bad'),/Only reported/);
});
test('a disputed report never creates a deed or capacity',()=>{
  const {st,a,p}=setup();C.accept(st,a.id,p.id,'Eli','One rehearsal');
  C.report(st,a.id,p.id,'Eli','Done');C.confirm(st,a.id,p.id,'Grace','DISPUTED','');
  assert.equal(C.projectView(st,a.id).deeds,0);
  assert.equal(C.projectView(st,a.id).affordances.length,0);
});
test('candidate crosses into HOLD and stays locally controlled',()=>{
  const {st,a,b,p}=setup();
  const packet=C.crossing(st,a.id,p.id,b.id,'Could you review a stage?');
  assert.equal(C.node(st,b.id).inbox.length,0,'preparing is not transmitting');
  assert.equal(packet.permission,'REVIEW_ONLY');
  assert.throws(()=>C.receive(st,a.id,packet),/another harbor/);
  const received=C.receive(st,b.id,packet);assert.equal(received.disposition,'HOLD');
  assert.throws(()=>C.receive(st,b.id,packet),/Replay/);
  assert.throws(()=>C.decide(st,a.id,received.id,'ADMIT_FOR_REVIEW','Host','Okay'),/Unknown inbound/);
  C.decide(st,b.id,received.id,'ADMIT_FOR_REVIEW','Workshop host','Interested in a conversation only');
  assert.equal(C.projectView(st,b.id).seeds,0,'admission for review does not create a project');
  const ret=C.makeReturn(st,b.id,received.id);
  assert.equal(ret.decision,'ADMIT_FOR_REVIEW');
  assert.equal(C.node(st,a.id).outbox[0].replies.length,0,'return is not automatically delivered');
  C.receiveReturn(st,a.id,ret); assert.equal(C.node(st,a.id).outbox[0].replies.length,1);
  assert.throws(()=>C.receiveReturn(st,a.id,ret),/already received/);
  assert.equal(C.projectView(st,a.id).deeds,0,'return is not fulfillment');
});
test('receiver refuses, not a negative score',()=>{
  const {st,a,b,p}=setup();const v=C.crossing(st,a.id,p.id,b.id,'Question');
  const incoming=C.receive(st,b.id,v);C.decide(st,b.id,incoming.id,'REFUSE','Workshop','Not our scope');
  assert.equal(C.makeReturn(st,b.id,incoming.id).decision,'REFUSE');
  assert.equal(C.projectView(st,b.id).deeds,0);
});
test('cartridge adoption is a distinct unapproved new seed',()=>{
  const {st,a,b,p}=setup();C.accept(st,a.id,p.id,'Eli','Rehearsal');C.report(st,a.id,p.id,'Eli','Completed');
  C.confirm(st,a.id,p.id,'Grace','CONFIRMED','Setup knowledge');
  const card=C.cartridge(st,a.id,p.id,'Request permission. Prepare room. Review cleanup.','Different venue rules and budget.');
  assert.equal(card.schema,C.CARTRIDGE); const next=C.adopt(st,b.id,card);
  assert.equal(next.state,'PROPOSED');assert.equal(C.projectView(st,b.id).deeds,0);
  assert.equal(C.projectView(st,b.id).seeds,1); assert.match(next.parent,/Fictional Fellowship/);
});
test('drafts cannot be published as finished cartridges',()=>{
  const {st,a,p}=setup();assert.throws(()=>C.cartridge(st,a.id,p.id,'Instructions','Limits'),/Only reviewed-confirmed/);
});
test('money and gifts do not collapse into one balance',()=>{
  const {st,a}=setup();
  C.economy(st,a.id,'money_in','Dinner contributions',1200,'PLANNED');
  C.economy(st,a.id,'money_out','Actual supplies',349,'SELF_REPORTED');
  C.economy(st,a.id,'gift','Loaned chairs',0,'SELF_REPORTED');
  assert.throws(()=>C.economy(st,a.id,'gift','Fake dollars',1000,'SELF_REPORTED'),/Non-money/);
  assert.equal(C.node(st,a.id).economy.length,3);
  assert.equal(C.projectView(st,a.id).gifts,1);
});
test('bounded compute task has real local output and no GHoT claim',()=>{
  const {st,a}=setup();const rec=C.compute(st,a.id,'word_count','a little  harbor');
  assert.equal(rec.output,3);assert.equal(rec.executor,'this_browser_only');assert.equal(rec.actualGHoT,false);
  assert.throws(()=>C.compute(st,a.id,'eval','alert(1)'),/Unsupported/);
});
test('invalid schemas, mistaken destinations and huge/duplicate state refuse',()=>{
  const {st,a,b,p}=setup();
  const packet=C.crossing(st,a.id,p.id,b.id,'Check');
  assert.throws(()=>C.receive(st,b.id,{...packet, permission:'SEND_MONEY'}),/scope refused/);
  const backup=C.clone(st);backup.schema='not-this';assert.throws(()=>C.checkStore(backup),/Invalid local backup/);
  assert.throws(()=>C.adopt(st,b.id,{schema:C.CARTRIDGE,title:'Broken',method:'X',knownLimits:'Y',category:'currency'}),/category/);
  assert.throws(()=>C.receiveReturn(st,b.id,{schema:C.RETURN,destination:b.id,source:a.id,decision:'REFUSE',crossingId:'bogus',note:'No thank you',reviewerLabel:'Receiver'}),/matching outbound/);
});
test('invitations are unsent drafts and cannot auto-enroll people',()=>{
  const {st,a}=setup();const inv=C.invitation(st,a.id,'Meetup','Come to a hypothetical gathering');
  assert.equal(inv.status,'UNSENT_DRAFT');assert.equal(inv.scope,'public_safe_invitation_only');
  assert.equal(C.node(st,a.id).projects.length,1);
});
test('two entirely separate local notebooks can exchange a review-only crossing via public address',()=>{
  const source=C.init(), target=C.init();
  const a=C.createNode(source,'Source','community'), b=C.createNode(target,'Target','workshop');
  const p=C.createProject(source,a.id,'New festival','Consider an accessible neighborhood concert','festival');
  const packet=C.crossing(source,a.id,p.id,b.id,'Review-only ask from independent origin');
  assert.equal(C.node(source,a.id).outbox.length,1);
  assert.equal(C.node(target,b.id).inbox.length,0);
  const inlet=C.receive(target,b.id,JSON.parse(JSON.stringify(packet)));
  assert.equal(inlet.disposition,'HOLD');
  C.decide(target,b.id,inlet.id,'REFUSE','Local steward','Cannot host this season');
  const reply=C.makeReturn(target,b.id,inlet.id);
  C.receiveReturn(source,a.id,JSON.parse(JSON.stringify(reply)));
  assert.equal(C.node(source,a.id).outbox[0].replies[0].decision,'REFUSE');
  assert.equal(C.projectView(source,a.id).deeds,0);
  assert.equal(C.projectView(target,b.id).seeds,0);
});

test('native GHoT receipt is digested, deduplicated, and grants zero Full Measure Deeds',()=>{
  const {st,a}=setup();
  const digest='a'.repeat(64);
  const receipt={kind:'ghot.receipt',version:'0',capability:'system.hash',status:'ok',
    receipt_id:'receipt-0000-0000',task_id:'task-0000-0000',executor_node_id:'node-native-1',
    output:{sha256:digest},output_sha256:'b'.repeat(64)};
  const result=C.nativeGhotRecord(st,a.id,3,receipt,digest);
  assert.equal(result.actualGHoT,true);assert.equal(result.inputSha256,digest);
  assert.equal(C.projectView(st,a.id).deeds,0);
  assert.equal(C.projectView(st,a.id).harvests,0);
  assert.throws(()=>C.nativeGhotRecord(st,a.id,3,receipt,digest),/Duplicate/);
  assert.throws(()=>C.nativeGhotRecord(st,a.id,3,{...receipt,output:{sha256:'f'.repeat(64)}},digest),/does not match/);
  assert.throws(()=>C.nativeGhotRecord(st,a.id,3,{...receipt,status:'error'},digest),/Not a native/);
});

test('LAN peer record is typed, bounded and never awards a Full Measure Deed',()=>{
  const {st,a}=setup();
  const input='one local harbor, another local GHoT';
  const digest=require('node:crypto').createHash('sha256').update(input).digest('hex');
  const receipt={kind:'ghot.receipt',version:'0',capability:'system.hash',status:'ok',
    receipt_id:'receipt-3333',task_id:'task-4444',executor_node_id:'node-remote',
    output:{sha256:digest}};
  const bridge={bridgeVerified:true,transport:'lan_hmac_v1',workerNodeId:'node-remote',loopbackTest:false};
  const rec=C.remoteGhotRecord(st,a.id,Buffer.byteLength(input),receipt,digest,bridge);
  assert.equal(rec.actualGHoT,true);
  assert.equal(rec.status,'GHOT_NATIVE_EXECUTED_LAN');
  assert.equal(rec.transport,'lan_hmac_v1');
  assert.equal(C.projectView(st,a.id).deeds,0);
  assert.throws(()=>C.remoteGhotRecord(st,a.id,Buffer.byteLength(input),receipt,digest,bridge),/Duplicate/);
  assert.throws(()=>C.remoteGhotRecord(st,a.id,Buffer.byteLength(input),
    {...receipt,receipt_id:'receipt-new',executor_node_id:'node-imposter'},digest,bridge),/remote executor/);
  assert.throws(()=>C.remoteGhotRecord(st,a.id,Buffer.byteLength(input),
    {...receipt,receipt_id:'receipt-next'},digest,{...bridge,bridgeVerified:false}),/verified/);
});
