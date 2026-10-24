import {makeInvite,readInvite,inviteLink,nextFields,suggestDay} from './model.mjs';
import {readTableSeed,draftFromQuestion} from '../table-bridge.mjs';
import {prepareNextTable,privateWitnessText,witnessFingerprint} from './afterglow.mjs';

const $ = selector => document.querySelector(selector);
const keys=['title','purpose','date','time','venue','host'];
const form=$('#open-form');
let current=null, prior=null, witnessSavedSnapshot=null;
const witnessSnapshot=()=>witnessFingerprint(current,$('#happened').value,$('#unfinished').value);
const hasPrivateNotes=()=>Boolean($('#happened').value.trim()||$('#unfinished').value.trim());

const setText=(id,value)=>{$(id).textContent=value;};
const formFields=()=>Object.fromEntries(keys.map(k=>[k,$('#'+k).value]));
const fill=values=>{for(const key of keys)$('#'+key).value=values[key]||'';};
const message=value=>setText('#copy-status',value);
const humanDate=day=>new Date(day+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});

function show(card) {
  current=card;
  $('#empty-card').hidden=true;
  $('#card').hidden=false;
  setText('#card-id',card.id);
  setText('#card-title',card.title);
  setText('#card-purpose',card.purpose);
  setText('#card-when',humanDate(card.date)+(card.time?' · '+card.time:' · time to be arranged'));
  setText('#card-where',card.venue||'Ask the host for the meeting place');
  setText('#card-host',card.host||'A neighbor opening a chair');
  const trail=card.chain.join(' → ');
  const lineage=$('#lineage');
  lineage.hidden=!trail;
  lineage.textContent=trail?'This invitation follows these previous table labels: '+trail+' → '+card.id+'. Labels are not proof of attendance or agreement.':'';
  $('#share-link').value=inviteLink(card,window.location.href);
  $('#pass-table').disabled=false;
  setText('#next-table-status','Table '+card.id+' is an invitation only. After a real gathering, keep your own notes below—or choose another table.');
  message('Your link is ready. Sharing it is your choice; no one has been contacted.');
}

form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  if(current && hasPrivateNotes() && witnessSnapshot()!==witnessSavedSnapshot) {
    const discard=window.confirm('Your personal afterglow notes have not been downloaded since your latest edits. Creating a new invitation clears those local notes. Cancel to download first, or OK to discard your unsaved notes.');
    if(!discard) {
      setText('#next-table-status','Not created. Your private notes remain here; download them before continuing.');
      $('#witness').scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
  }
  let made;
  try{made=makeInvite(formFields(),prior);}
  catch(err){window.alert('Please add a table name, a purpose, and a valid date and time.');return;}
  const link=inviteLink(made,window.location.href);
  // Only the invitation card goes into the hash; nothing is submitted.
  window.history.replaceState(null,'',link);
  prior=null;
  $('#form-heading').textContent='OPEN A TABLE.';
  $('#parent-note').hidden=true;
  // A newly created invite starts a distinct private record. No prior person's
  // notes or approval should silently remain attached to this new table.
  $('#happened').value='';
  $('#unfinished').value='';
  $('#relay-question').value='';
  $('#relay-approved').checked=false;
  witnessSavedSnapshot=null;
  setText('#witness-save-status','New invitation, new private record. Nothing has been uploaded.');
  setText('#relay-status','No question is approved for sharing yet.');
  show(made);
  $('#invitation').scrollIntoView({behavior:'smooth',block:'start'});
});

$('#copy-link').addEventListener('click',async()=>{
  const input=$('#share-link');
  try{
    if(!navigator.clipboard?.writeText)throw Error('NO_CLIPBOARD');
    await navigator.clipboard.writeText(input.value);
    message('Copied. Send it only to the people you want to invite.');
  }catch{
    input.focus();input.select();
    message('The link is selected. Use Copy from your browser or keyboard.');
  }
});

