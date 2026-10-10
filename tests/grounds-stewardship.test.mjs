import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemoForest,buildGraph,inspectArrivals} from '../experiments/harmony-grove-001/forest/contract.mjs';
import {composeGrounds,proposeFootpath,inspectFootpath,combineFootpaths,exportAttendance,inspectAttendance,shortestWalk} from '../experiments/harmony-grove-001/grounds/contract.mjs';

const setup=async()=>buildGraph((await makeDemoForest()).forest);
const pick=graph=>({root:graph.nodes.find(n=>n.title==='The radio beneath the orchard'),
 left:graph.nodes.find(n=>n.title==='The blue plate'),
 right:graph.nodes.find(n=>n.title==='The room hears back'),
 grandchild:graph.nodes.find(n=>n.title==='A repaired antenna')});
const claim=async(graph,a,b,kind='RESONANCE')=>proposeFootpath(graph,{a:a.id,b:b.id,kind,note:'Two makers noticed the same crooked antenna, from different angles.',keeper:'A wandering steward'});

test('particulars stay actual inspected artifacts; no phantom terrain or publication',async()=>{
 const graph=await setup(),grounds=composeGrounds(graph);
 assert.equal(grounds.sites.length,4);assert.equal(grounds.edges.length,3);
 assert.ok(grounds.sites.every(n=>n.landmark==='PAPER_PAVILION'&&n.publicationVerified===false));
 assert.equal(grounds.active.length,0);assert.equal(grounds.held.length,0);
});
test('deliberate attendance creates a navigable footpath that shortens a walk and draws sites nearer',async()=>{
 const graph=await setup(),{left,right}=pick(graph);
 const bare=composeGrounds(graph),before=shortestWalk(bare,left.id,right.id);
 assert.equal(before.length-1,2);
 const path=await claim(graph,left,right);
 const tended=composeGrounds(graph,[path]),after=shortestWalk(tended,left.id,right.id);
 assert.equal(after.length-1,1);assert.equal(after[1].via,'PROPOSED_STEWARDSHIP');
 const xBefore=Math.abs(bare.positions.get(left.id).x-bare.positions.get(right.id).x);
 const xAfter=Math.abs(tended.positions.get(left.id).x-tended.positions.get(right.id).x);
 assert.ok(xAfter<xBefore);assert.equal(tended.active.length,1);
 assert.equal(tended.positions.get(left.id).y,bare.positions.get(left.id).y);
 assert.equal(tended.positions.get(right.id).y,bare.positions.get(right.id).y);
});
test('attention, clicks and repeated proposals never create popularity weights or duplicate connections',async()=>{
 const graph=await setup(),{left,right}=pick(graph),p=await claim(graph,left,right);
 assert.equal((await combineFootpaths([],[p])).length,1);
 await assert.rejects(combineFootpaths([p],[p]),/DUPLICATE_PAIR_NOT_A_VOTE/);
 const q=await claim(graph,left,right,'CONTRAST');
 await assert.rejects(combineFootpaths([p],[q]),/DUPLICATE_PAIR_NOT_A_VOTE/);
});
test('lineage is not recast as stewardship and a proposal does not become a descendant',async()=>{
 const graph=await setup(),{root,left}=pick(graph);
 await assert.rejects(proposeFootpath(graph,{a:root.id,b:left.id,kind:'RESONANCE',note:'Look, the child follows the parent.'}),/LINEAGE_ALREADY_HAS_A_PATH/);
 const p=await claim(graph,pick(graph).left,pick(graph).right);
 const after=composeGrounds(graph,[p]);
 assert.equal(graph.index.get(pick(graph).right.id).parentId,root.id);
 assert.equal(after.edges.filter(e=>e.kind==='LOCAL_PARENT_MATCH').length,3);
 assert.equal(after.edges.filter(e=>e.kind==='PROPOSED_STEWARDSHIP').length,1);
});
test('VIEW_ONLY is still viewable alongside other works, but the local proposed path never confers remix',async()=>{
 const graph=await setup(),{left,right}=pick(graph);assert.equal(right.permission,'VIEW_ONLY');
 const p=await claim(graph,left,right);const g=composeGrounds(graph,[p]);
 assert.equal(g.sites.find(n=>n.id===right.id).permission,'VIEW_ONLY');
 assert.equal(g.edges.find(e=>e.kind==='PROPOSED_STEWARDSHIP').relation,'RESONANCE');
 assert.equal(p.permissionEffect,'NONE');assert.equal(p.admitted,false);assert.equal(p.published,false);
});
test('tampering with text, identity or permissions holds even if a map looks appealing',async()=>{
 const graph=await setup(),{left,right}=pick(graph),p=await claim(graph,left,right);
 assert.equal((await inspectFootpath(p)).id,p.id);
 const forged=structuredClone(p);forged.note='My upgraded relationship takes precedence.';
 await assert.rejects(inspectFootpath(forged),/FOOTPATH_CHECKSUM_MISMATCH/);
 const lied=structuredClone(p);lied.permissionEffect='REMIX';
 await assert.rejects(inspectFootpath(lied),/INVALID_FOOTPATH/);
});
test('deterministic projection and path ordering is independent of proposal order',async()=>{
 const graph=await setup(),{left,right,grandchild,root}=pick(graph);
 const p=await claim(graph,left,right),q=await claim(graph,root,grandchild,'QUESTION_BETWEEN');
 const a=composeGrounds(graph,[p,q]),b=composeGrounds(graph,[q,p]);
 assert.deepEqual([...a.positions],[...b.positions]);
 assert.deepEqual(shortestWalk(a,right.id,grandchild.id),shortestWalk(b,right.id,grandchild.id));
});
test('unseen address does not generate a phantom node or shortcut',async()=>{
 const graph=await setup(),{left,right}=pick(graph),p=await claim(graph,left,right);
 const remaining=[...graph.nodes].filter(x=>x.id!==right.id).map(n=>n.sourceBundle);
 const partial=buildGraph((await inspectArrivals(remaining)).forest);
 const g=composeGrounds(partial,[p]);
 assert.equal(g.active.length,0);assert.deepEqual(g.held.map(x=>x.reason),['ADDRESS_NOT_PRESENT']);
 assert.equal(g.sites.length,3);
});
test('detached stewardship notebook round trips; forged collection or duplicate pair refuses atomically',async()=>{
 const graph=await setup(),{left,right,root,grandchild}=pick(graph);
 const p=await claim(graph,left,right),q=await claim(graph,root,grandchild,'QUESTION_BETWEEN');
 const packet=await exportAttendance([p,q]);
 const inspected=await inspectAttendance(JSON.parse(JSON.stringify(packet)));
 assert.deepEqual(inspected.map(x=>x.id),[p.id,q.id].sort());
 const forgery=structuredClone(packet);forgery.body.paths[0].note='Contradictory changed note';
 await assert.rejects(inspectAttendance(forgery),/ATLAS_CHECKSUM_MISMATCH/);
 await assert.rejects(inspectAttendance(packet,[p]),/DUPLICATE_PAIR_NOT_A_VOTE/);
 assert.equal(packet.body.kind,'LOCAL_STEWARDSHIP_NOT_PUBLICATION');
});
test('a graph with unconnected works has no invented wayfinding route until explicitly tended',async()=>{
 const graph=await setup(),{left,right}=pick(graph);
 const isolatedForest=(await inspectArrivals([left.sourceBundle,right.sourceBundle])).forest;
 const isolatedGraph=buildGraph(isolatedForest);
 assert.equal(shortestWalk(composeGrounds(isolatedGraph),left.id,right.id),null);
 const p=await claim(isolatedGraph,left,right);
 assert.equal(shortestWalk(composeGrounds(isolatedGraph,[p]),left.id,right.id).length-1,1);
});
