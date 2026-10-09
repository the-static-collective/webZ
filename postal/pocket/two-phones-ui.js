"use strict";
const $=id=>document.getElementById(id);
const C=globalThis.Pocket003;
const e=new TextEncoder();
let db,key=null,role="",setup=null,events=[],issued=null,lastReply=null,lastPacket=null,seenOffer=null,scanStream=null;
function say(s){$("status").textContent=s;}
async function guarded(fn){try{
 if(!isSecureContext)throw Error("Secure HTTPS origin required");
 if(!db)throw Error("Device storage not loaded");
 await fn();
}catch(err){say("HOLD: "+String(err?.message||err));}}
async function store(name,k,v){return new Promise((resolve,reject)=>{
 const tx=db.transaction(name,"readwrite");
 tx.objectStore(name).put(v,k);
 tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
});}
async function get(name,k){return new Promise((resolve,reject)=>{
 const req=db.transaction(name,"readonly").objectStore(name).get(k);
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
function setupId(){return setup?.route?.route_id||"not-configured";}
async function persist(){
 const entry={setup,events,issued,lastReply,lastPacket};
 await store("field003",role,entry);
}
async function recoverRole(){
 const state=await get("field003",role);
 setup=state?.setup||null;events=state?.events||[];
 issued=state?.issued||null;lastReply=state?.lastReply||null;
 lastPacket=state?.lastPacket||null;
 if(setup){$("setup-in").value=JSON.stringify(setup,null,2);await C.verifyRoute(setup.route,setup.dispatch);}
 if(lastPacket)show(lastPacket);
 await refresh();
}
async function refresh(){
 if(setup){
 const s=await C.verifyHistory(setup.route,setup.dispatch,events);
 $("route-summary").textContent="Signed "+setupId()+" / trusted origin key must be independently checked.\nState: "+s.state;
 $("head").textContent="Signed events: "+s.event_count+"\nCurrent head SHA-256: "+(s.head||"GENESIS")+
 "\nState: "+s.state+"\nAdmission: PENDING STATION VERIFICATION";
 }else{
 $("route-summary").textContent="No signed route loaded.";
 $("head").textContent="No matched signed history.";
 }
}
function show(packet){
 lastPacket=packet;
 const text=C.canonical(packet);
 const mount=$("qr-out");
 mount.replaceChildren();
 try{
 const qr=qrgen.QrCode.encodeText(text,qrgen.QrCode.Ecc.LOW);
 const quiet=4,size=qr.size,n=size+quiet*2;
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 "+n+" "+n);svg.setAttribute("aria-label","Outgoing QR packet");
 const white=document.createElementNS(svg.namespaceURI,"rect");
 white.setAttribute("width",n);white.setAttribute("height",n);white.setAttribute("fill","#fff");svg.appendChild(white);
 let d="";
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(qr.getModule(x,y)){
  d+="M"+(x+quiet)+","+(y+quiet)+"h1v1h-1z";
 }
 const p=document.createElementNS(svg.namespaceURI,"path");p.setAttribute("d",d);
 p.setAttribute("fill","#000");svg.appendChild(p);mount.appendChild(svg);
 const info=document.createElement("small");info.textContent=text.length+" characters; scan from the other phone.";
 mount.appendChild(info);
 }catch(err){
 const p=document.createElement("small");
 p.textContent="QR data too long to fit reliably. Transfer using Copy packet or a local file. "+String(err?.message||err);
 mount.appendChild(p);
 }
}
async function send(packet){show(packet);await persist();}
function downloadJSON(name,value){
 const data=new Blob([JSON.stringify(value,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(data),a=document.createElement("a");
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function ensureKey(){
 role=$("role").value;
 await store("field003","last-selected-role",role);
 let existing=await get("keys",role);
 if(!existing){existing=await C.newKey();await store("keys",role,existing);}
 key=existing;
 $("key-pub").textContent=JSON.stringify(existing.publicJwk,null,2);
 await recoverRole();
 say("Phone role "+role+" loaded. Record the public JWK; private key stays in this browser.");
}
async function signRoute(){
 if(role!=="origin"||!key)throw Error("Only Phone A's origin key can sign route");
 const data=JSON.parse($("setup-in").value);
 const pins=data.role_pins;
 const r=await C.makeRoute(data.dispatch,pins,data.parcel_sha256,key);
 setup={dispatch:data.dispatch,route:r};
 events=[];issued=null;lastReply=null;lastPacket=null;
 await persist();await refresh();
 say("Route signed locally. Transfer signed setup to Phone B, and independently confirm its source key.");
}
async function importSetup(){
 if(!key||role!=="carrier1")throw Error("Phone B must load carrier1 key first");
 const data=JSON.parse($("setup-in").value);
 await C.verifyRoute(data.route,data.dispatch);
 if(C.canonical(key.publicJwk)!==C.canonical(data.route.role_pins.carrier1))
 throw Error("Your browser key is not the one enrolled for carrier1");
 setup=data;events=[];issued=null;lastReply=null;
 await persist();await refresh();
 say("Signed origin route validated. This trusts the enrolled origin key; compare its fingerprint out-of-band.");
}
async function accept(){
 if(role!=="carrier1"||!key||!setup)throw Error("Phone B and signed route required");
 const s=await C.verifyHistory(setup.route,setup.dispatch,events);
 if(s.state!=="OFFERED")throw Error("Leg has already been accepted or advanced");
 const evidence=await C.hexhash("phone-b-accepted-fictional-route:"+setup.route.route_id);
 const pkt=await C.acceptLeg(setup.route,setup.dispatch,key,evidence);
 events=[pkt];
 await send({type:"accept",packet:pkt});
 await refresh();say("Phone B acceptance signed. Show this QR to Phone A.");
}
async function issue(){
 if(role!=="origin"||!setup)throw Error("Phone A needed");
 const evidence=await C.hexhash("simulated-origin-pickup:"+setup.route.parcel_sha256);
 issued=await C.issue(setup.route,setup.dispatch,events,key,evidence);
 lastReply=null;await send({type:"offer",challenge:issued});
 say("Five-minute signed pickup challenge prepared. Phone B scans this now.");
}
async function approve(){
 if(role!=="carrier1"||!seenOffer||!key||!setup||!$("consent").checked)
 throw Error("Inspect a valid challenge and explicitly consent");
 if(lastReply&&C.canonical(lastReply.challenge)===C.canonical(seenOffer)){
 await send({type:"reply",response:lastReply});say("Previously saved response recovered; no second signature.");return;
 }
 lastReply=await C.respond(setup.route,setup.dispatch,events,seenOffer,key);
 await send({type:"reply",response:lastReply});
 $("consent").checked=false;say("Response signed and saved offline. Phone A must scan and verify it.");
}
async function process(packet){
 if(!key)throw Error("Select local role first");
 if(!packet||typeof packet!=="object")throw Error("JSON transfer required");
 if(packet.type==="accept"){
  if(role!=="origin"||!setup)throw Error("Only Phone A accepts first-leg claim");
  const candidate=[packet.packet];
  await C.verifyHistory(setup.route,setup.dispatch,candidate);
  if(events.length===0){events=candidate;await persist();await refresh();}
  else if(C.canonical(events)!==C.canonical(candidate))throw Error("Conflicting acceptance; HOLD");
  say("Signed carrier1 acceptance imported. Now issue an origin-signed pickup QR.");
 }else if(packet.type==="offer"){
  if(role!=="carrier1"||!setup)throw Error("Only Phone B receives origin offer");
  await C.checkOffer(setup.route,setup.dispatch,events,packet.challenge);
  seenOffer=packet.challenge;
  $("scope").textContent="Action: "+seenOffer.body.event.action+
   "\nRole: "+seenOffer.body.initiator+" → "+seenOffer.body.responder+
   "\nParcel SHA256: "+seenOffer.body.parcel_sha256+
   "\nEvidence SHA256: "+seenOffer.body.event.evidence_sha256+
   "\nExpires: "+new Date(seenOffer.body.expires_at*1000).toISOString()+
   "\nNo physical, payment or custody authority.";
  $("consent").checked=false;
  say("Signed offer inspected. Choose whether to cosign; no passive approval.");
 }else if(packet.type==="reply"){
  if(role!=="origin"||!setup||!issued)throw Error("Only issuing Phone A may receive a reply");
  const checked=await C.checkReply(setup.route,setup.dispatch,events,issued,packet.response);
  lastReply=packet.response;
  await persist();
  say("Two independent native P-256 signatures verified. Press Verify returned response to store pending route update.");
 }else if(packet.type==="sync"){
  if(role!=="carrier1"||!setup)throw Error("Only Phone B syncs issuer's new event");
  const checked=await C.syncTail(setup.route,setup.dispatch,events,packet.packet);
  if(checked.head!==packet.head)throw Error("Mismatch in station history-head claim");
  events=checked.events;await persist();await refresh();
  say("Phone B now has the same signed history head as Phone A: "+checked.head+
      ". Workstation admission remains required.");
 }else throw Error("Unknown transfer packet type");
}
async function commit(){
 if(role!=="origin"||!lastReply||!setup||!issued)throw Error("Phone A requires issued QR and verified response");
 const checked=await C.checkReply(setup.route,setup.dispatch,events,issued,lastReply);
 events=checked.events;
 const frame={type:"sync",packet:checked.event,head:checked.head};
 await send(frame);await refresh();
 say("Phone A saved signed event locally; Phone B must scan this SYNC QR. This is not a station admission.");
}
async function fieldkit(){
 if(role!=="origin"||events.length!==2||!issued||!lastReply)throw Error("Complete signed route first");
 const s=await C.verifyHistory(setup.route,setup.dispatch,events);
 if(s.state!=="LEG1_MOVING_CLAIM")throw Error("History incomplete");
 const checked=await C.checkReply(setup.route,setup.dispatch,events.slice(0,1),issued,lastReply);
 if(C.canonical(checked.events)!==C.canonical(events))throw Error("Stored history diverges");
 downloadJSON("postemahhn-003-reconcile-"+setupId()+".json",{
  schema:"postemahhn.two-phones-fieldkit/v0",classification:"synthetic_no_real_carriage",
  dispatch:setup.dispatch,route:setup.route,events,challenge:issued,
  response:lastReply,claimed_head:s.head,physical_parcel_observed:false,
  penny_units_released:0,full_measure_deeds:0
 });
 say("Test-only reconciliation bundle saved. Deliver to trusted GHoT operator after reconnect.");
}
$("key-setup").onclick=()=>guarded(ensureKey);
$("copy-public").onclick=()=>guarded(async()=>{
 if(!key)throw Error("Key not loaded");
 await navigator.clipboard.writeText(JSON.stringify(key.publicJwk));say("Public JWK copied.");
});
$("role").onchange=()=>{key=null;setup=null;events=[];issued=null;lastReply=null;seenOffer=null;$("key-pub").textContent="Role changed; reopen role key.";};
$("sign-route").onclick=()=>guarded(signRoute);
$("load-route").onclick=()=>guarded(importSetup);
$("copy-setup").onclick=()=>guarded(async()=>{
 if(!setup)throw Error("No signed setup");await navigator.clipboard.writeText(JSON.stringify(setup));say("Signed setup copied.");
});
$("export-setup").onclick=()=>guarded(async()=>{
 if(!setup)throw Error("No signed setup");downloadJSON("synthetic-signed-setup.json",setup);say("Setup saved to file.");
});
$("accept").onclick=()=>guarded(accept);
$("issue").onclick=()=>guarded(issue);
$("approve").onclick=()=>guarded(approve);
$("commit").onclick=()=>guarded(commit);
$("sync").onclick=()=>guarded(async()=>{const p=JSON.parse($("in").value);if(p.type!=="sync")throw Error("Paste/scan sync packet");await process(p);});
$("export-fieldkit").onclick=()=>guarded(fieldkit);
$("read-in").onclick=()=>guarded(async()=>{await process(JSON.parse($("in").value));});
$("copy-qr").onclick=()=>guarded(async()=>{if(!lastPacket)throw Error("Nothing outgoing");await navigator.clipboard.writeText(C.canonical(lastPacket));say("Signed transfer packet copied.");});
$("recover").onclick=()=>guarded(async()=>{if(!role)throw Error("Open your role key first");await recoverRole();say("Saved outgoing packet recovered.");});
$("stop").onclick=()=>{scanStream?.getTracks().forEach(t=>t.stop());scanStream=null;$("video").hidden=true;};
$("scan").onclick=()=>guarded(async()=>{
 if(!("BarcodeDetector" in window))throw Error("BarcodeDetector unavailable; paste JSON instead");
 const detector=new BarcodeDetector({formats:["qr_code"]});
 const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
 scanStream=stream;$("video").hidden=false;$("video").srcObject=stream;
 say("Scanning for a signed transfer QR...");
 const end=Date.now()+30000;
 try{
  while(Date.now()<end&&scanStream===stream){
   const images=await detector.detect($("video")).catch(()=>[]);
   const found=images.find(x=>x.rawValue?.startsWith("{"));
   if(found){$("in").value=found.rawValue;say("QR captured. Press Verify and import.");break;}
   await new Promise(r=>setTimeout(r,220));
  }
 }finally{stream.getTracks().forEach(t=>t.stop());scanStream=null;$("video").hidden=true;}
});
(async()=>{try{
 db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open("postemahhn-carrier-pocket-002",2);
  req.onupgradeneeded=()=>{
   const d=req.result;
   if(!d.objectStoreNames.contains("keys"))d.createObjectStore("keys");
   if(!d.objectStoreNames.contains("outbox"))d.createObjectStore("outbox");
   if(!d.objectStoreNames.contains("field003"))d.createObjectStore("field003");
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 const lastRole=await get("field003","last-selected-role");
 if(lastRole==="origin"||lastRole==="carrier1")$("role").value=lastRole;
 if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
 say("Storage prepared. Reopen the saved role key for this device.");
}catch(err){say("HOLD: device setup failed: "+err?.message)}})();
