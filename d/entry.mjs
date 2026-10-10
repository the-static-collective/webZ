import {doorIds,issueDoor,verifyDoor} from "./apps/pocket-door/pocket-core.mjs";
import {publicDoorPath,publicTextInvite,openGroEncounter,localEntrance,makeDoorBundle,verifyDoorBundle,offlineDoorRoom,ENTRANCES} from "./crossing.mjs";
const $=id=>document.getElementById(id);
const id=location.pathname.match(/\/d\/(MOSS-042|ROSEMARY-001|LIGHT-KEEP-003)\/(?:index\.html)?$/)?.[1]||null;
let door=null,bundle=null,entered=false,pending=false;
const status=(message,error=false)=>{$("status").textContent=message;$("status").dataset.error=String(error)};
function download(name,data,type="application/json"){
 const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),800);
}
async function copy(raw){
 $("manual-copy").value=raw;
 try{await navigator.clipboard.writeText(raw);status("COPIED · YOU CHOOSE WHETHER TO SHARE")}
 catch{$("manual-copy").select();status("CLIPBOARD BLOCKED · COPY THE TEXT BELOW",true)}
}
async function run(fn) {
 if(pending)return;
 pending=true;
 try{await fn()}catch(e){status("HOLD · "+(e?.message||"INVALID_DATA"),true)}
 finally{pending=false;sync()}
}
function sync(){
 $("door-title").textContent=door?.body.title??"A closed little world";
 $("invitation").textContent=door?.body.invitation??"You may open this door. You may also leave it closed.";
 $("digest").textContent=door?.digest??"No door has been accepted.";
 $("field-status").textContent=entered?"GrO actor-local ENCOUNTER · NO PUBLIC TRACE":"HOLD · no encounter created";
 $("enter").disabled=!id||entered;
 $("carry-link").disabled=!door;
 $("carry-json").disabled=!door;
 $("carry-html").disabled=!entered;
 $("compose").disabled=!entered||!$("share-consent").checked;
 $("save-door").disabled=!door;
 $("save-bundle").disabled=!bundle;
 $("save-rootline").disabled=!bundle;
 $("carry-bundle").disabled=!bundle;
 $("rootline-message").textContent=bundle?.rootline?.origin?.message??"No ROOTLINE encouragement attached. No reply needed.";
 $("bundle-hash").textContent=bundle?.binding??"No separate encouragement is carried.";
}
async function paint(){
 if(!entered||!door)return;
 const view=await localEntrance(door,$("entrance").value,Number($("detail").value));
 $("room-title").textContent=view.title;
 $("room-text").textContent=view.text??"Raise the detail dial to discover this authored entrance.";
 $("detail-label").textContent=view.depth+"/10";
}
$("enter").addEventListener("click",()=>run(async()=>{
 if(!id)throw Error("UNKNOWN_WORLD_ADDRESS");
 const proposal=await issueDoor(id);
 const encounter=await openGroEncounter(proposal);
 if(encounter.field.affordances.at(-1).kind!=="encounter")throw Error("NOT_A_GRO_ENCOUNTER");
 door=proposal;entered=true;
 await paint();
 status("LOCAL GrO ENCOUNTER VERIFIED · ENTER, KEEP, OR LEAVE");
}));
$("entrance").addEventListener("change",()=>void run(paint));
$("detail").addEventListener("input",()=>void run(paint));
$("carry-link").addEventListener("click",()=>{
 if(!door)return;
 void run(async()=>{
  const url=new URL("./",location.href);
  if(url.protocol!=="https:")throw Error("NO_PUBLIC_HTTPS_ADDRESS");
  await copy(publicTextInvite(door,url.href));
 });
});
$("carry-json").addEventListener("click",()=>{if(door)void copy(JSON.stringify(door))});
$("save-door").addEventListener("click",()=>{
 if(door)download("gro-"+door.body.id+"-door.json",JSON.stringify(door,null,2)+"\n");
});
$("carry-html").addEventListener("click",()=>run(async()=>{
 if(!door||!entered)throw Error("LOCAL_ENCOUNTER_REQUIRED");
 const html=await offlineDoorRoom(door,$("entrance").value,Number($("detail").value));
 download("gro-"+door.body.id+"-"+$("entrance").value+".html",html,"text/html");
 status("OFFLINE ROOM EXPORTED · NO SERVER REQUIRED TO OPEN");
}));
$("share-consent").addEventListener("change",sync);
$("compose").addEventListener("click",()=>run(async()=>{
 if(!entered||!door||!$("share-consent").checked)throw Error("VOLUNTARY_PUBLIC_SHARING_REQUIRED");
 bundle=await makeDoorBundle(door.body.id,$("encouragement").value);
 $("share-consent").checked=false;
 status("ROOTLINE ORIGIN LINKED TO DOOR · NOT SENT, STORED OR PUBLISHED");
}));
$("carry-bundle").addEventListener("click",()=>{if(bundle)void copy(JSON.stringify(bundle))});
$("save-bundle").addEventListener("click",()=>{
 if(bundle)download("door-"+bundle.door.body.id+"-rootline.json",JSON.stringify(bundle,null,2)+"\n");
});
$("save-rootline").addEventListener("click",()=>{
 if(bundle)download("rootline-from-"+bundle.door.body.id+".json",JSON.stringify(bundle.rootline,null,2)+"\n");
});
$("import-file").addEventListener("change",event=>run(async()=>{
 bundle=null;const file=event.target.files?.[0];if(!file)return;
 if(file.size>9500)throw Error("BUNDLE_TOO_LARGE");
 const loaded=await verifyDoorBundle(await file.text());
 if(id!==loaded.door.body.id)throw Error("BUNDLE_FOR_DIFFERENT_DOOR");
 bundle=loaded;door=await verifyDoor(loaded.door);
 entered=true;await paint();event.target.value="";
 status("CARRIED DOOR + ROOTLINE VERIFIED · NO AUTHOR SIGNATURE");
}));
$("import-paste").addEventListener("click",()=>run(async()=>{
 bundle=null;const loaded=await verifyDoorBundle($("bundle-paste").value.trim());
 if(id!==loaded.door.body.id)throw Error("BUNDLE_FOR_DIFFERENT_DOOR");
 bundle=loaded;door=await verifyDoor(loaded.door);
 entered=true;await paint();
 status("PASTED DOOR + ROOTLINE VERIFIED · KEEPING IS ENOUGH");
}));
$("close").addEventListener("click",()=>{
 entered=false;door=null;bundle=null;$("encouragement").value="";
 $("bundle-paste").value="";$("manual-copy").value="";$("share-consent").checked=false;
 $("room-title").textContent="The closed threshold";$("room-text").textContent="Nothing has been opened.";
 status("CLOSED · THIS PAGE'S ENCOUNTER WAS CLEARED");sync();
});
for(const name of ENTRANCES){const opt=document.createElement("option");opt.value=name;opt.textContent=name[0].toUpperCase()+name.slice(1);$("entrance").append(opt)}
$("door-address").textContent=id??"UNKNOWN";
if(!id){status("UNKNOWN WORLD DOOR · FAIL CLOSED",true);$("enter").disabled=true}
sync();
