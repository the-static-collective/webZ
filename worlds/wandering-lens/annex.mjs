/* Wandering Lens 002 — Local Annex. No sovereign crossing, no publishing.
 * A held visitor reflection can inspire a proposal. Only separate, explicit
 * local INSPECT then disposition can make a user-local overlay visible.
 * Browser actions are NOT independently authenticated people.
 */
import {address,parseAddress,descend,validateJournal,holdReflection,questionFor} from './model.mjs';

export const ANNEX='webz/wandering-lens-annex/v0';
export const PACKAGE='webz/wandering-lens-annex-export/v0';
export const MAX_PROPOSALS=32;
export const MAX_EVENTS=96;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const fail=reason=>{throw new TypeError(reason)};
const exact=(o,keys)=>{
 if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||keys.some(k=>!own(o,k)))fail('ANNEX_FIELDS');
};
const types=['OBJECT','WORLD_SKETCH'];
const decisions=['HOLD','REFUSE','ADMIT'];
const source=(j,seq)=>{
 validateJournal(j);
 if(!Number.isSafeInteger(seq)||seq<1||seq>j.entries.length)fail('SOURCE_NOT_HELD');
 return j.entries[seq-1];
};
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):
 Array.isArray(v)?'['+v.map(canonical).join(',')+']':
 '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