$('#print-invite').addEventListener('click',()=>window.print());
$('#relay-question').addEventListener('input',()=>{
  $('#relay-approved').checked=false;
  setText('#relay-status','Text changed. If you want to carry this exact question into a public invitation, approve it again.');
});
$('#relay-approved').addEventListener('change',()=>{
  setText('#relay-status',$('#relay-approved').checked
    ? 'Approved for an invitation draft, not sent. You may still change your mind.'
    : 'No public question is approved for sharing.');
});
for(const selector of ['#happened','#unfinished']) {
  $(selector).addEventListener('input',()=>{
    setText('#witness-save-status','Personal draft changed. Download your notes before closing the tab or starting another table.');
  });
}
$('#pass-table').addEventListener('click',()=>{
  if(!current)return;
  let next;
  try {
    next=prepareNextTable(current,$('#relay-question').value,$('#relay-approved').checked);
  }catch(err) {
    const detail={
      CONFIRM_PUBLIC_SHARING:'The public question is not approved. Check the box to include it, or clear the question to pass with a general invitation.',
      ENTER_PUBLIC_QUESTION:'Write the public question you wish to share, or uncheck the box and continue without one.',
      PUBLIC_QUESTION_UNSAFE:'A public question must be 8–270 characters on one line, without phone numbers, email addresses or control characters. Private notes never belong here.'
    };
    setText('#relay-status',detail[err.message]||'The question was not carried. Edit it before continuing.');
    $('#relay-question').focus();
    return;
  }
  prior=current;
  fill(next.fields);
  $('#form-heading').textContent='PASS THE TABLE.';
  const note=$('#parent-note');
  note.hidden=false;
  note.textContent='PROPOSED NEXT TABLE after '+current.id+': '+(next.usedPublicQuestion?'Only your separately approved public question was copied.':'A general question was suggested; neither private note was copied.')+' The date is suggested seven days later, with host and venue blank. You can change anything. No invitation has been created or sent.';
  setText('#next-table-status','Draft prepared. You still must review the next invitation and press MAKE MY INVITATION. Nothing has been delivered to anyone.');
  setText('#relay-status',next.usedPublicQuestion?'Only your approved public question entered the editable invitation draft. The private notes stayed here.':'No private notes or public question were copied into the new invitation draft.');
  $('#open').scrollIntoView({behavior:'smooth',block:'start'});
  $('#title').focus({preventScroll:true});
});
$('#save-witness').addEventListener('click',()=>{
  const body=privateWitnessText(current,$('#happened').value,$('#unfinished').value);
  const url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=url;link.download='seventh-table-my-afterglow.txt';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  witnessSavedSnapshot=witnessSnapshot();
  setText('#witness-save-status','Download requested. Check that your file is saved before closing this tab. No notes were sent to Abundent.');
});
$('#date').value=suggestDay();

try{
  const arrival=readInvite(window.location.hash);
  if(arrival) {
    show(arrival);
    setText('#form-heading','OPEN YOUR OWN TABLE.');
    message('You arrived by invitation. It is not an RSVP; the sender has not been notified.');
  } else {
    const question=readTableSeed(window.location.hash);
    if(question) {
      const draft=draftFromQuestion(question);
      fill({title:draft.title,purpose:draft.purpose,date:$('#date').value});
      const note=$('#jarvis-seed');
      note.hidden=false;
      setText('#seed-question',question);
      setText('#seed-disclosure',draft.shortened
        ? 'This original question is longer than the 270-character invitation purpose. The draft below is shortened and marked with an ellipsis. Please revise it before sharing.'
        : 'The question has been prefilled as an editable purpose. Your original words are displayed above for comparison.');
      setText('#form-heading','TURN A QUESTION INTO AN INVITATION.');
      // Remove the transported question from the address bar. Nothing is stored remotely.
      window.history.replaceState(null,'',window.location.pathname+window.location.search);
    } else if(window.location.hash.startsWith('#from=jarvis')) {
      const note=$('#jarvis-seed');
      note.hidden=false;
      setText('#seed-question','No question accepted.');
      setText('#seed-disclosure','The handoff was damaged, duplicated, or contained contact information. Nothing was imported.');
      window.history.replaceState(null,'',window.location.pathname+window.location.search);
    }
  }
}catch{
  const p=$('#empty-card').querySelector('p');
  p.textContent='This invitation link is damaged or unsupported. No information was accepted. Ask the sender for a fresh link, or open a new table.';
}
