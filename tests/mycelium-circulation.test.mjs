import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeDemoForest,buildGraph} from '../experiments/harmony-grove-001/forest/contract.mjs';
import {shortestWalk,composeGrounds} from '../experiments/harmony-grove-001/grounds/contract.mjs';
import {newNotebook,appendObservation,forkNotebook,inspectNotebook,projectMycelium,exportMycelium,inspectMyceliumFile} from '../experiments/harmony-grove-001/grounds/mycelium/contract.mjs';
const explanation='I encountered both works while considering how the old antenna might resonate.';
const setup=async()=>{const graph=buildGraph((await makeDemoForest()).forest);const a=graph.nodes.find(n=>n.title==='The blue plate'),b=graph.nodes.find(n=>n.title==='The room hears back');return {graph,a,b};};
async function observe(book,graph,id){
 for(const ev of [{type:'CONTACT',subject:id,note:explanation},{type:'ATTENTION',subject:id,note:explanation},{type:'DECODER',subject:id,note:explanation,decoder:'Reading the two stories together'},{type:'STANCE',subject:id,stance:'OPEN',note:explanation}])book=await appendObservation(book,ev,graph);
 return book;
}
async function seed(g,a,b){let book=newNotebook('The local tester');book=await observe(book,g,a.id);book=await observe(book,g,b.id);return book;}
const proposal=async(book,g,a,b,kind,note)=>appendObservation(book,{type:'ASSOCIATION',a:a.id,b:b.id,kind,note},g);

test('a work may be deliberately revisited repeatedly; contact is not overwritten',async()=>{
 const {graph,a,b}=await setup();let book=await observe(newNotebook(),graph,a.id);const old=book.events[0].id;
 book=await appendObservation(book,{type:'REVISIT',subject:a.id,note:explanation},graph);
 book=await appendObservation(book,{type:'REVISIT',subject:a.id,note:'I saw an entirely different detail in the very same work.'},graph);
 assert.equal(book.events[0].id,old);assert.equal((await inspectNotebook(book)).state.contacts.get(a.id).revisits,2);
 assert.equal(book.events.at(-1).type,'REVISIT');
 await assert.rejects(appendObservation(newNotebook(),{type:'REVISIT',subject:b.id,note:explanation},graph),/CONTACT_BEFORE_REVISIT_REQUIRED/);
});

test('two distinct interpretations of a pair coexist without amplifying geometry or making votes',async()=>{
 const {graph,a,b}=await setup();let book=await seed(graph,a,b);
 book=await proposal(book,graph,a,b,'RESONANCE',explanation);const x=book.events.at(-1).footpath.id;
 book=await appendObservation(book,{type:'ACTIVATION',target:x,note:explanation},graph);
 book=await proposal(book,graph,a,b,'CONTRAST','One repairs a radio while the other listens from another room.');const y=book.events.at(-1).footpath.id;
 book=await appendObservation(book,{type:'ACTIVATION',target:y,note:explanation},graph);
 const {state}=await inspectNotebook(book);assert.notEqual(x,y);assert.equal(state.associations.size,2);
 const map=await projectMycelium(graph,book);assert.equal(map.active.length,1);assert.equal(map.parallel.length,1);
 assert.equal(map.grounds.edges.filter(e=>e.kind==='PROPOSED_STEWARDSHIP').length,1);
 const g=composeGrounds(graph,[map.active[0]]);assert.deepEqual([...map.grounds.positions],[...g.positions]);
 assert.equal(shortestWalk(map.grounds,a.id,b.id).length-1,1);
});

test('the same full-byte proposal cannot be slipped in twice',async()=>{
 const {graph,a,b}=await setup();let book=await seed(graph,a,b);book=await proposal(book,graph,a,b,'RESONANCE',explanation);
 await assert.rejects(proposal(book,graph,a,b,'RESONANCE',explanation),/ASSOCIATION_ALREADY_PRESENT/);
});

