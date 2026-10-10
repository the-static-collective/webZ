// GIVING-TREE-003. Shared public-receiver rules. No trust derives from a checksum.
import {inspectGift} from './gift.mjs';
export const LIMIT_BYTES=32768;
export const GATE_SCHEMA='webz/giving-tree-public-intake/v0';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export const hex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function sha256(s,subtle=globalThis.crypto?.subtle){
 if(!subtle)throw Error('CRYPTO_REQUIRED');
 return hex(await subtle.digest('SHA-256',new TextEncoder().encode(s)));
}
export function boundedBodyLength(s){return new TextEncoder().encode(s).length<=LIMIT_BYTES;}
export async function validateIntake(raw){
 if(!object(raw)||raw.schema!==GATE_SCHEMA||!object(raw.consent)||raw.consent.publishFullPacket!==true||raw.consent.canPublishThisMaterial!==true||raw.consent.understandsPublicCopiesPersist!==true)throw Error('EXPLICIT_PUBLIC_CONSENT_REQUIRED');
 if(!object(raw.bundle)||!boundedBodyLength(JSON.stringify(raw)))throw Error('INVALID_OR_OVERSIZED_SUBMISSION');
 const observed=await inspectGift(raw.bundle);
 if(observed.gift.originAuthority==='UNKNOWN')throw Error('UNKNOWN_RIGHTS_NOT_PUBLIC');
 // A self-declaration is a submission claim, not a verified license or authorship.
 return {schema:GATE_SCHEMA,digest:observed.giftSha256,title:observed.gift.seedPacket.seed.title.slice(0,84),creator:observed.gift.creator.slice(0,60),permission:observed.gift.permission,origin_authority:observed.gift.originAuthority,bundle_text:JSON.stringify(raw.bundle),licenseVerified:false,identityVerified:false};
}
export function publicProjection(row){
 return {id:row.id,digest:row.digest,title:row.title,creator:row.creator,permission:row.permission,originAuthority:row.origin_authority,claimedOnly:true,publishedAt:row.published_at,bundle:JSON.parse(row.bundle_text)};
}
export async function secureEqualHex(expected,actual){
 if(!/^[0-9a-f]{64}$/.test(expected||'')||!/^[0-9a-f]{64}$/.test(actual||''))return false;
 let diff=0;for(let i=0;i<64;i++)diff|=expected.charCodeAt(i)^actual.charCodeAt(i);return diff===0;
}
