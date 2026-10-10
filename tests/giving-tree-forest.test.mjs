import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemoForest,buildGraph,layoutForest,emptyForest,inspectArrivals,exportForest,inspectForest,MAX_GIFTS} from '../experiments/harmony-grove-001/forest/contract.mjs';
import {compose,receipt} from '../experiments/harmony-grove-001/engine.mjs';
import {inspectGift,wrapGift,composeReturn} from '../experiments/harmony-grove-001/gift.mjs';
const gift=async(title='Radio',permission='REMIX_ALLOWED')=>{
 const seed=compose({title,fragment:'A real fragment in a test.',authority:'DEMO'});
 return wrapGift({seed,receipt:await receipt(seed)},{creator:'Test author',permission});
};
const child=async(parent,alter)=>{
 const c=composeReturn(await inspectGift(parent),{title:'Another radio',fragment:'A new separate contribution.'});
 alter?.(c);
 return wrapGift({seed:c,receipt:await receipt(c)},{permission:'VIEW_ONLY'});
};
test('opt-in demo has distinct sibling branches and a grandchild with reconstructible parent bytes',async()=>{
 const result=await makeDemoForest(),graph=buildGraph(result.forest),layout=layoutForest(graph);
 assert.equal(result.added.length,4);assert.equal(graph.roots.length,1);assert.equal(graph.edges.length,3);assert.deepEqual(graph.warnings,[]);
 const root=graph.index.get(graph.roots[0]);assert.equal(root.children.length,2);assert.equal(root.originAuthority,'DEMO');
 assert.ok(graph.nodes.every(n=>n.approved===false&&n.signed===false&&n.sourceVerified===false));
 assert.equal(layout.positions.size,4);
 const grandchild=graph.nodes.find(n=>n.title==='A repaired antenna');assert.ok(layout.positions.get(grandchild.id).y>layout.positions.get(root.id).y);
});
test('deterministic order and layout regardless of import order; exact duplicates are idempotent',async()=>{
 const demo=await makeDemoForest(),arr=[...demo.forest.values()].map(x=>x.bundle);
 const x=await inspectArrivals(arr),y=await inspectArrivals([...arr].reverse());
 const a=buildGraph(x.forest),b=buildGraph(y.forest);
 assert.deepEqual(a.nodes.map(n=>n.id),b.nodes.map(n=>n.id));
 assert.deepEqual([...layoutForest(a).positions], [...layoutForest(b).positions]);
 assert.equal((await inspectArrivals(arr,x.forest)).added.length,0);
});
test('unobserved parent stays unresolved instead of being rendered as a connection',async()=>{
 const parent=await gift(),desc=await child(parent),{forest}=await inspectArrivals([desc]);const graph=buildGraph(forest);
 assert.equal(graph.edges.length,0);assert.equal(graph.roots.length,1);
 assert.equal(graph.nodes[0].parentStatus,'UNSEEN_PARENT');assert.match(graph.nodes[0].parentRef,/^sha256:/);
});
test('contradictory parent seed hash does not make a visible edge even if both gifts are supplied',async()=>{
 const parent=await gift();const desc=await child(parent,seed=>{seed.lineage.parentSeedSha256='sha256:'+'0'.repeat(64)});
 const graph=buildGraph((await inspectArrivals([parent,desc])).forest);
 assert.equal(graph.edges.length,0);assert.ok(graph.warnings.some(w=>w.reason==='PARENT_SEED_CONFLICT'));
});
test('a VIEW_ONLY parent cannot become an authorized local remix edge by a forged descendant claim',async()=>{
 const parent=await gift('Radio','VIEW_ONLY'); const fake=compose({title:'Made after view-only',fragment:'This claims a relationship.',authority:'SELF_DECLARED'});
 fake.lineage={parentGiftSha256:(await inspectGift(parent)).giftSha256,parentSeedSha256:(await inspectGift(parent)).seedSha256,ancestors:[],scope:'CLAIMED_PARENT_CHAIN',ancestryVerified:false,rightsVerified:false};
 const descendant=await wrapGift({seed:fake,receipt:await receipt(fake)},{permission:'VIEW_ONLY'});
 const graph=buildGraph((await inspectArrivals([parent,descendant])).forest);
 assert.equal(graph.edges.length,0);assert.ok(graph.warnings.some(w=>w.reason==='PARENT_REMIX_NOT_INVITED'));
});
test('invalid arrivals hold atomically without changing an earlier local forest',async()=>{
 const original=await gift(),valid=await gift('Second');const {forest}=await inspectArrivals([original]);
 const tampered=structuredClone(await gift('Bad'));tampered.gift.creator='forged';
 await assert.rejects(inspectArrivals([valid,tampered],forest));
 assert.equal(forest.size,1);
 await assert.rejects(inspectArrivals([valid,valid],forest),/DUPLICATE_IN_BATCH/);
 assert.equal(forest.size,1);
});
test('collection carries exact packets, verifies checksum and roundtrips without a server',async()=>{
 const {forest}=await makeDemoForest();const data=await exportForest(forest);
 assert.equal(data.body.schema,'webz/giving-tree-local-forest/v0');assert.equal(data.body.kind,'LOCAL_COLLECTION_NOT_PUBLICATION');
 const checked=await inspectForest(JSON.parse(JSON.stringify(data)));
 assert.equal(checked.forest.size,4);assert.deepEqual(buildGraph(checked.forest).edges,buildGraph(forest).edges);
 const broken=structuredClone(data);broken.body.gifts[0].gift.creator='changed';
 await assert.rejects(inspectForest(broken),/FOREST_CHECKSUM_MISMATCH/);
});
test('collection refuses reassembled checksum with duplicate gift packet',async()=>{
 const {forest}=await makeDemoForest(),data=await exportForest(forest);
 data.body.gifts[1]=data.body.gifts[0];
 // Even if an adversary recomputes the collection hash, in-batch duplicate refuses.
 const {checksum}=await import('../experiments/harmony-grove-001/gift.mjs');
 data.integrity.value=await checksum(data.body);
 await assert.rejects(inspectForest(data),/DUPLICATE_IN_BATCH/);
});
test('no synthetic public evidence: empty graph remains empty, capacity is bounded',async()=>{
 assert.deepEqual(buildGraph(emptyForest()).roots,[]);
 const orig=await gift();await assert.rejects(inspectArrivals(Array(MAX_GIFTS+1).fill(orig)),/INVALID_ARRIVALS/);
});
