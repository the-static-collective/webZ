import { SEEDS, seedById, seedLink, draftLink, readDraftHash, makeDraft, validateDraft, makeReturn, makeObservationCrossing, validateObservationCrossing, isProductionHost } from "./core.mjs";

const $ = id => document.getElementById(id);
let selected = seedById(new URL(location.href).searchParams.get("card")) || SEEDS[0];
let localDraft = null;
let localCrossing = null;
const production = isProductionHost(location.href);
const message = (text, error=false) => { $("message").textContent=text; $("message").className=error?"error":""; };
function node(tag, className, content) {
  const el=document.createElement(tag);if(className)el.className=className;
  if(content !== undefined)el.textContent=String(content);return el;
}
function currentURL(card) {return card.state==="SEED" ? seedLink(card.id,location.href) : draftLink(card,location.href);}
function cardBits(card,target,print=false) {
  target.replaceChildren(); target.classList.toggle("reality",card.kind==="REALITY.2");
  target.append(
    node("div","eyebrow",card.kind+" / "+(card.category||"NEW QUESTION")),
    node("h2","",card.title),
    node("p","",card.question),
    node("div","small",card.state==="SEED" ? card.deck+" · "+card.sourceCode : "New local question · parent "+(card.parentId||"none")),
    node("div","small",card.state==="SEED"?"PUBLIC SEED CARD / INDEPENDENT PROTOTYPE":"UNREVIEWED DRAFT / NOT PUBLISHED")
  );
}
function qr(target,link) {
  target.replaceChildren();
  if(typeof window.QRCode!=="function"){target.append(node("p","small","QR renderer unavailable; use the printed URL."));return;}
  try{new window.QRCode(target,{text:link,width:132,height:132,colorDark:"#000000",colorLight:"#ffffff",correctLevel:window.QRCode.CorrectLevel.M});}
  catch{target.replaceChildren(node("span","small","QR exceeds printable capacity. Use the URL/JSON instead."));}
}
function renderActive(){
  cardBits(selected,$("active"));
  let url;try{url=currentURL(selected)}catch(e){message(e.message,true);return;}
  $("link-text").textContent=url;
  qr($("qr-preview"),url);
  const draft=selected.state!=="SEED";
  $("export-draft").disabled=!draft;
  $("release-warning").textContent=draft ? "Unreviewed, portable DRAFT only. Its QR carries the text in the URL fragment; it is not stored by Abundent or approved by any person or organization." :
    production ? "Reviewed seed transcription only. A QR scan is not consent, a real encounter, or co-op/Coalition endorsement." :
    "PREVIEW LINK — this preview is not the public Abundent deployment. Do not distribute QR cards until the final /field/ URL is verified. No co-op/Coalition endorsement.";
}
function filtered(){
  const q=$("query").value.trim().toLowerCase(), d=$("deck").value, k=$("kind").value;
  return SEEDS.filter(c=>(d==="all"||c.id.startsWith(d+"-"))&&(k==="all"||c.kind===k)&&(!q||[c.title,c.question,c.category,c.id].some(v=>v.toLowerCase().includes(q))));
}
function renderCatalog(){
  const results=filtered(); $("count").textContent=results.length+" of "+SEEDS.length+" seed cards";
  $("cards").replaceChildren(...results.map(c=>{
    const li=node("li");const b=node("button");b.type="button";b.setAttribute("aria-current",String(selected.id===c.id));
    b.append(node("strong","",c.title),node("small","",c.kind+" · "+c.deck));b.addEventListener("click",()=>setSelected(c,true));li.append(b);return li;
  }));
}
function setSelected(card,updateAddress=false){
  selected=card;
  if(card.state==="UNREVIEWED_DRAFT")localDraft=card;
  if(updateAddress){try{history.replaceState(null,"",currentURL(card));}catch(e){message("Could not update the share URL: "+e.message,true);}}
  renderCatalog();renderActive();refreshObservationOrigin();
}
function renderParentList(){
  const select=$("new-parent");
  for(const c of SEEDS){const option=node("option","",c.title+" ("+c.sourceCode+", "+c.deck+")");option.value=c.id;select.append(option);}
}
// Every card may be a doorway to a new local observation. The private note is
// intentionally kept out of the shareable card and its encoded fragment.
function refreshObservationOrigin(){
  const select = $("obs-parent");
  select.replaceChildren(node("option","", "No origin card"));
  select.options[0].value = "";
  for(const card of SEEDS){
    const option=node("option","",card.title+" · "+card.sourceCode+" ("+card.deck+")");
    option.value=card.id;select.append(option);
  }
  if(selected.state==="UNREVIEWED_DRAFT"){
    const option=node("option","",selected.title+" · LOCAL DRAFT (unpublished)");
    option.value=selected.id;select.append(option);
  }
  select.value=selected.id;
}

