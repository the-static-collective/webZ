// ROOTLINE 005 · a tiny, human-carried encouragement chain.
// Digest links provide *content consistency*, never authorship, consent or identity.
import {digestPayload} from '../seed-lab/seed.mjs';
export const SCHEMA='abundent/rootline-encouragement/v0';
export const POLICY='KEEP_IS_ENOUGH_NO_FORWARD_OBLIGATION';
export const MAX_MESSAGE=220;
export const MAX_ADDITIONS=2;
export const MAX_BYTES=3800;
const HEX32=/^[a-f0-9]{32}$/,SHA=/^sha256:[0-9a-f]{64}$/;
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const size=s=>new TextEncoder().encode(s).length;
export function validateMessage(input){
 if(typeof input!=='string')throw Error('MESSAGE_NOT_TEXT');
 const message=input.trim().normalize('NFC');
 if([...message].length<3||[...message].length>MAX_MESSAGE)throw Error('MESSAGE_LENGTH');
 if(/[\u0000-\u001f\u007f-\u009f]/u.test(message))throw Error('MESSAGE_CONTROL_CHARACTER');
 // A safety net for accidental disclosure, not a complete PII detector.
 if(/(?:https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[a-z]{2,}|\+?\d[\d ()-]{7,}\d)/iu.test(message))
   throw Error('CONTACT_DETAILS_OR_LINK_NOT_ALLOWED');
 return message;
}
export function newId(){
 const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
const issueFields=(id,message)=>({id,message,kind:'encouragement',permission:'public-and-voluntarily-shareable'});
const hopFields=(index,message,previous)=>({index,message,previous,kind:'optional-encouragement'});
export async function plant(input){
 const message=validateMessage(input),id=newId(),origin=issueFields(id,message);
 return {schema:SCHEMA,policy:POLICY,origin:{...origin,link:await digestPayload(origin)},additions:[]};
}
export async function verifyChain(raw){
 let pack;
 if(typeof raw==='string'){
  if(size(raw)>MAX_BYTES)throw Error('ROOTLINE_TOO_LARGE');
  try{pack=JSON.parse(raw)}catch{throw Error('ROOTLINE_NOT_JSON')}
 }else{
  try{if(size(JSON.stringify(raw))>MAX_BYTES)throw Error('ROOTLINE_TOO_LARGE')}catch(e){
   if(e.message==='ROOTLINE_TOO_LARGE')throw e;
   throw Error('ROOTLINE_INVALID_JSON')
  }
  pack=raw;
 }
 if(!exact(pack,['schema','policy','origin','additions'])||pack.schema!==SCHEMA||pack.policy!==POLICY)
  throw Error('ROOTLINE_SCHEMA');
 const origin=pack.origin;
 if(!exact(origin,['id','message','kind','permission','link'])||!HEX32.test(origin.id)||
    origin.message!==validateMessage(origin.message)||
    origin.kind!=='encouragement'||origin.permission!=='public-and-voluntarily-shareable'||!SHA.test(origin.link))
  throw Error('ROOTLINE_ORIGIN');
 const calculated=await digestPayload(issueFields(origin.id,origin.message));
 if(calculated!==origin.link)throw Error('ROOTLINE_ORIGIN_HASH');
 if(!Array.isArray(pack.additions)||pack.additions.length>MAX_ADDITIONS)
  throw Error('ROOTLINE_CHAIN_LENGTH');
 let previous=origin.link;
 for(let i=0;i<pack.additions.length;i++){
  const a=pack.additions[i];
  if(!exact(a,['index','message','previous','kind','link'])||a.index!==i+1||
     a.message!==validateMessage(a.message)||a.previous!==previous||
     a.kind!=='optional-encouragement'||!SHA.test(a.link))
   throw Error('ROOTLINE_HOP');
  const link=await digestPayload(hopFields(a.index,a.message,previous));
  if(link!==a.link)throw Error('ROOTLINE_HOP_HASH');
  previous=link;
 }
 return pack;
}
export async function grow(raw,message){
 const existing=await verifyChain(raw);
 if(existing.additions.length>=MAX_ADDITIONS)throw Error('ROOTLINE_FULL_KEEP_OR_CARRY');
 const nextMessage=validateMessage(message);
 const index=existing.additions.length+1;
 const previous=existing.additions.length?existing.additions.at(-1).link:existing.origin.link;
 const addition=hopFields(index,nextMessage,previous);
 const next={...existing,additions:[...existing.additions,{...addition,link:await digestPayload(addition)}]};
 return verifyChain(next);
}
export function viewText(chain){
 return [chain.origin.message,...chain.additions.map(h=>h.message)].join('\n\n—\n\n');
}
export function readableCard(chain){
 return 'ROOTLINE · A LITTLE ENCOURAGEMENT\n\n'+viewText(chain)+
  '\n\nKeep this if it helps. No need to reply or pass it on.\n'+
  '(Shared by a person, not sent automatically by Abundent.)';
}
