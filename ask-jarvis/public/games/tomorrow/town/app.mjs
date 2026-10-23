// TOMORROW 002 browser-only town.
// The imported Alchematrix reducer below is source-owned and unmodified. The rest is a fictional UI.
import {readKeyFragment} from "../key.mjs";
import {TOWN_ROOMS,createTown,visitRoom,admitDonorConsequence} from "./world.mjs";
import {initialState,step,benchCapabilities} from "./alchematrix-core.mjs";
import {postymon,reality,nextQuestion,blankCard} from "../case.mjs";
const $=id=>document.getElementById(id);
const key=readKeyFragment(location.hash);
let world=createTown(key);
let donor=initialState();
let current=null;
const map=$("town-map");
const labActions=[
 {label:"✦ MINE QUARTZ",action:{type:"mine",item:"quartz"}},
 {label:"✦ MINE COPPER",action:{type:"mine",item:"copper"}},
 {label:"✦ GATHER ECHO",action:{type:"mine",item:"echo"}},
 {label:"CRAFT TELESCOPE",action:{type:"craft-telescope"}},
 {label:"ADD FREQUENCY PROBE",action:{type:"install-probe"}},
 {label:"ADD MEMORY VESSEL",action:{type:"install-memory"}},
 {label:"OBSERVE PRISM A",action:{type:"observe",target:"prismA"}},
 {label:"OBSERVE PRISM B",action:{type:"observe",target:"prismB"}},
 {label:"SOCKET INTO WORKBENCH",action:{type:"socket-telescope"}},
 {label:"CRAFT LAB QUESTION KEY",action:{type:"craft-question-key"}},
 {label:"OPEN SECOND OBSERVATORY",action:{type:"open-door"}}
];
$("key-status").textContent=key
 ? "QUESTION KEY ACCEPTED — THREE FICTIONAL CLUES RECONCILED / AUTHORITY: NONE"
 : "GUEST PASS — YOU MAY WANDER. THE WORKSHOP NEEDS A QUESTION KEY FROM THE ORIGINAL CASE.";