async function digest(v){
 const raw=new TextEncoder().encode(canonical(v));
 const bytes=await crypto.subtle.digest('SHA-256',raw);
 return 'sha256:'+Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
const text=(s,max)=>typeof s==='string'&&s.trim()===s&&s.length>0&&s.length<=max&&
 !/[<>\u0000-\u001f\u007f]/.test(s);
const id=i=>'wl2-'+String(i).padStart(3,'0');
const count=(l,k)=>l.events.filter(x=>x.proposal_id===k).length;
export const emptyAnnex=()=>({schema:ANNEX,proposals:[],events:[]});

export async function auditAnnex(l,j){
 validateJournal(j);
 exact(l,['schema','proposals','events']);
 if(l.schema!==ANNEX||!Array.isArray(l.proposals)||l.proposals.length>MAX_PROPOSALS||
    !Array.isArray(l.events)||l.events.length>MAX_EVENTS)fail('ANNEX_BOUNDS');
 const states=new Map();
 for(let i=0;i<l.proposals.length;i++){
  const p=l.proposals[i];
  exact(p,['id','kind','title','detail','source_seq','source_address','source_digest','placement','authority']);
  if(p.id!==id(i+1)||!types.includes(p.kind)||!text(p.title,64)||!text(p.detail,420)||
     p.authority!=='VISITOR_PROPOSAL_ONLY'||typeof p.source_digest!=='string'||
     !/^sha256:[a-f0-9]{64}$/.test(p.source_digest))fail('ANNEX_PROPOSAL_INVALID');
  const entry=source(j,p.source_seq);
  if(p.source_address!==entry.address||p.source_digest!==await digest(entry))fail('ANNEX_SOURCE_CHANGED');
  exact(p.placement,['parent_address','anchor_particular']);
  if(p.placement.parent_address!==entry.address||p.placement.anchor_particular!==entry.particular)
   fail('ANNEX_PLACEMENT_FORGED');
  const parsed=parseAddress(p.source_address);
  if(parsed.tuning!==entry.particular)fail('ANNEX_SOURCE_INVALID');
  if(p.kind==='WORLD_SKETCH'&&parsed.path.length>=96)fail('ANNEX_CHILD_LIMIT');
  states.set(p.id,'PENDING');
 }
 for(let i=0;i<l.events.length;i++){
  const e=l.events[i];exact(e,['seq','proposal_id','kind','decision','actor']);
  if(e.seq!==i+1||e.actor!=='UNVERIFIED_LOCAL_REVIEWER'||!states.has(e.proposal_id))
   fail('ANNEX_EVENT_INVALID');
  const was=states.get(e.proposal_id);
  if(e.kind==='INSPECT'){
   if(e.decision!==null||!['PENDING','HOLD'].includes(was))fail('ANNEX_INSPECTION_INVALID');
   states.set(e.proposal_id,'INSPECTED');
  }else if(e.kind==='DISPOSE'){
   if(was!=='INSPECTED'||!decisions.includes(e.decision))fail('ANNEX_DISPOSITION_INVALID');
   states.set(e.proposal_id,e.decision);
  }else fail('ANNEX_EVENT_KIND');
 }
 return {states,proposals:l.proposals.length,events:l.events.length};
}
export async function proposeAnnex(l,j,seq,kind,title,detail){
 await auditAnnex(l,j);
 if(l.proposals.length>=MAX_PROPOSALS)fail('ANNEX_QUOTA');
 if(!types.includes(kind)||!text(title,64)||!text(detail,420))fail('PROPOSAL_TEXT_INVALID');
 const entry=source(j,seq),parsed=parseAddress(entry.address);
 if(kind==='WORLD_SKETCH'&&parsed.path.length>=96)fail('ANNEX_CHILD_LIMIT');
 const p={id:id(l.proposals.length+1),kind,title,detail,source_seq:seq,
  source_address:entry.address,source_digest:await digest(entry),
  placement:{parent_address:entry.address,anchor_particular:entry.particular},
  authority:'VISITOR_PROPOSAL_ONLY'};
 const next={schema:ANNEX,proposals:[...l.proposals,p],events:[...l.events]};
 await auditAnnex(next,j);return next;
}
export async function inspectProposal(l,j,proposalId){
 const {states}=await auditAnnex(l,j);
 if(!states.has(proposalId)||!['PENDING','HOLD'].includes(states.get(proposalId)))fail('NOT_INSPECTABLE');
 if(l.events.length>=MAX_EVENTS)fail('ANNEX_EVENTS_FULL');
 const next={schema:ANNEX,proposals:l.proposals.map(p=>structuredClone(p)),
  events:[...l.events,{seq:l.events.length+1,proposal_id:proposalId,kind:'INSPECT',
    decision:null,actor:'UNVERIFIED_LOCAL_REVIEWER'}]};
 await auditAnnex(next,j);return next;
}
export async function disposeProposal(l,j,proposalId,decision){
 const {states}=await auditAnnex(l,j);
 if(states.get(proposalId)!=='INSPECTED'||!decisions.includes(decision))fail('REVIEW_REQUIRED');
 if(l.events.length>=MAX_EVENTS)fail('ANNEX_EVENTS_FULL');
 const next={schema:ANNEX,proposals:l.proposals.map(p=>structuredClone(p)),
  events:[...l.events,{seq:l.events.length+1,proposal_id:proposalId,kind:'DISPOSE',
    decision,actor:'UNVERIFIED_LOCAL_REVIEWER'}]};
 await auditAnnex(next,j);return next;
}
export async function projectAnnex(l,j){
 const {states}=await auditAnnex(l,j);
 return {schema:'webz/wandering-lens-annex-view/v0',localOnly:true,
  originalsChanged:false,sovereignWorldsCreated:0,crossings:0,mediaActions:0,
  proposals:l.proposals.map(p=>({
   id:p.id,kind:p.kind,title:p.title,detail:p.detail,state:states.get(p.id),
   source_seq:p.source_seq,source_address:p.source_address,
   source_label:'UNVERIFIED_VISITOR_REFLECTION',
   review_actor:'UNVERIFIED_LOCAL_REVIEWER',
   local_placement:states.get(p.id)==='ADMIT'?{
    type:p.kind==='OBJECT'?'OPTIONAL_VISITOR_OVERLAY':'LOCAL_WORLD_SKETCH',
    parent_address:p.source_address,
    child_address:p.kind==='WORLD_SKETCH'?address(descend(parseAddress(p.source_address))):null,
    anchor_particular:p.placement.anchor_particular
   }:null
  }))
 };
}
export async function exportAnnex(l,j){
 await auditAnnex(l,j);
 const payload={journal:structuredClone(j),annex:structuredClone(l)};
 return {schema:PACKAGE,scope:'PRIVATE_LOCAL_VISITOR_PROPOSALS_NOT_SOVEREIGN',
  payload,integrity:await digest(payload),signed:false,published:false};
}
export async function importAnnex(item){
 exact(item,['schema','scope','payload','integrity','signed','published']);
 if(item.schema!==PACKAGE||item.scope!=='PRIVATE_LOCAL_VISITOR_PROPOSALS_NOT_SOVEREIGN'||
    item.signed!==false||item.published!==false)fail('ANNEX_EXPORT_SCOPE');
 exact(item.payload,['journal','annex']);
 if(await digest(item.payload)!==item.integrity)fail('ANNEX_EXPORT_INTEGRITY');
 await auditAnnex(item.payload.annex,item.payload.journal);
 return {journal:structuredClone(item.payload.journal),annex:structuredClone(item.payload.annex)};
}
