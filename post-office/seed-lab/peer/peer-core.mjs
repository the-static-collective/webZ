// POST-OFFICE-PEER-003. Bounded browser-only manual signaling.
// Signal exchange is out-of-band. WebRTC DTLS protects a channel but does
// NOT authenticate the publisher, the person or the out-of-band messenger.
import {canonical} from '../seed.mjs';
export const SIGNAL_SCHEMA='abundent/manual-webrtc-signal/v0';
export const WIRE_SCHEMA='abundent/peer-seed-message/v0';
export const RECEIPT_SCHEMA='abundent/peer-receipt/v0';
export const MAX_SIGNAL_BYTES=42000;
export const MAX_WIRE_BYTES=26000;
export const SESSION_RE=/^[0-9a-f]{32}$/;
export const DIGEST_RE=/^sha256:[0-9a-f]{64}$/;
const own=(o,props)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===props.length&&props.every(p=>Object.hasOwn(o,p));
const byteLength=s=>new TextEncoder().encode(s).length;
export function randomSession(){
 const b=new Uint8Array(16);crypto.getRandomValues(b);
 return Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
}
export function makeSignal(kind,session,digest,sdp){
 const obj={schema:SIGNAL_SCHEMA,kind,session,digest,sdp};
 return parseSignal(JSON.stringify(obj),kind);
}
export function parseSignal(raw,expected=null){
 if(typeof raw!=='string'||byteLength(raw)>MAX_SIGNAL_BYTES)throw Error('SIGNAL_TOO_LARGE');
 let v;try{v=JSON.parse(raw)}catch{throw Error('SIGNAL_NOT_JSON')}
 if(!own(v,['schema','kind','session','digest','sdp'])||v.schema!==SIGNAL_SCHEMA||
   !['offer','answer'].includes(v.kind)||(expected!==null&&v.kind!==expected)||
   !SESSION_RE.test(v.session)||!DIGEST_RE.test(v.digest)||
   typeof v.sdp!=='string'||v.sdp.length<80||v.sdp.length>35000||
   !v.sdp.startsWith('v=0')||!v.sdp.includes('a=fingerprint:sha-256 '))throw Error('INVALID_SIGNAL');
 return v;
}
export function receipt(session,digest){
 if(!SESSION_RE.test(session)||!DIGEST_RE.test(digest))throw Error('INVALID_RECEIPT_SOURCE');
 return {schema:RECEIPT_SCHEMA,decision:'RECEIVED_VERIFIED',session,digest,authority:'unsigned-local-peer-observation'};
}
export function parseReceipt(raw,session,digest){
 if(typeof raw!=='string'||byteLength(raw)>1024)throw Error('RECEIPT_TOO_LARGE');
 let v;try{v=JSON.parse(raw)}catch{throw Error('RECEIPT_NOT_JSON')}
 if(!own(v,['schema','decision','session','digest','authority'])||
  v.schema!==RECEIPT_SCHEMA||v.decision!=='RECEIVED_VERIFIED'||
  v.session!==session||v.digest!==digest||v.authority!=='unsigned-local-peer-observation')
   throw Error('RECEIPT_MISMATCH');
 return v;
}
export function parseSeedMessage(raw,session,digest){
 if(typeof raw!=='string'||byteLength(raw)>MAX_WIRE_BYTES)throw Error('WIRE_TOO_LARGE');
 let obj;try{obj=JSON.parse(raw)}catch{throw Error('WIRE_NOT_JSON')}
 if(!own(obj,['schema','kind','session','seed'])||obj.schema!==WIRE_SCHEMA||obj.kind!=='seed'||
 obj.session!==session||obj.seed?.digest!==digest)throw Error('WIRE_MISMATCH');
 return obj.seed; // MUST await verify(seed) independently before accepting.
}
export function packSeed(seed,session){
 if(!SESSION_RE.test(session)||!DIGEST_RE.test(seed?.digest))throw Error('WIRE_INVALID_SOURCE');
 const raw=JSON.stringify({schema:WIRE_SCHEMA,kind:'seed',session,seed});
 if(byteLength(raw)>MAX_WIRE_BYTES)throw Error('WIRE_TOO_LARGE');
 return raw;
}
export async function pairingCode(offer,answer){
 if(offer.kind!=='offer'||answer.kind!=='answer'||offer.session!==answer.session||
 offer.digest!==answer.digest)throw Error('PAIRING_MISMATCH');
 const raw=canonical({schema:SIGNAL_SCHEMA,offer,answer});
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
 return Array.from(new Uint8Array(bytes).slice(0,6),v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
}
// Bounded ICE gathering keeps signaling one copy/paste round trip.
// Hosts often expose mDNS candidates; optional public STUN may reveal public
// IP to its provider. No TURN/relay configured.
export async function gatherComplete(pc,timeout=18000){
 if(pc.iceGatheringState==='complete')return;
 await new Promise((resolve,reject)=>{
  const finish=()=>{clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',changed);resolve()};
  const changed=()=>{if(pc.iceGatheringState==='complete')finish()};
  const timer=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',changed);reject(Error('ICE_GATHER_TIMEOUT'))},timeout);
  pc.addEventListener('icegatheringstatechange',changed);changed();
 });
}
