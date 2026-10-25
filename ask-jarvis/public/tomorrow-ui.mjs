import {CHIPS,EXAMPLES,validate,buildBoard,invitationText,localReceipt} from './tomorrow-machine.mjs';
// All interaction remains on-device until a human explicitly uses Share, Copy or Print.
const $=id=>document.getElementById(id);
const controls={
 form:$('loadout'),offer:$('offer'),need:$('need'),time:$('time'),
 chips:$('chips'),examples:$('examples'),formStatus:$('form-status'),
 board:$('board'),tickets:$('tickets'),detail:$('detail'),tasks:$('tasks'),
 actionStatus:$('action-status')
};
const selectedTags=new Set();
const doneByMission=new Map();
const outcomesByMission=new Map();
let board=null,mission=null;
const node=(tag,cls,content)=>{
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(content!==undefined)element.textContent=String(content);
 return element;
};
for(const [id,label] of CHIPS){
 const button=node('button','chip',label);
 button.type='button';button.dataset.resource=id;
 button.setAttribute('aria-pressed','false');
 button.addEventListener('click',()=>{
  const active=selectedTags.has(id);
  if(active)selectedTags.delete(id);else selectedTags.add(id);
  button.setAttribute('aria-pressed',String(!active));
 });
 controls.chips.append(button);
}
const toggleState=()=>{
 for(const el of controls.chips.children)
  el.setAttribute('aria-pressed',String(selectedTags.has(el.dataset.resource)));
};
const config=()=>({offer:controls.offer.value,need:controls.need.value,
 time:controls.time.value,chips:[...selectedTags]});
