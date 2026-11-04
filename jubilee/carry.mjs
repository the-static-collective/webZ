// Account-free, user-initiated handoff of actual prepared Jubilee work.
// Export is local and unsigned. No upload, receiver admission or auto-verification.
import {createCard,exportCard} from "../first-circle/core.mjs";

export function installCarry() {
 const moment=document.getElementById("jubilee-moment");
 const actions=moment.querySelector(".actions");
 const title=moment.querySelector("#jubilee-moment-title");
 const body=moment.querySelector("#jubilee-moment-next");
 const status=moment.querySelector("#jubilee-moment-status");
 const carry=document.createElement("button");
 carry.type="button";
 carry.id="jubilee-carry";
 carry.className="button";
 carry.textContent="Carry this prepared work into First Circle ↓";
 actions.append(carry);
 const door=document.createElement("a");
 door.id="jubilee-carried-door";
 door.href="../first-circle/";
 door.className="button";
 door.textContent="Open First Circle ↗";
 door.hidden=true;
 actions.append(door);
 carry.addEventListener("click",async()=>{
  if(moment.hidden||!body.textContent.trim()) {
   status.textContent="Prepare a field kit first.";return;
  }
  try {
   const work={title:title.textContent.slice(0,100),body:body.textContent,status:"BOUNDED_GUIDE"};
   const record=createCard("offer",work.title,
     "The full usable kit is already attached. Report only what happened after use.",work);
   const packet=await exportCard(record);
   const file=new Blob([JSON.stringify(packet,null,2)+"\n"],{type:"application/json"});
   const url=URL.createObjectURL(file);
   const a=document.createElement("a");a.href=url;a.download="jubilee-first-circle-"+record.id.slice(0,8)+".json";
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
   door.hidden=false;
   status.textContent="Complete kit exported. Import that file in First Circle to report what happens. No account or sending.";
  }catch(error){status.textContent="Unable to prepare the card: "+error.message;}
 });
}
