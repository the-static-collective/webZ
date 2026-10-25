import { createCard, advance, makePacket, validPacket } from "./src/field-kit.mjs";

const form = document.querySelector("#fieldForm");
const kind = document.querySelector("#kind");
const title = document.querySelector("#title");
const detail = document.querySelector("#detail");
const stage = document.querySelector("#stage");
const view = document.querySelector("#cardView");
const feedback = document.querySelector("#feedback");
const hold = document.querySelector("#hold");
const prepare = document.querySelector("#prepare");
const exportBtn = document.querySelector("#export");
const clearBtn = document.querySelector("#clear");
const fiction = document.querySelector("#fiction");
let card = null; // Deliberately session-memory only: no persistence, accounts or server requests.

function now() { return new Date().toISOString(); }
function identifier() {
  if (globalThis.crypto && crypto.randomUUID) return "msyou-" + crypto.randomUUID();
  return "msyou-demo-" + Date.now().toString(36) + "-" + Math.floor(Math.random()*1e6).toString(36);
}
function render(message = "") {
  stage.textContent = card ? card.stage.replaceAll("_", " ") : "NOT STARTED";
  view.textContent = card
    ? card.kind + " / " + card.title + "\n\n" + card.detail + "\n\nContext: " + card.context +
      "\nLocal events: " + card.events.length + "\nSent: NO · Published: NO · Identity verified: NO"
    : "Your card will appear here. Nothing has been sent.";
  hold.disabled = !card || card.stage !== "DRAFT";
  prepare.disabled = !card || card.stage !== "LOCAL_HOLD";
  exportBtn.disabled = !card || card.stage !== "HANDOFF_PREPARED";
  feedback.textContent = message || "All stages are local and unverified. A real receiver must decide separately.";
}
form.addEventListener("submit", event => {
  event.preventDefault();
  try {
    card = createCard({ id: identifier(), kind: kind.value, title: title.value,
      detail: detail.value, context: "independent community pilot", at: now() });
    render("Local DRAFT created. Nothing stored remotely. Choose HOLD to proceed.");
  } catch (error) { render("Not created: " + error.message); }
});
fiction.addEventListener("click", () => {
  kind.value = "NEED";
  title.value = "A table for surplus vegetables";
  detail.value = "FICTIONAL EXAMPLE. A neighborhood group needs a volunteer to ask producers whether spare seasonal vegetables could reach a community pantry. No producer has agreed and no collection has occurred.";
  title.focus();
  feedback.textContent = "Fictional example loaded. Select Make draft to test the local loop.";
});
hold.addEventListener("click", () => {
  try { card = advance(card, "LOCAL_HOLD", now()); render("Locally held. This does not enroll anyone."); }
  catch (error) { render(error.message); }
});
prepare.addEventListener("click", () => {
  try { card = advance(card, "HANDOFF_PREPARED", now()); render("Handoff prepared. Downloading is optional. No recipient has received it."); }
  catch (error) { render(error.message); }
});
exportBtn.addEventListener("click", () => {
  try {
    const packet = makePacket(card, now());
    if (!validPacket(packet)) throw new Error("Packet failed verification");
    const file = new Blob([JSON.stringify(packet, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url; link.download = "msyou-fictional-or-local-handoff.json";
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    render("JSON exported to your device. NOT_SENT / NOT_RECEIVED / NOT_PUBLISHED.");
  } catch (error) { render("Export failed: " + error.message); }
});
clearBtn.addEventListener("click", () => {
  card = null; form.reset(); render("Working card cleared from this tab. Downloaded files, if any, remain under your control.");
});
render();
