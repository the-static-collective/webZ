import {allDoors,door,draftFor} from "../network/model.mjs";
import {TYPES,emptyJournal,appendEvent,historyFor,summarize,queue} from "./ledger.mjs";
import {createVault,unlockVault,resealVault,validateEnvelope} from "./vault.mjs";
import {readVault,writeVault} from "./store.mjs";
import {WORK_ACTIONS,buildWorkCard} from "./work-card.mjs";
const $=id=>document.getElementById(id);
const wanted=new URLSearchParams(location.search).get("door");
let active=allDoors.some(d=>d.id===wanted)?wanted:"voqal";
let key=null,envelope=null,journal=emptyJournal(),busy=false,lastUse=Date.now(),background=null;
const labelFor=Object.fromEntries(TYPES);
const workLabels=Object.fromEntries(WORK_ACTIONS);
for(const [value,label] of WORK_ACTIONS){const op=document.createElement("option");op.value=value;op.textContent=label;$("work-action").append(op)}
$("work-action").value="VERIFY_ELIGIBILITY";
function message(s,error=false){$("status").textContent=s;$("status").dataset.error=String(error)}
function element(tag,content,cls){const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;return e}
async function run(fn){if(busy)throw Error("Another journal operation is in progress.");busy=true;try{return await fn()}finally{busy=false}}
function clearPasswords(){for(const el of document.querySelectorAll('input[type="password"]'))el.value=""}
async function welcome(){
 const exists=!!await readVault();
 $("welcome").hidden=false;$("desk").hidden=true;
 $("create-form").hidden=exists;$("unlock-form").hidden=!exists;
 $("restore-form").hidden=true;$("welcome-title").textContent=exists?"Unlock your private ledger":"Create a private operator ledger";
}
function lock(note="Journal locked. Local ciphertext remains on this device."){
 key=null;envelope=null;journal=emptyJournal();busy=false;clearPasswords();
 $("history").replaceChildren();$("queue").replaceChildren();
 welcome().catch(e=>message(e.message,true));message(note);
}
function opened(result){
 key=result.key;envelope=result.envelope;journal=result.journal;lastUse=Date.now();
 clearPasswords();$("welcome").hidden=true;$("desk").hidden=false;
 render();message("Unlocked. All journal events remain local to this browser until you explicitly export an encrypted backup.");
}
for(const type of ["pointerdown","touchstart","keydown"])document.addEventListener(type,()=>{lastUse=Date.now()},{passive:true});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)background=Date.now();
 else if(key&&background&&Date.now()-background>5*60*1000)lock("Journal locked after being in the background.");
});
setInterval(()=>{if(key&&Date.now()-lastUse>10*60*1000)lock("Journal locked after ten minutes of inactivity.")},20000);
$("show-restore").onclick=()=>{$("restore-form").hidden=!$("restore-form").hidden};
$("create-form").addEventListener("submit",async e=>{e.preventDefault();try{await run(async()=>{
 const pass=$("create-pass").value;
 if(pass!==$("confirm-pass").value)throw Error("Passphrase confirmation does not match.");
 if(await readVault())throw Error("An encrypted journal already exists; unlock it instead.");
 const created=await createVault(pass);
 await writeVault(created.envelope,null);
 opened(created);
 })}catch(err){message(err.message,true)}});
$("unlock-form").addEventListener("submit",async e=>{e.preventDefault();try{await run(async()=>{
 const v=await readVault();if(!v)throw Error("No local journal exists.");
 opened(await unlockVault(v,$("unlock-pass").value));
 })}catch(err){message(err.message,true)}});
$("restore-form").addEventListener("submit",async e=>{e.preventDefault();try{await run(async()=>{
 if(await readVault())throw Error("A journal exists on this device. Restore only on an empty browser origin; no overwrite.");
 const file=$("restore-file").files?.[0];
 if(!file||file.size>590000)throw Error("Select a valid encrypted backup under 590 KB.");
 let parsed;try{parsed=JSON.parse(await file.text())}catch{throw Error("Backup is not valid JSON.")};
 const verified=validateEnvelope(parsed),unlocked=await unlockVault(verified,$("restore-pass").value);
 await writeVault(verified,null);opened(unlocked);
 message("Encrypted backup restored after authenticated integrity and journal chain checks.");
 })}catch(err){message(err.message,true)}});
