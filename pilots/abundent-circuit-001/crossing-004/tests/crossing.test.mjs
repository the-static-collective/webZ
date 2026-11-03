import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {compose, verifyDonors, verifyProof, REVIVAL_SHA, GHOT_SHA} from '../commons_circuit.mjs';

function canonical(v) {
  if (Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  if (v && typeof v === 'object') return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
function sha(v) {return crypto.createHash('sha256').update(canonical(v)).digest('hex');}
function input() {
  // Deliberately synthetic donor-shaped fixtures. Native donors are tested separately in CI.
  const witness = {locator:'Genesis 1:1', language:'he', text:'Fixture source only'};
  const projection = {kind:'linguistic-text', content:{text:'Synthetic illustrative reading',recipe_id:'reader-demo'}};
  const delta = {kind:'linguistic-projection',details:{notice:'TEST ONLY'}};
  const receipt = {
    kernel_version:'1', witness_sha256:sha(witness),
    projection_sha256:sha(projection), delta_sha256:sha(delta),transform_sha256:'a'.repeat(64)};
  const text=projection.content.text, output=sha({sha256:crypto.createHash('sha256').update(text).digest('hex')});
  return {
    schema:'abundent.revival.native-donors/v1',fictionalDemo:true,humanObservation:false,
    revival:{kind:'revival.native.projection/v1',repo:'the-static-collective/revival',
      commit:REVIVAL_SHA,specimenSha256:'b'.repeat(64),choice:'default',
      compiledText:text,attribution:'demo only',
      nativeResult:{witness,recipe:{id:'reader-demo'},profile:null,projection,delta,receipt}},
    ghotCommit:GHOT_SHA,ghot:{nativeGHoT:true,source:'GHoT/ghot/reference_node.py',transport:'loopback_only',
      receipt:{kind:'ghot.receipt',version:'0',capability:'system.hash',status:'ok',
        task_id:'task-test-1',receipt_id:'receipt-test-1',executor_node_id:'node-test-1',
        output:{sha256:crypto.createHash('sha256').update(text).digest('hex')},
        output_sha256:output}}};
}
const clone=x=>JSON.parse(JSON.stringify(x));

test('fictional complete circuit uses original Circuit core and preserves independent receiver',()=>{
  const o=compose(input());
  assert.equal(verifyProof(o),true);
  assert.equal(o.transport.dispositionOnArrival,'HOLD');
  assert.equal(o.transport.returned.decision,'ADMIT_FOR_REVIEW');
  assert.equal(o.localCopies.source.nodes[0].compute[0].actualGHoT,true);
  assert.equal(o.localCopies.destination.nodes[0].projects[0].state,'PROPOSED');
  assert.equal(o.localCopies.destination.nodes[0].projects[0].actor,null);
  assert.equal(o.localCopies.destination.nodes[0].projects[0].capability,null);
  assert.equal(o.localCopies.destination.nodes[0].compute.length,0);
  assert.equal(o.humanVerified,false);
  assert.equal(o.eventOccurred,false);
  assert.equal(o.nativeFullMeasureWrites,false);
  assert.equal(o.signedRelatte,false);
});

test('donor substitution and altered source text fail closed',()=>{
  const a=input(); a.revival.commit='f'.repeat(40);
  assert.throws(()=>verifyDonors(a),/pinned Revival/);
  const b=input(); b.revival.nativeResult.projection.content.text='edited reading';
  assert.throws(()=>verifyDonors(b),/bound/);
  const c=input(); c.revival.nativeResult.witness.text='altered';
  assert.throws(()=>verifyDonors(c),/receipt mismatch/);
  const d=input(); d.ghot.receipt.output.sha256='0'.repeat(64);
  assert.throws(()=>verifyDonors(d),/not bound/);
});

test('source choice must match declared profile; no silently preferred translation',()=>{
  const a=input();a.revival.choice='elohim';
  assert.throws(()=>verifyDonors(a),/profile mismatch/);
});

test('tampered receiving disposition, adopted Deed or permission is refused',()=>{
  for (const attack of [
    p=>{p.transport.crossing.permission='EXECUTE';},
    p=>{p.localCopies.destination.nodes[0].projects[0].state='CONFIRMED';},
    p=>{p.humanVerified=true;},
    p=>{p.nativeDonors.ghot.receipt.output.sha256='f'.repeat(64);}
  ]) {
    const p=clone(compose(input()));
    attack(p);
    assert.throws(()=>verifyProof(p),/Tampered|Unrecognized|changed|mismatch|not bound/);
  }
});

test('self-recomputed unsigned digest does not become a trusted signature',()=>{
  const o=compose(input());
  assert.equal(o.signedRelatte,false);
  assert.match(o.note,/HASH IS NOT SIGNATURE/);
  assert.match(o.sourceCartridge.witnessClass,/NOT verified identity/);
});
