// Independent Abundent verification of GrO-local signed reLATTE v0 RECEIVE/HOLD.
// No producer signing keys, no receiver trust grants, no automatic admission.
import {verifyArrival,canonical} from './verify.mjs';
const enc=new TextEncoder();
const exact=(v,fields)=>{
 if(!v||typeof v!=='object'||Array.isArray(v)||
 Object.keys(v).length!==fields.length||fields.some(k=>!Object.hasOwn(v,k)))throw Error('UNEXPECTED_FIELDS');
};
const hex=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v))),n=>n.toString(16).padStart(2,'0')).join('');
const hash=(p,obj)=>hex(p+canonical(obj));
const pubKeys=['kty','crv','x','y'];
const fields='schema receipt_id crossing_id world_id receiver_particular kind semantic_effect contract_ref pre_state_ref post_state_ref descendant_refs residual_refs note created_at signing extensions'.split(' ');
const signingKeys=['algorithm','public_key','signature','domain'];
const config={schema:'relatte.local-receiver-config/v0',world_id:'world:gro-local-review',
 receiver_particular:'particular:gro-abundent-intake-001',contract_ref:'gro.abundent-public-reference-intake/v0'};
function base64url(input){
 if(typeof input!=='string'||!/^[A-Za-z0-9_-]+$/.test(input))throw Error('BAD_BASE64URL');
 const raw=atob(input.replace(/-/g,'+').replace(/_/g,'/'));
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 if(btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')!==input)throw Error('BAD_BASE64URL');
 return bytes;
}
function pubkey(k){
 exact(k,pubKeys);
 if(k.kty!=='EC'||k.crv!=='P-256'||base64url(k.x).length!==32||base64url(k.y).length!==32)
   throw Error('INVALID_RECEIVER_KEY');
}
async function verifyReceipt(r,key){
 exact(r,fields);
 if(r.schema!=='relatte.receipt/v0'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(r.created_at))throw Error('INVALID_RECEIPT_SCHEMA');
 if(!Array.isArray(r.descendant_refs)||!Array.isArray(r.residual_refs))throw Error('INVALID_REFS');
 exact(r.signing,signingKeys);pubkey(r.signing.public_key);
 if(canonical(r.signing.public_key)!==canonical(key))throw Error('RECEIVER_KEY_CHANGED');
 if(r.signing.domain!=='relatte.receipt-signature/v0'||r.signing.algorithm!=='ECDSA-P256-SHA256')throw Error('INVALID_SIGNING_PROFILE');
 const {signature,...unsignedSigning}=r.signing;
 const {receipt_id,...rest}=r;
 const body={...rest,signing:unsignedSigning};
 const expected='relatte-receipt-v0:'+await hash('reLATTE-Receipt-v0|',body);
 if(receipt_id!==expected)throw Error('RECEIPT_ID_CHANGED');
 const bytes=base64url(signature);
 if(bytes.length!==64)throw Error('INVALID_SIGNATURE');
 const keyObj=await crypto.subtle.importKey('jwk',key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},keyObj,bytes,
   enc.encode('reLATTE-ReceiptSignature-v0|'+canonical({receipt_id,...body}))))throw Error('RECEIPT_SIGNATURE_INVALID');
}
async function stateRef(crossingId,status){
 if(!['NONE','RECEIVED','HOLD'].includes(status))throw Error('INVALID_STATE');
 return 'relatte-local-state-v0:'+await hash('reLATTE-LocalReceiverState-v0|',{
   world_id:config.world_id,receiver_particular:config.receiver_particular,
   status:status==='NONE'?[]:[{crossing_id:crossingId,disposition:status}]
 });
}
export async function verifySignedHold(input){
 const raw=typeof input==='string'?input:JSON.stringify(input);
 if(enc.encode(raw).byteLength>65536)throw Error('SIGNED_RECEIPT_LIMIT_64KB');
 const b=JSON.parse(raw);
 exact(b,['schema','claim','config','receiver_public_key','carrier','events','history_head']);
 if(b.schema!=='gro.abundent-signed-receiver/v0'||
   b.claim!=='OWNER_LOCAL_PROCESS_NOT_AUTHENTICATED_OPERATOR'||
   canonical(b.config)!==canonical(config))throw Error('NOT_BOUND_RECEIVER');
 pubkey(b.receiver_public_key);
 const original=await verifyArrival(b.carrier);
 if(!Array.isArray(b.events)||b.events.length!==2)throw Error('UNEXPECTED_EVENTS');
 const [receive,hold]=b.events;
 let previous=null;
 for(const [i,event] of b.events.entries()){
   exact(event,['schema','seq','previous_hash','event_type','crossing_id','crossing','receipt','created_at','event_hash']);
   if(event.schema!=='relatte.local-receiver-event/v0' || event.seq!==i+1||
     event.previous_hash!==previous||
     event.event_type!==(i===0?'RECEIVE':'DISPOSITION')||
     event.crossing_id!==original.crossing_id||
     event.created_at!==event.receipt.created_at)throw Error('INVALID_EVENT_ORDER');
   const {event_hash,...body}=event;
   if(event_hash!=='relatte-local-event-v0:'+await hash('reLATTE-LocalReceiverEvent-v0|',body))
     throw Error('EVENT_HASH_MISMATCH');
   await verifyReceipt(event.receipt,b.receiver_public_key);
   previous=event_hash;
 }
 if(b.history_head!==hold.event_hash||canonical(receive.crossing)!==canonical(b.carrier.crossing)||
    hold.crossing!==null)throw Error('JOURNAL_CROSSING_CHANGED');
 const r=receive.receipt,h=hold.receipt,x=original.crossing_id;
 for(const rc of [r,h]){
   if(rc.crossing_id!==x||rc.world_id!==config.world_id||
      rc.receiver_particular!==config.receiver_particular||
      rc.contract_ref!==config.contract_ref||
      rc.semantic_effect!=='none'||rc.descendant_refs.length!==0||
      canonical(rc.residual_refs)!==canonical([original.source_sha256]))throw Error('RECEIPT_BOUNDARY');
 }
 if(r.kind!=='RECEIVED'||h.kind!=='R3_HOLD'||
   r.pre_state_ref!==await stateRef(x,'NONE')||
   r.post_state_ref!==await stateRef(x,'NONE')||
   h.pre_state_ref!==await stateRef(x,'RECEIVED')||
   h.post_state_ref!==await stateRef(x,'HOLD')||
   r.extensions?.local_receiver?.law!=='RECEIVED != ADMITTED'||
   r.extensions?.local_receiver?.history_head_before!==null||
   h.extensions?.local_receiver?.disposition!=='HOLD'||
   h.extensions?.local_receiver?.receive_receipt_id!==r.receipt_id||
   h.extensions?.local_receiver?.history_head_before!==receive.event_hash||
   h.extensions?.local_receiver?.protected_payload_effect!==false)throw Error('RECEIVE_HOLD_CHAIN');
 const fingerprint='sha256:'+await hex(canonical(b.receiver_public_key));
 return Object.freeze({
   schema:'webz/verified-gr o-receipts/v0'.replace(' ',''),
   status:'SIGNED_RECEIVED_AND_HELD',
   crossing_id:x,source_sha256:original.source_sha256,
   receive_receipt_id:r.receipt_id,hold_receipt_id:h.receipt_id,
   history_head:b.history_head,receiver_key_fingerprint:fingerprint,
   evidence:'VALID_RELATTE_RECEIPT_SIGNATURES_AND_LOCAL_JOURNAL',
   operator_identity:'NOT_AUTHENTICATED_BY_THIS_BUNDLE',
   source_publisher_identity:'NOT_AUTHENTICATED_BY_EXPERIMENTAL_KEY',
   world_admission:false,remote_delivery:false
 });
}
