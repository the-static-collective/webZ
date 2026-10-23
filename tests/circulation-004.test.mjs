import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareFieldQuestion} from '../circulation/003/packet.mjs';
import {CAPABILITIES,EXAMPLES,openExercise,simulateResponse,makeReturn,verifyReturn,verifyExercise,validateQuestion} from '../circulation/004/model.mjs';
const sample=EXAMPLES[0];

test('four fictional questions and six source-linked, independent possible doors',()=>{
  assert.equal(EXAMPLES.length,4);
  assert.equal(CAPABILITIES.length,6);
  assert.equal(new Set(CAPABILITIES.map(x=>x.id)).size,6);
  for(const c of CAPABILITIES)assert.match(c.href,/^https:\/\/github\.com\/the-static-collective\//);
});
test('rehearsal begins with zero recipient authority, effects or outcomes',async()=>{
  const exercise=await openExercise({kind:sample.kind,question:sample.question,lanes:sample.lanes,origin:'EXAMPLE_ONLY'});
  const receipt=await makeReturn(exercise);
  assert.equal(await verifyReturn(receipt,exercise),true);
  assert.deepEqual(exercise.invitations.map(x=>x.status),['PENDING','PENDING','PENDING']);
  assert.deepEqual(exercise.invitations.map(x=>x.witness),['NONE','NONE','NONE']);
  assert.equal(exercise.authority,'NONE');
  assert.equal(exercise.effect,'NONE');
  assert.equal(receipt.outcome,'NO_REAL_WORLD_OUTCOME_CLAIMED');
  assert.equal(receipt.organizerAdopted,false);
  assert.equal(receipt.recipientVerified,false);
  assert.equal(receipt.published,false);
});
test('two separate fictitious responses return without altering original question',async()=>{
  const base=await openExercise({kind:sample.kind,question:sample.question,lanes:sample.lanes,origin:'EXAMPLE_ONLY'});
  const held=await simulateResponse(base,'table','HOLD_FOR_DISCUSSION');
  const refused=await simulateResponse(held,'network','DECLINE');
  assert.notEqual(base.id,held.id);
  assert.notEqual(held.id,refused.id);
  assert.equal(base.invitations[0].status,'PENDING');
  assert.equal(refused.question,base.question);
  assert.equal(refused.invitations[0].witness,'LOCAL_SIMULATION_ONLY');
  assert.equal(refused.invitations[1].status,'DECLINE');
  assert.equal(refused.invitations[2].status,'PENDING');
  const receipt=await makeReturn(refused);
  assert.equal(await verifyReturn(receipt,refused),true);
  await assert.rejects(verifyReturn(receipt,held),/RETURN_MISMATCH/);
});
test('private contacts, links, false authority and unsupported responses fail closed',async()=>{
  for(const q of ['hello','Email name@domain.org','Call 507-555-1212 for our ride',
    'See https://example.com/private','Please share my street address with the group']){
    assert.throws(()=>validateQuestion(q));
  }
  await assert.rejects(openExercise({kind:'QUESTION',question:'Could neighbors share their tools?',lanes:['network'],origin:'SELF_ATTESTED_LOCAL',consent:false}),/ATTESTATION/);
  await assert.rejects(openExercise({kind:'QUESTION',question:'Could neighbors share their tools?',lanes:['unknown'],origin:'SELF_ATTESTED_LOCAL',consent:true}),/INVALID/);
  const case1=await openExercise({kind:sample.kind,question:sample.question,lanes:sample.lanes,origin:'EXAMPLE_ONLY'});
  await assert.rejects(simulateResponse(case1,'care','REAL_AID_DELIVERED'),/INVALID_RESPONSE/);
  await assert.rejects(verifyExercise({...case1,authority:'ORGANIZER_APPROVED'}));
  await assert.rejects(verifyExercise({...case1,question:'A different question with a better sound?'}),/(EXAMPLE_MISMATCH|DIGEST_MISMATCH)/);
  await assert.rejects(verifyExercise({...case1,personPhone:'5075551111'}),/UNEXPECTED/);
});
test('real 003 packet validator is used for a bounded and non-authoritative local import',async()=>{
  const source=await prepareFieldQuestion({kind:'QUESTION',text:sample.question,authorRole:'AUTHOR',permissionReviewed:true,privacyReviewed:true});
  const exercise=await openExercise({kind:'QUESTION',question:source.public_question,lanes:['questions','witness'],origin:'IMPORT_003_VERIFIED_BYTES',fieldPacket:source});
  assert.equal(exercise.fieldPacketId,source.id);
  assert.equal(exercise.authority,'NONE');
  await assert.rejects(openExercise({kind:'QUESTION',question:source.public_question,lanes:['questions'],origin:'IMPORT_003_VERIFIED_BYTES',fieldPacket:{...source,person_authenticated:true}}));
});
test('deterministic hashes, no automatic network or browser persistence, and immutable release manifest',async()=>{
  const case1=await openExercise({kind:sample.kind,question:sample.question,lanes:sample.lanes,origin:'EXAMPLE_ONLY'});
  const case2=await openExercise({kind:sample.kind,question:sample.question,lanes:sample.lanes,origin:'EXAMPLE_ONLY'});
  assert.deepEqual(case1,case2);
  assert.deepEqual(await makeReturn(case1),await makeReturn(case2));
  const root=new URL('../circulation/004/',import.meta.url);
  const html=readFileSync(new URL('index.html',root),'utf8');
  const app=readFileSync(new URL('app.mjs',root),'utf8');
  const css=readFileSync(new URL('style.css',root),'utf8');
  assert.match(html,/INDEPENDENT FIELD STUDY/);
  assert.match(html,/NOT AN ORGANIZER PROGRAM/);
  assert.match(html,/id="import-003"/);
  assert.match(app,/verifyFieldQuestion\(packet\)/);
  assert.match(css,/@media print/);
  assert.doesNotMatch(app,/fetch\s*\(|WebSocket|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|navigator\.geolocation/);
  assert.doesNotMatch(html,/<script[^>]*https?:|<iframe\b|<input[^>]*type="email"/i);
  const build=readFileSync(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');
  for(const path of ['circulation/004/index.html','circulation/004/style.css','circulation/004/app.mjs','circulation/004/model.mjs']){
    assert.ok(build.includes("'"+path+"'"),'Missing source-exact public release path '+path);
  }
});
