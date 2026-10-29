import { DEFAULTS, preparePacket, printableKit } from "./model.mjs";

const el=id=>document.getElementById(id);
const fields=["context","need","offer","measure","stop"];
const exportButtons=["download","download-json","copy"];
let active=null, printable="";
function status(message,error=false) { el("status").textContent=message; el("status").style.color=error?"#f8b692":"#e4c17c"; }
function setReady(ready) { for(const id of exportButtons) el(id).disabled=!ready; }
function clearPreview() { active=null; printable=""; setReady(false); el("card-list").replaceChildren(); }
function restore() {
  for(const key of fields) el(key).value=DEFAULTS[key];
  clearPreview(); el("export-status").textContent="Only a prepared local draft can be exported. No field evidence is generated.";
  status("Waseca example restored. These are proposed words, not an actual reply.");
}
function render(packet) {
  const sections=printableKit(packet).split("\n\n").filter(s=>s.startsWith("CARD "));
  const cards=sections.map((section,index)=>{
    const lines=section.split("\n");
    const card=document.createElement("article");card.className="card";
    const owner=document.createElement("p");owner.className="owner";owner.textContent=packet.humanGates[index].owner+" / "+packet.humanGates[index].state;
    const heading=document.createElement("h3");heading.textContent=lines[0];
    const pre=document.createElement("pre");pre.textContent=lines.slice(1).join("\n");
    const warning=document.createElement("p");warning.className="warn";
    warning.textContent=index===0?"Draft only. The intended recipient has not been contacted.":index===5?"Publication remains withheld until separate permission.":"Fields are blank; human evidence is not created by this page.";
    card.append(owner,heading,pre,warning);return card;
  });
  el("card-list").replaceChildren(...cards); active=packet;printable=printableKit(packet);setReady(true);
  el("export-status").textContent="LOCAL DRAFT: prepared, not sent. A recipient must answer through their own channel; an independent reviewer must later inspect real evidence.";
}
function prepare() {
  try {
    const input=Object.fromEntries(fields.map(id=>[id,el(id).value]));
    const p=preparePacket(input);
    render(p);status("Six printable forms prepared in this tab. No request was sent, stored, signed, or acknowledged.");
  } catch(error) {
    clearPreview();
    const alert=document.createElement("p");alert.textContent="HOLD: revise the public-only draft before generating forms.";el("card-list").append(alert);
    status(error.message||"HOLD: invalid public-only text.",true);
  }
}
function save(filename,source,mime) {
  const blob=new Blob([source],{type:mime}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  el("export-status").textContent="Downloaded a LOCAL, UNSENT preparation. Nothing was forwarded or confirmed.";
}
el("form").addEventListener("submit",event=>{event.preventDefault();prepare();});
el("reset").addEventListener("click",()=>{restore();prepare();});
for(const id of fields) el(id).addEventListener("input",()=>{clearPreview();el("export-status").textContent="Changes pending. Prepare the revised packet before exporting.";});
el("print").addEventListener("click",()=>{if(!active)prepare();if(active)window.print();});
el("download").addEventListener("click",()=>{if(active)save("static-commons-first-true-yes-UNSENT.txt",printable,"text/plain;charset=utf-8");});
el("download-json").addEventListener("click",()=>{if(active)save("static-commons-UNSENT.json",JSON.stringify(active,null,2)+"\n","application/json");});
el("copy").addEventListener("click",async()=>{
  if(!active)return;
  try{await navigator.clipboard.writeText(printable);el("export-status").textContent="Copied UNSENT text locally. Nothing transmitted.";}
  catch{el("export-status").textContent="Clipboard unavailable: use Save or Print instead.";}
});
restore();prepare();
