import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeCapture,syntheticCapture,transmission,MAX_BYTES} from '../labs/skymirror/protocol.mjs';
import {inspectOpticalCandidate} from '../app/optical-observation.mjs';
const fixture=()=>decodeCapture(syntheticCapture('HI',{noise:7,frameMs:39,leadingMs:1400}),{chipMs:600});

test('provenance-pinned SKYMIRROR-002 camera decoder can produce a bounded observation', async()=>{
  const decoded=fixture();
  assert.equal(decoded.status,'VALID');
  const observation=await inspectOpticalCandidate(decoded);
  assert.equal(observation.schema,'webz/optical-observation/v0');
  assert.equal(observation.payload_byte_length,2);
  assert.match(observation.payload_sha256,/^sha256:[a-f0-9]{64}$/);
  assert.equal(observation.crossing_identity,'NOT_VERIFIED');
  assert.equal(observation.semantic_effect,'NONE');
  assert.equal(observation.authority,'NONE');
  assert.equal(observation.webz_voyage_event,false);
  assert.equal(observation.receiver_disposition,'NONE');
  assert.equal(observation.optical_capture_claim,'CAMERA_LUMINANCE');
  assert.ok(!JSON.stringify(observation).includes('"HI"')); // never copy received text into webZ
});

test('byte-for-byte same payload yields same observation fingerprint independent of brightness inversion',async()=>{
  const one=fixture();
  const other=decodeCapture(syntheticCapture('HI',{inverted:true,noise:2,leadingMs:1400}),{chipMs:600});
  assert.equal(other.status,'VALID');
  const a=await inspectOpticalCandidate(one),b=await inspectOpticalCandidate(other);
  assert.equal(a.payload_sha256,b.payload_sha256);
  assert.equal(a.payload_byte_length,b.payload_byte_length);
});

test('corruption and a self-declared alleged LIVE crossing cannot become webZ admission',async()=>{
  const c=fixture();
  await assert.rejects(()=>inspectOpticalCandidate({...c,payload:Uint8Array.from([80,82])}),/UNVERIFIED/);
  await assert.rejects(()=>inspectOpticalCandidate({...c,text:'spoofed'}),/UNVERIFIED/);
  await assert.rejects(()=>inspectOpticalCandidate({...c,authentication:'P256'}),/UNVERIFIED/);
  await assert.rejects(()=>inspectOpticalCandidate({...c,status:'NOT_VERIFIED'}),/UNVERIFIED/);
  await assert.rejects(()=>inspectOpticalCandidate({...c,framing:'webz/live-transport'}),/UNVERIFIED/);
  await assert.rejects(()=>inspectOpticalCandidate({...c,payload:Uint8Array.from(Array(MAX_BYTES+1).fill(65))}),/UNVERIFIED/);
});

test('weak light, incomplete frames and no signal remain outside the review gate',async()=>{
  for(const r of [
    decodeCapture(syntheticCapture('HI',{high:60,low:53}),{chipMs:600}),
    decodeCapture([],{chipMs:600}),
    {status:'CAPTURING'},
    {status:'VALID'},
  ])await assert.rejects(()=>inspectOpticalCandidate(r),/UNVERIFIED/);
});

test('optical protocol remains distinct from webZ sovereign voyage',async()=>{
  const model=await import('../app/model.mjs');
  const result=await inspectOpticalCandidate(fixture());
  const journal=model.empty();
  assert.deepEqual(model.project(journal).decisions,[]);
  assert.equal(model.project(journal).arrivals,0);
  assert.throws(()=>model.project({...journal,events:[result]}),/INVALID_EVENT|INVALID_FIELDS/);
  assert.ok(transmission('HI').chips.length>0);
});
