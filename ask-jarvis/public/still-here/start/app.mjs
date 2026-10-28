'use strict';
import {CIRCLES,OPEN_WORK,OUTCOMES,makeTryPlan,makeInterestHash,makeLocalReturn} from './model.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=text;
 if(cls)node.className=cls;
 return node;
};
let roleId='safeguards',standingId=null,plan=null;
let checked=new Set();
const status=message=>{$('status').textContent=message;};
function renderRoles(){
 $('roles').replaceChildren();
 for(const role of OPEN_WORK){
  const button=el('button',undefined,'work');
  button.type='button';
  button.setAttribute('aria-pressed',String(role.id===roleId));
  button.append(el('span',role.symbol,'symbol'),el('strong',role.name),el('small',role.need),el('span','OPEN PROPOSAL · NO APPOINTMENT','tag'));
  button.addEventListener('click',()=>{roleId=role.id;checked=new Set();renderRoles();renderPlan();});
  $('roles').append(button);
 }
}
function renderCircles(){
 $('circles').replaceChildren();
 for(const circle of CIRCLES){
  const button=el('button',undefined,'circle');
  button.type='button';
  button.setAttribute('aria-pressed',String(circle.id===standingId));
  button.append(el('span',circle.symbol,'symbol'),el('b',circle.label),el('small',circle.promise));
  button.addEventListener('click',()=>{
   standingId=circle.id;checked=new Set();
   renderCircles();renderPlan();
   $('plan').scrollIntoView({block:'start',behavior:'auto'});
  });
  $('circles').append(button);
 }
}
function renderPlan(){
 if(!standingId){$('plan').hidden=true;plan=null;return;}
 plan=makeTryPlan(roleId,standingId);
 $('plan').hidden=false;
 $('plan-heading').textContent=plan.role.name+' · one useful first move';
 $('plan-intro').textContent=plan.role.need+' Your starting place: '+plan.standing.label+'. No one has appointed you or enrolled anyone.';
 $('first-step').textContent=plan.first;
 $('safety-boundary').textContent=plan.boundary;
 $('step-list').replaceChildren();
 for(const step of plan.steps){
  const li=el('li'),label=el('label'),checkbox=document.createElement('input'),content=el('span');
  checkbox.type='checkbox';checkbox.checked=checked.has(step.id);
  content.append(el('b',step.name),el('small',step.detail));
  checkbox.addEventListener('change',()=>{
   if(checkbox.checked)checked.add(step.id);else checked.delete(step.id);
   status('Marked locally: '+checked.size+' / '+plan.steps.length+'. No one else’s consent or work is verified.');
  });
  label.append(checkbox,content);li.append(label);$('step-list').append(li);
 }
 $('invite-preview').textContent=plan.invitation;
 $('outcome').replaceChildren();
 for(const [value,label] of OUTCOMES){
  const option=el('option',label);option.value=value;$('outcome').append(option);
 }
 $('interest-link').href='/contact/'+makeInterestHash(roleId,standingId);
 status('Ready: one reversible seven-day attempt. Nothing has been shared, stored remotely, or assigned.');
}
async function copy(text){
 try{
  if(!navigator.clipboard?.writeText)throw Error('unavailable');
  await navigator.clipboard.writeText(text);
  status('Copied to your device. You decide whether to share.');
 }catch{status('Clipboard blocked. You can select the invitation text shown above manually.');}
}
$('copy-invite').addEventListener('click',()=>{if(plan)copy(plan.invitation);});
$('share-invite').addEventListener('click',async()=>{
 if(!plan)return;
 if(typeof navigator.share!=='function'){status('No system share sheet here; use Copy instead.');return;}
 try{
  await navigator.share({title:'Still Here · a small voluntary invitation',text:plan.invitation});
  status('Share sheet closed; delivery, participation, and consent are unknown.');
 }catch(err){status(err?.name==='AbortError'?'Share canceled.':'Sharing unavailable. Use Copy instead.');}
});
$('save-return').addEventListener('click',()=>{
 if(!plan)return;
 const receipt=makeLocalReturn(roleId,standingId,$('outcome').value,[...checked]);
 const objectUrl=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json;charset=utf-8'}));
 const a=el('a');a.href=objectUrl;a.download='still-here-campfire-private-return.json';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
 status('Self-reported return saved on your device only; check who can access your downloads.');
});
$('leave').addEventListener('click',()=>{
 standingId=null;plan=null;checked=new Set();
 $('plan').hidden=true;renderCircles();status('');
 $('open-work').scrollIntoView({block:'start',behavior:'auto'});
});
renderRoles();renderCircles();
