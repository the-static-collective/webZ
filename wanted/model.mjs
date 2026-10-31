// WANTED-001. Pure, device-local rehearsal; no shared buyer, payment or sale authority.
const MAX_HORIZON_MS = 30 * 24 * 60 * 60 * 1000;
const HOLD_MS = 10 * 60 * 1000;
const take = (s, max) => String(s ?? "").trim().slice(0, max);

export function createWant(input, { now = Date.now(), id } = {}) {
  const item = take(input.item, 100);
  const detail = take(input.detail, 350);
  const region = take(input.region, 90);
  const amount = Number(input.amount);
  const minutes = Number(input.minutes);
  if (item.length < 3 || region.length < 3) throw Error("Give the item and a general region.");
  if (!Number.isFinite(amount) || amount < 1 || amount > 10000 || Math.abs(Math.round(amount * 100) - amount * 100) > 0.00000001) {
    throw Error("Use a dollar amount from $1 to $10,000 (at most two decimals).");
  }
  if (!Number.isInteger(minutes) || minutes < 15 || minutes * 60000 > MAX_HORIZON_MS) {
    throw Error("The requested window must be between 15 minutes and 30 days.");
  }
  if (!id || typeof id !== "string") throw Error("A local request ID is required.");
  return {
    schema: "webz/wanted-local/v0", id, item, detail, region,
    amountCents: Math.round(amount * 100), openedAt: now,
    expiresAt: now + minutes * 60000, status: "OPEN",
    funding: "UNFUNDED", visibility: "THIS_DEVICE_ONLY", synthetic: false,
    finder: null, holdUntil: null, history: [{ action: "DRAFT_CREATED", at: now }]
  };
}

export function fictionalWant({ now = Date.now(), id = "fictional-want-001" } = {}) {
  return {
    ...createWant({
      item: "18V cordless drill, working battery", detail: "Any brand; bring charger. Fictional example — no real buyer.",
      region: "Southern Minnesota · fictional", amount: 20, minutes: 120
    }, { now, id }),
    funding: "SIMULATED_ONLY", synthetic: true,
    visibility: "FICTIONAL_LOCAL_REHEARSAL",
    history: [{ action: "SYNTHETIC_OPEN", at: now }]
  };
}

export function currentStatus(want, now = Date.now()) {
  if (["ACCEPTED", "CANCELLED"].includes(want.status)) return want.status;
  if (now >= want.expiresAt) return "EXPIRED";
  if (want.status === "HELD" && now >= want.holdUntil) return "OPEN";
  return want.status;
}

function append(want, changes, action, now) {
  return { ...want, ...changes, history: [...want.history, { action, at: now }] };
}

export function transition(want, action, { now = Date.now(), actor = "FINDER" } = {}) {
  if (!want || want.schema !== "webz/wanted-local/v0") throw Error("Unrecognized local request.");
  const state = currentStatus(want, now);
  if (state === "EXPIRED") throw Error("This request expired.");
  if (action === "CANCEL") {
    if (actor !== "BUYER" || !["OPEN", "HELD"].includes(state)) throw Error("Only the buyer can cancel an open request.");
    return append(want, { status: "CANCELLED", finder: null, holdUntil: null }, action, now);
  }
  if (action === "HOLD") {
    if (actor !== "FINDER" || state !== "OPEN") throw Error("This request is not available to claim.");
    if (!want.synthetic || want.funding !== "SIMULATED_ONLY") throw Error("No verified buyer funds. A real sale cannot be secured here.");
    return append(want, { status: "HELD", finder: "LOCAL_DEMO_FINDER", holdUntil: Math.min(now + HOLD_MS, want.expiresAt) }, action, now);
  }
  if (action === "RELEASE") {
    if (actor !== "FINDER" || state !== "HELD") throw Error("Only the demo finder can release an active hold.");
    return append(want, { status: "OPEN", finder: null, holdUntil: null }, action, now);
  }
  if (action === "REPORT") {
    if (actor !== "FINDER" || state !== "HELD") throw Error("An active hold is required to report an item.");
    return append(want, { status: "REPORTED" }, action, now);
  }
  if (action === "ACCEPT") {
    if (actor !== "BUYER" || state !== "REPORTED") throw Error("Only the demo buyer can accept a reported item.");
    return append(want, { status: "ACCEPTED" }, action, now);
  }
  if (action === "REFUSE") {
    if (actor !== "BUYER" || state !== "REPORTED") throw Error("Only the demo buyer can refuse a reported item.");
    return append(want, { status: "OPEN", finder: null, holdUntil: null }, action, now);
  }
  throw Error("Unknown action.");
}

export function formatDollars(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function exportWantText(want) {
  return [
    "WANTED / BUYER INTENT — UNFUNDED, NOT A SECURED SALE",
    want.item, want.detail, formatDollars(want.amountCents),
    "General area: " + want.region, "Expires: " + new Date(want.expiresAt).toLocaleString(),
    "This is a buyer's unverified expression of interest, not proof that funds are available.",
    "No payment or fulfillment can be completed using this card alone."
  ].filter(Boolean).join("\n");
}
