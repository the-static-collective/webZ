// VOQAL-014: local, synthetic Stranger Gauntlet. Invokes original WebZ Second Table.
import {makeSecondTable} from './second-table.mjs';
export const CASES=Object.freeze({
 newcomer:{interest:'accessibility',need:'I know nobody here. What is one voluntary way to join?',action:'Ask a consenting host about one accessible, account-free welcome table.'},
 food:{interest:'food',need:'Could neighbors share a meal without an intake database?',action:'Ask a food-safe, separately authorized host to critique a small shared table.'},
 repair:{interest:'repair',need:'Can I contribute practical skills without claiming access to anyone’s property?',action:'Ask a qualified owner to identify one reversible, properly supervised task.'},
 music:{interest:'music',need:'How might a stranger contribute an original song?',action:'Ask an actual host and rights holders about a voluntary, accessible music table.'}
});
const hold=s=>{throw Error('STRANGER_GAUNTLET_HOLD_'+s)};
const requirements=[
 ['verifiedDistinctKeyHolders',4],['signedPacketsVerified',11],['childEditedOwnRules',true],
 ['signedRefusalRespected',true],['ancestorCannotWithdrawChildOffer',true],
 ['middleGenerationCannotWithdrawGrandchildOffer',true]
];
export function inspect(proof,interest){
 if(!proof||proof.schema!=='abundent/second-table-synthetic-review-v1'||
  proof.status!=='SYNTHETIC_SOFTWARE_DEMONSTRATION_ONLY'||
  proof.application!=='VOQAL-012 APPLICANT_REVIEW_NOT_SUBMITTED'||
  !/^[0-9a-f]{64}$/.test(proof.sourceMethodDigest||''))hold('SOURCE');
 const s=proof.signedSoftwareReview,t=proof.secondTable,f=proof.firstTable;
 if(!s||!t||!f||requirements.some(([k,v])=>s[k]!==v))hold('SIGNED_REVIEW');
 if(t.interest!==interest||t.actualMeeting!==false||t.localHumanOrganizerConfirmed!==false||
  t.venuePermission!==false||t.independentBudgetConfirmed!==false||
  t.communitySafetyReviewed!==false||t.founderPermissionRequired!==false||
  f.realPeople!==0||f.actualMeeting!==false||f.membership!==false)hold('FIELD_AUTHORITY');
 if(!proof.festivalIdea||proof.festivalIdea.publicLaunch!=='HOLD'||
  proof.festivalIdea.sourceMethodDigest!==proof.sourceMethodDigest)hold('FESTIVAL');
 if(!proof.outcomes||!proof.sideEffects||
  Object.values(proof.outcomes).some(v=>v!==0&&v!==false)||
  Object.values(proof.sideEffects).some(v=>v!==false)||
  proof.outcomes.voqalSubmitted!==false||proof.outcomes.realHumans!==0||
  proof.sideEffects.grantSubmitted!==false||proof.sideEffects.contactsSent!==false)hold('INVENTED_OUTCOME');
 if(!Array.isArray(proof.requiredNextHumanGates)||
  !proof.requiredNextHumanGates.includes('VOLUNTARY_HUMAN_PARTICIPATION')||
  !proof.requiredNextHumanGates.includes('REAL_CO_DESIGN_AND_INDEPENDENT_SAFETY_REVIEW'))hold('HUMAN_GATES');
 if(proof.creativeThoughtFood?.accepted&&
  (proof.creativeThoughtFood.mayPublish!==false||proof.creativeThoughtFood.mayExecute!==false))hold('CREATIVE_AUTHORITY');
 if(proof.possibleRecursivePlanZInput&&
  (proof.possibleRecursivePlanZInput.automaticExecution!==false||
   proof.possibleRecursivePlanZInput.sourceOwnerApproved!==false||
   proof.possibleRecursivePlanZInput.realParticipation!==false))hold('PLANNING_AUTHORITY');
 return {software:'ORIGINAL_WEBZ_SYNTHETIC_SIGNATURE_REVIEW',signers:4,verifiedPackets:11,
  refusalRespected:true,descendantKeysSeparate:true,humanFieldEvidence:'NONE'};
}
const attacks=[
 ['invent-human',p=>{p.outcomes.realHumans=1}],
 ['invent-permission',p=>{p.secondTable.venuePermission=true}],
 ['invent-contact',p=>{p.sideEffects.contactsSent=true}],
 ['founder-veto',p=>{p.secondTable.founderPermissionRequired=true}],
 ['erase-refusal',p=>{p.signedSoftwareReview.signedRefusalRespected=false}],
 ['invent-submission',p=>{p.outcomes.voqalSubmitted=true}],
 ['invent-media-rights',p=>{p.creativeThoughtFood={accepted:true,mayExecute:true,mayPublish:true}}]
];
export function adversarial(proof,interest){
 inspect(proof,interest);
 return attacks.map(([id,mutate])=>{
  const mutant=structuredClone(proof);mutate(mutant);
  try{inspect(mutant,interest);return {id,refused:false,reason:'UNDETECTED'}}
  catch(e){return {id,refused:String(e.message).startsWith('STRANGER_GAUNTLET_HOLD_'),reason:String(e.message)}}
 });
}
export async function gauntlet(id='newcomer'){
 if(!Object.hasOwn(CASES,id))hold('UNKNOWN_SCENARIO');
 const scenario=CASES[id];
 // Execute actual original WebZ source. JAR;VIS/PlanZ/CANNON are not executed by this call.
 const proof=await makeSecondTable({interest:scenario.interest});
 const evidence=inspect(proof,scenario.interest);
 const attacks=adversarial(proof,scenario.interest);
 if(attacks.some(a=>!a.refused))hold('ADVERSARIAL_UNDETECTED');
 const reviewers=[
  {role:'SKEPTICAL_FUNDER',question:'Why would this change real lives?',
   observed:'Software-signed synthetic successor and refusal tested.',
   missing:'No independent real human, host, useful act or continuity witness.',
   next:'Compensated community co-design; separately consented first gatherings; observe real voluntary continuity.',
   falsifier:'No participant-owned second table survives founder absence.'},
  {role:'FIRST_TIME_NEWCOMER',question:'What can I do without an account or sharing a private story?',
   observed:'A specific paper-first invitation with an unpenalized refusal.',
   missing:'No actual stranger accessibility or usefulness test.',
   next:scenario.action,falsifier:'The offered first step is coercive, inaccessible or unusable.'},
  {role:'INDEPENDENT_ORGANIZER',question:'What happens when the founder disappears?',
   observed:'Four fictitious keys, eleven verified synthetic signed packets, separate successor and refusal.',
   missing:'No separate human group controls real decisions, resources, host permissions or safety.',
   next:'A receiving group chooses its rules, records and venue, and may refuse the source.',
   falsifier:'Founder permission or the original platform is indispensable.'}
 ].map(x=>({...x,verdict:'SOFTWARE_PASS_FIELD_HOLD'}));
 return {schema:'abundent/voqal-stranger-gauntlet-synthetic-v1',challenge:id,
  status:'SYNTHETIC_TEST_ONLY_NO_FIELD_RESULTS',reviewedSource:'Actual WebZ VOQAL-012 makeSecondTable',
  sourceMethodDigest:proof.sourceMethodDigest,evidence,reviewers,attacks,
  kit:{title:'THE SECOND TABLE — UNSENT PAPER CARD',need:scenario.need,firstAct:scenario.action,
   invitation:'Could we try one voluntary, low-pressure, accessible table? No account, phone, testimony or membership needed.',
   choices:['ACCEPT','ADAPT','REFUSE WITHOUT PENALTY','FORM AN INDEPENDENT SECOND TABLE'],
   successorRule:'New people create their own local rules. The founder cannot veto their decisions.',
   proofNeeded:'Actual host permission, accessibility/safeguarding critique, independent confirmation of useful work and a founder-absence test.'},
  applicationInsert:{
   hypothesis:'Can one account-free, voluntary community table enable a person without an existing network to help create an independently governed successor that can refuse its founder?',
   softwareEvidence:'A synthetic original WebZ four-key, eleven-signed-packet independence/refusal test, plus three simulated reviewer lenses and seven rejected claim mutations.',
   humanExperiment:'April–September 2027: compensated co-design and qualified independent safety/access review; permission-first small tables; participant-led acts; an optional independent second table and founder-absence test; report failures and refusals.',
   boundary:'Zero real people, services, booked venues, real useful acts, community-founded groups, institutional approval or submitted Voqal applications are established by this demonstration.'},
  humanEvidence:{people:0,independentTables:0,verifiedActs:0,realReviewerInterviews:0},
  sideEffects:{network:false,contact:false,grantSubmitted:false,venueBooked:false,dataStored:false},
  warning:'Synthetic cryptographic keys and self-described source references are not independent human identity, consent or outcome evidence.'};
}
