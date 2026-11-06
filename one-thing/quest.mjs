import {makeQuest,publicWords,progress,fieldReport,KINDS} from './quest-core.mjs';
import {makeInvite,encodeInvite} from '../invites/engine.mjs';

const $=id=>document.getElementById(id);
const STORAGE='abundent.one-thing:v1';
const EXAMPLES=Object.freeze({
 material:['Spare screwdriver set','Unused flower pots','Extra wood scraps'],
 food:['Extra garden squash','Unused vegetable seeds','A few safe canned goods'],
 skill:['Fifteen minutes of guitar help','Show someone a phone shortcut','Help repair a bike tire'],
 space:['One hour at a folding table','Unused workbench time','A shared community room (with permission)'],
 need:['A bicycle tool','Help writing a short flyer','One person to explain a process']
});
let kind='material',quest=null,done=[],outcome='',reportText='',saveOptIn=false;

const tell=(id,text)=>{$(id).textContent=text};
const element=(tag,text='',className='')=>{
 const node=document.createElement(tag);
 if(text)node.textContent=text;
 if(className)node.className=className;
 return node;
};
function selectKind(next){
 kind=next;
 document.querySelectorAll('[data-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.kind===kind)));
 $('examples').replaceChildren();
 for(const example of EXAMPLES[kind]){
  const button=element('button',example);
  button.type='button';
  button.addEventListener('click',()=>{$('thing').value=example;$('thing').focus()});
  $('examples').append(button);
 }
 const placeholders={
 material:'A spare working screwdriver set…',
 food:'Six extra squash from the garden…',
 skill:'I can help somebody make a simple flyer…',
 space:'An hour at my workbench, with permission…',
 need:'A way to fix a bike tire…'
 };
 $('thing').placeholder=placeholders[kind];
}
document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>selectKind(button.dataset.kind)));
selectKind(kind);

