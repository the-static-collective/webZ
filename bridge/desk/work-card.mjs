// BRIDGE-005 — zero-contact, public-only, exact-source operator work card.
// Never includes an encrypted journal event, note, credential, invitation or human identity.
export const WORK_SOURCE_COMMIT="27c280d5297e593512d85eb3c83d74904856cfdf";
export const WORK_SOURCE_URL="https://github.com/the-static-collective/webZ/blob/"+WORK_SOURCE_COMMIT+"/bridge/network/model.mjs";
export const WORK_SCHEMA="abundent.bridge-work-card/v1";
export const WORK_ACTIONS=Object.freeze([
 ["VERIFY_ELIGIBILITY","Check the institution's current official eligibility and deadline."],
 ["ASK_LOCAL_PERMISSION","Ask a real local steward or eligible applicant whether they want to review a bounded proposal."],
 ["PREPARE_SYNTHETIC_DEMO","Prepare one source-pinned, synthetic, public-safe demonstrator."],
 ["REQUEST_CRITIQUE","Prepare an unsent invitation requesting critical review of one demonstrator."]
]);
const allowed=new Set(WORK_ACTIONS.map(x=>x[0]));
const targets=new Set(["JARVIS","PLANZ"]);
const format=/^bridge-work-v1:[a-f0-9]{64}$/;
export function workBody({doorId,target,actionCode},doors){
 if(!Array.isArray(doors)||!doors.some(d=>d.id===doorId))throw Error("Unknown candidate institution");
 if(!targets.has(target)||!allowed.has(actionCode))throw Error("Unsupported target or task");
 return {
 schema:WORK_SCHEMA,sourceCommit:WORK_SOURCE_COMMIT,sourceUrl:WORK_SOURCE_URL,
 snapshot:"BRIDGE-NETWORK-003/2026-10-28",doorId,target,actionCode,
 classification:"PUBLIC_ONLY_HOLD_FOR_LOCAL_REVIEW",manualExport:true,
 externalContact:false,applicationSubmitted:false,receiverAdmitted:false,
 fieldVerified:false,authority:"NONE"
 };
}
async function digest(s){const a=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(a),x=>x.toString(16).padStart(2,"0")).join("")}
export async function buildWorkCard(input,doors){
 const body=workBody(input,doors);
 return { ...body,candidateId:"bridge-work-v1:"+await digest("BRIDGE-005|"+JSON.stringify(body)) };
}
export async function verifyWorkCard(p,doors){
 if(!p||typeof p!=="object"||Array.isArray(p)||!format.test(p.candidateId??""))throw Error("Invalid work card");
 const {candidateId,...remaining}=p,body=workBody(p,doors);
 if(Object.keys(p).length!==Object.keys(body).length+1||JSON.stringify(remaining)!==JSON.stringify(body))throw Error("Unsupported or altered work card fields");
 if(candidateId!=="bridge-work-v1:"+await digest("BRIDGE-005|"+JSON.stringify(body)))throw Error("Changed work card digest");
 return p;
}
