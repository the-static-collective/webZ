// STILL-HERE / OPEN-SEATS-028 · Source-first, non-diagnostic, read-only helper design.
// Public work is about building safe capabilities, never gathering survivor stories.
// There is no case intake, identifying event text, automatic matching or publication.

export const PROJECT=Object.freeze({
 name:'Still Here', audience:'Survivors of domestic abuse, especially isolated fathers; all genders welcome.',
 status:'INDEPENDENT_EARLY_PROTOTYPE_NOT_A_STAFFED_SERVICE',
 safety:'NO_ACCOUNT_NO_CASE_INTAKE_NO_SHARED_STORIES',
 privacy:'No user story is collected by this page. Hosting may still log page requests; monitored devices may reveal browsing.',
 service:'This is an informational prototype, not a staffed peer group, legal representation or emergency response.',
 principle:'A missing capability becomes a careful invitation, not a demand for a survivor to tell their story.'
});

export const NEEDS=Object.freeze([
 {id:'steady',name:'I need someone to take me seriously',
  first:'Put words to the next small thing you need: listening, practical help, or help understanding options. You do not have to prove your story here.',
  boundary:'This page does not connect you to a live listener. Do not share private events on a public board.',
  bottleneck:'Safe peer presence is not staffed or screened yet.',seat:'listener'},
 {id:'record',name:'I need to organize what happened',
  first:'Use a private timeline with separate spaces for direct observations, what others reported, your interpretations, and unanswered questions.',
  boundary:'Store evidence only where you judge it safe. Nothing typed or documented is sent to this project.',
  bottleneck:'A reviewed, genuinely private document workflow is needed before any shared casework.',seat:'documents'},
 {id:'prepare',name:'I have a difficult legal or parenting appointment',
  first:'Write three neutral questions for a qualified professional: what deadlines apply, which documents are relevant, and what choices are available.',
  boundary:'We cannot decide custody, evaluate claims, or give case-specific legal advice. Only qualified professionals can advise on your case.',
  bottleneck:'Accurate, jurisdiction-specific resource navigation needs verified sources and qualified review.',seat:'navigation'},
 {id:'privacy',name:'I need to make a safer communication plan',
  first:'Consider whether this device or account may be monitored before making notes, downloading files, or contacting someone. Choose channels deliberately.',
  boundary:'The page cannot make your device private, secure your communications, erase browser logs or promise confidentiality.',
  bottleneck:'A privacy and safety protocol needs expert human scrutiny before live peer contact.',seat:'safety'},
 {id:'human',name:'I need one voluntary, manageable next step',
  first:'Choose a reversible request: “Could you listen for ten minutes?” or “Could you help me list questions for an appointment?”',
  boundary:'No direct introductions or outreach happen from this page. You choose whether to ask someone you already trust.',
  bottleneck:'Consent-based peer introduction rules are not yet tested or staffed.',seat:'listener'}
].map(x=>Object.freeze(x)));

