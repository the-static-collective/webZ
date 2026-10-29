import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {makeSecondTable,inspectCreativePacket,INTEREST_STATIONS} from '../bridge/first/second-table.mjs';
const sha=v=>'sha256:'+createHash('sha256').update(JSON.stringify(v)).digest('hex');
function packet(){
 const ids=[
  ['festival-fork','the-static-collective/webZ','11bebee583f01866512e050c3bf44f5ea08e9d2c'],
  ['machine-book','the-static-collective/lemonPRESS','aae960f13d45eb4713460ed9660b7baf5ba3c473']
 ];
 const sourceReferences=ids.map(([id,repo,commit])=>({id,repo,commit,url:'https://github.com/'+repo+'/pull/1',title:id,rightsAndTruthBoundary:'No rights transferred.'}));
 const payload={schema:'jarvis.thought-food-payload/v1',purpose:'SECOND_TABLE',sourceReferences,
  crossings:[{pair:['festival-fork','machine-book'],question:'What if a new circle inherits a book and changes the party?',concreteNextStep:'Independently review a paper prototype for an independent second table.',falsifier:'Failure if it depends on founder.',state:'IDEA_ONLY_HOLD'}],
  rightsToReuseMedia:false,sourceOwnersExecutedByThisCall:0,realPeopleRecruited:0,realSuccessVerified:false,applicationSubmitted:false,
  sourceVerification:'HARD_CODED_PUBLIC_PR_REFS_NOT_REFETCHED_AT_RUNTIME',operatorDisposition:'REVIEW_HOLD',
  rules:['NO_PRIVATE_SURVIVOR_OR_CHILD_DATA','NO_AUTOMATIC_CONTACT','CREATIVE_IS_NOT_EVIDENCE','NO_SOURCE_AUTHORITY','NO_MEDIA_RIGHTS']
 };
 return {schema:'jarvis.thought-food-packet/v1',payload,digest:sha(payload)};
}
test('Actual WebZ original signed-four-key inheritance review + fork on six different choices',async()=>{
 for(const interest of Object.keys(INTEREST_STATIONS)){
  const p=await makeSecondTable({interest});
  assert.equal(p.sourceMethodDigest,p.festivalIdea.sourceMethodDigest);
  assert.equal(p.signedSoftwareReview.verifiedDistinctKeyHolders,4);
  assert.equal(p.signedSoftwareReview.signedPacketsVerified,11);
  assert.equal(p.signedSoftwareReview.childEditedOwnRules,true);
  assert.equal(p.signedSoftwareReview.signedRefusalRespected,true);
  assert.equal(p.signedSoftwareReview.ancestorCannotWithdrawChildOffer,true);
  assert.equal(p.signedSoftwareReview.middleGenerationCannotWithdrawGrandchildOffer,true);
  assert.equal(p.secondTable.founderPermissionRequired,false);
  assert.equal(p.secondTable.actualMeeting,false);
  assert.equal(p.secondTable.venuePermission,false);
  assert.equal(p.festivalIdea.publicLaunch,'HOLD');
  assert.equal(p.outcomes.realHumans,0);
  assert.equal(p.outcomes.voqalSubmitted,false);
  for(const v of Object.values(p.sideEffects))assert.equal(v,false);
 }
});
test('Real portable thought-food format admits bounded idea-only lenses, not creative permission',async()=>{
 const p=packet(),v=await inspectCreativePacket(p);
 assert.equal(v.accepted,true);
 assert.equal(v.mayExecute,false);assert.equal(v.mayPublish,false);
 const report=await makeSecondTable({creativePacket:JSON.stringify(p)});
 assert.equal(report.creativeThoughtFood.questions.length,1);
 assert.equal(report.outcomes.sourceOwnerMediaRenderedByThisCall,0);
 assert.match(report.creativeThoughtFood.disposition,/CHECKSUM_ONLY/);
});
test('Tamper, forged source, inflated human results, bad interest, or invalid packet refused',async()=>{
 const p=packet();
 for(const bad of [
  {...p,digest:'sha256:'+'0'.repeat(64)},
  {...p,payload:{...p.payload,realSuccessVerified:true}},
  {...p,payload:{...p.payload,sourceReferences:[{...p.payload.sourceReferences[0],commit:'0'.repeat(40)},p.payload.sourceReferences[1]]},digest:sha({...p.payload,sourceReferences:[{...p.payload.sourceReferences[0],commit:'0'.repeat(40)},p.payload.sourceReferences[1]]})},
  {...p,payload:{...p.payload,crossings:[]}},
  {...p,permitGranted:true}
 ])await assert.rejects(()=>inspectCreativePacket(bad),/SECOND_TABLE_HOLD/);
 await assert.rejects(()=>makeSecondTable({interest:'survivor-private-data'}),/SECOND_TABLE_HOLD/);
});
test('Review screen is local-only and has explicit synthetic and safety boundaries',()=>{
 const html=readFileSync(new URL('../bridge/first/second-table.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../bridge/first/second-table-ui.mjs',import.meta.url),'utf8');
 const index=readFileSync(new URL('../bridge/first/index.html',import.meta.url),'utf8');
 assert.match(html,/connect-src 'none'/);assert.match(html,/no real survivor intake/i);
 assert.match(index,/second-table\.html/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|localStorage|sendBeacon|sessionStorage/);
});
