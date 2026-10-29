import { createCard, cardText, emailDraft } from "./first-step.mjs";
import { generateSixUp, keepCandidate, keptText, makeDogramSpecimen, compareAblation, candidateParetoFrontier, verifySixUp } from "./plan-ecology.mjs";

const byId = id => document.getElementById(id);
const form = byId("work-form");
const result = byId("result");
let currentText = "";
let sixUp = null;
let round = 0;
let baseCard = null;
let baseText = "";
form.addEventListener("submit", event => {
  event.preventDefault();
  byId("form-message").textContent = "";
  try {
    const card = createCard({
      goal: byId("goal").value,
      kind: byId("kind").value,
      have: byId("have").value,
      needs: byId("needs").value
    });
    baseCard = card;
    baseText = cardText(card);
    round = 0;
    sixUp = null;
    byId("planning-lab").open = false;
    byId("six-grid").replaceChildren();
    byId("lab-message").textContent = "";
    currentText = baseText;
    byId("card-preview").textContent = currentText;
    byId("email").href = emailDraft(card);
    byId("card-message").textContent = "";
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    result.hidden = true;
    currentText = "";
    byId("form-message").textContent = error instanceof RangeError ? error.message : "Could not prepare a draft.";
  }
});
// Never leave an earlier draft available to share after its inputs change.
function invalidateDraft() {
  result.hidden = true;
  currentText = "";
  baseCard = null;
  baseText = "";
  sixUp = null;
  round = 0;
  byId("planning-lab").open = false;
  byId("six-grid").replaceChildren();
  byId("form-message").textContent = "";
  byId("card-message").textContent = "";
}
form.addEventListener("input", invalidateDraft);
form.addEventListener("change", invalidateDraft);
byId("copy").addEventListener("click", async () => {
  if (!currentText) return;
  try {
    await navigator.clipboard.writeText(currentText);
    byId("card-message").textContent = "Copied. Nothing was sent.";
  } catch {
    byId("card-message").textContent = "Copy is unavailable here. Use Save text instead.";
  }
});
byId("save").addEventListener("click", () => {
  if (!currentText) return;
  const url = URL.createObjectURL(new Blob([currentText], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "abundent-first-work-card.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  byId("card-message").textContent = "Prepared a local text file. No upload occurred.";
});
byId("print").addEventListener("click", () => {
  if (currentText) window.print();
});

function saveLocalText(filename, content, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function paintSixUp() {
  if(!baseCard) return;
  const input = {
    goal:byId("goal").value,
    have:byId("have").value,
    needs:byId("needs").value,
    kind:byId("kind").value,
    effortBudget:byId("effort-budget").valueAsNumber,
    round
  };
  try {sixUp = generateSixUp(input);}
  catch(error) {
    sixUp = null;
    byId("six-grid").replaceChildren();
    byId("lab-message").textContent = error.message;
    return;
  }
  byId("lab-message").textContent = "Round " + (round+1) + ": six local proposals. No actions taken.";
  const pareto = candidateParetoFrontier(sixUp);
  const grid = byId("six-grid");
  grid.replaceChildren();
  for(const c of sixUp.candidates) {
    const article = document.createElement("article");
    article.className = "six-card";
    article.dataset.role = c.id;
    const title = document.createElement("h3");
    title.textContent = c.label;
    const status = document.createElement("p");
    status.className = "plan-status";
    status.textContent = c.disposition;
    const description = document.createElement("p");
    description.textContent = c.approach;
    const budget = document.createElement("p");
    budget.className = "fine";
    budget.textContent = c.effortPoints + " abstract points · " +
      (c.withinDeclaredBudget ? "within declared budget" : "above declared budget") +
      " · " + (pareto.includes(c.id) ? "Pareto-incomparable option" : "dominated option");
    const req = document.createElement("p");
    req.className = "fine";
    req.textContent = c.humanGates.length ? "Human gates: " + c.humanGates.join("; ") : "No external permission needed to draft.";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "KEEP this draft";
    button.setAttribute("aria-label","KEEP " + c.label);
    button.addEventListener("click", () => {
      if (!sixUp || !verifySixUp(sixUp)) { byId("lab-message").textContent = "Cannot verify this candidate family."; return; }
      const kept=keepCandidate(sixUp,c.id);
      currentText=keptText(kept);
      byId("card-preview").textContent=currentText;
      byId("email").href="mailto:us@abundent.org?subject="+
        encodeURIComponent("Abundent / kept planning draft for review")+
        "&body="+encodeURIComponent(currentText);
      byId("lab-message").textContent="KEPT " + c.id + " / round " +(round+1)+
        ". Local draft only; no execution, sending or inferred preference.";
      byId("card-message").textContent="The shareable card now contains the exact KEPT proposal.";
    });
    article.append(title,status,description,budget,req,button);
    grid.append(article);
  }
  byId("ablation-view").textContent=JSON.stringify(compareAblation("approval"),null,2);
}
byId("planning-lab").addEventListener("toggle",() => {
  if(byId("planning-lab").open && baseCard && !sixUp)paintSixUp();
});
byId("effort-budget").addEventListener("change",() => {
  if(!baseCard)return;
  round=0;
  currentText=baseText;
  byId("card-preview").textContent=baseText;
  byId("email").href=emailDraft(baseCard);
  paintSixUp();
});
byId("scrape").addEventListener("click",() => {
  if(!sixUp)return;
  if(round===99){byId("lab-message").textContent="Rehearsal capped at 100 rounds; start a new draft.";return;}
  round++;
  // SCRAPE does not record disapproval or infer preferences.
  currentText=baseText;
  byId("card-preview").textContent=baseText;
  byId("email").href=emailDraft(baseCard);
  byId("card-message").textContent="";
  paintSixUp();
});
byId("dogram-export").addEventListener("click",() => {
  if(!sixUp || !verifySixUp(sixUp))return;
  saveLocalText("first-inch-dogram-ablate.json",
    JSON.stringify(makeDogramSpecimen("approval"),null,2)+"\n",
    "application/json;charset=utf-8");
  byId("lab-message").textContent="Saved an inert Dogram specimen. No model, Python or remote service was called.";
});
