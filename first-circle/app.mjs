import { createCard, validateCard, recordReturn, proposeMethod,
  exportCard, importCard, shareText } from "./core.mjs";
import { workContext, prepareWork, auditWork } from "./work.mjs";

const $ = id => document.getElementById(id);
const STORE = "abundent-first-circle-001";
const LABELS = { need: "I need something", offer: "I have something", play: "Let's play" };
const QUESTIONS = {
  need: "What is one non-private thing you could use a hand with?",
  offer: "What is something you could offer someone?",
  play: "What's a small experiment you'd like to try?"
};
const EXAMPLES = {
  need: ["Help with a meal", "Advice on fixing something", "One extra volunteer"],
  offer: ["An hour of help", "A useful skill", "A tool I can lend"],
  play: ["A tiny potluck", "A neighborhood music night", "A cleanup game"]
};
const OUTCOME_TEXT = {
  worked: "It worked (self-reported)", "not-yet": "Not yet (self-reported)",
  different: "Something else happened (self-reported)"
};
let card = null, saved = false, imported = false;
let direction = null, phase = "message", firstMessage = "", selectedOutcome = null;

function show(view) {
  for (const id of ["choose", "talk", "card-panel"]) $(id).hidden = id !== view;
}
function status(text, error = false) {
  $("status").textContent = text;
  $("status").classList.toggle("error", error);
}
function button(label, handler) {
  const el = document.createElement("button");
  el.type = "button"; el.textContent = label; el.addEventListener("click", handler);
  return el;
}
function renderTalk() {
  show("talk");
  const first = phase === "message";
  $("talk-title").textContent = first ? QUESTIONS[direction] : workContext(direction, firstMessage).prompt;
  $("answer-label").textContent = first ? "Say it your way" : "One detail so we can do useful work";
  $("earlier").hidden = first;
  $("earlier").textContent = first ? "" : firstMessage;
  $("answer").maxLength = first ? 220 : 160;
  $("answer").value = "";
  $("answer").placeholder = first ? "Tell us in one sentence…" : "Start with one small action…";
  $("suggestions").replaceChildren();
  const examples = first ? EXAMPLES[direction] : workContext(direction, firstMessage).examples;
  for (const suggestion of examples) {
    $("suggestions").append(button(suggestion, () => {
      $("answer").value = suggestion; $("answer").focus();
    }));
  }
  $("continue").textContent = first ? "One more question →" : "Do the useful part →";
  $("answer").focus();
}
function choose(kind) {
  direction = kind; phase = "message"; firstMessage = "";
  renderTalk(); status("A private, local conversation. Nothing has been sent.");
}
function persistIfSaved() {
  if (!saved) return;
  try {
    localStorage.setItem(STORE, JSON.stringify(card));
  } catch {
    saved = false;
    status("Browser storage unavailable; download the card instead.", true);
  }
}
function renderCard() {
  if (!card) return;
  validateCard(card);
  show("card-panel");
  $("card-title").textContent = LABELS[card.direction] + ".";
  $("card-message").textContent = card.message;
  $("card-action").textContent = card.nextStep;
  $("card-tag").textContent = card.returns.length ? "RETURN RECORDED" : card.work ? "WORK PREPARED" : "LEGACY DRAFT";
  $("work-section").hidden = !card.work;
  if (card.work) {
    $("work-title").textContent = card.work.title;
    $("work-body").textContent = card.work.body;
    $("work-state").textContent = card.work.status === "UNRESOLVED"
      ? "Underlying need unresolved · prepared partial material only"
      : card.work.status === "READY_TO_USE_DRAFT"
        ? "Complete local draft · not sent or accepted"
        : "Bounded local guide · not a verified real-world result";
  }
  $("card-id").textContent = "CARD " + card.id.slice(0, 8).toUpperCase() + " · UNSIGNED";
  $("card-origin").textContent = imported
    ? "Imported card. Checksum matched, but origin, identity, and outcomes are unverified."
    : "This is an unsigned personal draft. It has not been sent, matched, or independently verified.";
  $("save-state").textContent = saved
    ? "Saved in this browser on this device. Export a copy if you need it elsewhere."
    : "Not saved on this device. Download a JSON copy for another day or device.";
  $("return-choices").hidden = card.returns.length >= 12;
  $("return-form").hidden = true;
  $("returns").replaceChildren();
  card.returns.forEach((entry, index) => {
    const p = document.createElement("p");
    const label = document.createElement("strong");
    label.textContent = "RETURN " + (index + 1) + " · " + OUTCOME_TEXT[entry.outcome];
    p.append(label);
    if (entry.note) p.append(document.createTextNode(" — " + entry.note));
    $("returns").append(p);
  });
  const canPropose = !!card.returns.length && (!card.work || (card.work.status !== "UNRESOLVED" && card.returns.at(-1).outcome === "worked"));
  $("method-zone").hidden = !canPropose;
  if (canPropose) {
    $("method-text").textContent = card.method
      ? card.method.text
      : "Your report might help someone else. Proposing a method does not approve or publish it.";
    $("method").textContent = card.method ? "Update proposal from latest return" : "Propose a reusable method →";
  }
}
for (const el of document.querySelectorAll("[data-direction]")) {
  el.addEventListener("click", () => choose(el.dataset.direction));
}
$("talk-form").addEventListener("submit", event => {
  event.preventDefault();
  const text = $("answer").value.trim();
  if (!text) { status("Write a short answer or tap a suggestion.", true); return; }
  if (phase === "message") {
    firstMessage = text; phase = "step"; renderTalk(); return;
  }
  try {
    const prepared = prepareWork(direction, firstMessage, text);
    const audit = auditWork(prepared);
    if (!audit.pass) throw new Error("This result has no prepared work: " + audit.reason);
    card = createCard(direction, firstMessage, prepared.nextStep, prepared.work);
    imported = false; saved = false;
    renderCard(); status(audit.reason === "PARTIAL_WITH_BLOCKER"
      ? "A usable partial draft is prepared; the underlying need remains unresolved."
      : "Actual local work is prepared below. This is not field-proof or completion of an external action.");
  } catch (err) { status(err.message, true); }
});
$("back").addEventListener("click", () => {
  if (phase === "step") { phase = "message"; renderTalk(); $("answer").value = firstMessage; }
  else show("choose");
});
$("save").addEventListener("click", () => {
  try {
    localStorage.setItem(STORE, JSON.stringify(card)); saved = true;
    renderCard(); status("Saved on this device. This is not cloud storage.");
  } catch { status("Could not save here. Use Download card instead.", true); }
});
$("download").addEventListener("click", async () => {
  try {
    const pack = await exportCard(card);
    const blob = new Blob([JSON.stringify(pack, null, 2) + "\n"], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "first-circle-" + card.id.slice(0,8) + ".json";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("Download prepared. Keep the JSON file if you want to return from another device.");
  } catch (err) { status("Export failed: " + err.message, true); }
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareText(card));
    status("Share text copied. It does not contain your return notes.");
  } catch { status("Clipboard unavailable. Try Download card instead.", true); }
});
for (const el of document.querySelectorAll("[data-outcome]")) {
  el.addEventListener("click", () => {
    selectedOutcome = el.dataset.outcome;
    $("return-form").hidden = false;
    $("return-label").textContent = OUTCOME_TEXT[selectedOutcome] + ". What happened? (optional)";
    $("return-note").value = ""; $("return-note").focus();
  });
}
$("cancel-return").addEventListener("click", () => { selectedOutcome = null; $("return-form").hidden = true; });
$("return-form").addEventListener("submit", event => {
  event.preventDefault();
  try {
    card = recordReturn(card, selectedOutcome, $("return-note").value);
    persistIfSaved(); renderCard();
    status("Recorded as SELF-REPORTED, not independently verified. Nothing was transmitted.");
  } catch (err) { status("Could not record return: " + err.message, true); }
});
$("method").addEventListener("click", () => {
  try {
    card = proposeMethod(card); persistIfSaved(); renderCard();
    status("Method drafted as PROPOSAL ONLY. It needs separate human review before any reuse.");
  } catch (err) { status(err.message, true); }
});
$("new").addEventListener("click", () => {
  card = null; saved = false; imported = false; direction = null;
  show("choose"); status("Ready for another circle. An earlier saved card remains until replaced or erased.");
});
$("erase").addEventListener("click", () => {
  if (!window.confirm("Erase this browser's saved First Circle card? Download a backup first if needed.")) return;
  try {
    localStorage.removeItem(STORE);
    saved = false; renderCard(); status("Saved browser copy erased. This does not revoke exported files.");
  } catch { status("This browser did not permit removing the saved copy.", true); }
});
$("import").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 64000) { status("Card is too large (64 KB maximum).", true); return; }
  try {
    const packet = JSON.parse(await file.text());
    card = await importCard(packet); saved = false; imported = true;
    renderCard(); status("Card reopened. Checksum is not proof of identity or outcome.");
  } catch (err) { status("Cannot open card: " + err.message, true); }
});
try {
  const raw = localStorage.getItem(STORE);
  if (raw) {
    const restored = JSON.parse(raw);
    validateCard(restored);
    card = restored; saved = true;
    renderCard(); status("Your saved card is here. You can return or export it.");
  }
} catch { status("Saved browser data unavailable or invalid. Start a new circle.", true); }
