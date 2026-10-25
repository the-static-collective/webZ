import {sha256,verifyReturn,verifyInvestigation,matchesInvestigationSources} from './evidence.mjs';
import {songWav} from './song.mjs';
import {makeHandoffLink,readHandoff} from './cafe.mjs';
import {buildRelayCapsule,makeRelayLink} from './relay.mjs';
import {makeTableSeedLink} from './table-bridge.mjs';

const $ = selector=>document.querySelector(selector);
const form=$('#question-form'), input=$('#question'), ask=$('#ask'), results=$('#results'), reply=$('#reply');
const steps=$('#steps'), sources=$('#sources'), audio=$('#song-audio'), kind=$('#return-kind'),triadToggle=$('#triad-opt-in');
let last=null, run=0, active=null, audioUrl=null, wav=null, visActive=null, visProposal=null, nativeReceipt=null, nativeActive=null, discoveryActive=null,discoveryReceipt=null;

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
  visActive?.abort();visActive=null;visProposal=null;
  discoveryActive?.abort();discoveryActive=null;discoveryReceipt=null;
  $('#discovery-tools').hidden=true;$('#discover-download').hidden=true;
  $('#discover-nominate').hidden=true;$('#discover-run').disabled=false;
  $('#discover-result').textContent='No external search requested. Nothing learned, saved, or submitted automatically.';
  $('#discover-nominate-status').textContent='';
  nativeActive?.abort();nativeActive=null;nativeReceipt=null;
  $('#native-result').textContent='Not run. Unlike the source lens above, this calls real owner runtime code.';
  $('#native-download').hidden=true;$('#native-run').disabled=false;
  $('#vis-relay').hidden=true;$('#vis-relay-approved').checked=false;
  $('#share-vis-relay').disabled=true;$('#vis-relay-link').value='';
  $('#vis-relay-status').textContent='Nothing is shared automatically. This is an AI investigation draft, not a real-world completion record.';
  $('#vis-result').textContent='Model investigation is optional and may be unavailable. The original question card works without it.';
  $('#vis-investigate').disabled=false;
  last=null;reply.hidden=true;cleanAudio();
  $('#handoff-link').value='';
  $('#question-table-status').textContent='Nothing moves until you choose. Do not carry contact details or other people\'s private information.';
  $('#handoff-status').textContent='Do not include names, phone numbers or private details. The question appears in the shared URL.';
  $('#invitation-editor').value='';$('#return-body').textContent='';
  $('#return-doors').replaceChildren();$('#encounter-gaps').replaceChildren();
  $('#triad-result').hidden=true;$('#triad-content').replaceChildren();
  $('#northstar-panel').hidden=true;
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
  const context=data.context;
  $('#northstar-panel').hidden=!context;
  if(context){
    const related=(context.workstreams||[]).map(x=>x.title).slice(0,3);
    $('#northstar-summary').textContent=context.relation==='INDEPENDENT_QUESTION'
      ?'The question is independent of our projects. JAR;VIS should answer it on its own terms, using appropriate sources.'
      :'Potentially related workstreams: '+(related.join(' · ')||'None identified')+
        '. This is editorial orientation, not evidence of an active service.';
    $('#northstar-caution').textContent=context.caution+' · Mission revision: '+context.missionRevision;
  }
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
  if(data.triad) {
    const t=data.triad,content=$('#triad-content');
    const alex=el('section','triad-slice');
    alex.append(el('h4','','ALEX · What can this source actually witness?'),
      el('p','',t.alex.warning));
    const aList=el('ul');
    for(const f of t.alex.formation) aList.append(el('li','',f.id+' / '+f.status+' / '+(f.excerptLocus||'No verified excerpt locus')+' / '+(f.sha256||'NO BYTE WITNESS')));
    alex.append(aList);
    const rdi=el('section','triad-slice');
    rdi.append(el('h4','','3rdi · What was visible at this cut?'),
      el('p','',t.rdi.cut.observer+' · observed '+t.rdi.cut.observedAt+' · historical occurrence UNKNOWN'),
      el('p','',t.rdi.warning));
    const rList=el('ul');
    for(const p of t.rdi.projections) rList.append(el('li','',p.id+' / '+p.availability+' / '+p.relation));
    rdi.append(rList);
    const load=el('section','triad-slice');
    load.append(el('h4','','LOADOUT · What stayed asleep?'),
      el('p','',t.loadout.stage+' · native binding NOT RUN'),
      el('p','',t.loadout.warning),
      el('p','', 'Permitted: '+t.loadout.permitted.join(' · ')),
      el('p','', 'Fenced: '+t.loadout.fenced.join(' · ')));
    content.replaceChildren(alex,rdi,load);$('#triad-result').hidden=false;
  }
  $('#next-question').textContent=data.nextQuestion;
  $('#hash').textContent='Return receipt: '+data.receiptHash;
  $('#receipt-state').textContent='Receipt verified in this browser · unsigned';
  $('#encounter-gaps').replaceChildren(...data.encounter.gaps.map(g=>el('li','',g)));
  last=data;reply.hidden=false;$('#discovery-tools').hidden=false;
}

