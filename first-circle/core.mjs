// FIRST CIRCLE 001 — local, unsigned, explicitly self-reported.
export const CARD_SCHEMA = "abundent/first-circle-card/v0";
export const CARD_SCHEMA_V1 = "abundent/first-circle-card/v1";
export const EXPORT_SCHEMA = "abundent/first-circle-export/v0";
export const DIRECTIONS = Object.freeze(["need", "offer", "play"]);
export const OUTCOMES = Object.freeze(["worked", "not-yet", "different"]);

function bounded(value, max, required = true) {
  if (typeof value !== "string") throw new Error("Expected text.");
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (text.length > max || (required && !text)) throw new Error("Text is empty or too long.");
  return text;
}
function exactKeys(obj, keys) {
  return obj && typeof obj === "object" && !Array.isArray(obj) &&
    Object.keys(obj).length === keys.length && keys.every(k => Object.hasOwn(obj, k));
}
function iso(v) {
  return typeof v === "string" && v.length <= 32 && !Number.isNaN(Date.parse(v)) &&
    new Date(v).toISOString() === v;
}
function uuid(v) {
  return typeof v === "string" && /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(v);
}
function id() { return globalThis.crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

export function createCard(direction, message, nextStep, work = null) {
  if (!DIRECTIONS.includes(direction)) throw new Error("Choose a direction.");
  const base = {
    schema: work === null ? CARD_SCHEMA : CARD_SCHEMA_V1,
    id: id(), createdAt: now(), direction,
    message: bounded(message, 220), nextStep: bounded(nextStep, 160),
    returns: [], method: null
  };
  return validateCard(work === null ? base : { ...base, work });
}

export function validateCard(card) {
  const hasWork = card?.schema === CARD_SCHEMA_V1;
  const keys = ["schema","id","createdAt","direction","message","nextStep","returns","method"];
  if (hasWork) keys.push("work");
  if (!exactKeys(card, keys) ||
      ![CARD_SCHEMA, CARD_SCHEMA_V1].includes(card.schema) || !uuid(card.id) || !iso(card.createdAt) ||
      !DIRECTIONS.includes(card.direction)) throw new Error("Invalid or unrecognized card.");
  bounded(card.message, 220); bounded(card.nextStep, 160);
  if (hasWork) {
    const w = card.work;
    if (!exactKeys(w, ["title","body","status"]) ||
        !["BOUNDED_GUIDE","READY_TO_USE_DRAFT","UNRESOLVED"].includes(w.status))
      throw new Error("Invalid work product or false completion claim.");
    bounded(w.title, 100); bounded(w.body, 1600);
    if (w.body.length > 1600) throw new Error("Oversized prepared work.");
  }
  if (!Array.isArray(card.returns) || card.returns.length > 12) throw new Error("Invalid returns.");
  const ids = new Set();
  for (const item of card.returns) {
    if (!exactKeys(item, ["id","at","outcome","note","status"]) ||
        !uuid(item.id) || !iso(item.at) || !OUTCOMES.includes(item.outcome) ||
        item.status !== "SELF_REPORTED") throw new Error("Invalid return or false authority claim.");
    bounded(item.note, 280, false);
    if (ids.has(item.id)) throw new Error("Duplicate return.");
    ids.add(item.id);
  }
  if (card.method !== null) {
    const m = card.method;
    if (!exactKeys(m, ["status","sourceReturnId","createdAt","text"]) ||
        m.status !== "PROPOSAL_ONLY" || !ids.has(m.sourceReturnId) ||
        !iso(m.createdAt)) throw new Error("Unreviewed method cannot be marked approved.");
    bounded(m.text, 500);
    if (hasWork && (card.work.status === "UNRESOLVED" || card.returns.at(-1)?.outcome !== "worked" || m.sourceReturnId !== card.returns.at(-1)?.id))
      throw new Error("Unverified or unresolved work cannot become a reusable method.");
  }
  return card;
}

export function recordReturn(card, outcome, note = "") {
  validateCard(card);
  if (!OUTCOMES.includes(outcome) || card.returns.length >= 12) throw new Error("Invalid return.");
  const entry = { id: id(), at: now(), outcome, note: bounded(note, 280, false),
                  status: "SELF_REPORTED" };
  return validateCard({ ...card, returns: [...card.returns, entry], method: null });
}

export function proposeMethod(card) {
  validateCard(card);
  const last = card.returns.at(-1);
  if (!last) throw new Error("A return is needed before proposing a reusable method.");
  if (card.schema === CARD_SCHEMA_V1 && (last.outcome !== "worked" || card.work.status === "UNRESOLVED"))
    throw new Error("No reusable method: useful work has not been reported as working.");
  const action = bounded(card.nextStep, 160).replace(/[.!?]+$/, "");
  const text = card.schema === CARD_SCHEMA_V1
    ? "Possible reuse of prepared work: " + card.work.title + ". Adapt to the new case and independently review it. Source result is self-reported, not verified."
    : "When a similar " + card.direction +
      " arises, consider this small experiment: " + action +
      ". Check what actually happened; adapt locally before reuse.";
  return validateCard({
    ...card, method: { status: "PROPOSAL_ONLY", sourceReturnId: last.id,
                         createdAt: now(), text }
  });
}

function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}
async function checksum(payload) {
  const bytes = new TextEncoder().encode(canonical(payload));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function exportCard(card) {
  validateCard(card);
  const payload = JSON.parse(JSON.stringify(card));
  return { schema: EXPORT_SCHEMA, payload, checksum: await checksum(payload) };
}
export async function importCard(obj) {
  if (!exactKeys(obj, ["schema","payload","checksum"]) || obj.schema !== EXPORT_SCHEMA ||
      typeof obj.checksum !== "string" || !/^[0-9a-f]{64}$/.test(obj.checksum) ||
      JSON.stringify(obj).length > 64000) throw new Error("This is not a First Circle export.");
  validateCard(obj.payload);
  if (await checksum(obj.payload) !== obj.checksum) throw new Error("Card content changed after export.");
  return obj.payload;
}

export function shareText(card) {
  validateCard(card);
  const labels = { need: "I NEED", offer: "I CAN OFFER", play: "LET'S PLAY" };
  return [labels[card.direction] + ": " + card.message,
    "One possible next step: " + card.nextStep,
    ...(card.schema === CARD_SCHEMA_V1 ? ["\nPREPARED WORK · " + card.work.status, card.work.title, card.work.body] : []),
    card.schema === CARD_SCHEMA ? "FIRST CIRCLE 001 · unsigned personal draft · not a verified request" : "FIRST CIRCLE · unsigned local material · not a verified outcome or public request",
    "Card ID: " + card.id].join("\n");
}
