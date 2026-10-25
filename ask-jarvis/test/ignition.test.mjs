import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {optionsFromGraph,makeIgnition,capacities} from '../public/ignite/engine.mjs';
import {makeTownPacket} from '../scripts/build-town-graph.mjs';
const bytes=readFileSync(new URL('../town/catalog.json',import.meta.url));
const graph=makeTownPacket(JSON.parse(bytes),bytes);
test('uses real native-validated Free Graph editorial nodes, never a made-up partner roster',()=>{
 const all=optionsFromGraph(graph);
 assert.equal(all.length,8);
 assert.ok(all.every(o=>o.status==='EDITORIAL_PROPOSAL'&&o.nodeId.startsWith('fgn:sha256:')));
 assert.ok(capacities.length>=6);
});
test('grocery question with print capacity yields real printable card and separate human approval gate',()=>{
 const r=makeIgnition({question:'How can a grocery organizer find one food access gap in Waseca?',capacity:'print',graph});
 assert.equal(r.option.id,'food-access');
 assert.equal(r.schema,'ask-jarvis/ignition-v1');
 assert.equal(r.status,'DRAFT_READY_NOT_EXECUTED');
 assert.equal(r.modelCalled,false);
 assert.equal(r.networkSubmission,false);
 assert.equal(r.authority,'NONE');
 assert.match(r.fieldSheet,/ONE USEFUL THING IN 24 HOURS/);
 assert.match(r.fieldSheet,/READY-TO-READ INVITATION/);
 assert.match(r.fieldSheet,/What actually happened: ______/);
 assert.match(r.permissionGate,/no claim/i);
 assert.ok(r.fieldSheet.length>400);
});
test('different passions and categories produce different immediate artifacts',()=>{
 const food=makeIgnition({question:'How could a community grocery pilot start?',optionId:'food-access',capacity:'research',graph});
 const arts=makeIgnition({question:'Could neighbors create an arts gathering?',optionId:'music-arts',capacity:'create',graph});
 const cleanup=makeIgnition({question:'How can we care for a local park?',optionId:'park-stewardship',capacity:'witness',graph});
 assert.notEqual(food.work.deliverable,arts.work.deliverable);
 assert.notEqual(arts.work.deliverable,cleanup.work.deliverable);
 assert.match(arts.work.next90Minutes,/creative/i);
 assert.match(cleanup.permissionGate,/site steward/i);
 assert.match(food.work.next90Minutes,/source/i);
});
test('no relevant seed is HOLD; the machine does not redirect unrelated inquiries to our projects',()=>{
 const r=makeIgnition({question:'Why did ancient astronomers study comets?',graph});
 assert.equal(r.status,'HOLD_NO_RELEVANT_SEED');
 assert.equal(r.effects,'NONE');
 assert.ok(!('fieldSheet' in r));
});
test('contact info, secrets and unsupported option or capability are refused',()=>{
 for(const question of ['Email me at joe@example.com about groceries','Call 507-555-1212 about food','My private key is this secret string','Meet me at 123 Oak Street for food']){
  assert.throws(()=>makeIgnition({question,graph}),/PRIVATE_CONTENT_REFUSED/);
 }
 assert.throws(()=>makeIgnition({question:'Please improve the food access',graph,optionId:'unknown'}),/UNKNOWN_SEED/);
 assert.throws(()=>makeIgnition({question:'Please improve the food access',graph,capacity:'superuser'}),/UNKNOWN_CAPABILITY/);
});
test('all eight public seeds can make an honest gated field kit with no third-party effect',()=>{
 for(const item of optionsFromGraph(graph)){
  const r=makeIgnition({question:item.question,optionId:item.id,capacity:'listen',graph});
  assert.equal(r.status,'DRAFT_READY_NOT_EXECUTED',item.id);
  assert.ok(r.permissionGate.length>30,item.id);
  assert.match(r.fieldSheet,/No private data is sent or stored/);
  assert.ok(r.adjacent.every(a=>a.relation==='PROPOSED_NOT_VERIFIED'));
 }
});
test('browser is a deliberately activated, account-free field-kit builder',()=>{
 const page=readFileSync(new URL('../public/ignite/index.html',import.meta.url),'utf8');
 const client=readFileSync(new URL('../public/ignite/app.mjs',import.meta.url),'utf8');
 const homepage=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 for(const id of ['ignite-form','seed','capacity','question','output','print','save'])assert.ok(page.includes('id="'+id+'"'));
 assert.ok(client.includes("fetch('/town/graph.json'"));
 assert.ok(client.includes('makeIgnition('));
 assert.ok(!client.includes('localStorage')&&!client.includes('sendBeacon'));
 assert.ok(homepage.includes('href="/ignite/"'));
});
