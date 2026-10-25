import {RECIPES, recipeById, freshState, normalizeState, requirements, candidateOffers, transition, editionData, radioCopy, formatQty} from "./engine.mjs";

const $ = id => document.getElementById(id);
const key = "lemonpress-missing-ingredient-demo-v1";
const states = {
 draft: ["Nothing has been promised.", "Choose a candidate offer above. No participant or producer exists behind these example cards."],
 proposed: ["A suggestion is not a pledge.", "Fictional helper role: accept this exact candidate, or decline it."],
 accepted: ["An accepted task is not a delivery.", "Fictional helper role: report that the sample handoff was performed."],
 reported: ["A report is not confirmation.", "Fictional recipient role: decide whether to confirm this simulated outcome."],
 confirmed: ["The example has come home.", "Two distinct steps were clicked in one browser; no independent person or real-world result was verified."],
 declined: ["The answer was no.", "A stopped crossing is a valid outcome. Start a new edition or reset."],
};
let state;
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
function load() {
  let stored;
  try { stored = JSON.parse(localStorage.getItem(key) || "null"); } catch { stored = null; }
  state = normalizeState(stored);
  const link = new URLSearchParams(window.location.search);
  if (link.has("recipe") && RECIPES.some(r => r.id === link.get("recipe"))) {
    state = freshState(link.get("recipe"));
    const issue = Number(link.get("issue"));
    if (Number.isInteger(issue) && issue >= 0 && issue <= 999) state.issue = issue;
  }
}
function persist() {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* In-memory demo still works */ }
}
let toastTimer;
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3400);
}
function apply(action, payload) {
  try { state = transition(state, action, payload); persist(); render(); }
  catch (error) { toast(error.message || "The action was not allowed."); }
}
function recipeUI() {
  $("recipes").innerHTML = RECIPES.map((r,n) => `<button type="button" class="recipe-choice" data-recipe="${r.id}" aria-pressed="${state.recipeId === r.id}">
     <small>RECIPE 0${n+1} · FICTIONAL KITCHEN</small>
     <strong>${escapeHtml(r.title)}</strong>
     <span>OPEN THIS POT →</span>
   </button>`).join("");
  $("recipes").querySelectorAll("[data-recipe]").forEach(button => button.addEventListener("click", () => {
    if (state.recipeId !== button.dataset.recipe) apply("recipe", { id: button.dataset.recipe });
  }));
}
function pantryUI() {
  const r = recipeById(state.recipeId);
  $("pantryTitle").textContent = r.title;
  $("recipeSubtitle").textContent = r.subtitle;
  $("serves").value = String(state.serves);
  $("ingredients").innerHTML = requirements(state).map(i => `
    <label class="ingredient">
      <strong>${escapeHtml(i.label)}</strong><span class="quantity">${formatQty(i.qty)} ${escapeHtml(i.unit)}</span>
      <select data-ingredient="${i.id}" aria-label="Availability of ${escapeHtml(i.label)}">
       <option value="have" ${i.status==="have"?"selected":""}>On hand</option>
       <option value="missing" ${i.status==="missing"?"selected":""}>Missing</option>
       <option value="unknown" ${i.status==="unknown"?"selected":""}>Unknown</option>
      </select>
    </label>`).join("");
  $("ingredients").querySelectorAll("select[data-ingredient]").forEach(select =>
    select.addEventListener("change", () => apply("pantry", {id:select.dataset.ingredient,status:select.value})));
  const rs=requirements(state);
  const have=rs.filter(i=>i.status==="have").length;
  const missing=rs.filter(i=>i.status==="missing").length;
  const unknown=rs.filter(i=>i.status==="unknown").length;
  $("pantrySummary").textContent=`${have} explicit on-hand · ${missing} explicit missing · ${unknown} unknown. Unknown is never silently treated as available.`;
}
function matchingUI() {
  const rs = requirements(state);
  $("focusPicker").innerHTML = `<div class="focus-buttons">${rs.map(i =>
    `<button class="focus-btn" type="button" data-focus="${i.id}" aria-pressed="${state.focus===i.id}"><span>${escapeHtml(i.label)}</span><span>${i.status==="missing"?"NEED":"—"}</span></button>`).join("")}</div>`;
  $("focusPicker").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>apply("focus",{id:b.dataset.focus})));
  const selected=rs.find(i=>i.id===state.focus), candidates=candidateOffers(state);
  $("matchCount").textContent=`${candidates.length} CANDIDATE${candidates.length===1?"":"S"}`;
  if (selected?.status!=="missing") {
    $("offers").innerHTML = `<div class="offer-empty">This ingredient is marked <b>${escapeHtml(selected?.status||"unknown")}</b>, not missing. Choose a known shortage in the pantry before exploring fictional offers.</div>`;
  } else if(!candidates.length) {
    $("offers").innerHTML = `<div class="offer-empty">No sample offer matches this missing ingredient. An honest no-match is an answer too. Try another ingredient or make a new recipe.</div>`;
  } else {
    $("offers").innerHTML=candidates.map(o=>`<article class="offer">
      <div class="offer-top"><div><h4>${escapeHtml(o.by)}</h4><p>${formatQty(o.qty)} ${escapeHtml(o.unit)} available <b>in the fiction</b></p></div><span class="${o.adequate?"adequate":"short"}">${o.adequate?"AMOUNT FITS":"SHORTAGE"}</span></div>
      <p>${escapeHtml(o.explanation)}</p><p class="fine">${escapeHtml(o.note)}</p>
      <button type="button" class="button small" data-offer="${o.id}" ${(!o.adequate||state.phase!=="draft")?"disabled":""}>Propose this handoff →</button>
    </article>`).join("");
    $("offers").querySelectorAll("button[data-offer]").forEach(b =>
      b.addEventListener("click",()=>apply("propose",{offerId:b.dataset.offer})));
  }
}
function witnessUI() {
  const [title,hint]=states[state.phase]||states.draft;
  $("phaseTitle").textContent=title;
  $("phaseHint").textContent=hint;
  $("phaseBadge").textContent=state.phase.toUpperCase();
  const stageOrder=["proposed","accepted","reported","confirmed"];
  const position=stageOrder.indexOf(state.phase);
  document.querySelectorAll(".progress [data-stage]").forEach(node=>{
    node.classList.toggle("active",position>=0 && stageOrder.indexOf(node.dataset.stage)<=position);
  });
  const actions={
    draft: '<span class="fine" style="color:#e5f0db">Select a suitable fictional basket above to propose a handoff.</span>',
    proposed: '<button class="button" data-action="accept">Fictional helper: accept →</button><button class="button decline" data-action="decline">Decline / stop</button>',
    accepted: '<button class="button" data-action="report">Fictional helper: report done →</button><button class="button decline" data-action="decline">Decline / stop</button>',
    reported: '<button class="button" data-action="confirm">Fictional recipient: confirm →</button><button class="button decline" data-action="decline">Decline / stop</button>',
    confirmed: '<strong style="color:#eed461">ONE SIMULATED ACT CLOSED. Print the outcome or open a next edition.</strong>',
    declined: '<strong style="color:#eed461">STOPPED. No completion was recorded.</strong>'
  };
  $("handoffActions").innerHTML=actions[state.phase]||actions.draft;
  $("handoffActions").querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>apply(b.dataset.action)));
  $("receipts").innerHTML=state.events.length ? state.events.map(e=>
    `<li><span><span class="receipt-label">${escapeHtml(e.kind)}</span> · ${escapeHtml(e.detail)}</span><time datetime="${escapeHtml(e.at)}">${escapeHtml(e.at.slice(11,19))} UTC</time></li>`).join("")
    : '<li>Nothing recorded yet. Local receipt stages appear here after an explicit sample action.</li>';
}
function printUI() {
  const r=recipeById(state.recipeId), req=requirements(state);
  const number=String(state.issue).padStart(3,"0");
  $("issueTop").textContent=number; $("paperNo").textContent=number;
  $("printRecipe").textContent=r.title; $("printSubtitle").textContent=r.subtitle + ` · Serves ${state.serves}`;
  $("printIngredients").innerHTML=req.map(i=>`<div class="print-row"><span>${escapeHtml(i.label)} · ${formatQty(i.qty)} ${escapeHtml(i.unit)}</span><span class="${i.status}">${i.status.toUpperCase()}</span></div>`).join("");
  $("printSteps").innerHTML=r.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join("");
  const missing=req.filter(i=>i.status==="missing");
  const unknown=req.filter(i=>i.status==="unknown");
  $("printQuestion").textContent=missing.length
    ? `Our imagined kitchen is short ${missing.map(i=>i.label.toLowerCase()).join(", ")}. What would a real organizer have to verify before matching a local supply?`
    : unknown.length ? "We have no confirmed shortage. What needs checking before declaring the meal possible?"
      : "What would make this recipe easier for more neighbors to prepare?";
  const results={
    draft:"Nothing proposed. A question is not a request for supplies.",
    proposed:"A possible match was proposed. No example helper accepted.",
    accepted:"The fictional helper accepted. Nothing was reported delivered.",
    reported:"The fictional helper reported action; the recipient has not confirmed it.",
    confirmed:"The fictional recipient confirmed the example in this browser. No real food changed hands.",
    declined:"The proposed handoff was stopped. A no is an honest outcome."
  };
  $("printReturn").textContent=results[state.phase];
  $("radioText").textContent=radioCopy(state);
}
async function copy(value) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
    await navigator.clipboard.writeText(value); toast("Copied. This did not send anything.");
  } catch {
    // Do not put potentially identifying notes into the URL.
    const box=document.createElement("textarea"); box.value=value;box.style.position="fixed";box.style.left="-9999px";
    document.body.appendChild(box);box.focus();box.select();
    try { if(!document.execCommand("copy")) throw new Error("Copy blocked"); toast("Copied to clipboard."); }
    catch { toast("Clipboard blocked. Select the script directly to copy."); }
    finally { box.remove(); }
  }
}
function exportJson() {
  const data=JSON.stringify(editionData(state),null,2);
  const blob=new Blob([data],{type:"application/json"});
  const href=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=href;a.download=`missing-ingredient-fiction-issue-${String(state.issue).padStart(3,"0")}.json`;
  a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  toast("Fictional data exported locally. No notes or contacts included.");
}
function render() {
  recipeUI(); pantryUI(); matchingUI(); witnessUI(); printUI();
  if(document.activeElement!==$("margin")) $("margin").value=state.margin;
}
function init() {
  load(); render(); persist();
  $("serves").addEventListener("change", e=>apply("serves",{value:Number(e.target.value)}));
  $("margin").addEventListener("input", e=>{ state=transition(state,"margin",{text:e.target.value});persist(); });
  $("printBtn").addEventListener("click",()=>window.print());
  $("copyRadio").addEventListener("click",()=>copy(radioCopy(state)));
  $("exportBtn").addEventListener("click",exportJson);
  $("shareBtn").addEventListener("click",()=>{
    const url=new URL(window.location.href);url.search="";
    url.searchParams.set("recipe",state.recipeId);url.searchParams.set("issue",String(state.issue));
    url.hash="";
    copy(url.toString());
  });
  $("nextBtn").addEventListener("click",()=>{apply("next");toast("A new fictional issue is open. The earlier rehearsal was not carried forward as proof.");});
  $("clearBtn").addEventListener("click",()=>{
    try{localStorage.removeItem(key);}catch{}
    state=freshState(); const url=new URL(location.href);if(url.search){history.replaceState(null,"",url.pathname+url.hash);}
    render();toast("Local rehearsal cleared.");
  });
}
init();
