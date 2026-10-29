import {HARMONY_CATALOG as C} from './catalog.mjs';
const clone = x => JSON.parse(JSON.stringify(x));
export function composeDoor(id,question=''){
  const profile=C.profiles.find(p=>p.id===id);
  if(!profile)throw new RangeError('No such voluntary doorway');
  if(typeof question!=='string'||question.length>280)throw new RangeError('Public-safe question must be at most 280 characters');
  const customQuestion=question.trim();
  return {
    schema:'abundent.harmony-door/v1',catalogDate:C.asOf,profileId:profile.id,
    title:profile.title,sourceClass:'PUBLIC_REPO_COMPOSITION',classification:'PROPOSAL_ONLY',
    participation:'OPT_IN_ONLY',affiliation:'NOT_VERIFIED',stewardDecision:'NOT_REQUESTED',
    networkAction:'NONE',fieldOutcome:'NOT_VERIFIED',
    openingQuestion:customQuestion||profile.question,
    questionOrigin:customQuestion?'OPERATOR_ENTERED_UNVERIFIED':'PUBLIC_DEMO_TEMPLATE',
    boundedOffer:profile.offer,
    firstInstrument:{label:profile.firstName,href:profile.first,status:'EXISTING_PUBLIC_PROTOTYPE'},
    neighboringInstruments:clone(profile.neighbors.map(([label,href])=>({label,href,status:'INDEPENDENT_SOURCE'}))),
    localDecisionGates:clone(profile.gates),culturePractices:clone(C.practices),
    invariants:clone(C.invariants),
    returnProtocol:'Ask the responsible receiver whether anything actually happened; record decline or unknown honestly.',
    nonClaim:'No partner enrollment, legal entity, consent, delivery, work completion or integrated operating system is established by this draft.'
  };
}
export function indexDoors(){return C.profiles.map(({id,title,firstName})=>({id,title,firstName}));}
