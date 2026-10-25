import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PHASES,proposalCard,assentCard,witnessCard,projectRoom,parseCard} from '../public/heartbeat/model.mjs';

const N='11111111-1111-4111-8111-111111111111';
const O='22222222-2222-4222-8222-222222222222';
const P='33333333-3333-4333-8333-333333333333';
const A='44444444-4444-4444-8444-444444444444';
const B='55555555-5555-4555-8555-555555555555';
const W='66666666-6666-4666-8666-666666666666';
const note=(id,kind,body,status='VISIBLE')=>({id,kind,body,status,createdAt:'2026-10-25T12:00:00Z',nickname:''});
const need=note(N,'need','One pantry needs help moving a small donation.');
const offer=note(O,'offer','I can offer a truck and three free hours.');
const proposal=note(P,'question',proposalCard({needId:N,offerId:O,plan:'Ask about a small donation pickup, availability, and permission.'}));
const yesNeed=note(A,'rsvp',assentCard({proposalId:P,side:'need'}));
const yesOffer=note(B,'rsvp',assentCard({proposalId:P,side:'offer'}));
const witness=note(W,'witness',witnessCard({proposalId:P,outcome:'completed',details:'The participants say the pickup happened.'}));

test('five phases, separate voluntary submissions, no automatic matching',()=>{
  assert.deepEqual(PHASES,['DISCOVER','COMPOSE','ACT','WITNESS','RETURN']);
  const first=projectRoom([need,offer]);
  assert.equal(first.needs.length,1);
  assert.equal(first.offers.length,1);
  assert.equal(first.proposals.length,0);
  assert.equal(first.automaticMatching,false);
  assert.equal(first.privateContactShared,false);
});
test('proposal remains HOLD even with both source cards visible',()=>{
  const state=projectRoom([need,offer,proposal]);
  assert.equal(state.proposals.length,1);
  assert.equal(state.proposals[0].twoStatements,false);
  assert.match(state.proposals[0].phases[2].state,/HOLD/);
  assert.equal(state.proposals[0].actionPerformedBySite,false);
});
test('two notes are self-claims, never verified authority or identity',()=>{
  const state=projectRoom([need,offer,proposal,yesNeed,yesOffer]);
  assert.equal(state.proposals[0].twoStatements,true);
  assert.equal(state.proposals[0].verifiedConsent,false);
  assert.equal(state.proposals[0].identityVerified,false);
  assert.equal(state.proposals[0].physicalCompletionVerified,false);
  assert.equal(state.proposals[0].actionPerformedBySite,false);
});
test('witness report returns a statement, not proof of physical completion',()=>{
  const p=projectRoom([need,offer,proposal,yesNeed,yesOffer,witness]).proposals[0];
  assert.equal(p.latestReport.outcome,'completed');
  assert.equal(p.phases[4].state,'visible to room members');
  assert.equal(p.physicalCompletionVerified,false);
});
test('completed witness is not promoted without two separate side claims',()=>{
  const p=projectRoom([need,offer,proposal,yesNeed,witness]).proposals[0];
  assert.equal(p.latestReport,null);
  const blocked=note(W,'witness',witnessCard({proposalId:P,outcome:'blocked',details:'No pickup was arranged; we did not proceed.'}));
  assert.equal(projectRoom([need,offer,proposal,blocked]).proposals[0].latestReport.outcome,'blocked');
});
test('unapproved, hidden, removed or mismatched source notes fail closed',()=>{
  assert.equal(projectRoom([need,{...offer,status:'PENDING'},proposal,yesNeed,yesOffer,witness]).proposals.length,0);
  assert.equal(projectRoom([need,offer,{...proposal,status:'HIDDEN'},yesNeed,yesOffer]).proposals.length,0);
  assert.equal(projectRoom([need,offer,proposal,{...yesNeed,status:'PENDING'},yesOffer]).proposals[0].twoStatements,false);
  assert.equal(projectRoom([need,offer,proposal,yesNeed,yesOffer,{...witness,status:'PENDING'}]).proposals[0].latestReport,null);
  assert.equal(projectRoom([need,proposal,yesNeed,yesOffer,witness]).proposals.length,0);
  assert.equal(projectRoom([need,offer,proposal,{...yesOffer,body:'HB1:Y:not-an-id:offer'}]).proposals[0].twoStatements,false);
});
test('invalid inputs and private data cannot enter structured heartbeat cards',()=>{
  assert.throws(()=>proposalCard({needId:N,offerId:N,plan:'Same note'}),/separate/);
  assert.throws(()=>proposalCard({needId:N,offerId:O,plan:'Email me at tester@example.org'}),/contact details/);
  assert.throws(()=>proposalCard({needId:N,offerId:O,plan:'a'.repeat(226)}),/public-safe/);
  assert.throws(()=>assentCard({proposalId:P,side:'both'}),/Choose/);
  assert.throws(()=>witnessCard({proposalId:P,outcome:'verified',details:'Not allowed'}),/Invalid reported outcome/);
  assert.equal(parseCard(note(P,'need',proposal.body)),null);
  assert.equal(parseCard({...proposal,status:'PENDING'}),null);
});
test('public UI preserves original account-free moderated server boundaries',()=>{
  const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
  const html=read('../public/heartbeat/index.html');
  const js=read('../public/heartbeat/app.mjs');
  const gather=read('../public/gather/index.html');
  const table=read('../public/tables/live/live.mjs');
  for(const id of ['join-form','proposal-form','yes-form','witness-form','receipt-text','status'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(gather,/href="\/heartbeat\/"/);
  assert.match(table,/new URL\('\/heartbeat\/'/);
  assert.match(js,/action:'read'/);
  assert.match(js,/action:'post'/);
  assert.match(js,/card.status==='VISIBLE'/);
  assert.match(js,/card.status==='VISIBLE'/);
  assert.doesNotMatch(js,/SUPABASE_SERVICE_ROLE_KEY|service_role|sb_secret_|localStorage|document\.cookie/);
  assert.match(read('../vercel.json'),/connect-src.*kbhqacsdvjsstzyplqij.supabase.co/);
});
