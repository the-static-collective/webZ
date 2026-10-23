// CIRCULATION-004 / local demonstration, not live Coalition, grocery, or project intake.
import { verifyFieldQuestion } from '../003/packet.mjs';

export const EVENT = 'coalition-of-care-greater-mankato-2026-10-24';
export const SCHEMA = 'abundent.pando-local-exercise/v0';
export const CAPABILITIES = Object.freeze([
  {id:'questions', name:'Question press', eyebrow:'NOTICE', family:'Human field', owner:'webZ / Circulation-003', href:'https://github.com/the-static-collective/webZ/pull/71', role:'Hold a voluntary, non-identifying question locally. Not an organizer intake.'},
  {id:'care', name:'Garden / Help Slips', eyebrow:'CARE', family:'Practical needs', owner:'BananaSpork', href:'https://github.com/the-static-collective/BananaSpork/pull/18', role:'Independently review a possible need or offer. No assistance or steward consent implied.'},
  {id:'network', name:'Living Neighbor Network', eyebrow:'COORDINATE', family:'Independent relationships', owner:'planZ / Free Graph', href:'https://github.com/the-static-collective/planZ/pull/26', role:'Map potential connections and missing decisions without assigning anyone.'},
  {id:'table', name:'Common Table', eyebrow:'MAKE', family:'Food and shared space', owner:'Common Table / planZ', href:'https://github.com/the-static-collective/planZ/pull/23', role:'Explore locally owned food, gathering, makers, and arts opportunities.'},
  {id:'culture', name:'Static Live', eyebrow:'CULTURE', family:'Music and gathering', owner:'Static Live', href:'https://github.com/the-static-collective/static-live/pull/38', role:'Offer a music or arts experiment, under separate artist and host approval.'},
  {id:'witness', name:'Witness / receipts', eyebrow:'RETURN', family:'Evidence', owner:'CANNON / TranchNode', href:'https://github.com/the-static-collective/CANNON/pull/35', role:'Preserve what was actually observed; distinguish suggestions from completed acts.'}
]);
export const EXAMPLES = Object.freeze([
  {id:'food', title:'The shared kitchen', kind:'QUESTION', question:'Could a willing local kitchen and a food grower find one small, useful way to work together?', lanes:['table','network','care']},
  {id:'arts', title:'The missing stage', kind:'QUESTION', question:'What would make it easier for independent musicians and existing gathering spaces to find each other?', lanes:['culture','table','network']},
  {id:'tools', title:'Tools already nearby', kind:'QUESTION', question:'Could existing tools and practical skills become more discoverable without enrolling their owners?', lanes:['network','care','questions']},
  {id:'continuity', title:'The question after Saturday', kind:'QUESTION', question:'How could a freely offered question survive a gathering without becoming anyone else’s assignment?', lanes:['questions','network','witness']}
]);
export const RESPONSES = Object.freeze([
  {id:'HOLD_FOR_DISCUSSION', label:'Hold for discussion', description:'A possible conversation, not acceptance.'},
  {id:'DECLINE', label:'Decline', description:'A complete, respected refusal.'},
  {id:'CONSIDER_FURTHER', label:'Consider further', description:'A possible next question, not a commitment.'}
]);
const priv = /@|https?:\/\/|\b(?:\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}\b|\b(?:ssn|social security|date of birth|street address|phone number|passport)\b/i;
const controls=/[\u0000-\u001f\u007f]/;
export function validateQuestion(question) {
  if (typeof question !== 'string' || question.trim() !== question || question.length<14 || question.length>180 || priv.test(question) || controls.test(question)) {
    throw new Error('QUESTION_REFUSED: use 14–180 public-safe characters; omit identifiers, links, contacts and private details.');
  }
  return question;
}
function canonical(value) {
  if(value===null||['string','boolean'].includes(typeof value))return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  throw new Error('UNSUPPORTED_CANONICAL_TYPE');
}
export async function digest(value) {
  if(!globalThis.crypto?.subtle)throw new Error('SECURE_CONTEXT_REQUIRED');
  const bytes=new TextEncoder().encode('ABUNDENT-PANDO-004|'+canonical(value));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return 'sha256:'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
const laneIds=new Set(CAPABILITIES.map(x=>x.id));
const allowed=new Set(['PENDING','HOLD_FOR_DISCUSSION','DECLINE','CONSIDER_FURTHER']);
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function shape(body) {
  if(!exact(body,['schema','event','origin','kind','question','fieldPacketId','invitations','authority','effect']))throw new Error('UNEXPECTED_FIELDS');
  if(body.schema!==SCHEMA||body.event!==EVENT||body.authority!=='NONE'||body.effect!=='NONE'||!['QUESTION','OFFER','NEED','BUILD'].includes(body.kind))throw new Error('FALSE_AUTHORITY');
  if(!['EXAMPLE_ONLY','SELF_ATTESTED_LOCAL','IMPORT_003_VERIFIED_BYTES'].includes(body.origin))throw new Error('INVALID_ORIGIN');
  validateQuestion(body.question);
  if(body.fieldPacketId!==null&&!/^sha256:[a-f0-9]{64}$/.test(body.fieldPacketId))throw new Error('INVALID_SOURCE');
  if(body.origin==='IMPORT_003_VERIFIED_BYTES'&&body.fieldPacketId===null)throw new Error('MISSING_SOURCE');
  if(body.origin!=='IMPORT_003_VERIFIED_BYTES'&&body.fieldPacketId!==null)throw new Error('INVALID_SOURCE_SCOPE');
  if(!Array.isArray(body.invitations)||body.invitations.length<1||body.invitations.length>CAPABILITIES.length)throw new Error('INVALID_LANES');
  const seen=new Set();
  for(const i of body.invitations){
    if(!exact(i,['lane','status','witness'])||!laneIds.has(i.lane)||seen.has(i.lane)||!allowed.has(i.status))throw new Error('INVALID_INVITATION');
    if(i.witness!==(i.status==='PENDING'?'NONE':'LOCAL_SIMULATION_ONLY'))throw new Error('FALSE_WITNESS');
    seen.add(i.lane);
  }
  if(body.origin==='EXAMPLE_ONLY'&&!EXAMPLES.some(e=>e.kind===body.kind&&e.question===body.question))throw new Error('EXAMPLE_MISMATCH');
}
async function signBody(body){shape(body);return {id:await digest(body),...body};}
export async function openExercise({kind='QUESTION',question,lanes,origin='SELF_ATTESTED_LOCAL',consent=false,fieldPacket=null}){
  validateQuestion(question);
  if(origin==='SELF_ATTESTED_LOCAL'&&consent!==true)throw new Error('OPERATOR_PERMISSION_ATTESTATION_REQUIRED');
  if(origin==='IMPORT_003_VERIFIED_BYTES'){
    await verifyFieldQuestion(fieldPacket);
    if(fieldPacket.public_question!==question||fieldPacket.kind!==kind)throw new Error('IMPORTED_SOURCE_MISMATCH');
  }
  const unique=[...new Set(lanes||[])];
  const body={schema:SCHEMA,event:EVENT,origin,kind,question,fieldPacketId:origin==='IMPORT_003_VERIFIED_BYTES'?fieldPacket.id:null,
    invitations:unique.map(lane=>({lane,status:'PENDING',witness:'NONE'})),authority:'NONE',effect:'NONE'};
  return signBody(body);
}
export async function verifyExercise(exercise){
  if(!exercise||typeof exercise!=='object'||typeof exercise.id!=='string')throw new Error('INVALID_EXERCISE');
  const {id,...body}=exercise;
  shape(body);
  if(!exact(exercise,['id','schema','event','origin','kind','question','fieldPacketId','invitations','authority','effect']))throw new Error('UNEXPECTED_EXERCISE_FIELDS');
  if(await digest(body)!==id)throw new Error('EXERCISE_DIGEST_MISMATCH');
  return true;
}
export async function simulateResponse(exercise,lane,status){
  await verifyExercise(exercise);
  if(!laneIds.has(lane)||!RESPONSES.some(x=>x.id===status)||!exercise.invitations.some(x=>x.lane===lane))throw new Error('INVALID_RESPONSE');
  const {id:previousId,...body}=exercise;
  return signBody({...body,invitations:body.invitations.map(x=>x.lane===lane?{lane,status,witness:'LOCAL_SIMULATION_ONLY'}:x)});
}
export async function makeReturn(exercise){
  await verifyExercise(exercise);
  const body={schema:'abundent.pando-local-return/v0',event:EVENT,exerciseId:exercise.id,originQuestion:exercise.question,
    results:exercise.invitations.map(x=>({lane:x.lane,status:x.status})),
    outcome:'NO_REAL_WORLD_OUTCOME_CLAIMED',authority:'NONE',published:false,organizerAdopted:false,recipientVerified:false};
  return {id:await digest(body),...body};
}
export async function verifyReturn(receipt,exercise){
  await verifyExercise(exercise);
  if(!receipt||!exact(receipt,['id','schema','event','exerciseId','originQuestion','results','outcome','authority','published','organizerAdopted','recipientVerified']))throw new Error('INVALID_RECEIPT');
  const expected=await makeReturn(exercise);
  if(canonical(receipt)!==canonical(expected))throw new Error('RETURN_MISMATCH');
  return true;
}
