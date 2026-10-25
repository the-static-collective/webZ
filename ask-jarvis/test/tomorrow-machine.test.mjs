import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHIPS,EXAMPLES,TRACK_IDS,validate,resources,buildBoard,invitationText,
 escapeHtml,printableHtml,localReceipt} from '../public/tomorrow-machine.mjs';

test('tomatoes and a printer produce a specific, human-gated mission',()=>{
 const board=buildBoard(EXAMPLES[0]);
 assert.equal(board.schema,'jarvis/tomorrow-machine-v1');
 assert.equal(board.status,'LOCAL_DRAFT_NOT_REAL_WORLD_EVIDENCE');
 assert.equal(board.serverCalls,0);
 assert.equal(board.contactSent,false);
 assert.equal(board.missions.length,3);
 assert.equal(board.missions[0].id,'produce');
 assert.equal(board.missions[0].title,'The Tomato Relay');
 assert.ok(board.resourceTags.includes('produce')&&board.resourceTags.includes('print'));
 assert.equal(board.missions[0].steps.length,3);
 assert.match(board.missions[0].steps[1].detail,/steward/i);
 assert.match(board.missions[0].caution,/food safety/i);
});
test('music, park care and computer loadouts match distinct useful experiments',()=>{
 assert.equal(buildBoard(EXAMPLES[1]).missions[0].id,'music');
 assert.equal(buildBoard(EXAMPLES[2]).missions[0].id,'steward');
 assert.equal(buildBoard(EXAMPLES[3]).missions[0].id,'invitation');
});
test('open questions do not become verified needs or implied commitments',()=>{
 const board=buildBoard({offer:'I have a weird talent involving paper sculptures.',time:'30'});
 assert.equal(board.missions.length,3);
 assert.equal(board.verifiedPartner,false);
 assert.equal(new Set(board.missions.map(m=>m.id)).size,3);
 assert.ok(TRACK_IDS.includes(board.missions[0].id));
});
test('private data, bad durations and malformed inputs fail before generating',()=>{
 for(const input of [
  {offer:'Short'},
  {offer:'My email is hello@example.com and I have tomatoes'},
  {offer:'Call me at 507-555-2345 about the garden'},
  {offer:'api_key: something_private_is_here'},
  {offer:'I can help with this\nsecond line'},
  {offer:'I have lots of resources',need:'Talk to me at info@example.org'},
  {offer:'I can help but this is a medical emergency'},
  {offer:'I have two hours',time:'9999'},
  {offer:'I have two hours',chips:['arbitrary']},
  {offer:'a'.repeat(361)}
 ]) {
  assert.equal(typeof validate(input),'string',JSON.stringify(input));
  assert.throws(()=>buildBoard(input),TypeError);
 }
});
test('text-only reasoning works without models or remote partner discovery',()=>{
 const board=buildBoard({offer:'I have a guitar and two hours of time.',
   need:'Could we offer some music?',time:'120'});
 assert.equal(board.missions[0].id,'music');
 assert.ok(resources({offer:'I have a laptop and printer',chips:[]}).includes('computer'));
 for(const m of board.missions){
  assert.equal(m.state,'UNCONFIRMED_PROPOSAL');
  assert.match(m.caution,/no |not |permission|approved|check/i);
 }
});
test('printable card encodes HTML, not an executable injection',()=>{
 const offer='<script>alert("hack")</script> I have tomatoes, a printer and time.';
 const board=buildBoard({offer,need:'Could neighbors try food sharing?',time:'120',chips:['produce']});
 const html=printableHtml(board,board.missions[0]);
 assert.ok(html.startsWith('<!doctype html>'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>alert('));
 assert.match(html,/PROPOSAL ONLY/);
 assert.equal(escapeHtml('&<>'),'&amp;&lt;&gt;');
});
test('invitation reflects resources and states proposals not approvals',()=>{
 const board=buildBoard(EXAMPLES[0]);
 const text=invitationText(board,board.missions[0]);
 assert.match(text,/extra tomatoes, a printer/);
 assert.match(text,/Voluntary review only/);
 assert.match(text,/No event, service, partnership/i);
});
test('local progress receipt does not pretend to verify activity',()=>{
 const board=buildBoard(EXAMPLES[0]);
 const receipt=localReceipt(board,board.missions[0],['inventory','return','fake']);
 assert.equal(receipt.status,'SELF_REPORTED_NOT_VERIFIED');
 assert.equal(receipt.storage,'DOWNLOAD_ONLY');
 assert.deepEqual(receipt.completed,['inventory','return']);
 assert.ok(receipt.notEvidenceOf.includes('consent'));
 assert.ok(receipt.notEvidenceOf.includes('verified_outcome'));
});
test('UI is offline-first, local-only and linked from the main JAR;VIS site',()=>{
 const ui=readFileSync(new URL('../public/tomorrow-ui.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/tomorrow.html',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../cloudflare-modal/worker.mjs',import.meta.url),'utf8');
 const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/\bfetch\s*\(|localStorage|sessionStorage|sendBeacon|XMLHttpRequest/);
 assert.doesNotMatch(ui,/\binnerHTML\s*=/);
 assert.match(html,/tomorrow-ui\.mjs/);
 assert.match(html,/No AI model, database, tracking, signup or backend request/);
 assert.match(home,/href="\/tomorrow\.html"/);
 assert.match(worker,/env.ASSETS/);
 assert.ok(CHIPS.length>=8);
});
