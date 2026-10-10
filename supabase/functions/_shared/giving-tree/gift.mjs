// GIVING-TREE-002 — A manually carried, unsigned gift with inspectable parentage.
// No hosted commons, transport, identity, signatures, or rights verification.
import {compose,receipt,exportPacket,SCHEMA} from './engine.mjs';

export const GIFT_SCHEMA='webz/giving-tree-local-gift/v0';
export const BUNDLE_SCHEMA='webz/giving-tree-local-bundle/v0';
const short=(v,n)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const digestShape=x=>typeof x==='string'&&/^sha256:[0-9a-f]{64}$/.test(x);
const cleanAuthority=x=>['DEMO','SELF_DECLARED','UNKNOWN'].includes(x);
const hex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function checksum(value,subtle=globalThis.crypto?.subtle){
  if(!subtle)throw Error('WEB_CRYPTO_UNAVAILABLE');
  return 'sha256:'+hex(await subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))));
}
export async function inspectSeed(packet){
  if(!isObj(packet)||!isObj(packet.seed)||!isObj(packet.receipt)||packet.seed.schema!==SCHEMA||
     packet.receipt.schema!=='webz/harmony-grove-local-receipt/v0'||!isObj(packet.seed.origin)||
     !cleanAuthority(packet.seed.origin.authority)||!Array.isArray(packet.seed.panels)||packet.seed.panels.length!==3||
     !digestShape(packet.receipt.seedSha256)||packet.receipt.admitted!==false||
     packet.receipt.delivered!==false||packet.receipt.published!==false||
     packet.receipt.sourceVerified!==false||packet.receipt.localOnly!==true)throw Error('INVALID_SEED_PACKET');
  const own=await receipt(packet.seed);
  if(own.seedSha256!==packet.receipt.seedSha256||own.claimedSourceAuthority!==packet.receipt.claimedSourceAuthority)
    throw Error('SEED_CHECKSUM_MISMATCH');
  return {seed:packet.seed,seedSha256:own.seedSha256};
}
export async function wrapGift(packet,opts={}){
  const verified=await inspectSeed(packet);
  const permission=opts.permission==='REMIX_ALLOWED'?'REMIX_ALLOWED':'VIEW_ONLY';
  if(permission==='REMIX_ALLOWED'&&verified.seed.origin.authority==='UNKNOWN')
    throw Error('UNKNOWN_RIGHTS_CANNOT_INVITE_REMIX');
  const leaf={
    schema:GIFT_SCHEMA,kind:'MANUALLY_CARRIED_LOCAL_INVITATION',
    creator:short(opts.creator,60)||'Anonymous wanderer',
    message:short(opts.message,220),permission,
    permissionStatus:'UNVERIFIED_DECLARATION',
    originAuthority:verified.seed.origin.authority,
    seedPacket:packet,
    parentGiftSha256:verified.seed.lineage?.parentGiftSha256||null,
    public:false,delivered:false,admitted:false,signed:false
  };
  return {schema:BUNDLE_SCHEMA,gift:leaf,checksum:{algorithm:'sha256',value:await checksum(leaf),isSignature:false}};
}
export async function inspectGift(bundle){
  if(!isObj(bundle)||bundle.schema!==BUNDLE_SCHEMA||!isObj(bundle.gift)||!isObj(bundle.checksum))throw Error('INVALID_GIFT_BUNDLE');
  const gift=bundle.gift;
  if(gift.schema!==GIFT_SCHEMA||gift.kind!=='MANUALLY_CARRIED_LOCAL_INVITATION'||
     !['REMIX_ALLOWED','VIEW_ONLY'].includes(gift.permission)||gift.permissionStatus!=='UNVERIFIED_DECLARATION'||
     !['DEMO','SELF_DECLARED','UNKNOWN'].includes(gift.originAuthority)||
     typeof gift.creator!=='string'||gift.creator.length>60||typeof gift.message!=='string'||gift.message.length>220||
     gift.public!==false||gift.delivered!==false||gift.admitted!==false||gift.signed!==false||
     (gift.parentGiftSha256!==null&&!digestShape(gift.parentGiftSha256))||
     bundle.checksum.algorithm!=='sha256'||bundle.checksum.isSignature!==false||
     !digestShape(bundle.checksum.value))throw Error('INVALID_GIFT_FIELDS');
  const inspected=await inspectSeed(gift.seedPacket);
  if(inspected.seed.origin.authority!==gift.originAuthority)throw Error('AUTHORITY_MISMATCH');
  if((inspected.seed.lineage?.parentGiftSha256||null)!==gift.parentGiftSha256)throw Error('PARENT_MISMATCH');
  if(await checksum(gift)!==bundle.checksum.value)throw Error('GIFT_CHECKSUM_MISMATCH');
  return {gift,giftSha256:bundle.checksum.value,seedSha256:inspected.seedSha256,
    canRemix:gift.permission==='REMIX_ALLOWED'&&gift.originAuthority!=='UNKNOWN',
    integrity:'LOCAL_HASH_MATCH',rightsVerified:false,identityVerified:false};
}
export function composeReturn(inspection,{fragment,title,weather,distance,roughness}={}){
  if(!inspection?.canRemix||!digestShape(inspection.giftSha256))throw Error('REMIX_NOT_INVITED');
  const addition=short(fragment,240);
  if(!addition)throw Error('CONTRIBUTION_REQUIRED');
  const parent=inspection.gift.seedPacket.seed;
  const prior=parent.lineage?.ancestors||[];
  if(!Array.isArray(prior)||prior.length>=7||prior.some(x=>!digestShape(x)))throw Error('ANCESTRY_LIMIT');
  // Current observer's fragment is theirs to offer; ancestor permissions remain unverified.
  const child=compose({title:short(title,84)||parent.title+' / a new way through',fragment:addition,
    authority:'SELF_DECLARED',weather:weather??parent.dials.weather,distance:distance??parent.dials.distance,
    roughness:roughness??parent.dials.roughness});
  child.lineage={parentGiftSha256:inspection.giftSha256,parentSeedSha256:inspection.seedSha256,
    ancestors:[...prior,inspection.giftSha256],scope:'CLAIMED_PARENT_CHAIN',ancestryVerified:false,rightsVerified:false};
  child.limits.push('Only immediate parent bytes were checked; older ancestors are references, not verified evidence');
  child.limits.push('Current author self-declares their new text, not ownership of inherited material');
  return child;
}
export async function packetForReturn(seed){return exportPacket(seed,await receipt(seed));}
