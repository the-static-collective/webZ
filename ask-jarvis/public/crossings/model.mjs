// CROSSINGS-032 · local file relay across independent Abundent experiments.
// This is not a central identity, intake, messaging, or verification service.
export const SCHEMA = 'abundent/public-crossing/v0';
export const RETURN_SCHEMA = 'abundent/public-crossing-return/v0';
export const TOPICS = Object.freeze(['grocery','milk','care','artists','park','church']);
export const CAPACITIES = Object.freeze(['Listen','Research','Make a card','Gather people','Build a prototype','Make something expressive']);
export const OUTCOMES = Object.freeze({
  NOT_STARTED: 'Not started',
  INVITED: 'Invitation offered (self-reported, not accepted)',
  DECLINED: 'A person declined / no further action',
  CORRECTED: 'A correction was received (self-reported)',
  TRIED: 'A small experiment was tried (self-reported)',
  COMPLETED: 'Work was completed (self-reported, unverified)'
});
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/;
const own = (o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const isObject = o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const keys = Object.freeze(['schema','scope','standing','topic','capacity','createdAt','sourceStatus','reviewedEntryId','authority']);
const fixedAuthority=()=>({
  personAssigned:false,consentReceived:false,contactMade:false,workCompleted:false,partnerApproved:false
});
export function makeCrossing(kit, now=new Date()){
  if(kit?.schema!=='abundent/public-first-yes/v0'||kit.standing!=='PUBLIC_DRAFT_PREPARED_UNSENT')
    throw Error('NO_PUBLIC_WORK_CARD');
  if(!TOPICS.includes(kit.topic)||!CAPACITIES.includes(kit.capacity))throw Error('INVALID_PUBLIC_CONTEXT');
  const createdAt=now.toISOString();
  const entry=kit.publicSource?.reviewedEntryId;
  if(entry!=null&&(typeof entry!=='string'||!/^[\w-]{1,100}$/.test(entry)))throw Error('INVALID_REVIEW_REFERENCE');
  const packet={
    schema:SCHEMA,scope:'PUBLIC_COMMUNITY_ONLY',standing:'PROPOSED_UNSENT',
    topic:kit.topic,capacity:kit.capacity,createdAt,
    sourceStatus:String(kit.publicSource?.status||'EDITORIAL_ONLY').slice(0,90),
    reviewedEntryId:entry||null,authority:fixedAuthority()
  };
  return Object.freeze(packet);
}
export function readCrossing(raw){
  const x=typeof raw==='string'?JSON.parse(raw):raw;
  if(!isObject(x)||Object.keys(x).sort().join('|')!==[...keys].sort().join('|')||
    x.schema!==SCHEMA||x.scope!=='PUBLIC_COMMUNITY_ONLY'||x.standing!=='PROPOSED_UNSENT'||
    !TOPICS.includes(x.topic)||!CAPACITIES.includes(x.capacity)||
    typeof x.createdAt!=='string'||!ISO.test(x.createdAt)||!Number.isFinite(Date.parse(x.createdAt))||
    typeof x.sourceStatus!=='string'||!/^[-A-Z_]{4,90}$/.test(x.sourceStatus)||
    (x.reviewedEntryId!==null&&(typeof x.reviewedEntryId!=='string'||!/^[\w-]{1,100}$/.test(x.reviewedEntryId)))||
    !isObject(x.authority)||Object.keys(x.authority).sort().join('|')!==Object.keys(fixedAuthority()).sort().join('|')||
    Object.values(x.authority).some(v=>v!==false))
    throw Error('UNRECOGNIZED_OR_UNSAFE_CROSSING');
  return x;
}
export function makeReturn(packet, outcome, now=new Date()){
  const x=readCrossing(packet);
  if(!own(OUTCOMES,outcome))throw Error('INVALID_RETURN_STATUS');
  return {
    schema:RETURN_SCHEMA,scope:'SELF_REPORTED_LOCAL_ONLY',standing:'UNVERIFIED_SELF_REPORT',
    topic:x.topic,sourceCreatedAt:x.createdAt,returnedAt:now.toISOString(),outcome,
    proof:'NONE',agreementEstablished:false,automaticPublication:false,
    note:'This return is a self-report only. No named person, partner, or completed work was verified.'
  };
}
// Fixed navigation only. Never put user text, private notes or file data in URLs.
export function doorsFor(topic){
  if(!TOPICS.includes(topic))throw Error('UNKNOWN_TOPIC');
  const board={label:'Public Workboard',href:'/board/',what:'Read reviewed public discussion or separately opt in to human moderation.'};
  const camp={label:'Campfire',href:'/campfire/',what:'Explore a voluntary, bounded contribution. Nobody is appointed.'};
  const table={label:'Seven-Day Table',href:'/tables/',what:'Prepare a human-owned invitation; no participant is assumed.'};
  const weave={label:'Weaving Garden',href:'/weave/',what:'Sketch a possible connection without treating it as permission.'};
  const field={label:'Printable Field Cards',href:'https://garden.abundent.org/field/cards/',what:'Carry a question into the physical world on paper.'};
  const garden={label:'Garden Workbench',href:'https://garden.abundent.org/',what:'Explore independent food-access and supply experiments; not the co-op office.'};
  const support={label:'Still Here · private first door',href:'/still-here/',what:'Separate local-only survivor tools. Do not upload a case history.'};
  const steward={label:'Help build the support circle',href:'/still-here/start/',what:'Explore safety and stewardship roles before sensitive intake.'};
  const contact={label:'Voluntary contact desk',href:'/contact/',what:'A distinct opt-in channel; do not paste this file or private records.'};
  switch(topic){
    case 'care':return [support,steward,camp];
    case 'grocery':case 'milk':return [board,garden,table,field];
    case 'artists':return [board,camp,table,weave];
    case 'park':return [board,field,camp,weave];
    case 'church':return [board,table,camp,contact];
  }
}
