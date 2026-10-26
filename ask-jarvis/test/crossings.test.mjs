import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composePublicFirstYes} from '../public/first-yes/first-yes.mjs';
import {SCHEMA,RETURN_SCHEMA,makeCrossing,readCrossing,makeReturn,doorsFor,TOPICS} from '../public/crossings/model.mjs';
const when=new Date('2026-10-26T15:00:00Z');
const kit=composePublicFirstYes({question:'How could willing neighbors improve local food access this week?',
  thread:'grocery',capacity:'print',now:when});
test('local public kit crosses as metadata only, not visitor input or consent',()=>{
 const ticket=makeCrossing(kit,when);
 assert.equal(ticket.schema,SCHEMA);
 assert.equal(ticket.topic,'grocery');
 assert.equal(ticket.capacity,'Make a card');
 assert.equal(ticket.scope,'PUBLIC_COMMUNITY_ONLY');
 assert.equal(ticket.standing,'PROPOSED_UNSENT');
 assert.equal(ticket.authority.consentReceived,false);
 assert.equal(ticket.authority.workCompleted,false);
 const json=JSON.stringify(ticket);
 assert.equal(json.includes(kit.question),false);
 assert.doesNotMatch(json,/question|caseHistory|notes|name|email|phone|address/i);
 assert.deepEqual(readCrossing(json),ticket);
});
test('private or unclassified First Yes cannot produce crossing tickets',()=>{
 const privateKit=composePublicFirstYes({question:'My ex is controlling custody of my daughter and I need specific help',
  thread:'care',capacity:'listen',now:when});
 assert.equal(privateKit.standing,'PRIVATE_PATH_HOLD');
 assert.throws(()=>makeCrossing(privateKit),/NO_PUBLIC_WORK_CARD/);
 assert.throws(()=>makeCrossing({...kit,topic:'other'}),/INVALID_PUBLIC_CONTEXT/);
 assert.throws(()=>makeCrossing({...kit,capacity:'auto-enroll'}),/INVALID_PUBLIC_CONTEXT/);
});
test('import fails closed on smuggled personal fields, forged authority, and invalid context',()=>{
 const t=makeCrossing(kit,when);
 for(const changed of [
  {...t,question:'private survivor story'},
  {...t,privateContact:'name@example.com'},
  {...t,topic:'custody-case'},
  {...t,standing:'APPROVED'},
  {...t,authority:{...t.authority,consentReceived:true}},
  {...t,authority:{...t.authority,personalData:true}},
  {...t,sourceStatus:'not publication reviewed'},
  {...t,reviewedEntryId:'https://example.org/private'},
  {...t,createdAt:'yesterday'}
 ])assert.throws(()=>readCrossing(changed),/UNRECOGNIZED_OR_UNSAFE_CROSSING/);
});
test('every area resolves only fixed, non-data-carrying doors',()=>{
 for(const topic of TOPICS){
  const doors=doorsFor(topic);
  assert.ok(doors.length>=3);
  for(const d of doors){
   assert.match(d.href,/^(\/|https:\/\/garden\.abundent\.org\/)/);
   assert.doesNotMatch(d.href,/[?#]/);
   assert.ok(d.what.includes('.')||d.what.includes(';'));
  }
 }
 const care=doorsFor('care').map(x=>x.href).join(' ');
 assert.match(care,/still-here/);
 assert.doesNotMatch(care,/\/board\/|\/tables\//);
});
test('self-reported return cannot imply checked delivery or mandate',()=>{
 const t=makeCrossing(kit,when);
 for(const status of ['NOT_STARTED','INVITED','DECLINED','CORRECTED','TRIED','COMPLETED']){
  const r=makeReturn(t,status,when);
  assert.equal(r.schema,RETURN_SCHEMA);
  assert.equal(r.standing,'UNVERIFIED_SELF_REPORT');
  assert.equal(r.agreementEstablished,false);
  assert.equal(r.automaticPublication,false);
  assert.equal(r.proof,'NONE');
  assert.equal(JSON.stringify(r).includes(kit.question),false);
 }
 assert.throws(()=>makeReturn(t,'PARTNER_APPROVED'),/INVALID_RETURN_STATUS/);
});
test('public UI has an explicit, local-only file relay and preserves original First Yes path',()=>{
 const base=new URL('../public/',import.meta.url);
 const firstHtml=readFileSync(new URL('first-yes/index.html',base),'utf8');
 const firstUi=readFileSync(new URL('first-yes/first-yes-ui.mjs',base),'utf8');
 const portal=readFileSync(new URL('crossings/index.html',base),'utf8');
 const app=readFileSync(new URL('crossings/app.mjs',base),'utf8');
 const home=readFileSync(new URL('index.html',base),'utf8');
 assert.match(firstHtml,/id="save-crossing"/);
 assert.match(firstHtml,/href="\/crossings\/"/);
 assert.match(firstUi,/makeCrossing\(state\.kit\)/);
 assert.match(home,/href="\/crossings\/"/);
 assert.match(portal,/type="file"/);
 assert.match(portal,/processed in this browser/);
 assert.match(app,/file\.text\(\)/);
 assert.match(app,/readCrossing\(raw\)/);
 assert.match(app,/makeReturn\(ticket/);
 assert.doesNotMatch(app,/fetch\(|localStorage|sessionStorage|sendBeacon|XMLHttpRequest/);
});
