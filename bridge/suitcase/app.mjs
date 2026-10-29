// SUITCASE-001. Public-safe peer-to-peer signed file exchange. NO fetch, email or shared database.
import {newRoom,sign,verify,addressedTo,mayAnswer,fingerprint,hash,identity,manifestFromIntent} from "./protocol.mjs";
import {rooms,packets,addRoom,addPacket} from "./store.mjs";
import {NODE_KINDS,nodeById,hostBody} from "./nodes.mjs";
const $=id=>document.getElementById(id);
const el=(tag,label,cls)=>{const e=document.createElement(tag);if(label!==undefined)e.textContent=label;if(cls)e.className=cls;return e};
let localRooms=[],localPackets=[],selectedNode=NODE_KINDS[0],busy=false;
function report(message,isError=false){$("status").textContent=(isError?"HOLD — ":"")+message;$("status").style.borderColor=isError?"#ca5b43":"#edce79"}
async function guard(task){if(busy)return report("An operation is already active",true);busy=true;try{await task()}catch(err){report(err?.message||String(err),true)}finally{busy=false}}
function chooseOptions(id,entries,emptyLabel){const node=$(id),old=node.value;node.replaceChildren();if(!entries.length){const opt=el("option",emptyLabel);opt.value="";node.append(opt);return}for(const [value,label] of entries){const option=el("option",label);option.value=value;node.append(option)}if(entries.some(x=>x[0]===old))node.value=old}
async function load(){[localRooms,localPackets]=await Promise.all([rooms(),packets()]);localRooms.sort((a,b)=>a.label.localeCompare(b.label));localPackets.sort((a,b)=>a.payload.at.localeCompare(b.payload.at));render()}
function currentRoom(id){const r=localRooms.find(x=>x.roomId===id);if(!r)throw Error("Choose a device-local room first");return r}
function currentPacket(digest){const p=localPackets.find(x=>x.digest===digest);if(!p)throw Error("Choose a saved signed envelope first");return p}
function short(fp){return fp.slice(0,13)+"…"+fp.slice(-8)}
function selectRooms(){const opts=localRooms.map(x=>[x.roomId,x.label+" · "+short(x.fingerprint)]);for(const id of ["offer-sender","reply-room","node-room"])chooseOptions(id,opts,"Create a local room first")}
function responseAssessment(p){const src=localPackets.find(x=>x.digest===p.payload.body.onDigest);
 if(!src||src.payload.kind!=="OFFER")return "Source offer not present here: receipt UNMATCHED (signature does not prove the event).";
 if(src.payload.issuer.fingerprint===p.payload.issuer.fingerprint)return "INVALID RELATION: sender cannot independently respond to itself.";
 if(src.payload.body.toFingerprint&&src.payload.body.toFingerprint!==p.payload.issuer.fingerprint)return "INVALID RELATION: response came from a different key than the addressed recipient.";
 if(Date.parse(p.payload.at)>Date.parse(src.payload.body.expiresAt))return "Response was signed after the offer expiration.";
 return "Response cryptographically references the local offer. Key identity and real-world authority remain UNVERIFIED.";
}
function renderRooms(){const mount=$("room-list");mount.replaceChildren();$("room-count").textContent=String(localRooms.length);
 if(!localRooms.length){mount.append(el("p","No keys created yet. A phone can make its own room here."));return}
 for(const room of localRooms){const card=el("article",undefined,"room-item");card.append(el("b",room.label),el("small",room.kind+" · "+short(room.fingerprint)),el("small","KEY ON THIS DEVICE · "+room.createdAt.slice(0,10)));const button=el("button","Copy public fingerprint");button.type="button";button.onclick=()=>guard(async()=>{await navigator.clipboard.writeText(room.fingerprint);report("Public fingerprint copied; compare it with the receiver through an independent channel.")});card.append(button);mount.append(card)}
}
function filename(p){return "SUITCASE-"+p.payload.kind+"-"+p.digest.slice(0,16)+".json"}
function download(p){const blob=new Blob([JSON.stringify({schema:p.schema,payload:p.payload,digest:p.digest,signature:p.signature},null,2)+"\n"],{type:"application/json"}),link=el("a"),url=URL.createObjectURL(blob);link.href=url;link.download=filename(p);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)}
async function copyPacket(p){await navigator.clipboard.writeText(JSON.stringify({schema:p.schema,payload:p.payload,digest:p.digest,signature:p.signature},null,2));report("Signed public-safe JSON copied. You must transfer it yourself; this app never sends it.")}
function renderPackets(){const mount=$("packets");mount.replaceChildren();$("packet-count").textContent=String(localPackets.length);
 if(!localPackets.length){mount.append(el("p","No parcels yet. Create an offer or import another room's file."));return}
 for(const p of [...localPackets].reverse()){const b=p.payload.body,card=el("article",undefined,"packet-item"),kind=p.payload.kind;
 card.append(el("b",(kind==="OFFER"?"OFFER: "+b.title:kind==="DISPOSITION"?"RESPONSE: "+b.decision:kind==="HOST_INTENT"?"HOST PROPOSAL: "+b.nodeName:kind==="SEED"?"SEED: "+b.purpose:kind==="GENESIS"?"GENESIS: "+b.name:kind==="CAPABILITY"?"CAPABILITY: "+b.title:kind==="WITHDRAW"?"WITHDRAW: "+b.onDigest.slice(0,14):"UNKNOWN PACKET")),
 el("small",p.payload.issuer.label+" · "+short(p.payload.issuer.fingerprint)),el("small","SHA-256 "+p.digest),
 el("small",p.localClassification+" · "+new Date(p.payload.at).toLocaleString()));
 if(kind==="DISPOSITION"){card.append(el("p",responseAssessment(p)))}
 if(kind==="HOST_INTENT")card.append(el("p","UNVERIFIED HOST PROPOSAL ONLY — no facility, owner or hardware enrollment."));
 const dl=el("button","Download signed JSON");dl.type="button";dl.onclick=()=>download(p);const copy=el("button","Copy JSON");copy.type="button";copy.onclick=()=>guard(()=>copyPacket(p));card.append(dl,copy);mount.append(card)}
}
function selectOffers(){const offers=localPackets.filter(x=>x.payload.kind==="OFFER").map(x=>[x.digest,x.payload.body.title+" · "+short(x.digest)]);chooseOptions("reply-offer",offers,"Import an offer first")}
function renderNodes(){const mount=$("node-cards");mount.replaceChildren();for(const node of NODE_KINDS){const b=el("button");b.type="button";b.setAttribute("aria-pressed",String(node.id===selectedNode.id));b.append(el("span",node.icon),el("b",node.name),el("small","PROPOSED · NOT ENROLLED"));b.onclick=()=>{selectedNode=node;renderNode();renderNodes()};mount.append(b)}}
function renderNode(){const n=selectedNode;$("node-name").textContent=n.name;$("node-scene").textContent=n.scene;$("node-allow").textContent=n.allowedWork;$("node-disallow").textContent=n.notAllowed;$("node-power").textContent=n.powerPolicy;$("node-authority").textContent=n.authority;const gates=$("node-gates");gates.replaceChildren();const ul=el("ul");for(const g of n.gates)ul.append(el("li",g));gates.append(ul)}
function render(){selectRooms();renderRooms();renderPackets();selectOffers();renderNodes();renderNode();dispatchEvent(new Event('suitcase:base-changed'))}
$("room-form").addEventListener("submit",event=>{event.preventDefault();guard(async()=>{if(!$("room-consent").checked)throw Error("Explicit device-owner acknowledgment required");const room=await newRoom($("room-label").value,$("room-kind").value);await addRoom(room);await load();$("room-label").value="";$("room-consent").checked=false;report("New local signing identity created. Organization affiliation remains UNVERIFIED.")})});
$("offer-form").addEventListener("submit",event=>{event.preventDefault();guard(async()=>{const room=currentRoom($("offer-sender").value),address=$("offer-to").value.trim(),at=new Date();const expiry=new Date(at.getTime()+14*86400000).toISOString();if(address&&!/^[a-f0-9]{64}$/.test(address))throw Error("Receiver address must be a 64-character public-key fingerprint");if(address===room.fingerprint)throw Error("A room cannot address itself as independent receiver");
 const packet=await sign(room,"OFFER",{title:$("offer-title").value.trim(),description:$("offer-description").value.trim(),scope:$("offer-scope").value.trim(),toFingerprint:address,expiresAt:expiry});await addPacket(packet,"CREATED_HERE");await load();report("Signed offer saved on THIS DEVICE. Download JSON to move it; nobody has received it yet.")})});
