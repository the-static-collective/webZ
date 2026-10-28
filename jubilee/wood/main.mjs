import{WOOD_CARD_TYPES,URGENCY,COUNTY_HINTS,prepareWoodFieldCard}from"./model.mjs";const $=id=>document.getElementById(id);
for(const [v,label] of Object.entries(WOOD_CARD_TYPES)){$("kind").add(new Option(label,v))}
for(const [v,label] of Object.entries(URGENCY)){$("urgency").add(new Option(label,v))}
for(const c of COUNTY_HINTS)$("county").add(new Option(c,c));
$("condition").value="unknown";$("county").value="Waseca";$("urgency").value="this-winter";
let current="";function invalidate(){current="";$("copy").disabled=true;$("status").textContent="Options changed. Prepare a fresh draft; nothing has been sent.";}
for(const id of ["kind","county","condition","urgency","moisture","public-only"])$(id).addEventListener("input",invalidate);
$("kind").addEventListener("change",()=>{const wood=["seasoned","future"].includes($("kind").value);$("condition").value=wood?"unknown":"not-applicable";if(!wood)$("moisture").value="";});
$("offer-form").addEventListener("submit",e=>{e.preventDefault();try{current=prepareWoodFieldCard({kind:$("kind").value,county:$("county").value,condition:$("condition").value,urgency:$("urgency").value,moisture:$("moisture").value,publicOnly:$("public-only").checked});$("output").value=current;$("copy").disabled=false;$("status").textContent="Unsigned local field card prepared. Human verification required before any action. Nothing was sent or stored."}catch(error){current="";$("output").value="";$("copy").disabled=true;$("status").textContent=error.message}});
$("copy").addEventListener("click",async()=>{try{if(!current)return;await navigator.clipboard.writeText(current);$("status").textContent="Copied locally. Nothing sent."}catch{$("status").textContent="Clipboard unavailable; select and copy the draft manually."}});
$("print").addEventListener("click",()=>window.print());
