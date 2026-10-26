// Reality 2.0 / Waseca · optional persistence. All publication and stewardship require human action.
const API="https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/reality2-waseca";
const $=id=>document.getElementById(id);
const kinds={NEED:"need",OFFER:"offer",TABLE:"table",STEWARDSHIP:"stewardship"};
const lanes={"Food & neighborhood":"food","Practical help":"practical","Art & music":"arts","Open tools":"tools","Community care (non-sensitive)":"care","Other":"other"};
let relatedTo=null,lastReceipt=null,feedbackReceipt=null;
function clean(s){return String(s||"").trim().replace(/\s+/g," ");}
async function request(action,payload){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
 try{
  const opts=payload?{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,...payload}),signal:abort.signal}:{signal:abort.signal};
  const res=await fetch(API+(payload?"":"?action="+encodeURIComponent(action)),opts);
  let json;try{json=await res.json();}catch{throw Error("The field service returned an unreadable response.");}
  if(!res.ok)throw Error(json.error||"FIELD_UNAVAILABLE");
  return json;
 }finally{clearTimeout(timer);}
}
function say(id,message){$(id).textContent=message;}
function el(tag,txt,cls){const x=document.createElement(tag);if(cls)x.className=cls;x.textContent=txt;return x;}
async function refresh(){
 try{
  const [counts,feed,jarvis]=await Promise.all([request("counts"),request("feed"),request("jarvis")]);
  $("field-counts").replaceChildren(...[
   "Received: "+counts.received,"Waiting on human review: "+counts.awaitingReview,
   "Publicly reviewed: "+counts.published,"Withdrawn: "+counts.withdrawn
  ].map(t=>el("span",t)));
  const list=$("field-feed");list.replaceChildren();
  if(!feed.entries.length)list.append(el("p","There are no human-reviewed public cards yet. The first invitation is open.","feed-empty"));
  for(const item of feed.entries){
   const article=el("article","","feed-item"),tag=el("strong",item.kind.toUpperCase()+" · "+item.progress),heading=el("h3",item.title),body=el("p",item.nextStep||"No next step published."),hint=el("small",(item.update||"Reviewed for display; outcome not independently confirmed.")+" · "+new Date(item.publishedAt).toLocaleDateString());
   const btn=el("button","I can offer a small next step →","btn");btn.type="button";
   btn.addEventListener("click",()=>{
    relatedTo=item.id;
    const radio=document.querySelector('input[name="kind"][value="OFFER"]');radio.checked=true;
    $("title").value="I can help with: "+item.title.slice(0,90);
    $("step").value="A small offer to help, pending the original owner's separate agreement.";
    $("stage").value="PROPOSED";
    $("card-form").dispatchEvent(new Event("change",{bubbles:true}));
    say("share-state","Drafting an offer related to reviewed card "+item.id+". Nothing has been sent.");
    $("make").scrollIntoView({behavior:"smooth"});
   });
   article.append(tag,heading,body,hint,btn);list.append(article);
  }
  const next=$("jarvis-next");next.replaceChildren(el("b","JAR;VIS / NEXT USEFUL THING"));
  const priority=jarvis.entries.find(e=>e.kind==="feedback"||e.progress==="BLOCKED"||e.progress==="NEEDS_STEWARD")||jarvis.entries[0];
  if(!priority)next.append(el("p","No reviewed open item yet. The first useful job is testing the card flow and reporting a non-sensitive defect."));
  else next.append(el("p","Candidate: "+priority.title+" · "+(priority.nextStep||"Ask a steward to assess the next step.")+" (not an assigned task or verified outcome)."));
 }catch(e){
  $("field-counts").replaceChildren(el("span","Live status unavailable — "+e.message));
  $("field-feed").replaceChildren(el("p","We can't retrieve the reviewed board just now; your local card still works.","feed-empty"));
  $("jarvis-next").replaceChildren(el("b","JAR;VIS / NOT CONNECTED TO THE FIELD RIGHT NOW"),el("p","Live opportunity feed unavailable. No model action was taken."));
 }
}
async function submitCard(){
 const btn=$("share-card");
 if(!$("share-consent").checked)return say("share-state","Check the consent box first. Nothing has been sent.");
 const title=clean($("title").value),raw=clean($("step").value),returnText=clean($("happened").value),still=clean($("open").value);
 let kind=kinds[document.querySelector('input[name="kind"]:checked').value],nextStep=raw;
 if(returnText){
  kind="return";
  nextStep=["Self-reported: "+returnText,still?"Still open: "+still:""].filter(Boolean).join(" | ").slice(0,420);
 }
 if(title.length<12||title.length>110)return say("share-state","Use a title between 12 and 110 characters.");
 btn.disabled=true;say("share-state","Saving privately for human review…");
 try{
 const result=await request("submit",{kind,lane:lanes[$("area").value]||"other",stage:$("stage").value,title,nextStep,consentToReview:true,...(relatedTo?{parentId:relatedTo}:{})});
 lastReceipt={id:result.receipt.id,withdrawKey:result.withdrawKey};
 $("my-receipt").hidden=false;
 $("receipt-text").textContent="Submission: "+result.receipt.id+"\nWithdrawal key: "+result.withdrawKey+"\nStatus: "+result.receipt.status+"\nKeep this receipt privately.";
 say("share-state","Stored privately. Awaiting human review; NOT published. Please save or copy your receipt.");
 $("share-consent").checked=false;
 relatedTo=null;await refresh();
 }catch(e){say("share-state","Not saved: "+e.message+". Your draft is still local.");}
 finally{btn.disabled=false;}
}
async function checkReceipt(r,target){
 if(!r){say(target,"No saved receipt in this page. Enter the ID and key in the little helper.");return;}
 try{const x=await request("status",r);say(target,"Status: "+x.receipt.status+" · Progress: "+x.receipt.progress+" · Publication: "+(x.receipt.publishedAt?"Reviewed and published":"not published"));}
 catch(e){say(target,"Unable to check: "+e.message);}
}
async function withdraw(r,target){
 if(!r){say(target,"No receipt present.");return;}
 if(!window.confirm("Withdraw this submission? This permanently closes the withdrawal key. Already printed or copied text cannot be recalled."))return;
 try{const x=await request("withdraw",r);say(target,x.notice);if(lastReceipt?.id===r.id)lastReceipt=null;await refresh();}
 catch(e){say(target,"Could not withdraw: "+e.message);}
}
async function copyText(text,target){
 try{await navigator.clipboard.writeText(text);say(target,"Copied. Keep your private withdrawal key somewhere safe.");}
 catch{say(target,"Clipboard unavailable. Select and copy the receipt text manually.");}
}
function wireClip(){
 const panel=$("clip-panel"),toggle=$("clip-toggle");
 function show(open){panel.hidden=!open;toggle.setAttribute("aria-expanded",String(open));if(open)$("feedback-text").focus();}
 toggle.addEventListener("click",()=>show(panel.hidden));
 $("clip-close").addEventListener("click",()=>show(false));
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden){show(false);toggle.focus();}});
 $("send-feedback").addEventListener("click",async()=>{
  if(!$("feedback-consent").checked)return say("feedback-status","Consent is required before sending.");
  const content=clean($("feedback-text").value),kind=$("feedback-kind").value;
  if(content.length<12)return say("feedback-status","Describe the issue in at least 12 characters (no names or private records).");
  const title=(kind+": "+content).slice(0,110);
  const remainder=content.length+kind.length+2>110?content.slice(110-kind.length-2):"";
  const btn=$("send-feedback");btn.disabled=true;say("feedback-status","Submitting privately…");
  try{
   const result=await request("submit",{kind:"feedback",lane:"site",stage:"PROPOSED",title,nextStep:remainder,consentToReview:true});
   feedbackReceipt={id:result.receipt.id,withdrawKey:result.withdrawKey};
   $("feedback-receipt").hidden=false;
   $("feedback-receipt").textContent="Receipt: "+feedbackReceipt.id+"\nWithdrawal key: "+feedbackReceipt.withdrawKey+"\nPrivate · PENDING";
   say("feedback-status","Issue stored for review. Not public until approved. Save the receipt below.");
   $("feedback-consent").checked=false;$("feedback-text").value="";
   await refresh();
  }catch(e){say("feedback-status","Not saved: "+e.message);}
  finally{btn.disabled=false;}
 });
 $("refresh-field").addEventListener("click",refresh);
 $("lookup").addEventListener("click",()=>{
  checkReceipt({id:clean($("lookup-id").value),withdrawKey:clean($("lookup-key").value)},"lookup-result");
 });
}
$("share-card").addEventListener("click",submitCard);
$("copy-receipt").addEventListener("click",()=>lastReceipt&&copyText($("receipt-text").textContent,"share-state"));
$("check-receipt").addEventListener("click",()=>checkReceipt(lastReceipt,"share-state"));
$("withdraw-receipt").addEventListener("click",()=>withdraw(lastReceipt,"share-state"));
wireClip();
refresh();
