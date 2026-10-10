// MYCELIUM-007 — an observer-local UNDERSTORY-inspired residue lens over Free Graph-style
// proposed 'connects' relations. This is NOT MEMENTO storage, authority, or hidden memory.
import {checksum} from '../../gift.mjs';
import {inspectFootpath,proposeFootpath,composeGrounds} from '../contract.mjs';

export const NOTEBOOK_SCHEMA='webz/grounds-mycelium-notebook/v0';
export const EVENT_SCHEMA='webz/grounds-mycelium-event/v0';
export const CARRIER_SCHEMA='webz/grounds-mycelium-carrier/v0';
export const MAX_EVENTS=96;
export const MAX_BYTES=95000;
const HASH=/^sha256:[a-f0-9]{64}$/;
const TYPES=['CONTACT','ATTENTION','DECODER','STANCE','ASSOCIATION','ACTIVATION','REST','RESURFACE','REVISIT','FORK'];
const STANCES=['OPEN','HOLD','REFUSE'];
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max=180)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const size=v=>new TextEncoder().encode(JSON.stringify(v)).length;
const bodyKeys=['schema','sequence','previous','type','subject','target','footpath','note','decoder','stance','observer'];
const sameKeys=(v,keys)=>Object.keys(v).sort().join('|')===keys.slice().sort().join('|');
const forbidden=code=>{throw Error(code)};

export function newNotebook(observer='Local steward'){
 return {schema:NOTEBOOK_SCHEMA,observer:text(observer,60)||'Local steward',
  privacy:'OBSERVER_LOCAL_ONLY',authority:'NO_MEMENTO_ADMISSION',events:[]};
}

function interpret(events){
 const contacts=new Map(),associations=new Map();
 for(const ev of events){
  const v=ev.type,subject=ev.subject;
  if(['CONTACT','ATTENTION','DECODER','STANCE','REVISIT'].includes(v)){
   if(!HASH.test(subject||''))forbidden('SUBJECT_ADDRESS_REQUIRED');
   const s=contacts.get(subject)||{contact:false,attended:false,decoder:null,stance:null,revisits:0};
   if(v==='CONTACT'){
    if(s.contact)forbidden('CONTACT_ALREADY_RECORDED');
    if(ev.note.length<12)forbidden('CONTACT_DECLARATION_REQUIRED');
    s.contact=true;
   }else if(v==='REVISIT'){
    if(!s.contact||ev.note.length<12)forbidden('CONTACT_BEFORE_REVISIT_REQUIRED');
    s.revisits++;
   }else if(v==='ATTENTION'){
    if(!s.contact||s.attended||ev.note.length<12)forbidden('CONTACT_BEFORE_ATTENTION_REQUIRED');
    s.attended=true;
   }else if(v==='DECODER'){
    if(!s.attended||!ev.decoder||ev.decoder.length<3)forbidden('ATTENTION_BEFORE_DECODER_REQUIRED');
    s.decoder=ev.decoder;
   }else if(v==='STANCE'){
    if(!s.decoder||!STANCES.includes(ev.stance))forbidden('DECODER_BEFORE_STANCE_REQUIRED');
    s.stance=ev.stance;
   }
   contacts.set(subject,s);
  }else if(v==='ASSOCIATION'){
   const p=ev.footpath;
   if(!isObj(p)||!HASH.test(p.id||'')||subject!==null||ev.target!==null)forbidden('ASSOCIATION_PATH_REQUIRED');
   if(associations.has(p.id))forbidden('ASSOCIATION_ALREADY_PRESENT');
   if(!contacts.get(p.a)?.attended||!contacts.get(p.b)?.attended||!contacts.get(p.a)?.stance||!contacts.get(p.b)?.stance)forbidden('TWO_ATTENDED_PARTICULARS_REQUIRED');
   associations.set(p.id,{path:p,active:false,rested:false,resurfaced:0,activationCount:0});
  }else if(v==='FORK'){
   // Forks cite the exact prior cut. They do not rewrite earlier residues or create routes.
   if(subject!==null||!HASH.test(ev.target||'')||ev.target!==ev.previous||ev.note.length<12)forbidden('FORK_REQUIRES_PRIOR_CUT');
  }else {
   if(subject!==null||!HASH.test(ev.target||''))forbidden('ASSOCIATION_REFERENCE_REQUIRED');
   const a=associations.get(ev.target);
   if(!a)forbidden('UNKNOWN_ASSOCIATION');
   if(v==='ACTIVATION'){
    if(a.active||contacts.get(a.path.a)?.stance!=='OPEN'||contacts.get(a.path.b)?.stance!=='OPEN'||ev.note.length<12)
     forbidden('EXPLICIT_OPEN_ACTIVATION_REQUIRED');
    a.active=true;a.rested=false;a.activationCount++;
   }else if(v==='REST'){
    if(!a.active)forbidden('ONLY_AN_ACTIVE_PATH_CAN_REST');
    a.active=false;a.rested=true;
   }else if(v==='RESURFACE'){
    if(a.active||ev.note.length<12)forbidden('DORMANT_TRACE_AND_NEW_OBSERVATION_REQUIRED');
    // Resurfacing is a new occurrence. It does not rewrite the older event or activate a path.
    a.resurfaced++;
   }
  }
 }
 return {contacts,associations};
}

