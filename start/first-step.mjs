// FIRST-INCH-001: deterministic draft, not AI inference or execution.
const nextStep = Object.freeze({
  community: "Ask one willing local steward to review a small, reversible pilot. Confirm a place, a time, and permission before inviting others.",
  creative: "Make one small draft from resources already available, then ask one intended audience member for feedback.",
  other: "Define one observable output you could try in a day. Ask the person whose permission or expertise matters first."
});
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
export function createCard({goal, have = "", needs = "", kind = "other"} = {}) {
  const g = clean(goal);
  if (g.length < 10 || g.length > 600) throw new RangeError("Describe the goal in 10–600 characters.");
  const h = clean(have), n = clean(needs);
  if (h.length > 400 || n.length > 400) throw new RangeError("Keep each optional field under 400 characters.");
  if (!Object.hasOwn(nextStep, kind)) throw new RangeError("Unknown work type.");
  return Object.freeze({
    schema: "abundent/first-inch-draft/v1",
    status: "DRAFT — NOT SENT OR VERIFIED",
    goal: g,
    available: h || "To be confirmed",
    firstNeed: n || "To be identified with a person involved",
    experiment: nextStep[kind],
    nextGate: "Who needs to say yes? Ask explicitly. A draft is not their consent.",
    evidence: "Record what actually happened, who checked it, and what remains unknown."
  });
}
export function cardText(card) {
  if (card?.schema !== "abundent/first-inch-draft/v1") throw new TypeError("Invalid draft.");
  return [
    "ABUNDENT / FIRST WORK CARD",
    card.status,
    "",
    "GOAL: " + card.goal,
    "AVAILABLE: " + card.available,
    "FIRST NEED: " + card.firstNeed,
    "SUGGESTED FIRST EXPERIMENT: " + card.experiment,
    "HUMAN PERMISSION: " + card.nextGate,
    "OBSERVATION: " + card.evidence,
    "",
    "This is a locally prepared suggestion, not an AI response, verified plan, partner commitment or completed action."
  ].join("\n");
}
export function emailDraft(card, recipient = "us@abundent.org") {
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(recipient)) throw new TypeError("Invalid recipient.");
  return "mailto:" + recipient + "?subject=" +
    encodeURIComponent("Abundent / first work card for review") +
    "&body=" + encodeURIComponent(cardText(card));
}
