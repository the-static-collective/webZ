import test from 'node:test';
import assert from 'node:assert/strict';
import {compose,receipt} from '../experiments/harmony-grove-001/engine.mjs';
import {wrapGift,inspectGift} from '../experiments/harmony-grove-001/gift.mjs';
import {DIALS,normalizeDials,composeCrossing,inspectCrossing,wrapCrossing} from '../experiments/harmony-grove-001/crossing/contract.mjs';
const origin=async (authority='SELF_DECLARED',permission='REMIX_ALLOWED')=>{
 const seed=compose({title:'The cracked radio',fragment:'A dial clicks in the cold.',authority});
 return wrapGift({seed,receipt:await receipt(seed)},{creator:'First maker',permission});
};
const config=(suffix='The antenna catches a signal it missed.')=>({title:'A stranger arrives',contribution:suffix,dials:Object.fromEntries(DIALS.map(x=>[x.key,5]))});
test('11 independent controls are present, bounded and default to 5',()=>{
 assert.equal(DIALS.length,11);assert.equal(new Set(DIALS.map(v=>v.key)).size,11);
 assert.deepEqual(Object.values(normalizeDials()),Array(11).fill(5));
 assert.throws(()=>normalizeDials({chance:11}),/INVALID_DIAL_CHANCE/);
 assert.throws(()=>normalizeDials({weather:4.3}),/INVALID_DIAL_WEATHER/);
});
test('a remixable gift becomes a new identifiable, replayable local descendant',async()=>{
 const gift=await origin(),c=await composeCrossing(gift,config());
 const inspected=await inspectCrossing(c);
 assert.equal(inspected.seed.lineage.parentGiftSha256,gift.checksum.value);
 assert.equal(inspected.seed.origin.fragment,config().contribution);
 assert.equal(inspected.seed.creativeRack.profile,'webz/eleven-creative-controls/v0');
 assert.equal(c.body.signed,false);assert.equal(c.body.receiverAdmitted,false);assert.equal(c.body.published,false);
 assert.equal(inspected.seed.panels.length,3);
 assert.equal((await inspectCrossing(await composeCrossing(gift,config()))).hash,c.integrity.hash);
});
test('each of 11 controls changes a meaningful panel direction or seed hash',async()=>{
 const gift=await origin(),base=await composeCrossing(gift,config());
 for(const dial of DIALS){
  const x=config();x.dials[dial.key]=10;
  const altered=await composeCrossing(gift,x);
  assert.notEqual(altered.body.child.receipt.seedSha256,base.body.child.receipt.seedSha256,dial.key);
  assert.notDeepEqual(altered.body.child.seed.panels,base.body.child.seed.panels,dial.key);
 }
});
test('view-only and unknown rights cannot be converted to a derivative',async()=>{
 const view=await origin('DEMO','VIEW_ONLY'),unknown=await origin('UNKNOWN','VIEW_ONLY'),valid=await origin();
 await assert.rejects(()=>composeCrossing(view,config()),/REMIX_NOT_INVITED/);
 await assert.rejects(()=>composeCrossing(unknown,config()),/REMIX_NOT_INVITED/);
 await assert.rejects(()=>composeCrossing(valid,{...config(),contribution:'  '}),/CONTRIBUTION_REQUIRED/);
});
test('tampering with source gift, creative instructions, output or receipt fails closed',async()=>{
 const c=await composeCrossing(await origin(),config());
 for(const change of [
  x=>x.body.input.contribution='silently rewritten',
  x=>x.body.sourceGift.gift.message='forged',
  x=>x.body.child.seed.panels[1].caption='not really contributed',
  x=>x.integrity.hash='sha256:'+'a'.repeat(64)
 ]){const bad=structuredClone(c);change(bad);await assert.rejects(()=>inspectCrossing(bad));}
});
test('even rehashed forged child cannot claim a different transformation',async()=>{
 const c=await composeCrossing(await origin(),config());
 c.body.child.seed.panels[0].direction='fabricated rendering';
 c.body.child.receipt=await receipt(c.body.child.seed);
 const {checksum}=await import('../experiments/harmony-grove-001/gift.mjs');
 c.integrity.hash=await checksum(c.body);
 await assert.rejects(()=>inspectCrossing(c),/CREATIVE_REPLAY_MISMATCH/);
});
test('descendant can be re-gifted, re-imported and composed again without parent erasure',async()=>{
 const root=await origin(),c=await composeCrossing(root,config());
 const out=await wrapCrossing(c,{creator:'Second maker',message:'Another way through',permission:'REMIX_ALLOWED'});
 const checked=await inspectGift(out.gift);
 assert.equal(checked.giftSha256,out.gift.checksum.value);
 assert.equal(out.gift.gift.parentGiftSha256,root.checksum.value);
 const d=await composeCrossing(out.gift,config('A third visitor notices the chipped cup.'));
 const inspected=await inspectCrossing(d);
 assert.equal(inspected.seed.lineage.parentGiftSha256,out.gift.checksum.value);
 assert.deepEqual(inspected.seed.lineage.ancestors,[root.checksum.value,out.gift.checksum.value]);
 assert.equal(inspected.seed.origin.fragment,'A third visitor notices the chipped cup.');
});
test('crossing source cannot silently acquire authority by changing claimed status',async()=>{
 const c=await composeCrossing(await origin(),config());
 c.body.receiverAdmitted=true;
 await assert.rejects(()=>inspectCrossing(c),/INVALID_CROSSING_STATE/);
});
