import {
  startLab, availableCredits, phase, boost, shiftScout, poke,
  addOffer, options, selectOffer, reopen, confirm, cancel, reset
} from "./model.mjs";

const KEY = "webz/auction-credit-lab/v0";
const $ = id => document.getElementById(id);
let lab = null;
const message = (text, error = false) => { $("status").textContent = text; $("status").dataset.error = String(error); };
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (data && data.schema === "webz/auction-credit-lab/v0" && data.mode === "DEMO_ONLY"
        && data.walletCredits === 60 && Array.isArray(data.wants) && data.wants.length === 1
        && data.wants[0]?.id === "demo-drill" && Array.isArray(data.wants[0]?.offers)
        && Array.isArray(data.events)) return data;
  } catch { /* no claim of persistent storage */ }
  return startLab();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(lab)); }
  catch { message("Browser storage is unavailable. This is an unsaved temporary rehearsal.", true); }
}
const txt = (parent, tag, value, cls) => {
  const e = document.createElement(tag); e.textContent = value;
  if (cls) e.className = cls;
  parent.append(e); return e;
};
function button(parent, label, cb, cls, disabled = false) {
  const b = document.createElement("button"); b.type = "button"; b.textContent = label;
  if (cls) b.className = cls; b.disabled = disabled;
  parent.append(b); b.addEventListener("click", cb); return b;
}
function act(op, success) {
  try { lab = op(lab); persist(); render(); message(success); }
  catch (e) { message(e.message || "That action is unavailable.", true); }
}
function render() {
  const w = lab.wants[0], state = phase(w), remaining = availableCredits(lab);
  const allocated = ["OPEN", "SELECTED"].includes(w.status) ? w.budget : 0;
  $("total").textContent = lab.walletCredits + " C";
  $("available").textContent = remaining + " C";
  $("on-want").textContent = allocated + " C";
  $("spent").textContent = w.spentCredits + " C";
  $("cap").textContent = w.budget + " C";
  $("supplier-cap").textContent = (w.budget - w.scoutCredits) + " C";
  $("scout").value = String(w.scoutCredits);
  $("scout").disabled = state !== "OPEN";
  $("boost").disabled = state !== "OPEN" || remaining < 5;
  $("poke").disabled = state !== "OPEN";
  $("offer-form").querySelectorAll("input,select,button").forEach(el => { el.disabled = state !== "OPEN"; });
  $("example").disabled = state !== "OPEN" || w.offers.length > 10;
  $("cancel").disabled = !["OPEN", "SELECTED"].includes(w.status);
  $("poke-count").textContent = w.pokes + " curious pokes in this browser. No exclusive reservation.";
  $("phase").textContent = state + " · LOCAL SIMULATION";
  $("ends").textContent = new Date(w.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const offers = options(lab, w.id);
  $("offer-count").textContent = String(offers.length);
  $("no-offers").hidden = offers.length !== 0;
  const bestPrice = Math.min(...offers.filter(x => x.eligible).map(x => x.quote), Infinity);
  const quickest = Math.min(...offers.filter(x => x.eligible).map(x => x.etaMinutes), Infinity);
  const root = $("offers"); root.replaceChildren();
  for (const offer of offers) {
    const card = txt(root, "article", "", "card offer-card"); card.setAttribute("role","listitem");
    if (!offer.eligible) card.dataset.ineligible = "true";
    txt(card, "div", "FICTIONAL / UNVERIFIED", "meta");
    txt(card, "h3", offer.name);
    txt(card, "div", offer.quote + " C", "price");
    txt(card, "p", "Offer amount · " + offer.etaMinutes + " minutes to supply");
    txt(card, "p", "+ " + w.scoutCredits + " C possible scout share · " + offer.remaining + " C unused if confirmed");
    const labels = txt(card,"div","","labels");
    if (offer.eligible && offer.quote === bestPrice) txt(labels,"span","LOWEST QUOTE","highlight");
    if (offer.eligible && offer.etaMinutes === quickest) txt(labels,"span","FASTEST ARRIVAL","highlight");
    if (!offer.eligible) txt(labels,"span","OVER CAP / DEADLINE");
    if (offer.selected) txt(labels,"span","BUYER SELECTED · DEMO");
    const actions = txt(card,"div","","actions");
    if (state === "OPEN") button(actions,"Buyer chooses this offer",() => act(
      x => selectOffer(x,w.id,offer.id),"Fictional buyer selected a proposal; no transaction, reserve or money was secured."),
      "secondary",!offer.eligible);
  }
  $("selected-panel").hidden = w.status !== "SELECTED";
  if (w.status === "SELECTED") {
    const chosen = offers.find(o => o.id === w.selectedOfferId);
    $("selected-note").textContent = chosen
      ? chosen.name + " quoted " + chosen.quote + " C, with " + w.scoutCredits + " C potentially for the scout. No actual buyer acceptance or verified item exists."
      : "Selection needs review.";
  }
  $("confirm").disabled = state !== "SELECTED";
  $("reopen").disabled = state !== "SELECTED";
  const events = $("events"); events.replaceChildren();
  for (const event of [...lab.events].reverse()) {
    const row = txt(events,"div","","event");
    txt(row,"code",event.event);
    txt(row,"span",event.note || "Purely local demonstration.");
  }
}
$("boost").addEventListener("click",() => act(l => boost(l,"demo-drill",5),"Five more imaginary credits allocated to the same want. No buyer charged."));
$("poke").addEventListener("click",() => act(l => poke(l,"demo-drill"),"POKE recorded as possibility, not possession or a claim."));
$("scout").addEventListener("change", ev => act(l => shiftScout(l,"demo-drill",ev.target.value),"Scouting share changed inside the same budget; existing quotes are rechecked."));
$("offer-form").addEventListener("submit", ev => {
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(ev.currentTarget));
  act(l => addOffer(l,"demo-drill",data),"Fictional offer added; buyer still has to choose.");
});
$("example").addEventListener("click",() => {
  act(l => {
    let x = addOffer(l,"demo-drill",{name:"Quick garage find",quote:18,etaMinutes:10});
    x = addOffer(x,"demo-drill",{name:"Slow but cheaper",quote:14,etaMinutes:90});
    return x;
  },"Two fictional competing offers added. Compare cheapest and fastest.");
});
$("reopen").addEventListener("click",() => act(l => reopen(l,"demo-drill"),"Buyer selection reversed. No refund needed; no funds existed."));
$("confirm").addEventListener("click",() => act(l => confirm(l,"demo-drill"),"FICTIONAL CONFIRMATION. Imaginary credits burned; no person received money."));
$("cancel").addEventListener("click",() => act(l => cancel(l,"demo-drill"),"Fictional want cancelled; unused credits returned inside the simulation."));
$("reset").addEventListener("click",() => act(l => reset(l),"New fictional experiment started. No records of a real transaction were created."));
lab=load(); render();
