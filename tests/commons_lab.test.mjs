import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENARIOS,newRehearsal,advance,nextAction,runHappyPath,exportRehearsal,LAB_MODE} from '../commons-lab/engine.mjs';

test('run a whole scripted exchange through the actual invitation contract',()=>{
 for(const id of ['fish','guitar','bike']){
   const s=runHappyPath(id);
   assert.equal(s.stage,'COMPLETE_SIM');
   assert.equal(s.offer.authority,'SELF_DECLARED_UNVERIFIED');
   assert.equal(s.need.authority,'SELF_DECLARED_UNVERIFIED');
   assert.equal(s.response.delivery,false);
   assert.equal(s.response.unverified,true);
   assert.deepEqual(s.reports.map(r=>r.actor),['SIM_ACTOR_A','SIM_ACTOR_B']);
   assert.equal(s.method.status,'PROPOSAL_ONLY');
   assert.equal(s.method.source,'FICTIONAL_TEST');
   assert.equal(s.effects.realParticipants,0);
   assert.equal(s.effects.realMatches,0);
   assert.equal(s.effects.realDeliveries,0);
   assert.equal(s.effects.signed,false);
   assert.equal(s.effects.published,false);
   assert.equal(s.effects.creditsIssued,0);
 }
});
test('far-away synthetic counterpart cannot be silently matched',()=>{
 const s=advance(newRehearsal('far_ride'),'probe');
 assert.equal(s.stage,'NO_MATCH_SIM');assert.equal(nextAction(s),null);
 assert.throws(()=>advance(s,'accept'),/ended/);
});
test('decline is terminal and does not masquerade as success',()=>{
 const s=advance(advance(newRehearsal('fish'),'probe'),'decline');
 assert.equal(s.stage,'DECLINED_SIM');assert.equal(s.response,null);
 assert.equal(s.method,null);assert.throws(()=>advance(s,'handoff'),/ended/);
});
test('expiry blocks both late matching and a late handoff',()=>{
 const expired=advance(newRehearsal('fish'),'elapse',60);
 assert.equal(expired.stage,'EXPIRED_SIM');
 const ready=advance(newRehearsal('fish'),'probe');
 assert.equal(advance(ready,'elapse',61).stage,'EXPIRED_SIM');
 const accepted=advance(ready,'accept');
 assert.equal(advance(accepted,'elapse',61).stage,'EXPIRED_SIM');
});
test('reports are ordered and never independently verified',()=>{
 let s=newRehearsal('fish');
 assert.throws(()=>advance(s,'reportB'),/not permitted/);
 for(const a of ['probe','accept','handoff'])s=advance(s,a);
 assert.throws(()=>advance(s,'reportB'),/not permitted/);
 s=advance(s,'reportA');
 assert.equal(s.method,null);
 s=advance(s,'reportB');
 assert.equal(s.stage,'COMPLETE_SIM');
 assert(s.reports.every(r=>r.verification==='SIMULATED_UNVERIFIED'));
 assert.throws(()=>advance(s,'reportB'),/ended/);
});
test('export deliberately carries no real-world evidence claims',()=>{
 const exported=exportRehearsal(runHappyPath('fish'));
 assert.equal(exported.mode,LAB_MODE);
 assert.equal(exported.evidenceLevel,'NONE_REAL_WORLD');
 assert.match(exported.warning,/FICTIONAL/);
 assert.equal(exported.record.effects.networkCalls,0);
 assert.throws(()=>exportRehearsal({...newRehearsal(),mode:'LIVE'}),/synthetic/);
 assert.throws(()=>advance({...newRehearsal(),effects:{realParticipants:1,published:false,signed:false}},'probe'),/supported simulation/i);
});
test('browser UI has zero networking and labels fiction in both content and download',()=>{
 const page=readFileSync(new URL('../commons-lab/index.html',import.meta.url),'utf8');
 const client=readFileSync(new URL('../commons-lab/app.mjs',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../commons-lab/engine.mjs',import.meta.url),'utf8');
 assert.match(page,/connect-src 'none'/);
 assert.match(page,/Entirely synthetic/);
 assert.match(page,/No other people required/i);
 assert.match(page,/REAL-WORLD EFFECTS: ZERO/);
 assert.doesNotMatch(client,/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
 assert.match(client,/replaceChildren/);
 assert.match(client,/textContent/);
 assert.match(client,/FICTIONAL-/);
 assert.doesNotMatch(engine,/\bfetch\s*\(|supabase|localStorage|sessionStorage/i);
 assert(SCENARIOS.length>=4);
});
