// FIRST-YES-030 · Abundent's public, entirely client-side First Yes doorway.
// Not the private Firebox Attention Desk. Never requires or calls an administrator API.
// Sources: editorial topics + (only if explicitly requested) reviewed public Workboard posts.
import {THREADS,summarizeHistory} from '../board/memory.mjs';

export const FIRST_YES_PUBLIC_SCHEMA='abundent/public-first-yes/v0';
const CAPACITIES=Object.freeze({
  listen:{label:'Listen',start:'Write one question that gives the relevant person room to correct our assumptions.',then:'Ask one willing person to explain what would actually help, without collecting private case details.'},
  research:{label:'Research',start:'List the three facts that would change the decision, and mark each as unverified.',then:'Check one primary, publicly available source or request permission from the actual decision owner.'},
  print:{label:'Make a card',start:'Draft one short, public-safe invitation with the question and permission boundary.',then:'Prepare a one-page printable draft that a person can freely correct or decline.'},
  convene:{label:'Gather people',start:'Define one 20-minute optional conversation, with no assumed attendees.',then:'Prepare a time window, question, and invitation for one or two willing people. Do not schedule anyone.'},
  build:{label:'Build a prototype',start:'Write the smallest reversible, harmless demonstration of the question.',then:'Make a local test artifact using fake data, then invite an authorized person to critique it.'},
  create:{label:'Make something expressive',start:'Write a tiny story, sketch, or poster explaining the question without claiming anyone agreed.',then:'Create a reviewable draft that community members can edit before any public release.'}
});
const HINTS=Object.freeze({
  grocery: /\b(grocery|grocer|co-op|coop|food access|food desert|pantry|produce|food shelf|food costs?|fresh food)\b/i,
  milk:/\b(milk|cartons?|dairy|refrigerat|channel one|food shelf grant)\b/i,
  care:/\b(care network|support network|neighborly help|community care|companionship|isolat|mutual aid)\b/i,
  artists:/\b(artist|artwork|exhibit|mural|music|festival|creative|performer|gallery)\b/i,
  park:/\b(park|cleanup|environment|trail|stewardship|river|green space|compost)\b/i,
  church:/\b(church|worship|congregat|faith community|chapel|parish)\b/i
});
const EMAIL=/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const PHONE=/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/;
const ADDRESS=/\b\d{2,6}\s+[A-Za-z][A-Za-z.\s]{3,35}\s+(?:st|street|rd|road|ave|avenue|blvd|drive|dr|lane|ln|court|ct)\b/i;
const KEY=/(?:bearer\s+[-\w]{16,}|(?:sk|sb|ghp|gho|github_pat|eyJ)[-_A-Za-z0-9]{24,})/i;
const URL=/https?:\/\/|www\./i;
const CASE=/\b(my (?:ex|wife|husband|daughter|son|child|custody|court|case)|i (?:was|am|have been) (?:abused|assaulted|stalked|threatened)|restraining order|DANCO|police report|my home address)\b/i;
const BAD=/[\u0000-\u001f\u007f]/;
const own=o=>o&&typeof o==='object'&&!Array.isArray(o);
const nowIso=v=>v instanceof Date&&!Number.isNaN(+v)?v.toISOString():(()=>{throw Error('INVALID_DATE')})();
const copy=s=>s.replace(/\s+/g,' ').trim();
function safeQuestion(text){
  if(typeof text!=='string')throw Error('QUESTION_REQUIRED');
  if(BAD.test(text))throw Error('QUESTION_CONTROL_CHARACTERS');
  const q=copy(text);
  if(q.length<12||q.length>280)throw Error('QUESTION_LENGTH_12_TO_280');
  if(EMAIL.test(q)||PHONE.test(q)||ADDRESS.test(q)||KEY.test(q)||URL.test(q))
    throw Error('PRIVATE_CONTACT_OR_SECRET_REFUSED');
  return q;
}
export function classifyArea(text){
 if(typeof text!=='string')return null;
 const counts=Object.entries(HINTS).filter(([,r])=>r.test(text)).map(([id])=>id);
 if(counts.includes('milk'))return 'milk'; // specific supply chain beats general grocery
 if(counts.length===1)return counts[0];
 // Multi-topic choices should be made by a person; no arbitrary automatic assignment.
 return null;
}
export function composePublicFirstYes({
  question,thread='auto',capacity='listen',history=null,historyState='NOT_REQUESTED',
  allPagesRead=false,now=new Date()
}={}){
 const q=safeQuestion(question),date=nowIso(now);
 if(!Object.hasOwn(CAPACITIES,capacity))throw Error('UNSUPPORTED_CAPACITY');
 if(thread!=='auto'&&!Object.hasOwn(THREADS,thread))throw Error('UNSUPPORTED_TOPIC');
 if(!['NOT_REQUESTED','PUBLIC_REVIEWED_LOADED','PUBLIC_HISTORY_UNAVAILABLE'].includes(historyState))
   throw Error('BAD_SOURCE_STATUS');
 if(historyState==='PUBLIC_REVIEWED_LOADED'&&!Array.isArray(history))
   throw Error('REVIEWED_HISTORY_REQUIRED');
 if(historyState!=='PUBLIC_REVIEWED_LOADED'&&history!==null)throw Error('UNREQUESTED_HISTORY_CANNOT_ENTER');
 const topic=thread==='auto'?classifyArea(q):thread;
 const privacy=CASE.test(q);
 // Do not project an intimate first-person account into a public participation artifact.
 if(privacy)return Object.freeze({
  schema:FIRST_YES_PUBLIC_SCHEMA,standing:'PRIVATE_PATH_HOLD',
  question:null,topic:null,createdAt:date,
  heading:'Keep your personal story in your own hands',
  explanation:'This public workbench is for community-level questions, not personal case histories. Nothing was sent or saved here. Use the separate local-only Still Here tools if appropriate.',
  referral:'/still-here/',canExport:false,
  authority:{contactMade:false,backendRead:false,personAssigned:false,workCompleted:false}
 });
 if(!topic)return Object.freeze({
  schema:FIRST_YES_PUBLIC_SCHEMA,standing:'TOPIC_NEEDS_HUMAN_CHOICE',
  question:null,topic:null,createdAt:date,
  heading:'Choose the right subject first',
  explanation:'This question does not clearly map to one of the public Workboard areas. Select an area yourself or use the general Ask JAR;VIS doorway. No community goal was assumed.',
  referral:'/',canExport:false,
  authority:{contactMade:false,backendRead:false,personAssigned:false,workCompleted:false}
 });
 let summary=null;
 if(historyState==='PUBLIC_REVIEWED_LOADED'){
  const results=summarizeHistory(history,{scope:topic,allPagesRead,now});
  summary=results[0];
 }
 const reviewed=Boolean(summary?.reviewedCount);
 const evidence=reviewed?{
  status:'HUMAN_REVIEWED_PUBLIC_COMMENT_NOT_INDEPENDENTLY_VERIFIED',
  reviewedEntryId:summary.anchor?.id??null,
  reviewedEntryKind:summary.anchor?.kind??null,
  publishedAt:summary.anchor?.publishedAt??null,
  coverage:summary.coverage
 }:{
  status:historyState==='NOT_REQUESTED'?'EDITORIAL_ONLY_PUBLIC_HISTORY_NOT_REQUESTED':
   historyState==='PUBLIC_HISTORY_UNAVAILABLE'?'EDITORIAL_ONLY_PUBLIC_HISTORY_UNAVAILABLE':
   'EDITORIAL_ONLY_NO_REVIEWED_ENTRIES_IN_LOADED_HISTORY',
  reviewedEntryId:null,reviewedEntryKind:null,publishedAt:null,
  coverage:historyState==='PUBLIC_REVIEWED_LOADED'?(summary?.coverage||'UNKNOWN'):'NOT_LOADED'
 };
 const context=THREADS[topic],tool=CAPACITIES[capacity];
 const basis=reviewed?summary.next.text:context.starter;
 const userQ=q; // only local, never goes to public API or a URL
 const url='/board/#v=1&topic='+topic; // no question or contact details in links
 return Object.freeze({
  schema:FIRST_YES_PUBLIC_SCHEMA,standing:'PUBLIC_DRAFT_PREPARED_UNSENT',
  question:userQ,topic,topicLabel:context.name,createdAt:date,
  capacity:tool.label,publicSource:evidence,
  observations:[
    'The visitor asked a question in this browser; it has not been submitted.',
    reviewed?'A human-reviewed public Workboard contribution exists. Its claims remain unverified.':
      'No reviewed community contribution was used as evidence for this draft.',
    'The public workbench did not contact the private Campfire Firebox or use its administrator key.'
  ],
  firstYes:{
    headline:reviewed?summary.next.headline:'Find the first willing witness',
    first15Minutes:tool.start,
    next90Minutes:tool.then,
    next24Hours:'Ask one willing person whether this precise question is worth a bounded, reversible experiment: '+basis,
    voluntaryInvitation:'Would you be willing to improve this question or try one small piece? '+context.starter+' No obligation; saying no is useful information.',
    permissionGate:context.gate+' Ask before using anyone’s name, time, organization, tools, or private information.',
    whatWouldCount:'A person freely chooses whether to review the draft, and one independently attributable observation or correction is recorded. An unsent card is not a completed action.',
    returnQuestions:['What actually happened?','What remains unverified?','Who, if anyone, wants to continue?'],
    sourceNote:reviewed?'Reviewed for publication is not verification of facts, partner involvement, identity, or delivery.':
      'Editorial starting point only. No community activity or partner permission established.'
  },
  destinations:{reviewedWorkboardThread:url,privateSupport:'/still-here/'},
  authority:{
   inputSentToServer:false,ownerFireboxQueried:false,administratorCredentialUsed:false,
   consentReceived:false,contactMade:false,personAssigned:false,
   partnerAffiliationEstablished:false,physicalProvisionVerified:false,
   workCompleted:false,publicPosted:false,projectCanonChanged:false
  },
  nextGate:'THE_VISITOR_REVIEWS_THE_DRAFT_AND_CHOOSES_IF_ANYONE_SHOULD_BE_ASKED'
 });
}
export function printablePublicFirstYes(kit){
 if(kit?.schema!==FIRST_YES_PUBLIC_SCHEMA||kit.standing!=='PUBLIC_DRAFT_PREPARED_UNSENT')
   throw Error('NO_PRINTABLE_FIRST_YES');
 const f=kit.firstYes,p=kit.publicSource;
 return [
  'ABUNDENT · THE FIRST YES','ONE USEFUL THING · PUBLIC-SAFE WORK CARD','',
  'Status: DRAFT / UNSENT / NO AUTHORITY',
  'Created: '+kit.createdAt,
  'Question (provided locally): '+kit.question,
  'Area: '+kit.topicLabel+' · Capacity: '+kit.capacity,'',
  'WHY THIS STEP',
  f.headline,'',
  'EVIDENCE STATUS',
  p.status,
  p.reviewedEntryId?'Reviewed public contribution ID: '+p.reviewedEntryId:'No reviewed contribution used as evidence.',
  'Coverage: '+p.coverage,
  f.sourceNote,'',
  'FIRST 15 MINUTES',f.first15Minutes,'',
  'NEXT 90 MINUTES',f.next90Minutes,'',
  'WITHIN 24 HOURS',f.next24Hours,'',
  'ASK PERMISSION BEFORE ACTING',f.permissionGate,'',
  'VOLUNTARY INVITATION · NOT SENT',f.voluntaryInvitation,'',
  'WHAT WOULD COUNT?',f.whatWouldCount,'',
  'RETURN THE LEARNING',
  ...f.returnQuestions.map(x=>'[  ] '+x),
  'Fruit: ____________________    Seed: ____________________',
  'Compost / what changed: ____________________','',
  'Discuss the public question: '+kit.destinations.reviewedWorkboardThread,
  'No messages sent, no people enrolled, no backend records written.',
  'No private Firebox query, real-world delivery, partner decision or organization endorsement.',
  'INTEGRITY > CONTINUITY'
 ].join('\n')+'\n';
}
