/* NAME ORCHARD 002 — offline SMS framing for a SINGLE signed claim.
 * SMS is an untrusted, observable carrier. No phone number or text is sent here.
 * Receiving the claim does NOT constitute a receipt, custody or source authority.
 */
import {createHash} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {checkClaim} from './name-orchard-001-core.mjs';

export const PREFIX='NO2';
export const CHUNK=115;
export const MAX_PARTS=24;
export const MAX_BYTES=2048;
const requireThat=(x,why)=>{if(!x)throw Error(why)};
const token=/^[A-Za-z0-9_-]+$/;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const ascii=message=>typeof message==='string'&&/^[\x20-\x7e]+$/.test(message);

export function parseSegment(line){
 requireThat(typeof line==='string','SMS_LINE_NOT_TEXT');
 const match=/^NO2-([0-9a-f]{12})-([0-9]{2})-([0-9]{2})-([A-Za-z0-9_-]{1,115})$/.exec(line.trim());
 requireThat(match&&ascii(line.trim())&&line.trim().length<=140,'SMS_FRAME_INVALID');
 const index=Number(match[2]),total=Number(match[3]);
 requireThat(index>=1&&total>=1&&total<=MAX_PARTS&&index<=total,'SMS_FRAME_INDEX');
 return {tag:match[1],index,total,chunk:match[4]};
}
export function packClaim(claim){
 checkClaim(claim);
 const raw=Buffer.from(JSON.stringify(claim),'utf8');
 requireThat(raw.length>0&&raw.length<=MAX_BYTES,'SMS_CLAIM_SIZE');
 const tag=sha(raw).slice(0,12),encoded=raw.toString('base64url');
 requireThat(token.test(encoded),'SMS_ENCODING');
 const total=Math.ceil(encoded.length/CHUNK);
 requireThat(total>=1&&total<=MAX_PARTS,'SMS_TOO_MANY_PARTS');
 const messages=Array.from({length:total},(_,i)=>
  PREFIX+'-'+tag+'-'+String(i+1).padStart(2,'0')+'-'+String(total).padStart(2,'0')+'-'+encoded.slice(i*CHUNK,(i+1)*CHUNK));
 requireThat(messages.every(x=>x.length<=140&&ascii(x)),'SMS_FRAME_LENGTH');
 return messages;
}
export function assembleTexts(input){
 const lines=typeof input==='string'?input.split(/\r?\n/):input;
 requireThat(Array.isArray(lines),'SMS_INPUT');
 const clean=lines.map(x=>typeof x==='string'?x.trim():x).filter(x=>x!==''&&x!==undefined);
 requireThat(clean.length>=1&&clean.length<=MAX_PARTS*3,'SMS_INPUT_LIMIT');
 const frames=clean.map(parseSegment);
 const {tag,total}=frames[0],chunks=new Map();
 for(const f of frames){
  requireThat(f.tag===tag&&f.total===total,'SMS_MIXED_MESSAGES');
  if(chunks.has(f.index))requireThat(chunks.get(f.index)===f.chunk,'SMS_CONFLICTING_DUPLICATE');
  else chunks.set(f.index,f.chunk);
 }
 const missing=Array.from({length:total},(_,i)=>i+1).filter(i=>!chunks.has(i));
 if(missing.length)return {state:'HOLD_MISSING_PARTS',tag,total,received:chunks.size,missing,claim:null};
 const encoded=Array.from({length:total},(_,i)=>chunks.get(i+1)).join('');
 requireThat(token.test(encoded),'SMS_BASE64');
 const raw=Buffer.from(encoded,'base64url');
 requireThat(raw.length>=1&&raw.length<=MAX_BYTES&&raw.toString('base64url')===encoded,'SMS_DECODE_SIZE');
 requireThat(sha(raw).slice(0,12)===tag,'SMS_TRANSPORT_HASH_MISMATCH');
 const json=new TextDecoder('utf-8',{fatal:true}).decode(raw);
 let claim;try{claim=JSON.parse(json)}catch{throw Error('SMS_JSON_INVALID')}
 checkClaim(claim);
 return {state:'SIGNED_CLAIM_VERIFIED',tag,total,received:total,missing:[],claim,
  warning:'Signature authenticates only ephemeral signing key, not phone sender, artist, rights, reception or live availability.'};
}
export function postcard(){
 const msg='Let It Find Us | The Static Collective | https://suno.com/s/G0cLbwecX7g0qFUB | From the Name Orchard';
 requireThat(msg.length<=140&&ascii(msg),'POSTCARD_SIZE');
 return msg;
}
