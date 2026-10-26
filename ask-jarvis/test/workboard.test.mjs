import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OPPORTUNITIES,KINDS,getOpportunity,newOpportunity,publicSafeText,
 opportunityLink,readOpportunityLink,composeContribution,invitationText,campfireDoor,mapHandoff}
 from '../public/board/model.mjs';

test('every starter thread is editorial, not evidence of completion or a person enrolled',()=>{
 assert.ok(OPPORTUNITIES.length>=6);
 assert.equal(new Set(OPPORTUNITIES.map(x=>x.id)).size,OPPORTUNITIES.length);
 for(const t of OPPORTUNITIES){
  assert.match(t.source,/EDITORIAL|SECONDHAND/);
  assert.ok(t.known.length>30&&t.missing.length>30&&t.first.length>30&&t.gate.length>40);
  assert.match(invitationText(t),/silence is not consent/i);
  assert.match(invitationText(t),/up to two/i);
  assert.equal(getOpportunity(t.id),t);
  assert.equal(new URL(campfireDoor('https://abundent.org/board/',t)).pathname,'/campfire/');
 }
 assert.match(getOpportunity('milk').known,/unverified lead/i);
 assert.match(getOpportunity('church').gate,/never a condition/i);
});
test('deep links contain only a known topic ID or one validated public-safe question',()=>{
 for(const t of OPPORTUNITIES){
  const u=new URL(opportunityLink('https://abundent.org/other?email=secret#oops',t));
  assert.equal(u.pathname,'/board/');
  assert.equal(u.search,'');assert.equal(u.hash,'#v=1&topic='+t.id);
  assert.equal(readOpportunityLink(u.hash),t);
 }
 const custom=newOpportunity('Could we host a weekly repair question table?');
 const u=new URL(opportunityLink('https://abundent.org',custom));
 assert.equal(u.search,'');assert.equal(u.hash.includes('q='),true);
 assert.equal(readOpportunityLink(u.hash).question,custom.question);
 assert.equal(readOpportunityLink('#v=1&topic=milk&topic=church'),null);
 assert.equal(readOpportunityLink('#v=1&topic=milk&contact=bob'),null);
 assert.equal(readOpportunityLink('#v=1&topic=open&q=tiny'),null);
 assert.equal(readOpportunityLink('#v=0&topic=milk'),null);
 assert.throws(()=>opportunityLink('http://example.com',custom));
});
test('no private details travel through visitor posts or public invitation links',()=>{
 for(const s of ['call me at 507-555-1234','name@example.com','Meet at 123 Main Street',
 'https://somewhere.test/sensitive','This has an api_key: ABC'])assert.equal(publicSafeText(s),false,s);
 assert.equal(publicSafeText('Could neighbors explore a small food-growing experiment?'),true);
 assert.throws(()=>newOpportunity('Contact me at abc@example.com'));
 assert.throws(()=>newOpportunity('short'));
 assert.throws(()=>newOpportunity('a'.repeat(221)));
});
test('each contribution type is useful but remains an unsubmitted local draft',()=>{
 const topic=getOpportunity('care');
 for(const {id} of KINDS){
  const e=composeContribution(topic,id,'Could we test a small correction to the plan?',
    new Date('2026-10-25T12:00:00Z'));
  assert.equal(e.kind,id);assert.equal(e.status,'LOCAL_DRAFT_NOT_SUBMITTED');
  assert.equal(e.authority,'NONE');assert.equal(e.verified,false);
  assert.equal(e.participantCommitments,0);assert.equal(e.humanReviewRequired,true);
  assert.match(invitationText(topic,e),/drafted this/i);
  const next=mapHandoff(topic,id);assert.equal(next.publication,'NONE');
  assert.equal(next.requiresHumanConsent,true);assert.equal(next.outcome,'UNVERIFIED');
 }
 assert.match(composeContribution(topic,'concern','I think our scope is too broad.').next,/disagreement/i);
 assert.match(composeContribution(topic,'return','I asked once, and I heard no answer.').next,/self-report/i);
 assert.throws(()=>composeContribution(topic,'approved','A false claim of authority.'));
 assert.throws(()=>composeContribution(topic,'return','too short'));
});
test('the workboard is navigable, accessible and has no hidden network submission',()=>{
 const html=readFileSync(new URL('../public/board/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/board/app.mjs',import.meta.url),'utf8');
 for(const id of ['thread-list','topic-detail','compose','kind','draft','share','local-preview','status','new-question'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/@media print/);assert.match(html,/aria-live="polite"/);
 assert.match(app,/navigator\.share/);assert.match(app,/window\.print/);
 assert.doesNotMatch(app,/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|\binnerHTML\s*=/);
 assert.match(html,/not a live public discussion feed/i);
 assert.ok(html.includes('src="/board/app.mjs"'));
 const homepage=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const campfire=readFileSync(new URL('../public/campfire/index.html',import.meta.url),'utf8');
 assert.match(homepage,/href="\/board\/"/);
 assert.match(campfire,/href="\/board\/"/);
});

test('shared review panel has deliberate submission and withdrawal controls',()=>{
 const html=readFileSync(new URL('../public/board/index.html',import.meta.url),'utf8');
 const client=readFileSync(new URL('../public/board/history.mjs',import.meta.url),'utf8');
 const server=readFileSync(new URL('../database/supabase/functions/workboard-history/index.ts',import.meta.url),'utf8');
 for(const id of ['shared-history','history-entries','history-post','history-consent','history-receipt','history-withdraw'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('src="/board/history.mjs"'));
 assert.ok(client.includes("action:'submit'"));
 assert.ok(client.includes("action:'withdraw'"));
 assert.ok(client.includes('receipt.withdrawKey'));
 assert.ok(server.includes("status:'PENDING'"));
 assert.ok(server.includes('PUBLIC_REVIEWED'));
 assert.ok(server.includes('workboard_reserve'));
 assert.ok(!client.includes('localStorage'));
});
