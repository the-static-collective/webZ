import{LEADS,UPDATED_ON,QUESTIONS,makeOutreachDraft,makeLocalLedgerNote}from"./pilot.mjs";
const $=id=>document.getElementById(id),list=$("pilot-leads"),select=$("pilot-select");let draft="";
for(const r of LEADS){const o=new Option(r.name,r.id);select.add(o);const card=document.createElement("article");card.className="pilot-lead";
const eyebrow=document.createElement("p");eyebrow.className="stamp";eyebrow.textContent=String(r.rank).padStart(2,"0")+" · "+r.type;
const h=document.createElement("h3");h.textContent=r.name;
const why=document.createElement("p");why.textContent=r.why;
const links=document.createElement("p"),phone=document.createElement("a");phone.href="tel:"+r.tel.replace(/[^\d+]/g,"");phone.textContent=r.tel;
const src=document.createElement("a");src.href=r.source;src.target="_blank";src.rel="noopener noreferrer";src.textContent="Official or public source ↗";
links.append(phone," · ",src);
const state=document.createElement("p");state.className="small-note";state.textContent="Public research lead — no outreach or participation recorded.";
const btn=document.createElement("button");btn.type="button";btn.className="button";btn.textContent="Prepare this introduction";btn.addEventListener("click",()=>{select.value=r.id;prepare();$("pilot-ask").scrollIntoView({behavior:"smooth",block:"start"})});card.append(eyebrow,h,why,links,state,btn);list.append(card)}
const ul=$("pilot-checklist");for(const [name,description]of QUESTIONS){const li=document.createElement("li");li.textContent=name+" — "+description;ul.append(li)}
function prepare(){draft=makeOutreachDraft(select.value);$("pilot-text").value=draft;$("pilot-copy").disabled=false;$("pilot-status").textContent="Unsent draft created locally. No outreach, permission, supply or relationship was recorded."}
$("pilot-prepare").addEventListener("click",prepare);select.addEventListener("change",()=>{draft="";$("pilot-copy").disabled=true;$("pilot-text").value="";$("pilot-status").textContent="Selection changed; draft not prepared."});
$("pilot-copy").addEventListener("click",async()=>{if(!draft)return;try{await navigator.clipboard.writeText(draft);$("pilot-status").textContent="Copied text. No message has been sent."}catch{$("pilot-status").textContent="Clipboard unavailable. Select the draft text and copy manually."}});
$("pilot-print").addEventListener("click",()=>window.print());
$("pilot-last-checked").textContent=UPDATED_ON;
$("pilot-note").addEventListener("click",()=>{try{const note=makeLocalLedgerNote({leadId:select.value,stage:$("pilot-stage").value,date:$("pilot-date").value});$("pilot-note-output").value=JSON.stringify(note,null,2);$("pilot-note-status").textContent="Unsigned review note prepared in this tab only; no status changed remotely."}catch(e){$("pilot-note-status").textContent=e.message}});
$("pilot-date").value=new Date().toISOString().slice(0,10);