if(key)$("key-status").classList.add("ok");
function mk(tag,cls="",value=""){
 const e=document.createElement(tag);if(cls)e.className=cls;if(value)e.textContent=value;return e;
}
function renderMap(){
 map.replaceChildren();
 for(const room of TOWN_ROOMS){
  if(room.id==="observatory"&&!world.observatoryOpen)continue;
  const b=mk("button","place", "");
  b.type="button";b.setAttribute("aria-label","Inspect "+room.name);
  if(room.id===current)b.classList.add("active");
  if(room.id==="workshop"&&!world.hasCaseKey)b.classList.add("locked");
  if(room.id==="observatory")b.classList.add("new");
  const tag=room.id==="workshop"&&!world.hasCaseKey?"CASE KEY REQUIRED":
    room.id==="observatory"?"NEW ROAD OPEN":world.visited.includes(room.id)?"INSPECTED":"EXPLORE";
  b.append(mk("span","icon",room.icon),mk("span","name",room.name),mk("span","tag",tag));
  b.addEventListener("click",()=>inspect(room.id));map.append(b);
 }
}
function renderRoom(room,blocked){
 const view=$("room-view");view.replaceChildren();
 const kicker=mk("div","kicker",room.subtitle);const h=mk("h2","",room.name);
 const p=mk("p","",blocked?"This fictional workshop needs a Question Key. Solve the original mystery and compose the key from three distinct clues first. No real-world authority is granted.":room.description);
 view.append(kicker,h,p);
 if(blocked){
  const a=mk("a","","GO BACK AND SOLVE THE CASE →");a.href="/games/tomorrow/";
  view.append(a);return;
 }
 const quote=mk("blockquote","",room.question);view.append(quote);
 if(room.id==="observatory"){
  const l=mk("p","","The observatory opened only after the source-owned Alchematrix reducer accepted the actual in-game sequence. This local town projected the donor consequence, not a real-world event.");view.append(l);
 }
}
function inspect(id){
 const x=visitRoom(world,id);const room=x.room;
 if(!room)return;
 current=id;
 $("studio").hidden=true;$("cards-room").hidden=true;
 $("room-kind").textContent=room.kind.toUpperCase();
 renderRoom(room,!x.ok);
 if(x.ok){
  world=x.state;
  if(id==="workshop"){$("studio").hidden=false;renderLab();}
  if(id==="kitchen"||id==="post"){$("cards-room").hidden=false;renderCard();}
  $("travel-note").textContent=world.observatoryOpen?
   "THE SECOND OBSERVATORY EXISTS IN THIS LOCAL FICTIONAL WORLD. Nothing real was authorized.":
   "INSPECTED: "+world.visited.map(s=>TOWN_ROOMS.find(q=>q.id===s).name).join(" · ")+". No mandatory quests.";
 }else{
  $("travel-note").textContent=x.code+" — a fictional case key admits the workshop, not a real person.";
 }
 renderMap();
 if(window.matchMedia("(max-width:750px)").matches)$("room-view").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderLab(){
 const caps=benchCapabilities(donor);
 $("lab-state").textContent=[
  "QUARTZ: "+donor.inventory.quartz+" / COPPER: "+donor.inventory.copper+" / ECHO: "+donor.inventory.echo,
  "TELESCOPE: "+(donor.telescope?donor.telescope.capabilities.join(", "):donor.bench.instruments.length?"SOCKETED":"NOT CRAFTED"),
  "RETAINED OBSERVATIONS: "+Object.keys(donor.observations).join(", "),
  "WORKBENCH ABILITIES: "+(caps.length?caps.join(", "):"NONE"),
  "LAB QUESTION KEY: "+(donor.artifact?.id??"NONE"),
  "SECOND OBSERVATORY: "+(donor.doorOpen?"OPEN":"CLOSED"),
  "DONOR ACTION RECEIPTS: "+donor.events.length+" / FICTIONAL LOCAL ONLY"
 ].join("\n");
 const actions=$("lab-actions");actions.replaceChildren();
 for(const item of labActions){
  const b=mk("button","btn minor",item.label);b.type="button";
  b.addEventListener("click",()=>{
   try{
    donor=step(donor,item.action);
    $("lab-last").className="result";$("lab-last").textContent=donor.last;
    if(donor.doorOpen&&!world.observatoryOpen){
     const f=admitDonorConsequence(world,donor);
     if(f.ok){
      world=f.state;
      $("travel-note").textContent="A FICTIONAL LAB CONSEQUENCE CREATED AN ADDITIONAL EXPLORABLE ROAD. The Second Observatory is now on the map.";
     }
    }
    renderLab();renderMap();
   }catch(err){
    $("lab-last").className="result bad";
    $("lab-last").textContent=String(err?.message??err)+". No change was made; try another local action.";
   }
  });
  actions.append(b);
 }
}
$("lab-export").addEventListener("click",()=>{
 if(!world.hasCaseKey)return;
 download("alchematrix-local-specimen.json",JSON.stringify({
  schema:"reality2.alchematrix-local-specimen/0.2",
  donorSource:"full-measure-world-layer@587af5a8f1cb73781d1943343234d75aabd0f9c4",
  donorBlobSha:"4be97563e4cdd2ba16abd597f856dd091dddc4d4",
  authority:"none",witness:"fictional-local",canonicalAdmission:false,
  sourceState:donor,projectedTown:{observatoryOpen:world.observatoryOpen}
 },null,2));
});
$("lab-reset").addEventListener("click",()=>{
 donor=initialState();$("lab-last").className="result";
 $("lab-last").textContent="A fresh fictional specimen begins. Already projected local history has not been erased.";
 renderLab();renderMap();
});
for(const [id,arr] of [["p-select",postymon],["r-select",reality]]){
 arr.forEach(o=>{const opt=mk("option","",o.id+" — "+o.name);opt.value=o.id;$(id).append(opt)});
}
$("p-select").value="P10";$("r-select").value="R10";
function renderCard(){
 $("card-question").textContent=nextQuestion($("p-select").value,$("r-select").value);
}
$("p-select").addEventListener("change",renderCard);
$("r-select").addEventListener("change",renderCard);
$("card-save").addEventListener("click",()=>download("tomorrow-town-question-card.txt",blankCard({p:$("p-select").value,r:$("r-select").value})));
function download(name,text){
 const blob=new Blob([text],{type:name.endsWith(".json")?"application/json":"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.download=name;a.href=url;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
renderMap();
inspect("porch");