function download(obj,basename){
  const json=JSON.stringify(obj,null,2)+"\n";
  const blob=new Blob([json],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=node("a");a.href=url;a.download=basename.replace(/[^a-z0-9-]/g,"-")+".json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function makePrintedCard(card){
  const art=node("article","print-card"+(card.kind==="REALITY.2"?" reality":""));
  const link=currentURL(card), live=production, local=card.state!=="SEED";
  art.append(node("h3","stamp",card.kind+" / "+(card.sourceCode||"LOCAL")),node("h2","",card.title),node("p","",card.question));
  const target=node("div","qr");qr(target,link);art.append(target);
  art.append(node("div","url",link));
  art.append(node("div","boundary",local?"UNREVIEWED PORTABLE DRAFT · NOT PUBLISHED":live?"INDEPENDENT PUBLIC SEED · NO ASSIGNED WORK":"PREVIEW URL ONLY · NOT DISTRIBUTABLE"));
  return art;
}
function printCards(cards){
  const per=$("layout").value==="nine"?9:4,layout=per===9?"nine":"four",s=$("sheet");
  s.replaceChildren();s.className="sheet";
  for(let i=0;i<cards.length;i+=per){
    const page=node("div","print-page "+layout);
    for(const card of cards.slice(i,i+per)){try{page.append(makePrintedCard(card));}catch(e){message("Print preparation: "+e.message,true);return;}}
    s.append(page);
  }
  if(!cards.length){message("No cards match your filters.",true);return;}
  // QRCode may use canvas-to-image promotion; allow its image load before printing.
  setTimeout(()=>window.print(),350);
}
function startup(){
  renderParentList();
  if(location.hash.startsWith("#draft=")){
    try{const draft=readDraftHash(location.hash);if(draft){selected=draft;localDraft=draft;}}
    catch(e){message("Invalid portable draft link: "+e.message,true);}
  }
  renderCatalog();renderActive();refreshObservationOrigin();
  for(const id of ["query","deck","kind"])$(id).addEventListener("input",renderCatalog);
  $("print-one").addEventListener("click",()=>printCards([selected]));
  $("print-sheet").addEventListener("click",()=>printCards(filtered()));

  $("observation-form").addEventListener("submit",e=>{
    e.preventDefault();
    try{
      // The original observation is a separate unverified local note.
      // Only the human-written title and question can appear in the QR.
      const crossing=makeObservationCrossing({
        parentId:$("obs-parent").value,
        observation:$("obs-note").value,
        kind:$("obs-kind").value,
        title:$("obs-title").value,
        question:$("obs-question").value,
        acknowledged:$("obs-ack").checked
      });
      draftLink(crossing.descendant,location.href); // refuse an unscannable draft before changing selection
      localCrossing=crossing;
      $("obs-note").value=""; // reduce casual exposure of the original observation
      $("obs-ack").checked=false;
      $("export-crossing").disabled=false;
      $("crossing-status").textContent="Unverified observation held locally for "+crossing.descendant.id+". Save the private JSON now if you want to keep the note after leaving; the QR contains only the new card.";
      setSelected(crossing.descendant,true);
      message("Observation and proposed question are separate. The portable card is an unpublished draft; no offer, publication, or contact was made.");
    }catch(err){message(err.message,true);}
  });
  $("export-crossing").addEventListener("click",()=>{
    if(!localCrossing){message("Make a crossing before saving one.",true);return;}
    download(localCrossing,"field-observation-"+localCrossing.descendant.id);
    message("Saved your observation + descendant card as a LOCAL JSON bundle. This file was not uploaded.");
  });
  $("import-draft").addEventListener("change",async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      if(file.size>8192)throw Error("Local card JSON exceeds the 8 KB import limit.");
      const parsed=JSON.parse(await file.text());
      const crossing=parsed.schema==="abundent.observation-crossing/v0.1" ? validateObservationCrossing(parsed) : null;
      const draft=crossing ? crossing.descendant : validateDraft(parsed); // only known, unpublished local objects
      draftLink(draft,location.href);
      if(crossing){
        localCrossing=crossing;
        $("export-crossing").disabled=false;
        $("crossing-status").textContent="Private observation reloaded from your own JSON for "+draft.id+". The note is not in the QR or card.";
      }
      setSelected(draft,true);
      message("Reopened saved local card "+draft.id+". Nothing was uploaded or published. You can now use it as the origin of a new observation.");
    }catch(err){message("Could not reopen local card: "+err.message,true);}
    finally{e.target.value="";}
  });

  $("draft-form").addEventListener("submit",e=>{
    e.preventDefault();
    try{
      const draft=makeDraft({kind:$("new-kind").value,title:$("new-title").value,question:$("new-question").value,parentId:$("new-parent").value,acknowledged:$("ack").checked});
      const link=draftLink(draft,location.href);
      setSelected(draft,true);message("Local draft created. Use Save draft JSON or print its portable QR. Nothing was published.");
    }catch(e){message(e.message,true);}
  });
  $("export-draft").addEventListener("click",()=>{
    if(!localDraft){message("Create or open a local draft first.",true);return;}
    download(localDraft,localDraft.id);message("Downloaded portable draft; no server submission.");
  });
  $("return-form").addEventListener("submit",e=>{
    e.preventDefault();
    if(!$("return-ack").checked){message("Confirm this note contains no identifying details.",true);return;}
    try{
      const ret=makeReturn(selected.id,$("return-kind").value,$("return-note").value);
      download(ret,"field-return-"+selected.id);$("return-note").value="";$("return-ack").checked=false;
      message("Saved an UNVERIFIED local return file. It was not uploaded or confirmed.");
    }catch(e){message(e.message,true);}
  });
  window.addEventListener("hashchange",()=>{
    if(!location.hash.startsWith("#draft="))return;
    try{const d=readDraftHash(location.hash);if(d)setSelected(d);}catch(e){message("Cannot open portable draft: "+e.message,true);}
  });
  if("serviceWorker" in navigator && location.protocol==="https:"){
    navigator.serviceWorker.register("./sw.js",{scope:"./"}).catch(()=>{});
  }
}
startup();
