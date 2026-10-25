import {capacities,optionsFromGraph,makeIgnition} from './engine.mjs';
const $=id=>document.getElementById(id);
const status=$('graph-state'),submit=$('make');
let graph=null,last=null;
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o;}
function save(name,value,mime){
 const url=URL.createObjectURL(new Blob([value],{type:mime}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function draw(r){
 const out=$('output');out.hidden=false;
 if(r.status!=='DRAFT_READY_NOT_EXECUTED'){
  $('status').textContent='HOLD · NO RELEVANT PUBLIC SEED';
  $('title').textContent='Do not force this question into a project.';
  $('summary').textContent=r.reason;
  for(const id of ['first','second','third','gate','evidence','sheet'])$(id).textContent='';
  document.querySelectorAll('.actions button').forEach(b=>b.disabled=true);
  last=null;out.scrollIntoView({block:'start',behavior:'smooth'});return;
 }
 document.querySelectorAll('.actions button').forEach(b=>b.disabled=false);
 $('status').textContent='DRAFT READY · NOTHING EXECUTED';
 $('title').textContent=r.work.deliverable;
 $('summary').textContent='Possible workstream: '+r.option.title+' · '+r.capacity.label+' · unverified editorial seed.';
 $('first').textContent=r.work.first15Minutes;
 $('second').textContent=r.work.next90Minutes;
 $('third').textContent=r.work.before24Hours;
 $('gate').textContent=r.permissionGate;
 $('evidence').textContent=r.proofToSeek;
 $('sheet').textContent=r.fieldSheet;
 last=r;out.scrollIntoView({block:'start',behavior:'smooth'});
}
for(const c of capacities)$('capacity').append(option(c.id,c.label));
$('capacity').value='print';
async function load(){
 submit.disabled=true;
 try{
  const res=await fetch('/town/graph.json',{cache:'no-store',credentials:'omit'});
  if(!res.ok)throw Error('FREE_GRAPH_UNAVAILABLE');
  const data=await res.json();
  const options=optionsFromGraph(data);
  for(const o of options)$('seed').append(option(o.id,o.category+' · '+o.title));
  graph=data;
  status.textContent='Free Graph editorial packet read: '+options.length+' options. No local offers, stewards or field outcomes inferred.';
  const hash=new URLSearchParams(location.hash.slice(1)).get('q');
  if(hash){
   const temp=document.createElement('textarea');temp.value=hash;
   if(hash.length<=360&&hash.length>=8&&!/[\r\n]/.test(hash))$('question').value=temp.value;
  }
  submit.disabled=false;
 }catch{
  graph=null;status.textContent='HOLD · The public Free Graph packet is unavailable. Do not fabricate a plan. Return to the Town Desk.';
 }
}
$('ignite-form').addEventListener('submit',e=>{
 e.preventDefault();
 if(!graph)return;
 try{draw(makeIgnition({question:$('question').value,optionId:$('seed').value,
  capacity:$('capacity').value,graph}));}
 catch(error){
  $('output').hidden=false;$('status').textContent='HOLD · INVALID INPUT';
  $('title').textContent='Check this question';
  $('summary').textContent=error.message==='PRIVATE_CONTENT_REFUSED'
   ?'Remove contact details, addresses, URLs and secrets. This is a public-safe field kit.'
   :'The question or option was invalid. No plan was created.';
  document.querySelectorAll('.actions button').forEach(b=>b.disabled=true);
  last=null;
 }
});
$('print').addEventListener('click',()=>{if(last)window.print();});
$('save').addEventListener('click',()=>{if(last)save('jarvis-24-hour-field-kit.txt',last.fieldSheet+'\n','text/plain;charset=utf-8');});
$('save-json').addEventListener('click',()=>{if(last)save('jarvis-ignition-unsigned.json',JSON.stringify(last,null,2)+'\n','application/json');});
void load();
