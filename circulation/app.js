"use strict";
// CIRCULATION-001 / static reproduction of a fictional, tested three-repository experiment.
// No data intake, remote requests, tracking, recipient contact or local storage.
const state = { replayed: false };
const el = id => document.getElementById(id);

function paint() {
  el("care-state").textContent = state.replayed ? "Fictional HOLD" : "Unanswered proposal";
  el("culture-state").textContent = state.replayed ? "Fictional DECLINE" : "Unanswered proposal";
  el("care-state").classList.toggle("returned", state.replayed);
  el("culture-state").classList.toggle("returned", state.replayed);
  el("return-record").hidden = !state.replayed;
  document.querySelector(".return").classList.toggle("complete", state.replayed);
  el("return-title").textContent = state.replayed ? "Two answers, neither overruled." : "The door remains open.";
  el("return-summary").textContent = state.replayed
    ? "The rehearsal returned two distinguishable simulated replies. No owner accepted a task; no song or help was delivered. The source record was preserved."
    : "Replay the fictional experiment to see two separate responses return without overruling either receiver.";
  el("replay").textContent = state.replayed ? "Replay again ↘" : "Replay the test return ↘";
}

for (const button of document.querySelectorAll("[data-open]")) {
  const destination = button.dataset.open;
  const details = el(destination + "-details");
  button.setAttribute("aria-controls", details.id);
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    details.hidden = !details.hidden;
    button.setAttribute("aria-expanded", String(!details.hidden));
  });
}
el("replay").addEventListener("click", () => {
  state.replayed = true;
  paint();
  el("return-summary").scrollIntoView({ block: "nearest", behavior: "auto" });
});
el("reset").addEventListener("click", () => {
  state.replayed = false;
  paint();
});
el("print").addEventListener("click", () => window.print());
paint();
