// This DOM module is local-only. It neither contacts a service nor signs anyone up.
import {STATIONS,forkFestival} from "./festival-forks.mjs";
const $=id=>document.getElementById(id);
let last=null;
for(const station of STATIONS){
 const card=document.createElement("label");card.className="station";
 const input=document.createElement("input");input.type="checkbox";input.name="station";input.value=station.id;
 const label=document.createElement("span");label.textContent=station.label;label.style.fontWeight="700";
 const detail=document.createElement("small");detail.textContent=station.contribution;
 card.append(input,label,detail);$("station-list").append(card);
}
function tell(message){$("message").textContent=message;}
function line(text,cls){
 const el=document.createElement("p");if(cls)el.className=cls;el.textContent=text;return el;
}
function safeName(text){const a=document.createElement("strong");a.textContent=text;return a;}
$("propose").addEventListener("click",async()=>{
 const stations=[...document.querySelectorAll('input[name="station"]:checked')].map(x=>x.value);
 try{
  last=await forkFestival({venue:$("venue").value,stations,time:$("time").value});
  const mount=$("result");mount.replaceChildren();
  const heading=document.createElement("h3");heading.textContent="A proposal, not a registration";mount.append(heading);
  if(stations.length===0)mount.append(line("You can participate just by observing. No station was selected."));
  for(const station of last.chosenPublicStations){
   const p=document.createElement("p");p.append(safeName(station.label+" — "),document.createTextNode(station.proposedWork));mount.append(p);
  }
  const end=document.createElement("h3");end.textContent=last.branches.length===2?"Two independently governed successor ideas":"One independently governed successor idea";mount.append(end);
  for(const branch of last.branches)mount.append(line(branch.venueOption.replaceAll("_"," ")+": "+branch.proposal));
  mount.append(line("Every future group needs a distinct organizer, real consent, independent venue permission, a viable budget and an appropriate safety plan. All remain HOLD.","border"));
  $("proof").textContent=JSON.stringify(last,null,2);
  $("save").disabled=false;$("print").disabled=false;
  tell("Public-only local proposal generated. No contact, volunteer enrollment, permit, ticket or venue booking was made.");
 }catch(err){last=null;$("save").disabled=true;$("print").disabled=true;$("proof").textContent="HOLD: invalid choices";$("result").replaceChildren();tell("Proposal not generated: "+String(err));}
});
$("save").addEventListener("click",()=>{
 if(!last)return;
 const blob=new Blob([JSON.stringify(last,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");
 a.download="festival-fork-011-public-proposal-HOLD.json";a.href=url;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 tell("Only a public-safe JSON proposal was saved to this device. Nothing was submitted.");
});
$("print").addEventListener("click",()=>{if(last)window.print();});
