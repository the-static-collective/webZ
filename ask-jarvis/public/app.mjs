import {verifyReturn} from './evidence.mjs';
import {songWav} from './song.mjs';
import {makeHandoffLink,readHandoff} from './cafe.mjs';
import {makeTableSeedLink} from './table-bridge.mjs';

const $ = selector=>document.querySelector(selector);
const form=$('#question-form'), input=$('#question'), ask=$('#ask'), results=$('#results'), reply=$('#reply');
const steps=$('#steps'), sources=$('#sources'), audio=$('#song-audio'), kind=$('#return-kind');
let last=null, run=0, active=null, audioUrl=null, wav=null;

function el(tag,cls,value) {
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(value!==undefined)node.textContent=value;
  return node;
}
function statusStep(step) {
  const li=el('li'),body=el('div','step-body');
  body.append(el('b','',step.name),el('small','',step.detail));
  li.append(el('span','step-mark',step.status==='DONE'?'◉':step.status==='READ'?'✓':'·'),body,
    el('span','status'+(['HOLD','NOT_RUN','UNSIGNED','PREPARED'].includes(step.status)?' hold':''),step.status));
  return li;
}
function cleanAudio() {
  audio.pause();audio.removeAttribute('src');audio.load();
  if(audioUrl)URL.revokeObjectURL(audioUrl);
  audioUrl=null;wav=null;
}
function clearReturn() {
  last=null;reply.hidden=true;cleanAudio();
  $('#handoff-link').value='';
  $('#question-table-status').textContent='Nothing moves until you choose. Do not carry contact details or other people\'s private information.';
  $('#handoff-status').textContent='Do not include names, phone numbers or private details. The question appears in the shared URL.';
  $('#invitation-editor').value='';$('#return-body').textContent='';
  $('#return-doors').replaceChildren();$('#encounter-gaps').replaceChildren();
}
function invalidate() {
  ++run;active?.abort();active=null;clearReturn();results.hidden=true;
  ask.disabled=false;ask.textContent='✳ Ask JAR;VIS! ➜';
}
function download(name,body,type='text/plain;charset=utf-8') {
  const object=URL.createObjectURL(new Blob([body],{type}));
  const a=el('a');a.href=object;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(object),1000);
}
function sourceLink(label,url) {
  const a=el('a','',label);
  if(/^https:\/\/(?:raw\.githubusercontent\.com|github\.com)\/the-static-collective\/[A-Za-z0-9-]+\/(?:blob\/)?[a-f0-9]{40}\/[A-Za-z0-9./-]+$/.test(url)) {
    a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
  }
  return a;
}
function showRecent(cut){
 const box=$('#recent-work');box.replaceChildren();box.hidden=true;
 if(cut?.status!=='READ'||!Array.isArray(cut.selected)||!cut.selected.length)return;
 const title=el('h3','', 'Recent work that may help');
 const notice=el('p','','These are dated, source-linked public project notes, not confirmed partners, verified services, or completed work. Choose a door; a human owner decides what follows.');
 const list=el('ul','sources');
 for(const x of cut.selected.slice(0,3)){
  const li=el('li');li.append(el('strong','',x.title+' · '+x.state),el('p','',x.summary),el('small','','First check: '+x.firstCheck));
  const link=el('a','','Open public door ↗');
  try{const u=new URL(x.publicUrl);if(u.protocol==='https:'&&/^(?:apps|garden|night|postoffice|becoming|connections)\\.abundent\\.org$|^webz-field-porch-theotherlucasv-1250s-projects\\.vercel\\.app$|^github\\.com$/.test(u.hostname)){link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';li.append(link);}}catch{}
  if(/^https:\\/\\/github\\.com\\/the-static-collective\\/[A-Za-z0-9.-]+\\/blob\\/[a-f0-9]{40}\\/[A-Za-z0-9_./-]+$/.test(x.source)){const s=el('a','',' · Source at exact commit ↗');s.href=x.source;s.target='_blank';s.rel='noopener noreferrer';li.append(s);}
  const watched=cut.observations?.status==='READ'
   ?cut.observations.selected?.find(s=>s.repo===String(x.source).split('/')[4]):null;
  if(watched){
   li.append(el('small','','SOURCE WATCH · '+watched.repo+' / '+watched.ref+' · '+watched.status+
    ' · observed '+watched.checkedAt+' · a branch pointer is not proof of deployment or completed work.'));
   if(watched.status==='OBSERVED_HEAD'&&watched.commitUrl){
    const a=el('a','',' Observed ref ↗');a.href=watched.commitUrl;a.target='_blank';a.rel='noopener noreferrer';li.append(a);
   }
  }
  const candidates=cut.changeCandidates?.status==='READ'
   ?(cut.changeCandidates.selected||[]).filter(c=>c.repo===String(x.source).split('/')[4]):[];
  for(const c of candidates.slice(0,2)){
   const box=el('div','change-note');box.append(el('b','','CHANGE CANDIDATE · '+c.state),
    el('p','','GitHub compared '+c.from.slice(0,8)+' → '+c.to.slice(0,8)+' · '+(c.totalFiles??'unresolved')+' changed file(s). This has not been human-reviewed.'));
   for(const f of c.files.slice(0,4))box.append(el('small','',f.status+' · '+f.category+' · '+f.path));
   const a=el('a','','Inspect exact compare ↗');a.href=c.compareUrl;a.target='_blank';a.rel='noopener noreferrer';box.append(a);li.append(box);
  }
  list.append(li);
 }
 if(cut.observations?.status!=='READ')box.append(el('small','','Source watch on HOLD (unavailable or stale). Earlier editorial notes are not evidence of fresh implementation.'));
 const queue=el('a','','Open the public change-review queue ↗');queue.href='/changes.html';box.append(queue);
 box.append(title,notice,list,el('small','','Catalog '+cut.release+' · reviewed '+cut.reviewedOn+' · feed bytes '+cut.sourceSha256));box.hidden=false;
}
function show(data) {
  if(!Array.isArray(data.sources)||!Array.isArray(data.steps)||!Array.isArray(data.encounter?.gaps)||!['question','invitation','door','song','plan'].includes(data.return?.kind))throw Error('Unexpected return format.');
  const returned=data.return;
  $('#asked').textContent=data.question;
  $('#mode').textContent='SOURCE CHECK + LOCAL DRAFT';
  steps.replaceChildren(...data.steps.map(statusStep));
  $('#answer').textContent=data.guidance;
  showRecent(data.recent);
  $('#return-label').textContent={question:'A QUESTION CARD',invitation:'AN INVITATION DRAFT',door:'A POSSIBLE DOOR',song:'OR SIMPLY A SONG',plan:'A POSSIBLE FIELD PLAN'}[returned.kind];
  $('#return-title').textContent=returned.title;$('#return-body').textContent=returned.body;
  $('#return-doors').replaceChildren(...returned.doors.map(d=>{
    const li=el('li');li.append(sourceLink('Open '+d.name+' →',d.url));return li;
  }));
  $('#invitation-tools').hidden=returned.kind!=='invitation';
  if(returned.kind==='invitation') {
    $('#invitation-editor').value=returned.body;
    $('#draft-status').textContent='Original unsigned draft · edit before sharing.';
  }
  $('#song-tools').hidden=returned.kind!=='song';
  if(returned.kind==='song') {
    wav=songWav(returned.song);audioUrl=URL.createObjectURL(new Blob([wav],{type:'audio/wav'}));audio.src=audioUrl;
  }
  sources.replaceChildren(...data.sources.map(s=>{
    const li=el('li');
    li.append(sourceLink(s.name+' — '+s.status,s.source),el('small','',s.role+' / '+s.title),el('small','',s.excerpt));
    if(s.sha256)li.append(el('small','',s.sha256));
    return li;
  }));
  $('#next-question').textContent=data.nextQuestion;
  $('#hash').textContent='Return receipt: '+data.receiptHash;
  $('#receipt-state').textContent='Receipt verified in this browser · unsigned';
  $('#encounter-gaps').replaceChildren(...data.encounter.gaps.map(g=>el('li','',g)));
  last=data;reply.hidden=false;
}

input.addEventListener('input',()=>{input.setCustomValidity('');$('#received-note').hidden=true;invalidate();});
kind.addEventListener('change',invalidate);
$('#invitation-editor').addEventListener('input',()=>{
  $('#draft-status').textContent='Edited unsigned draft · saved separately from the original receipt.';
});
$('#download-edited').addEventListener('click',()=>{
  if(last?.return.kind==='invitation')download('jarvis-my-invitation.txt','Edited unsigned draft — your local revision; no original receipt applies.\n\n'+$('#invitation-editor').value);
});
$('#download-song').addEventListener('click',()=>{if(wav)download('jarvis-original-sketch.wav',wav,'audio/wav');});
$('#download').addEventListener('click',()=>{if(last)download('ask-jarvis-'+last.return.kind+'.txt',last.artifact);});
$('#download-receipt').addEventListener('click',()=>{if(last)download('jarvis-return-receipt.json',JSON.stringify(last,null,2),'application/json');});
$('#download-handoff').addEventListener('click',()=>{if(last)download('jarvis-workbench-request.json',JSON.stringify(last.workbenchRequest,null,2),'application/json');});
$('#print').addEventListener('click',()=>{if(last)window.print();});
$('#ask-next').addEventListener('click',()=>{
  if(!last)return;const next=last.nextQuestion;invalidate();input.value=next;kind.value='auto';input.setCustomValidity('');input.focus();window.scrollTo({top:0,behavior:'smooth'});
});
document.querySelectorAll('[data-example]').forEach(btn=>btn.addEventListener('click',()=>{
  invalidate();input.value=btn.dataset.example;kind.value=btn.dataset.kind||'auto';input.setCustomValidity('');input.focus();
}));
// Arrival through a voluntary question-only link does NOT submit anything.
const passed = readHandoff(window.location.hash);
if (passed) {
  input.value=passed.question;kind.value=passed.kind;
  $('#received-note').hidden=false;
}
async function prepareHandoff(question,returnKind) {
  if(!last) return;
  const status=$('#handoff-status'),field=$('#handoff-link');
  try {
    const url=makeHandoffLink(window.location.href,question,returnKind);
    field.value=url;field.focus();field.select();
    if(navigator.clipboard?.writeText) {
      try {await navigator.clipboard.writeText(url);
        status.textContent='Link copied. Give it to one willing person; no message was sent and no invitation was accepted.';
        return;
      } catch { /* visible manual link fallback */ }
    }
    status.textContent='Select and copy the link above. Only share with someone who wants it. No one has been contacted.';
  } catch {
    field.value='';status.textContent='This question is not suitable for a public link. Please remove contact details and try another question.';
  }
}
$('#copy-question').addEventListener('click',()=>{if(last)void prepareHandoff(last.question,last.return.kind);});
$('#copy-next').addEventListener('click',()=>{if(last)void prepareHandoff(last.nextQuestion,'auto');});
$('#start-table-from-question').addEventListener('click',()=>{
  if(!last)return;
  try{
    // This is a human-triggered, same-site transition carrying only one public-safe question.
    const link=makeTableSeedLink(window.location.href,last.question);
    window.location.assign(link);
  }catch{
    $('#question-table-status').textContent='That question cannot safely travel in a URL. Remove names or contact details and ask a revised question first.';
  }
});
window.addEventListener('pagehide',()=>{invalidate();});

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const question=input.value, chosen=kind.value;
  if(question.trim().length<8||question.length>360) {
    input.setCustomValidity('Please use 8–360 characters.');input.reportValidity();return;
  }
  input.setCustomValidity('');invalidate();
  const thisRun=run,controller=new AbortController();active=controller;
  const timer=setTimeout(()=>controller.abort(),12000);
  ask.disabled=true;ask.textContent='Tuning the machine…';results.hidden=false;
  $('#mode').textContent='WORKING…';$('#asked').textContent=question;
  steps.replaceChildren(statusStep({name:'JAR;VIS',status:'PREPARED',detail:'Checking fixed source documents and composing your return…'}));
  results.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  try {
    const response=await fetch('/api/ask',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({question,kind:chosen}),cache:'no-store',credentials:'same-origin',signal:controller.signal});
    let data;try{data=await response.json();}catch{throw Error('The question engine could not return a readable result. Please try again.');}
    if(!response.ok)throw Error(data.error||'The machine declined this input.');
    if(data.encounter?.signal!==question||!await verifyReturn(data))throw Error('The return receipt did not verify. No artifact is being claimed.');
    if(thisRun!==run)return;
    show(data);
  } catch(error) {
    if(thisRun!==run)return;
    clearReturn();
    steps.replaceChildren(statusStep({name:'HOLD',status:'HOLD',detail:controller.signal.aborted?'The machine took too long. Please try again.':error.message||'Cannot confirm a machine response.'}));
    $('#mode').textContent='NO RESULT CLAIMED';
  } finally {
    clearTimeout(timer);
    if(thisRun===run){active=null;ask.disabled=false;ask.textContent='✳ Ask JAR;VIS! ➜';}
  }
});
