import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeTownPacket} from '../scripts/build-town-graph.mjs';
import {makeIgnition} from '../public/ignite/engine.mjs';
import {makeFieldReturn,validateCandidate,outcomes} from '../public/ignite/return.mjs';
const raw=readFileSync(new URL('../town/catalog.json',import.meta.url));
const graph=makeTownPacket(JSON.parse(raw),raw);
function base(optionId='food-access'){
 return makeIgnition({question:'How can Waseca neighbors explore groceries or arts?',optionId,capacity:'print',graph});
}
const sample={graph,ignition:base(),outcome:'CORRECTED',privateNote:'A willing reviewer suggested clarifying one question.',observedAt:'2026-10-25T14:01:00.000Z'};
test('field report is private, graph exports content address and no raw note',async()=>{
 const r=await makeFieldReturn(sample);
 assert.equal(r.privateReceipt.status,'SELF_REPORTED_UNVERIFIED');
 assert.match(r.privateReceipt.privateNote,/willing reviewer/);
 assert.ok(await validateCandidate(r.candidateGraph));
 const rawJSON=JSON.stringify(r.candidateGraph);
 assert.ok(!rawJSON.includes('A willing reviewer'));
 assert.ok(!rawJSON.includes('Waseca neighbors explore'));
 assert.equal(r.candidateGraph.sources.filter(s=>s.access==='private').length,1);
 assert.equal(r.candidateGraph.extensions.mode,'UNVERIFIED_CANDIDATE_NOT_PUBLISHED');
 assert.equal(r.candidateGraph.task_world_cut.status,'unresolved');
 assert.ok(r.candidateGraph.links.every(x=>x.verb==='connects'&&x.authority==='none'));
 assert.ok(!r.candidateGraph.links.some(x=>x.verb==='constitutes'));
});
test('two identical reports have stable candidate IDs; tampering invalidates digest',async()=>{
 const a=await makeFieldReturn(sample),b=await makeFieldReturn(sample);
 assert.equal(a.candidateGraph.packet_id,b.candidateGraph.packet_id);
 const tampered=structuredClone(a.candidateGraph);
 tampered.nodes.at(-1).label='Proof of completed work';
 assert.equal(await validateCandidate(tampered),false);
});
test('no fabricated success regardless of outcome selection',async()=>{
 for(const outcome of outcomes){
  const r=await makeFieldReturn({...sample,outcome:outcome.id,privateNote:outcome.id==='NO_CONTACT'?'':'No service was promised to the reviewer.'});
  assert.ok(await validateCandidate(r.candidateGraph));
  assert.equal(r.candidateGraph.extensions.readablePublicFacts,false);
  assert.equal(r.candidateGraph.nodes[1].status,'unresolved');
  assert.match(JSON.stringify(r.candidateGraph),/SELF_REPORTED_UNVERIFIED/);
  assert.match(r.nextQuestion,/\?/);
 }
});
test('decline generates non-coercive next possibility, not a re-invitation to declined person',async()=>{
 const r=await makeFieldReturn({...sample,outcome:'DECLINED'});
 assert.match(r.nextQuestion,/without pressuring/);
 assert.ok(!r.candidateGraph.links.some(x=>x.verb==='constitutes'));
});
test('PII, unsupported claims and non-ignition sources are rejected',async()=>{
 for(const privateNote of ['Contact Joe at joe@example.org','Call 507-555-0100 for help','Meet at 123 Main Street','Visit https://example.org/now']){
  await assert.rejects(makeFieldReturn({...sample,privateNote}),/PRIVATE_OR_INVALID_FIELD_NOTE/);
 }
 await assert.rejects(makeFieldReturn({...sample,outcome:'PARTNER_ACCEPTED'}),/UNSUPPORTED_RETURN_OUTCOME/);
 await assert.rejects(makeFieldReturn({...sample,outcome:'REVIEWED',privateNote:'too short'}),/FIELD_NOTE_NEEDED/);
 await assert.rejects(makeFieldReturn({...sample,ignition:{status:'DONE'}}),/VALID_IGNITION_REQUIRED/);
});
test('browser return is activated manually, uses no hidden storage or automatic network write',()=>{
 const ui=readFileSync(new URL('../public/ignite/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/ignite/app.mjs',import.meta.url),'utf8');
 for(const id of ['field-return','return-outcome','return-note','record-return','return-save-private','return-save-graph','return-next'])assert.ok(ui.includes('id="'+id+'"'),id);
 assert.ok(js.includes('makeFieldReturn('));
 assert.ok(js.includes('validateCandidate('));
 assert.ok(!js.includes('localStorage')&&!js.includes('sendBeacon')&&!js.includes('/api/return'));
});
