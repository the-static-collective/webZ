import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemoForest,buildGraph} from '../experiments/harmony-grove-001/forest/contract.mjs';
import {shortestWalk,composeGrounds} from '../experiments/harmony-grove-001/grounds/contract.mjs';
import {newNotebook,appendObservation,inspectNotebook,projectMycelium,exportMycelium,inspectMyceliumFile} from '../experiments/harmony-grove-001/grounds/mycelium/contract.mjs';
const setup=async()=>{const graph=buildGraph((await makeDemoForest()).forest);const a=graph.nodes.find(n=>n.title==='The blue plate'),b=graph.nodes.find(n=>n.title==='The room hears back');return {graph,a,b};};
const explanation='These separate works seem to answer different parts of a recurring question.';
async function seed(graph,a,b,stance='OPEN'){
 let book=newNotebook('A fictional local observer');
 for(const subject of [a.id,b.id]){
  book=await appendObservation(book,{type:'CONTACT',subject,note:'I deliberately encountered this actual original parcel.'},graph);
  book=await appendObservation(book,{type:'ATTENTION',subject,note:explanation},graph);
  book=await appendObservation(book,{type:'DECODER',subject,decoder:'Through song and comics',note:explanation},graph);
  book=await appendObservation(book,{type:'STANCE',subject,stance,note:explanation},graph);
 }
 book=await appendObservation(book,{type:'ASSOCIATION',a:a.id,b:b.id,kind:'RESONANCE',note:explanation},graph);
 const assoc=book.events.at(-1).footpath.id;
 return {book,assoc};
}
test('available art is not recorded as contact or attention by importing it',async()=>{
 const {graph}=await setup(),book=newNotebook();const v=await projectMycelium(graph,book);
 assert.equal(v.contacts,0);assert.equal(v.events,0);assert.equal(v.active.length,0);assert.equal(v.grounds.sites.length,4);
});
test('UNDERSTORY receipts record six distinct families without MEMENTO canon',async()=>{
 const {graph,a,b}=await setup(),{book}=await seed(graph,a,b);
 assert.deepEqual(book.events.map(x=>x.type),['CONTACT','ATTENTION','DECODER','STANCE','CONTACT','ATTENTION','DECODER','STANCE','ASSOCIATION']);
 assert.equal(book.authority,'NO_MEMENTO_ADMISSION');assert.equal((await inspectNotebook(book)).state.associations.size,1);
 const view=await projectMycelium(graph,book);assert.equal(view.active.length,0);assert.equal(view.dormant.length,1);
});
test('a latent association does NOT shorten a path until explicit activation',async()=>{
 const {graph,a,b}=await setup();let {book,assoc}=await seed(graph,a,b);
 const before=shortestWalk((await projectMycelium(graph,book)).grounds,a.id,b.id);assert.equal(before.length-1,2);
 book=await appendObservation(book,{type:'ACTIVATION',target:assoc,note:'A later, explicit occurrence makes this association useful now.'},graph);
 const view=await projectMycelium(graph,book);assert.equal(view.active.length,1);
 assert.equal(shortestWalk(view.grounds,a.id,b.id).length-1,1);
 assert.equal(view.grounds.sites.find(s=>s.id===b.id).permission,'VIEW_ONLY');
});
test('REST makes a path dormant; RESURFACE preserves the old trace without opening it',async()=>{
 const {graph,a,b}=await setup();let {book,assoc}=await seed(graph,a,b);
 book=await appendObservation(book,{type:'ACTIVATION',target:assoc,note:explanation},graph);
 book=await appendObservation(book,{type:'REST',target:assoc,note:'Let this footpath sleep.'},graph);
 const old=book.events.find(x=>x.type==='ASSOCIATION').id;
 book=await appendObservation(book,{type:'RESURFACE',target:assoc,note:'I encountered another context and this old connection returned.'},graph);
 assert.equal(book.events.find(x=>x.type==='ASSOCIATION').id,old);
 let view=await projectMycelium(graph,book);assert.equal(view.active.length,0);assert.equal(view.dormant[0].resurfaced,1);
 book=await appendObservation(book,{type:'ACTIVATION',target:assoc,note:'I explicitly open the path for this new local journey.'},graph);
 view=await projectMycelium(graph,book);assert.equal(view.active.length,1);
});
test('HOLD and REFUSE are observer stances, never evidence of falsity nor shortcuts',async()=>{
 const {graph,a,b}=await setup();for(const stance of ['HOLD','REFUSE']){
  let {book,assoc}=await seed(graph,a,b,stance);
  await assert.rejects(appendObservation(book,{type:'ACTIVATION',target:assoc,note:explanation},graph),/EXPLICIT_OPEN_ACTIVATION_REQUIRED/);
  const view=await projectMycelium(graph,book);assert.equal(view.dormant[0].reason,'OBSERVER_STANCE_NOT_OPEN');
 }});
