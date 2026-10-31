import {
  SCHEMA, makeCard, makeReply, makeReport, makeReturn, validatePacket,
  fingerprint, encodePacket, decodePacket, cardOf, label
} from "./model.mjs";

const $ = id => document.getElementById(id);
const KEY = "webz/living-cards/kept-v1";
let current = null;
let revision = 0;

function say(s, error = false) { $("status").textContent = s; $("status").dataset.error=String(error); }
function item(tag, parent, value, cls) {
  const e = document.createElement(tag); if(value!==undefined)e.textContent=value;
  if(cls)e.className=cls;parent.append(e);return e;
}
function button(parent,label,fn,cls="") {
  const b = document.createElement("button");b.type="button";b.textContent=label;
  if(cls)b.className=cls;parent.append(b);b.addEventListener("click",fn);return b;
}
function packetLink(packet) {
  const url = new URL(location.href);
  url.search = ""; url.hash = "packet=" + encodePacket(packet);
  if(url.toString().length>10000)throw Error("This chain is too long for reliable link sharing. Save JSON instead.");
  return url.toString();
}
function retained() {
  try {
    const value=JSON.parse(localStorage.getItem(KEY)||"[]");
    return Array.isArray(value)?value.slice(0,12):[];
  } catch { return []; }
}
function keep() {
  if(!current)return;
  try {
    const value=[current,...retained().filter(p=>p.id!==current.id)].slice(0,12);
    localStorage.setItem(KEY,JSON.stringify(value));
    renderRetained(); say("This record was saved on this browser at your request. No server copy was made.");
  } catch {say("Browser storage is not available. Copy the link or save JSON instead.",true);}
}
async function renderRetained() {
  const root=$("local-list");root.replaceChildren();
  const records=retained();
  if(!records.length){item("p",root,"No cards deliberately saved here yet.","fine");return;}
  for(const record of records) {
    const row=item("div",root,undefined,"saved-item");
    const possible=record?.type&&record?.id&&record?.schema===SCHEMA;
    item("span",row,possible?record.type+" · "+(cardOf(record)?.title||"Unknown"):"Unreadable saved record");
    button(row,"Open",async()=> {
      try {await validatePacket(record);await show(record);say("Opened a record saved on this browser.");}
      catch(e){say(e.message||"Stored record invalid.",true);}
    },"quiet");
  }
}
function downloadPacket(){
  if(!current)return;
  const file = new Blob([JSON.stringify(current,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(file),a=document.createElement("a");
  a.href=url;a.download="living-card-"+current.type.toLowerCase()+"-"+current.id.slice(0,8)+".json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  say("Saved the unsigned record. Keep it private if its contents are private.");
}
async function copyLink(){
  if(!current)return;
  try {const url=packetLink(current);
    if(!navigator.clipboard?.writeText)throw Error("Clipboard permission unavailable.");
    await navigator.clipboard.writeText(url);
    say("Link copied. You choose who receives it; nothing was posted publicly.");
  } catch { $("link").focus();$("link").select();say("Copy the selected link manually (long-press on phone).");}
}
async function shareLink() {
  if(!current)return;
  const url=packetLink(current);
  try {
    if(!navigator.share)throw Error("No native share menu.");
    await navigator.share({title:"Living Cards · "+cardOf(current).title,text:"A portable, unsigned field card / reply",url});
    say("Share sheet closed. This app cannot confirm whether a message was delivered.");
  } catch {await copyLink();}
}
function actionForm(root,source,asReport) {
  const form=item("form",root);
  const heading=item("h3",form,asReport?"Record what happened":"Send a reply");
  const desc=item("p",form,asReport ?
    "This is your own account of events, not proof of a handoff. Report only something that actually happened." :
    "Pick one reply. You'll receive a return link to send back through the same channel.");
  if(!asReport) {
    const choices=item("div",form,undefined,"actions");
    const notes=item("label",form,"Optional note (180 characters)");
    const textarea=item("textarea",notes);textarea.maxLength=180;textarea.rows=3;textarea.placeholder="I can look for one / could you clarify the size?";
    for (const [kind,text] of [["CAN_HELP","I can help"],["INTERESTED","I'm interested"],["QUESTION","Question"],["PASS","Pass"]]) {
      button(choices,text,async()=>{
        try {const packet=await makeReply(cardOf(source),kind,textarea.value);await show(packet);
          say("Reply card created. Share its link back to the original person. Nothing was sent automatically.");}
        catch(e){say(String(e.message||e),true);}
      },kind==="PASS"?"quiet":"secondary");
    }
    form.addEventListener("submit",e=>e.preventDefault());
    return;
  }
  const choose=item("label",form,"What actually happened?");
  const sel=item("select",choose);
  for(const [k,v] of [["DONE","The action happened"],["PARTIAL","Something happened, but not all"],["NOT_DONE","The planned action did not happen"]]){
    const opt=item("option",sel,v);opt.value=k;
  }
  const noteLabel=item("label",form,"Describe the observable result (3–200 characters)");
  const textarea=item("textarea",noteLabel);textarea.rows=3;textarea.required=true;textarea.maxLength=200;
  textarea.placeholder="I placed one chair at the agreed location. Recipient has not confirmed.";
  button(form,"Create an unsigned report →",async()=>{
    try {const report=await makeReport(source,sel.value,textarea.value);await show(report);
      say("Self-reported outcome prepared. Send the report link to someone who can independently confirm or dispute it.");}
    catch(e){say(e.message||"Could not make report.",true);}
  },"primary");
  form.addEventListener("submit",e=>e.preventDefault());
}
function renderActions(packet){
  const root=$("actions");root.replaceChildren();
  if(packet.type==="CARD"){
    const title=item("h3",root,"Does this card lead somewhere?");
    item("p",root,"If you received this card, you can make a portable reply. If you performed an action yourself, you can record it without pretending that someone else witnessed it.");
    actionForm(root,packet,false);
    const aside=item("div",root,undefined,"callout");
    item("strong",aside,"Already did something?");
    actionForm(aside,packet,true);
  } else if(packet.type==="REPLY"){
    item("h3",root,"A response exists. Now reality decides.");
    item("p",root,"Reply: "+packet.response+(packet.note?" — "+packet.note:""));
    item("p",root,"This is not a reserved item, binding deal, verified identity or confirmed action.","tip");
    actionForm(root,packet,true);
    const row=item("div",root,undefined,"actions");
    button(row,"Open original card",()=>show(packet.card),"quiet");
  } else if(packet.type==="REPORT"){
    item("h3",root,"Someone has reported an outcome.");
    item("p",root,"Reported: "+packet.outcome+" — "+packet.note);
    item("p",root,"A second person can independently confirm or dispute this statement. Neither option verifies identities or establishes legal custody.","tip");
    const labelElement=item("label",root,"Optional note for the return");
    const txt=item("textarea",labelElement);txt.maxLength=180;txt.rows=2;
    const row=item("div",root,undefined,"actions");
    for(const [choice,name] of [["CONFIRMED","I confirm this report"],["DISPUTED","I dispute / can't verify"]]){
      button(row,name,async()=>{
        try{const result=await makeReturn(packet,choice,txt.value);await show(result);
          say("Unsigned return prepared. Share this link back to the person who recorded the outcome.");}
        catch(e){say(e.message||"Unable to make return.",true);}
      },choice==="CONFIRMED"?"primary":"quiet");
    }
    button(row,"Open the original card",()=>show(packet.card),"secondary");
  } else {
    item("h3",root,packet.decision==="CONFIRMED"?"An unsigned second confirmation was returned.":"The report was disputed.");
    item("p",root,"Report: "+packet.report.outcome+" — "+packet.report.note);
    item("p",root,"Return: "+packet.decision+(packet.note?" — "+packet.note:""));
    item("p",root,"This records two linked human assertions, NOT identity verification, a paid sale, ownership, physical custody, or established truth.","tip");
    const row=item("div",root,undefined,"actions");
    button(row,"Inspect underlying report",()=>show(packet.report),"secondary");
    button(row,"Open original card",()=>show(packet.report.card),"quiet");
  }
}
async function show(packet){
  await validatePacket(packet);
  const mine=++revision;const hash=await fingerprint(packet);
  if(mine!==revision)return;
  current=packet;
  const card=cardOf(packet);
  const url=packetLink(packet);
  history.replaceState(null,"",url);
  $("viewer").hidden=false;
  $("card-type").textContent=packet.type;
  $("card-kind").textContent=card.kind==="HAVE"?"I HAVE":card.kind==="NEED"?"I NEED":"I CAN";
  $("card-title").textContent=card.title;
  $("card-detail").textContent=card.detail||"No extra description supplied.";
  $("card-area").textContent=card.area;
  $("card-deadline").textContent=card.deadline?new Date(card.deadline).toLocaleString():"Not set";
  $("card-state").textContent=label(packet);
  $("short-id").textContent=card.id.slice(0,8)+"…";
  $("packet-context").textContent=packet.type==="CARD"?"This is a person's description, not a verified listing. It is only shared when someone carries this link.":
    packet.type==="REPLY"?"This response is self-attested; send the link back to the original sender.":
    packet.type==="REPORT"?"An event has been reported, not independently confirmed.":"The return is self-attested. Compare what each participant actually reports.";
  $("packet-note").textContent=packet.type==="REPLY"?"Reply: "+packet.response+" · "+(packet.note||"No note"):
    packet.type==="REPORT"?"Outcome: "+packet.outcome+" · "+packet.note:
    packet.type==="RETURN"?"Return: "+packet.decision+" · "+(packet.note||"No note"):"";
  $("fingerprint").textContent="Record fingerprint SHA-256: "+hash.slice(0,20)+"… · detects accidental changes, does not authenticate anybody.";
  $("link").value=url;
  renderActions(packet);
  $("viewer").scrollIntoView({behavior:"smooth",block:"start"});
}
$("new-card").addEventListener("submit",async e=>{
  e.preventDefault();
  try{const f=new FormData(e.currentTarget);const card=makeCard({
    kind:f.get("kind"),title:f.get("title"),detail:f.get("detail"),area:f.get("area"),
    deadline:f.get("deadline"),consent:f.get("consent")==="on"
  });await show(card);say("Card created locally. Copy or share the link when you're ready.");}
  catch(err){say(err.message||"Unable to create card.",true);}
});
$("demo").addEventListener("click",async()=>{
  try {const card=makeCard({kind:"HAVE",title:"[FICTIONAL] One folding chair",detail:"Demonstration only. Nobody is actually offering a chair.",area:"Example town · fictional",deadline:"",consent:true});
  await show(card);say("Fictional card only. Use the form to describe a real object or need.");}
  catch(e){say(e.message,true);}
});
$("open-link").addEventListener("click",async()=>{
  try {const raw=$("paste").value.trim();const u=new URL(raw,location.href);
    const t=u.hash.startsWith("#packet=")?u.hash.slice(8):"";
    if(!t)throw Error("Paste a Living Cards link with a #packet= fragment.");
    const obj=await decodePacket(t);await show(obj);say("Opened a portable record. Its content is not authenticated.");}
  catch(e){say(e.message||"Invalid link.",true);}
});
$("file").addEventListener("change",async e=>{
  try{const file=e.currentTarget.files?.[0];if(!file)return;
    if(file.size>18000||file.size<10)throw Error("Choose a small Living Cards JSON file (under 18 KB).");
    const obj=JSON.parse(await file.text());await show(obj);say("Opened local file. Nothing was uploaded.");}
  catch(e){say(e.message||"Invalid file.",true);}finally{e.currentTarget.value="";}
});
$("copy").addEventListener("click",copyLink);
$("share").addEventListener("click",shareLink);
$("download").addEventListener("click",downloadPacket);
$("print").addEventListener("click",()=>window.print());
$("save-local").addEventListener("click",keep);
$("new").addEventListener("click",()=>{
  revision++;current=null;$("viewer").hidden=true;
  history.replaceState(null,"",location.pathname);$("make").scrollIntoView({behavior:"smooth"});
  say("Ready for a new card. Your earlier link still exists wherever you shared or saved it.");
});
$("clear-local").addEventListener("click",()=>{
  try{localStorage.removeItem(KEY);renderRetained();say("Optional saved browser list cleared. Shared links and downloaded files cannot be revoked here.");}
  catch{say("Unable to access browser storage.",true);}
});
window.addEventListener("hashchange",async()=>{
  if(!location.hash.startsWith("#packet="))return;
  try {const token=location.hash.slice(8);const obj=await decodePacket(token);await show(obj);}
  catch(e){say(e.message||"Unable to open linked record.",true);}
});
renderRetained();
if(location.hash.startsWith("#packet=")){
  decodePacket(location.hash.slice(8)).then(x=>show(x)).then(()=>say("Opened a portable field card. Inspect it before acting."))
    .catch(e=>say("Could not open this card: "+e.message,true));
} else say("Make a card or open one someone shared. Nothing is published automatically.");