function safeSavedState(){
 try{
  const raw=localStorage.getItem(STORAGE);
  if(!raw)return null;
  const saved=JSON.parse(raw);
  if(saved.version!==1||!saved.input||!KINDS.includes(saved.input.kind))return null;
  const plan=makeQuest(saved.input);
  const p=progress(plan,saved.done);
  const selected=['worked','not-yet','different'].includes(saved.outcome)?saved.outcome:'';
  return {plan,done:[...saved.done],outcome:selected,p};
 }catch{return null}
}
function writeSaved(){
 if(!saveOptIn||!quest)return;
 try{
  localStorage.setItem(STORAGE,JSON.stringify({version:1,input:quest.input,done,outcome}));
  tell('keep-status','Kept on this browser only. Clear this browser’s data to erase it, or start a different quest.');
 }catch{
  tell('keep-status','Device storage unavailable. Keep this tab open or save your return as text.');
 }
}
function updateOutcomes(){
 document.querySelectorAll('[data-outcome]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.outcome===outcome)));
}
function clearReport(){
 reportText='';
 $('report').hidden=true;$('copy-report').hidden=true;$('save-report').hidden=true;
 tell('return-status','');
}
function updateProgress(){
 const status=progress(quest,done);
 tell('progress-status',status.completed+' / '+status.total+' steps you marked done · '+(status.stage==='PREPARED_ONLY'?'No work reported yet.':status.stage==='SELF_REPORTED_STEPS'?'All steps self-reported — independent outcome still unknown.':'Some steps self-reported. No external confirmation.'));
 tell('quest-stage',status.stage==='PREPARED_ONLY'?'PREPARED':status.stage==='SELF_REPORTED_STEPS'?'SELF-REPORTED 3/3':'SELF-REPORTED '+status.completed+'/3');
}
function renderSteps(){
 const list=$('steps');
 list.replaceChildren();
 for(const step of quest.steps){
  const row=element('article','','step');
  const isDone=done.includes(step.id);
  row.dataset.done=String(isDone);
  const button=element('button',isDone?'✓':'○');
  button.type='button';button.setAttribute('aria-pressed',String(isDone));
  button.setAttribute('aria-label',(isDone?'Unmark':'Mark')+' '+step.label+' as self-reported complete');
  const body=element('div');
  const title=element('h4',step.label);
  const description=element('p',step.text);
  const foot=element('small',isDone?'You reported completing this step.':'Tap the circle only after trying this step.');
  body.append(title,description,foot);
  button.addEventListener('click',()=>{
   done=isDone?done.filter(id=>id!==step.id):quest.steps.filter(s=>done.includes(s.id)||s.id===step.id).map(s=>s.id);
   renderSteps();updateProgress();clearReport();writeSaved();
  });
  row.append(button,body);
  list.append(row);
 }
}
function makeLinks(){
 try{
  const publicText=publicWords(quest);
  $('public-preview').textContent=publicText;
  const invitation=makeInvite({words:publicText,when:quest.input.when,originId:crypto.randomUUID()});
  const encoded=encodeInvite(invitation);
  $('make-invitation').href=new URL('../invites/#i='+encoded,location.href).href;
  $('review-public').href=new URL('../invites/network/#i='+encoded,location.href).href;
  tell('invite-status','Local link prepared. No message sent. Opening a conversation requires separate review and consent.');
 }catch(error){
  $('public-preview').textContent='This description needs to be shorter or less identifying before it can become a public invitation.';
  $('make-invitation').href='../invites/';
  $('review-public').href='../invites/network/';
  tell('invite-status','Public-link preparation held: '+error.message+' You can use the existing invitation form and write a fresh public-safe version.');
 }
}
function showQuest(plan){
 quest=plan;
 $('quest-headline').textContent=plan.headline;
 $('quest-thing').textContent=plan.input.thing;
 $('quest-question').textContent=plan.question;
 $('quest').hidden=false;
 renderSteps();updateProgress();updateOutcomes();clearReport();makeLinks();
 $('quest').scrollIntoView({block:'start',behavior:'smooth'});
}
function begin(){
 try{
  const when=document.querySelector('input[name="when"]:checked')?.value;
  const plan=makeQuest({kind,thing:$('thing').value,when});
  done=[];outcome='';
  showQuest(plan);
  tell('entry-status','A working three-step quest was prepared here. Nothing transmitted.');
  writeSaved();
  document.dispatchEvent(new Event('one-thing:quest-prepared'));
 }catch(error){tell('entry-status',error.message);$('thing').focus()}
}
$('make').addEventListener('click',begin);
$('keep').addEventListener('click',()=>{saveOptIn=true;writeSaved()});
$('print').addEventListener('click',()=>window.print());
$('reset').addEventListener('click',()=>{
 quest=null;done=[];outcome='';saveOptIn=false;clearReport();
 try{localStorage.removeItem(STORAGE)}catch{}
 $('quest').hidden=true;
 $('thing').value='';
 tell('entry-status','Start with another thing. Any saved quest on this device was erased.');
 $('start').scrollIntoView({block:'start',behavior:'smooth'});
 $('thing').focus();
});
document.querySelectorAll('[data-outcome]').forEach(button=>button.addEventListener('click',()=>{
 outcome=button.dataset.outcome;updateOutcomes();clearReport();writeSaved();
}));
$('make-report').addEventListener('click',()=>{
 if(!quest)return;
 if(!outcome){tell('return-status','Choose what happened first. An unfinished quest is a valid return.');return}
 try{
  reportText=fieldReport(quest,done,outcome,$('outcome-note').value);
  $('report').textContent=reportText;$('report').hidden=false;
  $('copy-report').hidden=false;$('save-report').hidden=false;
  tell('return-status','Prepared on this device only. No independent confirmation or automatic publication.');
  writeSaved();
  document.dispatchEvent(new Event('one-thing:return-prepared'));
 }catch(error){tell('return-status',error.message)}
});
$('copy-report').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(reportText);tell('return-status','Copied your own unverified report.')}
 catch{tell('return-status','Clipboard unavailable. Select the text above and copy manually.')}
});
$('save-report').addEventListener('click',()=>{
 if(!reportText)return;
 const url=URL.createObjectURL(new Blob([reportText+'\n'],{type:'text/plain;charset=utf-8'}));
 const a=element('a');a.href=url;a.download='abundent-one-thing-return.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
});
const restored=safeSavedState();
if(restored){
 saveOptIn=true;
 const {plan}=restored;done=restored.done;outcome=restored.outcome;
 selectKind(plan.input.kind);$('thing').value=plan.input.thing;
 const radio=document.querySelector('input[name="when"][value="'+plan.input.when+'"]');if(radio)radio.checked=true;
 showQuest(plan);
 tell('keep-status','Restored a quest you previously chose to keep on this device.');
}
