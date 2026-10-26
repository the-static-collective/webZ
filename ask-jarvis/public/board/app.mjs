import {OPPORTUNITIES,KINDS,getOpportunity,newOpportunity,readOpportunityLink,
 opportunityLink,composeContribution,invitationText,campfireDoor,mapHandoff,publicSafeText} from './model.mjs';

const $=id=>document.getElementById(id);
const make=(tag,className='',value)=>{const n=document.createElement(tag);if(className)n.className=className;if(value!==undefined)n.textContent=String(value);return n;};
const state={topic:readOpportunityLink(location.hash)||getOpportunity('grocery'),entry:null,term:''};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function notify(message){$('status').textContent=message;}
function pick(topic,updateURL=true){
 state.topic=topic;state.entry=null;
 $('draft').value='';$('kind').value='question';$('draft-panel').hidden=true;
 if(updateURL)history.replaceState(null,'',opportunityLink(location.href,topic));
 paintList();paintTopic();notify('');
}
function paintList(){
 $('thread-list').replaceChildren();
 const matching=OPPORTUNITIES.filter(t=>
  [t.title,t.category,t.question,t.missing].join(' ').toLowerCase().includes(state.term));
 if(state.topic.id==='open'){
  const own=make('button','thread');own.type='button';
  own.setAttribute('aria-current','true');
  own.append(make('span','tag',state.topic.category),make('strong','',state.topic.title),
   make('small','',state.topic.question));
  own.addEventListener('click',()=>pick(state.topic));$('thread-list').append(own);
 }
 for(const item of matching){
  const button=make('button','thread');button.type='button';
  button.setAttribute('aria-current',String(item.id===state.topic.id));
  button.append(make('span','tag',item.category),make('strong','',item.title),
   make('small','',item.question));
  button.addEventListener('click',()=>{pick(item);$('topic-detail').scrollIntoView({behavior:reduced()?'auto':'smooth'});});
  $('thread-list').append(button);
 }
 if(!matching.length&&state.topic.id!=='open')$('thread-list').append(make('p','quiet','No matching starting questions. You can open your own.'));
}
function paintTopic(){
 const t=state.topic;
 $('thread-category').textContent=t.category;
 $('thread-title').textContent=t.title;
 $('thread-question').textContent=t.question;
 $('thread-known').textContent=t.known;
 $('thread-missing').textContent=t.missing;
 $('thread-first').textContent=t.first;
 $('thread-gate').textContent=t.gate;
 $('thread-source').textContent=t.source.replaceAll('_',' · ');
 $('link-campfire').href=campfireDoor(location.href,t);
 const role=new URL('/roles/',location.href);
 $('link-roles').href=role.toString();
 $('link-table').href='/tables/';
 $('topic-identity').textContent=t.id==='open'?'LOCAL OPEN QUESTION · NOT PUBLISHED':
  'STARTER CARD · NOT A LIVE STATUS REPORT';
 $('special-garden').hidden=!['grocery','milk'].includes(t.id);
}
$('filter').addEventListener('input',e=>{
 state.term=e.target.value.trim().toLowerCase();paintList();
});
$('new-question').addEventListener('submit',e=>{
 e.preventDefault();
 const v=$('question').value.trim();
 if(!publicSafeText(v,12,220)){
  $('question-status').textContent='Use a public-safe question (12–220 characters). Leave out names, addresses, contact details, URLs and sensitive stories.';
  return;
 }
 try{
  pick(newOpportunity(v));$('question-status').textContent='This is a shareable question draft on your device, not a public post.';
  $('topic-detail').scrollIntoView({behavior:reduced()?'auto':'smooth'});
 }catch{$('question-status').textContent='That question needs simpler, non-identifying wording.';}
});
$('compose').addEventListener('click',()=>{
 $('draft-panel').hidden=false;$('draft').focus();
 notify('Choose an entry type. A concern, refusal or correction is welcome. Nothing is sent automatically.');
});
$('draft-form').addEventListener('submit',e=>{
 e.preventDefault();
 const type=$('kind').value, words=$('draft').value.trim();
 try{
  state.entry=composeContribution(state.topic,type,words);
  const receipt=$('local-preview');receipt.replaceChildren();
  receipt.append(make('strong','',KINDS.find(k=>k.id===type).label),
   make('p','',state.entry.text),
   make('p','quiet','Suggested next move: '+state.entry.next),
   make('p','tag',state.entry.status+' · NOT VERIFIED · NOT PUBLIC'));
  $('local-result').hidden=false;
  notify('Your contribution is drafted locally. It has NOT been posted or sent to anybody.');
 }catch{notify('Please keep the contribution to 12–260 public-safe characters without contact details, URLs or private stories.');}
});
function fullInvitation(){
 return invitationText(state.topic,state.entry)+'\n\nOpen question: '+opportunityLink(location.href,state.topic);
}
async function copyText(value){
 if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(value);return;}
 const box=make('textarea');box.value=value;box.style.position='fixed';box.style.left='-9999px';
 document.body.append(box);try{box.select();if(!document.execCommand('copy'))throw Error('COPY_BLOCKED');}
 finally{box.remove();}
}
async function shareText(){
 const value=fullInvitation();
 try{
  if(typeof navigator.share==='function'){
   await navigator.share({title:state.topic.title,text:value});
   notify('Share sheet closed. This page cannot verify whether anyone received the invitation.');
  }else{await copyText(value);notify('Invitation copied. You choose whom to send it to.');}
 }catch(e){notify(e?.name==='AbortError'?'Share canceled. No recipient was enrolled.':'Your device blocked sharing. Try Copy.');}
}
$('share').addEventListener('click',shareText);
$('copy').addEventListener('click',async()=>{
 try{await copyText(fullInvitation());notify('Copied the public-safe thread invitation and your optional draft. You decide whether to share.');}
 catch{notify('Copy unavailable. Select the text from the printable card instead.');}
});
$('private').addEventListener('click',async()=>{
 // The existing contact desk accepts only a fixed role ID and explicit consent.
 // Draft text is copied, not passed in a URL or transmitted as a hidden submission.
 try{
  const excerpt=state.entry?
   'BOARD DRAFT · '+state.topic.title+'\n'+state.entry.kind.toUpperCase()+': '+state.entry.text:
   'BOARD QUESTION · '+state.topic.title+'\n'+state.topic.question;
  await copyText(excerpt);
  notify('Copied your words for a PRIVATE note. The contact desk will open in a new tab; paste and edit them, then decide whether to submit.');
  window.open('/contact/','_blank','noopener,noreferrer');
 }catch{notify('Copy was blocked. Open /contact/ yourself and describe the question only if you wish.');}
});
$('download').addEventListener('click',()=>{
 if(!state.entry){notify('Draft an entry first; no return has been recorded.');return;}
 const doc={...state.entry,notice:'Local self-report only. Not independently verified. Not submitted or published.',
  threadUrl:opportunityLink(location.href,state.topic)};
 const blob=new Blob([JSON.stringify(doc,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=make('a');
 a.href=url;a.download='abundent-board-local-draft.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 notify('Saved a private local draft. Downloading does not publish, enroll, or verify an outcome.');
});
$('print').addEventListener('click',()=>{
 $('print-detail').textContent=fullInvitation();window.print();
});
$('preview-path').addEventListener('click',()=>{
 const step=mapHandoff(state.topic,state.entry?.kind||'question');
 $('path').replaceChildren(
  make('strong','','THE NEXT SEVEN DAYS'),
  make('p','',state.topic.first),
  make('p','','Next for this kind of contribution: '+(state.entry?.next||'Invite someone to improve the question.')),
  make('p','quiet','Open role: '+step.role+' · Human permission required · No work or outcome verified'));
 $('path').hidden=false;
});
addEventListener('hashchange',()=>{
 const topic=readOpportunityLink(location.hash);if(topic)pick(topic,false);
});
paintList();paintTopic();
