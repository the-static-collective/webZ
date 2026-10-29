import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HARMONY_CATALOG as C} from '../bridge/harmony/catalog.mjs';
import {composeDoor,indexDoors} from '../bridge/harmony/model.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('catalog is machine-readable, complete and in sync with Git JSON',()=>{
 assert.deepEqual(JSON.parse(read('bridge/harmony/manifest-v1.json')),C);
 assert.equal(C.schema,'abundent.harmony-catalog/v1');
 assert.equal(indexDoors().length,8);
 assert.equal(new Set(C.profiles.map(p=>p.id)).size,8);
});
test('each proposed doorway has one usable start plus independent adjacent tools',()=>{
 for(const p of C.profiles){
  const d=composeDoor(p.id);
  assert.equal(d.classification,'PROPOSAL_ONLY');
  assert.equal(d.affiliation,'NOT_VERIFIED');
  assert.equal(d.networkAction,'NONE');
  assert.equal(d.fieldOutcome,'NOT_VERIFIED');
  assert.equal(d.stewardDecision,'NOT_REQUESTED');
  assert.ok(d.firstInstrument.href.startsWith('..'));
  assert.ok(d.neighboringInstruments.length>=3);
  assert.ok(d.localDecisionGates.length>=2);
  for(const t of [d.firstInstrument,...d.neighboringInstruments]){
   const url=new URL(t.href,'https://example.test/bridge/harmony/');
   assert.equal(url.origin,'https://example.test');
  }
 }
});
test('operator question is limited and never reclassifies a consent claim',()=>{
 assert.throws(()=>composeDoor('unknown'),RangeError);
 assert.throws(()=>composeDoor('food','x'.repeat(281)),RangeError);
 const x=composeDoor('care','A public-safe question?');
 assert.equal(x.openingQuestion,'A public-safe question?');
 assert.equal(x.questionOrigin,'OPERATOR_ENTERED_UNVERIFIED');
 assert.equal(composeDoor('care').questionOrigin,'PUBLIC_DEMO_TEMPLATE');
 assert.ok(C.invariants.includes('CULTURE_NOT_CONQUEST'));
 assert.ok(C.invariants.includes('EXIT_WITHOUT_PENALTY'));
});
test('static shell does not transmit confidential data or depend on Vercel',()=>{
 const html=read('bridge/harmony/index.html'),app=read('bridge/harmony/app.mjs');
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
 assert.doesNotMatch(read('bridge/harmony/manifest-v1.json'),/drive\.google\.com|docs\.google\.com/);
 assert.ok(read('apps/build.mjs').includes("cpSync(join(root,'../bridge'),join(out,'bridge'),{recursive:true});"));
 assert.ok(read('apps/index.html').includes('./bridge/harmony/'));
 assert.ok(read('bridge/index.html').includes('./harmony/'));
});
