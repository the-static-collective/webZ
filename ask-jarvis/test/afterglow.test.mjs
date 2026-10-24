import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeInvite,inviteToken,readInvite} from '../public/tables/model.mjs';
import {publicRelay,prepareNextTable,privateWitnessText,witnessFingerprint} from '../public/tables/afterglow.mjs';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const original=makeInvite({title:'Kitchen meeting',purpose:'Could neighbors host a simple dinner?',date:'2026-10-24',time:'18:00',venue:'Public meeting space',host:'An optional host'});
const publicQuestion='Could we meet again to share ideas for a community pantry?';
test('private witness is attributable only as one unverified draft, never as collective proof',()=>{
  const witness=privateWitnessText(original,'We discussed rice and soup.','Ask who might host the next public gathering.');
  assert.match(witness,/PRIVATE OBSERVER DRAFT \/ NOT VERIFIED/);
  assert.match(witness,/one person\'s account/);
  assert.match(witness,/Kitchen meeting/);
  assert.match(witness,/We discussed rice and soup/);
  assert.match(witness,/This text is NOT included in the next-table invitation/);
});
test('seven-day next table inherits only opaque bounded lineage and explicitly approved public question',()=>{
  const {fields,usedPublicQuestion}=prepareNextTable(original,publicQuestion,true);
  assert.equal(usedPublicQuestion,true);
  assert.equal(fields.purpose,publicQuestion);
  assert.equal(fields.date,'2026-10-31');
  assert.equal(fields.host,'');
  assert.equal(fields.venue,'');
  const following=makeInvite(fields,original);
  assert.equal(following.parent,original.id);
  assert.deepEqual(following.chain,[original.id]);
  const token=inviteToken(following);
  const roundTrip=readInvite('#invite='+token);
  assert.equal(roundTrip.purpose,publicQuestion);
  assert.equal(roundTrip.parent,original.id);
  assert.equal(roundTrip.host,'');
  assert.equal(roundTrip.venue,'');
  assert.ok(!token.includes('We discussed rice and soup'));
  assert.deepEqual(Object.keys(roundTrip).sort(),['v','id','title','purpose','date','time','venue','host','parent','chain'].sort());
});
test('no public relay without distinct confirmation, even if entered on the same page as private notes',()=>{
  assert.throws(()=>prepareNextTable(original,publicQuestion,false),/CONFIRM_PUBLIC_SHARING/);
  assert.equal(prepareNextTable(original,'',false).usedPublicQuestion,false);
  assert.match(prepareNextTable(original,'',false).fields.purpose,/What should we carry forward/);
  assert.throws(()=>prepareNextTable(original,'',true),/ENTER_PUBLIC_QUESTION/);
});
test('public questions fail closed for contact details, controls, oversize and private-looking multiline notes',()=>{
  for(const q of [
    'Call me 612-555-1234 to plan the meeting',
    'Email example@example.com for a reservation',
    'Here is my question\nAnd private discussion notes',
    'x'.repeat(271),
    'tiny',
    'How could we collaborate?\u0000'
  ]) assert.throws(()=>publicRelay(q,true),/PUBLIC_QUESTION_UNSAFE/);
  assert.equal(publicRelay('  Could we meet again next week?  ',true),'Could we meet again next week?');
});
test('source notes are not coerced into public payload when preparing a next invitation',()=>{
 const privateRecord='One person said their name and medical history here.';
 const witness=privateWitnessText(original,privateRecord,'A private conversation.');
 const data=prepareNextTable(original,publicQuestion,true);
 const following=makeInvite(data.fields,original);
 assert.ok(witness.includes(privateRecord));
 assert.ok(!JSON.stringify(following).includes(privateRecord));
 assert.ok(!inviteToken(following).includes(privateRecord));
});
test('dirty-state marker changes when personal draft changes; no browser storage required',()=>{
 const a=witnessFingerprint(original,'first','next');
 const b=witnessFingerprint(original,'second','next');
 assert.notEqual(a,b);
 assert.equal(a,witnessFingerprint(original,'first','next'));
});
test('UI keeps three distinct acts and a local evidence boundary',()=>{
 const html=read('../public/tables/index.html');
 const js=read('../public/tables/app.mjs');
 for(const id of ['closing-circle','relay-question','relay-approved','relay-status','save-witness','pass-table','happened','unfinished','next-table-status'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/prepareNextTable\(current/);
 assert.match(js,/privateWitnessText\(current/);
 assert.match(js,/window\.confirm\(/);
 assert.match(js,/witnessFingerprint\(/);
 assert.match(js,/\$\('#happened'\)\.value=''/);
 assert.match(js,/\$\('#unfinished'\)\.value=''/);
 assert.doesNotMatch(js,/\bfetch\(|localStorage|sessionStorage|navigator\.sendBeacon/);
});
