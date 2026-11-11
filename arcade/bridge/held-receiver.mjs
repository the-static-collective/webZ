import {NEEDS,OFFERS} from '../engine.mjs';
// Independently parse a *demo*, not an actual JAR;VIS/Supabase receiver.
// The only eligible disposition is HOLD_DEMO; real-world routing is never allowed.
export function inspectHeld(input) {
 const problems=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return {status:'REFUSE',problems:['Not a JSON object.'],liveEligible:false};
 if(input.schema!=='question-arcade/held-crossing/v1')problems.push('Unknown envelope schema.');
 if(input.status!=='HOLD'||input.authority!=='NONE')problems.push('Envelope claims a status or authority beyond HOLD.');
 if(input.origin!=='SYNTHETIC_FIXTURES_ONLY')problems.push('Only explicit synthetic demo origin is allowed.');
 if(input.permissions?.transmission!==false||input.permissions?.publication!==false||input.permissions?.realWorldAction!==false||input.permissions?.recipientConsent!==false)problems.push('Unsafe or absent permission boundaries.');
 if(input.model?.examplesIncluded!==false)problems.push('Raw model examples may not cross this receiver.');
 const need=NEEDS.find(n=>n.id===input.proposedNeed?.id),offer=OFFERS.find(o=>o.id===input.proposedOffer?.id);
 if(!need||!offer)problems.push('Need or offer is not a known fictional fixture.');
 else {
  if(need.name!==input.proposedNeed.title||offer.name!==input.proposedOffer.title||need.place!==input.proposedNeed.place||offer.place!==input.proposedOffer.place)problems.push('Fixture label or place differs from reference.');
  const shared=need.tags.filter(t=>offer.tags.includes(t));
  if(!shared.length)problems.push('No shared tags; route not supported.');
  if(JSON.stringify(shared)!==JSON.stringify(input.evidence?.sharedTags))problems.push('Shared-tag explanation does not match fixture evidence.');
 }
 if(input.receiver!=='JAR;VIS review inbox (not connected)')problems.push('Receiver claim is misleading.');
 if(typeof input.notice!=='string'||!input.notice.includes('not evidence'))problems.push('Simulation notice missing.');
 return {
  schema:'question-arcade/receiver-observation/v1',
  status:problems.length?'REFUSE':'HOLD_DEMO',
  problems,
  liveEligible:false,publicationAuthorized:false,identityVerified:false,recipientConsentVerified:false,
  message:problems.length?'Envelope refused. No action.':'Bounded synthetic example accepted for local inspection only. No real routing.',
  observedAt:new Date().toISOString(),
  sourceEnvelopeId:typeof input.id==='string'?input.id.slice(0,100):null,
  evidenceLimits:['Unsigned, self-attested export','Synthetic fixture names','No authentic recipient consent','Adaptive routing score lacks original training examples and cannot be independently replayed']
 };
}
