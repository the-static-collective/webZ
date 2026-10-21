import { SEEDS } from "./seed.mjs";

export { SEEDS };
export const DRAFT_SCHEMA = "abundent.field-draft/v0.1";
export const RETURN_SCHEMA = "abundent.field-return/v0.1";
export const MAX_SHARED_URL_LENGTH = 1100;
const ID = /^[a-z][a-z0-9-]{2,80}$/;
const TYPES = ["POSTYMON", "REALITY.2"];
const PRIVATE_DETAIL = /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/i;

export function seedById(id) { return SEEDS.find(card => card.id === id) ?? null; }
function bounded(value, name, max) {
  if (typeof value !== "string") throw new Error(name + " must be text.");
  const s = value.trim().replace(/\s+/g, " ");
  if (!s || s.length > max) throw new Error(name + " must have 1–" + max + " characters.");
  if (/[<>\u0000-\u001f]/.test(s) || PRIVATE_DETAIL.test(s)) throw new Error(name + " cannot contain markup or apparent contact details.");
  return s;
}
function exactKeys(obj, keys) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || Object.keys(obj).some(k => !keys.includes(k))) throw new Error("Unsupported fields.");
}
export function makeDraft(raw, fixedId = "local-" + crypto.randomUUID().slice(0, 12)) {
  exactKeys(raw, ["kind","title","question","parentId","acknowledged"]);
  if (raw.acknowledged !== true) throw new Error("Confirm that no personal details or authority claims are included.");
  if (!TYPES.includes(raw.kind)) throw new Error("Choose POSTYMON or REALITY.2.");
  const title = bounded(raw.title, "Title", 64);
  const question = bounded(raw.question, "Question", 150);
  const parentId = raw.parentId === "" || raw.parentId == null ? null : raw.parentId;
  if (parentId !== null && !seedById(parentId) && !/^local-[a-z0-9-]{4,80}$/.test(parentId)) throw new Error("Choose a recognized seed or local draft as parent.");
  if (parentId === fixedId) throw new Error("A card cannot parent itself.");
  if (!ID.test(fixedId)) throw new Error("Invalid local draft ID.");
  return Object.freeze({ schema:DRAFT_SCHEMA, id:fixedId, kind:raw.kind, title, question, parentId, state:"UNREVIEWED_DRAFT", authority:"NONE", published:false });
}
export function validateDraft(d) {
  exactKeys(d, ["schema","id","kind","title","question","parentId","state","authority","published"]);
  if (d.schema !== DRAFT_SCHEMA || d.state !== "UNREVIEWED_DRAFT" || d.authority !== "NONE" || d.published !== false || typeof d.id !== "string") throw new Error("Not a local draft.");
  const v = makeDraft({kind:d.kind,title:d.title,question:d.question,parentId:d.parentId,acknowledged:true}, d.id);
  return v;
}
export function makeReturn(cardId,kind,note) {
  if (!seedById(cardId) && !(typeof cardId==="string" && /^local-[a-z0-9-]{4,80}$/.test(cardId))) throw new Error("Unknown card.");
  if (!["QUESTION","OBSERVATION","PROPOSED_CONNECTION"].includes(kind)) throw new Error("Choose a return kind.");
  return {schema:RETURN_SCHEMA,cardRef:cardId,kind,note:bounded(note,"Return note",220),status:"UNVERIFIED_PERSONAL_NOTE",authority:"NONE",externalAdoption:"NOT_CLAIMED"};
}

