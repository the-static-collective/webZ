// LINK WALLET 003: review-only owner delegation desk. Nothing in this file
// transmits a signed grant, imports the owner's private key, or performs an
// action on a third-party service. No reLATTE-native R3 claim is made here.
import {
  FORMAT,ALLOW,FORBID,verifySigned,grantDigest,publicFingerprint,
  evaluateGrant,normalizePublicKey,stable,digest
} from './delegation-core.mjs';
export const PIN_SCHEMA='abundent.wallet-local-owner-pin/v1';
export const RECEIPT_SCHEMA='abundent.wallet-local-review-receipt/v1';
export const RECEIPT_DOMAIN='ABUNDENT-LINK-WALLET-003-REVIEW-RECEIPT|';
const exact=(v,fields)=>v!==null&&typeof v==='object'&&!Array.isArray(v)
  &&Object.keys(v).length===fields.length&&fields.every(k=>Object.hasOwn(v,k));
const timestamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))
  &&new Date(Date.parse(x)).toISOString()===x;
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const un64=s=>{
  if(typeof s!=='string'||!/^[a-zA-Z0-9_-]+$/.test(s))throw Error('Invalid signature encoding.');
  const bytes=Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-s.length%4)%4)),s=>s.charCodeAt(0));
  if(b64(bytes)!==s)throw Error('Noncanonical signature encoding.');
  return bytes;
};
export async function previewGrant(grant){
  if(!(await verifySigned(grant))||grant.body?.schema!=='world-forge/delegation-grant/v0')
    throw Error('Invalid or unsupported signed WF008 grant.');
  return {
    schema:'abundent.wallet-owner-grant-preview/v1',
    public_key_fingerprint:await publicFingerprint(grant.body.owner_public_key),
    signed_grant_digest:await grantDigest(grant),
    audience:grant.body.audience,
    delegate:grant.body.delegate,
    issued_at:grant.body.issued_at,
    expires_at:grant.body.expires_at,
    scopes:[...grant.body.scopes],
    self_attested_only:true,
    signer_identity_independently_verified:false,
    wallet_link_role_unchanged:true,
    automatic_admission:false
  };
}
export function validatePin(pin){
  if(!exact(pin,['schema','public_key_fingerprint','signed_grant_digest','audience','enrolled_at','basis',
    'real_human_identity_verified','automatic_actions_enabled'])
    ||pin.schema!==PIN_SCHEMA||!hex(pin.public_key_fingerprint)||!hex(pin.signed_grant_digest)
    ||pin.audience!=='the-static-collective/reLATTE/world-forge-experiments'
    ||!timestamp(pin.enrolled_at)
    ||pin.basis!=='OWNER_TYPED_EXACT_FINGERPRINT_IN_LOCAL_BROWSER'
    ||pin.real_human_identity_verified!==false||pin.automatic_actions_enabled!==false)
    throw Error('Invalid or unsafe local owner key pin.');
  return true;
}
export function makePin(preview,typed,confirmed,at){
  if(!exact(preview,['schema','public_key_fingerprint','signed_grant_digest','audience','delegate','issued_at',
    'expires_at','scopes','self_attested_only','signer_identity_independently_verified',
    'wallet_link_role_unchanged','automatic_admission'])
    ||preview.schema!=='abundent.wallet-owner-grant-preview/v1'
    ||!hex(preview.public_key_fingerprint)||!hex(preview.signed_grant_digest)
    ||confirmed!==true||typed!==preview.public_key_fingerprint
    ||!timestamp(at)||Date.parse(at)<Date.parse(preview.issued_at)
    ||Date.parse(at)>=Date.parse(preview.expires_at))
    throw Error('Fingerprint must be manually confirmed while signed grant is current.');
  const pin={
    schema:PIN_SCHEMA,public_key_fingerprint:preview.public_key_fingerprint,
    signed_grant_digest:preview.signed_grant_digest,audience:preview.audience,
    enrolled_at:at,basis:'OWNER_TYPED_EXACT_FINGERPRINT_IN_LOCAL_BROWSER',
    real_human_identity_verified:false,automatic_actions_enabled:false
  };
  validatePin(pin);
  return pin;
}
export async function validateRevocation(revocation,grant){
  const p=await previewGrant(grant);
  if(!(await verifySigned(revocation))||revocation.body?.schema!=='world-forge/delegation-revocation/v0'
    ||await publicFingerprint(revocation.body.owner_public_key)!==p.public_key_fingerprint
    ||revocation.body.grant_digest!==p.signed_grant_digest)
    throw Error('Revocation must be signed by the exact pinned grant key for this exact grant.');
  return revocation;
}
export async function assess({grant,pin,revocations=[],action,at,requestedDecision='HOLD'}){
  validatePin(pin);
  const p=await previewGrant(grant);
  if(p.public_key_fingerprint!==pin.public_key_fingerprint||
     p.signed_grant_digest!==pin.signed_grant_digest||p.audience!==pin.audience)
    throw Error('Grant is not the locally enrolled exact signed grant.');
  if(!Array.isArray(revocations)||revocations.length>30)throw Error('Invalid revocation list.');
  for(const item of revocations)await validateRevocation(item,grant);
  if(!timestamp(at)||typeof action!=='string'
    ||!['HOLD','REFUSE'].includes(requestedDecision))
    throw Error('Only a timed HOLD/REFUSE review decision is supported.');
  const policy=await evaluateGrant({grant,action,at,revocations});
  const approved=policy.authorized===true;
  const decision=approved&&requestedDecision==='HOLD'?'HOLD':'REFUSE';
  return {
    schema:'abundent.wallet-local-review-decision/v1',
    at,action,decision,
    policy_would_allow_review:approved,
    reason:!approved?policy.reason:requestedDecision==='REFUSE'?'USER_SELECTED_REFUSE':'SIGNED_SCOPE_PERMITS_PROPOSAL_REVIEW_ONLY',
    owner_fingerprint:pin.public_key_fingerprint,
    grant_digest:pin.signed_grant_digest,
    local_revocation_count:revocations.length,
    identity_verified:false,
    grants_third_party_access:false,
    native_relatte_receipt:false,
    external_action_executed:false,
    automatic_merge:false,
    automatic_admission:false
  };
}
const stripJwk=j=>{
  if(!j||j.kty!=='EC'||j.crv!=='P-256'||typeof j.x!=='string'||typeof j.y!=='string')
    throw Error('Invalid locally generated P-256 receipt key.');
  return normalizePublicKey({kty:j.kty,crv:j.crv,x:j.x,y:j.y});
};
export async function signReviewReceipt(decision,keyPair){
  if(!exact(decision,['schema','at','action','decision','policy_would_allow_review','reason',
    'owner_fingerprint','grant_digest','local_revocation_count','identity_verified',
    'grants_third_party_access','native_relatte_receipt','external_action_executed',
    'automatic_merge','automatic_admission'])
    ||decision.schema!=='abundent.wallet-local-review-decision/v1'
    ||!['HOLD','REFUSE'].includes(decision.decision)
    ||decision.native_relatte_receipt!==false
    ||decision.automatic_admission!==false||decision.automatic_merge!==false
    ||decision.external_action_executed!==false)
    throw Error('Unsafe review decision.');
  if(!keyPair?.privateKey||!keyPair?.publicKey||keyPair.privateKey.extractable!==false)
    throw Error('Review receipt requires a separate nonexportable local key.');
  const key=stripJwk(await crypto.subtle.exportKey('jwk',keyPair.publicKey));
  const ownerFp=decision.owner_fingerprint;
  const holderFp=await publicFingerprint(key);
  if(holderFp===ownerFp)throw Error('Owner private signing key may not be used by a review signer.');
  const body={
    schema:'abundent.wallet-local-review-event/v1',
    id:crypto.randomUUID(),decision,
    receipt_signer_kind:'SEPARATE_BROWSER_LOCAL_KEY_NOT_GRANT_OWNER',
    receipt_signer_fingerprint:holderFp,
    reviewed_at:new Date().toISOString(),
    no_execution:true,no_merge:true,no_admission:true
  };
  const data=new TextEncoder().encode(RECEIPT_DOMAIN+stable(body));
  const raw=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keyPair.privateKey,data));
  if(raw.length!==64)throw Error('Unsupported P-256 signature size.');
  return {schema:RECEIPT_SCHEMA,body,signer_public_key:key,signature:b64(raw)};
}
export async function verifyReviewReceipt(receipt){
  try{
    if(!exact(receipt,['schema','body','signer_public_key','signature'])||receipt.schema!==RECEIPT_SCHEMA)
      return false;
    const key=stripJwk(receipt.signer_public_key),body=receipt.body;
    if(!exact(body,['schema','id','decision','receipt_signer_kind','receipt_signer_fingerprint',
      'reviewed_at','no_execution','no_merge','no_admission'])
      ||body.schema!=='abundent.wallet-local-review-event/v1'
      ||body.receipt_signer_kind!=='SEPARATE_BROWSER_LOCAL_KEY_NOT_GRANT_OWNER'
      ||!timestamp(body.reviewed_at)||body.no_execution!==true||body.no_merge!==true
      ||body.no_admission!==true||body.receipt_signer_fingerprint!==await publicFingerprint(key)
      ||!exact(body.decision,['schema','at','action','decision','policy_would_allow_review','reason',
        'owner_fingerprint','grant_digest','local_revocation_count','identity_verified',
        'grants_third_party_access','native_relatte_receipt','external_action_executed',
        'automatic_merge','automatic_admission'])
      ||body.decision.native_relatte_receipt!==false
      ||body.decision.external_action_executed!==false
      ||body.decision.automatic_admission!==false
      ||body.decision.automatic_merge!==false
      ||body.decision.decision==='HOLD'&&body.decision.policy_would_allow_review!==true
      ||body.decision.owner_fingerprint===body.receipt_signer_fingerprint)
      return false;
    const publicKey=await crypto.subtle.importKey('jwk',key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    const sig=un64(receipt.signature);
    if(sig.length!==64)return false;
    return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,sig,
      new TextEncoder().encode(RECEIPT_DOMAIN+stable(body)));
  }catch{return false}
}
export const SUPPORTED_ACTIONS=ALLOW;
export const PROHIBITED_ACTIONS=FORBID;
