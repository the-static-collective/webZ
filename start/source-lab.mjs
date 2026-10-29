import { rankPublicDoors } from "./source-match.mjs";
const el=id=>document.getElementById(id);
const box=el("source-results");
const message=el("source-message");
const form=el("work-form");
let generation=0;
function clearSources(){
  generation++;
  box.replaceChildren();
  message.textContent="";
}
form.addEventListener("input",clearSources);
form.addEventListener("change",clearSources);
form.addEventListener("submit",clearSources);
el("find-sources").addEventListener("click",async()=>{
  if(el("result").hidden) {
    message.textContent="Prepare a first-step card before looking up public sources.";
    return;
  }
  const current=++generation;
  const goal=el("goal").value;
  box.replaceChildren();
  message.textContent="Reading a local copy of the reviewed public directory…";
  try {
    const response=await fetch("./public-doors-v1.json",{cache:"no-store",credentials:"omit"});
    if(!response.ok)throw new Error("Local catalog unavailable.");
    const catalog=await response.json();
    if(current!==generation || el("goal").value!==goal || el("result").hidden)return;
    const finding=rankPublicDoors(goal,catalog);
    if(!finding.results.length){
      message.textContent="No exact word matches in the dated catalog. That does not mean no solution exists.";
      return;
    }
    message.textContent=finding.results.length+" public project pointer(s) found in "+
      finding.catalogRelease+". The results are editorial leads, not offers or verified capacity.";
    for(const found of finding.results){
      const card=document.createElement("article");
      card.className="source-card";
      const head=document.createElement("h3");
      head.textContent=found.title;
      const state=document.createElement("p");
      state.className="fine";
      state.textContent=found.state+" · matching words: "+found.matched.join(", ");
      const check=document.createElement("p");
      check.textContent="First human check: "+found.firstCheck;
      const note=document.createElement("p");
      note.className="fine";
      note.textContent="Source pointer only. No verified availability, owner agreement or action.";
      const link=document.createElement("a");
      link.textContent="Inspect project-owned source ↗";
      link.href=found.source;
      link.target="_blank";
      link.rel="noopener noreferrer";
      card.append(head,state,check,note,link);
      box.append(card);
    }
  } catch(error){
    if(current===generation){
      box.replaceChildren();
      message.textContent="HOLD — public directory unavailable or invalid. No source claims were made.";
    }
  }
});
