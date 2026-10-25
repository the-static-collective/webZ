// STEWARD-SEEDS-021 · Make a role possible without inventing its occupant.
// Role interest is not appointment. Operational authority remains with owners.
export const ROLES = Object.freeze([
 {id:'food-bridge',name:'Food Bridge Starter',lane:'grocery',
  intro:'Help design the first safe question between people with surplus and people working on food access.',
  starter:'Draft a one-page question about one possible food-access problem and invite a person to improve it.',
  trial:'Collect one voluntary answer about what should be explored. Do not handle or promise food.',
  boundary:'Food handling, recipient data, distribution, funding and access require separate competent, authorized people.',
  keywords:['grocery','food','produce','pantry','tomato','food shelf','milk','garden','harvest','meal','fruit'],
  interest:'grocery'},
 {id:'invitation-weaver',name:'Invitation Weaver',lane:'gather',
  intro:'Help people turn loose interest into one small, welcoming invitation.',
  starter:'Write a three-sentence invitation to discuss one particular need. Leave time and location open.',
  trial:'Ask one consenting person to revise the invitation, then record the correction.',
  boundary:'No event, venue, congregation or organization is committed until its responsible people agree.',
  keywords:['invite','invitation','community','meeting','member','social media','poster','printer','flyer','table','group'],
  interest:'potluck'},
 {id:'song-circle',name:'Song Circle Starter',lane:'music',
  intro:'Help willing musicians discover an approachable way to make or share one song.',
  starter:'Draft a fifteen-minute listening or playing format with no promised venue.',
  trial:'Show one willing musician the draft and invite them to change it.',
  boundary:'Ask hosts for space permission and respect creators’ ownership; no church endorsement is implied.',
  keywords:['song','music','guitar','choir','worship','church','band','concert','musician'],
  interest:'arts'},
 {id:'park-quest',name:'Park Quest Explorer',lane:'stewardship',
  intro:'Help people find safe, permissioned ways to care for shared places.',
  starter:'List one possible thirty-minute cleanup and the questions a site owner must answer first.',
  trial:'Ask for feedback on the plan without entering restricted areas or handling hazards.',
  boundary:'Only land managers/site owners can approve access and disposal procedures. Do not handle sharps or hazardous material.',
  keywords:['park','trash','cleanup','litter','environment','conservation','recycle','river','cleanup'],
  interest:'volunteer'},
 {id:'repair-table',name:'Repair Table Starter',lane:'tools',
  intro:'Explore a small, safe tool-sharing or nonhazardous repair learning table.',
  starter:'Sketch a demonstration for one low-risk item and list the safety questions.',
  trial:'Ask a qualified reviewer whether the item and venue would be appropriate.',
  boundary:'Never imply insurance, repair certification or electrical safety clearance.',
  keywords:['repair','tool','fix','broken','solder','electronic','hardware','computer','laptop'],
  interest:'technology'},
 {id:'artist-porch',name:'Artist Porch Starter',lane:'arts',
  intro:'Let practicing artists design the gathering instead of recruiting them into somebody else’s plan.',
  starter:'Make an invitation asking one artist what a useful artist-led gathering would be.',
  trial:'Ask an interested artist for one preference, including the option to decline.',
  boundary:'No artist, festival, venue or partner is represented without permission.',
  keywords:['artist','arts','art','gallery','mural','paint','creative','harmony park'],
  interest:'arts'},
 {id:'question-listener',name:'Neighborhood Question Listener',lane:'commons',
  intro:'Help notice particular needs and connect them with people willing to explore them.',
  starter:'Write one question that someone could answer without giving private details.',
  trial:'Invite one person to edit or answer it; preserve their actual words only with permission.',
  boundary:'Do not collect sensitive stories, claim to speak for neighbors or publish identifying details.',
  keywords:['neighbor','help','volunteer','need','community','connect','offer','local','steward'],
  interest:'volunteer'}
].map(role=>Object.freeze({...role,keywords:Object.freeze(role.keywords)})));
export const ROLE_STATES=Object.freeze(['OPEN_ROLE','EXPLORING_INTEREST','HUMAN_REVIEW','SCOPED_TRIAL','VERIFIED_OUTCOME']);
const BY_ID=new Map(ROLES.map(r=>[r.id,r]));
const MISSION_ROLE=Object.freeze({produce:'food-bridge',invitation:'invitation-weaver',
 music:'song-circle',steward:'park-quest',repair:'repair-table',
 arts:'artist-porch',general:'question-listener'});