input.addEventListener('input',()=>{input.setCustomValidity('');$('#received-note').hidden=true;invalidate();});
kind.addEventListener('change',invalidate);
triadToggle.addEventListener('change',invalidate);
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
  visProposal=null;$('#vis-relay').hidden=true;$('#vis-relay-approved').checked=false;
  $('#share-vis-relay').disabled=true;$('#vis-relay-link').value='';
  button.disabled=true;target.textContent='VIS is checking the bounded source notes (no project actions)…';
  const timer=setTimeout(()=>controller.abort(),16000);
  try {
    const response=await fetch('/api/investigate',{
      method:'POST',cache:'no-store',credentials:'same-origin',
      headers:{'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({question:last.question,kind:last.return.kind,lens:last.triad?'triad':'standard'}),signal:controller.signal
    });
    const data=await response.json();
    if(visActive!==controller)return;
    if(data.status==='HOLD') {
      target.textContent=data.message||'HOLD: the model is not available. Your original source-first question card is unchanged.';
      return;
    }
    if(!response.ok||!await verifyInvestigation(data)||data.question!==last.question
      ||!matchesInvestigationSources(last,data))throw Error('Model proposal was not verifiable. No investigation is claimed.');
    const panel=el('div','vis-answer');
    panel.append(el('h4','', 'VIS · MODEL-GENERATED HYPOTHESES'),el('p','',data.investigation.summary));
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
    visProposal=data;$('#vis-relay').hidden=false;
  } catch(error) {
    if(visActive===controller)target.textContent=controller.signal.aborted
      ? 'HOLD: the investigation timed out. The original question card is unchanged.'
      : 'HOLD: the model reply could not be verified. No model result is claimed.';
  } finally {
    clearTimeout(timer);
    if(visActive===controller){visActive=null;button.disabled=false;}
  }
}
$('#vis-relay-approved').addEventListener('change',()=>{
  $('#share-vis-relay').disabled=!$('#vis-relay-approved').checked||!visProposal;
  if(!$('#vis-relay-approved').checked) {
    $('#vis-relay-link').value='';
    $('#vis-relay-status').textContent='Sharing withdrawn locally. Any link you already gave someone cannot be recalled.';
  }
});
$('#download-vis-receipt').addEventListener('click',()=>{
  if(!visProposal)return;
  download('jarvis-vis-model-proposal-unsigned.json',JSON.stringify(visProposal,null,2),'application/json');
});
$('#share-vis-relay').addEventListener('click',async()=>{
  if(!last||!visProposal||!$('#vis-relay-approved').checked)return;
  const status=$('#vis-relay-status'),field=$('#vis-relay-link');
  try {
    if(!await verifyInvestigation(visProposal)||!matchesInvestigationSources(last,visProposal))
      throw Error('RELAY_NOT_VERIFIED');
    const capsule=await buildRelayCapsule(last,visProposal);
    const link=makeRelayLink(window.location.href,capsule);
    field.value=link;field.focus();field.select();
    if(navigator.clipboard?.writeText){
      try {await navigator.clipboard.writeText(link);
        status.textContent='Unsigned proposal link copied. It contains the question and AI summary. No message was sent or field work confirmed.';
        return;
      } catch {/* use the select-and-copy fallback below */}
    }
    status.textContent='Select and copy the link above. The text is public to anyone who receives it. No one has been contacted.';
  } catch {
    field.value='';
    status.textContent='This AI proposal could not be made into a bounded, public-safe link. Download the complete model receipt instead, review it, and do not claim verified action.';
  }
});
async function runNative() {
  if(!last?.triad)return;
  nativeActive?.abort();
  const controller=new AbortController();nativeActive=controller;
  const button=$('#native-run'),target=$('#native-result');
  nativeReceipt=null;$('#native-download').hidden=true;
  target.textContent='Running exact-pinned native ALEX, 3rdi and LOADOUT owner code. No field action or model call…';
  button.disabled=true;
  const timer=setTimeout(()=>controller.abort(),38000);
  try {
    const response=await fetch('/api/native',{
      method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({question:last.question,lens:'triad'}),signal:controller.signal
    });
    const output=await response.json();
    if(nativeActive!==controller)return;
    if(!response.ok||output.mode!=='REAL_OWNER_KERNEL_INVOCATION') {
      target.textContent='HOLD · Native owner kernels were unavailable or refused. No native execution is claimed.';
      return;
    }
    const {receiptHash,...body}=output;
    if(await sha256(JSON.stringify(body))!==receiptHash||await sha256(last.question)!==output.questionDigest)
      throw Error('NATIVE_RECEIPT_NOT_VERIFIED');
    const expected=new Map(last.triad.alex.formation.map(x=>[x.id,x.commit]));
    if(expected.get('alex')!==output.ownerCommits?.alex
      ||expected.get('3rdi')!==output.ownerCommits?.rdi
      ||expected.get('loadout')!==output.ownerCommits?.loadout)
      throw Error('NATIVE_OWNER_PIN_MISMATCH');
    const view=el('div','native-evidence');
    view.append(
      el('h4','','THREE NATIVE KERNEL RECEIPTS · LOCAL TEST'),
      el('p','', 'ALEX: '+output.alex.disposition+' / '+output.alex.reasonCode+
        ' · source supports a real local food-need claim? '+String(output.alex.sourceSupportsLocalClaim)),
      el('p','', '3rdi: '+output.rdi.nativeSchema+' · '+output.rdi.cutId+
        ' · only this synthetic question arrival was modeled; older source history remains UNKNOWN'),
      el('p','', 'LOADOUT: '+output.loadout.nativeSchema+
        ' · '+output.loadout.capabilities.map(x=>x.capability+'='+x.status).join(', ')),
      el('p','', 'Real-world effects: NONE · human gate remains REQUIRED'),
      el('small','', 'Full verified unsigned native receipt: '+receiptHash)
    );
    target.replaceChildren(view);
    nativeReceipt=output;$('#native-download').hidden=false;
  } catch {
    if(nativeActive===controller)target.textContent=controller.signal.aborted
      ? 'HOLD · Native kernel test timed out. No work or permission is claimed.'
      : 'HOLD · Owner runtime reply or receipt could not be verified.';
  } finally {
    clearTimeout(timer);
    if(nativeActive===controller){nativeActive=null;button.disabled=false;}
  }
}
$('#native-run').addEventListener('click',()=>{void runNative();});
$('#native-download').addEventListener('click',()=>{
  if(nativeReceipt)download('jarvis-native-owner-receipts-unsigned.json',JSON.stringify(nativeReceipt,null,2),'application/json');
});
const DISCOVERY_MEMORY='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/discovery-memory';
async function runDiscovery(){
 if(!last)return;
 discoveryActive?.abort();
 const controller=new AbortController();discoveryActive=controller;
 const button=$('#discover-run'),target=$('#discover-result');
 button.disabled=true;discoveryReceipt=null;$('#discover-download').hidden=true;
 $('#discover-nominate').hidden=true;$('#discover-nominate-status').textContent='';
 target.textContent='Orienting against the Abundent North Star and Free Graph, then checking one bounded external public search…';
 const timer=setTimeout(()=>controller.abort(),13000);
 try{
  const res=await fetch('/api/discover',{method:'POST',cache:'no-store',credentials:'same-origin',
   headers:{'content-type':'application/json'},body:JSON.stringify({question:last.question,search:true}),signal:controller.signal});
  const d=await res.json();
  if(discoveryActive!==controller)return;
  if(!res.ok||d.schema!=='ask-jarvis/discovery-v1'){
   target.textContent='HOLD · Discovery is unavailable. Your original question card is unchanged and no new fact was saved.';
   return;
  }
  const {receiptHash,...body}=d;
  if(await sha256(JSON.stringify(body))!==receiptHash||d.question!==last.question)throw Error('INVALID_DISCOVERY_RECEIPT');
  const view=el('div','discovery-card');
  view.append(el('h4','','ORIENT · ABUNDENT NORTH STAR'),el('p','',d.mission.goal));
  const relevant=d.orientation.relatedWorkstreams||[];
  view.append(el('p','',relevant.length
   ?'Optional related efforts: '+relevant.map(x=>x.title).join(' · ')+'. These are directions, not partner commitments.'
   :'Independent question: no Collective project connection is required.'));
  view.append(el('h4','','REMEMBER · RELEVANT REVIEWED RESEARCH'));
  if(d.reviewedContext?.length){
    const ul=el('ul');
    for(const m of d.reviewedContext){
      const li=el('li');li.append(el('span','',m.title+' · source review at '+(m.reviewedAt||'unknown')+' · '));
      try{const u=new URL(m.url);if(u.protocol==='https:'){const a=el('a','','Read original ↗');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';li.append(a);}}
      catch{}
      ul.append(li);
    }view.append(ul);
  }else view.append(el('p','','No previously reviewed research matches this question yet.'));
  view.append(el('h4','','DISCOVER · EXTERNAL SOURCE CANDIDATES'));
  view.append(el('p','',d.search.note));
  if(d.externalSources.length){
    const list=el('ol','discovery-sources');
    for(const src of d.externalSources){
      const li=el('li');
      const a=el('a','',src.title+' ↗');a.href=src.url;a.target='_blank';a.rel='noopener noreferrer';
      a.referrerPolicy='no-referrer';
      li.append(a,el('p','',src.description),el('small','',src.provider+' · search snippet only · '+src.status));
      list.append(li);
    }view.append(list);
  }else view.append(el('p','',d.status==='HOLD_LOCAL_LOOKUP_NOT_CONFIGURED'
      ?'HOLD: Real-time local business search is not configured. Please use a local or official source directly; no business or open hours were invented.'
      :'No usable external sources were returned. This is a valid unresolved result.'));
  view.append(el('h4','','WEAVE · UNVERIFIED RELATIONS'));
  const connections=el('ul');
  for(const c of d.weave||[])connections.append(el('li','',c.hypothesis+' · proposed / no authority'));
  if(!connections.childElementCount)connections.append(el('li','','No connection inferred from available evidence.'));
  view.append(connections,el('p','',d.approval),
    el('small','','Receipt: '+d.receiptHash+' · Unsigned · No service request, pledge or publication'));
  target.replaceChildren(view);
  discoveryReceipt=d;$('#discover-download').hidden=false;
  $('#discover-nominate').hidden=!d.externalSources.length;
 }catch{
  if(discoveryActive===controller)target.textContent=controller.signal.aborted
    ?'HOLD · Research timed out. No new community knowledge was saved.'
    :'HOLD · Discovery receipt or external research could not be verified.';
 }finally{
  clearTimeout(timer);if(discoveryActive===controller){discoveryActive=null;button.disabled=false;}
 }
}
$('#discover-run').addEventListener('click',()=>{void runDiscovery();});
$('#discover-download').addEventListener('click',()=>{
 if(discoveryReceipt)download('jarvis-discovery-unsigned-research-receipt.json',JSON.stringify(discoveryReceipt,null,2),'application/json');
});
$('#discover-nominate').addEventListener('click',async()=>{
 const d=discoveryReceipt,src=d?.externalSources?.[0],status=$('#discover-nominate-status');
 if(!src)return;
 const button=$('#discover-nominate');button.disabled=true;
 status.textContent='Sending one public SOURCE SNIPPET to a private review queue. Not publicly adopting it…';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
 try{
  const res=await fetch(DISCOVERY_MEMORY,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
   headers:{'content-type':'application/json'},signal:controller.signal,
   body:JSON.stringify({title:src.title,description:src.description,url:src.url,provider:src.provider,
     relatedSeed:d.orientation.relatedIdeas?.[0]?.id||''})});
  const body=await res.json();
  if(!res.ok||body.status!=='PENDING_PRIVATE_SOURCE_REVIEW')throw Error('QUEUE_HOLD');
  status.textContent='Source candidate '+body.candidateId+' received privately. No person or project endorsed it; it will not appear in reviewed context until a person checks its actual source.';
  button.hidden=true;
 }catch{status.textContent='The private source-review queue did not confirm receipt. Download the research receipt instead; nothing was published.';}
 finally{clearTimeout(timer);button.disabled=false;}
});
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
  const question=input.value, chosen=kind.value, chosenLens=triadToggle.checked?'triad':'standard';
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
    const response=await fetch('/api/ask',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({question,kind:chosen,lens:chosenLens}),cache:'no-store',credentials:'same-origin',signal:controller.signal});
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