async function persist(next){
 if(!key||!envelope)throw Error("Unlock the journal first.");
 const updated=await resealVault(next,key,envelope);
 await writeVault(updated,envelope.revision);
 journal=next;envelope=updated;render();
}
$("lock").onclick=()=>lock();
$("backup").onclick=()=>{
 if(!envelope)return;
 const blob=new Blob([JSON.stringify(envelope,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob),link=element("a");link.href=url;
 link.download="abundent-bridge-ledger-ENCRYPTED-"+new Date().toISOString().slice(0,10)+".json";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
 message("Encrypted backup downloaded. Store it privately; losing your passphrase makes it unrecoverable.");
};
for(const [value,title] of TYPES){const op=element("option",title);op.value=value;$("kind").append(op)}
$("kind").value="SOURCE_CHECKED";
function refreshWorkPreview(){
 const d=door(active),action=workLabels[$("work-action").value];
 $("work-ack").checked=false;
 $("work-preview").replaceChildren();
 const summary=element("p",d.name+" → "+$("work-target").value+" → "+action);
 const gates=element("p","Eligibility / human review gate: "+d.gate);
 const limits=element("p","PUBLIC ONLY · DRAFT · NO OUTBOUND CONTACT · NOT A RECEIVER DECISION");
 $("work-preview").append(summary,gates,limits);
}
$("work-action").addEventListener("change",refreshWorkPreview);
$("work-target").addEventListener("change",refreshWorkPreview);
$("work-form").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!key){message("Unlock your ledger before preparing a handoff.",true);return}
 if(!$("work-ack").checked){$("work-message").textContent="Review and acknowledge this particular packet first.";return}
 try{
  // Importantly NO journal events, notes, links, people, capabilities or authority are exported.
  const packet=await buildWorkCard({doorId:active,target:$("work-target").value,actionCode:$("work-action").value},allDoors);
  const b=new Blob([JSON.stringify(packet,null,2)+"\\n"],{type:"application/json"});
  const url=URL.createObjectURL(b),a=element("a");a.href=url;a.download="bridge005-"+active+"-"+packet.target+"-HOLD.json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  $("work-ack").checked=false;
  $("work-message").textContent="A public-only candidate file was downloaded, NOT sent. The receiving system must independently inspect it and HOLD for human action.";
 }catch(err){$("work-message").textContent="HOLD: "+err.message}
});
function choose(id){
 active=id;
 history.replaceState(null,"",location.pathname+"?door="+encodeURIComponent(active));
 $("note").value="";$("evidence").value="";
 render();
}
$("find").addEventListener("input",render);
$("filter").addEventListener("change",render);
function render(){
 if(!key)return;
 const entries=queue(journal);
 const count=journal.events.length;
 const touched=allDoors.filter(d=>summarize(journal,d.id).total>0).length;
 const submitted=allDoors.filter(d=>summarize(journal,d.id).submittedClaim).length;
 const reviews=allDoors.filter(d=>summarize(journal,d.id).reviewClaim).length;
 const stats=[["23","candidate rooms"],[String(touched),"rooms with local owner entries"],[String(submitted),"application submissions reported"],[String(reviews),"independent reviews reported (not verified)"]];
 $("summary").replaceChildren();
 for(const [num,label] of stats){const item=element("div");item.append(element("strong",num),element("span",label));$("summary").append(item)}
 const term=$("find").value.toLowerCase().trim(),filter=$("filter").value;
 const rows=entries.filter(x=>(filter==="all"||filter==="urgent"&&x.priority==="VERIFY_NOW"||filter==="recorded"&&x.count>0||filter==="unstarted"&&x.count===0)&&
 (!term||[x.name,x.entry,x.next].join(" ").toLowerCase().includes(term)));
 $("visible-count").textContent=rows.length+" shown · "+count+" local events";
 if(rows.length&&!rows.some(x=>x.id===active))active=rows[0].id;
 $("queue").replaceChildren();
 for(const item of rows){
 const b=element("button",undefined,"queue-item");b.type="button";b.setAttribute("aria-current",String(item.id===active));
 b.append(element("strong",item.name),element("small",item.due+" · "+item.priority.replaceAll("_"," ")),
 element("span",item.count+" local event(s) · "+item.entry.replaceAll("_"," ")));
 b.addEventListener("click",()=>choose(item.id));$("queue").append(b);
 }
 if(!rows.length)$("queue").append(element("p","No doors match. Clear search or change the focus filter.","fine"));
 renderDetail();
}
function renderDetail(){
 const d=door(active),s=summarize(journal,active),events=historyFor(journal,active);
 $("door-name").textContent=d.name;$("door-due").textContent=d.due;$("gate").textContent=d.gate;
 refreshWorkPreview();
 $("official").href=d.url;$("map").href="../network/?door="+encodeURIComponent(active);
 $("standing").textContent=s.total?("LAST OPERATOR ENTRY: "+s.label+" · "+s.classification.replaceAll("_"," ")):
 "PROSPECT ONLY. No genuine applicant permission, outreach or external relationship is known to this journal.";
 $("next").textContent="Suggested preparation (not permission to act): "+d.next;
 $("history").replaceChildren();
 if(!events.length){$("history").append(element("p","No recorded action. Choose 'Checked the official source' only after you really check it.","fine"));return}
 for(const e of [...events].reverse()){
 const item=element("article");
 item.append(element("small",new Date(e.at).toLocaleString()+" · OPERATOR-ATTESTED, NOT EXTERNALLY VERIFIED"),
 element("strong",labelFor[e.kind]),element("p",e.note));
 if(e.evidence){const a=element("a","Public reference ↗");a.href=e.evidence;a.target="_blank";a.rel="noopener noreferrer";item.append(a)}
 item.append(element("div","Local hash "+e.digest.slice(0,16)+"… (not a recipient signature)","digest"));
 $("history").append(item);
 }
}
$("draft").onclick=async()=>{
 try{await navigator.clipboard.writeText(draftFor(active));
 message("Unsent introduction copied. It has not been sent. Check current source and the recipient's chosen channel.")}
 catch{message("Clipboard access denied; use the public atlas to inspect the draft.",true)}
};
$("event-form").addEventListener("submit",async e=>{
 e.preventDefault();
 try{await run(async()=>{
 const kind=$("kind").value,note=$("note").value.trim(),evidence=$("evidence").value.trim();
 const next=await appendEvent(journal,{doorId:active,kind,note,evidence});
 await persist(next);
 $("note").value="";$("evidence").value="";
 message("Encrypted event appended. This is your statement, not the institution's independently verified receipt. Download a backup to retain another copy.");
 })}catch(err){message(err.message,true)}
});
welcome().catch(e=>message(e.message,true));
