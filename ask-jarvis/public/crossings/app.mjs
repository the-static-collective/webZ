import {readCrossing,makeReturn,doorsFor,TOPICS} from './model.mjs';
const $=id=>document.getElementById(id);
let ticket=null;
const label={grocery:'Community grocery',milk:'Milk sourcing',care:'Care infrastructure',artists:'Artists and culture',park:'Environmental stewardship',church:'Church / community'};
function draw(topic){
  const section=$('door-list');
  section.replaceChildren();
  for(const door of doorsFor(topic)){
    const article=document.createElement('article');
    const h=document.createElement('h3');h.textContent=door.label;
    const p=document.createElement('p');p.textContent=door.what;
    const a=document.createElement('a');a.href=door.href;a.textContent='Open this independent door ↗';
    a.referrerPolicy='no-referrer';
    article.append(h,p,a);section.append(article);
  }
}
$('topic').addEventListener('change',()=>{ticket=null;$('save-return').disabled=true;
  $('ticket').value='';
  $('ticket-status').textContent='Browsing '+label[$('topic').value]+' only; imported ticket cleared. No cross-system record exists.';
  $('return-status').textContent='Import a valid ticket before making a return receipt.';
  draw($('topic').value);
});
$('ticket').addEventListener('change',async()=>{
  ticket=null;$('save-return').disabled=true;
  const file=$('ticket').files?.[0];
  if(!file)return;
  if(file.size>8192||file.size<30){$('ticket-status').textContent='Ticket refused: file outside 30–8192 bytes. No file content was sent.';return;}
  try{
    const raw=await file.text();
    const packet=readCrossing(raw);
    ticket=packet;$('topic').value=packet.topic;draw(packet.topic);
    $('ticket-status').textContent='LOCAL TICKET READ · '+label[packet.topic]+' / '+packet.capacity+
      ' · original question absent · state PROPOSED / UNSENT. Reviewed publication does not verify claims.';
    $('save-return').disabled=false;
    $('return-status').textContent='Ready to save an unverified local self-report. No messages, approvals or participation are assumed.';
  }catch{
    ticket=null;$('ticket-status').textContent='Unrecognized or unsafe crossing format. No ticket loaded. Do not use personal case files here.';
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
  try{const report=makeReturn(ticket,$('outcome').value);
    save(report,'abundent-crossing-return-'+ticket.topic+'-unverified.json');
    $('return-status').textContent='Saved locally: SELF-REPORTED / UNVERIFIED. Nothing posted, validated or sent to another project.';
  }catch{$('return-status').textContent='Could not prepare a return. No file was saved.';}
});
draw(TOPICS[0]);