const SENSITIVE=/(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4})/;
export const getRole=id=>typeof id==='string'?BY_ID.get(id)||null:null;
export function roleForMission(missionId){return getRole(MISSION_ROLE[missionId])||getRole('question-listener');}
export function roleForQuestion(question){
 if(typeof question!=='string'||!question.trim()||question.length>500||SENSITIVE.test(question))
  return getRole('question-listener');
 const q=question.toLowerCase();
 const ranked=ROLES.map((role,i)=>{
  const score=role.keywords.reduce((count,key)=>{
   // literal token boundary to avoid 'art' inside 'partnership'
   const pattern=new RegExp('(^|[^a-z])'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^a-z])','i');
   return count+(pattern.test(q)?(key.length>=7?3:2):0);
  },0);
  return {role,score,i};
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 return ranked[0].score?ranked[0].role:getRole('question-listener');
}
export function firstStewardshipMove(role){
 if(!role||!BY_ID.has(role.id))throw Error('UNKNOWN_ROLE');
 return 'No existing steward required: invite an interested person (including yourself) to explore the '+role.name+
  ' role. First small task: '+role.starter+
  ' A role begins as an open invitation, not an appointment or permission to operate.';
}
export function draftRoleInvite(role,mode='self'){
 if(!role||!BY_ID.has(role.id)||!['self','peer','ambassador'].includes(mode))throw Error('INVALID_ROLE_INVITE');
 const lead=mode==='self'
  ?'I would be interested in helping shape the '+role.name+' role.'
  :mode==='ambassador'
   ?'If you cannot join this conversation, would you be willing to pass the role idea to an interested person? Only with their permission.'
   :'Would you be interested in helping shape a new '+role.name+' role? You do not need a title, experience in a committee, or an existing organization.';
 return [
  lead,
  '',
  role.intro,
  'First useful experiment: '+role.starter,
  'Possible small trial: '+role.trial,
  '',
  'Important limit: '+role.boundary,
  'This is an independent Abundent invitation to explore, not an appointment, official partnership or permission to conduct services.',
  'A yes means only that you want a conversation. A no is welcome too.'
 ].join('\n');
}
export function makeRoleLink(currentUrl,roleId,path='/roles/'){
 if(!getRole(roleId)||!['/roles/','/contact/'].includes(path))throw Error('INVALID_ROLE_LINK');
 const url=new URL(currentUrl);
 if(url.protocol!=='https:'&&url.hostname!=='localhost')throw Error('HTTPS_REQUIRED');
 url.pathname=path;url.search='';url.hash=new URLSearchParams({role:roleId}).toString();
 return url.toString();
}
export function readRoleHash(hash){
 if(typeof hash!=='string'||hash.length>96||!hash.startsWith('#'))return null;
 const v=new URLSearchParams(hash.slice(1));
 return v.size===1&&v.getAll('role').length===1?getRole(v.get('role')):null;
}
export function intakePreview(role){
 if(!role||!BY_ID.has(role.id))throw Error('INVALID_ROLE');
 return {
  interest:role.interest,
  note:'ROLE INTEREST · '+role.name+' ('+role.id+'). I am interested in exploring a small starter role. First proposal: '+
    role.starter+' I understand that this only requests private follow-up, not enrollment, site access or authority. I may revise this note.',
  status:'DRAFT_NOT_SUBMITTED'
 };
}
