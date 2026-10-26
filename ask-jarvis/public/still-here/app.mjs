'use strict';
const $=id=>document.getElementById(id);
const doorIds=['tonight','remember','person','parent','blackstar'];
export const timeline=[];
const stamp=()=>new Date().toLocaleString();
const limit=(s,n=15000)=>String(s??'').slice(0,n).trim();
function status(s){$('status').textContent=s;}
function showDoor(id){
 doorIds.forEach(name=>{$(name).hidden=name!==id;});$('welcome').hidden=true;
 document.querySelectorAll('[data-door]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.door===id)));
 $(id).scrollIntoView({behavior:'auto',block:'start'});status('');
}
document.querySelectorAll('[data-door]').forEach(b=>b.addEventListener('click',()=>showDoor(b.dataset.door)));
async function copy(text){
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(text);status('Copied. Nothing was submitted.');}
 catch{status('Automatic copy was blocked. Select the text from the visible output, or download your one-page note.');}
}
$('copy-hour').addEventListener('click',()=>copy('MY NEXT-HOUR PLAN · '+stamp()+'\n'+limit($('next-hour').value,500)+'\n\nA draft for me to use, not sent to anyone.'));
function eventObject(){return {when:$('event-time').value||'Date/time not entered',learnedAt:$('event-discovered').value||'',basis:$('basis').value,account:limit($('event-desc').value,4000),original:limit($('event-proof').value,800)||'Not identified',unknown:limit($('event-unknown').value,800)||'Not recorded'};}
function formatEvent(e,i){return `EVENT ${i+1} · ${e.when}\nBasis: ${e.basis}\nFirst source encounter: ${e.learnedAt||'Not recorded'}\nAccount: ${e.account}\nOriginal/source: ${e.original}\nUnconfirmed: ${e.unknown}`;}
function renderEvents(){
 const root=$('events');root.replaceChildren();$('event-count').textContent=`(${timeline.length})`;
 if(!timeline.length){const p=document.createElement('p');p.className='tiny';p.textContent='No events added yet.';root.append(p);return;}
 timeline.forEach((e,i)=>{const article=document.createElement('article');article.className='entry';article.textContent=formatEvent(e,i);root.append(article);});
}
$('add-event').addEventListener('click',()=>{
 const e=eventObject();if(!e.account){status('Enter a plain-language account before adding an event.');$('event-desc').focus();return;}
 timeline.push(e);renderEvents();$('event-desc').value='';$('event-proof').value='';$('event-unknown').value='';status('Added locally. Nothing was saved to a server.');
});
$('clear-events').addEventListener('click',()=>{if(!timeline.length)return;if(!confirm('Clear the local timeline on this page? This cannot be undone.'))return;timeline.length=0;renderEvents();status('Local timeline cleared.');});
function context(){
 const events=timeline.length?timeline.map(formatEvent).join('\n\n'):'No events added.';
 return `STILL HERE · CARRY-FORWARD CONTEXT (SELF-REPORTED)\nPrepared: ${stamp()}\n\nPURPOSE\nA concise account to reduce repeated explanations. It is not independent verification, a sworn declaration, or a substitute for original records.\n\nWHAT MATTERS NOW\n${limit($('carry-goal').value,1000)||'[Not entered]'}\n\nWORKING CHRONOLOGY\n${events}\n\nNEXT SMALL, LAWFUL STEP\n${limit($('carry-step').value,1000)||'[Not entered]'}\n\nREMEMBER\nSeparate firsthand observations, reports, and inferences. Preserve original evidence. Do not publish this without checking privacy, safety, and accuracy.\n`;
}
$('copy-note').addEventListener('click',()=>copy(context()));
$('download-note').addEventListener('click',()=>{
 const blob=new Blob([context()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='still-here-private-context.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);status('Downloaded to this device. Check where the file is stored and who can access it.');
});
$('print-note-btn').addEventListener('click',()=>{$('print-note').textContent=context();window.print();});
function invitation(){
 const kind=$('person-request').value;const detail=limit($('person-detail').value,500);
 return `Hey. I'm going through a difficult family situation, and I don't have the energy to explain the entire history again. I'm not asking you to decide who's right.\n\nWould you be willing to ${kind}?${detail?'\n\n'+detail:''}\n\nIt's okay if you can't. Even a small, specific bit of help would mean something. No pressure to take sides.`;
}
$('make-invite').addEventListener('click',()=>{$('invite-output').textContent=invitation();status('Draft made locally. Choose whether to share it.');});
$('copy-invite').addEventListener('click',()=>{const t=invitation();$('invite-output').textContent=t;copy(t);});
$('copy-parent').addEventListener('click',()=>copy(`MY QUESTION FOR A QUALIFIED HELPER · ${stamp()}\n${limit($('parent-question').value,700)||'[Question not entered]'}\n\nI want accurate information about low-cost, lawful steps that protect my relationship with my child. Please help me distinguish verified facts from reports and inferences, identify any time-sensitive options, and understand what documents would be useful.`));
renderEvents();