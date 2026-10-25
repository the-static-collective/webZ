import {verifyReturn,verifyInvestigation,matchesInvestigationSources,verifyCouncil,matchesCouncilSources} from './evidence.mjs';
import {songWav} from './song.mjs';
import {makeHandoffLink,readHandoff} from './cafe.mjs';
import {makeTableSeedLink} from './table-bridge.mjs';

const $ = selector=>document.querySelector(selector);
const form=$('#question-form'), input=$('#question'), ask=$('#ask'), results=$('#results'), reply=$('#reply');
const steps=$('#steps'), sources=$('#sources'), audio=$('#song-audio'), kind=$('#return-kind');
let last=null, run=0, active=null, audioUrl=null, wav=null, visActive=null, councilActive=null;

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
  visActive?.abort();visActive=null;
  councilActive?.abort();councilActive=null;
  $('#council-result').textContent='The source-first question card works independently. Council is disabled on production.';
  $('#council-investigate').disabled=false;
  $('#vis-result').textContent='Model investigation is optional and may be unavailable. The original question card works without it.';
  $('#vis-investigate').disabled=false;
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
  if(/^https:\/\/(?:raw\.githubusercontent\.com|github\.com)\/the-static-collective\/[A-Za-z0-9.-]+\/(?:blob\/)?[a-f0-9]{40}\/[A-Za-z0-9./-]+$/.test(url)) {
    a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
  }
  return a;
}
function show(data) {
  if(!Array.isArray(data.sources)||!Array.isArray(data.steps)||!Array.isArray(data.encounter?.gaps)||!['question','invitation','door','song','plan'].includes(data.return?.kind))throw Error('Unexpected return format.');
  const returned=data.return;
  $('#asked').textContent=data.question;
  $('#mode').textContent='SOURCE CHECK + LOCAL DRAFT';
  steps.replaceChildren(...data.steps.map(statusStep));
  $('#answer').textContent=data.guidance;
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
async function askVis() {
  if(!last)return;
  visActive?.abort();
  const controller=new AbortController();visActive=controller;
  const button=$('#vis-investigate'),target=$('#vis-result');
  button.disabled=true;target.textContent='VIS is checking the bounded source notes (no project actions)…';
  const timer=setTimeout(()=>controller.abort(),23000);
  try {
    const response=await fetch('/api/investigate',{
      method:'POST',cache:'no-store',credentials:'same-origin',
      headers:{'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({question:last.question,kind:last.return.kind,route:$('#vis-route').value}),signal:controller.signal
    });
    const data=await response.json();
    if(visActive!==controller)return;
    if(data.status==='HOLD') {
      const detail=data.failureCode&&data.providerId
        ? 'HOLD · '+data.providerId+' · '+data.failureCode+'. '
        : 'HOLD. ';
      target.textContent=detail+(data.message||'The model is unavailable. The original source-first question card is unchanged.');
      return;
    }
    if(!response.ok||!await verifyInvestigation(data)||data.question!==last.question
      ||!matchesInvestigationSources(last,data))throw Error('Model proposal was not verifiable. No investigation is claimed.');
    const panel=el('div','vis-answer');
    panel.append(el('h4','', 'VIS · MODEL-GENERATED HYPOTHESES'));
    if(data.routing?.provider)panel.append(el('small','',
      'Free-compute route: '+data.routing.route+' · '+data.routing.provider+
      ' · '+data.routing.model+' · 1 model call · no paid fallback'));
    panel.append(el('p','',data.investigation.summary));
    const list=el('ol','vis-connections');
    for(const c of data.investigation.connections) {
      const li=el('li');li.append(el('p','',c.idea));
      if(c.sourceIds.length) {
        const links=el('div','vis-citations');
        links.append(el('small','', 'Inspected source doors: '));
        for(const id of c.sourceIds) {
          const src=data.sourceReferences.find(x=>x.id===id);
          if(!src)continue;
          links.append(sourceLink(src.name+' ↗',src.document));
        }
        li.append(links);
      } else li.append(el('small','', 'New proposal · no specific source passage cited'));
      list.append(li);
    }
    panel.append(list,el('h4','', 'SMALLEST REVERSIBLE TEST'),el('p','',data.investigation.firstTest));
    panel.append(el('h4','', 'STILL UNKNOWN'));
    const unknown=el('ul');for(const v of data.investigation.unknowns)unknown.append(el('li','',v));
    panel.append(unknown,el('h4','', 'HUMAN PERMISSION GATE'),el('p','',data.investigation.consentCheck),
      el('small','',data.disclaimer));
    target.replaceChildren(panel);
  } catch(error) {
    if(visActive===controller)target.textContent=controller.signal.aborted
      ? 'HOLD: the investigation timed out. The original question card is unchanged.'
      : 'HOLD: the model reply could not be verified. No model result is claimed.';
  } finally {
    clearTimeout(timer);
    if(visActive===controller){visActive=null;button.disabled=false;}
  }
}
// Preview registry reports only key presence and explicit flags; not proof of key validity or free quota.
async function refreshVisProviders() {
  const target=$('#vis-providers');
  if(!target)return;
  try {
    const response=await fetch('/api/free-resources',{method:'GET',cache:'no-store',credentials:'same-origin'});
    if(!response.ok)throw Error('NOT_AVAILABLE');
    const state=await response.json();
    const ready=(state.providers||[]).filter(x=>x.kind==='text'&&x.ready).map(x=>x.id);
    target.textContent=state.routerEnabled
      ? 'Configured on this protected preview (credentials not live-tested): '+(ready.join(', ')||'none')+'.'
      : 'Free compute is not enabled on this deployment.';
  } catch {
    target.textContent='Provider readiness is available only on protected JAR;VIS previews.';
  }
}
void refreshVisProviders();

async function askCouncil() {
  if(!last)return;
  councilActive?.abort();
  const controller=new AbortController();
  councilActive=controller;
  const button=$('#council-investigate'),target=$('#council-result');
  button.disabled=true;
  target.textContent='JAR is checking pinned ALEX / 3rdi / LOADOUT source doors. Groq will scout, then Gemini will challenge its proposal. No project actions…';
  const timer=setTimeout(()=>controller.abort(),47000);
  try{
    const response=await fetch('/api/council',{
      method:'POST',cache:'no-store',credentials:'same-origin',
      headers:{'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({question:last.question,kind:last.return.kind}),signal:controller.signal
    });
    const value=await response.json();
    if(councilActive!==controller)return;
    if(value.status==='HOLD'||value.status==='PARTIAL_HOLD'){
      target.textContent='HOLD · '+(value.reason||'REVIEW_INCOMPLETE')+'. '+(value.message||'No accepted result.')+
        ' No automatic retry or paid fallback.';
      return;
    }
    if(!response.ok||!await verifyCouncil(value)||!matchesCouncilSources(last,value))
      throw Error('Council receipt or inspected sources did not verify.');
    const panel=el('div','vis-answer');
    panel.append(el('h4','','TWO-MODEL SOURCE-FIRST REASONING · GROQ → GEMINI'));
    panel.append(el('small','','2 API calls · 3 fixed source constitutions inspected separately · no execution · unsigned'));
    panel.append(el('h4','','GROQ · THE MISSING INGREDIENT'),el('p','',value.scout.missingIngredient));
    panel.append(el('p','',value.scout.hypothesis),el('p','',value.scout.whyThisOne));
    function sourceRow(sourceIds,heading){
      if(!sourceIds.length)return el('small','','Hypothesis · no particular source supports this claim.');
      const container=el('div','vis-citations');
      container.append(el('small','',heading+' '));
      for(const id of sourceIds) {
        const src=value.sourceReferences.find(ref=>ref.id===id);
        if(src)container.append(sourceLink(src.name+' ↗',src.document));
      }
      return container;
    }
    panel.append(sourceRow(value.scout.sourceIds,'Scout source anchors:'));
    panel.append(el('h4','','GEMINI · INDEPENDENT PRESSURE TEST'));
    panel.append(el('p','','Verdict: '+value.critic.verdict+' · '+value.critic.pressure));
    panel.append(el('p','','Evidence gap: '+value.critic.evidenceGap));
    panel.append(el('p','','Disagreement / remaining doubt: '+value.critic.disagreement));
    panel.append(sourceRow(value.critic.sourceIds,'Critic source anchors:'));
    panel.append(el('h4','','THE SMALLEST ACTUAL CHECK'));
    panel.append(el('p','',value.critic.smallestCheck));
    panel.append(el('h4','','ONE QUESTION FOR A WILLING STEWARD'),el('p','',value.scout.firstQuestion));
    panel.append(el('h4','','PERMISSION & UNKNOWN FACTS'),el('p','',value.scout.consentCheck));
    const unknowns=el('ul');for(const v of value.scout.unknowns)unknowns.append(el('li','',v));
    panel.append(unknowns,el('small','','STATUS: '+value.pressureVerdict+
      ' · Proposed ingredient unverified · evidence receipt verified · no action authorized.'));
    target.replaceChildren(panel);
  }catch {
    if(councilActive===controller)target.textContent=controller.signal.aborted
      ? 'HOLD: the two-model council timed out; no agreement or action is claimed.'
      : 'HOLD: council receipt/sources or response could not be verified. The ordinary card is unchanged.';
  }finally{
    clearTimeout(timer);
    if(councilActive===controller){councilActive=null;button.disabled=false;}
  }
}
$('#council-investigate').addEventListener('click',()=>{void askCouncil();});

$('#vis-investigate').addEventListener('click',()=>{void askVis();});

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
