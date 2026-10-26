// STILL-HERE CAMPFIRE-028 — the right to try, before a staffed service exists.
// No appointment, credential, survivor-case access, role ranking, or assumed assent.
import {CIRCLES,chooseCircle} from '../../campfire/model.mjs';
export {CIRCLES};

export const OPEN_WORK=Object.freeze([
  {id:'safeguards',name:'Safeguarding groundwork',symbol:'◈',
   need:'Before stranger introductions, someone must help design refusal, boundary, reporting, and review procedures.',
   first:'Draft a one-page boundary and incident-response checklist for independent critique. Do not receive survivor disclosures.',
   gate:'No public stranger matching, confidential case handling, or moderation authority until trained, accountable humans and procedures exist.'},
  {id:'welcome',name:'Welcome & invitations',symbol:'✳',
   need:'A newcomer should know what exists, what does not, and how to leave without pressure.',
   first:'Write a five-sentence welcome and a private, optional invitation to review it. Do not solicit personal abuse histories.',
   gate:'No unsolicited contact, directory of survivors, group enrollment, or introducing strangers without each person’s informed consent.'},
  {id:'listening',name:'Peer listening practice',symbol:'◌',
   need:'A human who can listen without making a verdict is valuable; peer listening needs boundaries and training.',
   first:'Draft a 20-minute peer-listening agreement with two independent review questions. Do not advertise a staffed listening service.',
   gate:'Do not accept sensitive survivor stories as a service, promise secrecy, or hold unmoderated stranger sessions before safeguarding review.'},
  {id:'navigation',name:'Practical information',symbol:'▤',
   need:'People need clear explanations of public documents, ordinary tasks, and which questions remain unanswered.',
   first:'Make one public-source, date-labelled court-form explainer draft; mark uncertainty and verify the source. No case details.',
   gate:'No legal representation, case-file intake, deadlines guessed from memory, or personalized advice presented as professional guidance.'},
  {id:'builders',name:'Tools & accessibility',symbol:'⚙',
   need:'Useful technology should be readable on an old phone, protect drafts, and avoid silently collecting personal records.',
   first:'Test a public dummy-data example on a mobile browser; write a reproducible accessibility/privacy bug report.',
   gate:'Do not collect real survivor records in GitHub, browser analytics, GRAFT, demos, test fixtures, or unreviewed AI services.'}
].map(x=>Object.freeze(x)));

const roles=new Map(OPEN_WORK.map(x=>[x.id,x]));
const OUTCOME_SET=new Set(['NOT_STARTED','DRAFTED','REVIEWED','SMALL_TRIAL','DECLINED','PAUSED']);
export const OUTCOMES=Object.freeze([
 ['NOT_STARTED','Not started'],
 ['DRAFTED','I drafted a first object'],
 ['REVIEWED','Someone reviewed my draft'],
 ['SMALL_TRIAL','I tried a safe, permitted small experiment'],
 ['DECLINED','Someone declined (that counts as information)'],
 ['PAUSED','I paused or stepped away']
]);

export function getOpenWork(id){return roles.get(id)||null;}
export function makeTryPlan(roleId,standingId){
 const role=getOpenWork(roleId),circle=chooseCircle(standingId);
 if(!role||!circle)throw Error('UNKNOWN_PUBLIC_ROLE_OR_STANDING');
 const first=circle.id==='curious'
  ?'Read the open need and write one question or concern; no commitment is required.'
  :circle.id==='helper'
  ?'Offer a bounded 20-minute review of an existing public-safe draft; decline anything outside your limits.'
  :circle.id==='starter'
  ?role.first
  :'Invite one or two willing people to review a public-safe prototype, leaving everyone free to say no.';
 const invitation=[
  'STILL HERE / ONE SMALL OPEN CAMPFIRE',
  'Question: could we help build '+role.name.toLowerCase()+'?',
  'I am interested in: '+circle.label.toLowerCase()+'. This is a starting preference, not an appointed position.',
  'Our first 7-day step: '+first,
  'Can you review the idea for 20 minutes, or suggest a safer/smaller move?',
  'No names, allegations, custody details, documents, or survivor contact information should be forwarded.',
  'Please do not recruit anybody else without asking me first. No reply is required; no is fine.',
  'This is an independent Abundent invitation to shape a proposal, not an operating support service or an assignment.'
 ].join('\n');
 return Object.freeze({
  schema:'still-here/campfire-try-v1',
  role:{id:role.id,name:role.name,need:role.need},
  standing:{id:circle.id,label:circle.label,authority:'NONE',selfSelected:true},
  first,invitation,
  days:7,
  steps:[
   {id:'draft',name:'Make one public-safe object',detail:first},
   {id:'review',name:'Ask for consent before involving anyone',detail:'Offer the public-safe draft to one or two trusted reviewers. Do not share private case facts or assume a reply.'},
   {id:'return',name:'Notice what happened',detail:'Record only a self-reported outcome (including no, pause, or no response). Do not count a person as recruited.'}
  ],
  boundary:role.gate,
  release:'No live peer-matching or survivor intake until safeguarding, qualified moderation, revocable consent, and reporting channels have been reviewed.',
  nextGate:'After an opt-in review, human stewards decide whether any bounded trial is safe. Becoming a continuing steward requires a separate explicit agreement.',
  verifiedHelpers:0,appointments:0,authority:'NONE',
  status:'OPEN_EDITORIAL_NEED_NOT_AN_ACTIVE_SERVICE'
 });
}

// Only canonical, public-safe role and standing IDs cross into the existing
// explicit-consent contact desk. No narrative, name, contact, claim, or case ID.
export function makeInterestHash(roleId,standingId){
 if(!getOpenWork(roleId)||!chooseCircle(standingId))throw Error('INVALID_INTEREST');
 return '#'+new URLSearchParams({stillhere:'v1',role:roleId,standing:standingId}).toString();
}
export function readInterestHash(hash){
 if(typeof hash!=='string'||!hash.startsWith('#')||hash.length>140)return null;
 const params=new URLSearchParams(hash.slice(1));
 if([...params.keys()].sort().join(',')!=='role,standing,stillhere')return null;
 if(['stillhere','role','standing'].some(k=>params.getAll(k).length!==1))return null;
 if(params.get('stillhere')!=='v1')return null;
 const role=getOpenWork(params.get('role')),circle=chooseCircle(params.get('standing'));
 return role&&circle?{role,circle}:null;
}
export function makeLocalReturn(roleId,standingId,outcome,checks=[],when=new Date()){
 const plan=makeTryPlan(roleId,standingId);
 if(!OUTCOME_SET.has(outcome)||!Array.isArray(checks)||checks.length>3
 ||checks.some(c=>!plan.steps.some(s=>s.id===c))||!(when instanceof Date)||!Number.isFinite(when.valueOf()))
  throw Error('INVALID_SELF_REPORT');
 return {
  schema:'still-here/campfire-local-return-v1',when:when.toISOString(),
  status:'SELF_REPORTED_NOT_INDEPENDENTLY_VERIFIED',scope:'LOCAL_EXPORT_ONLY',
  role:roleId,standing:standingId,outcome,
  steps:[...new Set(checks)],authority:'NONE',verifiedHelpers:0,
  contactSent:false,caseInformationIncluded:false,
  note:'This is one person’s local working note, not proof of delivery, consent, staffing, training, or service readiness.'
 };
}
