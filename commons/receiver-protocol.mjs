/**
 * Living Receiver 001 — owner-reviewed, portable OFFLINE exchange packets.
 * No authentication, cryptographic signature, network dispatch, or field proof.
 * The content hash binds local bytes only; it does not identify a person.
 */
import {CATEGORIES,UNITS,draftNeed} from "./exchange.mjs";

export const SOURCE_SCHEMAS=Object.freeze([
  "porchlight-commons/exchange-packet/v0","planz.return-candidate/v0"
]);
export const RESPONSE_SCHEMA="porchlight-commons/receiver-response/v1";
export const REPORT_SCHEMA="porchlight-commons/receiver-report/v1";
const SHA=/^sha256:[0-9a-f]{64}$/;
const GITHUB=/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9_.-]+\/issues\/[1-9][0-9]*$/;
const PII=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s().-]{8,}\d|\b(?:client|guest|resident|patient)\s*(?:name|id|address|case)\b|\b(?:shelter address|home address|street address|account number|exact location|case number)\b|\b\d{1,5}\s+[a-z]+\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b)/i;
const NOTICE="Unverified local candidate. No personal notes, aliases or evidence exported.";
const DECISIONS=["HOLD","REFUSE","ACCEPT_FOR_LOCAL_REVIEW"];
const ROLES=["local-steward","organization-operator","community-reviewer"];
const STATUSES=["REPORTED_COMPLETE","REPORTED_PARTIAL","BLOCKED"];
function obj(v,label){
  if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Invalid "+label);
  return v;
}
function exact(v,keys,label) {
  obj(v,label);
  if(Object.keys(v).sort().join("|")!==[...keys].sort().join("|"))
    throw Error("Unexpected fields in "+label);
}
function safe(v,label,limit,min=1){
  if(typeof v!=="string")throw Error(label+" must be text.");
  const s=v.trim().replace(/\s+/g," ");
  if(s.length<min||s.length>limit)throw Error(label+" must be "+min+"–"+limit+" characters.");
  if(PII.test(s))throw Error("Remove personal details, contacts, exact sites and case records.");
  return s;
}
function date(v){
  if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)||
      !Number.isFinite(Date.parse(v)))throw Error("Invalid ISO time.");
  return v;
}
function stable(v){
  if(Array.isArray(v))return "["+v.map(stable).join(",")+"]";
  if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+stable(v[k])).join(",")+"}";
  return JSON.stringify(v);
}
export async function contentId(v){
  const bytes=new TextEncoder().encode(stable(v));
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return "sha256:"+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
}
function eq(a,b){return stable(a)===stable(b);}
function validateCommons(packet){
  exact(packet,["schema","visibility","dispatch","need","possible_routes","handoff","transition_law"],"exchange envelope");
  if(packet.visibility!=="REVIEW_BEFORE_SHARING"||packet.dispatch!=="DISABLED"||
     typeof packet.transition_law!=="string"||packet.transition_law.length>350)
    throw Error("A source packet claimed dispatch or unsupported authority.");
  const n=obj(packet.need,"need");
  exact(n,["schema","status","source_kind","public_scope","origin_region","category","requirement","local_operator_authorized","responder_accepted","receiver_confirmed","people","precise_sites","evidence","notice"],"need");
  exact(n.requirement,["summary","quantity","unit","window"],"requirement");
  const rebuilt=draftNeed({
    region:n.origin_region,category:n.category,summary:n.requirement.summary,
    quantity:n.requirement.quantity,unit:n.requirement.unit,window:n.requirement.window
  });
  if(!eq(n,rebuilt))throw Error("Invalid or authority-escalated organizational need.");
  const h=obj(packet.handoff,"handoff");
  exact(h,["originating_provider","local_steward","independent_lived_experience_review","resource_offer","recipient_confirmation","partner_agreement"],"handoff");
  if(!eq(h,{
    originating_provider:"NOT_ESTABLISHED",local_steward:"NOT_VERIFIED",
    independent_lived_experience_review:"PENDING",resource_offer:"NOT_ACCEPTED",
    recipient_confirmation:"NOT_RECEIVED",partner_agreement:"NOT_SIGNED"
  }))throw Error("Source packet claimed unverified partner or recipient approval.");
  const routes=obj(packet.possible_routes,"routes");
  exact(routes,["routes","lowestStatedEligible","savingsAgainstNextEligible","caveat"],"routes");
  if(!Array.isArray(routes.routes)||routes.routes.length!==3)throw Error("Invalid route comparison.");
  const types=["local-purchase","remote-donation","knowledge-transfer"];
  routes.routes.forEach((r,i)=>{
    exact(r,["route","estimatedUSD","eligible","missing"],"route");
    if(r.route!==types[i]||typeof r.eligible!=="boolean"||
       (r.estimatedUSD!==null&&(!Number.isFinite(r.estimatedUSD)||r.estimatedUSD<0||r.estimatedUSD>100000000))||
       (r.missing!==null&&typeof r.missing!=="string"))
      throw Error("Invalid route estimate.");
  });
  if(routes.lowestStatedEligible!==null&&!types.includes(routes.lowestStatedEligible)||
     routes.savingsAgainstNextEligible!==null&&(!Number.isFinite(routes.savingsAgainstNextEligible)||routes.savingsAgainstNextEligible<0)||
     typeof routes.caveat!=="string"||routes.caveat.length>350)
    throw Error("Invalid route comparison metadata.");
  // Route prices are unverified estimates even if marked eligible by sender.
  return {kind:"organizational-need",heading:n.requirement.summary,region:n.origin_region,
    origin:"Unverified organization-level draft",detail:n.requirement.quantity+" "+n.requirement.unit+" / "+n.requirement.window,
    sourceRef:null,quantity:n.requirement.quantity,unit:n.requirement.unit};
}
async function validatePlanReturn(p){
  exact(p,["schema","candidateId","planId","sourceIssue","sourceEdition","sourceSha256","weaveId","publicMethodCandidate","preparedAt","localReport","review","disposition","fieldVerified","sourceOwnerApproved","recipientConfirmed","sentExternally","authority","notice"],"planZ candidate");
  if(!/^planz-return-v0:[a-f0-9]{64}$/.test(p.candidateId)||
      !/^[A-Z0-9-]{5,44}$/.test(p.planId)||!GITHUB.test(p.sourceIssue)||
      !/^ATTENTION-\d{4}-\d{2}-\d{2}-\d{3}$/.test(p.sourceEdition)||
      !/^[a-f0-9]{64}$/.test(p.sourceSha256)||
      !/^weave:[a-f0-9-]{36}$/.test(p.weaveId)||
      p.localReport!=="COMPLETED_REPORTED_UNVERIFIED"||
      p.review!=="SECOND_ALIAS_REVIEW_ASSERTED_NOT_AUTHENTICATED"||
      p.disposition!=="HOLD_FOR_OWNER_REVIEW"||
      p.fieldVerified!==false||p.sourceOwnerApproved!==false||
      p.recipientConfirmed!==false||p.sentExternally!==false||
      p.authority!=="NONE"||p.notice!==NOTICE)throw Error("Invalid or authority-escalated planZ return.");
  const heading=safe(p.publicMethodCandidate,"Method",220,30);
  date(p.preparedAt);
  // Match the original JAR;VIS / planZ JSON field-order digest, NOT sorted-key digest.
  const basis={
    planId:p.planId,sourceIssue:p.sourceIssue,sourceEdition:p.sourceEdition,
    sourceSha256:p.sourceSha256,weaveId:p.weaveId,publicMethodCandidate:p.publicMethodCandidate
  };
  const bytes=new TextEncoder().encode("PLANZ-RETURN-001|"+JSON.stringify(basis));
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  const id="planz-return-v0:"+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,"0")).join("");
  if(id!==p.candidateId)throw Error("PlanZ packet digest does not match its contents.");
  return {kind:"method-candidate",heading,region:"Source-owned plan: "+p.planId,
    origin:"Unverified locally reported method",detail:"Human owner review required; report is not confirmation.",
    sourceRef:p.sourceIssue,quantity:null,unit:null};
}
function validateResponse(p){
  exact(p,["schema","packet_id","source_schema","decision","reviewer_role","reason","reviewed_at","authorization","partner_permission","transport_signature","dispatch","field_verified","recipient_confirmed"],"receiver response");
  if(!SHA.test(p.packet_id)||!SOURCE_SCHEMAS.includes(p.source_schema)||
      !DECISIONS.includes(p.decision)||!ROLES.includes(p.reviewer_role)||
      p.authorization!=="SELF_ATTESTED_NOT_AUTHENTICATED"||
      p.partner_permission!=="NOT_VERIFIED"||p.transport_signature!=="NOT_SIGNED"||
      p.dispatch!=="DISABLED"||p.field_verified!==false||p.recipient_confirmed!==false)
    throw Error("Invalid or falsely authorized receiver response.");
  safe(p.reason,"Reason",220,12);date(p.reviewed_at);
  return {kind:"review-response",heading:p.decision.replaceAll("_"," "),region:"Owner-local decision claim",
    origin:"Unsigned and self-attested",detail:p.reason,sourceRef:null,quantity:null,unit:null};
}
function validateReport(p){
  exact(p,["schema","packet_id","response_id","field_status","summary","quantity_reported","unit","reported_at","reporter_authentication","recipient_confirmed","field_verified","source_owner_approved","dispatch"],"field report");
  if(!SHA.test(p.packet_id)||!SHA.test(p.response_id)||!STATUSES.includes(p.field_status)||
      !UNITS.includes(p.unit)||!Number.isSafeInteger(p.quantity_reported)||
      p.quantity_reported<0||p.quantity_reported>100000||
      p.reporter_authentication!=="NOT_AUTHENTICATED"||
      p.recipient_confirmed!==false||p.field_verified!==false||
      p.source_owner_approved!==false||p.dispatch!=="DISABLED")
    throw Error("Invalid or falsely confirmed report.");
  safe(p.summary,"Report",220,20);date(p.reported_at);
  return {kind:"field-report",heading:p.field_status.replaceAll("_"," "),region:"Unverified local report",
    origin:"No independent recipient confirmation",detail:p.summary,sourceRef:null,quantity:p.quantity_reported,unit:p.unit};
}
export async function inspectPacket(raw){
  let p=raw;
  if(typeof p==="string"){
    if(new TextEncoder().encode(p).length>16384)throw Error("Packet exceeds 16 KB limit.");
    try{p=JSON.parse(p)}catch{throw Error("Not valid JSON.");}
  }
  if(new TextEncoder().encode(JSON.stringify(p)).length>16384)throw Error("Packet exceeds 16 KB limit.");
  obj(p,"packet");
  let view;
  if(p.schema==="porchlight-commons/exchange-packet/v0")view=validateCommons(p);
  else if(p.schema==="planz.return-candidate/v0")view=await validatePlanReturn(p);
  else if(p.schema===RESPONSE_SCHEMA)view=validateResponse(p);
  else if(p.schema===REPORT_SCHEMA)view=validateReport(p);
  else throw Error("Unknown source format. Use a Porchlight HOLD or planZ candidate.");
  const packet_id=await contentId(p);
  return {packet:p,packet_id,...view,actionable:SOURCE_SCHEMAS.includes(p.schema)};
}
export async function makeReceiverResponse(inspected,input,at=new Date().toISOString()){
  if(!inspected?.actionable)throw Error("Only original source packets may receive decisions.");
  if(!SHA.test(inspected.packet_id))throw Error("Source digest missing.");
  const decision=String(input.decision??"");
  const reviewer_role=String(input.reviewer_role??"");
  if(!DECISIONS.includes(decision)||!ROLES.includes(reviewer_role))throw Error("Choose a valid local response.");
  if(input.attestation!==true)throw Error("Local operator attestation is required. An alias is not authentication.");
  const reason=safe(input.reason,"Reason",220,12);
  const response={
    schema:RESPONSE_SCHEMA,packet_id:inspected.packet_id,source_schema:inspected.packet.schema,
    decision,reviewer_role,reason,reviewed_at:date(at),
    authorization:"SELF_ATTESTED_NOT_AUTHENTICATED",partner_permission:"NOT_VERIFIED",
    transport_signature:"NOT_SIGNED",dispatch:"DISABLED",
    field_verified:false,recipient_confirmed:false
  };
  validateResponse(response);
  return {packet:response,response_id:await contentId(response)};
}
export async function makeFieldReport(inspected,response,input,at=new Date().toISOString()){
  if(!inspected?.actionable || response?.packet?.decision!=="ACCEPT_FOR_LOCAL_REVIEW" ||
     response.packet.packet_id!==inspected.packet_id)
    throw Error("A local review acceptance is needed before a report can be drafted.");
  if(input.attestation!==true)throw Error("Reporter attestation is required.");
  const field_status=String(input.field_status??"");
  const unit=String(input.unit??"");
  const quantity_reported=Number(input.quantity_reported);
  if(!STATUSES.includes(field_status))throw Error("Choose an unverified report status.");
  if(!UNITS.includes(unit)||!Number.isSafeInteger(quantity_reported)||
     quantity_reported<0||quantity_reported>100000)throw Error("Invalid reported quantity or unit.");
  if(inspected.unit && inspected.unit!==unit)throw Error("Use the same unit as the original need.");
  if(inspected.quantity!==null && quantity_reported>inspected.quantity)
    throw Error("Reported units exceed the original need; create a separate source card.");
  const summary=safe(input.summary,"Report",220,20);
  const report={
    schema:REPORT_SCHEMA,packet_id:inspected.packet_id,response_id:response.response_id,
    field_status,summary,quantity_reported,unit,reported_at:date(at),
    reporter_authentication:"NOT_AUTHENTICATED",recipient_confirmed:false,
    field_verified:false,source_owner_approved:false,dispatch:"DISABLED"
  };
  validateReport(report);
  return {packet:report,report_id:await contentId(report)};
}
