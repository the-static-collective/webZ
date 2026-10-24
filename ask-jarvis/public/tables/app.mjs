import {makeInvite,readInvite,inviteLink,nextFields,suggestDay} from './model.mjs';

const $ = selector => document.querySelector(selector);
const keys=['title','purpose','date','time','venue','host'];
const form=$('#open-form');
let current=null, prior=null;

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
  message('Your link is ready. Sharing it is your choice; no one has been contacted.');
}

form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  let made;
  try{made=makeInvite(formFields(),prior);}
  catch(err){window.alert('Please add a table name, a purpose, and a valid date and time.');return;}
  const link=inviteLink(made,window.location.href);
  // Only the invitation card goes into the hash; nothing is submitted.
  window.history.replaceState(null,'',link);
  prior=null;
  $('#form-heading').textContent='OPEN A TABLE.';
  $('#parent-note').hidden=true;
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
$('#pass-table').addEventListener('click',()=>{
  if(!current)return;
  prior=current;
  fill(nextFields(current));
  $('#form-heading').textContent='PASS THE TABLE.';
  const note=$('#parent-note');
  note.hidden=false;
  note.textContent='A new gathering after table '+current.id+'. The next date is suggested seven days later, but you can change anything. This is a new invitation, not a confirmed continuation.';
  $('#open').scrollIntoView({behavior:'smooth'});
  $('#title').focus({preventScroll:true});
});
$('#save-witness').addEventListener('click',()=>{
  const title=current?current.title:'An unlinked gathering';
  const rows=[
    'THE SEVENTH TABLE — PERSONAL DRAFT',
    'Meeting: '+title,
    'Date: '+(current?.date||'not recorded'),
    'Table label: '+(current?.id||'none'),
    '',
    'WHAT ACTUALLY HAPPENED',
    $('#happened').value.trim()||'(none recorded)',
    '',
    'WHAT MIGHT HAPPEN NEXT',
    $('#unfinished').value.trim()||'(none recorded)',
    '',
    'Written by one participant. No other attendee has approved or verified this draft.',
    'Private local text, explicitly exported. Not sent to Abundent.'
  ];
  const url=URL.createObjectURL(new Blob([rows.join('\n')+'\n'],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=url;link.download='seventh-table-my-notes.txt';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#date').value=suggestDay();

try{
  const arrival=readInvite(window.location.hash);
  if(arrival) {
    show(arrival);
    setText('#form-heading','OPEN YOUR OWN TABLE.');
    message('You arrived by invitation. It is not an RSVP; the sender has not been notified.');
  }
}catch{
  const p=$('#empty-card').querySelector('p');
  p.textContent='This invitation link is damaged or unsupported. No information was accepted. Ask the sender for a fresh link, or open a new table.';
}
