import {INSTITUTIONS,CHURCH_LEADS} from "./data.mjs";
// Public institutional research review only. Not a private CRM or verified partner register.
const records=[...INSTITUTIONS,...CHURCH_LEADS];
const byId=new Map(records.map(r=>[r.id,r]));
export const REVIEW_STATES=Object.freeze({
"not-reviewed":"Not yet reviewed",
"source-checked":"Source checked on date below (self-attested)",
"needs-followup":"Needs another independent source",
"possibly-stale":"Listing may be stale; investigate",
"removed-from-queue":"Remove from this local research queue"
});
export const REVIEW_SCHEMA="common-ground/local-research-notebook/v0";
export function makeReview(id,state,date){
 const lead=byId.get(id);
 if(!lead)throw Error("Unknown public research lead.");
 if(!Object.hasOwn(REVIEW_STATES,state))throw Error("Unknown local research state.");
 if(!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(date)||Number.isNaN(Date.parse(date+"T00:00:00Z")))throw Error("Date must be YYYY-MM-DD.");
 const day=new Date(date+"T00:00:00Z").toISOString().slice(0,10);
 if(day!==date)throw Error("Date is invalid.");
 return {leadId:id,leadName:lead.name,source:lead.source,reviewState:state,reviewedOn:date,provenance:"unsigned local self-attestation",partnershipStatus:"not-established"};
}
export function safeImport(data){
 if(!data||data.schema!==REVIEW_SCHEMA||!Array.isArray(data.observations)||data.observations.length>200)throw Error("Unsupported research notebook.");
 const clean=[];for(const row of data.observations){const expected=makeReview(row.leadId,row.reviewState,row.reviewedOn);if(row.source!==expected.source||row.leadName!==expected.leadName||row.partnershipStatus!==expected.partnershipStatus)throw Error("Review does not match current public source registry.");clean.push(expected)}
 return clean;
}
export function exportNotebook(observations){return JSON.stringify({schema:REVIEW_SCHEMA,notice:"Unsigned local research notes. Not proof of operating status, consent, authorized contact or partnership.",observations:safeImport({schema:REVIEW_SCHEMA,observations})},null,2)}
export const RESEARCH_LEADS=records.map(r=>({id:r.id,name:r.name,type:r.id.startsWith("c")?"Congregation":"Education",city:r.city,source:r.source}));
