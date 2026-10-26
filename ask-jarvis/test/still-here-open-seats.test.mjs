import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROJECT,NEEDS,SEATS,needFor,seatFor,seatForNeed,recruitmentSeat,inviteText,careStep,BLANK_CHRONOLOGY} from '../public/still-here/model.mjs';

test('the survivor first doorway is explicitly unstaffed and does not demand case intake',()=>{
 assert.equal(PROJECT.status,'INDEPENDENT_EARLY_PROTOTYPE_NOT_A_STAFFED_SERVICE');
 assert.match(PROJECT.safety,/NO_ACCOUNT_NO_CASE_INTAKE/);
 assert.equal(NEEDS.length,5);
 assert.equal(new Set(NEEDS.map(x=>x.id)).size,NEEDS.length);
 for(const need of NEEDS){
  assert.ok(need.first.length>35);
  assert.ok(need.boundary.length>40);
  assert.ok(seatForNeed(need.id));
  const s=careStep(need.id);
  assert.equal(s.sharedCase,false);
  assert.equal(s.noStoryCollected,true);
  assert.equal(s.appointment,false);
  assert.equal(s.status,'LOCAL_INFORMATION_ONLY_NOT_STAFFED');
 }
 assert.equal(needFor('unknown'),null);
 assert.throws(()=>careStep('unknown'));
});
test('each open seat begins with fictional safe work and no live group privileges',()=>{
 assert.equal(SEATS.length,7);
 assert.equal(new Set(SEATS.map(x=>x.id)).size,SEATS.length);
 for(const seat of SEATS){
  assert.ok(seat.first.length>50);
  assert.ok(seat.boundary.length>50);
  assert.match(seat.first,/fictional|demo|sample/i);
  const p=recruitmentSeat(seat.id);
  assert.equal(p.roleAssigned,false);
  assert.equal(p.staffed,false);
  assert.equal(p.privateAccess,false);
  assert.equal(p.contactedSurvivors,0);
  assert.equal(p.publication,'DRAFT_NOT_SUBMITTED');
  assert.ok(p.approvalGate.length>45);
  assert.match(p.source,/EDITORIAL_PROJECT_NEED/);
 }
 assert.throws(()=>recruitmentSeat('not-valid'));
});
test('no unsupported legal, medical, case or group capacity claims',()=>{
 const n=needFor('prepare');
 assert.match(n.boundary,/only qualified professionals/i);
 assert.match(seatFor('navigation').boundary,/no legal representation/i);
 assert.match(seatFor('safety').boundary,/no client stories/i);
 assert.match(seatFor('moderation').authority,/only vetted, supervised/i);
 assert.match(PROJECT.privacy,/hosting may still log/i);
});
test('invites recruit capability, not identities or stories',()=>{
 for(const seat of SEATS){
  for(const mode of ['invite','ambassador','self']){
   const s=inviteText(seat.id,mode);
   assert.match(s,/fictional examples only/i);
   assert.match(s,/no live support service/i);
   assert.match(s,/no personal story or commitment|no personal story|no commitment/i);
   assert.doesNotMatch(s,/mailto:|https?:\/\/|api[_ -]?key/i);
  }
 }
 assert.throws(()=>inviteText('safety','emergency'));
 assert.throws(()=>inviteText('not-a-role'));
});
test('chronology keeps facts, reports, inferences and questions separate',()=>{
 assert.match(BLANK_CHRONOLOGY,/directly observed/i);
 assert.match(BLANK_CHRONOLOGY,/someone else told me/i);
 assert.match(BLANK_CHRONOLOGY,/believe or infer/i);
 assert.match(BLANK_CHRONOLOGY,/remains uncertain/i);
 assert.match(BLANK_CHRONOLOGY,/Keep originals/i);
});
test('live page is read-only, discreet, accessible and no private story is collected',()=>{
 const html=readFileSync(new URL('../public/still-here/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/still-here/app.mjs',import.meta.url),'utf8');
 for(const id of ['first-step','needs','need-detail','need-first','need-copy','copy-chronology',
  'open-seats','seats','seat-detail','seat-invite','seat-ambassador','seat-print','seat-status','leave']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/<title>The Porch · Abundent<\/title>/);
 assert.match(html,/noindex,nofollow,noarchive/i);
 assert.match(html,/history.*cannot erase/i);
 assert.match(html,/not a confidential survivor intake channel/i);
 assert.match(html,/script type="module" src="\.\/app\.mjs"/);
 assert.match(js,/inviteText/);
 assert.match(js,/careStep/);
 assert.doesNotMatch(html,/<form\b|<input\b|<textarea\b/i);
 assert.doesNotMatch(js,/\bfetch\s*\(|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|\binnerHTML\s*=/i);
 assert.doesNotMatch(html,/onclick\s*=/i);
});
