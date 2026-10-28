import {draftNeed,compareRoutes,draftPacket} from "../exchange.mjs";
import {inspectPacket,makeReceiverResponse,makeFieldReport} from "../receiver-protocol.mjs";
const $=id=>document.getElementById(id);
let inspected=null,response=null,report=null,synthetic=false;
function say(msg,bad=false){$("status").textContent=msg;$("status").dataset.kind=bad?"error":"";}
function saveJson(data,name){
  const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function reset(){
  inspected=response=report=null;synthetic=false;
  $("packetText").value="";$("packetFile").value="";
  for(const id of ["inspection","decisionSection","decisionResult","reportSection","reportResult"])$(id).hidden=true;
  $("decisionForm").reset();$("reportForm").reset();
  $("responseJson").textContent="";$("reportJson").textContent="";
  say("Cleared from this tab. No network transmission or browser storage occurred.");
}
async function inspect(raw){
  try{
    const found=await inspectPacket(raw);
    inspected=found;response=report=null;
    $("inspection").hidden=false;$("decisionSection").hidden=!found.actionable;
    $("decisionResult").hidden=true;$("reportSection").hidden=true;$("reportResult").hidden=true;
    $("kind").textContent=(synthetic?"SYNTHETIC SAMPLE · ":"")+
      found.kind.toUpperCase().replaceAll("-"," ")+" · UNVERIFIED";
    $("heading").textContent=found.heading;
    $("region").textContent=found.region+" · "+found.origin;
    $("detail").textContent=found.detail;
    $("packetId").textContent=found.packet_id;
    $("sourceLink").hidden=!found.sourceRef;
    if(found.sourceRef){
      $("sourceLink").replaceChildren();
      const a=document.createElement("a");
      a.textContent="Open source issue (not permission) ↗";a.href=found.sourceRef;
      a.target="_blank";a.rel="noopener noreferrer";$("sourceLink").append(a);
    }
    if(found.unit)$("reportForm").elements.unit.value=found.unit;
    say(found.actionable?"Packet inspected. Choose HOLD, REFUSE, or accept for LOCAL REVIEW only.":
      "Response or report inspected as an unsigned claim. It cannot be admitted or used to grant credit.");
  }catch(error){
    inspected=response=report=null;
    for(const id of ["inspection","decisionSection","decisionResult","reportSection","reportResult"])$(id).hidden=true;
    say(error.message,true);
  }
}
$("inspect").addEventListener("click",()=>{synthetic=false;inspect($("packetText").value);});
$("packetFile").addEventListener("change",async e=>{
  const f=e.currentTarget.files?.[0];if(!f)return;
  if(f.size>16384){say("Packet exceeds 16 KB limit.",true);return;}
  synthetic=false;
  const contents=await f.text();$("packetText").value=contents;
  await inspect(contents);
});
$("sample").addEventListener("click",async()=>{
  const n=draftNeed({region:"Waseca–Mankato (fictional example)",category:"food",
    summary:"Thirty shelf-stable parcels requested for a hypothetical local pantry",
    quantity:30,unit:"parcels",window:"7-days"});
  const c=compareRoutes([
    {route:"local-purchase",estimatedUSD:120,reviewed:false},
    {route:"remote-donation",estimatedUSD:"",reviewed:false,importCleared:false},
    {route:"knowledge-transfer",estimatedUSD:"",reviewed:false}
  ]);
  const p=draftPacket(n,c);synthetic=true;
  $("packetText").value=JSON.stringify(p,null,2);
  await inspect(p);
});
$("reset").addEventListener("click",reset);
$("decisionForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!inspected)return;
  try{
    const f=e.currentTarget.elements;
    response=await makeReceiverResponse(inspected,{
      decision:f.decision.value,reviewer_role:f.reviewer_role.value,
      reason:f.reason.value,attestation:f.attestation.checked
    });
    $("decisionResult").hidden=false;
    $("responseJson").textContent=JSON.stringify(response.packet,null,2);
    $("reportSection").hidden=response.packet.decision!=="ACCEPT_FOR_LOCAL_REVIEW";
    $("reportResult").hidden=true;report=null;
    say("Self-attested review response prepared. No dispatch, signature or verified service.");
  }catch(error){say(error.message,true);}
});
$("reportForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!inspected||!response)return;
  try{
    const f=e.currentTarget.elements;
    report=await makeFieldReport(inspected,response,{
      field_status:f.field_status.value,quantity_reported:f.quantity_reported.value,
      unit:f.unit.value,summary:f.summary.value,attestation:f.attestation.checked
    });
    $("reportJson").textContent=JSON.stringify(report.packet,null,2);
    $("reportResult").hidden=false;
    say("Unverified field report prepared. Independent recipient confirmation remains missing.");
  }catch(error){say(error.message,true);}
});
$("downloadResponse").addEventListener("click",()=>{
 if(response)saveJson(response.packet,"porchlight-receiver-hold-response.json");
});
$("downloadReport").addEventListener("click",()=>{
 if(report)saveJson(report.packet,"porchlight-field-report-unverified.json");
});
$("printResponse").addEventListener("click",()=>{if(response)window.print();});
$("printReport").addEventListener("click",()=>{if(report)window.print();});
