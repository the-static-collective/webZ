import {WORLDS,manifests,validateManifest,empty,project,append,proposal,choose,freeze,thaw,safeEntry} from './model.mjs';
import {observe} from './proof.mjs';
const base=new URL('../',import.meta.url),$=id=>document.getElementById(id),page=document.body.dataset.page;
const KEY='webz.observations.v0';let record=empty(),durable=false,unavailable=null,raw=null,reviewed=null,exported=null,traceVersion=0;
const status=(id,s)=>{if($(id))$(id).textContent=s;};
try{raw=localStorage.getItem(KEY);if(raw!==null){record=JSON.parse(raw);project(record);durable=true;}}catch{unavailable='Durable trace UNAVAILABLE. No history repaired. Erase explicitly to start a new trace.';record=empty();}
function save(next){
 if(unavailable)throw Error('TRACE_UNAVAILABLE_ERASE_FIRST');project(next);record=next;
 if(durable)try{localStorage.setItem(KEY,JSON.stringify(record));}catch{durable=false;unavailable='Storage UNAVAILABLE. Navigation continues; current trace is volatile and exportable.';}
 renderTrace();
}
function renderTrace(){
 traceVersion++;
 const p=project(record);$('record-consent').checked=durable;$('record-consent').disabled=!!unavailable;
 status('trace-status',unavailable??`${p.arrivals} arrivals · ${p.events} observations · ${durable?'saved locally with consent':'volatile; no durable trace'} · no carried particular`);
 $('raw-export').hidden=!(unavailable&&raw);$('export-preview').hidden=true;$('download-trace').hidden=true;exported=null;
 if($('decision-history'))status('decision-history',p.decisions.length?p.decisions.map(d=>`${manifests[WORLDS.indexOf(d.world)].title} · ${d.decision} · ${d.proposal.slice(0,24)}… · unsigned local rehearsal`).join('\n'):'No local human decisions.');
}
function localObservation(action){if(!unavailable)save(append(record,action));}
function download(name,text){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('record-consent').onchange=()=>{
 durable=$('record-consent').checked;
 try{if(durable)localStorage.setItem(KEY,JSON.stringify(record));else localStorage.removeItem(KEY);}catch{durable=false;unavailable='Storage UNAVAILABLE; this trace is volatile.';}renderTrace();
};
$('erase-trace').onclick=()=>{
 try{localStorage.removeItem(KEY);unavailable=null;}catch{unavailable='Storage UNAVAILABLE; volatile trace cleared.';}
 importGeneration++;record=empty();durable=false;raw=null;reviewed=null;$('export-preview').textContent='';$('import-preview').textContent='';$('import-preview').hidden=true;$('restore-trace').hidden=true;renderTrace();
};
$('raw-export').onclick=()=>download('webz-unavailable-raw.txt',raw);
$('export-trace').onclick=async()=>{
 const version=traceVersion;
 try{const frozen=await freeze(record);if(version!==traceVersion)return;exported=frozen;$('export-preview').textContent=JSON.stringify(exported,null,2);$('export-preview').hidden=false;$('download-trace').hidden=false;}catch{if(version===traceVersion)status('trace-status','Export UNAVAILABLE; raw record remains inspectable.');}
};
$('download-trace').onclick=()=>{if(exported)download('webz-local-trace.json',JSON.stringify(exported,null,2));};
let importGeneration=0;
$('trace-file').onchange=async e=>{
 const generation=++importGeneration;reviewed=null;$('restore-trace').hidden=true;
 try{const f=e.target.files[0];if(!f||f.size>524288)throw Error('FILE_LIMIT_512_KIB');const parsed=JSON.parse(await f.text());const restored=await thaw(parsed);if(generation!==importGeneration)return;
  reviewed=restored;status('import-preview',JSON.stringify(project(restored),null,2));$('import-preview').hidden=false;$('restore-trace').hidden=false;
 }catch(error){if(generation!==importGeneration)return;status('import-preview','REJECTED — '+error.message);$('import-preview').hidden=false;}
};
$('restore-trace').onclick=()=>{
 if(!reviewed)return;
 if(unavailable){status('trace-status','Erase the unavailable record before restoring a reviewed trace.');return;}
 save(structuredClone(reviewed));reviewed=null;$('restore-trace').hidden=true;
 // Restoring observations neither navigates nor supplies execution authority.
};
renderTrace();
if(page==='world'){
 const index=Number(document.body.dataset.world),m=validateManifest(manifests[index],base.href),d=m.doors[0];
 status('world-address',m.world_id+' · '+m.entry+' · owner declaration, not authenticated identity');
 const pending=project(record).pending_departure;
 if(pending&&pending.to_world_id===m.world_id)localObservation({kind:'ARRIVE',from:pending.from_world_id,to:m.world_id});
 function inspect(){
  localObservation({kind:'INSPECT',from:m.world_id,to:d.to_world_id});
  const panel=$('door-contract');panel.replaceChildren();const heading=document.createElement('strong');heading.textContent=`${m.title} → ${manifests[1-index].title}`;panel.append(heading);
  const lines=[`Source: ${m.world_id}`,`Destination: ${d.to_world_id}`,`Manifest source: first-party app/model.mjs · ${m.revision}`,`Door: ${d.door_id} · destination: ${safeEntry(d.to_entry,base.href)}`,'Carry: NONE · no proposal text, private note or credential','Unknowns: remote ownership and live-network state are not authenticated. This is a same-origin local portal.'];
  for(const line of lines){const div=document.createElement('div');div.textContent=line;panel.append(div);}panel.hidden=false;$('cross').hidden=false;
 }
 let dispatching=false,navigationGeneration=0;
 $('inspect').onclick=inspect;$('remain').onclick=()=>{const cancelling=dispatching;navigationGeneration++;dispatching=false;localObservation({kind:'REMAIN',from:m.world_id,to:d.to_world_id});$('door-contract').hidden=true;$('cross').hidden=true;status('door-status',cancelling?'REMAIN — pending crossing cancelled. No arrival.':'REMAIN — no crossing occurred.');};
 async function cross(kind){
  if(dispatching)return;dispatching=true;const generation=++navigationGeneration;
  try{
   const current=project(record).pending_departure;
   if(current){status('door-status','webZ HOLD — unresolved departure remains. Erase or inspect the trace before another crossing.');dispatching=false;return;}
   localObservation({kind,from:m.world_id,to:d.to_world_id});
   const href=safeEntry(d.to_entry,base.href);const response=await fetch(href,{cache:'no-cache',credentials:'omit'});
   if(generation!==navigationGeneration)return;
   if(!response.ok)throw Error('UNREACHABLE_TARGET');location.assign(href);
  }catch(error){
   if(generation!==navigationGeneration)return;
   if(project(record).pending_departure)localObservation({kind:'UNRESOLVED',from:m.world_id,to:d.to_world_id});
   status('door-status','webZ UNRESOLVED / HOLD — destination unavailable; remain here or use the return address.');dispatching=false;
  }
 }
 $('cross').onclick=()=>cross('DEPART');if($('return'))$('return').onclick=()=>cross('RETURN');
}
if(page==='porch'){
 let prepared=null,generation=0;
 const invalidate=()=>{generation++;prepared=null;document.querySelectorAll('[data-decision]').forEach(b=>b.disabled=true);status('byte-count',`${new TextEncoder().encode($('public-text').value).length} / 2048 bytes`);};
 $('public-text').oninput=invalidate;$('proposal-consent').onchange=invalidate;
 $('clear-draft').onclick=()=>{$('public-text').value='';$('proposal-consent').checked=false;invalidate();status('proposal-status','Draft cleared. No delivery occurred; recorded local observations remain separately erasable.');};
 $('prepare').onclick=async()=>{
  const g=++generation;
  try{const p=await proposal($('public-text').value,$('proposal-consent').checked);if(g!==generation)return;prepared=p;
   status('proposal-status',`PREPARED LOCALLY · ${p.byte_length} bytes · ${p.id} · no delivery or license granted`);document.querySelectorAll('[data-decision]').forEach(b=>b.disabled=false);
  }catch(error){if(g!==generation)return;prepared=null;document.querySelectorAll('[data-decision]').forEach(b=>b.disabled=true);status('proposal-status','Public text and consent required; maximum 2048 bytes; no secrets.');}
 };
 document.querySelectorAll('[data-decision]').forEach(button=>button.onclick=()=>{
  if(!prepared)return;
  try{save(choose(record,WORLDS[Number($('choice-world').value)],prepared,button.dataset.decision));status('proposal-status',`${button.dataset.decision} recorded independently for ${manifests[Number($('choice-world').value)].title}. No execution or delivery.`);}
  catch(error){status('proposal-status',`Local choice unavailable: ${error.message}. Other worlds' choices remain independent.`);}
 });
}
if(page==='proof'){
 let generation=0;
 function clear(){generation++;status('proof-status','UNAVAILABLE — no report inspected.');status('proof-result','No observation.');$('custody').replaceChildren();$('proof-file').value='';}
 $('clear-proof').onclick=clear;
 async function inspectReport(get){
  const g=++generation;status('proof-status','Checking public signatures and separate custody…');$('custody').replaceChildren();status('proof-result','Verification pending.');
  try{const result=await observe(await get());if(g!==generation)return;
   status('proof-status',`${result.verified_crossings} verified crossings · ${result.verified_receipts} verified receipt signatures · ${result.paired_nonself_histories} paired nonself histories · signature consistency only`);
   status('proof-result',JSON.stringify(result,null,2));
   for(const b of result.branches){const div=document.createElement('div');div.className='custody-row';const strong=document.createElement('strong');strong.textContent=`${b.source} → ${b.destination}`;div.append(strong);
    for(const text of [`Source custody: ${b.source_custody?'PRESENT':'UNOBSERVED'} · Destination custody: ${b.destination_custody?'PRESENT':'UNOBSERVED'} · ${b.complete?'signed local disposition observed':'unresolved HOLD'}`,`Particular: ${b.particular}`,`Crossing: ${b.crossing_id}`]){const line=document.createElement('div');line.textContent=text;div.append(line);}const note=document.createElement('span');note.className='fine';note.textContent='Custody labels are supplied metadata checked for binding; independent HTTPS acquisition UNOBSERVED.';div.append(note);$('custody').append(div);
   }
  }catch(error){if(g!==generation)return;status('proof-status','REJECTED / UNVERIFIED — '+error.message);status('proof-result','No accepted observation. Rack remains locked.');}
 }
 $('sample').onclick=()=>inspectReport(async()=>{const r=await fetch(new URL('evidence/public-simulation.json',base),{credentials:'omit'});if(!r.ok)throw Error('FIXTURE_UNAVAILABLE');return r.text();});
 $('proof-file').onchange=e=>{const file=e.target.files[0];if(file)inspectReport(async()=>{if(file.size>524288)throw Error('FILE_LIMIT_512_KIB');return file.text();});};
}
import './shell.mjs';
