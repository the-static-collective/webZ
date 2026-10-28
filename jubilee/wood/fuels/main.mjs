import{BANKS,evaluateBank,publicResearchSlip}from"./data.mjs";
const $=id=>document.getElementById(id),select=$("source");
for(const b of BANKS)select.add(new Option(b.name,b.id));
let current=BANKS[0].id;
function render(id){const b=BANKS.find(x=>x.id===id);if(!b)return;
current=id;select.value=id;$("name").textContent=b.name;$("status").textContent=b.status;
$("bank").textContent=b.bank;$("value").textContent=b.value;$("route").textContent=b.route;$("risk").textContent=b.risk;
$("source-link").href=b.source;$("source-link").textContent="Source and current guidance ↗";
const gate=evaluateBank(b.id);$("gate").textContent="ROUTING CHECK: "+gate.status+" — "+gate.why;
for(const btn of $("bank-grid").children)btn.setAttribute("aria-pressed",String(btn.dataset.id===id));
$("slip").hidden=true;$("draft-note").textContent="No research slip prepared. No contact or submission made."}
for(const b of BANKS){const btn=document.createElement("button");btn.className="bank";btn.type="button";btn.dataset.id=b.id;
const strong=document.createElement("strong");strong.textContent=b.name;
const small=document.createElement("span");small.textContent=b.status;
btn.append(strong,small);btn.addEventListener("click",()=>{render(b.id);$("details").scrollIntoView({behavior:"smooth",block:"nearest"})});$("bank-grid").append(btn);}
select.addEventListener("change",()=>render(select.value));
$("make-slip").addEventListener("click",()=>{const text=publicResearchSlip(current);$("slip").value=text;$("slip").hidden=false;$("slip").rows=13;
$("draft-note").textContent="An unsent, non-personal research slip was prepared in this browser tab. No messages sent."});
$("print-slip").addEventListener("click",()=>window.print());
render(current);
