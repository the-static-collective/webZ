import {FIRES,CIRCLES,OUTCOMES,validPurpose,makeFire,chooseFire,chooseCircle,
 readFireLink,makeFireLink,drawFirstMove,makeInvitation,makePersonalReceipt,makeTableQuestion} from './model.mjs';
import {makeTableSeedLink} from '../table-bridge.mjs';
// CAMPFIRE-022: choices are local. No service requests, tracking, hidden registration,
// public roster, inferred consent or affiliation with another organization.
const $=id=>document.getElementById(id);
const elements={fires:$('fires'),circles:$('circles'),kit:$('kit'),steps:$('kit-steps')};
const el=(tag,cls,text)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=String(text);return e;
};
let fire=readFireLink(location.hash)||makeFire({seed:'garden'});
let circle=null;
let move=null;
const checked=new Map(),reported=new Map();
let chosenKey='';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function scrollToPanel(id){$(id).scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});}
function renderFires(){
 elements.fires.replaceChildren();
 for(const seed of FIRES){
  const button=el('button','fire');button.type='button';
  button.setAttribute('aria-pressed',String(fire.id===seed.id));button.dataset.fire=seed.id;
  button.append(el('span','symbol',seed.icon),el('span','name',seed.name),
    el('span','desc',seed.description),el('span','status',seed.badge));
  button.addEventListener('click',()=>selectFire(seed,true));
  elements.fires.append(button);
 }
 if(fire.id==='custom'){
  const button=el('button','fire');button.type='button';
  button.setAttribute('aria-pressed','true');button.append(el('span','symbol','✦'),
    el('span','name','Your open question'),el('span','desc',fire.focus),
    el('span','status','NO INCUMBENT · PUBLIC-SAFE TOPIC'));
  elements.fires.append(button);
  $('new-fire').value=fire.focus;
 }
}
function renderCircles(){
 elements.circles.replaceChildren();
 for(const c of CIRCLES){
  const button=el('button','choice');button.type='button';
  button.setAttribute('aria-pressed',String(circle?.id===c.id));
  button.append(el('span','symbol',c.symbol),el('b','',c.label),el('small','',c.promise));
  button.addEventListener('click',()=>{
   circle=c;renderCircles();renderMove();
   scrollToPanel('kit');
  });
  elements.circles.append(button);
 }
 $('standing-label').textContent=circle
  ?circle.symbol+'  '+circle.label:'Choose your place by the fire.';
 $('standing-note').textContent=circle?circle.promise:
  'There is room to listen, contribute, experiment or coordinate. None is a claim of organizational authority.';
}
function selectFire(newFire,setHash=true){
 fire=newFire;circle=null;move=null;elements.kit.hidden=true;
 $('custom-status').textContent='';$('kit-status').textContent='';
 if(setHash)history.replaceState(null,'',makeFireLink(location.href,fire));
 renderFires();renderCircles();
}
function drawTasks(){
 elements.steps.replaceChildren();
 const done=checked.get(chosenKey)||new Set();
 for(const action of move.actions){
  const row=el('li');const label=el('label');
  const check=document.createElement('input');check.type='checkbox';check.checked=done.has(action.id);
  const body=el('span');body.append(el('b','',action.name),el('small','',action.detail));
  label.append(check,body);row.append(label);elements.steps.append(row);
  check.addEventListener('change',()=>{
   if(check.checked)done.add(action.id);else done.delete(action.id);
   checked.set(chosenKey,done);
   $('kit-status').textContent='Your own note: '+done.size+' / '+move.actions.length+
    ' checkpoints marked. No one else’s agreement or work was verified.';
  });
 }
}
function renderMove(){
 move=drawFirstMove(fire,circle.id);
 chosenKey=fire.id+'|'+fire.focus+'|'+circle.id;
 $('kit-title').textContent='One useful move for '+fire.name;
 $('kit-intro').textContent=fire.focus;
 $('kit-role').textContent='OPEN ROLE · '+move.role.name;
 $('kit-first').textContent=move.first;
 $('kit-safety').textContent=move.role.boundary+
  ' Exploration is voluntary; authority over other people, spaces or organizations is never inferred.';
 $('role-door').href='/roles/#role='+encodeURIComponent(move.role.id);
 try{$('table-door').href=makeTableSeedLink(location.href,makeTableQuestion(fire));}
 catch{$('table-door').href='/tables/';}
 const t=new URL('/tomorrow.html',location.href);
 t.hash=new URLSearchParams({from:'campfire',q:fire.focus}).toString();
 $('tomorrow-door').href=t.toString();
 $('invite-preview').textContent=makeInvitation(fire,circle.id);
 $('outcome').value=reported.get(chosenKey)||'NOT_STARTED';
 $('kit-status').textContent='';
 drawTasks();
 elements.kit.hidden=false;
}
$('light').addEventListener('click',()=>{
 const value=$('new-fire').value.trim();
 if(!validPurpose(value)){
  $('custom-status').textContent='Use one public, non-identifying question (8–220 characters). No contact details, addresses, credentials or private stories.';
  return;
 }
 try{
  selectFire(makeFire({custom:true,purpose:value}));
  $('custom-status').textContent='A new question is open. No one has been enrolled or contacted.';
  scrollToPanel('choose-circle');
 }catch{
  $('custom-status').textContent='That question could not be safely shared. Try simpler wording.';
 }
});
function shareText(ambassador=false){
 return makeInvitation(fire,circle.id,ambassador)+'\n\n'+makeFireLink(location.href,fire);
}
async function copy(text){
 if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(text);return;}
 const textarea=el('textarea');textarea.value=text;textarea.style.position='fixed';
 textarea.style.top='-1000px';document.body.append(textarea);
 try{textarea.focus();textarea.select();if(!document.execCommand('copy'))throw Error('COPY_FAILED');}
 finally{textarea.remove();}
}
async function explicitShare(ambassador=false){
 if(!circle||!move)return;
 const content=shareText(ambassador);
 try{
  if(typeof navigator.share==='function'){
   await navigator.share({title:fire.name+' · an open question',text:content});
   $('kit-status').textContent='Share sheet closed. Delivery and recipients are not tracked here.';
  }else{
   await copy(content);$('kit-status').textContent='Invitation copied. You choose whether to send it.';
  }
 }catch(error){$('kit-status').textContent=error?.name==='AbortError'
   ?'Canceled; no message was sent by the page.':'Sharing unavailable. Try Copy instead.';}
}
$('invite').addEventListener('click',()=>explicitShare(false));
$('ambassador').addEventListener('click',()=>explicitShare(true));
$('copy').addEventListener('click',async()=>{
 if(!circle)return;
 try{await copy(shareText());$('kit-status').textContent='Invitation copied. No one was contacted by this page.';}
 catch{$('kit-status').textContent='Copy unavailable. You can select the invitation in the preview.';}
});
$('link').addEventListener('click',async()=>{
 try{await copy(makeFireLink(location.href,fire));
 $('kit-status').textContent='A public-topic-only link is copied. It contains no name, standing, contact or outcome.';}
 catch{$('kit-status').textContent='Copy unavailable. Use the device’s normal link sharing controls.';}
});
$('outcome').addEventListener('change',()=>{
 if(!circle)return;
 if(OUTCOMES.some(([id])=>id===$('outcome').value))
  reported.set(chosenKey,$('outcome').value);
 $('kit-status').textContent='Outcome noted in this tab only; not verified or uploaded.';
});
$('move-back').addEventListener('click',()=>scrollToPanel('choose-circle'));
$('receipt').addEventListener('click',()=>{
 if(!circle)return;
 const receipt=makePersonalReceipt(fire,circle.id,
  [...(checked.get(chosenKey)||[])],$('outcome').value);
 const blob=new Blob([JSON.stringify(receipt,null,2)],{type:'application/json;charset=utf-8'});
 const u=URL.createObjectURL(blob);
 const a=el('a');a.href=u;a.download='campfire-'+fire.id+'-personal-return.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);
 $('kit-status').textContent='Self-reported receipt downloaded to your device; nothing uploaded.';
});
$('print').addEventListener('click',()=>{
 if(!circle)return;
 const section=$('print-card');section.replaceChildren();
 section.append(el('p','', 'THE CAMPFIRE · THE RIGHT TO TRY · VOLUNTARY DRAFT'),
  el('h1','',fire.name),el('h2','',fire.focus),el('h3','',circle.label),
  el('p','',move.first),el('h3','', 'Open invitation'),el('p','',makeInvitation(fire,circle.id)),
  el('h3','', 'A useful seven-day experiment'));
 const ol=el('ol');
 for(const step of move.actions)ol.append(el('li','',step.name+': '+step.detail));
 section.append(ol,el('p','',move.role.boundary),
  el('p','','What actually happened? __________________________________'),
  el('p','','______________________________________________________'),
  el('footer','', 'Independent Abundent invitation; no partner agreement or operating permission is implied.'));
 print();
});
// Fragment contains ONLY a vetted project seed or a short public-safe custom topic.
// It never contains a person’s chosen standing, contact details or outcome.
addEventListener('hashchange',()=>{
 const next=readFireLink(location.hash);
 if(next)selectFire(next,false);
});
renderFires();renderCircles();
