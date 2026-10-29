import { createCard, cardText, emailDraft } from "./first-step.mjs";

const byId = id => document.getElementById(id);
const form = byId("work-form");
const result = byId("result");
let currentText = "";
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
    currentText = cardText(card);
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
