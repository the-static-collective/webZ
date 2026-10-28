// BRIDGE-LEDGER-004 — local, owner-attested audit of prospective institution work.
// A cryptographic hash chain detects accidental changes; it is NOT a third-party signature or proof.
import {allDoors} from "../network/model.mjs";
export const SCHEMA="abundent/bridge-operator-journal-v1";
export const TYPES=Object.freeze([
 ["SOURCE_CHECKED","Checked the official eligibility/deadline source"],
 ["LEAD_PERMISSION_REPORTED","Reported an applicant/steward's permission"],
 ["MATERIAL_PREPARED","Prepared a proposal or demo"],
 ["DRAFT_PREPARED","Prepared an unsent introduction"],
 ["OUTREACH_REPORTED","Reported an actual outbound message"],
 ["APPLICATION_REPORTED","Reported submitting an application"],
 ["RESPONSE_RECORDED","Recorded an external response"],
 ["COLLABORATION_DISCUSSION_REPORTED","Reported a collaboration discussion"],
 ["TASK_REPORTED","Recorded a participant's task report"],
 ["INDEPENDENT_REVIEW_REPORTED","Reported a separately performed independent review"],
 ["DECLINED_RECORDED","Recorded refusal or rejection"],
 ["WITHDRAWAL_RECORDED","Recorded withdrawal or request to stop"]
]);
const ids=new Set(allDoors.map(d=>d.id)),codes=new Set(TYPES.map(x=>x[0]));
const textEncoder=new TextEncoder();
const fail=s=>{throw Error(s)};
function exact(x,keys){
 if(!x||typeof x!=="object"||Array.isArray(x)||Object.keys(x).sort().join("|")!==keys.slice().sort().join("|"))fail("Unsupported journal fields.");
}
function str(s,max,min=0){if(typeof s!=="string"||s.length<min||s.length>max||/[\u0000-\u001f\u007f]/.test(s))fail("Invalid journal text.");return s.trim()}
export function evidenceUrl(value){
 if(value==="")return "";
 if(typeof value!=="string"||value.length>1200||/\s|[\u0000-\u001f\u007f]/.test(value))fail("Use a simple public HTTPS evidence URL without spaces.");
 let u;try{u=new URL(value)}catch{fail("Invalid evidence URL.")};
 if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash||!u.hostname||u.hostname.endsWith("."))fail("Evidence links must be public HTTPS without credentials, query or fragments.");
 return u.href;
}
function cleanEvent(raw){exact(raw,["id","doorId","kind","note","evidence","at","previous","digest"]);
 if(typeof raw.id!=="string"||!/^[a-f0-9-]{36}$/.test(raw.id))fail("Invalid event identifier.");
 if(!ids.has(raw.doorId)||!codes.has(raw.kind))fail("Unknown institution or action.");
 const note=str(raw.note,400,8);
 if(typeof raw.at!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(raw.at)||!Number.isFinite(Date.parse(raw.at)))fail("Invalid event date.");
 if(raw.previous!==null&&!(typeof raw.previous==="string"&&/^[a-f0-9]{64}$/.test(raw.previous)))fail("Invalid journal ancestry.");
 if(typeof raw.digest!=="string"||!/^[a-f0-9]{64}$/.test(raw.digest))fail("Invalid digest.");
 return {id:raw.id,doorId:raw.doorId,kind:raw.kind,note,evidence:evidenceUrl(raw.evidence),at:raw.at,previous:raw.previous,digest:raw.digest};
}
function body(e){return {id:e.id,doorId:e.doorId,kind:e.kind,note:e.note,evidence:e.evidence,at:e.at,previous:e.previous}}
async function hash(body){const sum=await crypto.subtle.digest("SHA-256",textEncoder.encode(JSON.stringify(body)));return [...new Uint8Array(sum)].map(n=>n.toString(16).padStart(2,"0")).join("")}
export function emptyJournal(){return {schema:SCHEMA,events:[]}}
export async function verifyJournal(value){
 exact(value,["schema","events"]);if(value.schema!==SCHEMA||!Array.isArray(value.events)||value.events.length>350)fail("Unsupported journal or too many events.");
 const observed=new Set();const events=[];let previous=null;
 for(const raw of value.events){
  const e=cleanEvent(raw);
  if(observed.has(e.id))fail("Duplicate journal event.");observed.add(e.id);
  if(e.previous!==previous)fail("Journal chain was altered or is missing an event.");
  if(await hash(body(e))!==e.digest)fail("Journal digest does not match its contents.");
  if(events.length&&Date.parse(e.at)<Date.parse(events.at(-1).at))fail("Journal dates run backwards.");
  previous=e.digest;events.push(e);
 }
 return {schema:SCHEMA,events};
}
export async function appendEvent(journal,{doorId,kind,note,evidence=""},time=new Date().toISOString()){
 await verifyJournal(journal);
 if(journal.events.length>=350)fail("Journal limit reached. Save an encrypted backup; start a new vault only through an explicitly reviewed migration.");
 if(!ids.has(doorId)||!codes.has(kind))fail("Unknown institution or action.");
 const last=journal.events.at(-1);
 const part={id:crypto.randomUUID(),doorId,kind,note:str(note,400,8),evidence:evidenceUrl(evidence),at:time,previous:last?.digest||null};
 if(!Number.isFinite(Date.parse(time))||last&&Date.parse(time)<Date.parse(last.at))fail("Event date must follow the preceding event.");
 const e={...part,digest:await hash(part)};
 return {schema:SCHEMA,events:[...journal.events,e]};
}
export function historyFor(journal,id){if(!ids.has(id))fail("Unknown institution.");return journal.events.filter(e=>e.doorId===id)}
export function summarize(journal,id){
 const events=historyFor(journal,id);
 const kinds=new Set(events.map(e=>e.kind));
 const last=events.at(-1);
 const stopped=last?.kind==="DECLINED_RECORDED"||last?.kind==="WITHDRAWAL_RECORDED";
 const latest=last?TYPES.find(([code])=>code===last.kind)[1]:"No work recorded";
 // Reported actions are human-entered testimony, not verified outside confirmations.
 return {total:events.length,last:last?.at||null,label:latest,
  submittedClaim:kinds.has("APPLICATION_REPORTED"),responseClaim:kinds.has("RESPONSE_RECORDED"),
  reviewClaim:kinds.has("INDEPENDENT_REVIEW_REPORTED"),stopped,
  classification:events.length?"OWNER_ATTESTED_NOT_EXTERNALLY_VERIFIED":"PROSPECT_ONLY"};
}
export function queue(journal,date=new Date()){
 const day=new Date(date.getFullYear(),date.getMonth(),date.getDate());
 return allDoors.map(d=>{
  const s=summarize(journal,d.id);
  const days=d.deadline?Math.round((new Date(d.deadline+"T12:00:00").getTime()-day.getTime())/86400000):null;
  return {id:d.id,name:d.name,deadline:d.deadline,due:d.due,days,
   priority:s.stopped?"STOP_RECORDED":s.submittedClaim?"SUBMISSION_REPORTED":days!==null&&days<0?"DEADLINE_PASSED_UNRECHECKED":days!==null&&days<=7?"VERIFY_NOW":"OPEN_PROSPECT",
   next:s.total?("Review latest owner-attested event: "+s.label):d.next,count:s.total,entry:d.entry};
 }).sort((a,b)=>{
  const rank={VERIFY_NOW:0,OPEN_PROSPECT:1,DEADLINE_PASSED_UNRECHECKED:2,SUBMISSION_REPORTED:3,STOP_RECORDED:4};
  return rank[a.priority]-rank[b.priority]||(a.days??99999)-(b.days??99999)||a.name.localeCompare(b.name);
 });
}
