// VOQAL-012 Second Table: actual original WebZ signed synthetic source / reviewer.
// Creative pantry is an optional UNTRUSTED local JSON handoff from JAR;VIS.
// No persons, memberships, grants, legal entities, venues or survivor services result.
import {hash} from '../suitcase/protocol.mjs';
import {PATTERN,createRelationalInheritanceProof,verifyRelationalInheritanceProof} from './relational-inheritance.mjs';
import {forkFestival} from './festival-forks.mjs';

export const INTEREST_STATIONS=Object.freeze({
 art:'make',music:'road-stage',food:'table',repair:'build',
 nature:'place',accessibility:'welcome'
});
const allow=new Map([
 ['six-movies',['the-static-collective/the-haunted-toaster','b9cdd0533c34635a84d4a83bbcb1ae1cbf81a9fa']],
 ['machine-book',['the-static-collective/lemonPRESS','aae960f13d45eb4713460ed9660b7baf5ba3c473']],
 ['music-film',['the-static-collective/webZ','3a4e9f679a92c2545c474723682e8b1311dc2e76']],
 ['living-record',['the-static-collective/lemonPRESS','fe1d154fa3b76d933016634683a4d743a02a0338']],
 ['groovetown',['the-static-collective/CANNON','076305540707913b1e2998f62dc90b94cc031c00']],
 ['festival-fork',['the-static-collective/webZ','11bebee583f01866512e050c3bf44f5ea08e9d2c']]
]);
const hold=reason=>{throw Error('SECOND_TABLE_HOLD_'+reason);};
function equalKeys(obj,keys){
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).sort().join('|')!==[...keys].sort().join('|'))hold('FIELDS');
}
async function localDigest(payload){
 const bytes=new TextEncoder().encode(JSON.stringify(payload));
 const buffer=await crypto.subtle.digest('SHA-256',bytes);
 return 'sha256:'+Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
}
// A digest and PR reference are self-consistency only, never remote source
// authentication or a grant of intellectual-property / participant rights.
export async function inspectCreativePacket(packet){
 if(packet===null)return {accepted:false,disposition:'NO_OPTIONAL_CREATIVE_PACKET',questions:[],sourceIds:[]};
 if(typeof packet==='string'){
  if(packet.length>24000)hold('TOO_LARGE');
  try{packet=JSON.parse(packet)}catch{hold('BAD_JSON');}
 }
 if(JSON.stringify(packet).length>24000)hold('TOO_LARGE');
 equalKeys(packet,['schema','payload','digest']);
 if(packet.schema!=='jarvis.thought-food-packet/v1')hold('CREATIVE_SCHEMA');
 const p=packet.payload;
 equalKeys(p,['schema','purpose','sourceReferences','crossings','rightsToReuseMedia',
  'sourceOwnersExecutedByThisCall','realPeopleRecruited','realSuccessVerified','applicationSubmitted',
  'sourceVerification','operatorDisposition','rules']);
 if(p.schema!=='jarvis.thought-food-payload/v1'||!['SECOND_TABLE','VOQAL_APPLICANT_REVIEW','OPEN_CREATIVE_EXPERIMENT'].includes(p.purpose)||
  p.operatorDisposition!=='REVIEW_HOLD'||p.sourceVerification!=='HARD_CODED_PUBLIC_PR_REFS_NOT_REFETCHED_AT_RUNTIME'||
  p.rightsToReuseMedia!==false||p.sourceOwnersExecutedByThisCall!==0||p.realPeopleRecruited!==0||
  p.realSuccessVerified!==false||p.applicationSubmitted!==false)hold('CREATIVE_AUTHORITY');
 if(packet.digest!==await localDigest(p))hold('CREATIVE_DIGEST');
 if(!Array.isArray(p.sourceReferences)||p.sourceReferences.length<2||p.sourceReferences.length>5||
  !Array.isArray(p.crossings)||!Array.isArray(p.rules))hold('CREATIVE_SHAPE');
 const ids=p.sourceReferences.map(x=>x.id);
 if(new Set(ids).size!==ids.length||ids.some((x,i)=>i&&ids[i-1]>x))hold('CREATIVE_SOURCE_ORDER');
 for(const s of p.sourceReferences){
  const source=allow.get(s.id);
  if(!source||s.repo!==source[0]||s.commit!==source[1]||!/^https:\/\/github.com\/the-static-collective\//.test(s.url)||
   typeof s.title!=='string'||s.title.length>110||typeof s.rightsAndTruthBoundary!=='string'||s.rightsAndTruthBoundary.length>500)hold('CREATIVE_SOURCE_PIN');
 }
 const count=ids.length*(ids.length-1)/2;
 if(p.crossings.length!==count||p.rules.length<5||!p.rules.includes('NO_PRIVATE_SURVIVOR_OR_CHILD_DATA'))hold('CREATIVE_BOUNDARIES');
 let index=0,questions=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const c=p.crossings[index++];
  if(!c||c.state!=='IDEA_ONLY_HOLD'||JSON.stringify(c.pair)!==JSON.stringify([ids[i],ids[j]])||
   typeof c.question!=='string'||c.question.length>800||typeof c.concreteNextStep!=='string'||
   typeof c.falsifier!=='string'||!c.concreteNextStep.includes('independent second table'))hold('CREATIVE_CROSSING');
  questions.push(c.question);
 }
 return {accepted:true,disposition:'LOCAL_CHECKSUM_ONLY_NOT_ORIGIN_OR_RIGHTS_AUTHENTICATION',
  sourceIds:ids,questions,creativeReceiptDigest:packet.digest,mayPublish:false,mayExecute:false};
}
export async function makeSecondTable({interest='art',creativePacket=null}={}){
 if(!Object.hasOwn(INTEREST_STATIONS,interest))hold('UNKNOWN_INTEREST');
 const creative=await inspectCreativePacket(creativePacket);
 // These ORIGINAL WebZ methods are genuinely run, not reimplemented here.
 const signed=await createRelationalInheritanceProof();
 const review=await verifyRelationalInheritanceProof(signed);
 if(!review.ancestorCannotWithdrawChildOffer||!review.middleGenerationCannotWithdrawGrandchildOffer||
  !review.signedRefusalRespected||!review.childEditedOwnRules)hold('SIGNED_INHERITANCE_FAILED');
 const methodDigest=await hash(PATTERN);
 if(signed.methodDigest!==methodDigest)hold('METHOD_CHANGED');
 const station=INTEREST_STATIONS[interest];
 const festival=await forkFestival({venue:'undecided',stations:[station,'fork'],time:'not_yet_sure'});
 if(festival.originalWebzMethodDigest!==methodDigest)hold('FESTIVAL_METHOD_MISMATCH');
 return {
  schema:'abundent/second-table-synthetic-review-v1',
  title:'The Second Table — one first circle, one independently owned successor',
  status:'SYNTHETIC_SOFTWARE_DEMONSTRATION_ONLY',
  application:'VOQAL-012 APPLICANT_REVIEW_NOT_SUBMITTED',
  sourceMethodDigest:methodDigest,
  firstTable:{role:'FICTIONAL_FIRST_CIRCLE_B',method:'Paper-first welcome, one voluntary useful proposal, right to decline.',membership:false,realPeople:0,actualMeeting:false},
  secondTable:{role:'FICTIONAL_INDEPENDENT_CIRCLE_D',interest,station,
   localChange:'Receiving circle chooses a different welcome ritual and its own rules; predecessor cannot withdraw its independently published capability.',
   founderPermissionRequired:false,actualMeeting:false,localHumanOrganizerConfirmed:false,
   venuePermission:false,independentBudgetConfirmed:false,communitySafetyReviewed:false},
  signedSoftwareReview:review,
  creativeThoughtFood:creative,
  festivalIdea:{kind:'INDEPENDENT_FESTIVAL_PROPOSAL_NOT_BOOKED',proposal:festival.branches[0].proposal,
   publicLaunch:festival.branches[0].publicLaunch,sourceMethodDigest:festival.originalWebzMethodDigest},
  falsifier:'If actual participants cannot freely adapt, refuse or continue the second gathering without the first founder, independent community formation is not demonstrated.',
  requiredNextHumanGates:['REAL_CO_DESIGN_AND_INDEPENDENT_SAFETY_REVIEW','VOLUNTARY_HUMAN_PARTICIPATION',
   'REAL_HOST_PERMISSION_AND_ACCESS','SEPARATE_RECEIVER_OWNED_DECISIONS','REAL_EVENT_COSTS_AND_INSURANCE_IF_APPLICABLE'],
  outcomes:{realHumans:0,communityGroupsFounded:0,festivalsHeld:0,actualVolunteerHours:0,
   actualReferrals:0,sourceOwnerMediaRenderedByThisCall:0,voqalSubmitted:false,
   realIndependentCommunityConfirmed:false},
  sideEffects:{networkRequest:false,contactsSent:false,grantSubmitted:false,
   venueBooked:false,participantDataStored:false,publication:false}
 };
}
