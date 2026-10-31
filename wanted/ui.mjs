import { createWant, fictionalWant, currentStatus, transition, exportWantText, formatDollars } from "./model.mjs";

const STORAGE_KEY = "webz/wanted-device-local/v0";
const $ = id => document.getElementById(id);
let wants = [];
function id() { return globalThis.crypto?.randomUUID?.() || "local-" + Date.now() + "-" + Math.random().toString(36).slice(2); }
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(data)) wants = data.filter(x => x && x.schema === "webz/wanted-local/v0" && x.id && Array.isArray(x.history)).slice(0, 30);
  } catch { wants = []; message("Saved browser data could not be loaded.", true); }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wants.slice(0, 30))); return true; }
  catch { message("This browser blocked local storage. Cards will disappear on reload.", true); return false; }
}
function message(s, error = false) { $("status").textContent = s; $("status").dataset.error = String(error); }
function el(tag, parent, value, className) {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  if (parent) parent.append(node);
  return node;
}
function button(parent, label, onClick, quiet = false) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = label;
  if (quiet) b.className = "quiet";
  b.addEventListener("click", onClick); parent.append(b);
}
function mutate(want, action, actor) {
  try {
    const updated = transition(want, action, { actor });
    wants = wants.map(w => w.id === want.id ? updated : w);
    save(); render();
    const names = { HOLD: "Fictional hold placed for 10 minutes on this device. No real buyer has been matched.",
      REPORT: "Fictional item reported. A buyer confirmation is still required.",
      ACCEPT: "Buyer acceptance rehearsed. No money was transferred.",
      REFUSE: "Buyer refused in this rehearsal; the fictional request reopened.",
      RELEASE: "Fictional hold released.",
      CANCEL: "Local buyer intent cancelled. Nothing was ever published." };
    message(names[action] || "Local rehearsal updated.");
  } catch (err) { message(err.message || "Unable to complete the local rehearsal.", true); }
}
async function copyWant(want) {
  const content = exportWantText(want);
  try {
    if (!navigator.clipboard?.writeText) throw Error("Clipboard not available");
    await navigator.clipboard.writeText(content);
    message("Unverified buyer-intent text copied. You choose whether and where to share it.");
    $("copybox").hidden = true;
  } catch {
    $("copybox").hidden = false; $("copytext").value = content;
    $("copytext").focus(); $("copytext").select();
    message("Automatic copying unavailable. Select and copy the text shown below.");
  }
}
function renderCard(want, root) {
  const state = currentStatus(want);
  const card = el("article", root, undefined, "card");
  card.setAttribute("role", "listitem");
  el("div", card, want.synthetic ? "FICTIONAL / NO REAL BUYER" : "YOUR DEVICE / NOT PUBLISHED", "meta");
  el("div", card, formatDollars(want.amountCents), "price");
  el("h3", card, want.item);
  if (want.detail) el("p", card, want.detail);
  el("p", card, want.region + " · expires " + new Date(want.expiresAt).toLocaleString());
  const stateLine = el("div", card, state + " · " + (want.synthetic ? "SIMULATED FUNDS ONLY" : "UNFUNDED — NO SALE LOCK"), "state");
  stateLine.dataset.state = state;
  if (state === "HELD") el("p", card, "Local fictional hold ends " + new Date(want.holdUntil).toLocaleTimeString());
  if (state === "REPORTED") el("p", card, "Finder report made. In a real exchange, the buyer must inspect separately.");
  if (state === "ACCEPTED") el("p", card, "Accepted in a rehearsal. Payment status: NOT CONNECTED.");
  const actions = el("div", card, undefined, "actions");
  if (want.synthetic) {
    if (state === "OPEN") button(actions, "I have it · demo", () => mutate(want, "HOLD", "FINDER"));
    if (state === "HELD") {
      button(actions, "Report found · demo", () => mutate(want, "REPORT", "FINDER"));
      button(actions, "Release hold", () => mutate(want, "RELEASE", "FINDER"), true);
    }
    if (state === "REPORTED") {
      button(actions, "Buyer accepts · demo", () => mutate(want, "ACCEPT", "BUYER"));
      button(actions, "Buyer refuses", () => mutate(want, "REFUSE", "BUYER"), true);
    }
  } else {
    if (state === "OPEN" || state === "HELD") {
      button(actions, "Copy buyer-intent text", () => copyWant(want));
      button(actions, "Cancel local draft", () => mutate(want, "CANCEL", "BUYER"), true);
    }
    if (state === "EXPIRED") button(actions, "Copy expired text", () => copyWant(want), true);
  }
}
function render() {
  const root = $("cards");
  root.replaceChildren();
  for (const want of wants) renderCard(want, root);
  $("count").textContent = String(wants.length);
  $("empty").hidden = wants.length !== 0;
}
$("make-want").addEventListener("submit", ev => {
  ev.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(ev.currentTarget));
    const want = createWant(data, { id: id() });
    wants.unshift(want);
    wants = wants.slice(0, 30);
    save(); render(); ev.currentTarget.reset();
    message("Buyer intent saved on this device only. No buyer funds verified, no listing published.");
    $("board").scrollIntoView({ behavior: "smooth" });
  } catch (err) { message(err.message || "Could not make a buyer intent.", true); }
});
$("add-fictional").addEventListener("click", () => {
  wants.unshift(fictionalWant({ id: id() }));
  wants = wants.slice(0, 30);
  save(); render();
  message("Fictional $20 request loaded. Tap “I have it” to rehearse the claim.");
  $("board").scrollIntoView({ behavior: "smooth" });
});
$("clear-fictional").addEventListener("click", () => {
  wants = wants.filter(w => !w.synthetic);
  save(); render();
  message("Fictional cards cleared from this browser.");
});
load(); render();
