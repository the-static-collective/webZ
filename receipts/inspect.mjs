// WEBZ-RECEIPT-GLASS-001: observe; never receive, sign, admit or publish.
import {canonical} from '../arrivals/verify.mjs';
import {verifySignedHold} from '../arrivals/receipts.mjs';

const enc=new TextEncoder();
const crossingFields='schema protocol_version source_particular source_world source_history_head parents declared_kind payload_refs requested_effect capability_ref privacy_policy audience_policy return_address created_at signing extensions crossing_id'.split(' ');
const receiptFields='schema receipt_id crossing_id world_id receiver_particular kind semantic_effect contract_ref pre_state_ref post_state_ref descendant_refs residual_refs note created_at signing extensions'.split(' ');
const signingFields=['algorithm','public_key','domain','signature'];
const keyFields=['kty','crv','x','y'];
const modes=Object.freeze({
 SIGNATURE_ONLY:'SIGNATURE_ONLY',
 LOCAL_JOURNAL_VERIFIED:'LOCAL_JOURNAL_VERIFIED',
 UNVERIFIED_ARCHIVE:'UNVERIFIED_ARCHIVE'
});
const exact=(v,names)=>{
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==names.length||names.some(k=>!Object.hasOwn(v,k)))throw Error('UNEXPECTED_FIELDS');
};
function base64url(s){
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('INVALID_BASE64URL');
 const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/'));
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 if(btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')!==s)throw Error('INVALID_BASE64URL');
 return bytes;
}
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
const fingerprint=async key=>'sha256:'+await sha(canonical(key));
const safeDate=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
async function signatureOf(record,type){
 const signing=record.signing;
 exact(signing,signingFields);exact(signing.public_key,keyFields);
 const k=signing.public_key;
 if(k.kty!=='EC'||k.crv!=='P-256'||base64url(k.x).length!==32||base64url(k.y).length!==32)throw Error('UNSUPPORTED_PUBLIC_KEY');
 if(signing.algorithm!=='ECDSA-P256-SHA256'||signing.domain!=='relatte.'+type+'-signature/v0')throw Error('UNSUPPORTED_SIGNATURE_PROFILE');
 const idField=type==='crossing'?'crossing_id':'receipt_id';
 const idPrefix=type==='crossing'?'relatte-crossing-v0:':'relatte-receipt-v0:';
 const identityDomain=type==='crossing'?'reLATTE-CrossingEnvelope-v0|':'reLATTE-Receipt-v0|';
 const signatureDomain=type==='crossing'?'reLATTE-CrossingSignature-v0|':'reLATTE-ReceiptSignature-v0|';
 const {signature,...unsignedSigning}=signing;
 const {[idField]:id,...unsignedRecord}=record;
 const body={...unsignedRecord,signing:unsignedSigning};
 if(id!==idPrefix+await sha(identityDomain+canonical(body)))throw Error('IDENTITY_HASH_MISMATCH');
 const raw=base64url(signature);
 if(raw.length!==64)throw Error('INVALID_SIGNATURE_LENGTH');
 const key=await crypto.subtle.importKey('jwk',k,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const signed={[idField]:id,...body};
 if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,raw,enc.encode(signatureDomain+canonical(signed))))throw Error('INVALID_SIGNATURE');
 return await fingerprint(k);
}
const evidence=(stage,id,detail)=>({stage,id,detail});
function result(type,mode,fields,steps,lenses){
 return {schema:'webz/receipt-glass-001/v0',type,mode,
  cryptographic_verification:mode!==modes.UNVERIFIED_ARCHIVE,
  operator_identity:'NOT_AUTHENTICATED',
  independent_material_custody:'NOT_ESTABLISHED',
  remote_delivery:'NOT_ESTABLISHED',
  authority:'NO_AUTHORITY_GRANTED_BY_VIEWER',
  fields,steps,lenses};
}
const commonLenses={
 identity:'The signature establishes key control, not a legal or human identity.',
 ancestry:'No complete independent ancestry reconstruction is claimed.',
 custody:'A reference or hash does not prove present custody of original bytes.',
 time:'A signed timestamp is a claim, not an independently trusted clock.',
 witness:'No out-of-band signer authentication is supplied.',
 policy:'The viewer does not run the owning world’s admission policy.',
 effect:'A signed claim is not itself a new local effect.',
 material:'Unprovided original bytes cannot be verified.',
 contradiction:'No global conflict search or reconciliation was performed.',
 survival:'Exportable evidence is not a promise of durable hosting.',
 fog:'Unobserved facts remain unresolved.'
};
export async function inspectReceipt(input){
 const raw=typeof input==='string'?input:JSON.stringify(input);
 if(typeof raw!=='string'||enc.encode(raw).byteLength>131072)throw Error('IMPORT_LIMIT_128KB');
 const b=JSON.parse(raw);
 if(!object(b)||typeof b.schema!=='string')throw Error('UNSUPPORTED_SCHEMA');
 if(b.schema==='gro.abundent-signed-receiver/v0'){
  const verified=await verifySignedHold(raw);
  const c=b.carrier.crossing;
  return result('GrO signed local journal',modes.LOCAL_JOURNAL_VERIFIED,{
   crossing_id:verified.crossing_id,source_sha256:verified.source_sha256,
   receive_receipt_id:verified.receive_receipt_id,hold_receipt_id:verified.hold_receipt_id,
   history_head:verified.history_head,receiver_key_fingerprint:verified.receiver_key_fingerprint,
   destination:b.config.world_id,disposition:'HOLD',source_world:c.source_world
  },[
   evidence('SIGNED CROSSING',verified.crossing_id,'Embedded LemonPRESS bytes and experimental crossing signature independently verified.'),
   evidence('SIGNED RECEIVE',verified.receive_receipt_id,'Receiver-local signed RECEIVE, event hash and state references verified.'),
   evidence('SIGNED HOLD',verified.hold_receipt_id,'Signed disposition and linked local history checked; no ADMIT.')
  ],{...commonLenses,ancestry:'The two-event receiver journal and its hash linkage were verified; other history was not.',material:'The embedded pinned LemonPRESS source bytes and Git blob digest were verified; remote custody was not.',effect:'Receiver signed HOLD; no local ADMIT or semantic effect.',witness:'Receiver public-key continuity verified; operator identity remains unverified.'});
 }
 if(b.schema==='relatte.crossing-envelope/v0'){
  exact(b,crossingFields);
  if(b.protocol_version!=='0'||!safeDate(b.created_at)||!Array.isArray(b.parents)||!Array.isArray(b.payload_refs)||!object(b.audience_policy))throw Error('INVALID_CROSSING_SHAPE');
  const fp=await signatureOf(b,'crossing');
  return result('reLATTE signed crossing',modes.SIGNATURE_ONLY,{
   crossing_id:b.crossing_id,source_world:b.source_world,source_particular:b.source_particular,
   declared_kind:b.declared_kind,requested_effect:b.requested_effect,
   signer_fingerprint:fp,parents:b.parents.length,payload_references:b.payload_refs.length
  },[evidence('SIGNED CROSSING',b.crossing_id,'Canonical ID and P-256 signature verified; source, parents, payload and destination are not independently authenticated.')],{
   ...commonLenses,ancestry:String(b.parents.length)+' parent references are asserted but have not been retrieved or checked.',
   material:String(b.payload_refs.length)+' payload references are signed; payload bytes have not been checked.',
   effect:'Requested effect is a signed proposal, not receiver admission.'
  });
 }
 if(b.schema==='relatte.receipt/v0'){
  exact(b,receiptFields);
  if(!safeDate(b.created_at)||!Array.isArray(b.descendant_refs)||!Array.isArray(b.residual_refs)||typeof b.kind!=='string')throw Error('INVALID_RECEIPT_SHAPE');
  const fp=await signatureOf(b,'receipt');
  return result('reLATTE signed receipt',modes.SIGNATURE_ONLY,{
   receipt_id:b.receipt_id,crossing_id:b.crossing_id,world_id:b.world_id,
   receiver_particular:b.receiver_particular,kind:b.kind,semantic_effect:b.semantic_effect,
   signer_fingerprint:fp,pre_state_ref:b.pre_state_ref,post_state_ref:b.post_state_ref
  },[evidence('SIGNED RECEIPT',b.receipt_id,'Canonical ID and P-256 signature verified; state, prior history and receiver authority are not independently replayed.')],{
   ...commonLenses,ancestry:'Crossing and state references are signed assertions; the referenced records were not supplied.',
   effect:'Signed kind '+b.kind+' and semantic effect '+String(b.semantic_effect)+' have not been independently enacted or replayed.'
  });
 }
 if(b.schema==='cannon.branch-work-receipt/v0'){
  if(b.disposition!=='HOLD'||b.remote_effects!==0||
   b.receipt_signatures_cold_verified!==true||b.actual_local_hash_executed!==true||
   b.owner_operational_permission!==false||b.public_service_deployed!==false||
   !Array.isArray(b.nonClaims)||b.nonClaims.length<3)throw Error('UNSUPPORTED_ARCHIVE_CLAIMS');
  for(const k of ['crossing_id','receive_receipt_id','disposition_receipt_id']){
   if(typeof b[k]!=='string'||!/^relatte-(?:crossing|receipt)-v0:[a-f0-9]{64}$/.test(b[k]))throw Error('BAD_ARCHIVED_ID');
  }
  return result('CANNON archived run report',modes.UNVERIFIED_ARCHIVE,{
   crossing_id:b.crossing_id,receive_receipt_id:b.receive_receipt_id,hold_receipt_id:b.disposition_receipt_id,
   source_ghot_commit:b.ghot_exact_sha,source_relatte_commit:b.relatte_exact_sha,
   disposition:'HOLD',original_ci_claim:'RECEIPT_SIGNATURES_COLD_VERIFIED_BY_ORIGINAL_RUN',
   source_url:'https://github.com/the-static-collective/CANNON/actions/runs/38134430085'
  },[
   evidence('SOURCE CLAIM',String(b.ghot_exact_sha),'Report says GHoT performed a bounded local hash job. Not independently re-executed here.'),
   evidence('RECEIPT IDS',b.crossing_id,'Report provides receipt IDs; original signed receipt objects were not supplied to this reader.'),
   evidence('REPORTED HOLD',b.disposition_receipt_id,'Original CI reported HOLD. This display does not independently verify signatures.')
  ],{...commonLenses,identity:'The imported archive is unsigned as a whole; no signer identity established.',ancestry:'Receipt identifiers are displayed, not independently validated against signed bodies.',witness:'Original CI reports cold verification, but this viewer cannot reproduce it from this summary.',effect:'An archived report claims HOLD. Displaying it creates no admission or execution.',fog:'Original signed receipt bodies, independent key trust and remote custody are not available in this report.'});
 }
 throw Error('UNSUPPORTED_SCHEMA');
}
export const lensNames=Object.freeze(['identity','ancestry','custody','time','witness','policy','effect','material','contradiction','survival','fog']);
