import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composePublicFirstYes,printablePublicFirstYes,classifyArea} from '../public/first-yes/first-yes.mjs';

const base={question:'How could neighbors improve local food access this week?',thread:'auto',capacity:'listen',
 now:new Date('2026-10-26T12:00:00Z')};
const reviewed={
 id:'bd806742-7b1e-4ab7-8194-2c01c14a1121',thread:'grocery',kind:'concern',
 status:'PUBLIC_REVIEWED',
 text:'This is a human-reviewed PUBLIC objection. We should verify the costs before proposing the first trial.',
 createdAt:'2026-10-24T12:00:00Z',publishedAt:'2026-10-25T12:00:00Z'
};
test('local editorial-first First Yes is an unsent artifact without private backend, aid, or affiliation',()=>{
 const kit=composePublicFirstYes(base);
 assert.equal(kit.standing,'PUBLIC_DRAFT_PREPARED_UNSENT');
 assert.equal(kit.topic,'grocery');
 assert.equal(kit.publicSource.status,'EDITORIAL_ONLY_PUBLIC_HISTORY_NOT_REQUESTED');
 assert.equal(kit.authority.inputSentToServer,false);
 assert.equal(kit.authority.ownerFireboxQueried,false);
 assert.equal(kit.authority.administratorCredentialUsed,false);
 assert.equal(kit.authority.workCompleted,false);
 assert.equal(kit.authority.publicPosted,false);
 assert.match(kit.firstYes.whatWouldCount,/observation or correction/);
 const markdown=printablePublicFirstYes(kit);
 assert.match(markdown,/FIRST 15 MINUTES/);
 assert.match(markdown,/NEXT 90 MINUTES/);
 assert.match(markdown,/WITHIN 24 HOURS/);
 assert.match(markdown,/ASK PERMISSION BEFORE ACTING/);
 assert.match(markdown,/DRAFT \/ UNSENT/);
 assert.doesNotMatch(markdown,/partner approved|verified delivery/i);
});
test('real public-review anchor is quoted only as metadata and never promoted to evidence of delivery',()=>{
 const kit=composePublicFirstYes({
  ...base,thread:'grocery',capacity:'print',
  history:[reviewed],historyState:'PUBLIC_REVIEWED_LOADED',allPagesRead:true
 });
 assert.equal(kit.publicSource.status,'HUMAN_REVIEWED_PUBLIC_COMMENT_NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(kit.publicSource.reviewedEntryId,reviewed.id);
 assert.equal(kit.publicSource.reviewedEntryKind,'concern');
 assert.equal(kit.publicSource.coverage,'LOADED_REVIEWED_HISTORY');
 assert.equal(kit.firstYes.headline,'Test the objection');
 assert.doesNotMatch(printablePublicFirstYes(kit),/This is a human-reviewed PUBLIC objection/);
 assert.equal(kit.authority.partnerAffiliationEstablished,false);
 assert.equal(kit.authority.physicalProvisionVerified,false);
});
test('a withdrawn or malformed comment cannot supply actionable community evidence',()=>{
 const withdrawn={...reviewed,status:'WITHDRAWN',text:'',id:'e8aca3f2-098e-4efc-b795-88943e15d75b'};
 const fake={...reviewed,status:'PENDING',id:'8f7500db-f680-487a-b1a4-b4414f04b17c'};
 const kit=composePublicFirstYes({
  ...base,thread:'grocery',history:[withdrawn,fake],historyState:'PUBLIC_REVIEWED_LOADED'
 });
 assert.equal(kit.publicSource.status,'EDITORIAL_ONLY_NO_REVIEWED_ENTRIES_IN_LOADED_HISTORY');
 assert.equal(kit.publicSource.reviewedEntryId,null);
});
test('reviewed history unavailable never masquerades as an empty verified community',()=>{
 const kit=composePublicFirstYes({...base,historyState:'PUBLIC_HISTORY_UNAVAILABLE'});
 assert.equal(kit.publicSource.status,'EDITORIAL_ONLY_PUBLIC_HISTORY_UNAVAILABLE');
 assert.equal(kit.publicSource.coverage,'NOT_LOADED');
 assert.equal(kit.authority.inputSentToServer,false);
});
test('specific milk sourcing picks milk without assuming a grant ended',()=>{
 assert.equal(classifyArea('Can we compare milk prices and local grocery suppliers?'),'milk');
 const kit=composePublicFirstYes({
  ...base,question:'Could a willing purchaser verify whether the milk grant still applies?',
  capacity:'research'
 });
 assert.equal(kit.topic,'milk');
 assert.match(kit.firstYes.permissionGate,/Do not assert a grant deadline/);
 assert.doesNotMatch(printablePublicFirstYes(kit),/grant has ended/i);
});
test('mixed or unrelated subjects never automatically route visitors into a project',()=>{
 const unrelated=composePublicFirstYes({...base,question:'How do I resolve a weird compiler warning?'});
 assert.equal(unrelated.standing,'TOPIC_NEEDS_HUMAN_CHOICE');
 assert.equal(unrelated.question,null);
 assert.equal(unrelated.canExport,false);
 assert.throws(()=>printablePublicFirstYes(unrelated),/NO_PRINTABLE_FIRST_YES/);
 const mixed=composePublicFirstYes({...base,question:'Can artists contribute music to a church service?'});
 assert.equal(mixed.standing,'TOPIC_NEEDS_HUMAN_CHOICE');
 const explicit=composePublicFirstYes({...base,question:'Can artists contribute music to a church service?',thread:'artists'});
 assert.equal(explicit.topic,'artists');
 assert.equal(explicit.standing,'PUBLIC_DRAFT_PREPARED_UNSENT');
});
test('first-person survivor / custody information returns private HOLD and never exports question',()=>{
 for(const question of [
  'My ex is controlling custody of my daughter and I need specific help',
  'I was abused and I need someone to read my police report',
  'I have been stalked by my husband and need to save evidence'
 ]){
  const kit=composePublicFirstYes({...base,question,thread:'care'});
  assert.equal(kit.standing,'PRIVATE_PATH_HOLD');
  assert.equal(kit.question,null);
  assert.equal(kit.referral,'/still-here/');
  assert.throws(()=>printablePublicFirstYes(kit),/NO_PRINTABLE_FIRST_YES/);
 }
});
test('no contact details, secrets, links, or oversized content can enter printable or shareable card',()=>{
 for(const question of [
  'Please contact me at test@example.com about milk',
  'Call 507-555-0131 to coordinate our volunteers',
  'Check https://example.org/case for my documents',
  'My address is 123 Lake Street and the family needs groceries',
  'Bearer '+'A'.repeat(48)+' is our secret administrator key'
 ]){
  assert.throws(()=>composePublicFirstYes({...base,question}),/PRIVATE_CONTACT_OR_SECRET_REFUSED/);
 }
 assert.throws(()=>composePublicFirstYes({...base,question:'short'}),/QUESTION_LENGTH_12_TO_280/);
 assert.throws(()=>composePublicFirstYes({...base,capacity:'automatically-enroll-neighbors'}),/UNSUPPORTED_CAPACITY/);
 assert.throws(()=>composePublicFirstYes({...base,history:[reviewed],historyState:'NOT_REQUESTED'}),/UNREQUESTED_HISTORY_CANNOT_ENTER/);
 assert.throws(()=>composePublicFirstYes({...base,historyState:'PUBLIC_REVIEWED_LOADED'}),/REVIEWED_HISTORY_REQUIRED/);
});
test('public source cannot acquire the owner-only Firebox URL or automatically submit a question',()=>{
 const html=readFileSync(new URL('../public/first-yes/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/first-yes/first-yes-ui.mjs',import.meta.url),'utf8');
 const pure=readFileSync(new URL('../public/first-yes/first-yes.mjs',import.meta.url),'utf8');
 assert.match(html,/No private Campfire key/);
 assert.match(html,/id="readHistory"/);
 assert.match(html,/id="prepare"/);
 assert.match(html,/id="save"/);
 assert.match(html,/\/still-here\//);
 assert.match(ui,/readHistory'\)\.addEventListener\('click'/);
 assert.match(ui,/method:'GET'/);
 assert.match(ui,/data\.reviewedOnly!==true/);
 assert.match(ui,/thread='\+encodeURIComponent\(a\)/);
 assert.match(ui,/state\.historyState='PUBLIC_HISTORY_UNAVAILABLE'/);
 assert.match(ui,/window\.print\(\)/);
 assert.doesNotMatch(ui+pure,/\/v1\/admin\/attention|operator\.key|CAMPFIRE_BOOTSTRAP_KEY|Authorization:\s*'Bearer/);
});
test('public introduction visibly offers First Yes from the existing Ask JAR;VIS home',()=>{
 const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(home,/href="\/first-yes\/"/);
 const board=readFileSync(new URL('../public/board/index.html',import.meta.url),'utf8');
 assert.match(board,/href="\/first-yes\/"/);
});