// An observation is a private, unverified source note; it is never placed in
// a printed card, URL fragment, QR, or public seed. Only the *human-authored*
// candidate question travels in the descendant. Exporting this bundle is an
// explicit, local file action, not a publish/offer/consent action.
export const OBSERVATION_CROSSING_SCHEMA = "abundent.observation-crossing/v0.1";
export function makeObservationCrossing(raw, fixedId) {
  exactKeys(raw, ["parentId","observation","kind","title","question","acknowledged"]);
  if (raw.acknowledged !== true) throw new Error("Confirm the content is safe to save and does not imply an offer.");
  const draft = makeDraft({
    kind:raw.kind,title:raw.title,question:raw.question,
    parentId:raw.parentId,acknowledged:true
  }, fixedId);
  const observation=makeReturn(raw.parentId || draft.id,"OBSERVATION",raw.observation);
  return Object.freeze({
    schema:OBSERVATION_CROSSING_SCHEMA,
    observation:Object.freeze(observation),
    descendant:draft,
    status:"UNVERIFIED_LOCAL_CROSSING",
    published:false,
    authorization:"NONE",
    noteOnPublicCard:false
  });
}


// Reading a local bundle does not admit the source, authenticate the author,
// or grant authority to post/share the note. Only the validated descendant
// may be copied into a QR; the observation remains in the local JSON file.
export function validateObservationCrossing(value) {
  exactKeys(value, ["schema","observation","descendant","status","published","authorization","noteOnPublicCard"]);
  if(value.schema!==OBSERVATION_CROSSING_SCHEMA || value.status!=="UNVERIFIED_LOCAL_CROSSING"
    || value.published!==false || value.authorization!=="NONE" || value.noteOnPublicCard!==false)
    throw new Error("Not an unverified local observation crossing.");
  const draft=validateDraft(value.descendant);
  exactKeys(value.observation, ["schema","cardRef","kind","note","status","authority","externalAdoption"]);
  const observation=makeReturn(draft.parentId || draft.id,"OBSERVATION",value.observation.note);
  if(JSON.stringify(value.observation)!==JSON.stringify(observation))
    throw new Error("Observation status or parent does not match the local draft.");
  return Object.freeze({schema:OBSERVATION_CROSSING_SCHEMA,observation:Object.freeze(observation),
    descendant:draft,status:"UNVERIFIED_LOCAL_CROSSING",published:false,authorization:"NONE",noteOnPublicCard:false});
}

function safeOrigin(href) {
  const u = new URL(href);
  if (!["https:","http:"].includes(u.protocol)) throw new Error("Use a hosted preview URL.");
  u.search = ""; u.hash = ""; u.pathname = u.pathname.replace(/(?:index\.html)?$/,"");
  return u;
}
export function seedLink(id,href) {
  if (!seedById(id)) throw new Error("Unknown seed.");
  const u = safeOrigin(href);u.searchParams.set("card",id);return u.href;
}
function toBase64Url(s) {
  const bytes = new TextEncoder().encode(s);
  let raw = ""; for (const b of bytes) raw += String.fromCharCode(b);
  return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function fromBase64Url(s) {
  if (!/^[A-Za-z0-9_-]{1,1200}$/.test(s)) throw new Error("Invalid portable draft.");
  const raw = atob(s.replace(/-/g,"+").replace(/_/g,"/"));
  return new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));
}
export function draftLink(d,href) {
  const draft=validateDraft(d);const u=safeOrigin(href);u.hash="draft="+toBase64Url(JSON.stringify(draft));
  if (u.href.length > MAX_SHARED_URL_LENGTH) throw new Error("Draft too long for a scannable QR. Shorten the question.");
  return u.href;
}
export function readDraftHash(hash) {
  if (typeof hash!=="string" || !hash.startsWith("#draft=")) return null;
  const value=hash.slice(7); if(value.length>1200) throw new Error("Portable link too long.");
  return validateDraft(JSON.parse(fromBase64Url(value)));
}
export function isProductionHost(href) {
  const u = new URL(href); return u.protocol==="https:" && ["abundent.org","www.abundent.org"].includes(u.hostname);
}
export function publicCard(card) {
  if (card?.state==="SEED") return seedById(card.id) === card;
  if (card?.state==="UNREVIEWED_DRAFT") return false;
  return false;
}
