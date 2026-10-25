import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assemble} from '../src/worker.mjs';
import {investigate} from '../src/investigator.mjs';
import {buildRelayCapsule,makeRelayLink,readRelay} from '../public/relay.mjs';
import {makeHandoffLink,readHandoff} from '../public/cafe.mjs';
import {sha256} from '../public/evidence.mjs';

const q='Could our fictional town ask a willing park steward to review a food-access table experiment?';
const source=async()=>new Response('# One public project\nPublic source with reversible proposals and explicit human approval boundaries.');
const answer=JSON.stringify({
  summary:'Try one small food-access planning table and ask the site steward whether a voluntary conversation is feasible.',
  connections:[{idea:'Offer a public-safe question card for one willing organizer to review.',sourceIds:[]}],
  firstTest:'Bring one draft question to one willing site steward for a permission and feasibility review.',
  unknowns:['We do not know if any organizer is willing.','The venue requirements and safety review are unknown.'],
  consentCheck:'No host, participant or venue is committed to anything.'
});
async function fixture(){
 const parent=await assemble(q,source,{kind:'question'});
 const proposal=await investigate({question:q,kind:'question',
   assemble:(question,_,options)=>assemble(question,source,options),
   provider:async()=>({choices:[{message:{content:answer}}]})
 });
 return {parent,proposal};
}
test('question-only relay has no model result, while full investigation relay carries unsigned proposal',async()=>{
 const {parent,proposal}=await fixture();
 const questionOnly=makeHandoffLink('https://abundent.org/a/?secret=no',q,'question');
 const capsule=await buildRelayCapsule(parent,proposal);
 const url=makeRelayLink('https://abundent.org/ask?q=temporary#old',capsule);
 const received=await readRelay(new URL(url).hash);
 assert.deepEqual(readHandoff(new URL(questionOnly).hash),{question:q,kind:'question'});
 assert.equal(readHandoff(new URL(url).hash),null);
 assert.equal(new URL(url).pathname,'/relay/');
 assert.equal(new URL(url).search,'');
 assert.equal(received.payload.question,q);
 assert.equal(received.payload.stage,'MODEL_PROPOSAL');
 assert.equal(received.payload.kind,'question');
 assert.equal(received.payload.modelReceiptHash,proposal.receiptHash);
 assert.deepEqual(received.payload.connections,[JSON.parse(answer).connections[0].idea]);
 assert.deepEqual(received.payload.sourceReferences.map(x=>x.sha256),parent.sources.filter(x=>x.status==='INSPECTED').map(x=>x.sha256));
 assert.ok(!url.includes('secret=no'));
 assert.ok(url.length<10500);
});
test('truncated, tampered, duplicated and unverified relay links hold without source disclosure',async()=>{
 const {parent,proposal}=await fixture();
 const capsule=await buildRelayCapsule(parent,proposal);
 const url=makeRelayLink('https://abundent.org/',capsule);
 const hash=new URL(url).hash;
 assert.equal(await readRelay(hash.slice(0,-5)),null);
 assert.equal(await readRelay(hash.slice(0,-1)+'z'),null);
 assert.equal(await readRelay(hash+'&foo=bar'),null);
 assert.equal(await readRelay('#q='+encodeURIComponent(q)),null);
 assert.equal(await readRelay('#r=invalid'),null);
 assert.equal(await readRelay('#r='+'a'.repeat(11000)),null);
 const changed=structuredClone(proposal);changed.investigation.firstTest+=' forged';
 await assert.rejects(()=>buildRelayCapsule(parent,changed),/INVESTIGATION_NOT_OBSERVED/);
 const noSource=structuredClone(parent);noSource.sources=[];
 await assert.rejects(()=>buildRelayCapsule(noSource,proposal),/INVESTIGATION_NOT_OBSERVED/);
});
test('unsigned capsule checksum cannot establish model authenticity or human participation',async()=>{
 const {parent,proposal}=await fixture();
 const capsule=await buildRelayCapsule(parent,proposal);
 const changed=structuredClone(capsule);changed.payload.firstTest='Someone says the park granted permission.';
 assert.equal(await sha256(JSON.stringify(changed.payload))===changed.checksum,false);
 const link=makeRelayLink('https://abundent.org/',changed);
 assert.equal(await readRelay(new URL(link).hash),null);
 const unsigned=structuredClone(changed);
 unsigned.checksum=await sha256(JSON.stringify(unsigned.payload));
 const received=await readRelay(new URL(makeRelayLink('https://abundent.org/',unsigned)).hash);
 assert.equal(received.payload.firstTest,changed.payload.firstTest);
 assert.equal(received.payload.stage,'MODEL_PROPOSAL','a rehashed unsigned capsule still never becomes real-world proof');
});
test('recipient relay renders locally and makes no network requests or writes to storage',()=>{
 const html=readFileSync(new URL('../public/relay/index.html',import.meta.url),'utf8');
 const client=readFileSync(new URL('../public/relay/app.mjs',import.meta.url),'utf8');
 const sender=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
 for(const id of ['relay-status','relay-question','relay-summary','relay-first-test','relay-sources','ask-received'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(client.includes('readRelay(window.location.hash)'));
 assert.doesNotMatch(client,/\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b/);
 assert.ok(sender.includes('buildRelayCapsule(last,visProposal)'));
 assert.ok(sender.includes('vis-relay-approved'));
 assert.ok(sender.includes('verifyInvestigation(visProposal)'));
 assert.ok(html.includes('Origin and model execution are NOT authenticated.'));
});
