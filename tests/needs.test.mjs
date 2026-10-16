import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,open,pledge,accept,report,confirm,recommend,stage,helpSlip,demo,freeze,thaw,validate} from '../needs/model.mjs';
const make=(j,id,effort='small')=>open(j,{id,title:'Need '+id,requirement:'Do a practical useful task',effort,consent:true,createdAt:'2026-10-15T12:00:00Z'});
test('consent and secret filter',()=>{
 assert.throws(()=>open(empty(),{id:'need-123456'}),/REVIEW_REQUIRED/);
 assert.throws(()=>open(empty(),{id:'need-123456',title:'test',requirement:'password: abcd',effort:'small',createdAt:'2026-10-15T12:00:00Z',consent:true}),/NO_SECRETS/);
});
test('offer, acceptance, report and local confirmation remain distinct',()=>{
 let j=make(empty(),'need-123456');
 assert.equal(stage(j.needs[0]),'unmatched');
 j=pledge(j,'need-123456','offer-123456','I have one hour');assert.equal(stage(j.needs[0]),'pledge-available');
 assert.throws(()=>report(j,'need-123456','Done'),/REPORT_NOT_AVAILABLE/);
 j=accept(j,'need-123456','offer-123456');assert.equal(stage(j.needs[0]),'accepted');
 assert.throws(()=>accept(j,'need-123456','offer-123456'),/ACCEPT_NOT_AVAILABLE/);
 j=report(j,'need-123456','I ran a test');assert.equal(stage(j.needs[0]),'unverified-report');
 j=confirm(j,'need-123456');assert.equal(stage(j.needs[0]),'local-confirmation');
 assert.throws(()=>report(j,'need-123456','again'),/REPORT_NOT_AVAILABLE/);
});
test('today recommendation is deterministic and not an acceptance',()=>{
 let j=make(empty(),'need-large','large');j=make(j,'need-small','small');assert.equal(recommend(j).id,'need-small');
 j=pledge(j,'need-large','offer-xyzabc','I can help');assert.equal(recommend(j).id,'need-large');assert.equal(j.needs[0].acceptedOfferId,null);
});
test('Garden Help Slip preserves requirement and forbids demo exports',()=>{
 const j=make(empty(),'need-123456'),slip=helpSlip(j,'need-123456');assert.equal(slip.schema,'fulfillment-envelope/v0');assert.equal(slip.status,'unmet');assert.equal(slip.requirements[0].description,j.needs[0].requirement);
 assert.deepEqual(slip.disclosure,{includesOnlySelectedResiduals:true,omittedPrivateContext:true});
 assert.throws(()=>helpSlip(demo(empty(),'2026-10-15T12:00:00Z'),'demo-need-01'),/ONLY_UNRESOLVED/);
});
test('portable copy detects mutation and invalid shape',async()=>{
 const j=make(empty(),'need-123456'),f=await freeze(j);assert.deepEqual(await thaw(f),j);
 const bad=structuredClone(f);bad.journal.needs[0].title='changed';await assert.rejects(()=>thaw(bad),/CHECKSUM_MISMATCH/);
 assert.throws(()=>validate({...j,needs:[...j.needs,j.needs[0]]}),/INVALID_NEED/);
});

test('real needs outrank demos, and accepted unfinished work remains in Today guide',()=>{
 let j=demo(empty(),'2026-10-15T12:00:00Z');j=make(j,'need-real');
 assert.equal(recommend(j).id,'need-real');
 j=pledge(j,'need-real','offer-here123','Useful capacity');j=accept(j,'need-real','offer-here123');
 assert.equal(recommend(j).id,'need-real');
 j=report(j,'need-real','Local report');assert.equal(recommend(j).id,'need-real');
 j=confirm(j,'need-real');assert.equal(recommend(j).origin,'demo');
});
