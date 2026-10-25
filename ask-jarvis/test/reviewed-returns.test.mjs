import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeTownPacket} from '../scripts/build-town-graph.mjs';
import {makeIgnition} from '../public/ignite/engine.mjs';
import {makeFieldReturn} from '../public/ignite/return.mjs';
import {makeReviewedReturnProjection} from '../scripts/build-reviewed-return-graph.mjs';
const src=readFileSync(new URL('../town/catalog.json',import.meta.url));
const graph=makeTownPacket(JSON.parse(src),src);
const fake=async()=>{
 const ignition=makeIgnition({question:'How could a willing organizer review a neighborhood grocery card?',optionId:'food-access',capacity:'print',graph});
 const r=await makeFieldReturn({ignition,graph,outcome:'DONE_SELF_REPORTED',
  privateNote:'Fictional test: no actual groceries or people involved.',observedAt:'2026-10-25T14:00:00Z'});
 return {schema:'abundent/reviewed-return-entry-v1',graph:r.candidateGraph,
  publication:{decision:'EDITORIAL_ANONYMOUS_CANDIDATE_APPROVED',humanReviewed:true,
   noPrivateDetailsChecked:true,publicSharingChosen:true,evidenceIndependentlyVerified:false,
   reviewedAt:'2026-10-25T15:00:00Z'}};
};
test('empty editorially admitted returns produces a valid source-linked packet but ZERO fake wins',async()=>{
 const r=await makeReviewedReturnProjection(graph,[]);
 assert.equal(r.summary.count,0);
 assert.equal(r.graph.extensions.verifiedCompletedWorkCount,0);
 assert.equal(r.graph.task_world_cut.status,'unresolved');
 assert.ok(r.graph.links.every(l=>l.authority==='none'));
 assert.ok(r.graph.nodes.every(n=>n.status!=='locally-adopted'));
});
test('manual editorial publication retains unverified status and proposed next question',async()=>{
 const r=await makeReviewedReturnProjection(graph,[await fake()]);
 assert.equal(r.summary.count,1);
 assert.equal(r.summary.entries[0].actualActionVerification,'NOT_VERIFIED');
 assert.equal(r.graph.extensions.verifiedCompletedWorkCount,0);
 assert.ok(r.graph.nodes.some(n=>n.extensions?.stage==='NEXT_INVITATION_CANDIDATE'));
 assert.ok(r.graph.links.every(l=>l.verb==='connects'&&l.authority==='none'));
 assert.ok(!JSON.stringify(r.graph).includes('Fictional test: no actual groceries'));
});
test('no public self-report accepted without separate intentional human gate',async()=>{
 const entry=await fake();
 for(const bad of [
  {...entry,publication:{...entry.publication,humanReviewed:false}},
  {...entry,publication:{...entry.publication,publicSharingChosen:false}},
  {...entry,publication:{...entry.publication,evidenceIndependentlyVerified:true}},
  {...entry,publication:{...entry.publication,decision:'AUTO_APPROVED'}}
 ])await assert.rejects(makeReviewedReturnProjection(graph,[bad]),/HUMAN_PUBLICATION_GATE_MISSING/);
});
test('tampered graph, different source or duplicate report is rejected',async()=>{
 const entry=await fake();
 const corrupt=structuredClone(entry);corrupt.graph.nodes.at(-1).label='Verified completed action';
 await assert.rejects(makeReviewedReturnProjection(graph,[corrupt]),/INVALID_CANDIDATE/);
 await assert.rejects(makeReviewedReturnProjection(graph,[entry,entry]),/DUPLICATE_RETURN_PACKET/);
 const wrong=structuredClone(entry);wrong.graph.extensions.originGraphPacketId='fgp:sha256:'+'0'.repeat(64);
 await assert.rejects(makeReviewedReturnProjection(graph,[wrong]),/INVALID_CANDIDATE/);
});
test('public Town UI references the bounded, non-proving return summary and the ignition desk',()=>{
 const page=readFileSync(new URL('../public/town/index.html',import.meta.url),'utf8');
 const client=readFileSync(new URL('../public/town/app.mjs',import.meta.url),'utf8');
 assert.ok(page.includes('id="returns-index"'));
 assert.ok(page.includes('href="/ignite/"'));
 assert.ok(client.includes("fetch('/town/returns.json'"));
 assert.ok(!client.includes('innerHTML'));
});