test('an old observer cut forks into independent future histories without rewriting ancestors',async()=>{
 const {graph,a,b}=await setup();const trunk=await seed(graph,a,b);const oldTip=trunk.events.at(-1).id;
 const fork=await forkNotebook(trunk,'I want to follow a different possible reading of the radio.');
 assert.equal(trunk.events.length,8);assert.equal(fork.events.length,9);assert.equal(fork.events.at(-1).type,'FORK');
 assert.equal(fork.events.at(-1).target,oldTip);assert.equal(fork.events[7].id,oldTip);
 const sibling=await forkNotebook(trunk,'I want to follow a second route without losing the first.');
 assert.notEqual(sibling.events.at(-1).id,fork.events.at(-1).id);
 const next=await proposal(fork,graph,a,b,'RESONANCE',explanation);
 assert.equal(next.events.length,10);assert.equal(trunk.events.length,8);assert.equal(sibling.events.length,9);
 assert.equal((await inspectNotebook(next)).state.associations.size,1);
});

test('empty notebooks cannot pretend there is an earlier cut to fork',async()=>{
 await assert.rejects(forkNotebook(newNotebook()),/NOTHING_TO_BRANCH_YET/);
});

test('resurfacing and opening are separately attributed cuts, not retroactive memory',async()=>{
 const {graph,a,b}=await setup();let book=await seed(graph,a,b);
 book=await proposal(book,graph,a,b,'RESONANCE',explanation);const id=book.events.at(-1).footpath.id,origin=book.events.at(-1).id;
 book=await appendObservation(book,{type:'RESURFACE',target:id,note:explanation},graph);
 assert.equal((await projectMycelium(graph,book)).active.length,0);
 book=await appendObservation(book,{type:'ACTIVATION',target:id,note:'I choose to open this now without changing the original trace.'},graph);
 assert.equal(book.events.find(e=>e.type==='ASSOCIATION').id,origin);
 assert.equal((await projectMycelium(graph,book)).active.length,1);
});

test('an observer may revise stance; a HOLD temporarily closes only the local route',async()=>{
 const {graph,a,b}=await setup();let book=await seed(graph,a,b);book=await proposal(book,graph,a,b,'RESONANCE',explanation);
 const id=book.events.at(-1).footpath.id;book=await appendObservation(book,{type:'ACTIVATION',target:id,note:explanation},graph);
 assert.equal((await projectMycelium(graph,book)).active.length,1);
 book=await appendObservation(book,{type:'STANCE',subject:a.id,stance:'HOLD',note:explanation},graph);
 assert.equal((await projectMycelium(graph,book)).active.length,0);
 book=await appendObservation(book,{type:'STANCE',subject:a.id,stance:'OPEN',note:'I am consciously open to this same route again.'},graph);
 assert.equal((await projectMycelium(graph,book)).active.length,1);
});

test('forked notebook carrier remains separately exportable and verifiable',async()=>{
 const {graph,a,b}=await setup();const original=await seed(graph,a,b);const branch=await forkNotebook(original,explanation);
 const [aFile,bFile]=await Promise.all([exportMycelium(original),exportMycelium(branch)]);
 assert.notEqual(aFile.integrity.value,bFile.integrity.value);
 assert.equal((await inspectMyceliumFile(aFile)).events.length,8);
 assert.equal((await inspectMyceliumFile(bFile)).events.length,9);
});

test('fictional public demo is explicitly local read-only without uploads or submissions',()=>{
 const base=new URL('../experiments/harmony-grove-001/grounds/mycelium/demo/',import.meta.url);
 const html=readFileSync(new URL('index.html',base),'utf8');
 const js=readFileSync(new URL('demo.mjs',base),'utf8');
 assert.match(html,/READ-ONLY PROPOSAL/);assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(js,/fetch\s*\(|localStorage|XMLHttpRequest|sendBeacon|navigator\.sendBeacon/);
 assert.doesNotMatch(html,/<input\b|<form\b/);
 assert.match(js,/Two distinct reasons can be recorded/);
});
