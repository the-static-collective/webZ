import {REVIEWED_AT,PROJECT,PROSPECTS,ALLOCATION,SOURCES,DRAFTS,FOUNDER_GATES,budgetTotal,publicStatus} from "./model.mjs";
import {planningPacket} from "./commons-circuit.mjs";
const $=id=>document.getElementById(id);
function element(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el}
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n)}
for(const [label,value] of ALLOCATION){const row=element("div","budget-row");row.append(element("span","",label),element("strong","",money(value)));$("budget").append(row)}
const total=element("div","budget-row total");total.append(element("span","","Proposed total"),element("strong","",money(budgetTotal())));$("budget").append(total);
for(const label of FOUNDER_GATES){const row=element("div","gate-row");row.append(element("b","","HOLD"),element("span","",label));$("gates").append(row)}
for(const draft of DRAFTS){
 const card=element("article","draft-card");card.append(element("h3","",draft.label));
 const note=element("small","",draft.limit?"Character count "+draft.value.length+" / "+draft.limit:"Local inquiry draft, human sending and signature required");
 const txt=element("pre","",draft.value);
 const buttons=element("div","buttons");const btn=element("button","pill primary","Copy unsent draft");btn.type="button";
 btn.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(draft.value);
 $("copy-state").textContent="Copied local text only — NOT sent, submitted, registered or approved.";
 }catch{$("copy-state").textContent="Clipboard unavailable: select and copy text manually."}});
 buttons.append(btn);card.append(note,txt,buttons);$("draft-list").append(card);
}
for(const row of SOURCES){const a=element("a","",row.title+" ↗");a.href=row.href;a.target="_blank";a.rel="noopener noreferrer";$("source-list").append(a)}
$("export-review").addEventListener("click",()=>{
 const record={...publicStatus(),project:PROJECT,prospects:PROSPECTS.map(p=>({id:p.id,source:p.source,kind:p.kind,state:p.state,gate:p.gate,due:p.due})),
 gateChecklist:FOUNDER_GATES,illustrativeBudget:ALLOCATION.map(([purpose,USD])=>({purpose,USD})),totalUSD:budgetTotal(),commonsCircuit:planningPacket(),
 reviewedAt:REVIEWED_AT,disclaimer:"PUBLIC REVIEW CHECKLIST ONLY. NO GRANT SUBMISSION, CONTACT OR PARTNER AUTHORIZATION."};
 const blob=new Blob([JSON.stringify(record,null,2)+"\n"],{type:"application/json"}),url=URL.createObjectURL(blob),a=element("a");
 a.href=url;a.download="BRIDGE-006-first-crossing-UNSENT.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
});
