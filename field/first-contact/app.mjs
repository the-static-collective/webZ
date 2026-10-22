import {
  PROJECT, PROJECT_ID, DOORS, doorById, createLocalReturn,
  validateLocalReturn, readPublicDoor, paperCards, publicDoorLink, printGate
} from "./core.mjs";

const el=id=>document.getElementById(id);
const buttons=[...document.querySelectorAll("button[data-door]")];
let chosen=null;
let localReturn=null;
const showMessage=(t,bad=false)=>{
  el("message").textContent=t;
  el("message").classList.toggle("error",bad);
};
function choose(doorId,writeAddress=true){
  const door=doorById(doorId);
  if(!door){showMessage("This option is not supported.",true);return;}
  chosen=door.id;
  localReturn=null;
  el("answer").hidden=false;
  el("answer-title").textContent=door.title;
  el("door-question").textContent=door.question;
  el("door-explanation").textContent=door.reply;
  el("note").value="";
  el("understand").checked=false;
  el("receipt").hidden=true;
  showMessage("");
  for(const b of buttons)b.setAttribute("aria-pressed",String(b.dataset.door===chosen));
  if(writeAddress){
    // Only stable, public option keys are ever encoded in a URL.
    history.replaceState(null,"","#"+new URLSearchParams({
      project:PROJECT_ID,door:chosen
    }).toString());
  }
  el("answer").scrollIntoView({behavior:"smooth",block:"start"});
}
function erase(){
  chosen=null;
  localReturn=null;
  el("answer").hidden=true;
  el("note").value="";
  el("understand").checked=false;
  el("receipt").hidden=true;
  showMessage("");
  for(const b of buttons)b.setAttribute("aria-pressed","false");
  history.replaceState(null,"",location.pathname+location.search);
}
for(const button of buttons){
  button.setAttribute("aria-pressed","false");
  button.addEventListener("click",()=>choose(button.dataset.door));
}
el("save").addEventListener("click",()=>{
  if(!chosen){showMessage("Choose a door first.",true);return;}
  try{
    const result=createLocalReturn({
      door:chosen,note:el("note").value,acknowledged:el("understand").checked
    });
    localReturn=validateLocalReturn(result);
    el("receipt").hidden=false;
    el("receipt-message").textContent=
      "Only a local note exists. No organizer or recipient has received it. " +
      "You may export it for your own review, or erase it.";
    showMessage("Local draft prepared. Nothing was sent.");
  }catch(error){
    localReturn=null;el("receipt").hidden=true;showMessage(error.message,true);
  }
});
el("clear").addEventListener("click",erase);
el("erase").addEventListener("click",()=>{
  localReturn=null;
  el("note").value="";
  el("understand").checked=false;
  el("receipt").hidden=true;
  showMessage("Local note erased from this page. Nothing was sent.");
});
el("note").addEventListener("input",()=>{
  // Editing an already prepared note invalidates that exact draft.
  localReturn=null;el("receipt").hidden=true;
});
el("download").addEventListener("click",()=>{
  if(!localReturn){showMessage("There is no local note to export.",true);return;}
  try{
    const safe=validateLocalReturn(localReturn);
    const blob=new Blob([JSON.stringify(safe,null,2)+"\n"],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="first-contact-unsent-draft.json";
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),800);
    showMessage("Saved as a file on this device. It has not been sent to anyone.");
  }catch(error){showMessage(error.message,true);}
});

function cell(tag,className,text){
  const n=document.createElement(tag);
  if(className)n.className=className;
  if(text!==undefined)n.textContent=String(text);
  return n;
}
function qrIn(holder,link){
  if(typeof window.QRCode!=="function")return false;
  try{
    new window.QRCode(holder,{
      text:link,width:122,height:122,colorDark:"#142d2b",
      colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.M
    });
    return true;
  }catch(error){
    holder.replaceChildren();
    return false;
  }
}
function printOne(door,gate,base){
  const article=cell("article","print-card");
  const side=cell("div","print-top");
  side.append(cell("div","print-rubric","THE LIVING COMMONS  /  028"),
    cell("div","print-small","A PLACE TO COME BACK TO"));
  article.append(side,cell("h2","print-title",door.title));
  article.append(cell("p","print-question",door.question));
  const middle=cell("div","print-middle");
  const qr=cell("div","print-qr");
  if(gate.canPrintQR){
    const link=publicDoorLink(base,door.id);
    if(!qrIn(qr,link)){
      qr.append(cell("strong","print-placeholder","QR UNAVAILABLE"));
    }else{
      middle.append(cell("p","print-link",link));
    }
  }else{
    qr.append(cell("div","qr-ghost","↗"));
    middle.append(cell("p","print-unscannable","PRINT PROOF ONLY · NO SCANNABLE ADDRESS"));
  }
  middle.prepend(qr);article.append(middle);
  article.append(cell("div","print-boundary",gate.label),
    cell("div","print-legal","No account. No promise. Not a live assistance or publication service."));
  return article;
}
function preparePrint(){
  const base=el("print-url").value.trim();
  let gate;
  try{
    gate=printGate(base,location.href,el("operator-tested").checked);
  }catch(error){
    gate={canPrintQR:false,stage:"UNTESTED_PRINT_PROOF",
      label:"PROTOTYPE · QR WITHHELD UNTIL SECOND-DEVICE TEST"};
  }
  // Fail closed for unusable QR renderer, but still allow a plain paper proof.
  if(gate.canPrintQR && typeof window.QRCode!=="function"){
    gate={canPrintQR:false,stage:"QR_LIBRARY_UNAVAILABLE",
      label:"PROTOTYPE · QR RENDERER UNAVAILABLE"};
  }
  const layout=el("layout").value==="4"?4:9;
  const seeds=paperCards();
  const sheet=el("print-sheet");
  sheet.replaceChildren();
  sheet.className="print-sheet layout-"+layout;
  for(let i=0;i<layout;i++)sheet.append(printOne(seeds[i%seeds.length],gate,base));
  el("print-status").textContent=
    (gate.canPrintQR?"Local operator has attested to the scanned address. "+
    "This is still an independent prototype, not an approved deployment.":
    "Only a non-scannable print proof was prepared; the QR is intentionally withheld.")+
    " Layout: "+layout+"-up US Letter.";
  setTimeout(()=>window.print(),450);
}
el("print").addEventListener("click",preparePrint);
// The page cannot independently attest a second phone's scan.
// Never auto-tick operator confirmation, even on a live HTTPS origin.
if(location.protocol==="https:"||location.protocol==="http:"){
  el("print-url").value=location.href.split("#")[0].split("?")[0];
}
try{
  if(location.hash)choose(readPublicDoor(location.hash),false);
}catch{
  // Invalid fragments are not interpreted as personal data or actions.
  history.replaceState(null,"",location.pathname+location.search);
}
