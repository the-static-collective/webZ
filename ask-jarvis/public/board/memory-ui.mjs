// MEMORY-026 · Public reviewed posts become *possible next steps*, never commands.
// Data arrives only from the verified reviewed-only workboard-history response.
import {THREADS,summarizeHistory,actionReceipt,printableInvitation} from './memory.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const state={received:false,failed:false,scope:'all',entries:[],complete:false};
function notify(text){$('memory-status').textContent=text;}
const summarize=()=>summarizeHistory(state.entries,{scope:state.scope,allPagesRead:state.complete});
function fromSummary(s){
 return actionReceipt(s,location.href);
}
function download(s){
 const packet=fromSummary(s),file=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
 const path=URL.createObjectURL(file),a=document.createElement('a');
 a.href=path;a.download='abundent-action-candidate-'+s.thread+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(path),1000);
 notify('Saved a LOCAL candidate, not submitted to JAR;VIS, GRAFT or any community partner.');
}
async function copy(s){
 const words=printableInvitation(fromSummary(s));
 try{
  if(navigator.clipboard&&isSecureContext)await navigator.clipboard.writeText(words);
  else{
   const area=document.createElement('textarea');area.value=words;area.style.position='fixed';area.style.left='-9999px';
   document.body.append(area);area.select();
   const copied=document.execCommand('copy');area.remove();
   if(!copied)throw Error('COPY_UNAVAILABLE');
  }
  notify('One-page invitation copied. You choose whether and to whom to send it.');
 }catch{notify('Copy blocked. Use Print card or save the candidate file instead.');}
}
function print(s){
 const words=printableInvitation(fromSummary(s));
 $('print-detail').textContent=words;
 notify('This card is an unsubmitted proposal. Printing does not publish or verify it.');
 window.print();
}
function card(s){
 const article=el('article','','memory-card');article.dataset.thread=s.thread;
 const top=el('div','','memory-card-heading');
 top.append(el('span',s.name,'memory-name'),el('span',s.coverage==='LATEST_REVIEWED_PAGE_ONLY'?'RECENT PAGE':'REVIEWED HISTORY','tag'));
 article.append(top);
 if(s.reviewedCount){
  const n=s.reviewedCount;
  article.append(el('p',n+' reviewed contribution'+(n===1?'':'s')+' loaded · '+s.withdrawnCount+' withdrawn marker(s).','quiet'));
  const latest=s.latestReviewed;
  const note=el('blockquote','','memory-evidence');
  note.append(el('small','LATEST REVIEWED COMMENT · '+latest.kind.toUpperCase()+' · NOT INDEPENDENTLY VERIFIED','tag'));
  note.append(el('p',latest.text,''));
  article.append(note);
 }else article.append(el('p','No reviewed community contributions in the loaded history. This next move is editorial—not a community decision.','quiet'));
 const step=el('section','','memory-move');
 step.append(el('small','POSSIBLE NEXT STEP · NOT ASSIGNED','tag'),
  el('h3',s.next.headline),el('p',s.next.text));
 article.append(step);
 article.append(el('p','Permission before consequence: '+s.next.gate,'memory-gate'));
 const actions=el('div','','memory-actions');
 const row=[
  ['Find the missing helper',()=>{
    window.dispatchEvent(new CustomEvent('open-seat-from-memory',{detail:{summary:s}}));
    $('open-seats')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    notify('A possible missing capability is ready to explore. Nobody was assigned or signed up.');
   }],
  ['Draft a response',()=>{
    window.dispatchEvent(new CustomEvent('workboard-compose-candidate',{detail:{
     thread:s.thread,kind:'proposal',text:s.next.text
    }}));
    $('shared-history')?.scrollIntoView({behavior:'smooth'});
    notify('Prepared a local response draft only. Review and edit it yourself; nothing is submitted until you give consent and press Submit.');
   }],
  ['Read thread',()=>{window.dispatchEvent(new CustomEvent('board-topic-selected',{detail:{thread:s.thread}}));
    $('shared-history')?.scrollIntoView({behavior:'smooth'});}],
  ['Copy invitation',()=>void copy(s)],
  ['Print card',()=>print(s)],
  ['Save source receipt',()=>download(s)]
 ];
 for(const [label,fn] of row){
  const button=el('button',label,'btn'+(label==='Copy invitation'?'':' alt'));
  button.type='button';button.addEventListener('click',fn);actions.append(button);
 }
 article.append(actions);
 return article;
}
function render(){
 const panel=$('memory-cards');panel.replaceChildren();
 if(!state.received){
  notify(state.failed?'Shared history is unavailable. No community conclusions can be drawn.':'Reading reviewed community history…');
  return;
 }
 const summaries=summarize();
 for(const s of summaries)panel.append(card(s));
 const count=summaries.reduce((n,s)=>n+s.reviewedCount,0);
 const basis=state.complete?'Loaded reviewed history':'The newest reviewed page only';
 notify(count?basis+' · '+count+' reviewed contribution(s) visible. Every proposed next move needs human permission.':
  'No reviewed community contributions in this view. The six starters are editorial invitations, not evidence of community activity.');
 $('memory-coverage').textContent=state.complete?
  'Coverage: all loaded pages for the selected view. Publication review does not verify real-world claims.':
  'Coverage: only the reviewed pages loaded so far. Older posts may exist. Read more history below before treating this as a complete record.';
}
window.addEventListener('workboard-reviewed-history',e=>{
 const data=e.detail;
 if(!data||!Array.isArray(data.entries))return;
 state.received=true;state.failed=false;state.scope=data.scope||'all';
 state.entries=data.entries;state.complete=Boolean(data.complete);render();
});
window.addEventListener('workboard-history-error',()=>{
 state.failed=true;state.received=false;state.entries=[];render();
});
render();