export async function inspectNotebook(book){
 if(!isObj(book)||size(book)>MAX_BYTES||!sameKeys(book,['schema','observer','privacy','authority','events'])||
    book.schema!==NOTEBOOK_SCHEMA||book.privacy!=='OBSERVER_LOCAL_ONLY'||book.authority!=='NO_MEMENTO_ADMISSION'||
    typeof book.observer!=='string'||!book.observer||book.observer.length>60||!Array.isArray(book.events)||book.events.length>MAX_EVENTS)
  forbidden('INVALID_MYCEliUM_NOTEBOOK');
 let previous=null;
 for(let i=0;i<book.events.length;i++){
  const ev=book.events[i];if(!isObj(ev)||!sameKeys(ev,[...bodyKeys,'id'])||!TYPES.includes(ev.type)||
    ev.schema!==EVENT_SCHEMA||ev.sequence!==i||ev.previous!==previous||ev.observer!==book.observer||
    typeof ev.note!=='string'||ev.note.length>180||ev.note!==text(ev.note,180)||
    (ev.subject!==null&&!HASH.test(ev.subject))||(ev.target!==null&&!HASH.test(ev.target))||
    (ev.decoder!==null&&(typeof ev.decoder!=='string'||ev.decoder.length>80))||
    (ev.stance!==null&&!STANCES.includes(ev.stance))||!HASH.test(ev.id||''))forbidden('INVALID_RESIDUE_EVENT');
  if(ev.type!=='ASSOCIATION'&&ev.footpath!==null)forbidden('INERT_FOOTPATH_REQUIRED');
  if(['CONTACT','ATTENTION','DECODER','STANCE','REVISIT'].includes(ev.type)&&ev.target!==null)forbidden('INERT_TARGET_REQUIRED');
  if(!['DECODER'].includes(ev.type)&&ev.decoder!==null)forbidden('INERT_DECODER_REQUIRED');
  if(ev.type!=='STANCE'&&ev.stance!==null)forbidden('INERT_STANCE_REQUIRED');
  if(ev.type==='ASSOCIATION')await inspectFootpath(ev.footpath);
  const {id,...body}=ev;
  if(await checksum(body)!==id)forbidden('RESIDUE_HASH_MISMATCH');
  previous=id;
 }
 const state=interpret(book.events);
 return {book,state,tip:previous};
}

