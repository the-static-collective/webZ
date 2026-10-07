import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const P=await import('../app/proof.mjs').catch(()=>({}));
const sample=JSON.parse(await readFile(new URL('../evidence/public-simulation.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(sample);
test('real donor signatures replay with missing paired custody visible and Rack locked',async()=>{
 assert.equal(typeof P.observe,'function');const r=await P.observe(sample);
 assert.equal(r.verified_crossings,4);assert.equal(r.verified_receipts,9);assert.equal(r.paired_nonself_histories,0);
 assert.equal(r.rack_locked,true);assert.equal(r.transport,'UNOBSERVED');assert.equal(r.exact_source_bytes,'UNOBSERVED');
 assert.equal(r.live_two_host,'NOT_EARNED');assert.deepEqual(r.unresolved,[]);
 assert.deepEqual(await P.observe(clone()),r);
});
test('source and destination custody are checked independently without granting LIVE',async()=>{
 assert.equal(typeof P.observe,'function');const r=clone();const t=structuredClone(r.traces[2]);t.node_id='mx13:02-gate';t.host_id='pantry-gate';r.traces.push(t);
 const observed=await P.observe(r);assert.equal(observed.paired_nonself_histories,1);assert.equal(observed.rack_locked,true);
 const wrong=clone();wrong.traces.push(structuredClone(wrong.traces[2]));assert.equal((await P.observe(wrong)).paired_nonself_histories,0);
 const corrupt=clone();corrupt.traces[2].host_id='pantry-gate';await assert.rejects(()=>P.observe(corrupt));
});
test('changed source, wrong parent, receipt tamper, key substitution and conflicting return reject',async()=>{
 assert.equal(typeof P.observe,'function');
 for(const mutate of [r=>r.traces[0].signed_crossing.source_particular='sha256:'+'0'.repeat(64),r=>r.traces[3].signed_crossing.parents=['invented'],r=>r.traces[2].signed_disposition.note='tampered',r=>r.fingerprints['mx13:01-witness']='sha256:'+'0'.repeat(64),r=>{const t=structuredClone(r.traces[2]);t.signed_disposition=null;r.traces.push(t);}]){
  const r=clone();mutate(r);await assert.rejects(()=>P.observe(r));
 }
 const missing=clone();missing.traces[3].signed_disposition=null;assert.equal((await P.observe(missing)).unresolved.length,1);
});
test('strict sanitization rejects authority flags, private material, bearer data and oversized imports',async()=>{
 assert.equal(typeof P.observe,'function');
 for(const mutate of [r=>r.claims={live_two_host:true},r=>r.traces[0].signed_crossing.signing.public_key.d='secret',r=>r.scope='Bearer secret',r=>r.traces[0].signed_crossing.extensions={token:'secret'},r=>r.scope='https://host/?cap=secret']){
  const r=clone();mutate(r);await assert.rejects(()=>P.observe(r));
 }await assert.rejects(()=>P.observe(' '.repeat(524289)));
});
