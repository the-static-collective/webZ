import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCHEMA,WHENS,RESPONSES,detectMode,inferLane,makeInvite,validateInvite,encodeInvite,decodeInvite,forkInvite,makeResponse,actionsFor} from '../invites/engine.mjs';
const ID_A='11111111-1111-4111-8111-111111111111';
const ID_B='22222222-2222-4222-8222-222222222222';
const ID_C='33333333-3333-4333-8333-333333333333';
test('anything can invite, without becoming an event or a signup',()=>{
 for(const [words,lane] of [
  ['I can play guitar for twenty minutes right now','creative'],
  ['I have extra vegetables for a neighbor','food'],
  ['Does anyone want to learn to repair a bike?','make'],
  ['Why is this neighborhood missing shade trees?','question'],
  ['I can sit and listen right now','open']
 ]) {
  const x=makeInvite({words,originId:ID_A});
  assert.equal(x.schema,SCHEMA);assert.equal(x.lane,lane);
  assert.equal(x.authority,'SELF_DECLARED_UNVERIFIED');
  assert.equal(x.execution,false);
  assert.equal(decodeInvite(encodeInvite(x)).words,words);
  assert.equal(actionsFor(x).length,6);
 }
});
test('NOW is promoted when explicit but never silently imposed',()=>{
 assert.equal(detectMode('I can play the guitar right now'),'now');
 assert.equal(detectMode('I have a computer'),'open');
 assert.equal(detectMode('Not now, perhaps next week'),'open');
 assert.equal(detectMode('I can deliver within an hour'),'now');
 assert.equal(detectMode('I will come soon'),'soon');
 assert.deepEqual(WHENS,['now','soon','open']);
});
test('links carry only self-declared visible words, not unseen people or contact data',()=>{
 assert.throws(()=>makeInvite({words:'Reach jane@example.com about a guitar',originId:ID_A}),/remove personal/i);
 assert.throws(()=>makeInvite({words:'Meet me at 123 Broad Street today',originId:ID_A}),/remove personal/i);
 assert.throws(()=>makeInvite({words:'help',originId:ID_A}),/8/);
 assert.throws(()=>makeInvite({words:'A public offer now',originId:'madeup'}),/identifier/);
 const x=makeInvite({words:'Can someone lend a folding chair?',originId:ID_A});
 assert.equal(x.parentId,null);assert.equal(x.rootId,ID_A);
 assert.throws(()=>validateInvite({...x,authority:'SIGNED'}),/Not an invitation/);
 assert.throws(()=>validateInvite({...x,execution:true}),/Not an invitation/);
 assert.throws(()=>decodeInvite('w#bad'),/Invalid/);
});
test('forks carry bounded, transparent ancestry without rewriting ancestors',()=>{
 const root=makeInvite({words:'I can play a twenty minute song tonight',originId:ID_A,when:'now'});
 const child=forkInvite(root,'I could run sound for this song soon',ID_B,'soon');
 const grandchild=forkInvite(child,'I could draw a poster for the sound session',ID_C,'open');
 assert.equal(child.rootId,ID_A);assert.equal(child.parentId,ID_A);
 assert.deepEqual(child.trail,[ID_A]);
 assert.deepEqual(grandchild.trail,[ID_A,ID_B]);
 assert.equal(decodeInvite(encodeInvite(grandchild)).parentId,ID_B);
 assert.equal(root.words,'I can play a twenty minute song tonight');
 assert.throws(()=>forkInvite(root,'I can help on Sunday at our table',ID_A,'soon'),/ancestry loops/);
 assert.throws(()=>validateInvite({...child,trail:[]}),/parent reference/);
});
test('all choices are valid; responses stay undelivered until people choose to share them',()=>{
 const root=makeInvite({words:'Who can help make a tiny library?',originId:ID_A});
 for(const choice of RESPONSES){
  const r=makeResponse(root,choice,choice==='decline'?'':'I can contribute a small step.',ID_B);
  assert.equal(r.delivery,false);
  assert.equal(r.unverified,true);
  assert.equal(r.invitationId,ID_A);
 }
 assert.throws(()=>makeResponse(root,'buy-advertising','I will take a step',ID_B),/Unsupported/);
});
test('the first screen and any action contain no backend posting or unseen analytics',()=>{
 const html=readFileSync(new URL('../invites/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../invites/app.mjs',import.meta.url),'utf8');
 assert.match(html,/id="invite-words"/);
 assert.match(html,/id="invite-actions"/);
 for(const k of ['act','offer','question','fork','pass','decline'])assert.ok(app.includes(k));
 assert.match(app,/history\.replaceState/);
 assert.match(app,/navigator\.share/);
 assert.doesNotMatch(app,/\bfetch\s*\(|localStorage|sessionStorage|XMLHttpRequest/);
 assert.match(html,/link-carried network/);
});
