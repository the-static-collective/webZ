// MSyoU Field Kit v0 — local rehearsal only. No crypto-authentication or network effects.
export const CARD_SCHEMA = "msyou.field-card/v0";
export const PACKET_SCHEMA = "msyou.handoff-packet/v0";
export const KINDS = Object.freeze(["NEED", "OFFER", "QUESTION", "BUILD"]);
export const STAGES = Object.freeze(["DRAFT", "LOCAL_HOLD", "HANDOFF_PREPARED"]);
export const LIMITS = Object.freeze({ title: 100, detail: 800, context: 100 });

function plain(value, field, max) {
  if (typeof value !== "string") throw new TypeError(field + " must be text");
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new RangeError(field + " must be 1–" + max + " characters");
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(trimmed)) throw new TypeError(field + " contains control characters");
  return trimmed;
}
function stamp(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new TypeError("Timestamp must be an ISO date string");
  return value;
}
function allowKeys(obj, allowed) {
  return obj && typeof obj === "object" && !Array.isArray(obj) &&
    Object.keys(obj).every(k => allowed.includes(k));
}
export function createCard({ id, kind, title, detail, context = "community pilot", at }) {
  id = plain(id, "id", 100);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new TypeError("ID is not portable");
  if (!KINDS.includes(kind)) throw new TypeError("Unrecognized card kind");
  const time = stamp(at);
  return {
    schema: CARD_SCHEMA,
    id,
    kind,
    title: plain(title, "title", LIMITS.title),
    detail: plain(detail, "detail", LIMITS.detail),
    context: plain(context, "context", LIMITS.context),
    scope: "LOCAL_DEMO_ONLY",
    stage: "DRAFT",
    submitted: false,
    identityVerified: false,
    consentToPublish: false,
    events: [{ stage: "DRAFT", at: time, actor: "LOCAL_UNVERIFIED" }]
  };
}
export function validCard(card) {
  if (!allowKeys(card, ["schema","id","kind","title","detail","context","scope","stage","submitted","identityVerified","consentToPublish","events"])) return false;
  if (card.schema !== CARD_SCHEMA || card.scope !== "LOCAL_DEMO_ONLY" ||
    card.submitted !== false || card.identityVerified !== false ||
    card.consentToPublish !== false || !KINDS.includes(card.kind)) return false;
  if (typeof card.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(card.id)) return false;
  for (const [v,k,max] of [[card.title,"title",LIMITS.title],[card.detail,"detail",LIMITS.detail],[card.context,"context",LIMITS.context]]) {
    try { plain(v,k,max); } catch { return false; }
  }
  if (!Array.isArray(card.events) || card.events.length < 1 || card.events.length > 3 ||
    !STAGES.includes(card.stage) || card.stage !== STAGES[card.events.length - 1]) return false;
  for (let i = 0; i < card.events.length; i++) {
    const e = card.events[i];
    if (!allowKeys(e,["stage","at","actor"]) || e.stage !== STAGES[i] ||
      e.actor !== "LOCAL_UNVERIFIED") return false;
    try { stamp(e.at); } catch { return false; }
  }
  return true;
}
export function advance(card, nextStage, at) {
  if (!validCard(card)) throw new TypeError("Card fails local protocol checks");
  const n = STAGES.indexOf(card.stage);
  if (n >= STAGES.length - 1 || nextStage !== STAGES[n + 1]) {
    throw new Error("A human must take the next permitted local step; no automatic admission");
  }
  return { ...card, stage: nextStage,
    events: [...card.events, { stage: nextStage, at: stamp(at), actor: "LOCAL_UNVERIFIED" }] };
}
export function makePacket(card, at) {
  if (!validCard(card) || card.stage !== "HANDOFF_PREPARED") {
    throw new Error("Prepare and review the card locally before exporting a handoff packet");
  }
  return {
    schema: PACKET_SCHEMA,
    status: "PREPARED_NOT_SENT",
    review: "NOT_RECEIVED",
    publication: "NOT_PUBLISHED",
    proofOfWork: "NONE",
    exportedAt: stamp(at),
    card: structuredClone(card)
  };
}
export function validPacket(packet) {
  return allowKeys(packet,["schema","status","review","publication","proofOfWork","exportedAt","card"]) &&
    packet.schema === PACKET_SCHEMA && packet.status === "PREPARED_NOT_SENT" &&
    packet.review === "NOT_RECEIVED" && packet.publication === "NOT_PUBLISHED" &&
    packet.proofOfWork === "NONE" && typeof packet.exportedAt === "string" &&
    Number.isFinite(Date.parse(packet.exportedAt)) && validCard(packet.card) &&
    packet.card.stage === "HANDOFF_PREPARED";
}
