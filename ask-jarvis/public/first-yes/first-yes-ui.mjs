import {composePublicFirstYes,printablePublicFirstYes,classifyArea} from './first-yes.mjs';
import {THREADS} from '../board/memory.mjs';
import {makeCrossing} from '../crossings/model.mjs';
import {putSessionCrossing} from '../crossings/session.mjs';

const $=id=>document.getElementById(id);
const node=(tag,text='',cls='')=>{
 const n=document.createElement(tag);n.textContent=text;
 if(cls)n.className=cls;return n;
};
const HISTORY='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/workboard-history';
const state={history:null,historyState:'NOT_REQUESTED',thread:null,complete:false,kit:null,paper:null};
const say=(target,text)=>{$(target).textContent=text;};
function area(){
 const chosen=$('topic').value;
 return chosen==='auto'?classifyArea($('question').value):chosen;
}
function clearPrepared(why='Question changed; prepare again before copying or saving.'){
 state.kit=null;state.paper=null;
 $('result').hidden=true;
 for(const id of ['copy','save','print','save-crossing','open-crossing'])$(id).disabled=true;
 say('status',why);
}
function clearSource(){
 state.history=null;state.historyState='NOT_REQUESTED';state.thread=null;state.complete=false;
 say('historyStatus','Not requested for the current area. No public comments are assumed.');
 clearPrepared('Ready. This draft will be editorial unless you deliberately load reviewed public updates.');
}
$('question').addEventListener('input',()=>{
 if(state.thread && area()!==state.thread)clearSource();
 else clearPrepared();
});
$('topic').addEventListener('change',clearSource);
$('capacity').addEventListener('change',()=>clearPrepared());
function add(box,title,text){
 const article=node('article');
 article.append(node('strong',title),node('p',text));
 box.append(article);
}
function show(kit){
 clearPrepared('');
 state.kit=kit;
 const panel=$('result');panel.hidden=false;
 if(kit.standing!=='PUBLIC_DRAFT_PREPARED_UNSENT'){
  say('resultTitle',kit.heading);
  say('resultIntro',kit.explanation);
  $('resultGrid').replaceChildren();
  say('invitation','No invitation was prepared. Nothing was sent or saved.');
  $('threadLink').href=kit.referral||'/';
  $('threadLink').textContent=kit.standing==='PRIVATE_PATH_HOLD'?
   'Open private, local-only support tools ↗':'Return to Ask JAR;VIS ↗';
  say('status',kit.standing==='PRIVATE_PATH_HOLD'?
   'PRIVATE PATH: no personal question copied into a public card.':
   'HOLD: Please choose a public area explicitly, or use general Ask JAR;VIS.');
  return;
 }
 const f=kit.firstYes,p=kit.publicSource;
 state.paper=printablePublicFirstYes(kit);
 $('resultTitle').textContent=f.headline;
 say('resultIntro',kit.topicLabel+' · '+kit.capacity+' · '+
  (p.reviewedEntryId?'Reviewed public comment referenced; claims not independently verified.':
  'Editorial starting point; no reviewed community contribution was used.')+
  ' No private backend consulted.');
 const cards=$('resultGrid');cards.replaceChildren();
 add(cards,'01 · What we actually know',kit.observations.join(' ')+
  (p.reviewedEntryId?' Public reviewed source reference: '+p.reviewedEntryId:''));
 add(cards,'02 · First 15 minutes',f.first15Minutes);
 add(cards,'03 · Next 90 minutes',f.next90Minutes);
 add(cards,'04 · Within 24 hours',f.next24Hours);
 add(cards,'05 · Permission first',f.permissionGate);
 add(cards,'06 · What would count?',f.whatWouldCount+
  ' Return questions: '+f.returnQuestions.join(' / '));
 say('invitation',f.voluntaryInvitation);
 $('threadLink').href=kit.destinations.reviewedWorkboardThread;
 $('threadLink').textContent='Open '+kit.topicLabel+' discussion ↗';
 for(const id of ['copy','save','print','save-crossing'])$(id).disabled=false;
 say('status','PUBLIC-SAFE DRAFT READY. No contact, enrollment, private Firebox read, backend write, or verified delivery.');
}
$('firstYesForm').addEventListener('submit',e=>{
 e.preventDefault();
 try{
  const a=area();
  // Use loaded reviewed posts ONLY for the exact same topic.
  const relevant=state.historyState==='PUBLIC_REVIEWED_LOADED'&&state.thread===a;
  const unavailable=state.historyState==='PUBLIC_HISTORY_UNAVAILABLE'&&state.thread===a;
  const kit=composePublicFirstYes({
   question:$('question').value,thread:$('topic').value,
   capacity:$('capacity').value,
   history:relevant?state.history:null,
   historyState:relevant?'PUBLIC_REVIEWED_LOADED':unavailable?'PUBLIC_HISTORY_UNAVAILABLE':'NOT_REQUESTED',
   allPagesRead:relevant&&state.complete
  });
  show(kit);
 }catch(err){
  clearPrepared('No card prepared: '+String(err.message||'Please review your public-safe question.')+
   '. Nothing was transmitted.');
 }
});
$('readHistory').addEventListener('click',async()=>{
 const a=area();
 if(!a||!Object.hasOwn(THREADS,a)){
  say('historyStatus','First choose one of the six public areas, or write a question with one unambiguous area.');
  return;
 }
 const btn=$('readHistory');btn.disabled=true;
 say('historyStatus','Reading public, human-reviewed '+THREADS[a].name+' history. Your question is NOT included in this request.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
 try{
  const url=HISTORY+'?thread='+encodeURIComponent(a);
  const res=await fetch(url,{method:'GET',cache:'no-store',signal:controller.signal,
   referrerPolicy:'no-referrer'});
  const raw=await res.text();
  if(raw.length>110_000)throw Error('PUBLIC_FEED_TOO_LARGE');
  const data=JSON.parse(raw);
  if(!res.ok||data.schema!=='abundent/workboard-history-v1'||data.reviewedOnly!==true||
     !Array.isArray(data.entries)||data.entries.length>200)
   throw Error('PUBLIC_FEED_UNAVAILABLE');
  // Treat the service's edited/reviewed list as PUBLIC ONLY. The memory model
  // validates statuses and provenance again before selecting an anchor.
  state.history=data.entries;state.historyState='PUBLIC_REVIEWED_LOADED';
  state.thread=a;state.complete=!data.nextBefore;
  clearPrepared('Public source read; press Prepare to generate a refreshed, still unsent card.');
  say('historyStatus',data.entries.length?
   data.entries.length+' public reviewed or withdrawn entries fetched · '+
   (state.complete?'no next page in this response.':'only the newest page was read.')+
   ' Publication review is not factual verification.':
   'No reviewed public entries in this response. A work card will be clearly labeled EDITORIAL, not a community decision.');
 }catch{
  state.history=null;state.thread=a;state.complete=false;
  state.historyState='PUBLIC_HISTORY_UNAVAILABLE';
  clearPrepared('The public feed was unavailable. You may still prepare a clearly editorial-only card.');
  say('historyStatus','The reviewed public feed could not be confirmed. No community-post evidence is available; editorial-only planning remains possible. Your question was never sent.');
 }finally{
  clearTimeout(timer);btn.disabled=false;
 }
});
$('copy').disabled=$('save').disabled=$('print').disabled=$('save-crossing').disabled=$('open-crossing').disabled=true;
$('copy').addEventListener('click',async()=>{
 if(!state.paper)return;
 try{await navigator.clipboard.writeText(state.paper);
  say('status','Copied locally. You decide whether anyone sees this. Nothing was sent.');
 }catch{
  const area=document.createElement('textarea');area.value=state.paper;
  area.readOnly=true;area.setAttribute('aria-label','Select and copy your work card');
  area.style.width='100%';area.style.minHeight='175px';
  $('result').append(area);area.focus();area.select();
  say('status','Clipboard permission unavailable. Work card selected below; copy it manually.');
 }
});
$('save').addEventListener('click',()=>{
 if(!state.paper||!state.kit)return;
 const file=new Blob([state.paper],{type:'text/markdown;charset=utf-8'});
 const url=URL.createObjectURL(file),a=node('a');a.href=url;
 a.download='abundent-first-yes-'+state.kit.topic+'-unsent.md';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
 say('status','Saved to this device. The public Workboard, JAR;VIS and private Firebox were not changed.');
});
$('print').addEventListener('click',()=>{
 if(!state.paper)return;
 say('printPaper',state.paper);
 window.print();
 say('status','Print prepared locally. It is still a proposed, unsent work card.');
});

// Explicit file relay to the independent Crossings workbench. Public topic only:
// never include the visitor's question, notes, contact details, or private narrative.
$('save-crossing').addEventListener('click',()=>{
 if(state.kit?.standing!=='PUBLIC_DRAFT_PREPARED_UNSENT')return;
 try{
  const packet=makeCrossing(state.kit);
  const file=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(file),a=node('a');a.href=url;
  a.download='abundent-crossing-'+packet.topic+'-unsent.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  say('status','Portable PUBLIC-SAFE crossing ticket saved locally. It has no question text and was not transmitted. Open /crossings/ to choose the next door.');
 }catch{
  say('status','No public-safe crossing ticket was prepared; nothing was exported.');
 }
});

// A visitor chooses to continue; the tiny public-only ticket is carried
// automatically through this browser tab. No download, URL payload or API call.
$('open-crossing').addEventListener('click',()=>{
 if(state.kit?.standing!=='PUBLIC_DRAFT_PREPARED_UNSENT')return;
 try{
  putSessionCrossing(window.sessionStorage,makeCrossing(state.kit));
  location.assign('/crossings/');
 }catch{
  say('status','This browser blocked automatic continuation. You can still save a crossing ticket, then open Crossings and import it manually. Nothing was sent.');
 }
});