export async function appendObservation(book,raw,graph){
 const {state}=await inspectNotebook(book);
 if(!isObj(raw)||!TYPES.includes(raw.type))forbidden('INVALID_EVENT_PROPOSAL');
 if(book.events.length>=MAX_EVENTS)forbidden('UNDERSTORY_FULL');
 const type=raw.type;
 const subject=['CONTACT','ATTENTION','DECODER','STANCE','REVISIT'].includes(type)?raw.subject:null;
 if(subject!==null&&(!HASH.test(subject||'')||!graph?.index?.has(subject)))forbidden('OBSERVED_GIFT_NOT_PRESENT');
 const footpath=type==='ASSOCIATION'?await proposeFootpath(graph,{a:raw.a,b:raw.b,kind:raw.kind,note:raw.note,keeper:book.observer}):null;
 // Differing interpretations of the same pair remain separate evidence; never become votes.
 const body={schema:EVENT_SCHEMA,sequence:book.events.length,previous:book.events.at(-1)?.id||null,
  type,subject,target:type==='FORK'?(book.events.at(-1)?.id||null):['ACTIVATION','REST','RESURFACE'].includes(type)?raw.target:null,
  footpath,note:text(raw.note,180),decoder:type==='DECODER'?text(raw.decoder,80)||null:null,
  stance:type==='STANCE'?raw.stance:null,observer:book.observer};
 const ev={...body,id:await checksum(body)};
 const next={...book,events:[...book.events,ev]};
 await inspectNotebook(next);
 return next;
}

export async function forkNotebook(book,reason='I want a different continuation of the same observed history.') {
 await inspectNotebook(book);
 if(!book.events.length)forbidden('NOTHING_TO_BRANCH_YET');
 // appendObservation returns a new book; parent object and event bytes remain untouched.
 return appendObservation(book,{type:'FORK',note:reason});
}

export async function projectMycelium(graph,book){
 const {state}=await inspectNotebook(book),active=[],dormant=[],parallel=[];
 const representedPairs=new Map();
 for(const [id,a] of state.associations){
  const enough=graph.index.has(a.path.a)&&graph.index.has(a.path.b);
  const open=state.contacts.get(a.path.a)?.stance==='OPEN'&&state.contacts.get(a.path.b)?.stance==='OPEN';
  if(a.active&&enough&&open){
   const pair=[a.path.a,a.path.b].join('|');
   if(representedPairs.has(pair))parallel.push({id,alongside:representedPairs.get(pair),path:a.path});
   else {representedPairs.set(pair,id);active.push(a.path);}
  }else dormant.push({id,reason:!enough?'MISSING_ORIGINAL_GIFT':!open?'OBSERVER_STANCE_NOT_OPEN':a.rested?'RESTING':'NOT_ACTIVATED',resurfaced:a.resurfaced,path:a.path});
 }
 const grounds=composeGrounds(graph,active);
 return {grounds,active,dormant,parallel,contacts:state.contacts.size,events:book.events.length,
  law:'TRACE_NOT_MEMORY_AND_FOOTPATH_NOT_ADMISSION'};
}
export async function exportMycelium(book){
 await inspectNotebook(book);
 const body={schema:CARRIER_SCHEMA,kind:'PRIVATE_OBSERVER_RESIDUE_NOT_CANON',notebook:book};
 const out={body,integrity:{algorithm:'sha256',value:await checksum(body),isSignature:false}};
 if(size(out)>MAX_BYTES)forbidden('MYCELIUM_EXPORT_TOO_LARGE');
 return out;
}
export async function inspectMyceliumFile(envelope){
 if(!isObj(envelope)||size(envelope)>MAX_BYTES||!isObj(envelope.body)||!isObj(envelope.integrity)||
  !sameKeys(envelope,['body','integrity'])||!sameKeys(envelope.body,['schema','kind','notebook'])||
  envelope.body.schema!==CARRIER_SCHEMA||envelope.body.kind!=='PRIVATE_OBSERVER_RESIDUE_NOT_CANON'||
  !sameKeys(envelope.integrity,['algorithm','value','isSignature'])||
  envelope.integrity.algorithm!=='sha256'||envelope.integrity.isSignature!==false||!HASH.test(envelope.integrity.value||''))forbidden('INVALID_MYCeLIUM_FILE');
 if(await checksum(envelope.body)!==envelope.integrity.value)forbidden('MYCELIUM_FILE_HASH_MISMATCH');
 await inspectNotebook(envelope.body.notebook);
 return envelope.body.notebook;
}