test('a missing original gift never turns into a phantom site even if the receipt is locally coherent',async()=>{
 const {graph,a,b}=await setup(),{book,assoc}=await seed(graph,a,b);
 const active=await appendObservation(book,{type:'ACTIVATION',target:assoc,note:explanation},graph);
 const partial={...graph,index:new Map([...graph.index].filter(([id])=>id!==b.id))};
 // Projection's own graph contract requires an actual consistent map: create it from original packets.
 const {inspectArrivals,buildGraph}=await import('../experiments/harmony-grove-001/forest/contract.mjs');
 const remaining=graph.nodes.filter(x=>x.id!==b.id).map(x=>x.sourceBundle);
 const truePartial=buildGraph((await inspectArrivals(remaining)).forest);
 const view=await projectMycelium(truePartial,active);
 assert.equal(view.active.length,0);assert.equal(view.dormant[0].reason,'MISSING_ORIGINAL_GIFT');assert.equal(view.grounds.sites.length,3);
});
test('unknown node cannot be a recorded contact and no association without attended originals',async()=>{
 const {graph,a,b}=await setup();let book=newNotebook();
 await assert.rejects(appendObservation(book,{type:'CONTACT',subject:'sha256:'+'9'.repeat(64),note:explanation},graph),/OBSERVED_GIFT_NOT_PRESENT/);
 await assert.rejects(appendObservation(book,{type:'ATTENTION',subject:a.id,note:explanation},graph),/CONTACT_BEFORE_ATTENTION_REQUIRED/);
 await assert.rejects(appendObservation(book,{type:'ASSOCIATION',a:a.id,b:b.id,kind:'RESONANCE',note:explanation},graph),/TWO_ATTENDED_PARTICULARS_REQUIRED/);
});
test('hash chain rejects edits and reordering, a valid checksum still proves no identity',async()=>{
 const {graph,a,b}=await setup(),{book}=await seed(graph,a,b);
 const tampered=structuredClone(book);tampered.events[2].decoder='Secretly rewrote the interpretation';
 await assert.rejects(inspectNotebook(tampered),/RESIDUE_HASH_MISMATCH/);
 const reordered=structuredClone(book);[reordered.events[0],reordered.events[1]]=[reordered.events[1],reordered.events[0]];
 await assert.rejects(inspectNotebook(reordered),/INVALID_RESIDUE_EVENT/);
 assert.equal((await inspectNotebook(book)).book.privacy,'OBSERVER_LOCAL_ONLY');
});
test('private carrier checksum round trips; tampering holds, not merges or publishes',async()=>{
 const {graph,a,b}=await setup(),{book}=await seed(graph,a,b);
 const carrier=await exportMycelium(book),copy=await inspectMyceliumFile(JSON.parse(JSON.stringify(carrier)));
 assert.equal(copy.events.length,9);assert.equal(carrier.body.kind,'PRIVATE_OBSERVER_RESIDUE_NOT_CANON');
 const bad=structuredClone(carrier);bad.body.notebook.observer='Different person';
 await assert.rejects(inspectMyceliumFile(bad),/MYCELIUM_FILE_HASH_MISMATCH/);
});
test('different observers do not accidentally merge into popularity or inferred consensus',async()=>{
 const {graph,a,b}=await setup();const x=await seed(graph,a,b);const y=newNotebook('A second observer');
 assert.equal((await projectMycelium(graph,x.book)).dormant.length,1);
 assert.equal((await projectMycelium(graph,y)).dormant.length,0);
 assert.equal((await projectMycelium(graph,y)).active.length,0);
});
