import {inspectPacket} from "../receiver-protocol.mjs";
import {offerLinkToWallet} from "../wallet/handoff.mjs";
const API="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/commons-inbox";
const $=id=>document.getElementById(id);
let roomId="",key="",role="",room=null,items=[],events=[],linkedKeys=null,rotatedRole=null;
const text=(parent,s,tag="p")=>{const el=document.createElement(tag);el.textContent=s;parent.append(el);return el};
function message(s,error=false){$("status").textContent=s;$("status").dataset.error=error?"true":"false"}
function link(roleName,token,forRoom=roomId){
 const url=new URL(location.href);url.search="";
 url.hash="room="+encodeURIComponent(forRoom)+"&key="+encodeURIComponent(token);
 return url.toString();
}
function resetSensitive(){
 linkedKeys=null;rotatedRole=null;key="";roomId="";role="";room=null;items=[];events=[];
 $("keepRotated").hidden=true;
 for(const id of ["desk","newKeys","reviewSection","ownerSection","submissionSection"])$(id).hidden=true;
 $("createSection").hidden=false;
 $("cards").replaceChildren();$("eventHistory").replaceChildren();
}
async function api(body){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
 try{
  const response=await fetch(API,{method:"POST",credentials:"omit",mode:"cors",
   headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:ctrl.signal,
   cache:"no-store",referrerPolicy:"no-referrer"});
  const output=await response.json();
  if(!response.ok)throw Error(output?.error||"INBOX_UNAVAILABLE");
  return output;
 }finally{clearTimeout(timer)}
}
function scope(){if(!roomId||!key)throw Error("Open your private invitation link first.");return {roomId,token:key}}
function showLinks(keys){
 const map={owner:["ownerLink","copyOwner"],reviewer:["reviewerLink","copyReviewer"],submitter:["submitterLink","copySubmitter"]};
 for(const [k,[id]] of Object.entries(map))$(id).value=link(k,keys[k]);
 $("newKeys").hidden=false;
}
function saveOffer(url,scopeName){
 try{
  if(!room)throw Error("Open the inbox before saving an invitation.");
  const owner=scopeName==="owner";
  offerLinkToWallet({title:room.title+" · "+scopeName+" access",url,scope:scopeName,
    group:room.region,note:owner?"Private owner key; do not share.":"Invitation capability; possession grants access."},
    "../wallet/");
  message("Wallet opened with an unsaved link offer. Review it there and explicitly choose Keep.");
 }catch(e){message(e.message,true)}
}
function renderState(){
 $("desk").hidden=!room;
 $("createSection").hidden=!!room;
 $("roomTitle").textContent=room?.title||"Community inbox";
 $("roomInfo").textContent=room?room.region+" · YOUR CAPABILITY: "+role.toUpperCase()+
   " · "+(room.closed?"CLOSED — READ ONLY":"OPEN"):"";
 $("submissionSection").hidden=!room||room.closed||!["owner","submitter"].includes(role);
 $("reviewSection").hidden=!room||!["owner","reviewer"].includes(role);
 $("ownerSection").hidden=!room||role!=="owner";
 $("decisionForm").hidden=!!room?.closed;
 $("reportForm").hidden=!!room?.closed;
 if(room&&["owner","reviewer"].includes(role))renderInbox();
}
function selectItems(id){
 const sel=$(id),prev=sel.value;sel.replaceChildren();
 for(const item of items){
  const opt=document.createElement("option");
  opt.value=item.id;
  opt.textContent=item.kind+" / "+item.id.slice(0,8);
  sel.append(opt);
 }
 if([...sel.options].some(x=>x.value===prev))sel.value=prev;
}
async function renderInbox(){
 const cards=$("cards");cards.replaceChildren();
 selectItems("decisionItem");selectItems("reportItem");
 if(!items.length)text(cards,"No submitted proposals. Share a submitter invitation only with someone you trust.");
 for(const item of items){
  const card=document.createElement("article");card.className="inbox-card";
  const a=await inspectPacket(item.packet).catch(()=>null);
  text(card,a?a.heading:"Unsafe or unsupported stored card: review outside this interface","h3");
  text(card,(a?a.region:"Unknown origin")+" · "+item.kind+" · Stored "+new Date(item.created_at).toLocaleString());
  const status=events.find(e=>e.item_id===item.id &&
   ["HOLD","REFUSE","ACCEPT_FOR_LOCAL_REVIEW"].includes(e.event_kind));
  const label=status?status.event_kind+" · self-attested":"NO REVIEW DECISION";
  text(card,label);
  const d=document.createElement("details"),s=document.createElement("summary");s.textContent="Inspect original unverified JSON";d.append(s);
  const pre=document.createElement("pre");pre.textContent=JSON.stringify(item.packet,null,2);
  d.append(pre);card.append(d);cards.append(card);
 }
 const history=$("eventHistory");history.replaceChildren();
 if(!events.length)text(history,"No review or report events yet.");
 for(const e of events){
  const card=document.createElement("article");card.className="inbox-card";
  text(card,e.event_kind+" · "+e.actor_role+" capability","h3");
  text(card,e.note);
  text(card,"Item "+e.item_id.slice(0,8)+" · "+new Date(e.created_at).toLocaleString()+
   (e.event_kind.startsWith("REPORTED")?" · "+e.quantity_reported+" "+e.unit:""));
  history.append(card);
 }
}
async function refresh(){
 if(!roomId||!key)return;
 const value=await api({action:"open",...scope()});
 room=value.room;role=value.role;items=value.items||[];events=value.events||[];
 renderState();
 message("Inbox loaded. Capability access is not verified personhood or organizational authorization.");
}
$("createForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const form=e.currentTarget.elements;
 if(!form.consent.checked)return;
 try{
  const value=await api({action:"create",title:form.title.value,region:form.region.value});
  roomId=value.room.id;key=value.keys.owner;role="owner";room=value.room;
  linkedKeys=value.keys;items=[];events=[];
  history.replaceState(null,"",link("owner",key));
  showLinks(value.keys);renderState();
  message("Private inbox created. Save your owner link now; this server cannot recover your private key.");
 }catch(err){message(err.message,true)}
});
for(const [button,input] of [["copyOwner","ownerLink"],["copyReviewer","reviewerLink"],["copySubmitter","submitterLink"]]){
 $(button).addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText($(input).value);message("Invitation copied. Share it only with its intended recipient.");}
  catch{message("Clipboard unavailable; select and copy the link field manually.",true)}
 });
}
for(const [id,scopeName] of [["keepOwner","owner"],["keepReviewer","reviewer"],["keepSubmitter","submitter"]]){
 $(id).addEventListener("click",()=>{
  if(!linkedKeys?.[scopeName])return message("This original invitation is no longer in this tab.",true);
  saveOffer(link(scopeName,linkedKeys[scopeName]),scopeName);
 });
}
$("keepCurrent").addEventListener("click",()=>{
 if(!roomId||!key)return message("Open your invitation first.",true);
 saveOffer(link(role,key),role);
});
$("keepRotated").addEventListener("click",()=>{
 if(!rotatedRole||!$("rotatedKey").value)return;
 saveOffer($("rotatedKey").value,rotatedRole);
});
$("reload").addEventListener("click",()=>refresh().catch(e=>message(e.message,true)));
$("leave").addEventListener("click",()=>{
 history.replaceState(null,"",location.pathname);resetSensitive();
 message("Left this inbox. Your secret key is no longer in the address. Keep a private copy of the link to return.");
});
$("file").addEventListener("change",async e=>{
 const f=e.currentTarget.files?.[0];if(!f)return;
 if(f.size>12500){message("Card exceeds 12 KB.",true);return}
 $("packetText").value=await f.text();
});
$("submitForm").addEventListener("submit",async e=>{
 e.preventDefault();
 try{
  if(!e.currentTarget.elements.consent.checked)throw Error("Confirm you have permission to propose this non-sensitive card.");
  const input=$("packetText").value;
  if(new TextEncoder().encode(input).length>12500)throw Error("Card too large.");
  const inspection=await inspectPacket(input);
  if(!inspection.actionable)throw Error("Only original organizational HOLD cards or planZ review candidates may be submitted.");
  const value=await api({action:"submit",...scope(),packet:inspection.packet});
  $("submissionReceipt").textContent="Storage acknowledgment "+value.item.id.slice(0,12)+
   " · UNSIGNED, NOT A SERVICE COMMITMENT.";
  message("Card stored for invited reviewers. It has not been independently verified or delivered as aid.");
  if(role==="owner")await refresh();
 }catch(err){message(err.message,true)}
});
$("decisionForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const f=e.currentTarget.elements;
 try{
  const out=await api({action:"decide",...scope(),itemId:f.itemId.value,
    decision:f.decision.value,reason:f.reason.value});
  message(out.event.event_kind+" saved as a local, self-attested review decision. No dispatch occurred.");
  f.reason.value="";await refresh();
 }catch(err){message(err.message,true)}
});
$("reportForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=e.currentTarget.elements;
 try{
  const out=await api({action:"report",...scope(),itemId:f.itemId.value,status:f.status.value,
   summary:f.summary.value,quantity:Number(f.quantity.value),unit:f.unit.value});
  message(out.event.event_kind+" saved, UNVERIFIED. No independently confirmed recipient or capacity credit.");
  f.summary.value="";await refresh();
 }catch(err){message(err.message,true)}
});
async function rotate(which){
 if(!window.confirm("Rotate "+which+"? Every previously shared "+which+" invitation will stop working."))return;
 const out=await api({action:"rotate",...scope(),role:which});
 const l=link(which,out.key);
 rotatedRole=which;
 $("rotatedKey").value=l;
 $("rotatedKeyWrap").hidden=false;
 $("keepRotated").hidden=false;
 message("Old "+which+" capability revoked. Copy and share the new invitation.");
}
$("rotateReviewer").addEventListener("click",()=>rotate("reviewer").catch(e=>message(e.message,true)));
$("rotateSubmitter").addEventListener("click",()=>rotate("submitter").catch(e=>message(e.message,true)));
$("closeInbox").addEventListener("click",async()=>{
 if(!confirm("Close this inbox? New submissions and review decisions will be disabled."))return;
 try{await api({action:"close",...scope()});await refresh();message("Inbox closed. Existing entries remain readable to invited reviewers.");}
 catch(err){message(err.message,true)}
});
$("deleteInbox").addEventListener("click",async()=>{
 if(!confirm("PERMANENTLY DELETE this inbox, all proposals and its review history?"))return;
 if(!confirm("Confirm: this deletion cannot be undone."))return;
 try{await api({action:"delete",...scope()});history.replaceState(null,"",location.pathname);resetSensitive();
  message("Inbox and its stored records deleted.");}
 catch(err){message(err.message,true)}
});
(async()=>{
 try{
  const h=new URLSearchParams(location.hash.slice(1));
  const rid=h.get("room")||"",tok=h.get("key")||"";
  if(!rid&&!tok)return;
  if(!rid||!tok||rid.length>60||tok.length!==43)throw Error("Invalid invitation fragment.");
  roomId=rid;key=tok;await refresh();
 }catch(err){resetSensitive();history.replaceState(null,"",location.pathname);
  message("Invitation unavailable or invalid: "+err.message,true)}
})();
