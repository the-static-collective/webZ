
import {draftNeed,compareRoutes,draftPacket} from "./exchange.mjs";
const form=document.querySelector("#exchange-form");
const result=document.querySelector("#result");
const status=document.querySelector("#status");
const download=document.querySelector("#download");
const print=document.querySelector("#print");
let lastPacket=null;
function say(message,kind="") {status.textContent=message;status.dataset.kind=kind;}
function money(id){return document.getElementById(id).value;}
function checked(id){return document.getElementById(id).checked;}
form.addEventListener("submit",event=>{
  event.preventDefault();download.disabled=true;print.disabled=true;lastPacket=null;
  try{
    const need=draftNeed({
      region:form.elements.region.value,category:form.elements.category.value,
      summary:form.elements.summary.value,quantity:form.elements.quantity.value,
      unit:form.elements.unit.value,window:form.elements.window.value
    });
    const comparison=compareRoutes([
      {route:"local-purchase",estimatedUSD:money("local-cost"),reviewed:checked("local-reviewed")},
      {route:"remote-donation",estimatedUSD:money("import-cost"),reviewed:checked("import-reviewed"),importCleared:checked("import-cleared")},
      {route:"knowledge-transfer",estimatedUSD:money("knowledge-cost"),reviewed:checked("knowledge-reviewed")}
    ]);
    lastPacket=draftPacket(need,comparison);
    result.textContent=JSON.stringify(lastPacket,null,2);
    download.disabled=false;print.disabled=false;
    const cheapest=comparison.lowestStatedEligible;
    say(cheapest?
      "Draft HOLD card built. Lowest eligible stated estimate: "+cheapest.replaceAll("-"," ")+". Human review required.":
      "Draft HOLD card built. No comparison is eligible yet; obtain costs and local reviews first.");
  }catch(error){result.textContent="No packet produced.";say(error.message,"error");}
});
download.addEventListener("click",()=>{
  if(!lastPacket)return;
  const blob=new Blob([JSON.stringify(lastPacket,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download="porchlight-commons-hold-draft.json";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
print.addEventListener("click",()=>{if(lastPacket)window.print();});
document.querySelector("#clear").addEventListener("click",()=>{
  lastPacket=null;form.reset();result.textContent="No draft created.";download.disabled=true;print.disabled=true;
  say("Cleared from this page. Nothing was transmitted or saved.");
});
