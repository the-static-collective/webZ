import {readCrossing,makeReturn,doorsFor,TOPICS} from './model.mjs';
import {putSessionCrossing,readSessionCrossing,forgetSessionCrossing} from './session.mjs';
const $=id=>document.getElementById(id);
let ticket=null;
const label={grocery:'Community grocery',milk:'Milk sourcing',care:'Care infrastructure',artists:'Artists and culture',park:'Environmental stewardship',church:'Church / community'};
function draw(topic){
  const section=$('door-list');section.replaceChildren();
  for(const door of doorsFor(topic)){
    const article=document.createElement('article');
    const h=document.createElement('h3');h.textContent=door.label;
    const p=document.createElement('p');p.textContent=door.what;
    const a=document.createElement('a');a.href=door.href;a.textContent='Open this independent door ↗';
    a.referrerPolicy='no-referrer';
    article.append(h,p,a);section.append(article);
  }
}
function clearTicket(){
  ticket=null;$('save-return').disabled=true;
  try{forgetSessionCrossing(window.sessionStorage);}catch{}
}
function admit(packet,kind){
  ticket=readCrossing(packet);
  $('topic').value=ticket.topic;draw(ticket.topic);
  $('save-return').disabled=false;
  $('ticket-status').textContent=kind+' · '+label[ticket.topic]+' / '+ticket.capacity+
    ' · only public context carried · original question absent · proposed / UNSENT. No consent or service affiliation.';
  $('return-status').textContent='You can record an unverified local self-report. Nothing has been sent, reviewed, or completed by visiting this page.';
}
$('forget').addEventListener('click',()=>{
  clearTicket();$('ticket').value='';
  $('ticket-status').textContent='Starting point forgotten for this browser tab. Browse any room without a stored ticket.';
  $('return-status').textContent='Nothing to return. Start at First Yes if you would like to prepare a new card.';
});
$('topic').addEventListener('change',()=>{
  clearTicket();$('ticket').value='';
  $('ticket-status').textContent='Browsing '+label[$('topic').value]+' without saved context. No cross-system record exists.';
  $('return-status').textContent='Prepare a new public card in First Yes to record a local return.';
  draw($('topic').value);
});
$('ticket').addEventListener('change',async()=>{
  clearTicket();
  const file=$('ticket').files?.[0];
  if(!file)return;
  if(file.size>8192||file.size<30){
    $('ticket-status').textContent='Ticket refused: file outside 30–8192 bytes. No file content was sent.';return;
  }
  try{
    const packet=readCrossing(await file.text());
    // A portable ticket becomes an explicit browser continuation only
    // on successful user-selected import. No server/database write.
    try{putSessionCrossing(window.sessionStorage,packet);}catch{}
    admit(packet,'LOCAL TICKET OPENED');
  }catch{
    clearTicket();
    $('ticket-status').textContent='Unrecognized or unsafe ticket. Nothing loaded. Do not use personal case files here.';
    $('return-status').textContent='Nothing imported; no receipt can be created.';
  }
});
function save(data,name){
  const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json;charset=utf-8'}));
  const a=document.createElement('a');a.href=u;a.download=name;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);
}
$('save-return').addEventListener('click',()=>{
  if(!ticket)return;
  try{
    const report=makeReturn(ticket,$('outcome').value);
    save(report,'abundent-crossing-return-'+ticket.topic+'-unverified.json');
    $('return-status').textContent='Saved locally: SELF-REPORTED / UNVERIFIED. No database post, human review, proof or assignment.';
  }catch{$('return-status').textContent='Could not prepare a return. Nothing was saved.';}
});
draw(TOPICS[0]);
// Automatic same-tab handoff, after deliberate Continue click on First Yes.
try{
  const packet=readSessionCrossing(window.sessionStorage);
  if(packet)admit(packet,'AUTOMATIC CONTINUATION READY');
  else $('ticket-status').textContent='No active public-safe starting point. Explore by topic, or come directly from First Yes—no file needed.';
}catch{
  $('ticket-status').textContent='This browser blocks temporary storage. You may browse or use advanced file import instead.';
}
