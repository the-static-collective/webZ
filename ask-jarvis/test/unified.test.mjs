import test from 'node:test';
import assert from 'node:assert/strict';
import {assemble} from '../src/worker.mjs';
import {verifyReturn} from '../public/evidence.mjs';

const inspected=async()=>new Response('# Public project notes\nPossible tools are experimental and require permission.');
const staged={schema:'jarvis/graft-feed-v1',status:'READ',state:'STAGED_FOR_REVIEW',
  selected:[{id:'GRAFT-DEMO',status:'DOCUMENTED_PROPOSAL',
    publication:'PUBLIC_SUMMARY_PROPOSED_FOR_REVIEW',
    summary:'Documented research makes a printable idea card possible.',
    firstCheck:'Who could review an unsigned draft?',
    sourceUrl:'https://github.com/the-static-collective/GRAFT/blob/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/docs/DEMO.md'}]};

test('joined question answers with Commons, GRAFT, north-star and hashed receipt',async()=>{
 const v=await assemble('Can the Waseca grocery group print an offer card tomorrow?',inspected,{kind:'plan',graft:staged});
 assert.equal(v.schema,'ask-jarvis/return-v0');
 assert.equal(v.graft.state,'STAGED_FOR_REVIEW');
 assert.equal(v.commons.schema,'jarvis/public-commons-v1');
 assert.equal(v.synthesis.schema,'ask-jarvis/synthesis-v1');
 assert.equal(v.synthesis.verifiedProjectReads,3);
 assert.ok(v.synthesis.related.length>0);
 assert.match(v.guidance,/First check|inspected/i);
 assert.equal(v.context.grounding,'EDITORIAL_DIRECTION_NOT_LOCAL_EVIDENCE');
 assert.equal(v.workbenchRequest.dispatch,'MANUAL_EXPORT_ONLY');
 assert.equal(await verifyReturn(v),true);
 const tampered=structuredClone(v);
 tampered.synthesis.firstMove='Changed without receipt';
 assert.equal(await verifyReturn(tampered),false);
});

test('triad remains available after adding public context',async()=>{
 const v=await assemble('Could a local grocery have a willing steward?',inspected,{lens:'triad',graft:staged});
 assert.ok(v.triad?.alex);
 assert.ok(v.triad?.rdi);
 assert.ok(v.triad?.loadout);
 assert.equal(await verifyReturn(v),true);
});

test('independent question does not inherit an unsupported community match',async()=>{
 const v=await assemble('Why did ancient astronomers study comets?',inspected,{graft:staged});
 assert.equal(v.context.relation,'INDEPENDENT_QUESTION');
 assert.deepEqual(v.synthesis.related,[]);
 assert.deepEqual(v.synthesis.graft,[]);
 assert.match(v.guidance,/independent question/i);
 assert.equal(await verifyReturn(v),true);
});
