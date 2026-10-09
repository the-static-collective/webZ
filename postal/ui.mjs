import {prepareHeldGrOPostalEncounter} from "./bridge.mjs";
const $=id=>document.getElementById(id);
let prepared=null;
function clear(){
 prepared=null;
 $("result").hidden=true;$("preview").textContent="";$("message").textContent="";
}
$("fieldkit").addEventListener("change",clear);
$("choice").addEventListener("change",clear);
$("consent").addEventListener("change",clear);
$("review").addEventListener("click",async()=>{
 clear();
 try{
   const file=$("fieldkit").files?.[0];
   if(!file||file.size>35_000)throw Error("Choose a JSON file no larger than 35 KB");
   const kit=JSON.parse(await file.text());
   prepared=await prepareHeldGrOPostalEncounter({
     kit,choice:$("choice").value,explicitLocalConsent:$("consent").checked
   });
   $("preview").textContent=JSON.stringify(prepared,null,2);
   $("result").hidden=false;
   $("message").textContent="Local signed claim replayed. No physical or legal admission.";
 }catch(error){
   $("message").textContent="HOLD: "+String(error?.message||error);
 }
});
$("download").addEventListener("click",()=>{
 if(!prepared)return;
 const text=JSON.stringify(prepared,null,2)+"\n";
 const url=URL.createObjectURL(new Blob([text],{type:"application/json"}));
 const a=document.createElement("a");
 a.href=url;a.download="gro-postal-held-review.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
});
$("copy").addEventListener("click",async()=>{
 if(!prepared)return;
 try{
 await navigator.clipboard.writeText(JSON.stringify(prepared,null,2));
 $("message").textContent="Reviewed encounter copied.";
 }catch{
 $("message").textContent="Clipboard unavailable; save the JSON instead.";
 }
});
$("clear").addEventListener("click",()=>{
 $("fieldkit").value="";$("consent").checked=false;clear();
});
