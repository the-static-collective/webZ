// Verify-only compatibility adapter. reLATTE owns the protocol; see evidence/provenance.json.
// Uploaded rosters are NOT authenticated host identities; this module cannot grant LIVE.
import {canonical,exact,hash,sensitive} from './model.mjs';
const names=['witness','gate','dead-letter','compost-monk','mirrorgoat','contrary','lantern-eater','pirate-clerk','choir-of-one','bone-orchard','oracl','ferryman','misspeldd-maxhinal'];
const nodes=Object.fromEntries(names.map((n,i)=>[`mx13:${String(i+1).padStart(2,'0')}-${n}`,i%2?'pantry-gate':'WITNESS']));
const crossingKeys='schema crossing_id protocol_version source_particular source_world source_history_head parents declared_kind payload_refs requested_effect capability_ref privacy_policy audience_policy return_address created_at signing extensions'.split(' ');
const receiptKeys='schema receipt_id crossing_id world_id receiver_particular kind semantic_effect contract_ref pre_state_ref post_state_ref descendant_refs residual_refs note created_at signing extensions'.split(' ');
const extensionKeys=new Set('mx13 sinew stage destination_disposition mandatory_hold authority disposition law route_forward_allowed descendant_specs route_index edge_id proposal_is_not_acceptance parent_receipt decision actor scope node_id world_id receiver_particular contract_ref kind semantic_effect pre_state_ref post_state_ref descendant_refs residual_refs note created_at receipt_id crossing_id schema signing algorithm public_key signature domain kty crv x y extensions'.split(' '));
function allowed(o,keys){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!keys.includes(k)))throw Error('UNEXPECTED_FIELD');}
function jsonSafe(v,depth=0){
 if(depth>40)throw Error('DEPTH_LIMIT');
 if(typeof v==='number'&&(!Number.isFinite(v)||!Number.isSafeInteger(v)))throw Error('INVALID_NUMBER');
 if(v===undefined||typeof v==='function'||typeof v==='bigint')throw Error('INVALID_JSON');
 if(typeof v==='string'&&(v.length>8192||sensitive(v)||/[a-z]+:\/\/|data:|javascript:|blob:/i.test(v)))throw Error('UNSANITIZED_TEXT');
 if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){
  if(['d','__proto__','constructor','prototype'].includes(k)||/(secret|password|token|credential|authorization|private|bearer)/i.test(k))throw Error('UNSANITIZED_FIELD');jsonSafe(x,depth+1);
 }
}
function extensions(o){
 allowed(o,[...extensionKeys]);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Array.isArray(v))extensions(v);
}
function b64(s,len){
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('INVALID_BASE64URL');
 const bytes=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const encoded=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 if(bytes.length!==len||s!==encoded)throw Error('INVALID_BASE64URL');return bytes;
}
function jwk(k){exact(k,['kty','crv','x','y']);if(k.kty!=='EC'||k.crv!=='P-256')throw Error('INVALID_KEY');b64(k.x,32);b64(k.y,32);return {kty:'EC',crv:'P-256',x:k.x,y:k.y};}
function identity(s,domain){exact(s,['algorithm','public_key','signature','domain']);if(s.algorithm!=='ECDSA-P256-SHA256'||s.domain!==domain)throw Error('INVALID_SIGNING');return {algorithm:s.algorithm,public_key:jwk(s.public_key),domain};}
function required(o,k){if(typeof o[k]!=='string'||!o[k])throw Error('MISSING_'+k);return o[k];}
function body(o,type){
 const cross=type==='crossing';allowed(o,cross?crossingKeys:receiptKeys);
 if(o.schema!==(cross?'relatte.crossing-envelope/v0':'relatte.receipt/v0'))throw Error('INVALID_SCHEMA');
 const created_at=required(o,'created_at');if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(created_at))throw Error('INVALID_TIMESTAMP');
 extensions(o.extensions??{});
 if(cross){
  if(o.protocol_version!=='0'||!Array.isArray(o.parents)||!Array.isArray(o.payload_refs))throw Error('INVALID_CROSSING');
  return {schema:o.schema,protocol_version:'0',source_particular:required(o,'source_particular'),source_world:required(o,'source_world'),source_history_head:o.source_history_head??null,parents:o.parents,declared_kind:required(o,'declared_kind'),payload_refs:o.payload_refs,requested_effect:o.requested_effect??null,capability_ref:o.capability_ref??null,privacy_policy:o.privacy_policy??null,audience_policy:o.audience_policy??null,return_address:o.return_address??null,created_at,signing:identity(o.signing,'relatte.crossing-signature/v0'),extensions:o.extensions??{}};
 }
 if(!Array.isArray(o.descendant_refs??[])||!Array.isArray(o.residual_refs??[]))throw Error('INVALID_RECEIPT');
 return {schema:o.schema,crossing_id:required(o,'crossing_id'),world_id:required(o,'world_id'),receiver_particular:required(o,'receiver_particular'),kind:required(o,'kind'),semantic_effect:required(o,'semantic_effect'),contract_ref:o.contract_ref??null,pre_state_ref:o.pre_state_ref??null,post_state_ref:o.post_state_ref??null,descendant_refs:o.descendant_refs??[],residual_refs:o.residual_refs??[],note:o.note??null,created_at,signing:identity(o.signing,'relatte.receipt-signature/v0'),extensions:o.extensions??{}};
}
async function verify(o,type,fingerprints){
 const b=body(o,type),cross=type==='crossing',field=cross?'crossing_id':'receipt_id';
 const idDomain=cross?'reLATTE-CrossingEnvelope-v0|':'reLATTE-Receipt-v0|';
 const id=`relatte-${cross?'crossing':'receipt'}-v0:`+(await hash(idDomain+canonical(b))).slice(7);
 if(o[field]!==id)throw Error('ID_MISMATCH');
 const world=cross?o.source_world:o.world_id;
 if(await hash(canonical(b.signing.public_key))!==fingerprints[world])throw Error('KEY_SUBSTITUTION');
 const key=await crypto.subtle.importKey('jwk',b.signing.public_key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const bytes=new TextEncoder().encode((cross?'reLATTE-CrossingSignature-v0|':'reLATTE-ReceiptSignature-v0|')+canonical({[field]:id,...b}));
 if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,b64(o.signing.signature,64),bytes))throw Error('SIGNATURE_MISMATCH');
}
export async function observe(input){
 const raw=typeof input==='string'?input:JSON.stringify(input);
 if(new TextEncoder().encode(raw).length>524288)throw Error('REPORT_LIMIT_512_KIB');
 const r=JSON.parse(raw);jsonSafe(r);exact(r,['schema','scope','fingerprints','traces']);
 if(r.schema!=='webz/sanitized-maxhinal/v0'||typeof r.scope!=='string'||!Array.isArray(r.traces)||r.traces.length>100)throw Error('INVALID_REPORT');
 allowed(r.fingerprints,Object.keys(nodes));for(const fp of Object.values(r.fingerprints))if(typeof fp!=='string'||!/^sha256:[a-f0-9]{64}$/.test(fp))throw Error('INVALID_FINGERPRINT');
 const crossings=new Map(),receipts=new Map(),custody=new Map(),ancestry={},unresolved=new Set();
 async function receipt(o){await verify(o,'receipt',r.fingerprints);const prev=receipts.get(o.receipt_id);if(prev&&canonical(prev)!==canonical(o))throw Error('CONFLICTING_RECEIPT');receipts.set(o.receipt_id,o);}
 for(const t of r.traces){
  exact(t,['node_id','host_id','signed_crossing','signed_hold','signed_disposition','relation_observations']);
  if(!Object.hasOwn(nodes,t.node_id)||nodes[t.node_id]!==t.host_id)throw Error('WRONG_LOCAL_HOST');
  const x=t.signed_crossing;await verify(x,'crossing',r.fingerprints);const dest=x.audience_policy?.destination;
  if(!Object.hasOwn(nodes,x.source_world)||!Object.hasOwn(nodes,dest)||![x.source_world,dest].includes(t.node_id))throw Error('WRONG_CUSTODIAN');
  if(x.payload_refs.length!==1||x.payload_refs[0].address!==x.source_particular)throw Error('SOURCE_ADDRESS_MISMATCH');
  const snapshot=canonical({crossing:x,hold:t.signed_hold,disposition:t.signed_disposition,observations:t.relation_observations});
  if(crossings.has(x.crossing_id)&&crossings.get(x.crossing_id).snapshot!==snapshot)throw Error('DUPLICATE_CONFLICT');
  crossings.set(x.crossing_id,{x,snapshot});if(!custody.has(x.crossing_id))custody.set(x.crossing_id,new Set());custody.get(x.crossing_id).add(t.node_id);
  const h=t.signed_hold,d=t.signed_disposition;
  if(!Array.isArray(t.relation_observations))throw Error('INVALID_OBSERVATIONS');
  if(!h){if(d||t.relation_observations.length)throw Error('DISPOSITION_WITHOUT_HOLD');unresolved.add(x.crossing_id);continue;}
  for(const o of [h,d,...t.relation_observations]){if(!o)continue;await receipt(o);
   if(o.crossing_id!==x.crossing_id||o.world_id!==dest||o.receiver_particular!==x.source_particular)throw Error('RECEIPT_BINDING');
  }
  if(h.kind!=='MX13_HOLD'||h.semantic_effect!=='none'||h.extensions?.mx13?.mandatory_hold!==true||h.extensions.mx13.destination_disposition!==null)throw Error('MANDATORY_HOLD_MISSING');
  for(const o of t.relation_observations){
   if(x.declared_kind!=='SINEW_PROPOSED_EDGE'||o.kind!=='MX13_EDGE_HOLD'||o.semantic_effect!=='none'||o.pre_state_ref!==h.receipt_id||o.extensions?.sinew?.decision!=='HOLD')throw Error('RELATION_OBSERVATION_INVALID');
   ancestry[o.receipt_id]=[h.receipt_id,x.crossing_id];
  }
  if(!d){unresolved.add(x.crossing_id);continue;}
  const disposition=d.extensions?.mx13;
  if(disposition?.stage!=='LOCAL_DISPOSITION'||d.pre_state_ref!==h.receipt_id||d.kind!==`MX13_${disposition.disposition}`||d.created_at<h.created_at)throw Error('DISPOSITION_ORDER');
  if(['mx13:01-witness','mx13:11-oracl','mx13:12-ferryman'].includes(dest)&&disposition.disposition==='ADMIT')throw Error('FORBIDDEN_AUTHORITY');
  if(x.declared_kind==='SINEW_PROPOSED_EDGE'&&(d.extensions?.sinew?.edge_id!==x.extensions?.sinew?.edge_id||!['ACCEPT','REFUSE'].includes(d.extensions?.sinew?.decision)))throw Error('RELATION_DECISION_MISMATCH');
  ancestry[d.receipt_id]=[h.receipt_id,x.crossing_id,...x.parents];
 }
 for(const {x} of crossings.values())for(const parent of x.parents){
  const p=receipts.get(parent);if(!p)throw Error('PARENT_UNOBSERVED');
  if(p.world_id!==x.source_world||(x.declared_kind!=='SINEW_PROPOSED_EDGE'&&p.receiver_particular!==x.source_particular))throw Error('PARENT_SCOPE');
 }
 const branches=[...crossings.values()].map(({x})=>({crossing_id:x.crossing_id,particular:x.source_particular,source:x.source_world,destination:x.audience_policy.destination,source_custody:custody.get(x.crossing_id).has(x.source_world),destination_custody:custody.get(x.crossing_id).has(x.audience_policy.destination),complete:!unresolved.has(x.crossing_id)})).sort((a,b)=>a.crossing_id.localeCompare(b.crossing_id));
 return {schema:'webz/proof-view/v0',system:'MAXHINAL-13',status:'NOT_EARNED',claim:'NO_LIVE_TWO_HOST_PROOF',verification:{result:'CONSISTENCY_ONLY',source_host_history_checked:false,destination_host_history_checked:false,exact_particular_checked:false,cold_replay_checked:false},report_sha256:await hash(canonical(r)),signature_scope:'SIGNATURE_AND_BINDING_CONSISTENCY_ONLY',key_basis:'UPLOADED_ROSTER_NOT_AUTHENTICATED_HOSTS',verified_crossings:crossings.size,verified_receipts:receipts.size,paired_nonself_histories:branches.filter(b=>b.source!==b.destination&&b.source_custody&&b.destination_custody&&b.complete).length,branches,ancestry:Object.fromEntries(Object.entries(ancestry).sort(([a],[b])=>a.localeCompare(b))),unresolved:[...unresolved].sort(),transport:'UNOBSERVED',exact_source_bytes:'UNOBSERVED',live_two_host:'NOT_EARNED',rack_locked:true};
}
