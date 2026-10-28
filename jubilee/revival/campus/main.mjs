import{OBSERVED_ON,INSTITUTIONS,CHURCH_LEADS,THEMES,buildProposal}from"./data.mjs";
const $=id=>document.getElementById(id);
$("institution-count").textContent=String(INSTITUTIONS.length);$("church-count").textContent=String(CHURCH_LEADS.length);
const kinds={university:"University",college:"College","community-college":"Community / technical college",district:"Public school district",school:"K–12 school","community-ed":"Community education",extension:"Extension / 4-H",church:"Church directory lead"};
const ed=$("school"),church=$("church"),topic=$("theme"),scope=$("scope");
function addChoice(parent,id,name){const o=document.createElement("option");o.value=id;o.textContent=name;parent.append(o)}
addChoice(church,"","Choose a church (not contacted)");addChoice(ed,"","Choose an education institution (not contacted)");
for(const r of CHURCH_LEADS)addChoice(church,r.id,r.name+" · "+r.city);
for(const r of INSTITUTIONS)addChoice(ed,r.id,r.name+" · "+r.city);
for(const t of THEMES)addChoice(topic,t.id,t.title);
function render(){const q=$("query").value.toLocaleLowerCase().trim(),k=$("kind").value;const items=[...INSTITUTIONS,...CHURCH_LEADS.map(r=>({...r,type:"church",why:"Historical directory research lead; current operation and voluntary capacity not confirmed."}))];
const filtered=items.filter(r=>(k==="all"||(k==="church"&&r.type==="church")||(k==="higher"&&["university","college","community-college"].includes(r.type))||(k==="school"&&["district","school","community-ed"].includes(r.type))||(k==="extension"&&r.type==="extension"))&&[r.name,r.city,r.county,r.why,r.type].join(" ").toLowerCase().includes(q));
$("results-count").textContent=filtered.length+" of "+items.length+" research entries shown. No participant status implied.";const root=$("entries");root.replaceChildren();
for(const r of filtered){const card=document.createElement("article");card.className="card"+(r.type==="church"?"":" school");
const tag=document.createElement("span");tag.className="tag";tag.textContent=kinds[r.type]||"Education";const title=document.createElement("h3");title.textContent=r.name;
const where=document.createElement("div");where.className="small";where.textContent=r.city+" · "+r.county+" County";
const detail=document.createElement("p");detail.textContent=r.why;
const state=document.createElement("span");state.className="status";state.textContent=r.type==="church"?"Unverified church listing":"Institution research lead";
const a=document.createElement("a");a.href=r.source;a.textContent="Inspect original source ↗";a.target="_blank";a.rel="noopener noreferrer";card.append(tag,title,where,detail,state,a);root.append(card)}
}
$("query").addEventListener("input",render);$("kind").addEventListener("change",render);
let current="";const reset=()=>{current="";$("copy").disabled=true;$("draft-status").textContent="Selections changed. Compose a fresh proposal; nothing has been sent.";};
for(const field of [church,ed,topic,scope])field.addEventListener("change",reset);
$("draft").addEventListener("click",()=>{try{current=buildProposal({churchId:church.value,institutionId:ed.value,themeId:topic.value,scope:scope.value});$("proposal").textContent=current;$("copy").disabled=false;$("draft-status").textContent="Local proposal generated on "+OBSERVED_ON+". Human approvals required; nothing sent or saved.";}catch(e){current="";$("copy").disabled=true;$("draft-status").textContent=e.message;}});
$("copy").addEventListener("click",async()=>{if(!current)return;try{await navigator.clipboard.writeText(current);$("draft-status").textContent="Copied. Nothing sent.";}catch{$("draft-status").textContent="Clipboard not available: select and copy the visible draft manually.";}});
$("print").addEventListener("click",()=>window.print());
render();
