// SEED-004: verifiable content and self-consistent (UNSIGNED) transit notes.
// A hash chain detects accidental damage, not malicious custody or author identity.
import {canonical,verify,digestPayload} from '../seed.mjs';
export const PARCEL_SCHEMA='abundent/courier-parcel/v0';
export const RECEIPT_SCHEMA='abundent/courier-local-receipt/v0';
export const MAX_PARCEL_BYTES=32000;
const HEX=/^[0-9a-f]{32}$/;
const DIGEST=/^sha256:[0-9a-f]{64}$/;
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const stages=[['ISSUE','A'],['FORWARD','B']];
export function size(raw){return new TextEncoder().encode(raw).length}
export function journeyId(){const b=new Uint8Array(16);crypto.getRandomValues(b);return Array.from(b,v=>v.toString(16).padStart(2,'0')).join('')}
async function step(index,previous,digest){
 const [action,station]=stages[index];
 const link=await digestPayload({action,station,index,previous,seedDigest:digest});
 return {index,action,station,previous,link};
}
export async function newParcel(seed){
 await verify(seed);
 const first=await step(0,'GENESIS',seed.digest);
 return {schema:PARCEL_SCHEMA,seed,journey:{id:journeyId(),hops:[first]}};
}
export async function verifyParcel(input){
 const raw=typeof input==='string'?input:JSON.stringify(input);
 if(size(raw)>MAX_PARCEL_BYTES)throw Error('PARCEL_TOO_LARGE');
 let p;try{p=typeof input==='string'?JSON.parse(input):input}catch{throw Error('PARCEL_NOT_JSON')}
 if(!exact(p,['schema','seed','journey'])||p.schema!==PARCEL_SCHEMA||
    !exact(p.journey,['id','hops'])||!HEX.test(p.journey.id)||
    !Array.isArray(p.journey.hops)||p.journey.hops.length<1||p.journey.hops.length>2)
     throw Error('PARCEL_SCHEMA_INVALID');
 await verify(p.seed);
 for(let i=0;i<p.journey.hops.length;i++){
  const h=p.journey.hops[i],prev=i===0?'GENESIS':p.journey.hops[i-1].link;
  const wanted=await step(i,prev,p.seed.digest);
  if(!exact(h,['index','action','station','previous','link'])||
     Object.entries(wanted).some(([k,v])=>h[k]!==v)||
     !DIGEST.test(h.link))throw Error('PARCEL_CHAIN_MISMATCH');
 }
 return p;
}
export async function forwardParcel(input){
 const p=await verifyParcel(input);
 if(p.journey.hops.length!==1)throw Error('PARCEL_ALREADY_FORWARDED');
 const next=await step(1,p.journey.hops[0].link,p.seed.digest);
 return verifyParcel({...p,journey:{...p.journey,hops:[...p.journey.hops,next]}});
}
export async function receiveReceipt(input){
 const p=await verifyParcel(input);
 if(p.journey.hops.length!==2)throw Error('RECEIVE_REQUIRES_FORWARD');
 const parent=p.journey.hops[1].link;
 const chain=await digestPayload({journey:p.journey.id,seedDigest:p.seed.digest,parent,station:'C',action:'RECEIVE'});
 return {schema:RECEIPT_SCHEMA,station:'C',action:'RECEIVE',journey:p.journey.id,seedDigest:p.seed.digest,parent,chain,authority:'unsigned-device-observation'};
}
export async function verifyReceipt(raw,parcel){
 const r=typeof raw==='string'?JSON.parse(raw):raw;
 const expected=await receiveReceipt(parcel);
 if(!exact(r,Object.keys(expected))||Object.entries(expected).some(([k,v])=>r[k]!==v))throw Error('RECEIPT_MISMATCH');
 return r;
}
// No automatic content-creation or publication. Appends a transit note only after
// the local holder explicitly authorizes export; *not* a sovereign signed RECEIVE.
