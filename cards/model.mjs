// LIVING-CARDS-001: portable, unsigned, self-attested field records.
// This pure module NEVER grants title, custody, payment, identity or a physical action.
export const SCHEMA = "webz/living-cards/v1";
export const MAX_LINK_BYTES = 6000;
const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: true });
const KINDS = new Set(["HAVE", "NEED", "CAN_DO"]);
const RESPONSES = new Set(["INTERESTED", "CAN_HELP", "QUESTION", "PASS"]);
const OUTCOMES = new Set(["DONE", "PARTIAL", "NOT_DONE"]);
const RETURNS = new Set(["CONFIRMED", "DISPUTED"]);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function keys(x, allowed) {
  if (!x || typeof x !== "object" || Array.isArray(x)) throw Error("Expected one card object.");
  if (Object.keys(x).length !== allowed.length || !allowed.every(k => own(x, k)))
    throw Error("The record fields do not match this version.");
}
function text(v, label, max, min = 0) {
  if (typeof v !== "string" || v.length < min || v.length > max) throw Error(label + " must be " + min + "–" + max + " characters.");
  if (/[\u0000-\u001f\u007f]/.test(v)) throw Error(label + " contains a control character.");
  return v;
}
function id(v) { return text(v, "Record ID", 100, 12); }
function timestamp(v) {
  if (typeof v !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) ||
      !Number.isFinite(Date.parse(v))) throw Error("Invalid time.");
  return v;
}
function uuid() {
  if (!globalThis.crypto?.randomUUID) throw Error("A secure browser connection is required to issue this local ID.");
  return globalThis.crypto.randomUUID();
}
const iso = (now) => new Date(now).toISOString();
function validateCard(card) {
  keys(card, ["schema","type","id","kind","title","detail","area","deadline","createdAt"]);
  if (card.schema !== SCHEMA || card.type !== "CARD" || !KINDS.has(card.kind)) throw Error("Unrecognized card kind.");
  id(card.id); text(card.title,"Title",90,3); text(card.detail,"Description",240);
  text(card.area,"General area",80,3); timestamp(card.createdAt);
  if (card.deadline !== "" && timestamp(card.deadline) <= card.createdAt)
    throw Error("Deadline must be after creation.");
  return card;
}
function validateReply(x) {
  keys(x,["schema","type","id","card","cardFingerprint","response","note","createdAt"]);
  if(x.schema!==SCHEMA || x.type!=="REPLY" || !RESPONSES.has(x.response))throw Error("Unrecognized reply.");
  id(x.id);validateCard(x.card);text(x.cardFingerprint,"Card fingerprint",64,64);
  text(x.note,"Reply note",180);timestamp(x.createdAt);
  return x;
}
function validateReport(x) {
  keys(x,["schema","type","id","card","cardFingerprint","reply","outcome","note","createdAt"]);
  if(x.schema!==SCHEMA || x.type!=="REPORT" || !OUTCOMES.has(x.outcome))throw Error("Unrecognized report.");
  id(x.id);validateCard(x.card);text(x.cardFingerprint,"Card fingerprint",64,64);
  if(x.reply!==null)validateReply(x.reply);
  text(x.note,"Report note",200,3);timestamp(x.createdAt);
  return x;
}
function validateReturn(x) {
  keys(x,["schema","type","id","report","reportFingerprint","decision","note","createdAt"]);
  if(x.schema!==SCHEMA || x.type!=="RETURN" || !RETURNS.has(x.decision))throw Error("Unrecognized return.");
  id(x.id);validateReport(x.report);text(x.reportFingerprint,"Report fingerprint",64,64);
  text(x.note,"Return note",180);timestamp(x.createdAt);
  return x;
}
function hex(bytes){return Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");}
export async function fingerprint(value, subtle = globalThis.crypto?.subtle) {
  if(!subtle)throw Error("Cryptographic hashing requires HTTPS or localhost.");
  const bytes = enc.encode(JSON.stringify(value));
  return hex(new Uint8Array(await subtle.digest("SHA-256",bytes)));
}
function safeTime(now) {
  if (!Number.isFinite(now) || now < Date.UTC(2020,0,1)) throw Error("Invalid clock.");
  return iso(now);
}
export function makeCard(input, { now=Date.now(), createId=uuid }={}) {
  if (!input || input.consent !== true) throw Error("Confirm this is your own description to share.");
  const kind = input.kind;
  if(!KINDS.has(kind)) throw Error("Choose HAVE, NEED, or CAN_DO.");
  const title=text(String(input.title??"").trim(),"Title",90,3);
  const detail=text(String(input.detail??"").trim(),"Description",240);
  const area=text(String(input.area??"").trim(),"General area",80,3);
  const createdAt=safeTime(now);
  const deadline=input.deadline ? new Date(input.deadline).toISOString() : "";
  const card={schema:SCHEMA,type:"CARD",id:createId(),kind,title,detail,area,deadline,createdAt};
  validateCard(card);
  return card;
}
export async function makeReply(card, response, note="", {now=Date.now(),createId=uuid}={}) {
  validateCard(card);if(!RESPONSES.has(response))throw Error("Unknown reply choice.");
  const x={schema:SCHEMA,type:"REPLY",id:createId(),card,
    cardFingerprint:await fingerprint(card),response,note:text(String(note).trim(),"Reply note",180),
    createdAt:safeTime(now)};
  return x;
}
export async function makeReport(source, outcome, note, {now=Date.now(),createId=uuid}={}) {
  if(!OUTCOMES.has(outcome))throw Error("Unknown reported outcome.");
  const reply=source.type==="REPLY"?source:null;
  if(reply)await validatePacket(reply);
  else await validatePacket(source);
  const card=reply?reply.card:source;
  return {schema:SCHEMA,type:"REPORT",id:createId(),card,cardFingerprint:await fingerprint(card),reply,
    outcome,note:text(String(note??"").trim(),"Report note",200,3),createdAt:safeTime(now)};
}
export async function makeReturn(report,decision,note="",{now=Date.now(),createId=uuid}={}) {
  await validatePacket(report);
  if(report.type!=="REPORT"||!RETURNS.has(decision))throw Error("Requires a report and a return choice.");
  return {schema:SCHEMA,type:"RETURN",id:createId(),report,reportFingerprint:await fingerprint(report),
    decision,note:text(String(note).trim(),"Return note",180),createdAt:safeTime(now)};
}
export async function validatePacket(x) {
  if(!x || typeof x!=="object"||!["CARD","REPLY","REPORT","RETURN"].includes(x.type))throw Error("Unknown card packet.");
  if(x.type==="CARD")validateCard(x);
  if(x.type==="REPLY"){
    validateReply(x);
    if(x.cardFingerprint!==await fingerprint(x.card))throw Error("Card fingerprint mismatch.");
  }
  if(x.type==="REPORT"){
    validateReport(x);
    if(x.cardFingerprint!==await fingerprint(x.card))throw Error("Report references a modified card.");
    if(x.reply){await validatePacket(x.reply);
      if(x.reply.cardFingerprint!==x.cardFingerprint)throw Error("Reply refers to another card.");
    }
  }
  if(x.type==="RETURN"){
    validateReturn(x);
    await validatePacket(x.report);
    if(x.reportFingerprint!==await fingerprint(x.report))throw Error("Return references a modified report.");
  }
  return x;
}
export function encodePacket(packet) {
  // For an unknown object, only encode after the caller validates it.
  const bytes=enc.encode(JSON.stringify(packet));
  if(bytes.length>MAX_LINK_BYTES)throw Error("Card exchange exceeds the portable link size limit.");
  let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export async function decodePacket(token) {
  if(typeof token!=="string"||token.length<16||token.length>MAX_LINK_BYTES*2||!/^[A-Za-z0-9_-]+$/.test(token))
    throw Error("The card link is missing or malformed.");
  const padded=token.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(token.length/4)*4,"=");
  let binary;try{binary=atob(padded)}catch{throw Error("Could not decode this card.");}
  if(binary.length>MAX_LINK_BYTES)throw Error("Card is larger than the allowed limit.");
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  let value;try{value=JSON.parse(dec.decode(bytes))}catch{throw Error("Card contains invalid text or JSON.");}
  return await validatePacket(value);
}
export function cardOf(packet) { return packet.type==="RETURN"?packet.report.card:packet.type==="CARD"?packet:packet.card; }
export function label(packet) {
  if(packet.type==="CARD")return "Self-described "+packet.kind.toLowerCase()+" card · NOT VERIFIED";
  if(packet.type==="REPLY")return "Unverified response · NOT A RESERVATION";
  if(packet.type==="REPORT")return "Person-reported outcome · NOT CONFIRMED";
  return packet.decision==="CONFIRMED" ? "Two unsigned assertions agree · IDENTITIES NOT VERIFIED" :
    "A second assertion disputes the report · UNRESOLVED";
}
