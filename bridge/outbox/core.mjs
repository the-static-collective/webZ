// Outbox 001: private owner workspace. No sending, no source-of-truth claims.
import {catalog} from "./catalog.mjs";
export const SCHEMA="abundent/outbox-001/v1";
export const STATUSES=Object.freeze(["DRAFT","READY_FOR_REVIEW","HOLD","SENT_REPORTED","REPLIED_REPORTED","CANCELED"]);
const invalid=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const reject=s=>{throw Error(s)};
function cleanString(v,max,{multi=false}={}){if(typeof v!=="string"||v.length>max||invalid.test(v)||!multi&&/[\r\n]/.test(v))reject("Invalid draft text");return v.trim()}
export function cleanEntry(e){
 if(!e||typeof e!=="object"||Array.isArray(e))reject("Invalid draft entry");
 const id=cleanString(e.id,96),title=cleanString(e.title,160),group=cleanString(e.group,64),subject=cleanString(e.subject,250),body=cleanString(e.body,14000,{multi:true}),to=cleanString(e.to,600),kind=cleanString(e.kind,44),source=cleanString(e.source,1200),note=cleanString(e.note,1300,{multi:true}),status=cleanString(e.status,30),sentEvidence=cleanString(e.sentEvidence||"",900),sentAt=cleanString(e.sentAt||"",40),origin=cleanString(e.origin||"OWNER_CREATED",50);
 if(!/^[a-z0-9][a-z0-9-]{1,95}$/.test(id)||!title||!subject||!body||!group||!kind||!STATUSES.includes(status))reject("Incomplete draft or unsupported status");
 if(to&&(!/^[^\r\n<>]+$/.test(to)||to.includes("://")))reject("Invalid recipient line");
 if(source){let u;try{u=new URL(source)}catch{reject("Invalid source")};if(u.protocol!=="https:"||u.username||u.password||u.search||u.hash)reject("Source must be safe, public HTTPS");}
 if(sentAt&&!Number.isFinite(Date.parse(sentAt)))reject("Invalid reported send date");
 if(["SENT_REPORTED","REPLIED_REPORTED"].includes(status)&&(!sentAt||!sentEvidence))reject("Reporting sent requires an owner-entered date and evidence/note; not provider verification");
 return {id,title,group,subject,body,to,kind,source,note,status,sentEvidence,sentAt,origin};
}
export function empty(){return {schema:SCHEMA,entries:[]}}
export function verify(data){if(!data||data.schema!==SCHEMA||!Array.isArray(data.entries)||data.entries.length>250)reject("Unsupported outbox format");const ids=new Set();const entries=data.entries.map(e=>{const item=cleanEntry(e);if(ids.has(item.id))reject("Duplicate draft");ids.add(item.id);return item});return {schema:SCHEMA,entries}}
export function importSeeds(box){const old=verify(box),seen=new Set(old.entries.map(e=>e.id));return verify({...old,entries:[...old.entries,...catalog.filter(e=>!seen.has(e.id))]})}
export function put(box,entry){const verified=verify(box),e=cleanEntry(entry);const existing=verified.entries.findIndex(x=>x.id===e.id);const entries=[...verified.entries];if(existing===-1)entries.push(e);else entries[existing]=e;return verify({schema:SCHEMA,entries})}
export function erase(box,id){return verify({schema:SCHEMA,entries:verify(box).entries.filter(e=>e.id!==id)})}
export function newDraft(id){return cleanEntry({id,title:"New letter",group:"My drafts",subject:"Subject to review",body:"Hello,\n\n[Write a message here.]\n\nThe Static Collective / Abundent",to:"",kind:"OWNER_CREATED",source:"",note:"",status:"DRAFT",sentEvidence:"",sentAt:"",origin:"OWNER_CREATED"})}
export function activeCounts(box){const data=verify(box);return {all:data.entries.length,unsent:data.entries.filter(x=>!["SENT_REPORTED","REPLIED_REPORTED","CANCELED"].includes(x.status)).length,reported:data.entries.filter(x=>["SENT_REPORTED","REPLIED_REPORTED"].includes(x.status)).length,held:data.entries.filter(x=>x.status==="HOLD").length,templates:data.entries.filter(x=>x.kind==="RECONSTRUCTED_TEMPLATE").length}}
export function prepareMailto(entry){const e=cleanEntry(entry);if(!e.to)return null;const recipients=e.to.split(",").map(x=>x.trim());if(recipients.some(v=>! /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test(v)))return null;const qs=new URLSearchParams({subject:e.subject,body:e.body});return "mailto:"+recipients.join(",")+"?"+qs.toString()}
