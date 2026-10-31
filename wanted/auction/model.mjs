// WANTED-002 / AUCTION CREDITS. All credit units are fictional, non-transferable, non-redeemable.
// No connected buyer, funds, promise to pay, payment authorization, or real reservation.
export const DEMO_CREDITS = 60;
const nowTime = () => Date.now();

export function startLab(now = nowTime()) {
  return {
    schema: "webz/auction-credit-lab/v0", mode: "DEMO_ONLY",
    walletCredits: DEMO_CREDITS,
    wants: [{ id: "demo-drill", title: "Working cordless drill + battery",
      specification: "Any brand; working battery and charger. FICTIONAL BUYER.",
      budget: 20, scoutCredits: 2, expiresAt: now + 120 * 60000,
      status: "OPEN", offers: [], selectedOfferId: null, pokes: 0, spentCredits: 0 }],
    events: [{ at: now, event: "DEMO_INITIALIZED", note: "No money. No actual buyers." }]
  };
}

function requireLab(lab) {
  if (!lab || lab.schema !== "webz/auction-credit-lab/v0" || lab.mode !== "DEMO_ONLY")
    throw Error("This action requires the explicitly fictional auction-credit lab.");
}

function requireWhole(n, min, max, label) {
  const num = Number(n);
  if (!Number.isSafeInteger(num) || num < min || num > max) throw Error(label + " must be an integer between " + min + " and " + max + " demo credits.");
  return num;
}
function lookup(lab, wantId) {
  const want = lab.wants.find(w => w.id === wantId);
  if (!want) throw Error("Unknown fictional want.");
  return want;
}
export function availableCredits(lab) {
  requireLab(lab);
  const used = lab.wants.reduce((sum, w) => sum + (w.status === "CANCELLED" ? 0 : w.status === "DEMO_CONFIRMED" ? w.spentCredits : w.budget), 0);
  return lab.walletCredits - used;
}
export function phase(want, now = nowTime()) {
  return ["OPEN", "SELECTED"].includes(want.status) && now >= want.expiresAt ? "EXPIRED" : want.status;
}
function updated(lab, wantId, nextWant, event, at, note) {
  return { ...lab,
    wants: lab.wants.map(w => w.id === wantId ? nextWant : w),
    events: [...lab.events, { at, event, wantId, note }].slice(-60) };
}
function requireOpen(want, now) {
  if (phase(want, now) !== "OPEN") throw Error("This fictional bid window is not open.");
}
export function boost(lab, wantId, added, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId); requireOpen(want, now);
  const amount = requireWhole(added, 1, 20, "Boost");
  if (amount > availableCredits(lab)) throw Error("Not enough unallocated play credits.");
  return updated(lab, wantId, { ...want, budget: want.budget + amount }, "BUDGET_BOOSTED", now, "+" + amount + " demo credits allocated; not funded.");
}
export function shiftScout(lab, wantId, credits, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId); requireOpen(want, now);
  const amount = requireWhole(credits, 0, want.budget - 1, "Scout share");
  return updated(lab, wantId, { ...want, scoutCredits: amount }, "SCOUT_SHARE_CHANGED", now, "Share allocated inside same fictional buyer cap.");
}
export function poke(lab, wantId, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId); requireOpen(want, now);
  return updated(lab, wantId, { ...want, pokes: want.pokes + 1 }, "POKE", now, "Possibility only; no reservation or payment.");
}
export function addOffer(lab, wantId, data, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId); requireOpen(want, now);
  const quote = requireWhole(data.quote, 1, want.budget, "Seller quote");
  const eta = requireWhole(data.etaMinutes, 1, 240, "ETA minutes");
  const name = String(data.name ?? "").trim().slice(0, 60);
  if (name.length < 3) throw Error("Label the fictional seller's offer.");
  if (want.offers.length >= 12) throw Error("Twelve synthetic offers are enough for this experiment.");
  if (quote + want.scoutCredits > want.budget) throw Error("Seller quote plus scout share exceeds the buyer's fictional cap.");
  if (now + eta * 60000 > want.expiresAt) throw Error("Seller ETA falls after the fictional buyer's deadline.");
  const offer = { id: "offer-" + (want.offers.length + 1), name, quote, etaMinutes: eta, submittedAt: now, verified: false, synthetic: true };
  return updated(lab, wantId, { ...want, offers: [...want.offers, offer] }, "OFFER_PROPOSED", now, "Unverified simulated offer; " + quote + " credit quote.");
}
export function options(lab, wantId, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId);
  return want.offers.map(o => ({ ...o,
    withinBudget: o.quote + want.scoutCredits <= want.budget,
    withinDeadline: o.submittedAt + o.etaMinutes * 60000 <= want.expiresAt,
    eligible: o.quote + want.scoutCredits <= want.budget && o.submittedAt + o.etaMinutes * 60000 <= want.expiresAt,
    selected: o.id === want.selectedOfferId,
    remaining: want.budget - o.quote - want.scoutCredits
  }));
}
export function selectOffer(lab, wantId, offerId, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId); requireOpen(want, now);
  const offer = options(lab, wantId, now).find(o => o.id === offerId);
  if (!offer || !offer.eligible) throw Error("The proposed offer no longer satisfies budget and deadline.");
  return updated(lab, wantId, { ...want, status: "SELECTED", selectedOfferId: offerId }, "DEMO_OFFER_SELECTED", now, "Selected in local rehearsal only; no money or real hold.");
}
export function reopen(lab, wantId, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId);
  if (want.status !== "SELECTED") throw Error("No fictional offer is currently selected.");
  if (now >= want.expiresAt) throw Error("The bid window has expired.");
  return updated(lab, wantId, { ...want, status: "OPEN", selectedOfferId: null }, "DEMO_REOPENED", now, "Selection reversed; no cash was handled.");
}
export function confirm(lab, wantId, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId);
  if (want.status !== "SELECTED") throw Error("Select an eligible fictional offer first.");
  if (now >= want.expiresAt) throw Error("Demo deadline expired before confirmation.");
  const offer = options(lab, wantId, now).find(o => o.id === want.selectedOfferId);
  if (!offer || !offer.eligible) throw Error("Selected offer no longer meets the cap.");
  const spentCredits = offer.quote + want.scoutCredits;
  return updated(lab, wantId, { ...want, status: "DEMO_CONFIRMED", spentCredits },
    "FICTIONAL_FULFILLMENT_REHEARSED", now,
    "Burned " + spentCredits + " imaginary credits. Neither seller nor scout was paid. Remaining credits returned to fictional wallet.");
}
export function cancel(lab, wantId, now = nowTime()) {
  requireLab(lab); const want = lookup(lab, wantId);
  if (!["OPEN", "SELECTED"].includes(want.status)) throw Error("Cannot cancel a completed or cancelled demonstration.");
  return updated(lab, wantId, { ...want, status: "CANCELLED", selectedOfferId: null }, "DEMO_CANCELLED", now, "Fictional allocation returned. No refund exists because no payment existed.");
}
export function reset(lab, now = nowTime()) { requireLab(lab); return startLab(now); }
