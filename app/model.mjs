// Local observations only. No signing, delivery or sovereign grants.
export const WORLDS=['webz:the-static-collective/sanctuary','webz:the-static-collective/orchard-022100'];
export const manifests=WORLDS.map((id,i)=>({schema:'webz/world/v0',world_id:id,revision:'offline-001',title:i?'Orchard':'Sanctuary',entry:`worlds/${i?'orchard':'sanctuary'}/`,doors:[{door_id:i?'orchard-sanctuary':'sanctuary-orchard',label:i?'Return to Sanctuary':'Enter Orchard',to_world_id:WORLDS[1-i],to_entry:`worlds/${i?'sanctuary':'orchard'}/`,default_carry:'none'}],origin_note:'Owner-declared first-party world; declaration is not authenticated identity.'}));
export function exact(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(value,k)))throw Error('INVALID_FIELDS');
}
function text(v){if(typeof v!=='string'||!v.length||v.length>512)throw Error('INVALID_TEXT');}
export function safeEntry(entry,base){
 text(entry);if(!/^[a-z0-9/-]+\/$/.test(entry)||entry.includes('..')||entry.startsWith('/'))throw Error('UNSAFE_ENTRY');
 const b=new URL(base),u=new URL(entry,b);if(u.origin!==b.origin||!u.pathname.startsWith(b.pathname)||u.search||u.hash)throw Error('OFF_BASE');return u.href;
}
export function validateManifest(m,base){
 exact(m,['schema','world_id','revision','title','entry','doors','origin_note']);
 if(m.schema!=='webz/world/v0'||!WORLDS.includes(m.world_id))throw Error('UNKNOWN_WORLD');
 for(const k of ['revision','title','origin_note'])text(m[k]);safeEntry(m.entry,base);
 if(!Array.isArray(m.doors)||m.doors.length>8)throw Error('INVALID_DOORS');const ids=new Set();
 for(const d of m.doors){exact(d,['door_id','label','to_world_id','to_entry','default_carry']);text(d.door_id);text(d.label);
  if(ids.has(d.door_id)||!WORLDS.includes(d.to_world_id)||d.to_world_id===m.world_id||d.default_carry!=='none')throw Error('INVALID_DOOR');ids.add(d.door_id);safeEntry(d.to_entry,base);
  if(d.to_entry!==manifests[WORLDS.indexOf(d.to_world_id)].entry)throw Error('DESTINATION_ID_MISMATCH');
 }if(m.entry!==manifests[WORLDS.indexOf(m.world_id)].entry)throw Error('WORLD_ENTRY_MISMATCH');return m;
}
export const empty=()=>({schema:'webz/voyage-local/v0',events:[]});
const EVENT_KEYS=['seq','kind','from_world_id','to_world_id','door_id','carry_mode','basis_departure_seq','authority','proposal_ref','byte_length','decision'];
export function project(j){
 exact(j,['schema','events']);if(j.schema!=='webz/voyage-local/v0'||!Array.isArray(j.events)||j.events.length>2000)throw Error('INVALID_JOURNAL');
 let current=WORLDS[0],pending=null,arrivals=0;const decisions=[];
 for(const [i,e] of j.events.entries()){
  exact(e,EVENT_KEYS);if(e.seq!==i+1||e.authority!=='browser-local-observation'||e.carry_mode!=='none'||!WORLDS.includes(e.from_world_id)||!WORLDS.includes(e.to_world_id))throw Error('INVALID_EVENT');
  if(e.kind==='DECISION'){
   if(e.from_world_id!==e.to_world_id||e.door_id!==null||e.basis_departure_seq!==null||!/^sha256:[a-f0-9]{64}$/.test(e.proposal_ref)||!Number.isInteger(e.byte_length)||e.byte_length<1||e.byte_length>2048||!['HOLD','REFUSE','ADMIT'].includes(e.decision))throw Error('INVALID_DECISION');
   const previous=decisions.filter(d=>d.world===e.from_world_id&&d.proposal===e.proposal_ref).at(-1);
   if(previous&&previous.decision!=='HOLD')throw Error('TERMINAL_LOCAL_CHOICE');
   decisions.push({world:e.from_world_id,proposal:e.proposal_ref,decision:e.decision,seq:e.seq});continue;
  }
  if(e.from_world_id===e.to_world_id||e.door_id!==manifests[WORLDS.indexOf(e.from_world_id)].doors[0].door_id||e.proposal_ref!==null||e.byte_length!==null||e.decision!==null)throw Error('INVALID_NAVIGATION');
  if(['DEPART','RETURN'].includes(e.kind)){if(pending||e.basis_departure_seq!==null)throw Error('PENDING_DEPARTURE');pending=e;}
  else if(['ARRIVE','UNRESOLVED'].includes(e.kind)||(e.kind==='REMAIN'&&pending)){
   if(!pending||e.basis_departure_seq!==pending.seq||e.from_world_id!==pending.from_world_id||e.to_world_id!==pending.to_world_id)throw Error('UNOBSERVED_DEPARTURE');
   if(e.kind==='ARRIVE'){current=e.to_world_id;arrivals++;}pending=null;
  }else if(!['INSPECT','REMAIN'].includes(e.kind)||e.basis_departure_seq!==null)throw Error('INVALID_ACTION');
 }
 return {schema:'webz/local-projection/v0',authority:'browser-local-observation',current_world:current,arrivals,pending_departure:pending,decisions,events:j.events.length};
}
export function append(j,action){
 exact(action,['kind','from','to']);const p=project(j);
 const e={seq:j.events.length+1,kind:action.kind,from_world_id:action.from,to_world_id:action.to,door_id:manifests[WORLDS.indexOf(action.from)]?.doors[0].door_id,carry_mode:'none',basis_departure_seq:(['ARRIVE','UNRESOLVED'].includes(action.kind)||(action.kind==='REMAIN'&&p.pending_departure))?p.pending_departure?.seq:null,authority:'browser-local-observation',proposal_ref:null,byte_length:null,decision:null};
 const next={...j,events:[...j.events,e]};project(next);return next;
}
export async function hash(value){return 'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export function canonical(v){
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
export function sensitive(s){return /Bearer\s|-----BEGIN|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.|(?:password|secret|api[_-]?key|access[_-]?token)["']?\s*[:=]/i.test(s);}
export async function proposal(value,consent){
 if(typeof value!=='string'||!consent||sensitive(value))throw Error('PUBLIC_TEXT_AND_CONSENT_REQUIRED');
 const length=new TextEncoder().encode(value).length;if(!value.trim()||length>2048)throw Error('TEXT_LIMIT_2048_BYTES');
 return {id:await hash(value),byte_length:length};
}
export function choose(j,world,p,decision){
 const e={seq:j.events.length+1,kind:'DECISION',from_world_id:world,to_world_id:world,door_id:null,carry_mode:'none',basis_departure_seq:null,authority:'browser-local-observation',proposal_ref:p.id,byte_length:p.byte_length,decision};
 const next={...j,events:[...j.events,e]};project(next);return next;
}
export async function freeze(record){project(record);const copy=structuredClone(record);return {schema:'webz/local-export/v0',scope:'unsigned non-sensitive observations; no sovereign receipt, license or LIVE authority',record:copy,integrity:await hash(canonical(copy))};}
export async function thaw(f){
 exact(f,['schema','scope','record','integrity']);if(f.schema!=='webz/local-export/v0'||f.scope!=='unsigned non-sensitive observations; no sovereign receipt, license or LIVE authority'||await hash(canonical(f.record))!==f.integrity)throw Error('EXPORT_INTEGRITY');project(f.record);return structuredClone(f.record);
}
