// THE MISSING INGREDIENT · local-first fictional field prototype
// Contract influences: Nourish (explicit have/missing/unknown), Jubilee Campfire
// (offer/accept/report/witness), Full Measure (no self-awarded deeds), LemonPRESS
// (edition/return), reLATTE (distinct attributable stages).
// This file does not communicate with any donor application or external service.

export const RECIPES = Object.freeze([
  { id: "soup", title: "The Good Neighbor Soup", subtitle: "A pot for whoever finds their way to the table", baseServes: 2, steps: ["Warm lentils and broth together until tender.", "Add diced carrots and tomatoes; simmer until the vegetables are cooked.", "Season to taste. Serve hot."], items: [
    { id: "lentils", label: "Dry lentils", qty: 1, unit: "cup" },
    { id: "tomatoes", label: "Canned tomatoes", qty: 1, unit: "can" },
    { id: "carrots", label: "Carrots", qty: 2, unit: "each" },
    { id: "broth", label: "Broth or water", qty: 3, unit: "cup" },
  ] },
  { id: "rice", title: "The Porch-Pot Rice", subtitle: "A plain, adaptable one-pot supper", baseServes: 2, steps: ["Cook rice according to its packaging.", "Warm the beans and tomatoes together in a separate pan.", "Add diced onion if available and cook through. Combine and season to taste."], items: [
    { id: "rice", label: "Dry rice", qty: 1, unit: "cup" },
    { id: "beans", label: "Canned beans", qty: 1, unit: "can" },
    { id: "tomatoes", label: "Canned tomatoes", qty: 1, unit: "can" },
    { id: "onion", label: "Onion", qty: 1, unit: "each" },
  ] },
  { id: "oats", title: "Apple Morning Oats", subtitle: "A warm breakfast with ordinary ingredients", baseServes: 2, steps: ["Cook the oats in water according to the package.", "Add chopped apple and cook until softened.", "Stir in a little cinnamon to taste."], items: [
    { id: "oats", label: "Rolled oats", qty: 1, unit: "cup" },
    { id: "apples", label: "Apples", qty: 2, unit: "each" },
    { id: "cinnamon", label: "Ground cinnamon", qty: 1, unit: "tsp" },
  ] }
]);

// Demonstration offers are entirely invented. They imply no stock, producer,
// reservation, food-safety approval or real willingness to participate.
export const OFFERS = Object.freeze([
  { id: "garden-carrots", ingredient: "carrots", qty: 4, unit: "each", by: "Fictional back-yard gardener", note: "Hypothetical harvest, pickup unarranged." },
  { id: "basket-apples", ingredient: "apples", qty: 6, unit: "each", by: "Fictional orchard neighbor", note: "Demonstration only; season and condition unknown." },
  { id: "shelf-beans", ingredient: "beans", qty: 3, unit: "can", by: "Fictional pantry shelf", note: "Not an actual donation offer." },
  { id: "rice-cup", ingredient: "rice", qty: 2, unit: "cup", by: "Fictional shared basket", note: "Quantity is an example, not inventory." },
  { id: "one-onion", ingredient: "onion", qty: 1, unit: "each", by: "Fictional kitchen neighbor", note: "No person has agreed to help." },
  { id: "tiny-carrots", ingredient: "carrots", qty: 1, unit: "each", by: "Fictional partial basket", note: "Insufficient for the selected recipe; demonstrates honest shortage." }
]);

const STATUSES = new Set(["have", "missing", "unknown"]);
const PHASES = new Set(["draft", "proposed", "accepted", "reported", "confirmed", "declined"]);
const allowedServes = [2, 4, 6];
export const recipeById = id => RECIPES.find(r => r.id === id) || RECIPES[0];
const shallowCopy = value => JSON.parse(JSON.stringify(value));
const safeText = value => typeof value === "string" ? value.slice(0, 500) : "";
const validTime = value => typeof value === "string" && /^20\d\d-/.test(value);
const stamp = () => new Date().toISOString();

export function freshState(id = "soup") {
  const recipe = recipeById(id);
  const pantry = Object.fromEntries(recipe.items.map((item, n) =>
    [item.id, n === 0 || n === 1 ? "have" : n === 2 ? "missing" : "unknown"]));
  return { version: 1, recipeId: recipe.id, serves: 2, pantry,
    focus: recipe.items[2]?.id || recipe.items[0].id,
    phase: "draft", offerId: null, issue: 0, events: [], margin: "" };
}

export function normalizeState(raw) {
  if (!raw || typeof raw !== "object") return freshState();
  const state = freshState(raw.recipeId);
  state.serves = allowedServes.includes(raw.serves) ? raw.serves : 2;
  state.issue = Number.isInteger(raw.issue) && raw.issue >= 0 && raw.issue <= 999 ? raw.issue : 0;
  const recipe = recipeById(state.recipeId);
  for (const item of recipe.items) {
    if (STATUSES.has(raw.pantry?.[item.id])) state.pantry[item.id] = raw.pantry[item.id];
  }
  if (recipe.items.some(i => i.id === raw.focus)) state.focus = raw.focus;
  state.phase = PHASES.has(raw.phase) ? raw.phase : "draft";
  state.offerId = OFFERS.some(o => o.id === raw.offerId) ? raw.offerId : null;
  state.margin = safeText(raw.margin);
  // Imported local browser snapshots are not signed or independently verified.
  state.events = Array.isArray(raw.events) ? raw.events.slice(-25).filter(e =>
    e && typeof e === "object" && typeof e.kind === "string" && validTime(e.at)
  ).map(e => ({ kind: safeText(e.kind), at: e.at, detail: safeText(e.detail) })) : [];
  return state;
}