export const SEATS=Object.freeze([
 {id:'safety',name:'Privacy & Safety Steward',capability:'Help establish safety and confidentiality boundaries before group contact.',
  first:'Review three fictional situations about device monitoring, unsafe sharing and pressure to disclose. Propose a no-story-required entry policy.',
  return:'A written draft of do-not-collect rules, an incident-escalation plan and a way to challenge or correct procedures.',
  authority:'A competent, responsible group operator must approve procedures before any direct support is offered.',
  boundary:'No client stories, direct outreach, security claims or access to accounts in this design-only trial.',
  readiness:'DESIGN_ONLY_UNFILLED',kind:'GATE_BEFORE_LIVE_PILOT'},
 {id:'moderation',name:'Peer-Space Review Steward',capability:'Design a fair, trauma-aware review and conflict-handling process.',
  first:'Use fictional posts to draft clear criteria for publishing, declining, correction, withdrawal, de-escalation and appeal.',
  return:'A tested fictional-case rubric and proposal for reviewer training, confidentiality and supervision.',
  authority:'Only vetted, supervised people expressly authorized by the operator may access real private submissions or moderate a live group.',
  boundary:'No raw evidence, real allegations, participant profiles, unmoderated direct messages or database permissions.',
  readiness:'DESIGN_ONLY_UNFILLED',kind:'GATE_BEFORE_LIVE_PILOT'},
 {id:'listener',name:'Peer Presence Designer',capability:'Help create a listening format that does not demand disclosure or decide who is right.',
  first:'Role-play a fictional ten-minute conversation that welcomes “I just need to be heard,” including how to decline or end safely.',
  return:'A short listening script, consent checklist and boundaries that a qualified facilitator can review.',
  authority:'Live peer matching needs separate safeguards, consent, supervision and an accountable operator; it is not available here.',
  boundary:'No unsupervised survivor matching, pressure to disclose, diagnosis, identity verification or adjudication.',
  readiness:'DESIGN_ONLY_UNFILLED',kind:'GATE_BEFORE_LIVE_PILOT'},
 {id:'documents',name:'Chronology & Documents Designer',capability:'Make private chronology and paperwork organization less overwhelming.',
  first:'Using completely fictional events, improve a template distinguishing direct observation, reported statement, inference and open question.',
  return:'A privacy-first, exportable template and instructions that do not change, interpret or certify someone’s evidence.',
  authority:'The survivor controls their own material; only authorized professionals decide evidentiary/legal relevance.',
  boundary:'Never ask for, receive, publish or store real evidence, photographs, reports or identifying information during this trial.',
  readiness:'DESIGN_ONLY_UNFILLED',kind:'OPEN_DESIGN_TRIAL'},
 {id:'navigation',name:'Qualified-Resource Pathfinder',capability:'Help verify independent, accurate options for legal, parenting and practical questions.',
  first:'Pick one jurisdiction-neutral sample question and design a source-checking checklist for professional services, eligibility and dates.',
  return:'A dated, source-attributed sample guide explicitly distinguishing verified availability from possible referral.',
  authority:'Case-specific advice comes only from appropriately licensed professionals; referral organizations must independently consent.',
  boundary:'No legal representation, advice about a particular parent or child, promises of court outcomes or unverified referrals.',
  readiness:'DESIGN_ONLY_UNFILLED',kind:'OPEN_DESIGN_TRIAL'},
 {id:'access',name:'Accessibility & Usability Tester',capability:'Make every first step understandable without a login, jargon or a public story.',
  first:'Try the fictional decision flow on a phone, keyboard and screen reader if available; identify a confusing or coercive moment.',
  return:'One concrete change to reduce cognitive burden and improve a person’s ability to leave or decline.',
  authority:'No participant or operational data access is needed; a maintainer reviews changes before deployment.',
  boundary:'Use fictional examples only; no usability tests on vulnerable strangers without an approved protocol.',
  readiness:'OPEN_DESIGN_TRIAL_UNFILLED',kind:'OPEN_DESIGN_TRIAL'},
 {id:'builder',name:'Private-Tools Builder',capability:'Help connect safer, local-first tools such as Still Here and future Blackstar/GRAFT integrations.',
  first:'Build or test a demo that runs on entirely fictional records, with no network upload and a plainly stated data-retention behavior.',
  return:'A reproducible prototype, test output, threat-model notes and a list of unresolved risks.',
  authority:'A maintainer must approve code and any eventual hosting; the owner of any sensitive material separately authorizes access.',
  boundary:'No production credentials, case material, cloud imports, automatic publication or claim that an unbuilt integration exists.',
  readiness:'OPEN_DESIGN_TRIAL_UNFILLED',kind:'OPEN_DESIGN_TRIAL'}
].map(x=>Object.freeze(x)));

