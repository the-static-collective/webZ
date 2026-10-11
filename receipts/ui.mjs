import {inspectReceipt,lensNames} from './inspect.mjs';
const $=id=>document.getElementById(id);
const title=s=>s.replace(/(^|[-_ ])([a-z])/g,(_,a,b)=>a+b.toUpperCase()).replace(/_/g,' ');
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
let generation=0,report=null;
function clearView(message='No evidence loaded.'){
 generation++;report=null;$('input-file').value='';
 $('status').textContent=message;$('mode').textContent='NOT INSPECTED';
 $('basis').textContent='No cryptographic checks have run.';
 $('inspection').hidden=true;$('timeline').replaceChildren();$('fields').replaceChildren();
 $('lenses').replaceChildren();$('lens-detail').replaceChildren();
}
function chooseLens(name){
 for(const button of $('lenses').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.name===name));
 const detail=$('lens-detail');detail.replaceChildren(node('strong',title(name)),node('p',report.lenses[name]));
}
function show(r){
 report=r;$('inspection').hidden=false;
 const mode=r.mode;
 $('mode').textContent=mode==='LOCAL_JOURNAL_VERIFIED'?'VERIFIED · SIGNED JOURNAL':
  mode==='SIGNATURE_ONLY'?'VERIFIED · SIGNATURE ONLY':'UNVERIFIED · ARCHIVE CLAIMS';
 $('basis').textContent=mode==='LOCAL_JOURNAL_VERIFIED'?'Signatures, pinned material and receiver-local hash chain recomputed in this browser. Identity, delivery and public admission are not established.':
  mode==='SIGNATURE_ONLY'?'Canonical ID and P-256 signature recomputed. Referenced bytes, owner identity, receiver policy and historical state were not independently checked.':
  'Unsigned CI summary displayed as an archival claim. This browser has not received the original signed receipt bodies or rerun the job.';
 $('status').textContent='Inspected: '+r.type+'. This browser made no receiver decision.';
 for(const step of r.steps){
  const li=node('li');li.append(node('strong',step.stage),node('span',step.id,'glass-id'),node('p',step.detail));$('timeline').append(li);
 }
 for(const [key,value] of Object.entries(r.fields)){
  const row=node('div','', 'glass-field');row.append(node('dt',title(key)),node('dd',typeof value==='string'?value:JSON.stringify(value)));$('fields').append(row);
 }
 for(const name of lensNames){
  const btn=node('button',title(name));btn.type='button';btn.dataset.name=name;
  btn.setAttribute('aria-pressed','false');btn.addEventListener('click',()=>chooseLens(name));$('lenses').append(btn);
 }
 chooseLens('identity');
}
async function inspect(raw,g){
 try{
  const result=await inspectReceipt(raw);if(g!==generation)return;show(result);
 }catch(err){
  if(g!==generation)return;
  clearView('REFUSED · '+(err instanceof Error?err.message:'INVALID_IMPORT'));
 }
}
$('clear').addEventListener('click',()=>clearView());
$('input-file').addEventListener('change',async event=>{
 const file=event.target.files[0];clearView('Checking selected bytes…');
 if(!file)return;
 const g=generation;
 if(file.size>131072){clearView('REFUSED · IMPORT_LIMIT_128KB');return;}
 try{const raw=await file.text();if(g===generation)await inspect(raw,g);}
 catch{if(g===generation)clearView('REFUSED · FILE_READ_FAILED');}
});
$('example').addEventListener('click',async()=>{
 clearView('Opening archived local example…');const g=generation;
 try{
  const res=await fetch('./fixtures/cannon-009.json',{cache:'no-store'});
  if(!res.ok)throw Error('EXAMPLE_UNAVAILABLE');
  const raw=await res.text();if(g===generation)await inspect(raw,g);
 }catch{if(g===generation)clearView('REFUSED · EXAMPLE_UNAVAILABLE');}
});
