import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BOTTLENECK_GATES,getGate,matchGate,safePublicIssue,seatPacket,recruitmentCopy,openSeatLink,gateForSummary} from '../public/board/open-seats.mjs';
import {summarizeHistory} from '../public/board/memory.mjs';

test('the first known operational constraint is an invitation, never appointment',()=>{
 const review=getGate('review');
 assert.equal(review.source,'CONFIRMED_WORKBOARD_CAPABILITY_GAP');
 const packet=seatPacket(review);
 assert.equal(packet.gate,'review');
 assert.equal(packet.authority,'NONE');
 assert.equal(packet.recruitmentStatus,'DRAFT_NOT_PUBLISHED');
 assert.equal(packet.moderationAccess,'NONE');
 assert.equal(packet.assignedPeople,0);
 assert.equal(packet.applicants,0);
 assert.equal(packet.result,'NOT_TRIED');
 assert.match(packet.limit,/no.*credentials|do not request database credentials/i);
 assert.match(packet.approvalFrom,/only.*operator/i);
 assert.match(packet.firstMove,/fictional/i);
});
test('not every approval bottleneck means recruit an unauthorized approver',()=>{
 const owner=seatPacket('permission');
 assert.match(owner.approvalFrom,/actual property owner|organizer/i);
 assert.equal(owner.authority,'NONE');
 assert.match(owner.firstMove,/draft one.*permission/i);
 assert.equal(matchGate('We are waiting for permission to use the community venue.').id,'permission');
 assert.equal(matchGate('We need a person to moderate incoming questions.').id,'review');
 assert.equal(matchGate('We need a responsible researcher to verify an unconfirmed report.').id,'verify');
 assert.equal(matchGate('Someone could build a small prototype of the printed card.').id,'build');
 assert.equal(matchGate('We need a person to invite willing participants.').id,'invite');
 assert.equal(matchGate('Nobody has been able to report what happened yesterday.').id,'return');
});
test('all open invitations have a reversible trial, gate and permission before consequence',()=>{
 assert.equal(BOTTLENECK_GATES.length,6);
 assert.equal(new Set(BOTTLENECK_GATES.map(x=>x.id)).size,BOTTLENECK_GATES.length);
 for(const g of BOTTLENECK_GATES){
  const packet=seatPacket(g.id);
  assert.ok(packet.reason.length>40);
  assert.ok(packet.firstMove.length>40);
  assert.ok(packet.approvalFrom.length>45);
  assert.ok(packet.limit.length>35);
  assert.equal(packet.declineAccepted,true);
  for(const mode of ['interested','invite','ambassador']){
   const text=recruitmentCopy(packet,mode);
   assert.match(text,/interest is not appointment|not an appointment/i);
   assert.match(text,/small trial/i);
   assert.match(text,/unsubmitted draft/i);
   if(mode==='ambassador')assert.match(text,/without consent/i);
  }
 }
});
test('public bottleneck text never leaks private identifying details into shared invitations',()=>{
 const bad=['name@example.com','507-555-1212','https://example.org/ref','123 Main Street',
  'My password is SomethingSecret','abc\ndef'];
 for(const value of bad){
  const issue='Could someone help? '+value;
  assert.equal(safePublicIssue(issue),false,issue);
  assert.throws(()=>seatPacket('review',{issue}));
 }
 assert.equal(safePublicIssue('Our volunteer review rubric needs a second opinion.'),true);
 assert.throws(()=>seatPacket('not-a-seat'));
 assert.throws(()=>seatPacket('review',{thread:'random'}));
 assert.throws(()=>seatPacket('review',{sourceRef:'unreviewed-id'}));
});
test('a reviewed summary can suggest a capability without pretending its author volunteered',()=>{
 const [s]=summarizeHistory([],{scope:'milk'});
 const packet=gateForSummary(s);
 assert.equal(packet.gate,'verify');
 assert.equal(packet.sourceRef,null);
 assert.equal(packet.assignedPeople,0);
 assert.equal(packet.authority,'NONE');
 assert.equal(packet.recruitmentStatus,'DRAFT_NOT_PUBLISHED');
});
test('mobile role recruitment is integrated, account-free and never writes private details on the Workboard',()=>{
 const html=readFileSync(new URL('../public/board/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/board/open-seats-ui.mjs',import.meta.url),'utf8');
 const memory=readFileSync(new URL('../public/board/memory-ui.mjs',import.meta.url),'utf8');
 const preview=readFileSync(new URL('../scripts/build-workboard-edge-preview.mjs',import.meta.url),'utf8');
 for(const id of ['open-seats','seat-cards','seat-name','seat-help','seat-ambassador','seat-status','seat-spotlight-open'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes('src="/board/open-seats-ui.mjs"'));
 assert.match(html,/no self-service moderator console/i);
 assert.match(ui,/https:\/\/abundent\.org\/contact\//);
 assert.match(ui,/open-seat-from-memory/);
 assert.match(memory,/open-seat-from-memory/);
 assert.match(preview,/open-seats-ui\.mjs/);
 assert.match(preview,/open-seats\.mjs/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|\bsendBeacon\b|localStorage|sessionStorage|innerHTML\s*=/);
 assert.doesNotMatch(html,/onclick=/);
});

test('safe seat invitation is linkable without leaking personal text',()=>{
 const seat=seatPacket('review');
 const path=openSeatLink('https://abundent.org/board/',seat.gate);
 assert.equal(new URL(path).searchParams.get('seat'),'review');
 assert.ok(recruitmentCopy(seat,'invite',path).includes('Explore the open seat:'));
 assert.equal(new URL(openSeatLink('https://abundent.org/board/#private','review')).hash,'');
 assert.throws(()=>openSeatLink('http://example.org/board/','review'));
});
