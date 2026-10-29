// SUITCASE-002 / Foundry: key-owned genesis, opt-in public-safe capability cards, signed withdrawal.
// Human-carried JSON only. No automatic peer discovery or transmission.
import {sign,verify} from "./protocol.mjs";
import {rooms,packets,addPacket} from "./store.mjs";
import {assessGenesis,foundingFor,discover,localEvidence} from "./foundry.mjs";
const $=id=>document.getElementById(id);
const add=(p,tag,value)=>{const e=document.createElement(tag);e.textContent=value??"";p.append(e);return e};
let state={rooms:[],packets:[]},busy=false;
function notice(t,error=false){$("foundry-status").textContent=(error?"HOLD — ":"")+t;$("foundry-status").style.borderColor=error?"#ca5b43":"#edce79"}
function options(id,values,empty){const select=$(id),old=select.value;select.replaceChildren();if(!values.length){const o=add(select,"option",empty);o.value="";return}
 for(const [value,label] of values){const o=add(select,"option",label);o.value=value}
 if(values.some(v=>v[0]===old))select.value=old;
}
function room(id){const r=state.rooms.find(x=>x.roomId===$(id).value);if(!r)throw Error("Create/select a local signing room first");return r}
async function refresh(){
 const [rr,pp]=await Promise.all([rooms(),packets()]);const valid=[];
 for(const p of pp){try{await verify({schema:p.schema,payload:p.payload,digest:p.digest,signature:p.signature});valid.push(p)}catch{/* invalid imported/local records never become discoverable */}}
 state={rooms:rr,packets:valid};
 const names=rr.map(r=>[r.roomId,r.label+" · "+r.fingerprint.slice(0,12)]);
 for(const id of ["seed-room","genesis-room","cap-room","withdraw-room","evidence-room"])options(id,names,"Create a local room");
 const seeds=valid.filter(p=>p.payload.kind==="SEED"&&Date.parse(p.payload.body.expiresAt)>Date.now());
 options("genesis-seed",[["","No ancestor · independent root"],...seeds.map(p=>[p.digest,p.payload.issuer.label+" · "+p.payload.body.purpose])],"Independent root");
 const capabilities=discover(valid);
 options("withdraw-cap",capabilities.filter(c=>rr.some(r=>r.fingerprint===c.payload.issuer.fingerprint))
   .map(c=>[c.digest,c.payload.body.title+" · "+c.digest.slice(0,10)]),"No active local capability");
 renderDirectory(capabilities);renderEvidence();
}
function renderDirectory(cards){
 const area=$("cap-list");area.replaceChildren();
 if(!cards.length){add(area,"p","Nothing public-safe and signed is discoverable on this device. Exchange signed JSON first.");return}
 for(const p of cards){
  const b=p.payload.body,card=add(area,"article",undefined);card.className="packet-item";
  add(card,"b",b.category+" / "+b.title);
  add(card,"p",b.scope);
  add(card,"small",p.payload.issuer.label+" · key "+p.payload.issuer.fingerprint.slice(0,16)+"…");
  add(card,"small","Self-described only · expiry "+b.expiresAt.slice(0,10)+" · no provider verified");
  const button=add(card,"button","Address an OFFER to this key");button.type="button";
  button.addEventListener("click",()=>{$("offer-to").value=p.payload.issuer.fingerprint;
   $("offer-title").value="Question about "+b.title;$("offer-heading").scrollIntoView({behavior:"smooth",block:"start"});
   notice("Receiver fingerprint inserted locally. This does NOT deliver a message or confirm an organization.")});
 }
}
function renderEvidence(){
 const area=$("node-evidence");area.replaceChildren();if(!state.rooms.length){add(area,"p","Create a local room first.");return}
 const r=state.rooms.find(x=>x.roomId===$("evidence-room").value)||state.rooms[0];
 const result=localEvidence(r,state.packets);
 const flags=[["Independent device key",result.hasLocalKey],["Self-attested genesis, not legal registration",result.selfAttestedFounding],
 ["Independent peer's signed response to this room",result.peerSignedReturn],["Locally signed refusal of another room's request",result.localRefusal],
 ["Offline field trial witnessed",false],["Real named steward and independent governance verified",false]];
 const ul=add(area,"ul",undefined);for(const [name,val] of flags)add(ul,"li",(val?"✓ ":"○ ")+name);
 add(area,"p","ANCESTRY: "+result.ancestry+" · NODE ALIVE: NOT VERIFIED. The browser cannot certify real-world independence, field operation, or permission.");
}
async function act(fn){if(busy)return;busy=true;try{await fn();await refresh();dispatchEvent(new Event("suitcase:foundry-changed"))}catch(e){notice(e?.message||String(e),true)}finally{busy=false}}
$("seed-form").addEventListener("submit",e=>{e.preventDefault();act(async()=>{
 const packet=await sign(room("seed-room"),"SEED",{purpose:$("seed-purpose").value.trim(),
  message:$("seed-message").value.trim(),expiresAt:new Date(Date.now()+30*86400000).toISOString(),authority:"INVITATION_NOT_CONTROL"});
 await addPacket(packet,"CREATED_HERE");notice("Signed invitation saved locally. Export its JSON below; this signature gives no authority over a future child.");
})});
$("genesis-form").addEventListener("submit",e=>{e.preventDefault();act(async()=>{
 const r=room("genesis-room");if(!$("genesis-consent").checked)throw Error("Local founder must explicitly self-accept the proposed rules.");
 if(state.packets.some(p=>p.payload.kind==="GENESIS"&&p.payload.issuer.fingerprint===r.fingerprint))throw Error("This key already issued a genesis. Use a separate room key for an independent organization.");
 const seedDigest=$("genesis-seed").value;
 const seed=seedDigest?state.packets.find(p=>p.digest===seedDigest&&p.payload.kind==="SEED"):null;
 if(seedDigest&&!seed)throw Error("Missing signed invitation");
 if(seed&&(seed.payload.issuer.fingerprint===r.fingerprint||Date.parse(seed.payload.body.expiresAt)<=Date.now()))throw Error("Ancestor and child must have different keys; invitation must be current.");
 const packet=await sign(r,"GENESIS",{name:$("genesis-name").value.trim(),purpose:$("genesis-purpose").value.trim(),
  operatingRules:$("genesis-rules").value.trim(),seedDigest,ancestorFingerprint:seed?.payload.issuer.fingerprint||"",
  status:"SELF_ATTESTED_NOT_LEGAL_ENTITY"});
 await addPacket(packet,"CREATED_HERE");
 $("genesis-consent").checked=false;
 notice("Independent key signed a SELF-ATTESTED genesis. It is not legal incorporation, partnership or public publication.");
})});
$("cap-form").addEventListener("submit",e=>{e.preventDefault();act(async()=>{
 if(!$("cap-consent").checked)throw Error("Public-share consent is required for a capability file");
 const r=room("cap-room"),g=foundingFor(r.fingerprint,state.packets);
 if(!g)throw Error("The signer needs one validated self-attested GENESIS first; import its signed SEED if needed.");
 const packet=await sign(r,"CAPABILITY",{genesisDigest:g.digest,category:$("cap-category").value,title:$("cap-title").value.trim(),
  scope:$("cap-scope").value.trim(),expiresAt:new Date(Date.now()+14*86400000).toISOString(),visibility:"PUBLIC_OPT_IN"});
 await addPacket(packet,"CREATED_HERE");$("cap-consent").checked=false;
 notice("Signed opt-in public capability saved only on this device. It is NOT published to other nodes until you deliberately export/send the JSON.");
})});
$("withdraw-form").addEventListener("submit",e=>{e.preventDefault();act(async()=>{
 const r=room("withdraw-room"),cap=state.packets.find(p=>p.digest===$("withdraw-cap").value);
 if(!cap||cap.payload.issuer.fingerprint!==r.fingerprint)throw Error("Only the original issuing key can withdraw this capability");
 const packet=await sign(r,"WITHDRAW",{onDigest:cap.digest,reason:"Issuer withdraws the previously shared public capability."});
 await addPacket(packet,"CREATED_HERE");
 notice("Withdrawal signed here. Export and deliver the withdrawal to recipients; remote copies may remain discoverable until they import it.");
})});
$("refresh-foundry").addEventListener("click",()=>refresh().catch(e=>notice(e.message,true)));
$("evidence-room").addEventListener("change",renderEvidence);
addEventListener("suitcase:base-changed",()=>refresh().catch(e=>notice(e.message,true)));
refresh().catch(e=>notice("Local foundry unavailable: "+e.message,true));
