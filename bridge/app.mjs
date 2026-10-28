import {proposal,doors,invitationFor,draftFor} from "./model.mjs";
const $=(id)=>document.getElementById(id);
const selected=(new URLSearchParams(location.search)).get("door");
let active=doors.some(d=>d.id===selected)?selected:doors[0].id;
let decision="HOLD";
let touched=false;
function downloadJson(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
  const href=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2000);
}
function fill(id,value){$(id).textContent=value}
function renderDoor(){
 const door=doors.find(d=>d.id===active);
 for (const id of ["kind","name","due","alignment","request","offered","gate"]){
   const map={kind:door.kind,name:door.name,due:door.due,alignment:door.alignment,request:door.request,offered:door.offered,gate:door.gate};
   fill("door-"+id,map[id]);
 }
 const a=$("door-official");a.href=door.url;
 document.querySelectorAll("#door-list button").forEach(button=>button.setAttribute("aria-current",String(button.dataset.id===active)));
 fill("copy-status","Drafts are prepared locally. Nothing is sent.");
}
const nav=$("door-list");
doors.forEach((door,index)=>{
 const b=document.createElement("button");b.type="button";b.dataset.id=door.id;b.textContent=door.name;
 const n=document.createElement("span");n.textContent=String(index+1).padStart(2,"0");b.append(n);
 b.addEventListener("click",()=>{active=door.id;renderDoor();history.replaceState(null,"",location.pathname+"?door="+encodeURIComponent(active)+"#doors");});
 nav.append(b);
});
proposal.sequence.forEach((step,i)=>{
 const el=document.createElement("div");el.className="step";
 const number=document.createElement("span");number.textContent=String(i+1).padStart(2,"0");
 const label=document.createElement("strong");label.textContent=step.name;
 const meaning=document.createElement("p");meaning.textContent=step.meaning;
 el.append(number,label,meaning);$("flow").append(el);
});
proposal.projects.forEach(project=>{
 const card=document.createElement("div");card.className="project";
 const strong=document.createElement("strong");strong.textContent=project.name;
 const summary=document.createElement("p");summary.textContent=project.role;
 const status=document.createElement("small");status.textContent=project.status.replaceAll("_"," ");
 const a=document.createElement("a");a.href=project.url;a.textContent="Inspect source ↗";a.target="_blank";a.rel="noopener noreferrer";
 card.append(strong,summary,status,a);$("projects").append(card);
});
fill("scenario",proposal.pilot.publicQuestion);
renderDoor();
$("copy-letter").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(draftFor(active));fill("copy-status","Introduction copied. Inspect and personalize before sending.");}
 catch {fill("copy-status","Clipboard unavailable in this context. Use the exported JSON or your browser's secure copy controls.");}
});
$("export-door").addEventListener("click",()=>downloadJson("between-rooms-"+active+"-DRAFT.json",invitationFor(active)));
document.querySelectorAll("[data-decision]").forEach(b=>b.addEventListener("click",()=>{
 decision=b.dataset.decision;touched=true;
 fill("decision-note","LOCAL SYNTHETIC REHEARSAL: "+decision+". This is not an institution's decision, agreement or verified receipt.");
}));
$("export-rehearsal").addEventListener("click",()=>downloadJson("between-rooms-synthetic-review.json",{
 schema:"abundent/bridge-rehearsal-v0",proposalId:proposal.id,
 classification:"SYNTHETIC_LOCAL_ONLY",recipient:doors.find(d=>d.id===active).name,
 claimOfInstitutionalParticipation:false,caseId:proposal.pilot.id,
 localSelfAttestation:touched?decision:"HOLD_DEFAULT_NOT_EXPLICIT",
 reportStatus:"NO_REAL_REPORT",verification:"NOT_VERIFIED",permission:"NOT_ESTABLISHED"
}));
$("print").addEventListener("click",()=>window.print());
