import {makeOpportunity,readOpportunity,opportunityLink} from './model.mjs';
import {prepareHandoff,verifyHandoff} from './handoff.mjs';
const $=id=>document.getElementById(id);
let active=null;
const display=card=>{
  active=card;
  $('handoff-reviewed').checked=false;
  $('handoff-status').textContent='This is a local draft for separate review. No other system receives it.';
  $('blank-card').hidden=true;$('public-card').hidden=false;
  for(const key of ['need','offer','try'])$('card-'+key).textContent=card[key];
  $('share-link').value=opportunityLink(card,window.location.href);
  $('copy-status').textContent='A public proposal only. No invitation or introduction has been sent.';
};
$('weave-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!$('weave-form').reportValidity())return;
  try {
    const card=makeOpportunity(Object.fromEntries(['need','offer','try'].map(k=>[k,$(k).value])));
    display(card);
    $('form-status').textContent='Public card ready. You choose if and with whom to share.';
    $('copy-status').textContent='This link contains exactly the three visible opportunity fields. Private notes are excluded.';
    $('public-card').scrollIntoView({behavior:'smooth',block:'nearest'});
  } catch(error){
    $('form-status').textContent=error.message==='CONTACT_DETAILS'?'Contact details or a URL were detected. Please use only general roles and opportunities.':'Please use 4–140 characters for need and offer, and 4–180 for the next step. Avoid private details.';
  }
});
$('copy').addEventListener('click',async()=>{
  const input=$('share-link');
  try{
    if(!navigator.clipboard?.writeText)throw Error('COPY_UNAVAILABLE');
    await navigator.clipboard.writeText(input.value);
    $('copy-status').textContent='Link copied. Share deliberately; no one was automatically contacted.';
  } catch {
    input.focus();input.select();
    $('copy-status').textContent='Link selected. Copy it with your browser or keyboard.';
  }
});
$('print').addEventListener('click',()=>window.print());
function saveJSON(packet,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)+'\\n'],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);
 a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('download-handoff').addEventListener('click',async()=>{
 const status=$('handoff-status');
 if(!active){status.textContent='Open an opportunity card first.';return;}
 if(!$('handoff-reviewed').checked){status.textContent='Please review the public wording and check the local-review box first.';return;}
 try {
   const packet=await prepareHandoff({opportunity:active,question:$('handoff-question').value,reviewed:true});
   await verifyHandoff(packet);
   saveJSON(packet,'abundent-weaving-handoff-002.json');
   status.textContent='Downloaded one unsigned, unpublished draft. No project was contacted and no human permission was verified.';
 }catch(error){
   status.textContent='Could not prepare draft: use a 14–140 character question with no contact information, addresses or sensitive details.';
 }
});

$('save').addEventListener('click',()=>{
  const status=$('outcome').selectedOptions[0].textContent;
  const lines=[
    'ABUNDENT / WEAVING GARDEN / PRIVATE SELF-REPORT',
    'Created: '+new Date().toISOString(),
    'Status (selected by note writer): '+status,
    ...(active?['','PUBLIC PROPOSAL','Need: '+active.need,'Offer: '+active.offer,'Try: '+active.try]:[]),
    '','WHAT I OBSERVED', $('observed').value.trim()||'(nothing entered)',
    '','NEXT THOUGHT', $('next').value.trim()||'(nothing entered)',
    '','Self-report only. No other person has confirmed these notes or authorized publication.',
    'These notes were generated locally and were not sent to Abundent.'
  ];
  const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='weaving-garden-private-notes.txt';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try{
  const card=readOpportunity(window.location.hash);
  if(card){
    display(card);
    for(const key of ['need','offer','try'])$(key).value=card[key];
    $('form-status').textContent='This public card arrived in a link. It does not show consent, attendance or a real introduction.';
  }
}catch{
  $('form-status').textContent='The incoming card is damaged or contains prohibited content. No card was accepted. You may prepare a new one.';
}
