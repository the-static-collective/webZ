// BOARD-024 · Conversation → opportunity → small work → returned learning.
// Public starter cards are editorial prompts, NEVER evidence of an approved
// partnership, action taken, or an existing participant's commitment.
import {roleForQuestion} from '../role-seeds.mjs';
import {makeFire,makeFireLink} from '../campfire/model.mjs';

export const KINDS=Object.freeze([
 {id:'question',label:'Ask or investigate',verb:'Investigate this'},
 {id:'concern',label:'Challenge the plan',verb:'Test an objection'},
 {id:'offer',label:'Offer a bounded contribution',verb:'Shape an offer'},
 {id:'proposal',label:'Propose a small experiment',verb:'Draft a trial'},
 {id:'return',label:'Report something that actually happened',verb:'Record a return'}
]);
const TYPES=new Map(KINDS.map(x=>[x.id,x]));
export const OPPORTUNITIES=Object.freeze([
 {id:'grocery',category:'FOOD · WASECA',title:'What could a community grocery do first?',
  question:'What useful food-access experiment could willing neighbors try before a store opens?',
  known:'A community grocery idea is being discussed in Waseca. This card does not speak for its organizers.',
  missing:'Which particular need and willing steward could support a permissioned small trial?',
  first:'Draft a one-page public question card and ask one willing neighbor to improve it.',
  gate:'No co-op membership, fundraising, food handling, official statements or partner commitments are authorized by this card.',
  source:'EDITORIAL_OPEN_QUESTION',fire:'garden',doors:['/campfire/','/tables/','/tomorrow.html']},
 {id:'milk',category:'FOOD · SUPPLY',title:'A milk-supply question worth verifying',
  question:'Could a possible change in milk purchasing reveal an opportunity for a practical supply experiment?',
  known:'A conversation suggested a food shelf may soon need to buy milk previously supported by a grant. This is an unverified lead, not a confirmed funding deadline.',
  missing:'Confirm the grant details, present buyer, volumes, rules, responsible staff, and whether help is wanted.',
  first:'Write three clarification questions, then request a conversation with an authorized food-shelf contact.',
  gate:'Do not name recipients, solicit money, approach suppliers on an organization’s behalf, promise deliveries, or handle food without approval.',
  source:'SECONDHAND_UNVERIFIED_REPORT',fire:'garden',doors:['/campfire/','/tables/']},
 {id:'care',category:'CARE · CONNECTION',title:'Where do two good efforts miss one another?',
  question:'Which one overlapping local need and offer could willing people investigate together?',
  known:'Independent community groups and interested residents have discussed cross-project connections. No group has authorized a shared project here.',
  missing:'One concrete overlap, a responsible contact willing to listen, and a reversible first step.',
  first:'Draft an anonymous need × offer card and invite one interested person to correct it.',
  gate:'Preserve each organization’s independence. No personal stories, cross-list rosters, or implied affiliation.',
  source:'EDITORIAL_OPEN_QUESTION',fire:'coalition',doors:['/campfire/','/roles/','/weave/']},
 {id:'artists',category:'ART · BELONGING',title:'What would artists organize for themselves?',
  question:'What would a useful artist-led gathering look like if practicing artists designed it?',
  known:'A local arts-gathering idea has been discussed. No venue or artist is committed.',
  missing:'Interested artists’ actual preferences, host permission, accessibility, and a manageable first gathering.',
  first:'Ask one interested artist what would make a gathering worth attending, including reasons not to attend.',
  gate:'No venue reservation, publicity using others’ names, rights to art, or claim of event approval.',
  source:'EDITORIAL_OPEN_QUESTION',fire:'music',doors:['/campfire/','/roles/','/tables/']},
 {id:'park',category:'LAND · STEWARDSHIP',title:'Could a park become a care quest?',
  question:'How could people propose a responsible, measurable park-care experiment?',
  known:'A real-world stewardship quest has been proposed; that proposal is not permission from a land manager.',
  missing:'Site-owner permission, suitable low-risk tasks, safety supervision, and an outcome measurement.',
  first:'Draft one cleanup proposal and a permission checklist; invite the property steward to review it.',
  gate:'Never enter restricted sites, handle hazards, or represent volunteer/funding commitments without approval.',
  source:'EDITORIAL_OPEN_QUESTION',fire:'park',doors:['/campfire/','/roles/']},
 {id:'church',category:'COMMUNITY · TABLE',title:'How could churches cooperate without taking over?',
  question:'Could willing congregations explore supporting local food access while keeping an open community table?',
  known:'A church-community partnership is a proposed experiment. No congregation has accepted this invitation.',
  missing:'Willing contacts, governance safeguards, meaningful options for nonchurch participants, and independently authorized steps.',
  first:'Draft an invitation for a conversation, explicitly welcoming differing views and no commitment.',
  gate:'No church, pastor, congregation or cooperative is represented here; religious participation is never a condition for community help.',
  source:'EDITORIAL_OPEN_QUESTION',fire:'coalition',doors:['/campfire/','/tables/','/contact/']}
].map(o=>Object.freeze({...o,doors:Object.freeze(o.doors)})));
const BY_ID=new Map(OPPORTUNITIES.map(x=>[x.id,x]));
const PRIVATE=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|https?:\/\/|www\.|\b\d{1,5}\s+(?:[a-z]+\s+){0,4}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b|\b(?:password|api[_ -]?key|access[_ -]?token|ssn|private key)\b)/i;
const CONTROL=/[\u0000-\u001f\u007f]/;
export function publicSafeText(input,min=12,max=260){
 return typeof input==='string'&&input===input.trim()&&input.length>=min&&input.length<=max
  &&!CONTROL.test(input)&&!PRIVATE.test(input);
}
export const getOpportunity=id=>BY_ID.get(id)||null;
export function newOpportunity(question){
 if(!publicSafeText(question,12,220))throw Error('PUBLIC_SAFE_QUESTION_REQUIRED');
 return Object.freeze({id:'open',category:'NEW QUESTION · NOT PUBLISHED',
  title:'An open question from a visitor',question,
  known:'This question was drafted by the visitor on their device. It has not been submitted or independently reviewed.',
  missing:'What is already known? Who, if anyone, wants to explore it?',
  first:'Write the smallest useful clarification question or reversible draft.',
  gate:'Do not imply partner or participant consent; get authorization for consequential actions.',
  source:'VISITOR_LOCAL_DRAFT',fire:'custom',doors:Object.freeze(['/campfire/','/tables/'])});
}
export function opportunityLink(base,topic){
 const url=new URL(base);
 if(url.protocol!=='https:'&&url.hostname!=='localhost')throw Error('HTTPS_REQUIRED');
 url.pathname='/board/';url.search='';
 const p=new URLSearchParams({v:'1',topic:topic.id});
 if(topic.id==='open'){if(!publicSafeText(topic.question,12,220))throw Error('INVALID_TOPIC');p.set('q',topic.question);}
 else if(getOpportunity(topic.id)!==topic)throw Error('UNKNOWN_TOPIC');
 url.hash=p.toString();return url.toString();
}
export function readOpportunityLink(hash){
 if(typeof hash!=='string'||hash.length>1300||!hash.startsWith('#'))return null;
 const p=new URLSearchParams(hash.slice(1));
 if(p.getAll('v').length!==1||p.get('v')!=='1'||p.getAll('topic').length!==1)return null;
 const topic=p.get('topic'),keys=[...p.keys()].sort().join(',');
 if(topic==='open'&&keys==='q,topic,v'&&p.getAll('q').length===1){
  try{return newOpportunity(p.get('q'));}catch{return null;}
 }
 if(keys!=='topic,v')return null;
 return getOpportunity(topic);
}
export function composeContribution(topic,kind,text,when=new Date()){
 if(!topic||(!getOpportunity(topic.id)&&topic.id!=='open')||!TYPES.has(kind))
  throw Error('INVALID_CONTRIBUTION');
 if(!publicSafeText(text,12,260))throw Error('PUBLIC_SAFE_TEXT_REQUIRED');
 if(!(when instanceof Date)||!Number.isFinite(+when))throw Error('INVALID_DATE');
 const followup={
  question:'Find a source, ask permission, or sharpen the unknown before asserting an answer.',
  concern:'State a way to test or address this objection. Disagreement is not obstruction.',
  offer:'Make the offer bounded: time, skill, limit, and the separate permissions needed.',
  proposal:'Make one reversible seven-day experiment with a responsible human review gate.',
  return:'Distinguish what you personally observed from what you inferred. A self-report is not verified.'
 };
 return Object.freeze({schema:'abundent/board-contribution-v1',topic:{id:topic.id,question:topic.question},
  kind,text,createdAt:when.toISOString(),next:followup[kind],
  status:'LOCAL_DRAFT_NOT_SUBMITTED',authority:'NONE',verified:false,participantCommitments:0,
  humanReviewRequired:true});
}
export function invitationText(topic,entry=null){
 if(!topic)throw Error('TOPIC_REQUIRED');
 if(entry&&(entry.topic.question!==topic.question||entry.status!=='LOCAL_DRAFT_NOT_SUBMITTED'))throw Error('INVALID_ENTRY');
 return [
  'AN OPEN QUESTION · ABUNDENT',
  topic.title,'',topic.question,'',
  'What we currently know: '+topic.known,
  'What remains open: '+topic.missing,
  'Possible first move: '+topic.first,
  entry?'A visitor drafted this '+TYPES.get(entry.kind).label.toLowerCase()+': '+entry.text:'',
  entry?'Next: '+entry.next:'',
  'Would you like to improve, challenge, help explore, or decline this idea?',
  'Invite up to two interested people if you choose. An ambassador can carry the question instead.',
  '',
  'Independent Abundent discussion draft. No other organization, partner, volunteer, or outcome is implied. Silence is not consent.'
 ].filter(x=>x!==null).join('\n');
}
export function campfireDoor(base,topic){
 const fire=topic.id==='open'?makeFire({custom:true,purpose:topic.question}):makeFire({seed:topic.fire});
 return makeFireLink(base,fire);
}
export function mapHandoff(topic,kind){
 if(!topic||!TYPES.has(kind))throw Error('BAD_HANDOFF');
 const role=roleForQuestion(topic.question);
 return Object.freeze({stage:'DRAFT',kind,role:role.id,question:topic.question,
  destination:kind==='return'?'REVIEW_OR_PRIVATE_JOURNAL':kind==='concern'?'TEST_OBJECTION':'SEVEN_DAY_EXPERIMENT',
  requiresHumanConsent:true,publication:'NONE',outcome:'UNVERIFIED'});
}
