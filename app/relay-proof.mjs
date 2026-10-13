// RELAY-001: observation-only reLATTE generic signed opaque round trip.
// Separate from webZ's MAXHINAL-13 viewer. A signature is not human identity.
import {canonical,hash} from './model.mjs';
const MAX=524288;
const crossingKeys='schema crossing_id protocol_version source_particular source_world source_history_head parents declared_kind payload_refs requested_effect capability_ref privacy_policy audience_policy return_address created_at signing extensions'.split(' ');
const receiptKeys='schema receipt_id crossing_id world_id receiver_particular kind semantic_effect contract_ref pre_state_ref post_state_ref descendant_refs residual_refs note created_at signing extensions'.split(' ');
const reportKeys='schema request_id crossing transport_frame receive_receipt disposition_receipt receiver_snapshot laws'.split(' ');
const requireTrue=(v,code)=>{if(!v)throw Error(code)};
function exact(o,keys){requireTrue(o!==null&&typeof o==='object'&&!Array.isArray(o),'INVALID_OBJECT');const actual=Object.keys(o).sort(),allowed=[...keys].sort();requireTrue(JSON.stringify(actual)===JSON.stringify(allowed),'INVALID_FIELDS')}
function clean(v,d=0){
 requireTrue(d<=42,'EXCESSIVE_DEPTH');
 if(typeof v==='number')requireTrue(Number.isSafeInteger(v)||Number.isFinite(v),'INVALID_NUMBER');
 if(typeof v==='string')requireTrue(v.length<=100000&&!/-----BEGIN (?:EC|PRIVATE)|Bearer\s/i.test(v),'UNSAFE_STRING');
 if(v&&typeof v==='object'){
  requireTrue(!Array.isArray(v)||v.length<=500,'EXCESSIVE_ITEMS');
  for(const [k,x] of Object.entries(v)){requireTrue(!['__proto__','constructor','prototype','d','private_jwk','private_key'].includes(k),'PRIVATE_OR_UNSAFE_FIELD');clean(x,d+1)}
 }
}
function b64url(s,len){
 requireTrue(typeof s==='string'&&/^[A-Za-z0-9_-]+$/.test(s),'INVALID_B64');
 const bytes=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),ch=>ch.charCodeAt(0));
 const back=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 requireTrue(bytes.length===len&&back===s,'INVALID_B64');return bytes;
}
function sigBody(o,domain){
 exact(o,['algorithm','public_key','signature','domain']);
 requireTrue(o.algorithm==='ECDSA-P256-SHA256'&&o.domain===domain,'INVALID_SIGNING_DOMAIN');
 const key=o.public_key;exact(key,['kty','crv','x','y']);
 requireTrue(key.kty==='EC'&&key.crv==='P-256','INVALID_EC_CURVE');
 b64url(key.x,32);b64url(key.y,32);b64url(o.signature,64);
 return {algorithm:o.algorithm,public_key:{kty:'EC',crv:'P-256',x:key.x,y:key.y},domain};
}
function required(o,k){requireTrue(typeof o[k]==='string'&&o[k].length>0,'MISSING_'+k);return o[k]}
function timestamp(v){requireTrue(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v),'INVALID_TIMESTAMP');return v}
function signingBody(o,type){
 const cross=type==='crossing';exact(o,cross?crossingKeys:receiptKeys);
 requireTrue(o.schema===(cross?'relatte.crossing-envelope/v0':'relatte.receipt/v0'),'INVALID_SIGNED_SCHEMA');
 const signing=sigBody(o.signing,cross?'relatte.crossing-signature/v0':'relatte.receipt-signature/v0');
 const created_at=timestamp(required(o,'created_at'));
 if(cross){requireTrue(o.protocol_version==='0'&&Array.isArray(o.parents)&&Array.isArray(o.payload_refs),'INVALID_CROSSING');
  return {schema:o.schema,protocol_version:'0',source_particular:required(o,'source_particular'),source_world:required(o,'source_world'),source_history_head:o.source_history_head??null,parents:o.parents,declared_kind:required(o,'declared_kind'),payload_refs:o.payload_refs,requested_effect:o.requested_effect??null,capability_ref:o.capability_ref??null,privacy_policy:o.privacy_policy??null,audience_policy:o.audience_policy??null,return_address:o.return_address??null,created_at,signing,extensions:o.extensions??{}};
 }
 requireTrue(Array.isArray(o.descendant_refs)&&Array.isArray(o.residual_refs),'INVALID_RECEIPT');
 return {schema:o.schema,crossing_id:required(o,'crossing_id'),world_id:required(o,'world_id'),receiver_particular:required(o,'receiver_particular'),kind:required(o,'kind'),semantic_effect:required(o,'semantic_effect'),contract_ref:o.contract_ref??null,pre_state_ref:o.pre_state_ref??null,post_state_ref:o.post_state_ref??null,descendant_refs:o.descendant_refs,residual_refs:o.residual_refs,note:o.note??null,created_at,signing,extensions:o.extensions??{}};
}
async function verifySigned(o,type){
 const cross=type==='crossing',field=cross?'crossing_id':'receipt_id',body=signingBody(o,type);
 const prefix=cross?'reLATTE-CrossingEnvelope-v0|':'reLATTE-Receipt-v0|';
 const computed='relatte-'+type+'-v0:'+(await hash(prefix+canonical(body))).slice(7);
 requireTrue(o[field]===computed,'ID_MISMATCH');
 const signPrefix=cross?'reLATTE-CrossingSignature-v0|':'reLATTE-ReceiptSignature-v0|';
 const verifyBytes=new TextEncoder().encode(signPrefix+canonical({[field]:computed,...body}));
 const key=await crypto.subtle.importKey('jwk',body.signing.public_key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 requireTrue(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,b64url(o.signing.signature,64),verifyBytes),'SIGNATURE_MISMATCH');
 return true;
}
async function checkTransport(f,crossing){
 exact(f,['schema','transport','crossing_id','canonical_body_sha256','media_type','body','route_note','created_at','laws','transport_id']);
 requireTrue(f.schema==='relatte.transport-frame/v0'&&f.transport==='file-bundle'&&f.media_type==='application/vnd.relatte.crossing+json','BAD_TRANSPORT');
 timestamp(f.created_at);requireTrue(f.crossing_id===crossing.crossing_id,'TRANSPORT_CROSSING_ID');
 requireTrue(typeof f.body==='string'&&f.body.length<100000&&await hash(f.body)==='sha256:'+f.canonical_body_sha256,'TRANSPORT_HASH');
 const parsed=JSON.parse(f.body);requireTrue(canonical(parsed)===f.body&&canonical(parsed)===canonical(crossing),'TRANSPORT_BODY_MISMATCH');
 const frameBody={schema:f.schema,transport:f.transport,crossing_id:f.crossing_id,canonical_body_sha256:f.canonical_body_sha256,media_type:f.media_type,body:f.body,route_note:f.route_note,created_at:f.created_at,laws:f.laws};
 requireTrue(f.transport_id==='relatte-transport-v0:'+(await hash('reLATTE-TransportFrame-v0|'+canonical(frameBody))).slice(7),'TRANSPORT_ID_MISMATCH');
}
export async function inspectRelay(input){
 const raw=typeof input==='string'?input:JSON.stringify(input);
 requireTrue(new TextEncoder().encode(raw).length<=MAX,'REPORT_LIMIT');
 const r=JSON.parse(raw);clean(r);exact(r,reportKeys);
 requireTrue(r.schema==='relatte.opaque-roundtrip-result/v0','INVALID_REPORT_SCHEMA');
 await verifySigned(r.crossing,'crossing');await checkTransport(r.transport_frame,r.crossing);
 await verifySigned(r.receive_receipt,'receipt');await verifySigned(r.disposition_receipt,'receipt');
 const x=r.crossing,h=r.receive_receipt,d=r.disposition_receipt,s=r.receiver_snapshot;
 requireTrue(x.declared_kind==='OPAQUE_ORGAN_ARTIFACT'&&x.extensions?.organ_adapter?.family_ref==='organ:ghot/media-probe','NOT_GHOT_DONOR');
 requireTrue(x.requested_effect?.execute===false&&x.requested_effect?.publish===false&&x.requested_effect?.song_bytes_transferred===false,'UNBOUNDED_EFFECT');
 requireTrue(/^sha256:[a-f0-9]{64}$/.test(x.source_history_head)&&x.payload_refs.length===5,'INVALID_SOURCE_REFS');
 const refs=new Map();for(const ref of x.payload_refs){
  exact(ref,['address','role','media_type']);requireTrue(/^sha256:[a-f0-9]{64}$/.test(ref.address)&&ref.media_type==='application/json'&&ref.role.startsWith('local-evidence:'),'BAD_PAYLOAD_REF');
  requireTrue(!refs.has(ref.role),'DUPLICATE_PAYLOAD_ROLE');refs.set(ref.role,ref.address);
 }
 for(const name of ['ghot-receipt.json','ghot-task.json','loadout-binding.json','loadout-parameters.json','relay-crossing.json'])requireTrue(refs.has('local-evidence:'+name),'MISSING_GHOT_PROVENANCE');
 requireTrue(h.crossing_id===x.crossing_id&&d.crossing_id===x.crossing_id&&h.kind==='RECEIVED'&&h.semantic_effect==='none'&&d.kind==='R3_HOLD'&&d.semantic_effect==='none','RECEIVE_HOLD_INVALID');
 requireTrue(h.world_id===d.world_id&&h.receiver_particular===d.receiver_particular&&canonical(h.signing.public_key)===canonical(d.signing.public_key)&&d.extensions?.local_receiver?.receive_receipt_id===h.receipt_id&&d.extensions?.local_receiver?.disposition==='HOLD','RECEIVER_SIGNATURE_BINDING');
 requireTrue(s.schema==='relatte.local-receiver-snapshot/v0'&&s.world_id===h.world_id&&s.receiver_particular===h.receiver_particular&&s.held.includes(x.crossing_id)&&s.admitted.length===0,'SNAPSHOT_NOT_HELD');
 return {schema:'webz/relay-observation/v0',result:'SIGNED_HOLD_OBSERVED',crossing_id:x.crossing_id,donor_receipt_id:x.extensions.organ_adapter.donor_claims.ghot_receipt_id,source_media_sha256:x.source_history_head,receiver_world:h.world_id,signatures:{crossing:true,receive:true,hold:true},transport:'SIGNED_FRAME_CONSISTENT',payload_refs:refs.size,donor_bytes:'NOT_PRESENT_IN_THIS_REPORT',original_audio_bytes:'UNOBSERVED',signer_identity:'SELF_ASSERTED_KEY_NOT_HUMAN_IDENTITY',disposition:'HOLD',admitted:false,published:false,authority_transferred:false};
}