function loadExample(example){
 controls.offer.value=example.offer;
 controls.need.value=example.need;
 controls.time.value=example.time;
 selectedTags.clear();for(const tag of example.chips)selectedTags.add(tag);
 toggleState();
 controls.formStatus.textContent='';
 create();
}
for(const example of EXAMPLES){
 const button=node('button','sample',example.label);button.type='button';
 button.addEventListener('click',()=>loadExample(example));
 controls.examples.append(button);
}
function renderTickets(){
 controls.tickets.replaceChildren();
 for(const m of board.missions){
  const el=node('article','ticket'+(mission?.id===m.id?' selected':''));
  const label=node('span','tag',m.rankLabel);
  const eyebrow=node('p','micro',m.eyebrow);
  const title=node('h3','',m.title);
  const why=node('p','',m.why);
  const resources=node('p','matched',m.matchedResources.length
   ?'MATCHED: '+m.matchedResources.join(' · ')
   :'OPEN QUESTION: a human can help find the missing piece.');
  const button=node('button','',mission?.id===m.id?'Selected ✓':'TRY THIS MISSION →');
  button.type='button';button.setAttribute('aria-pressed',String(mission?.id===m.id));
  button.addEventListener('click',()=>select(m.id,true));
  el.append(label,eyebrow,title,why,resources,button);
  controls.tickets.append(el);
 }
}
function appendPrintable(){
 const sheet=$('print-card');sheet.replaceChildren();
 if(!board||!mission)return;
 sheet.append(node('p','', '✳ TOMORROW MACHINE · UNCONFIRMED PROPOSAL'),
  node('h1','',mission.title),node('h2','',mission.eyebrow));
 const invitation=node('div','print-note');
 invitation.append(node('h3','', 'The invitation'),node('p','',mission.invite),
  node('p','','Offered: '+board.offer));
 if(board.need)invitation.append(node('p','','Possible purpose: '+board.need));
 invitation.append(node('p','','Time available: '+board.time));
 sheet.append(invitation,node('h3','','Three practical checkpoints'));
 const list=node('ol');
 for(const s of mission.steps){
  const item=node('li');
  item.append(node('b','',s.label),node('p','',s.detail));list.append(item);
 }
 sheet.append(list,node('h3','','Safety and permission'),
  node('p','',mission.caution),
  node('h3','','What actually happened?'),
  node('p','','_________________________________________________________'),
  node('p','','_________________________________________________________'),
  node('footer','', 'This is a draft for voluntary human review. No service, event, person, venue or permission is confirmed.'));
}
function drawTasks(){
 controls.tasks.replaceChildren();
 const done=doneByMission.get(mission.id)||new Set();
 for(const s of mission.steps){
  const item=node('li');
  const label=node('label');
  const cb=document.createElement('input');
  cb.type='checkbox';cb.checked=done.has(s.id);
  cb.addEventListener('change',()=>{
   if(cb.checked)done.add(s.id);else done.delete(s.id);
   doneByMission.set(mission.id,done);
   const count=done.size;
   controls.actionStatus.textContent=count+' of '+mission.steps.length+
    ' personal checkpoints marked. No external action was verified.';
  });
  const content=node('span');
  content.append(node('strong','',s.label),node('small','',s.detail));
  label.append(cb,content);item.append(label);controls.tasks.append(item);
 }
}
function select(id,scroll=false){
 mission=board.missions.find(m=>m.id===id);
 if(!mission)return;
 renderTickets();
 $('picked-id').textContent='MISSION '+mission.rank+' / '+mission.id.toUpperCase();
 $('picked-title').textContent=mission.title;
 $('picked-why').textContent=mission.why;
 $('picked-invite').textContent=mission.invite;
 $('picked-safety').textContent=mission.caution;
 $('role-title').textContent=mission.openRole.name+' · an open role';
 $('role-first').textContent=mission.openRole.starter;
 $('role-link').href='/roles/#role='+encodeURIComponent(mission.openRole.id);
 $('draft-preview').textContent=invitationText(board,mission);
 $('outcome').value=outcomesByMission.get(mission.id)||'NOT_ATTEMPTED';
 drawTasks();appendPrintable();
 controls.actionStatus.textContent='';
 controls.detail.hidden=false;
 if(scroll)controls.detail.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function create(){
 const error=validate(config());
 if(error){
  controls.formStatus.textContent=error;
  controls.board.hidden=true;
  controls.detail.hidden=true;board=null;mission=null;return;
 }
 board=buildBoard(config());
 mission=null;doneByMission.clear();outcomesByMission.clear();
 controls.formStatus.textContent='3 draft missions made here in your browser. No network or model request.';
 controls.board.hidden=false;
 select(board.missions[0].id);
}
controls.form.addEventListener('submit',event=>{event.preventDefault();create();
 if(board)controls.board.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
});
async function copy(text){
 if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return;}
 const area=node('textarea');area.value=text;
 area.style.position='fixed';area.style.top='-1000px';
 document.body.append(area);area.focus();area.select();
 try{if(!document.execCommand('copy'))throw Error('COPY_UNAVAILABLE');}finally{area.remove();}
}
$('copy').addEventListener('click',async()=>{
 if(!mission)return;
 try{await copy(invitationText(board,mission));controls.actionStatus.textContent='Invitation copied. You choose whether and to whom it goes.';}
 catch{controls.actionStatus.textContent='Copy unavailable here. Open “See the exact draft” below and select the text.';}
});
$('share').addEventListener('click',async()=>{
 if(!mission)return;
 const message=invitationText(board,mission);
 try{
  if(typeof navigator.share==='function'){
   await navigator.share({title:mission.title+' · Proposal',text:message});
   controls.actionStatus.textContent='Share sheet closed. No recipient or delivery is tracked here.';
  }else{
   await copy(message);
   controls.actionStatus.textContent='System share is unavailable, so we copied your draft instead.';
  }
 }catch(e){
  controls.actionStatus.textContent=e?.name==='AbortError'?'Share canceled; nothing was sent by this page.':'Sharing unavailable; use Copy instead.';
 }
});
$('print').addEventListener('click',()=>{
 if(!mission)return;
 appendPrintable();controls.actionStatus.textContent='Opening your device’s print dialog.';
 window.print();
});
$('outcome').addEventListener('change',()=>{
 if(mission)outcomesByMission.set(mission.id,$('outcome').value);
 controls.actionStatus.textContent='Outcome noted on this device only. Nothing is verified or uploaded.';
});
$('receipt').addEventListener('click',()=>{
 if(!mission)return;
 const completed=[...(doneByMission.get(mission.id)||new Set())];
 const receipt=localReceipt(board,mission,completed,$('outcome').value);
 const blob=new Blob([JSON.stringify(receipt,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=node('a');a.href=url;a.download='tomorrow-'+mission.id+'-local-receipt.json';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 controls.actionStatus.textContent='Progress downloaded to your device. Nothing was uploaded.';
});
// Show a ready-to-use example immediately. User may edit any field and remake it.
loadExample(EXAMPLES[0]);
