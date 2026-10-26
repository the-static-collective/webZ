import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {THREADS,summarizeHistory,actionReceipt,printableInvitation} from '../public/board/memory.mjs';
const UUIDS=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
 '33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444',
 '55555555-5555-4555-8555-555555555555'];
const pub=(i,kind='question',thread='grocery',status='PUBLIC_REVIEWED',text='Could we identify the next smallest food-access experiment?')=>({
 id:UUIDS[i],thread,kind,status,text,createdAt:'2026-10-24T10:00:00Z',
 publishedAt:'2026-10-25T16:00:00Z'
});
test('the memory engine never converts starter questions into community evidence',()=>{
 const all=summarizeHistory([],{allPagesRead:true});
 assert.equal(all.length,6);
 for(const s of all){
  assert.ok(THREADS[s.thread]);
  assert.equal(s.reviewedCount,0);
  assert.equal(s.anchor,null);
  assert.equal(s.latestReviewed,null);
  assert.equal(s.next.source,'EDITORIAL_STARTER_NOT_COMMUNITY_EVIDENCE');
  assert.equal(s.next.status,'PROPOSED_ONLY_NO_ACTION_CONFIRMED');
  assert.equal(s.humanPermissionRequired,true);
 }
});
test('only reviewed posts enter actionable memory; missing, private and withdrawn text never become a quote',()=>{
 const candidate=pub(0,'offer');
 const submitted={...pub(1,'proposal'),status:'PENDING',text:'Secret pending offer which must not be displayed'};
 const withdrawn={...pub(2,'return','grocery','WITHDRAWN'),text:'Deleted personal story'};
 const invalid={...pub(3,'concern'),id:'not-a-real-id'};
 const [grocery]=summarizeHistory([submitted,withdrawn,candidate,invalid],{scope:'grocery'});
 assert.equal(grocery.reviewedCount,1);
 assert.equal(grocery.withdrawnCount,1);
 assert.equal(grocery.kindCounts.offer,1);
 assert.equal(grocery.latestReviewed.id,candidate.id);
 assert.equal(grocery.anchor.id,candidate.id);
 assert.equal(grocery.next.source,'REVIEWED_POST_NOT_VERIFIED');
 const data=JSON.stringify(grocery);
 assert.doesNotMatch(data,/Secret pending offer|Deleted personal story|not-a-real-id/);
 assert.match(grocery.next.text,/not treat.*commitment/i);
});
test('critical voices are actionable without treating them as obstructions',()=>{
 const concern=pub(0,'concern','care','PUBLIC_REVIEWED','This plan might miss the volunteers who cannot attend evening meetings.');
 const question=pub(1,'question','care','PUBLIC_REVIEWED','What is the most useful next contact to verify this question?');
 const [c]=summarizeHistory([question,concern],{scope:'care',allPagesRead:false});
 assert.equal(c.kindCounts.concern,1);
 assert.equal(c.next.headline,'Test the objection');
 assert.equal(c.anchor.id,concern.id);
 assert.equal(c.coverage,'LATEST_REVIEWED_PAGE_ONLY');
});
test('anonymous returned reports are self-reports, not independently verified completion',()=>{
 const [s]=summarizeHistory([pub(0,'return','park')],{scope:'park'});
 assert.match(s.next.text,/Self-reports do not verify outcomes/);
 const receipt=actionReceipt(s,'https://abundent.org/board/',{now:new Date('2026-10-25T17:00:00Z')});
 assert.equal(receipt.source.kind,'REVIEWED_POST_NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(receipt.source.id,UUIDS[0]);
 assert.equal(receipt.workCompleted,'NOT_ESTABLISHED');
 assert.equal(receipt.communityCommitment,'NONE');
 assert.equal(receipt.publication,'NOT_SUBMITTED');
 assert.ok(printableInvitation(receipt).includes('NOT VERIFIED'));
});
test('source packets link back to review host and canonical location without personal details',()=>{
 const [s]=summarizeHistory([pub(0)],{scope:'grocery'});
 const a=actionReceipt(s,'https://abundent.org/board/#v=1&topic=grocery');
 assert.equal(new URL(a.threadUrl).pathname,'/board/');
 const b=actionReceipt(s,'https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/workboard-preview');
 assert.equal(new URL(b.threadUrl).pathname,'/functions/v1/workboard-preview');
 assert.match(b.threadUrl,/#v=1&topic=grocery/);
 assert.throws(()=>actionReceipt(s,'http://example.org/board/'));
});
test('malformed, unreviewed or spoofed items are dropped without exceptions',()=>{
 const bad={...pub(1),status:'UNKNOWN'};
 const garbage={...pub(2),thread:'other'};
 const {reviewedCount}=summarizeHistory([bad,garbage,pub(0),pub(0)],{scope:'grocery'})[0];
 assert.equal(reviewedCount,1);
 assert.throws(()=>summarizeHistory('bad'));
 assert.throws(()=>summarizeHistory([],{scope:'alien'}));
 assert.throws(()=>summarizeHistory(Array.from({length:201},()=>pub(0))));
});
test('UI integrates with reviewed-only history, is accessible, and does not silently write or track',()=>{
 const html=readFileSync(new URL('../public/board/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/board/memory-ui.mjs',import.meta.url),'utf8');
 const history=readFileSync(new URL('../public/board/history.mjs',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../scripts/build-workboard-edge-preview.mjs',import.meta.url),'utf8');
 for(const id of ['actionable-memory','memory-title','memory-cards','memory-status','memory-coverage'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('src="/board/memory-ui.mjs"'));
 assert.match(ui,/workboard-reviewed-history/);
 assert.match(history,/reviewedOnly!==true/);
 assert.match(history,/workboard-reviewed-history/);
 assert.match(builder,/memory-ui\.mjs/);
 assert.match(builder,/memory\.mjs/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|innerHTML\s*=/);
 assert.match(ui,/printableInvitation/);
 assert.match(ui,/memory-status/);
});