$("reply-form").addEventListener("submit",event=>{event.preventDefault();guard(async()=>{const room=currentRoom($("reply-room").value),offer=currentPacket($("reply-offer").value);if(!mayAnswer(offer,room))throw Error("This room may not answer this offer: same key, wrong address or expired");const response=await sign(room,"DISPOSITION",{onDigest:offer.digest,decision:$("reply-decision").value,note:$("reply-note").value.trim()});await addPacket(response,"CREATED_HERE");await load();report("Receiver key signed "+response.payload.body.decision+". Not sent or authorized. Download its JSON for the original sender.")})});
$("import").addEventListener("change",event=>{const input=event.currentTarget;guard(async()=>{const file=input.files?.[0];if(!file)throw Error("Select signed JSON");if(file.size>13000)throw Error("Packet exceeds 13 KB");const result=await verify(await file.text());const p=result.packet;
 if(p.payload.kind==="DISPOSITION"){const source=localPackets.find(x=>x.digest===p.payload.body.onDigest);if(source&&source.payload.kind==="OFFER"){if(source.payload.issuer.fingerprint===p.payload.issuer.fingerprint)throw Error("Sender's own key cannot supply independent disposition");if(source.payload.body.toFingerprint&&source.payload.body.toFingerprint!==p.payload.issuer.fingerprint)throw Error("Disposition does not match addressed receiving key")}}
 const saved=await addPacket(p,"IMPORTED_UNTRUSTED_IDENTITY");await load();report(saved?"Valid P-256 signature. Imported from an UNVERIFIED real-world identity; no external permission proved.":"Signed packet already present locally; no duplicate created.")
 }).finally(()=>{input.value=""})});
$("sign-node").onclick=()=>guard(async()=>{const room=currentRoom($("node-room").value),packet=await sign(room,"HOST_INTENT",hostBody(selectedNode));await addPacket(packet,"CREATED_HERE");await load();report("UNVERIFIED host proposal signed. This is NOT permission, installation or a running node.")});
$("print-node").onclick=()=>window.print();
$("print-story").onclick=()=>window.print();
if("serviceWorker" in navigator&&(location.protocol==="https:"||["localhost","127.0.0.1"].includes(location.hostname))){navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{/* offline install may be unsupported; never claim it succeeded */})}
addEventListener("suitcase:foundry-changed",()=>load().catch(e=>report(e.message,true)));
load().catch(e=>report("Local storage unavailable: "+e.message,true));
