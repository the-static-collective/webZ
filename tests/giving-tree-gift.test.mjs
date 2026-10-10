import test from 'node:test';
import assert from 'node:assert/strict';
import {compose,receipt,exportPacket} from '../experiments/harmony-grove-001/engine.mjs';
import {wrapGift,inspectGift,composeReturn,packetForReturn} from '../experiments/harmony-grove-001/gift.mjs';

const make=async authority=>{const seed=compose({title:'Quiet radio',fragment:'Tin antenna in rain.',authority});return exportPacket(seed,await receipt(seed));};
test('two human turns preserve inspected immediate parent, bounded chain and local non-claims',async()=>{
 const given=await wrapGift(await make('DEMO'),{creator:'Lu',message:'Try a new ending',permission:'REMIX_ALLOWED'});
 const checked=await inspectGift(given);
 assert.equal(checked.canRemix,true);assert.equal(checked.integrity,'LOCAL_HASH_MATCH');assert.equal(checked.rightsVerified,false);
 const child=composeReturn(checked,{title:'Tin rain again',fragment:'Someone fixes the antenna with copper wire.'});
 assert.equal(child.lineage.parentGiftSha256,checked.giftSha256);
 assert.equal(child.lineage.parentSeedSha256,checked.seedSha256);
 assert.deepEqual(child.lineage.ancestors,[checked.giftSha256]);
 const returned=await wrapGift(await packetForReturn(child),{creator:'Second visitor',permission:'REMIX_ALLOWED'});
 const rechecked=await inspectGift(returned);
 assert.equal(rechecked.gift.parentGiftSha256,checked.giftSha256);
 assert.equal(rechecked.canRemix,true);
 assert.equal(rechecked.gift.delivered,false);assert.equal(rechecked.gift.signed,false);
});
test('tampered gift, seed and claimed authority are rejected, not promoted',async()=>{
 const given=await wrapGift(await make('SELF_DECLARED'),{permission:'REMIX_ALLOWED'});
 const changed=structuredClone(given);changed.gift.message='A different note';
 await assert.rejects(inspectGift(changed),/GIFT_CHECKSUM_MISMATCH/);
 const changedSeed=structuredClone(given);changedSeed.gift.seedPacket.seed.panels[0].caption='NOT THE SOURCE';
 await assert.rejects(inspectGift(changedSeed),/SEED_CHECKSUM_MISMATCH/);
 const mismatch=structuredClone(given);mismatch.gift.originAuthority='DEMO';
 await assert.rejects(inspectGift(mismatch),/AUTHORITY_MISMATCH/);
});
test('unknown provenance and view-only boundaries block remix',async()=>{
 await assert.rejects(wrapGift(await make('UNKNOWN'),{permission:'REMIX_ALLOWED'}),/UNKNOWN_RIGHTS/);
 const view=await inspectGift(await wrapGift(await make('DEMO'),{permission:'VIEW_ONLY'}));
 assert.equal(view.canRemix,false);
 assert.throws(()=>composeReturn(view,{fragment:'I can read but not remix'}),/REMIX_NOT_INVITED/);
 const unknown=await inspectGift(await wrapGift(await make('UNKNOWN'),{permission:'VIEW_ONLY'}));
 assert.equal(unknown.canRemix,false);
});
test('empty contribution and excessive claimed chain are held',async()=>{
 const checked=await inspectGift(await wrapGift(await make('DEMO'),{permission:'REMIX_ALLOWED'}));
 assert.throws(()=>composeReturn(checked,{fragment:'  '}),/CONTRIBUTION_REQUIRED/);
 const forged={...checked,gift:{...checked.gift,seedPacket:{...checked.gift.seedPacket,seed:{...checked.gift.seedPacket.seed,lineage:{ancestors:Array(7).fill(checked.giftSha256)}}}}};
 assert.throws(()=>composeReturn(forged,{fragment:'Another scene'}),/ANCESTRY_LIMIT/);
});
