import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inspectRelay} from '../app/relay-proof.mjs';
const file=process.env.RELAY_FIXTURE;
const fixture=file ? JSON.parse(await readFile(file,'utf8')) : null;
test('rejects unknown fields and over-limit input',async()=>{
 await assert.rejects(()=>inspectRelay({}),/INVALID_FIELDS/);
 await assert.rejects(()=>inspectRelay(' '.repeat(524289)),/REPORT_LIMIT/);
});
test('native signed reLATTE RECEIVE and HOLD observed without admission',{skip:!fixture},async()=>{
 const o=await inspectRelay(fixture);
 assert.equal(o.result,'SIGNED_HOLD_OBSERVED');assert.equal(o.disposition,'HOLD');
 assert.equal(o.admitted,false);assert.equal(o.published,false);
 assert.equal(o.signatures.crossing,true);assert.equal(o.signatures.receive,true);
 assert.equal(o.signatures.hold,true);
 assert.equal(o.donor_bytes,'NOT_PRESENT_IN_THIS_REPORT');
 assert.equal(o.original_audio_bytes,'UNOBSERVED');
});
test('rejects changed signatures, transport, provenance, and private keys',{skip:!fixture},async()=>{
 const mutations=[
  o=>o.crossing.signing.signature='A'.repeat(86),
  o=>o.receive_receipt.kind='R3_ADMIT',
  o=>o.disposition_receipt.note='modified',
  o=>o.transport_frame.body+=' ',
  o=>o.crossing.source_history_head='sha256:'+'0'.repeat(64),
  o=>o.receiver_snapshot.admitted.push(o.crossing.crossing_id),
  o=>o.crossing.signing.public_key.d='SECRET',
  o=>o.crossing.payload_refs.pop(),
  o=>o.disposition_receipt.semantic_effect='publish',
 ];
 for(const [i,mutate] of mutations.entries()){const o=structuredClone(fixture);mutate(o);await assert.rejects(()=>inspectRelay(o),'mutation '+i);}
});
