import {createEntry,validateEntries,validateEnvelope,newWallet,unlockWallet,sealWallet,rekeyWallet,cleanLink,SCOPES} from "./crypto.mjs";
import {readVault,writeVault,deleteVault} from "./store.mjs";
const $=id=>document.getElementById(id);
let key=null,entries=[],envelope=null,busy=false,lastActivity=Date.now(),hiddenAt=null;
function message(text,error=false){$("status").textContent=text;$("status").dataset.error=String(error)}
function clearForm(id){const f=$(id);f.reset();for(const el of f.querySelectorAll('input[type="password"]'))el.value=""}
function lock(announcement="Wallet locked. Your encrypted links remain on this device."){
 key=null;entries=[];envelope=null;busy=false;
 $("entries").replaceChildren();$("search").value="";
 $("vault").hidden=true;$("welcome").hidden=false;
 initWelcome().catch(e=>message(e.message,true));
 message(announcement);
}
async function initWelcome(){
 const v=await readVault();
 $("createForm").hidden=!!v;
 $("unlockForm").hidden=!v;
 $("welcomeTitle").textContent=v?"Unlock your encrypted wallet":"Create your local wallet";
 $("restoreForm").hidden=true;
}
function activity(){lastActivity=Date.now()}
for(const name of ["pointerdown","keydown","touchstart"]){
 document.addEventListener(name,activity,{passive:true});
}
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)hiddenAt=Date.now();
 else if(hiddenAt&&Date.now()-hiddenAt>5*60*1000&&key)lock("Wallet auto-locked after being in the background.");
});
setInterval(()=>{
 if(key&&Date.now()-lastActivity>10*60*1000)lock("Wallet locked after ten minutes without activity.");
},20000);
function openVault(value){
 key=value.key;entries=value.entries;envelope=value.envelope;
 $("welcome").hidden=true;$("vault").hidden=false;
 lastActivity=Date.now();
 render();
}
async function run(task){
 if(busy)throw Error("A wallet update is already in progress.");
 busy=true;
 try{return await task()}finally{busy=false}
}
async function persist(next){
 if(!key||!envelope)throw Error("Unlock the wallet first.");
 const cleaned=validateEntries(next);
 const updated=await sealWallet(cleaned,key,envelope);
 await writeVault(updated,envelope.revision);
 entries=cleaned;envelope=updated;render();
}
function element(tag,txt,cls){
 const el=document.createElement(tag);if(txt!==undefined)el.textContent=txt;if(cls)el.className=cls;return el;
}
function action(text,handler,cls=""){
 const btn=element("button",text,cls);btn.type="button";
 btn.addEventListener("click",()=>{activity();handler()});
 return btn;
}
function humanHost(link){try{return new URL(link).host}catch{return "Unknown host"}}
function render(){
 if(!key)return;
 const q=$("search").value.toLowerCase().trim(),filter=$("filter").value;
 const found=entries.filter(x=>(filter==="all"||x.scope===filter)&&
  (!q||[x.title,x.scope,x.group,x.note,humanHost(x.url)].join(" ").toLowerCase().includes(q)));
 $("count").textContent=entries.length+" encrypted link"+(entries.length===1?"":"s")+" on this device";
 const region=$("entries");region.replaceChildren();
 if(!found.length)region.append(element("p",entries.length?"No links match. Change your search.":"Your keyring is empty. Save your first link below.","empty"));
 for(const entry of [...found].reverse()){
  const card=element("article",undefined,"linkcard");
  card.append(element("span",entry.scope,"chip"),element("h3",entry.title));
  card.append(element("p",humanHost(entry.url)+(entry.group?" · "+entry.group:"")));
  if(entry.note)card.append(element("p",entry.note));
  const buttons=element("div",undefined,"actions");
  buttons.append(action("Open door ↗",()=>{
   const url=cleanLink(entry.url);
   window.open(url,"_blank","noopener,noreferrer");
  }));
  buttons.append(action("Copy link",async()=>{
   try{
    await navigator.clipboard.writeText(cleanLink(entry.url));
    message("Link copied. Clipboard contents may be visible to other applications; clear it when done.");
   }catch{message("Clipboard permission denied. You can still open the door.",true)}
  }));
  buttons.append(action("Remove",async()=>{
   if(!confirm("Remove "+entry.title+" from this device's encrypted wallet? This does not revoke the original invitation."))return;
   try{await run(()=>persist(entries.filter(x=>x.id!==entry.id)));message("Link removed from this local wallet.")}
   catch(e){message(e.message,true)}
  },"remove"));
  card.append(buttons);region.append(card);
 }
}
$("createForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const f=event.currentTarget.elements,pass=f.pass.value;
 if(pass!==f.repeat.value){message("Passphrases do not match.",true);return}
 try{await run(async()=>{
  const original=await newWallet(pass);
  await writeVault(original.envelope,null);
  openVault(original);
  clearForm("createForm");message("Wallet encrypted and created on this device. Download a backup once you add your links.");
 })}catch(e){message(e.message,true)}
});
$("unlockForm").addEventListener("submit",async event=>{
 event.preventDefault();
 try{await run(async()=>{
  const data=await readVault();
  if(!data)throw Error("No saved wallet on this device.");
  const opened=await unlockWallet(data,event.currentTarget.elements.pass.value);
  openVault(opened);clearForm("unlockForm");message("Wallet unlocked only in this tab. Your links were decrypted locally.");
 })}catch(e){message(e.message,true)}
});
$("lock").addEventListener("click",()=>lock());
$("search").addEventListener("input",render);$("filter").addEventListener("change",render);
$("addForm").addEventListener("submit",async event=>{
 event.preventDefault();const f=event.currentTarget.elements;
 try{await run(async()=>{
  const entry=createEntry({title:f.title.value,url:f.url.value,scope:f.scope.value,group:f.group.value,note:f.note.value});
  if(entries.some(x=>x.url===entry.url))throw Error("This exact link is already saved.");
  await persist([...entries,entry]);
  event.currentTarget.reset();
  message("Link encrypted and saved locally. No link or label was uploaded.");
 })}catch(e){message(e.message,true)}
});
function backup(data){
 const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
 const uri=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=uri;a.download="abundent-link-wallet-encrypted.json";
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(uri),1500);
}
$("backup").addEventListener("click",()=>{
 if(!envelope)return;
 backup(validateEnvelope(envelope));
 message("Encrypted backup downloaded. Keep it private and keep your passphrase separately; no one can reset it for you.");
});
$("restoreStart").addEventListener("click",()=>{$("restoreForm").hidden=!$("restoreForm").hidden});
$("restoreForm").addEventListener("submit",async event=>{
 event.preventDefault();
 try{await run(async()=>{
  const f=event.currentTarget.elements,file=f.file.files?.[0];
  if(!file||file.size>340000)throw Error("Choose an Abundent encrypted backup (under 340 KB).");
  const source=JSON.parse(await file.text());
  const checked=validateEnvelope(source);
  // Authenticate before modifying the current vault. Incorrect passwords do not overwrite.
  const unlocked=await unlockWallet(checked,f.pass.value);
  const current=await readVault();
  if(current&&!confirm("REPLACE the local wallet on this device? Existing encrypted links will be lost unless backed up."))return;
  await writeVault(unlocked.envelope,current?.revision??null);
  openVault(unlocked);clearForm("restoreForm");
  message("Encrypted backup restored and unlocked. This device now holds that wallet.");
 })}catch(e){message("Backup not restored: "+e.message,true)}
});
$("rekeyForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const f=event.currentTarget.elements;
 if(f.pass.value!==f.repeat.value){message("New passphrases do not match.",true);return}
 try{await run(async()=>{
  const result=await rekeyWallet(entries,f.pass.value);
  await writeVault(result.envelope,envelope.revision);
  key=result.key;entries=result.entries;envelope=result.envelope;
  clearForm("rekeyForm");message("Wallet re-encrypted. Export a fresh encrypted backup; previous backups still use the old passphrase.");
 })}catch(e){message(e.message,true)}
});
$("deleteWallet").addEventListener("click",async()=>{
 if(!envelope)return;
 if(!confirm("Delete this device's encrypted wallet and all locally saved links? You cannot undo this without a backup."))return;
 if(!confirm("Confirm permanent local deletion. This does not revoke any external invitation."))return;
 try{await run(()=>deleteVault(envelope.revision));lock("Local wallet deleted. Original external links and permissions are unchanged.")}
 catch(e){message(e.message,true)}
});
initWelcome().then(()=>message("Your wallet stays on this device. No server account or upload."))
 .catch(e=>message(e.message,true));
if("serviceWorker" in navigator && location.protocol==="https:"){
 navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{});
}
