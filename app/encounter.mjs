// FIRST-ENCOUNTER-002 preflight. Verify-only; no transport, signing or history writes.
// Native reLATTE v0 owns crossings/receipts/responses. See fixture provenance.
import {canonical,exact,hash,sensitive} from './model.mjs';
const CROSSING='schema crossing_id protocol_version source_particular source_world source_history_head parents declared_kind payload_refs requested_effect capability_ref privacy_policy audience_policy return_address created_at signing extensions'.split(' ');
const RECEIPT='schema receipt_id crossing_id world_id receiver_particular kind semantic_effect contract_ref pre_state_ref post_state_ref descendant_refs residual_refs note created_at signing extensions'.split(' ');
const INVITATION='schema invitation_id issuer_world_id receiver_particular source_world_id source_key_fingerprint purpose origin media_type max_bytes issued_at expires_at rights signing'.split(' ');
const TRUST='schema issuer_world_id source_world_id source_particular receiver_particular issuer_key_fingerprint source_key_fingerprint approved_origin revoked_invitation_ids'.split(' ');
const LAWS=['BUNDLE != RECEIPT','RESPONSE != SHARED DATABASE','VERIFICATION != AGREEMENT'];
const same=(a,b)=>canonical(a)===canonical(b);
function nonempty(v){if(typeof v!=='string'||!v.trim()||v.length>512)throw Error('INVALID_TEXT');return v;}
function safeJson(v,depth=0){
 if(depth>30)throw Error('DEPTH_LIMIT');
 if(typeof v==='number'&&(!Number.isFinite(v)||(Number.isInteger(v)&&!Number.isSafeInteger(v))))throw Error('INVALID_NUMBER');
 if(typeof v==='string'){
  if(v.length>8192||sensitive(v))throw Error('UNSANITIZED_TEXT');
  for(let i=0;i<v.length;i++){const c=v.charCodeAt(i);if(c>=0xd800&&c<=0xdbff){const next=v.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))throw Error('LONE_SURROGATE');}else if(c>=0xdc00&&c<=0xdfff)throw Error('LONE_SURROGATE');}
 }
 if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){
  if(['d','__proto__','constructor','prototype'].includes(k)||/(private|password|secret|bearer|token|authorization)/i.test(k))throw Error('UNSANITIZED_FIELD');safeJson(x,depth+1);
 }
}
function bounded(value){
 const raw=typeof value==='string'?value:JSON.stringify(value);
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>131072)throw Error('PACKET_LIMIT_128_KIB');
 const parsed=JSON.parse(raw);safeJson(parsed);return parsed;
}
function timestamp(s){
 nonempty(s);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s))throw Error('INVALID_TIME_CUT');
 const ms=Date.parse(s);if(!Number.isFinite(ms)||new Date(ms).toISOString().replace('.000Z','Z')!==s.replace('.000Z','Z'))throw Error('INVALID_TIME_CUT');return ms;
}
function origin(s){
 nonempty(s);const url=new URL(s);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||url.origin!==s)throw Error('UNSAFE_ORIGIN');return s;
}
function fingerprint(v){if(typeof v!=='string'||!/^sha256:[a-f0-9]{64}$/.test(v))throw Error('INVALID_PIN');return v;}
function b64(s,len){
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('INVALID_BASE64URL');
 const bytes=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 if(bytes.length!==len||btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')!==s)throw Error('INVALID_BASE64URL');return bytes;
}
function publicKey(k){exact(k,['kty','crv','x','y']);if(k.kty!=='EC'||k.crv!=='P-256')throw Error('INVALID_KEY');b64(k.x,32);b64(k.y,32);return {kty:'EC',crv:'P-256',x:k.x,y:k.y};}
function signing(s,domain){exact(s,['algorithm','public_key','signature','domain']);if(s.algorithm!=='ECDSA-P256-SHA256'||s.domain!==domain)throw Error('INVALID_SIGNING');return {algorithm:s.algorithm,public_key:publicKey(s.public_key),domain};}
async function verifySignature(s,body,domain,pin){
 if(await hash(canonical(body.signing.public_key))!==pin)throw Error('TRUSTED_KEY_MISMATCH');
 const key=await crypto.subtle.importKey('jwk',body.signing.public_key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,b64(s.signature,64),new TextEncoder().encode(domain+canonical(body))))throw Error('SIGNATURE_MISMATCH');
}
async function verifyNative(o,type,pin){
 const cross=type==='crossing';exact(o,cross?CROSSING:RECEIPT);
 const idField=cross?'crossing_id':'receipt_id',domain=cross?'relatte.crossing-signature/v0':'relatte.receipt-signature/v0';
 if(o.schema!==(cross?'relatte.crossing-envelope/v0':'relatte.receipt/v0'))throw Error('INVALID_NATIVE_SCHEMA');
 timestamp(o.created_at);if(cross&&o.protocol_version!=='0')throw Error('INVALID_PROTOCOL_VERSION');
 const {[idField]:id,signing:s,...fields}=o;
 const body={...fields,signing:signing(s,domain)};
 const prefix=cross?'relatte-crossing-v0:':'relatte-receipt-v0:';
 const computed=prefix+(await hash((cross?'reLATTE-CrossingEnvelope-v0|':'reLATTE-Receipt-v0|')+canonical(body))).slice(7);
 if(id!==computed)throw Error('NATIVE_ID_MISMATCH');
 await verifySignature(s,{[idField]:id,...body},cross?'reLATTE-CrossingSignature-v0|':'reLATTE-ReceiptSignature-v0|',pin);
}
async function invitation(i,t){
 exact(i,INVITATION);
 if(i.schema!=='webz/porch-invitation/v0'||i.purpose!=='FIRST-ENCOUNTER-002'||i.media_type!=='text/plain'||i.rights!=='inspection-only-no-publication')throw Error('INVITATION_SCOPE');
 if(i.issuer_world_id!==t.issuer_world_id||i.source_world_id!==t.source_world_id||i.receiver_particular!==t.receiver_particular||i.source_key_fingerprint!==t.source_key_fingerprint||origin(i.origin)!==origin(t.approved_origin))throw Error('INVITATION_BINDING');
 if(!Number.isInteger(i.max_bytes)||i.max_bytes<1||i.max_bytes>2048)throw Error('INVITATION_BYTE_BOUND');
 const start=timestamp(i.issued_at),end=timestamp(i.expires_at);if(end<=start||end-start>900000)throw Error('INVITATION_TTL');
 const {invitation_id:id,signing:s,...fields}=i;const body={...fields,signing:signing(s,'webz.porch-invitation-signature/v0')};
 if(id!=='webz-porch-invitation-v0:'+(await hash('webZ-PorchInvitation-v0|'+canonical(body))).slice(7))throw Error('INVITATION_ID_MISMATCH');
 await verifySignature(s,{invitation_id:id,...body},'webZ-PorchInvitationSignature-v0|',t.issuer_key_fingerprint);return {start,end};
}
export async function inspectEncounter(packetValue,trustValue,at){
 const p=bounded(packetValue),t=bounded(trustValue),cut=timestamp(at);
 exact(p,['schema','invitation','crossing','material','response']);exact(t,TRUST);
 if(p.schema!=='webz/encounter-packet/v0'||t.schema!=='webz/encounter-trust/v0')throw Error('INVALID_ENCOUNTER_SCHEMA');
 for(const k of ['issuer_world_id','source_world_id','source_particular','receiver_particular'])nonempty(t[k]);
 if(t.issuer_world_id===t.source_world_id)throw Error('DISTINCT_WORLDS_REQUIRED');
 fingerprint(t.issuer_key_fingerprint);fingerprint(t.source_key_fingerprint);
 if(t.issuer_key_fingerprint===t.source_key_fingerprint)throw Error('DISTINCT_KEYS_REQUIRED');
 if(!Array.isArray(t.revoked_invitation_ids)||t.revoked_invitation_ids.some(id=>typeof id!=='string'||!/^webz-porch-invitation-v0:[a-f0-9]{64}$/.test(id)))throw Error('INVALID_REVOCATION_BASIS');
 const {start,end}=await invitation(p.invitation,t),i=p.invitation,x=p.crossing;
 if(cut<start)throw Error('INVITATION_NOT_YET_ISSUED');
 const revoked=t.revoked_invitation_ids.includes(i.invitation_id),expired=cut>=end;
 if(p.response===null&&(revoked||expired))throw Error(revoked?'INVITATION_REVOKED_AT_CUT':'INVITATION_EXPIRED_AT_CUT');
 await verifyNative(x,'crossing',t.source_key_fingerprint);
 if(typeof p.material!=='string'||!p.material.trim())throw Error('PUBLIC_TEXT_REQUIRED');
 const length=new TextEncoder().encode(p.material).length,address=await hash(p.material);
 if(length>i.max_bytes)throw Error('MATERIAL_BYTE_BOUND');
 if(x.source_world!==t.source_world_id||x.source_particular!==t.source_particular||x.declared_kind!=='FIRST_ENCOUNTER_002_TEXT'||x.capability_ref!==i.invitation_id||x.return_address!==t.source_world_id)throw Error('PROPOSAL_SCOPE');
 if(!same(x.audience_policy,{destination:t.issuer_world_id})||!same(x.privacy_policy,{publication:'not-granted'})||!same(x.requested_effect,{kind:'bounded-text-candidate',authority:'receiver-local'})||x.source_history_head!==null||!same(x.parents,[]))throw Error('FOUNDING_PROPOSAL_BINDING');
 exact(x.extensions,['specimen','rights','payload_is_synthetic']);
 if(x.extensions.specimen!=='FIRST-ENCOUNTER-002'||x.extensions.rights!==i.rights||typeof x.extensions.payload_is_synthetic!=='boolean')throw Error('PROPOSAL_RIGHTS');
 if(!same(x.payload_refs,[{address,role:'proposed-contribution',media_type:'text/plain',byte_length:length}]))throw Error('EXACT_MATERIAL_BINDING');
 const proposalTime=timestamp(x.created_at);if(proposalTime<start||proposalTime>=end||proposalTime>cut)throw Error('PROPOSAL_OUTSIDE_INVITATION');
 let decision='UNOBSERVED',receiveId=null,decisionId=null,bundleId=null;
 if(p.response!==null){
  const b=p.response;exact(b,['schema','bundle_id','crossing_id','world_id','receiver_particular','receive_receipt','disposition_receipt','laws']);
  if(b.schema!=='relatte.sovereign-response-bundle/v0'||b.crossing_id!==x.crossing_id||b.world_id!==t.issuer_world_id||b.receiver_particular!==t.receiver_particular||!same(b.laws,LAWS))throw Error('RETURN_SCOPE');
  const {bundle_id:id,...body}=b;
  if(id!=='relatte-sovereign-response-v0:'+(await hash('reLATTE-SovereignResponseBundle-v0|'+canonical(body))).slice(7))throw Error('RETURN_INTEGRITY');
  const r=b.receive_receipt,d=b.disposition_receipt;
  for(const receipt of [r,d]){
   await verifyNative(receipt,'receipt',t.issuer_key_fingerprint);
   if(receipt.crossing_id!==x.crossing_id||receipt.world_id!==t.issuer_world_id||receipt.receiver_particular!==t.receiver_particular||receipt.contract_ref!=='FIRST-ENCOUNTER-002/v0')throw Error('RETURN_RECEIPT_BINDING');
  }
  const receiveTime=timestamp(r.created_at),decisionTime=timestamp(d.created_at);
  if(receiveTime<proposalTime||receiveTime>=end||decisionTime<receiveTime||decisionTime>cut)throw Error('RETURN_ORDER');
  if(r.kind!=='RECEIVED'||r.semantic_effect!=='none'||r.pre_state_ref!==r.post_state_ref||!same(r.descendant_refs,[])||!same(r.residual_refs,[address]))throw Error('INERT_RECEIVE_REQUIRED');
  const local=d.extensions?.local_receiver;
  decision=local?.disposition;
  if(!['HOLD','REFUSE','ADMIT'].includes(decision)||d.kind!==`R3_${decision}`||local.receive_receipt_id!==r.receipt_id||local.protected_payload_effect!==(decision==='ADMIT'))throw Error('OWNER_DISPOSITION_BINDING');
  if(d.semantic_effect!==(decision==='ADMIT'?'encounter-local-candidate-only':'none')||!same(d.descendant_refs,[])||!same(d.residual_refs,decision==='ADMIT'?[]:[address]))throw Error('DISPOSITION_EFFECT');
  receiveId=r.receipt_id;decisionId=d.receipt_id;bundleId=id;
 }
 return {schema:'webz/encounter-preflight/v0',packet_sha256:await hash(canonical(p)),trust_sha256:await hash(canonical(t)),verification_cut:at,clock_basis:'caller-supplied cut; no trusted global time',invitation_id:i.invitation_id,invitation_available_at_cut:!revoked&&!expired,revocation_basis:'caller-supplied local knowledge; no remote freshness claim',source_world_id:t.source_world_id,receiver_world_id:t.issuer_world_id,proposal_sha256:address,proposal_bytes:length,crossing_id:x.crossing_id,payload_is_synthetic:x.extensions.payload_is_synthetic,receive_receipt_id:receiveId,decision_receipt_id:decisionId,bundle_id:bundleId,decision,return_verified:p.response!==null,delivery_enabled:false,authenticated_transport:'UNOBSERVED',two_device_encounter:'UNOBSERVED',human_action:'UNOBSERVED',source_history:'NOT_ACQUIRED',receiver_history:'NOT_ACQUIRED',world_history_write:false,publication_permission:'NOT_GRANTED'};
}
