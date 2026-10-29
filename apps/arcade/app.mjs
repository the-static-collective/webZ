import {threeGifts,textFor,LIMIT} from "./engine.mjs";
import {makeCreativeCarry} from "./source-carry.mjs";
import {makePocketEdition} from "./edition.mjs";
import {makeFilmRecipe} from "./film-recipe.mjs";
const el=id=>document.getElementById(id);
let cards=null,index=0,ended=false;
function showCard(){
  const c=cards[index];
  el("progress").textContent="CARD "+(index+1)+" OF "+LIMIT;
  el("kind").textContent=c.kind;
  el("card-title").textContent=c.title;
  el("artifact").textContent=c.artifact;
  el("note").textContent=c.note;
  el("card-status").textContent="";
  el("advance").textContent=index===LIMIT-1?"Finish the little parade ↗":"Open one more ↗";
  el("card-title").focus();
}
function finish(){
  if(ended)return;
  ended=true;
  cards=null;
  el("active").hidden=true;
  el("start").hidden=true;
  el("complete").hidden=false;
  el("complete-title").focus();
}
el("start").addEventListener("submit",event=>{
  event.preventDefault();
  if(cards||ended)return;
  try{
    cards=threeGifts(el("topic").value);
    index=0;
    el("start").hidden=true;
    el("active").hidden=false;
    showCard();
  }catch{
    el("input-status").textContent="Try a shorter topic, or leave it blank.";
  }
});
el("advance").addEventListener("click",()=>{
  if(ended||!cards)return;
  if(index+1>=LIMIT){finish();return;}
  index++;
  showCard();
});
el("finish").addEventListener("click",finish);
el("copy").addEventListener("click",async()=>{
  if(!cards||ended)return;
  try{
    await navigator.clipboard.writeText(textFor(cards[index]));
    el("card-status").textContent="Copied. You can leave with it.";
  }catch{
    el("card-status").textContent="Clipboard unavailable. Select the card text to copy it.";
  }
});
el("save").addEventListener("click",()=>{
  if(!cards||ended)return;
  const card=cards[index];
  const url=URL.createObjectURL(new Blob([textFor(card)],{type:"text/plain;charset=utf-8"}));
  const link=document.createElement("a");
  link.href=url;link.download="three-bells-"+card.id+".txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  el("card-status").textContent="Download offered to your device. Nothing uploaded.";
});
function exportSourceCarry(lane){
  if(!cards||ended)return;
  const packet=makeCreativeCarry(el("topic").value,index,lane);
  const content=JSON.stringify(packet,null,2)+"\n";
  const url=URL.createObjectURL(new Blob([content],{type:"application/json;charset=utf-8"}));
  const a=document.createElement("a");
  a.href=url;
  a.download="three-bells-"+cards[index].id+"-"+lane+"-draft.json";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  el("handoff-status").textContent="Downloaded a preparation-only source packet. Nothing was sent, approved or executed.";
}
el("zine-download").addEventListener("click",()=>{
  if(!cards||ended)return;
  const html=makePocketEdition(el("topic").value,index);
  const href=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
  const link=document.createElement("a");
  link.href=href;
  link.download="three-bells-"+cards[index].id+"-pocket-book.html";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
  el("handoff-status").textContent="Your standalone printable pocket book was offered to your device. It has not been published or uploaded.";
});
el("press-handoff").addEventListener("click",()=>exportSourceCarry("lemonpress"));
el("playdeck-handoff").addEventListener("click",()=>exportSourceCarry("playdeck"));
el("film-recipe-download").addEventListener("click",()=>{
  if(!cards||ended)return;
  try{
    const seconds=Number(el("film-seconds").value);
    const manifest=makeFilmRecipe(el("topic").value,index,seconds);
    const url=URL.createObjectURL(new Blob([JSON.stringify(manifest,null,2)+"\n"],{type:"application/json;charset=utf-8"}));
    const a=document.createElement("a");
    a.href=url;
    a.download="three-bells-"+cards[index].id+"-music-film-recipe.json";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    el("handoff-status").textContent="A private offline film recipe was downloaded. No song was uploaded and no video was rendered.";
  }catch(e){
    el("handoff-status").textContent="Choose a duration from 10 to 3600 seconds before exporting.";
  }
});
el("print").addEventListener("click",()=>{
  if(cards&&!ended)window.print();
});
