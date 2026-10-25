// CAMPFIRE-022 · The right to try: voluntary interest, bounded action, an honest return.
// Not Coalition enrollment, a roster, a credential, ownership, or a verification service.
import {roleForQuestion,getRole} from '../role-seeds.mjs';

export const CIRCLES=Object.freeze([
 {id:'curious',label:'I am curious',short:'Listen',symbol:'◌',verb:'Explore the question',
  promise:'No work promised. A curious person can still change the plan.',
  guide:'Write down one concrete question. Read what is already known, and what remains uncertain.'},
 {id:'helper',label:'I could help',short:'Contribute',symbol:'✳',verb:'Offer a bounded contribution',
  promise:'One useful offer, with a limit. Helping is not an open-ended obligation.',
  guide:'Choose one resource or thirty-minute task you really can offer. Let someone decline it.'},
 {id:'starter',label:'I would try something',short:'Try',symbol:'✦',verb:'Start a reversible experiment',
  promise:'You may start a draft or a conversation now, without appointing yourself over others.',
  guide:'Make the smallest safe, reversible draft or question. Invite one interested person to improve it.'},
 {id:'coordinator',label:'I would help coordinate',short:'Gather',symbol:'◎',verb:'Help others choose a first step',
  promise:'Leadership is willingness to take responsibility, not automatic authority over other people.',
  guide:'Write a specific invitation, make space for one or two replies, and explicitly allow refusals.'}
].map(x=>Object.freeze(x)));
export const FIRES=Object.freeze([
 {id:'garden',name:'The Garden Table',focus:'Can interested neighbors discover one useful, safe food-access experiment?',
  prompt:'Could we explore one practical food-access question together?',
  description:'Growing food, access, local purchasing, surplus and a grocery future.',
  role:'food-bridge',field:'food',badge:'FOOD × NEIGHBORS',icon:'◉'},
 {id:'coalition',name:'The Care Campfire',focus:'What one specific gap could willing neighbors investigate across existing efforts?',
  prompt:'What one small local need could willing people help investigate?',
  description:'People and organizations crossing paths through one useful question.',
  role:'question-listener',field:'commons',badge:'CARE × CONNECTION',icon:'✳'},
 {id:'music',name:'The Porch Chorus',focus:'What welcoming, voluntary music-sharing experiment could willing people shape?',
  prompt:'Could willing musicians explore one welcoming song-sharing experiment?',
  description:'Songs, listening rooms, friendly jam circles and a creative commons.',
  role:'song-circle',field:'music',badge:'MUSIC × WELCOME',icon:'♪'},
 {id:'park',name:'The Park Quest',focus:'Could interested neighbors explore one safe, permission-first stewardship action?',
  prompt:'What safe park-care idea could volunteers propose to a site owner?',
  description:'Shared outdoor spaces, responsible cleanups, and practical conservation.',
  role:'park-quest',field:'care',badge:'PLACES × STEWARDSHIP',icon:'❋'},
 {id:'repair',name:'The Repair Lantern',focus:'Could a few neighbors sketch one safe repair-table experiment?',
  prompt:'Can we draft one safe repair learning-table experiment?',
  description:'Tools, practical skill-sharing, and fixing what can be fixed safely.',
  role:'repair-table',field:'repair',badge:'TOOLS × USEFUL WORK',icon:'⚙'}
].map(x=>Object.freeze(x)));
const CIRCLE_BY_ID=new Map(CIRCLES.map(c=>[c.id,c]));
const FIRE_BY_ID=new Map(FIRES.map(f=>[f.id,f]));
const EMAIL=/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const PHONE=/(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}/;
const PRIVATE=/\b(?:password|api[_ -]?key|access[_ -]?token|social security|ssn|private key|my address)\s*[:=]?\s*\S+/i;
const CONTROL=/[\u0000-\u001f\u007f]/;
const ADDRESS=/\b\d{1,5}\s+(?:[A-Za-z]+\s+){0,4}(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln)\b/i;
export function validPurpose(input){
 return typeof input==='string'&&input.trim()===input&&input.length>=8&&input.length<=220
  &&!CONTROL.test(input)&&!EMAIL.test(input)&&!PHONE.test(input)&&!PRIVATE.test(input)&&!ADDRESS.test(input);
}
export function chooseCircle(id){return CIRCLE_BY_ID.get(id)||null;}
export function chooseFire(id){return FIRE_BY_ID.get(id)||null;}
export function makeFire({seed='garden',purpose='',custom=false}={}){
 const template=chooseFire(seed);
 if(custom===true){
  if(!validPurpose(purpose))throw Error('PUBLIC_SAFE_PURPOSE_REQUIRED');
  const role=roleForQuestion(purpose);
  return Object.freeze({id:'custom',name:'A New Campfire',focus:purpose,
   prompt:purpose,description:'A topic proposed by one visitor; no existing project or participants are implied.',
   field:'open',role:role.id,badge:'OPEN QUESTION × ONE FIRST STEP',icon:'✦',custom:true});
 }
 if(!template)throw Error('UNKNOWN_FIRE');
 return template;
}
export function makeFireLink(currentUrl,fire){
 if(!fire||(!chooseFire(fire.id)&&fire.id!=='custom'))throw Error('UNKNOWN_FIRE');
 const url=new URL(currentUrl);
 if(url.protocol!=='https:'&&url.hostname!=='localhost')throw Error('HTTPS_REQUIRED');
 url.pathname='/campfire/';url.search='';
 const payload={v:'1',fire:fire.id};
 if(fire.id==='custom'){
  if(!validPurpose(fire.focus))throw Error('PUBLIC_SAFE_PURPOSE_REQUIRED');
  payload.q=fire.focus;
 }
 url.hash=new URLSearchParams(payload).toString();
 return url.toString();
}
export function readFireLink(hash){
 if(typeof hash!=='string'||hash.length>1250||!hash.startsWith('#'))return null;
 const params=new URLSearchParams(hash.slice(1));
 const keys=[...params.keys()].sort();
 if(params.getAll('v').length!==1||params.get('v')!=='1'||params.getAll('fire').length!==1)return null;
 const id=params.get('fire');
 if(id==='custom'){
  if(keys.join(',')!=='fire,q,v'||params.getAll('q').length!==1)return null;
  try{return makeFire({custom:true,purpose:params.get('q')});}catch{return null;}
 }
 if(keys.join(',')!=='fire,v')return null;
 return chooseFire(id);
}
export function drawFirstMove(fire,circleId){
 if(!fire)throw Error('FIRE_REQUIRED');
 const circle=chooseCircle(circleId);
 if(!circle)throw Error('CIRCLE_REQUIRED');
 const role=getRole(fire.role);
 if(!role)throw Error('ROLE_REQUIRED');
 const first=circle.id==='curious'
  ?'Write one thing you hope to learn about this question, without assigning anybody a job.'
  :circle.id==='helper'
    ?'Offer one small piece of time, materials or skill. Say exactly what you can and cannot offer.'
    :circle.id==='starter'
      ?role.starter
      :'Draft one invitation that asks for feedback and makes refusal easy. Invite one person, or up to two, only by your choice.';
 const actions=[
  {id:'prepare',name:'Make a useful first object',detail:first},
  {id:'invite',name:'Make a voluntary opening',detail:
   circle.id==='curious'
    ?'If you want, share the question with one person; no answer is owed.'
    :'Offer another person a chance to edit, assist, decline or send an ambassador in their place.'},
  {id:'return',name:'Notice what actually happened',detail:
   'Record an actual reply, objection, refusal or question. Do not infer acceptance from silence.'}
 ];
 return Object.freeze({schema:'abundent/campfire-first-move-v1',
  fire:{id:fire.id,title:fire.name,focus:fire.focus,role:role.id},
  standing:{id:circle.id,label:circle.label,authority:'NONE',selfSelected:true},
  first,
  invitation:makeInvitation(fire,circle.id),
  actions,role:{id:role.id,name:role.name,open:true,starter:role.starter,
    boundary:role.boundary},
  guardrails:[
   'This standing applies only to this proposed Abundent question, not to Coalition of Care or another organization.',
   'Exploring and drafting do not grant authority over people, venues, food, safety decisions, finances, or other organizations.',
   'Every person decides for themselves whether to join, leave, change roles or say no.'
  ],
  origin:'EDITORIAL_FIRST_MOVE_NOT_A_VERIFIED_COMMUNITY_COMMITMENT',
  dateWindowDays:7});
}
export function makeInvitation(fire,circleId,ambassador=false){
 if(!fire||!chooseCircle(circleId))throw Error('INVITATION_INPUT');
 const circle=chooseCircle(circleId);
 const intro=ambassador
  ?'If this question interests you but you cannot participate, you may pass it to an interested person with their permission.'
  :'I am exploring a small question and would welcome your thoughts. There is no signup requirement.';
 return [
  'AN OPEN CAMPFIRE — '+fire.name,
  '',
  intro,
  'Question: '+fire.focus,
  'I would stand here: '+circle.label+'.',
  'We could start with a seven-day listening-and-learning experiment, not a permanent committee.',
  'If you want, reply with one possible contribution, a concern, or an alternative.',
  'You may invite up to two others by choice, or send an ambassador in your place.',
  '',
  'This is an independent Abundent invitation, not an event announcement, an official Coalition of Care membership, a volunteer assignment or permission to act on any property.',
  'No reply is required; silence is not consent.'
 ].join('\n');
}
export const OUTCOMES=Object.freeze([
 ['NOT_STARTED','Not started'],['DRAFTED','I made a draft'],['SHARED','I chose to invite someone'],
 ['QUESTIONED','Someone raised a question'],['DECLINED','Someone declined'],
 ['REVIEWED','Received feedback'],['SAFE_TRIAL','I tried an appropriately permitted small experiment'],
 ['PAUSED','I stepped back / paused']
]);
const VALID_OUTCOMES=new Set(OUTCOMES.map(x=>x[0]));
export function makePersonalReceipt(fire,circleId,done=[],outcome='NOT_STARTED',date=new Date()){
 const move=drawFirstMove(fire,circleId);
 if(!Array.isArray(done)||done.length>3||done.some(id=>!move.actions.some(a=>a.id===id)))
  throw Error('INVALID_PERSONAL_ACTIONS');
 if(!VALID_OUTCOMES.has(outcome))throw Error('INVALID_PERSONAL_OUTCOME');
 if(!(date instanceof Date)||!Number.isFinite(date.valueOf()))throw Error('INVALID_TIME');
 return {schema:'abundent/campfire-local-receipt-v1',
  status:'SELF_REPORTED_ONLY_NOT_VERIFIED',stored:'DOWNLOAD_ONLY',createdAt:date.toISOString(),
  fire:{id:fire.id,focus:fire.focus},standing:{id:circleId,label:move.standing.label},
  checkedSteps:[...new Set(done)],selfReportedOutcome:outcome,
  authority:'NONE',participantsVerified:0,contactSentBySite:false,
  transferableStatus:false,
  note:'A local reflection, not a record of another person consenting or a result being independently verified.'};
}
export function makeTableQuestion(fire){
 if(!fire)throw Error('FIRE_REQUIRED');
 const input=fire.prompt||fire.focus;
 // The existing /tables/ shareable question has a 360-char limit and is fragment-only.
 if(!validPurpose(input))throw Error('TABLE_QUESTION_UNSAFE');
 return input;
}

