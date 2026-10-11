import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifyArrival,holdObservation} from '../arrivals/verify.mjs';
const fixture=JSON.parse(await readFile(new URL('../arrivals/lemonpress-catalog-001.json',import.meta.url),'utf8'));
const mutate=fn=>{const b=structuredClone(fixture);fn(b);return b;};
test('real LemonPRESS blob crosses with verifiable experimental reLATTE envelope',async()=>{
  const r=await verifyArrival(fixture);
  assert.equal(r.verified,true);
  assert.equal(r.source_sha256,fixture.source.sha256);
  assert.equal(r.crossing_id,fixture.crossing.crossing_id);
  assert.equal(r.authority,'EXPERIMENT_KEY_ONLY');
  assert.equal(r.owner_signature,'NOT_PRESENT');
  assert.equal(r.delivery,'NOT_ATTEMPTED');
  assert.equal(r.receipt,'NOT_ISSUED');
});
test('same verified source and crossing survives exact export / independent import',async()=>{
  const a=await verifyArrival(fixture),b=await verifyArrival(JSON.stringify(fixture));
  assert.deepEqual(a,b);
});
test('optical content changes, Git-blob provenance changes and metadata rebinds fail',async()=>{
  for(const b of [
    mutate(b=>{b.source.content=b.source.content.replace('admitted','proposed');}),
    mutate(b=>{b.source.git_blob='0'.repeat(40);}),
    mutate(b=>{b.crossing.extensions.source.commit='1'.repeat(40);}),
    mutate(b=>{b.crossing.payload_refs[0].address='sha256:'+'0'.repeat(64);}),
    mutate(b=>{b.crossing.audience_policy.destination='world:elsewhere';})
  ])await assert.rejects(verifyArrival(b));
});
test('signature, crossing ID and experiment key substitutions fail',async()=>{
  for(const b of [
    mutate(b=>{b.crossing.signing.signature='A'.repeat(86);}),
    mutate(b=>{b.crossing.crossing_id='relatte-crossing-v0:'+'0'.repeat(64);}),
    mutate(b=>{b.crossing.signing.public_key.x='A'.repeat(43);})
  ])await assert.rejects(verifyArrival(b));
});
test('unsigned local HOLD is not a reLATTE receipt and cannot be forged by unverified input',async()=>{
  assert.throws(()=>holdObservation({verified:false,destination:'world:gro-local-review'}));
  const h=holdObservation(await verifyArrival(fixture));
  assert.equal(h.decision,'HOLD');
  assert.equal(h.authority,'browser-local-observation-only');
  assert.equal(h.relatte_receipt_issued,false);
  assert.equal(h.no_delivery_claim,true);
  assert.equal(h.crossing_id,fixture.crossing.crossing_id);
});
test('oversized or unrelated carriers are refused',async()=>{
  await assert.rejects(verifyArrival(' '.repeat(32769)),/LIMIT/);
  await assert.rejects(verifyArrival({schema:'anything'}));
  await assert.rejects(verifyArrival(mutate(b=>{b.source_owner_signed=true;})));
});
test('arrivals stay review-allowlisted and do not silently enter immutable worker cache',async()=>{
  const release=await readFile(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');
  const sw=await readFile(new URL('../scripts/render-field.mjs',import.meta.url),'utf8');
  for(const p of ['arrivals/','arrivals/gro/','arrivals/verify.mjs','arrivals/ui.mjs','arrivals/lemonpress-catalog-001.json'])
    assert.ok(release.includes(p),'missing static release: '+p);
  assert.ok(!sw.includes('arrivals/'),'new routes must not alter immutable shell cache without a separate cache gate');
});
