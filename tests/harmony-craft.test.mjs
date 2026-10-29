import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composeMatterIdeaCraft,verifyMatterIdeaCraft} from '../bridge/harmony/craft-economy.mjs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
test('GrO 42/39 matter encounter remains a disputed, non-spendable hypothetical',async()=>{
 const o=await composeMatterIdeaCraft();
 assert.equal(o.schema,'abundent.matter-idea-craft/v1');
 assert.equal(o.inputs[0].kind,'MATERIAL_LOT_CLAIM');
 assert.equal(o.inputs[0].disposition,'DISPUTED');
 assert.equal(o.inputs[0].recognizedSpendableUnits,0);
 assert.equal(o.proposedCrafts[0].proposedInput.count,4);
 assert.equal(o.proposedCrafts[0].physicalEffect,'NONE');
 assert.ok(o.proposedCrafts[0].proposedOutputs.every(c=>c.quantity==='UNKNOWN'));
 assert.equal(o.economicProjection.material.actualSpent,0);
 assert.equal(o.actualEffects.woodBurned,0);
 assert.equal(o.actualEffects.financialTokensMinted,0);
 assert.ok(await verifyMatterIdeaCraft(o));
});
test('an idea branches without being consumed, rights or value invented',async()=>{
 for(const medium of ['song','film','photo','panels','book','live','world']){
  const p=await composeMatterIdeaCraft({expression:medium,topic:'An ordinary neighborhood can make a shared room'});
  assert.equal(p.proposedCrafts[1].sourceIdeaNotConsumed,true);
  assert.equal(p.proposedCrafts[1].plannedAsset.exists,false);
  assert.equal(p.proposedCrafts[1].plannedAsset.license,'NOT_GRANTED');
  assert.equal(p.proposedCrafts[1].plannedAsset.price,null);
  assert.equal(p.options.length,7);
  assert.equal(p.lawfulCrossings.fullMeasure.deeds,0);
  assert.equal(p.lawfulCrossings.fullMeasure.capacity,0);
  assert.equal(p.economicProjection.penny.issued,0);
  assert.equal(p.economicProjection.cultural.licensedUses,0);
  assert.equal(p.lawfulCrossings.reLATTE.status,'NOT_SIGNED_NOT_TRANSMITTED');
  assert.equal(p.lawfulCrossings.steward,'NOT_AUTHORIZED');
  assert.ok(await verifyMatterIdeaCraft(p));
 }
});
test('content address is deterministic but never grants authority or certifies history',async()=>{
 const a=await composeMatterIdeaCraft({profileId:'campus'}),b=await composeMatterIdeaCraft({profileId:'campus'});
 assert.deepEqual(a,b);
 assert.match(a.previewId,/^sha256:[a-f0-9]{64}$/);
 const m=structuredClone(a);m.economicProjection.penny.issued=100;
 assert.equal(await verifyMatterIdeaCraft(m),false);
 const w=structuredClone(a);w.inputs[0].observedQuantity=42;
 assert.equal(await verifyMatterIdeaCraft(w),false);
 const x=await composeMatterIdeaCraft({claimedWood:42,observedWood:42});
 assert.equal(x.inputs[0].disposition,'UNVERIFIED_MATCH');
 assert.equal(x.inputs[0].recognizedSpendableUnits,0);
});
test('impossible resources and unauthorized fields fail closed',async()=>{
 for(const options of [{claimedWood:0},{claimedWood:42,proposedBurn:43},{observedWood:-1},
  {claimedWood:2.5},{claimedWood:10001},{expression:'mint-token'},
  {grantPermission:true},{topic:'x'.repeat(241)},{profileId:'nonexistent'}]){
  await assert.rejects(composeMatterIdeaCraft(options));
 }
});
test('browser craft and presentation remain local and source-linked',()=>{
 const html=read('bridge/harmony/craft.html'),ui=read('bridge/harmony/craft-app.mjs'),pitch=read('bridge/harmony/pitch.mjs');
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
 assert.ok(pitch.includes('./craft.html'));
 assert.ok(read('bridge/harmony/index.html').includes('./craft.html'));
 assert.ok(read('apps/index.html').includes('./bridge/harmony/craft.html'));
 assert.ok(html.includes('Fictional')||html.includes('FICTIONAL'));
});

test('CANNON source-pinned culture execution is exposed but never claimed as canon or field proof',()=>{
 const h=read('bridge/harmony/craft.html'),p=read('bridge/harmony/pitch.mjs'),d=read('docs/HARMONY-MATTER-IDEA-CRAFT-004.md');
 assert.ok(h.includes('CANNON/actions/runs/40866198913'));
 assert.ok(p.includes('CANNON/actions/runs/40866198913'));
 assert.ok(p.includes('unmerged CANNON branch'));
 assert.ok(d.includes('CANNON/pull/37'));
 assert.ok(d.includes('experimental unmerged'));
});

test('independent lemonPRESS native receiver passing evidence is included with no false release',()=>{
 const h=read('bridge/harmony/craft.html'),p=read('bridge/harmony/pitch.mjs'),d=read('docs/HARMONY-MATTER-IDEA-CRAFT-004.md');
 assert.ok(h.includes('CANNON/actions/runs/40867825635'));
 assert.ok(h.includes('lemonPRESS/pull/57'));
 assert.ok(p.includes('CANNON/actions/runs/40867825635'));
 assert.ok(p.includes('not publication'));
 assert.ok(d.includes('press-refused/'));
});

test('all source-owned culture-to-economic return claims link successful native evidence',()=>{
 const h=read('bridge/harmony/craft.html'),p=read('bridge/harmony/pitch.mjs');
 const d=read('docs/HARMONY-MATTER-IDEA-CRAFT-004.md');
 for(const run of ['40869577086','40870169565']){
  assert.ok(h.includes(run));assert.ok(p.includes(run));assert.ok(d.includes(run));
 }
 assert.ok(p.includes('No real authenticated participant'));
 assert.ok(d.includes('Authenticated real human Deeds remain 0'));
});

test('the verified culture reentry is shown with independent owner-review restrictions',()=>{
 const h=read('bridge/harmony/craft.html'),p=read('bridge/harmony/pitch.mjs');
 const d=read('docs/HARMONY-MATTER-IDEA-CRAFT-004.md');
 for(const s of [h,p,d])assert.ok(s.includes('40873374247'));
 assert.ok(p.includes('No issue update'));
 assert.ok(h.includes('remain open experimental branches'));
 assert.ok(d.includes('GRAFT does **not** create a Git branch'));
});
