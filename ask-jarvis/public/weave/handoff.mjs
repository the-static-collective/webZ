import {makeOpportunity} from './model.mjs';
// Independent, general-purpose local draft. Not the Oct 24 event-scoped CIRCULATION-003 packet.
export const SCHEMA='abundent.weaving-handoff/v0';
export const DOMAIN='ABUNDENT-WEAVING-HANDOFF-002|';
const contact=/(?:@|https?:\/\/|www\.|(?:\+?\d[\d .()-]{8,}\d))/i;
const sensitive=/\b(?:ssn|social security|date of birth|passport|street address|phone number)\b/i;
const clean=q=>typeof q==='string'?q.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim():'';
export function canonical(v){
 if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'){
   if(typeof v==='number'&&!Number.isFinite(v))throw Error('INVALID_VALUE');
   return JSON.stringify(v);
 }
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
 throw Error('INVALID_VALUE');
}
async function hash(body){
 if(!globalThis.crypto?.subtle)throw Error('SECURE_HASH_REQUIRED');
 const raw=new TextEncoder().encode(DOMAIN+canonical(body));
 const digest=await crypto.subtle.digest('SHA-256',raw);
 return 'sha256:'+Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
function safeQuestion(q){
 return typeof q==='string'&&q.length>=14&&q.length<=140&&q===clean(q)&&
 !contact.test(q)&&!sensitive.test(q);
}
function bodyFor(opportunity,question){
 // Drop any unknown property and reject field changes through the source-owned validator.
 if(!opportunity||Object.keys(opportunity).sort().join(',')!=='need,offer,try,v')throw Error('INVALID_OPPORTUNITY');
 const card=makeOpportunity(opportunity);
 if(!safeQuestion(question))throw Error('PUBLIC_QUESTION_INVALID');
 return {
   schema:SCHEMA,
   opportunity:card,
   public_question:question,
   source_context:'INDEPENDENT_ABUNDENT_EXPERIMENT',
   provenance:'DRAFT_SELF_REVIEW_UNVERIFIED',
   status:'UNPUBLISHED_CANDIDATE',
   recipient:'NONE',
   person_authenticated:false,
   permission_verified:false,
   recipient_accepted:false,
   published:false,
   work_performed:false
 };
}
export async function prepareHandoff({opportunity,question,reviewed}){
 if(reviewed!==true)throw Error('LOCAL_REVIEW_REQUIRED');
 const body=bodyFor(opportunity,question);
 return {id:await hash(body),...body};
}
export async function verifyHandoff(packet){
 if(!packet||typeof packet!=='object'||Array.isArray(packet)||typeof packet.id!=='string')throw Error('INVALID_PACKET');
 const {id,...body}=packet;
 if(Object.keys(body).sort().join(',')!==Object.keys(bodyFor(body.opportunity,body.public_question)).sort().join(','))
  throw Error('UNEXPECTED_FIELDS');
 const expected=bodyFor(body.opportunity,body.public_question);
 if(canonical(body)!==canonical(expected)||id!==await hash(expected))throw Error('PACKET_CHANGED');
 return true;
}
