import test from 'node:test';import assert from 'node:assert/strict';
import {selectDecisionsForQuestion} from '../src/review-decisions.mjs';
test('only topic-relevant source review decisions attach to a public question',()=>{
 const decisions={status:'READ',total:2,ledgerSha256:'sha256:test',latest:[
  {candidateId:'DIFF-'+'A'.repeat(20),disposition:'HOLD'},
  {candidateId:'DIFF-'+'B'.repeat(20),disposition:'NEEDS_EVIDENCE'}]};
 const cut=selectDecisionsForQuestion(decisions,{selected:[{id:'DIFF-'+'A'.repeat(20)}]});
 assert.equal(cut.selected.length,1);assert.equal(cut.selected[0].disposition,'HOLD');
 assert.match(cut.disclosure,/does not verify/);
});
test('unavailable journal never invents a decision',()=>{
 const cut=selectDecisionsForQuestion({status:'HOLD',latest:[{candidateId:'A'}]}, {selected:[{id:'A'}]});
 assert.deepEqual(cut.selected,[]);
});
