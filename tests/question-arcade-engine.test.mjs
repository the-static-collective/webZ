import test from 'node:test';
import assert from 'node:assert/strict';
import {KINDS,makeSpecimen,predict,evaluate,rankOffers,NEEDS,OFFERS,canUnlockScout,canUnlockRouting,newState,cleanState,catchUpScouts,SCOUT_MS,buildHeldCrossing} from '../arcade/engine.mjs';
test('specimens repeat across independent sessions and rotate classes',()=>{
 assert.deepEqual(makeSpecimen(16),makeSpecimen(16));
 assert.deepEqual([0,1,2].map(i=>makeSpecimen(i).kind),KINDS.map(k=>k.id));
});
test('model uses actual examples and leaves unknowns unclassified',()=>{
 assert.equal(predict([],makeSpecimen(0).features),null);
 let one=makeSpecimen(0);assert.equal(predict([one],one.features).kind,one.kind);
});
test('held-out examples are distinct from examples used to train',()=>{
 const training=Array.from({length:15},(_,i)=>makeSpecimen(i,2027));
 assert.equal(evaluate(training).total,45);assert.ok(evaluate(training).accuracy>=70);
});
test('idle never manufactures labels or achievements',()=>{
 const state=newState(0);state.examples=Array.from({length:18},(_,i)=>makeSpecimen(i,2027));
 assert.equal(canUnlockScout(state.examples),true); assert.equal(canUnlockRouting(state.examples),true);
 const before=state.examples.length;
 let added=catchUpScouts(state,SCOUT_MS*5);
 assert.equal(added,5);assert.equal(state.queued.length,5);assert.equal(state.examples.length,before);
 assert.equal(state.points,0);
});
test('idle queue has a hard cap and no unbounded time gain',()=>{
 const state=newState(0);state.examples=Array.from({length:15},(_,i)=>makeSpecimen(i));
 catchUpScouts(state,SCOUT_MS*5000); assert.equal(state.queued.length,12);
});
test('route ranks visible tag overlap and cannot hold unrelated match',()=>{
 const ranked=rankOffers(NEEDS[0]);assert.equal(ranked[0].offer.id,'offer-farm');
 const state=newState();assert.throws(()=>buildHeldCrossing(state,NEEDS[0].id,'offer-music'));
 const packet=buildHeldCrossing(state,NEEDS[0].id,OFFERS[0].id,1000);
 assert.equal(packet.status,'HOLD');assert.equal(packet.origin,'SYNTHETIC_FIXTURES_ONLY');
 assert.equal(packet.permissions.transmission,false);assert.equal(packet.permissions.recipientConsent,false);
 assert.equal(packet.model.examplesIncluded,false);
});
test('corrupt saved state is refused and bounded',()=>{
 assert.equal(cleanState({version:9,examples:[]}).version,1);
 const state=cleanState({...newState(),examples:[{id:'unsafe',kind:'sunseed',features:{hue:500,shape:0,size:0}}]});
 assert.equal(state.examples.length,0);
});
