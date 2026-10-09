import {prepareGleanInvitation,coldVerifyGleanInvitation} from "./bridge.mjs";
const $=id=>document.getElementById(id);
let prepared=null,generation=0;
function forget(){
 generation++;prepared=null;
 $("result").hidden=true;$("public").textContent="";$("hash").textContent="";
 $("message").textContent="";
}
$("offer").addEventListener("change",forget);
$("held").addEventListener("change",forget);
$("consent").addEventListener("change",forget);
async function read(id){
 const f=$(id).files?.[0];
 if(!f||f.size<3||f.size>524288)throw Error("LOCAL_"+id.toUpperCase()+"_JSON_512_KIB_REQUIRED");
 const o=JSON.parse(await f.text());
 if(!o||typeof o!=="object"||Array.isArray(o))throw Error("GLEAN_JSON_OBJECT_REQUIRED");
 return o;
}
$("prepare").addEventListener("click",async()=>{
 const now=++generation;prepared=null;$("result").hidden=true;
 try{
  if($("consent").checked!==true)throw Error("EXPLICIT_GLEAN_POSTCARD_CONSENT_REQUIRED");
  const [offer,heldQuest]=await Promise.all([read("offer"),read("held")]);
  const args={offer,heldQuest,consent:true};
  const result=await prepareGleanInvitation(args);
  await coldVerifyGleanInvitation(args,result);
  if(now!==generation)return;
  prepared=result;
  $("public").textContent=result.public_text;
  $("hash").textContent="Unsigned postcard SHA-256: "+result.proposal.id+
    " · "+result.proposal.byte_length+" bytes";
  $("result").hidden=false;
  $("message").textContent="Prepared locally. Not delivered or admitted.";
 }catch(e){if(now===generation)$("message").textContent="HOLD — "+String(e?.message||e);}
});
$("copy").addEventListener("click",async()=>{
 if(!prepared)return;
 try{
  await navigator.clipboard.writeText(prepared.public_text);
  $("message").textContent="Copied by your request. Paste manually into WEBZ porch.";
 }catch{
  $("message").textContent="Clipboard unavailable; select exact text on the screen.";
 }
});
$("download").addEventListener("click",()=>{
 if(!prepared)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(prepared,null,2)+"\n"],
                                    {type:"application/json"}));
 const a=document.createElement("a");
 a.href=url;a.download="webz-glean-unsigned-invitation.json";
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1600);
});
$("clear").addEventListener("click",()=>{
 forget();$("consent").checked=false;$("offer").value="";$("held").value="";
 $("message").textContent="Inputs cleared from this page; downloaded files remain yours.";
});
