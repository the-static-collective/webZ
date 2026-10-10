import test from 'node:test';
import assert from 'node:assert/strict';
import {compose,normalize,receipt,exportPacket} from '../experiments/harmony-grove-001/engine.mjs';
test('demo is a three-panel local seed, not a delivery',()=>{
 const a=compose({title:'Found radio',fragment:'A broken antenna',authority:'DEMO',roughness:'9'});
 assert.equal(a.schema,'webz/harmony-grove-local-seed/v0');
 assert.deepEqual(a.panels.map(p=>p.beat),['ARRIVAL','ENCOUNTER','RETURN']);
 assert.equal(a.origin.sourceVerified,false);assert.equal(a.origin.authority,'DEMO');
 assert.match(a.panels[1].caption,/broken antenna/);
 assert.equal(JSON.stringify(a),JSON.stringify(compose({title:'Found radio',fragment:'A broken antenna',authority:'DEMO',roughness:'9'})));
});
test('unknown authority defaults to unknown; inputs are bounded and knobs clamped',()=>{
 const a=normalize({title:'x'.repeat(1000),fragment:' y '.repeat(200),authority:'ADMIN',weather:-3,distance:100,roughness:'nope'});
 assert.equal(a.title.length,84);assert.ok(a.fragment.length<=240);assert.equal(a.authority,'UNKNOWN');assert.deepEqual(a.dials,{weather:0,distance:10,roughness:5});
});
test('source changes produce different SHA-256 local receipt',async()=>{
 const a=compose({title:'Radio',fragment:'Source 1'}),b=compose({title:'Radio',fragment:'Source 2'});
 const ar=await receipt(a),br=await receipt(b);
 assert.match(ar.seedSha256,/^sha256:[0-9a-f]{64}$/);assert.notEqual(ar.seedSha256,br.seedSha256);
 assert.equal(ar.delivered,false);assert.equal(ar.admitted,false);assert.equal(ar.published,false);
 assert.equal(exportPacket(a,ar).seed.title,'Radio');
 assert.throws(()=>exportPacket(a,null),/RECEIPT_REQUIRED/);
});