// A bridge is an editorial proposal between two QUESTIONS, never a claim of
// shared people, resources, partner approval, affiliation or a verified coalition.
const BRIDGES=Object.freeze({
 'coalition+garden':{
  title:'The Food-Access Listening Table',
  useful:'A one-page question card can let neighbors and willing organizers identify a particular food-access barrier.',
  artifact:'Draft an anonymous, hypothetical needs-and-offers card for two independent reviewers.',
  gate:'Do not treat Coalition or grocery organizers as committed partners. Obtain separate permission for any event, data use or food handling.'
 },
 'garden+music':{
  title:'A Song and a Question',
  useful:'A musician could help make an optional listening invitation more welcoming while food-access questions stay specific.',
  artifact:'Draft one question card and one optional song-sharing invitation, without promising food or a venue.',
  gate:'No church, musicians, landowner or grocery sponsor is assumed. Rights and safe food-handling are separately governed.'
 },
 'garden+park':{
  title:'Garden Meets Stewardship',
  useful:'Food-growing curiosity and stewardship skills might overlap around land use, gleaning or outdoor public learning.',
  artifact:'Write down one public land-use question and which land/food permissions would be necessary.',
  gate:'Never harvest, plant or distribute food on property without its owners and qualified food-safety review.'
 },
 'garden+repair':{
  title:'Food Access, Meet Useful Tools',
  useful:'One useful material barrier could be equipment, safe storage or access to affordable tools.',
  artifact:'Draft a no-names inventory question about one obstacle, without accepting equipment or offering repairs.',
  gate:'No food-cold-chain or electrical work before appropriate qualifications and authorization.'
 },
 'coalition+music':{
  title:'A Listening Table That Sings',
  useful:'Creative participation could help interested people meet across otherwise separate community concerns.',
  artifact:'Draft an invitation to one listening-and-story exchange and ask whether anyone wants to co-design it.',
  gate:'No group, performer or venue is automatically represented; sharing stories needs explicit consent.'
 },
 'coalition+park':{
  title:'Care in the Open Air',
  useful:'A small stewardship task could give a willing network a visible, useful first shared experiment.',
  artifact:'Draft a 30-minute permission-first park-care question card, without announcing a cleanup.',
  gate:'Only the actual land manager can approve work and disposal rules.'
 },
 'coalition+repair':{
  title:'One Tool, One Useful Need',
  useful:'An open question about skills and useful objects can help prospective helpers discover an appropriate need.',
  artifact:'Draft a no-identities tool-and-skill matching question and ask one volunteer to critique it.',
  gate:'Do not promise repairs, collect private cases or assume skill qualifications.'
 },
 'music+park':{
  title:'The Listening Walk',
  useful:'Environmental care and music might share a low-pressure conversation or artistic invitation.',
  artifact:'Sketch a tiny acoustic listening-walk question, with no announced public gathering.',
  gate:'Check public land event rules and artistic permissions before inviting participants.'
 },
 'music+repair':{
  title:'The Broken Radio Choir',
  useful:'Audio curiosity may connect repair learners and local musicians around a benign demonstration.',
  artifact:'Ask whether a paper-only sketch of a low-voltage audio device would interest anyone.',
  gate:'No mains-electrical work, public event or implied repair liability.'
 },
 'park+repair':{
  title:'The Stewardship Toolkit',
  useful:'Safe tools and clear site permission might help someone improve a small public-space care task.',
  artifact:'Make a checklist of possible tools, hazards and the owner permission required.',
  gate:'No hazardous-waste handling, unapproved site work or risky equipment.'
 }
});
export function weaveFires(first,second){
 if(!first||!second||first.id===second.id)throw Error('TWO_DISTINCT_FIRES_REQUIRED');
 const a=chooseFire(first.id)||first, b=chooseFire(second.id)||second;
 if(!a.role||!b.role||!getRole(a.role)||!getRole(b.role))throw Error('UNKNOWN_WEAVE_ROLE');
 if(a.id==='custom'&&!validPurpose(a.focus))throw Error('UNSAFE_FIRE_A');
 if(b.id==='custom'&&!validPurpose(b.focus))throw Error('UNSAFE_FIRE_B');
 const id=[a.id,b.id].sort().join('+');
 const suggestion=BRIDGES[id]||{
  title:'Two Fires, One Shared Question',
  useful:'These two interests might help one another. That is a hypothesis to test, not a connection established.',
  artifact:'Draft one sentence explaining what each topic might contribute. Invite one person to revise the idea.',
  gate:'No organizations or people are joined by this suggestion. Any real action requires the relevant owners’ consent.'
 };
 return {
  schema:'abundent/campfire-bridge-v1',status:'UNVERIFIED_POSSIBLE_CONNECTION',
  fires:[{id:a.id,focus:a.focus,openRole:a.role},{id:b.id,focus:b.focus,openRole:b.role}],
  title:suggestion.title,why:suggestion.useful,
  firstArtifact:suggestion.artifact,gate:suggestion.gate,
  firstTest:'Offer the draft question for optional review. One useful response is enough to learn from.',
  commitment:'NONE',authority:'NONE',sharedParticipants:0,verifiedPartners:0
 };
}
