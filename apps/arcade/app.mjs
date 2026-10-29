import {threeGifts,textFor,LIMIT} from "./engine.mjs";
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
el("print").addEventListener("click",()=>{
  if(cards&&!ended)window.print();
});
