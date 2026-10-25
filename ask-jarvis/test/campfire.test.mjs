import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CIRCLES,FIRES,OUTCOMES,chooseFire,validPurpose,makeFire,
makeFireLink,readFireLink,drawFirstMove,makeInvitation,makePersonalReceipt,makeTableQuestion}
 from '../public/campfire/model.mjs';

test('everyone chooses their place; nobody acquires official authority',()=>{
 assert.deepEqual(CIRCLES.map(x=>x.id),['curious','helper','starter','coordinator']);
 assert.equal(FIRES.length,5);
 for(const fire of FIRES)for(const circle of CIRCLES){
  const move=drawFirstMove(fire,circle.id);
  assert.equal(move.standing.authority,'NONE');
  assert.equal(move.standing.selfSelected,true);
  assert.equal(move.role.open,true);
  assert.equal(move.actions.length,3);
  assert.equal(move.dateWindowDays,7);
  assert.match(move.guardrails.join(' '),/Coalition/);
  assert.match(move.invitation,/silence is not consent/i);
 }
});
test('a food starter can act before any coordinator exists',()=>{
 const fire=chooseFire('garden'),move=drawFirstMove(fire,'starter');
 assert.match(move.first,/Draft a one-page question/i);
 assert.match(move.role.boundary,/Food handling/i);
 assert.match(makeInvitation(fire,'coordinator'),/up to two/i);
 assert.match(makeInvitation(fire,'coordinator',true),/pass it/i);
});
test('custom fires are public-topic-only and survive explicit fragment sharing',()=>{
 const question='Could neighbors create a tiny artist-led listening table?';
 const fire=makeFire({custom:true,purpose:question});
 const url=new URL(makeFireLink('https://abundent.org',fire));
 assert.equal(url.pathname,'/campfire/');
 assert.equal(url.search,'');
 assert.equal(readFireLink(url.hash).focus,question);
 for(const existing of FIRES){
  const loc=new URL(makeFireLink('https://abundent.org',existing));
  assert.equal(readFireLink(loc.hash).id,existing.id);
 }
 for(const fragment of ['#v=1&fire=bad','#v=1&fire=garden&x=extra',
   '#v=1&fire=garden&fire=music','#v=0&fire=garden',
   '#v=1&fire=custom&q=short']){
  assert.equal(readFireLink(fragment),null,fragment);
 }
 assert.equal(validPurpose('tiny'),false);
 assert.equal(validPurpose('a'.repeat(221)),false);
 assert.throws(()=>makeFireLink('http://not-secure.example',fire));
});
test('a refusal or withdrawal is a useful local self-report, not a failure or ranking',()=>{
 assert.ok(OUTCOMES.some(([x])=>x==='DECLINED'));
 assert.ok(OUTCOMES.some(([x])=>x==='PAUSED'));
 const fire=chooseFire('coalition');
 const when=new Date('2026-10-25T12:00:00Z');
 const out=makePersonalReceipt(fire,'curious',['prepare'],'PAUSED',when);
 assert.equal(out.status,'SELF_REPORTED_ONLY_NOT_VERIFIED');
 assert.equal(out.authority,'NONE');
 assert.equal(out.stored,'DOWNLOAD_ONLY');
 assert.equal(out.participantsVerified,0);
 assert.equal(out.contactSentBySite,false);
 assert.throws(()=>makePersonalReceipt(fire,'starter',['not-an-action']));
 assert.throws(()=>makePersonalReceipt(fire,'starter',[],'AUTHORITATIVE'));
});
test('every fire carries a public-safe question to the Seventh Table',()=>{
 for(const f of FIRES){
  assert.equal(validPurpose(makeTableQuestion(f)),true);
  assert.match(makeInvitation(f,'helper'),/not an event announcement/i);
 }
});
test('Campfire is a runnable client-only door integrated with JAR, roles and Tomorrow',()=>{
 const path='../public/';
 const page=readFileSync(new URL(path+'campfire/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL(path+'campfire/app.mjs',import.meta.url),'utf8');
 const tomorrow=readFileSync(new URL(path+'tomorrow-ui.mjs',import.meta.url),'utf8');
 const roles=readFileSync(new URL(path+'roles/app.mjs',import.meta.url),'utf8');
 const jar=readFileSync(new URL(path+'index.html',import.meta.url),'utf8');
 const unified=readFileSync(new URL(path+'unified.mjs',import.meta.url),'utf8');
 assert.match(page,/id="fires"/);
 assert.match(page,/id="circles"/);
 assert.match(page,/id="print-card"/);
 assert.match(page,/@media print/);
 assert.match(jar,/href="\/campfire\/"/);
 assert.match(unified,/campfire/);
 assert.match(roles,/makeFireLink/);
 assert.match(tomorrow,/handoff\.getAll/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|localStorage|sessionStorage|sendBeacon/);
 assert.doesNotMatch(ui,/\binnerHTML\s*=/);
 assert.match(ui,/navigator\.share/);
 assert.match(ui,/makeTableSeedLink/);
});