const BY_NEED=new Map(NEEDS.map(n=>[n.id,n]));
const BY_SEAT=new Map(SEATS.map(s=>[s.id,s]));
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function needFor(id){return BY_NEED.get(id)||null;}
export function seatFor(id){return BY_SEAT.get(id)||null;}
export function seatForNeed(id){const n=needFor(id);return n?seatFor(n.seat):null;}
export function recruitmentSeat(id){
 const seat=seatFor(id);if(!seat)throw Error('UNKNOWN_SEAT');
 return Object.freeze({
  schema:'abundent/still-here-open-seat-v1',project:PROJECT.name,id:seat.id,
  title:seat.name,capacityNeeded:seat.capability,
  safeFirstTrial:seat.first,trialReturn:seat.return,
  approvalGate:seat.authority,prohibited:seat.boundary,
  phase:seat.readiness,source:'EDITORIAL_PROJECT_NEED',
  roleAssigned:false,staffed:false,privateAccess:false,
  applicationsReceived:'NOT_KNOWN',contactedSurvivors:0,
  verifiedOutcomes:0,publication:'DRAFT_NOT_SUBMITTED'
 });
}
export function inviteText(id,mode='invite'){
 if(!['invite','self','ambassador'].includes(mode))throw Error('UNKNOWN_MODE');
 const p=recruitmentSeat(id);
 const opener=mode==='self'?'I would like to explore a small, voluntary contribution, not an appointment.'
  :mode==='ambassador'?'If this is not for you, could you privately pass the idea to someone interested, with their consent?'
  :'Could you help shape one small, safer first step for an emerging survivor-support project? No personal story or commitment is required.';
 return [opener,'',p.title,p.capacityNeeded,'',
  'First trial, using fictional examples only: '+p.safeFirstTrial,
  'What useful work would look like: '+p.trialReturn,
  'Who must separately authorize real-world operations: '+p.approvalGate,
  'Non-negotiable boundary: '+p.prohibited,'',
  'All genders are welcome; initial listening emphasis includes isolated fathers.',
  'Independent early prototype. There is no live support service, moderator access, membership or automatic matching.',
  'Declining is always acceptable. Do not send survivor stories, case records, or identifying information.'
 ].join('\n');
}
export function careStep(id){
 const n=needFor(id);if(!n)throw Error('UNKNOWN_NEED');
 return Object.freeze({
  schema:'abundent/still-here-private-next-step-v1',
  question:n.name,first:n.first,limit:n.boundary,
  capacityMissing:n.bottleneck,
  volunteerDesignSeat:seatForNeed(id)?.name||null,
  noStoryCollected:true,sharedCase:false,appointment:false,
  status:'LOCAL_INFORMATION_ONLY_NOT_STAFFED'
 });
}
export const BLANK_CHRONOLOGY=[
  'PRIVATE WORKING NOTES — A TEMPLATE, NOT A CERTIFIED EVIDENCE RECORD',
  'Date/time (or approximate range):',
  'What I directly observed (distinguish from what I inferred):',
  'Exact words I remember / who said them, if I am certain:',
  'What someone else told me (identify as a report, not my observation):',
  'What I believe or infer (not established fact):',
  'Existing source / document location (keep it in my own secure custody):',
  'What remains uncertain / needs checking:',
  'Next question for a qualified professional:',
  'Do not change an original document. Keep originals and note corrections separately.'
].join('\n');


const FICTIONAL_TRIALS=Object.freeze({
 safety:'A fictional visitor is browsing on a family-shared phone. The page keeps no form data but the browser history and copied text may still be visible.',
 moderation:'A fictional community post includes an accusation and enough contextual details to recognize another person. The author later asks for the words to be removed.',
 listener:'A fictional visitor wants ten minutes of company but declines to explain what happened. A well-meaning helper starts asking for proof.',
 documents:'A fictional timeline says “I saw a door close” and “they intended to frighten me” in one sentence without distinguishing observation and inference.',
 navigation:'A fictional parent asks for a specific custody deadline, but the jurisdiction, case type and order status are not established.',
 access:'On a fictional small-screen phone, a keyboard-only visitor cannot easily find a safe exit and feels forced to choose a label describing their identity.',
 builder:'A fictional prototype puts a sensitive timeline in a URL fragment and stores an export automatically. There is no genuine user data in this demonstration.'
});
export function trialWorksheet(id){
 const s=seatFor(id);if(!s)throw Error('UNKNOWN_SEAT');
 return [
  'STILL HERE · SMALL VOLUNTARY DESIGN EXERCISE',
  'EVERY PERSON AND EVENT IN THIS PACKET IS FICTIONAL.',
  'No real stories, documents, names, contacts or private accounts should be used.',
  '',
  'Role: '+s.name,
  'Fictional situation: '+FICTIONAL_TRIALS[id],
  '',
  'Step 1 · Identify the privacy, dignity, accuracy or safety risks.',
  'Step 2 · Draft a small, reversible improvement using fictional material only.',
  'Step 3 · Explain when you would decline, pause or refer a matter to a qualified operator.',
  'Step 4 · Identify what must be approved before contacting real people.',
  'Step 5 · Record one test outcome and one unresolved question.',
  '',
  'Bounded first task: '+s.first,
  'Return to share with the project only if you choose: '+s.return,
  'Permission gate: '+s.authority,
  'Boundary: '+s.boundary,
  '',
  'This worksheet grants no reviewer access, authority, role, legal status or contact permission.'
 ].join('\n');
}