export function requirements(stateLike) {
  const state = normalizeState(stateLike), recipe = recipeById(state.recipeId);
  return recipe.items.map(i => ({
    ...i, qty: i.qty * state.serves / recipe.baseServes,
    status: state.pantry[i.id] || "unknown"
  }));
}

export function candidateOffers(stateLike) {
  const state = normalizeState(stateLike);
  const required = requirements(state).find(i => i.id === state.focus);
  if (!required || required.status !== "missing") return [];
  return OFFERS.filter(o => o.ingredient === required.id).map(o => ({
    ...o, required: required.qty,
    adequate: o.unit === required.unit && o.qty >= required.qty,
    explanation: o.unit !== required.unit ? "Unit cannot be compared."
      : o.qty < required.qty ? `Short by ${formatQty(required.qty - o.qty)} ${o.unit}.`
      : `Listed ${formatQty(o.qty)} ${o.unit}; example need ${formatQty(required.qty)} ${required.unit}.`
  }));
}

export const formatQty = x => Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100);

function record(next, kind, detail) {
  next.events.push({ kind, detail, at: stamp() });
  next.events = next.events.slice(-25);
}
function clearProposal(next) {
  next.phase = "draft";
  next.offerId = null;
  next.events = [];
}
export function transition(stateLike, action, payload = {}) {
  const state = normalizeState(stateLike), next = shallowCopy(state);
  const actionName = typeof action === "string" ? action : "";
  if (actionName === "recipe") return freshState(payload.id);
  if (actionName === "serves" && allowedServes.includes(payload.value)) {
    next.serves = payload.value; clearProposal(next); return next;
  }
  if (actionName === "pantry") {
    if (!requirements(next).some(i => i.id === payload.id) || !STATUSES.has(payload.status)) throw Error("Invalid pantry update.");
    next.pantry[payload.id] = payload.status; clearProposal(next); return next;
  }
  if (actionName === "focus") {
    if (!requirements(next).some(i => i.id === payload.id)) throw Error("Ingredient is not in recipe.");
    next.focus = payload.id; clearProposal(next); return next;
  }
  if (actionName === "margin") { next.margin = safeText(payload.text); return next; }
  if (actionName === "reset") return freshState(state.recipeId);
  if (actionName === "next") {
    next.issue = Math.min(999, next.issue + 1);
    clearProposal(next);
    next.margin = "";
    return next;
  }
  if (actionName === "propose") {
    if (next.phase !== "draft") throw Error("Finish or restart the current handoff first.");
    const offer = candidateOffers(next).find(o => o.id === payload.offerId && o.adequate);
    if (!offer) throw Error("Only an explicitly missing, adequately quantified example can be proposed.");
    next.offerId = offer.id; next.phase = "proposed";
    record(next, "PROPOSED", `Candidate ${offer.id} for ${next.focus}; no helper committed.`);
    return next;
  }
  if (actionName === "accept" && next.phase === "proposed") {
    next.phase = "accepted";
    record(next, "ACCEPTED", "Fictional helper role explicitly accepts this one example.");
    return next;
  }
  if (actionName === "report" && next.phase === "accepted") {
    next.phase = "reported";
    record(next, "REPORTED", "Fictional helper reports a handoff; outcome not yet confirmed.");
    return next;
  }
  if (actionName === "confirm" && next.phase === "reported") {
    next.phase = "confirmed";
    record(next, "CONFIRMED", "Fictional recipient role confirms in this single-browser rehearsal.");
    return next;
  }
  if (actionName === "decline" && ["proposed", "accepted", "reported"].includes(next.phase)) {
    next.phase = "declined"; record(next, "DECLINED", "Handoff stopped without a completed act."); return next;
  }
  throw Error("That action is not allowed from the current state.");
}

// A portable *fiction-only* edition. Deliberately excludes any typed private margin,
// contact information, browser id, IP address, device key or real-world identity.
export function editionData(stateLike) {
  const state = normalizeState(stateLike), recipe = recipeById(state.recipeId);
  return {
    schema: "lemonpress/missing-ingredient-fiction/v1",
    status: "fictional-rehearsal-not-proof",
    issue: state.issue, recipe: { id: recipe.id, title: recipe.title, serves: state.serves },
    ingredients: requirements(state).map(({id, label, qty, unit, status}) => ({id, label, qty, unit, status})),
    handoff: { phase: state.phase, focus: state.focus, offerId: state.offerId },
    events: state.events.map(({kind, at, detail}) => ({kind, at, detail})),
    attestations: "Unverified, one browser only; roles simulated; no real agreements.",
    sourceDoors: ["Nourish-Kids", "Jubilee-Campfire", "Full Measure", "GrO", "LemonPRESS", "Static Live / Kinship", "reLATTE", "JAR;VIS"]
  };
}
export function radioCopy(stateLike) {
  const state = normalizeState(stateLike), recipe = recipeById(state.recipeId);
  const missing = requirements(state).filter(i => i.status === "missing");
  const phrase = missing.length
    ? missing.map(i => `${formatQty(i.qty)} ${i.unit} of ${i.label.toLowerCase()}`).join(", ")
    : "no declared missing ingredients";
  return `[DEMO STATION ID — NOT FOR BROADCAST]\nThis is The Missing Ingredient, Issue ${String(state.issue).padStart(3, "0")}. Tonight's imagined table is making ${recipe.title.toLowerCase()} for ${state.serves}. The rehearsal lists ${phrase}. An offer isn't a promise, and a report isn't confirmation. What might your community cook up together? This has been a fictional LemonPRESS field signal.\n[END DEMO]`;
}
