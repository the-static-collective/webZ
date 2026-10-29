import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectStoryRooms} from '../bridge/first/story-rooms-receiver.mjs';
import {makeSecondTable} from '../bridge/first/second-table.mjs';
const sha=o=>'sha256:'+createHash('sha256').update(JSON.stringify(o)).digest('hex');
const lens=['VIEWPOINT','ABSENCE','RECEIVER','CARRIER'];
function packet(){
 const sources=[
  {id:'collection-event',title:'CANON 001 — The Collection Event',medium:'AUTHOR_APPROVED_FICTIONAL_CANON',state:'FIXED_FICTIONAL_CANON',url:'https://app.gitbook.com/o/ddlx1UAH93SFyQsNFNa4/s/HILTtUulCBDqDzXXk6RQ/the-pet-sitter-featured-story-seed/the-room-inside-the-room-multimedia-project-seed/canon-001-the-collection-event',mechanic:'A few visitors help two rats cross an unstable passage.',boundary:'Story canon is not a real founding event or permission to publish a film.'},
  {id:'octopus-rooms',title:'OCTOPUS MADE THIS — The Rooms That Remember',medium:'SYSTEMIC_GAME_AND_BOOK',state:'CANDIDATE_CREATIVE_SEED',url:'https://github.com/the-static-collective/the-daily-slice/blob/23c3d4bf7e4febb89919a3d54b6e8aaf3a764120/slices/2026/09/2026-09-16/octopus-made-this-rooms-that-remember.md',mechanic:'Saint Eight makes a room that remembers, later reinterpreted by Wrench.',boundary:'This is science fiction about octopuses, not proof of animal industry.'}
 ];
 const question='Could two distinct rooms make a useful portable paper invitation?';
 const branches=[{parentIds:sources.map(s=>s.id),question,cuts:lens.map(id=>({lensId:id,pressure:'One cautious question.',heldExperiment:'Paper only.',state:'FICTIONAL_LENS_HOLD'})),status:'CROSS_MEDIA_PROPOSAL_NOT_STORY_CANON'}];
 const planCandidates=[{id:'story-plan-local',parentIds:sources.map(s=>s.id),question,smallestProof:'Paper cards and a real refusal test.',falsifier:'A second group cannot leave.',cuts:lens,status:'PLANNING_CANDIDATE_ONLY',ownerApproved:false,executed:false,realPeople:0,rightsCleared:false}];
 const payload={schema:'jarvis.story-rooms-payload/v1',purpose:'SECOND_TABLE',sourceReferences:sources,branches,questions:[question],planCandidates,suggestedActivity:'Paper-first independent group.',sourceMode:'PUBLIC_CREATIVE_SOURCE_DESCRIPTIONS_NO_MEDIA_COPIED',humanOutcomes:0,realWorldClaims:false,mediaEnginesExecuted:0,newStoryCanonDeclared:false,sourceOwnerAdmission:false,externalAction:false,voqalApplicationSubmitted:false,rules:['CANON_001_STAYS_FIXED','OCTOPUS_NOT_SCIENTIFIC_CLAIM','RENJI_NOT_AMNESIAC','NO_REAL_SENSITIVE_DATA','NO_AUTO_PUBLISH'],authority:'NONE_REVIEW_HOLD'};
 return {schema:'jarvis.story-rooms-packet/v1',payload,digest:sha(payload)};
}
test('independent local story packet receiver preserves fictional authority boundaries',async()=>{
 const p=packet(),review=await inspectStoryRooms(p);
 assert.equal(review.accepted,true);assert.equal(review.planCandidates.length,1);
 assert.equal(review.realWorldProof,false);assert.equal(review.fictionalCanonModified,false);
 const second=await makeSecondTable({interest:'art',storyPacket:JSON.stringify(p)});
 assert.equal(second.storyThoughtFood.accepted,true);
 assert.equal(second.possibleRecursivePlanZInput.automaticExecution,false);
 assert.equal(second.possibleRecursivePlanZInput.externalPlansCreated,false);
 assert.equal(second.outcomes.realHumans,0);assert.equal(second.secondTable.actualMeeting,false);
});
test('forged canon/authority, extra participants, altered source or erased lenses fail',async()=>{
 const p=packet();
 for(const variant of [
  {...p,digest:'sha256:'+'0'.repeat(64)},
  {...p,payload:{...p.payload,newStoryCanonDeclared:true}},
  {...p,payload:{...p.payload,sourceReferences:[{...p.payload.sourceReferences[0],state:'PAID_FILM_PRODUCED'},p.payload.sourceReferences[1]]}},
  {...p,payload:{...p.payload,branches:[]}},
  {...p,payload:{...p.payload,planCandidates:[{...p.payload.planCandidates[0],ownerApproved:true}]}},
  {...p,grantSubmitted:true}
 ])await assert.rejects(()=>inspectStoryRooms(variant),/STORY_RECEIVER_HOLD/);
 assert.deepEqual((await inspectStoryRooms(null)).sourceIds,[]);
});
