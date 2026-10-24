import {makeInvite,readInvite,inviteLink,nextFields,suggestDay,dayAfter} from './model.mjs';
import {readTableSeed,draftFromQuestion} from '../table-bridge.mjs';
import {prepareNextTable,privateWitnessText,witnessFingerprint,publicRelay} from './afterglow.mjs';
import {networkRequest,readNetworkLink,networkLink,publicCreatePayload,publicNotePayload,liveNetworkOrigin} from './network.mjs';

const $ = selector => document.querySelector(selector);
const keys=['title','purpose','date','time','venue','host'];
const form=$('#open-form');
let current=null, prior=null, witnessSavedSnapshot=null;
let ownLocalInvite=false, network=null, networkBusy=false, lastWithdraw=null, pendingNetworkParent=null;
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
  $('#network-publish').disabled=!ownLocalInvite||!liveNetworkOrigin(window.location.href);
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
  if(prior && network && network.table?.title===current?.title) pendingNetworkParent={id:network.id,token:network.token};
  const link=inviteLink(made,window.location.href);
  // Only the invitation card goes into the hash; nothing is submitted.
  window.history.replaceState(null,'',link);
  prior=null;
  ownLocalInvite=true;
  network=null;lastWithdraw=null;
  $('#network-room').hidden=true;
  $('#network-consent').checked=false;
  setText('#network-publish-status','Your new invitation is local. Check the separate network consent box if you also want to submit these fields to Abundent. Nothing has been uploaded.');
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


/* NETWORK DESK 003 — separate, permission-scoped persistent ledger.
   The private afterglow is intentionally unreachable from this transport. */
const $netStatus=(id,value)=>setText(id,value);
const netError=(error)=>({
 TOO_MANY_REQUESTS:'This table has reached a submission limit. Please try another day.',
 RATE_LIMIT_UNAVAILABLE:'The network limit service is unavailable. Nothing was confirmed.',
 INVITATION_NOT_FOUND:'This table or credential was not found. Ask for a fresh link.',
 TABLE_IS_CLOSED:'The host has closed this table.',
 COULD_NOT_CREATE_TABLE:'The network did not confirm creation; your local invitation is unchanged.',
 COULD_NOT_POST_NOTE:'The network did not confirm this contribution.',
 STORAGE_UNAVAILABLE:'The network is temporarily unavailable.'
})[error?.message]||'The network could not confirm this action. Your private notes remain in this browser.';
const localFile=(name,body)=>{
 const object=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=object;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(object),1000);
};
const withNetwork=async(task)=>{
 if(networkBusy)return;
 networkBusy=true;
 try{await task();}finally{networkBusy=false;}
};
function renderNetwork() {
 if(!network)return;
 $('#network-room').hidden=false;
 $('#network-table-title').textContent=network.table.title;
 $('#network-table-purpose').textContent=network.table.purpose;
 $('#network-table-details').textContent=
   'Scheduled: '+network.table.date+(network.table.time?' · '+network.table.time:'')+
   ' · Meeting instructions: '+(network.table.venue||'Ask the host')+
   ' · This is an invitation, not proof the gathering occurred.';
 const guestKey=network.role==='host'?network.guestKey:network.token;
 $('#network-guest-link').value=guestKey?networkLink(network.id,guestKey):'';
 const hostTools=$('#network-host-tools');
 hostTools.hidden=network.role!=='host';
 $('#network-host-link').value=network.role==='host'?networkLink(network.id,network.token):'';
 $netStatus('#network-link-status',network.role==='host'
   ? 'You hold the private host key. Save the host receipt separately before leaving. Guest links can be passed voluntarily.'
   : 'Guest access: you can submit a note for human review. You cannot see private pending submissions or manage this table.');
 const wrap=$('#network-notes');wrap.replaceChildren();
 for(const note of network.notes||[]) {
   const item=document.createElement('article');item.className='network-note';
   const label=document.createElement('strong');
   label.textContent=note.kind.toUpperCase()+' · '+note.status+(note.nickname?' · '+note.nickname:'');
   const body=document.createElement('p');body.textContent=note.body;
   const small=document.createElement('small');small.textContent='One submitted account, not verified attendance, authority or agreement.';
   item.append(label,body,small);
   if(network.role==='host'){
     const actions=document.createElement('div');actions.className='network-note-actions';
     for(const decision of ['VISIBLE','HIDDEN']){
       const button=document.createElement('button');button.type='button';button.className='button soft';
       button.textContent=decision==='VISIBLE'?'APPROVE / SHOW':'HIDE';
       button.disabled=note.status===decision;
       button.addEventListener('click',()=>void withNetwork(async()=>{
         try{
           await networkRequest('moderate',{id:network.id,token:network.token,noteId:note.id,decision});
           await refreshNetwork();
           $netStatus('#network-note-status','The contribution is now '+decision.toLowerCase()+'. Host moderation is not evidence that an event took place.');
         }catch(error){$netStatus('#network-note-status',netError(error));}
       }));
       actions.append(button);
     }
     item.append(actions);
   }
   wrap.append(item);
 }
 if(!network.notes?.length){
   const p=document.createElement('p');
   p.textContent='No submissions visible to you yet. A link alone does not mean anybody attended.';
   wrap.append(p);
 }
}
async function refreshNetwork(){
 if(!network)return;
 const info=await networkRequest('read',{id:network.id,token:network.token});
 network={...network,...info,id:network.id,token:network.token,guestKey:info.guestKey||network.guestKey};
 renderNetwork();
}
$('#network-consent').addEventListener('change',()=>{
 $netStatus('#network-publish-status',$('#network-consent').checked
   ? 'Consent selected. Press OPEN THIS TABLE ON THE NETWORK to submit the invitation fields. No private notes are sent.'
   : 'Not submitted. No network record will be created without your separate action.');
});
$('#network-publish').addEventListener('click',()=>void withNetwork(async()=>{
 if(!ownLocalInvite||!current||!$('#network-consent').checked) {
   $netStatus('#network-publish-status','Make your own local invitation and explicitly approve its submission first.');
   return;
 }
 if(!liveNetworkOrigin(window.location.href)) {
   $netStatus('#network-publish-status','Network posting is available on the live abundent.org domain, not this protected preview.');
   return;
 }
 if(!window.confirm('Submit ONLY the invitation title, purpose, date, time, venue and host label to Abundent? Your private notes are NOT included. Anyone with the guest link can see the table details and propose notes.'))return;
 try{
   const parentFields=pendingNetworkParent?{parentId:pendingNetworkParent.id,parentToken:pendingNetworkParent.token}:{};
   const created=await networkRequest('create',{...publicCreatePayload(current),...parentFields});
   if(!created?.table?.id||!created.hostKey||!created.guestKey)throw Error('INCOMPLETE_CREATE');
   network={id:created.table.id,token:created.hostKey,guestKey:created.guestKey,role:'host',table:created.table,notes:[]};
   pendingNetworkParent=null;
   $('#network-consent').checked=false;
   $('#network-publish').disabled=true;
   $netStatus('#network-publish-status','Network table created. Save your private HOST KEY RECEIPT below before leaving. This is not an RSVP or automatic public directory listing.');
   renderNetwork();
   $('#network-room').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(error){$netStatus('#network-publish-status',netError(error));}
}));
$('#network-pass').addEventListener('click',()=>{
 if(!network)return;
 const table=network.table;
 let suggestion;
 try {
   suggestion={title:'The next table',purpose:'What should we carry forward from '+table.title+'?',
     date:dayAfter(table.date,7),time:table.time||'',venue:'',host:''};
 }catch{
   $netStatus('#network-pass-status','This table date is not valid for a seven-day suggestion; open a fresh table instead.');
   return;
 }
 if(hasPrivateNotes() && witnessSnapshot()!==witnessSavedSnapshot){
   const go=window.confirm('You have private afterglow notes that were not downloaded since your last edit. They will stay in this tab until you create a new invitation, which will clear them. Continue drafting?');
   if(!go)return;
 }
 pendingNetworkParent={id:network.id,token:network.token};
 prior=null;
 fill(suggestion);
 setText('#form-heading','A NEW INDEPENDENT TABLE.');
 const note=$('#parent-note');
 note.hidden=false;
 note.textContent='An OPTIONAL next gathering from network table '+network.id+'. When you later opt in to the network again, the new record may point back to this invitation as a reference. This does not prove either gathering occurred or carry any private notes.';
 $netStatus('#network-pass-status','Editable next-table draft prepared. No invitation or network record was created. Review it, create your invitation, and separately opt in to the network if desired.');
 $('#open').scrollIntoView({behavior:'smooth',block:'start'});
 $('#title').focus({preventScroll:true});
});
$('#network-copy-guest').addEventListener('click',async()=>{
 const field=$('#network-guest-link');
 try{await navigator.clipboard.writeText(field.value);$netStatus('#network-link-status','Guest link copied. Share only with the people you choose.');}
 catch{field.focus();field.select();$netStatus('#network-link-status','Select and copy the guest link manually.');}
});
$('#network-save-receipt').addEventListener('click',()=>{
 if(network?.role!=='host')return;
 localFile('abundent-my-private-table-host-key.txt',[
  'ABUNDENT SEVENTH TABLE / PRIVATE HOST KEY RECEIPT',
  'Do not share this file or host link. It grants moderation power.',
  'Lost keys cannot be recovered here; download and keep this yourself.',
  'Table ID: '+network.id,
  'Host link: '+networkLink(network.id,network.token),
  'Guest link: '+networkLink(network.id,network.guestKey),
  '',
  'No attendance or endorsement is established by this record.'
 ].join('\n')+'\n');
 $netStatus('#network-link-status','Private receipt download requested. Check the file before closing the page.');
});
for(const control of ['#network-kind','#network-nickname','#network-note']){
 $(control).addEventListener(control==='#network-kind'?'change':'input',()=>{
   $('#network-note-consent').checked=false;
   $netStatus('#network-note-status','The submission changed. Review and approve the exact public contribution again.');
 });
}
$('#network-prefill-question').addEventListener('click',()=>{
 try {
   const relay=publicRelay($('#relay-question').value,$('#relay-approved').checked);
   if(!relay)throw Error('NO_APPROVED_PUBLIC_QUESTION');
   $('#network-kind').value='question';
   $('#network-note').value=relay;
   $('#network-note-consent').checked=false;
   $netStatus('#network-note-status','Your previously approved question was copied into this editor ONLY. Nothing has been submitted to the network. Review the words and give separate network consent.');
   $('#network-note').focus();
 }catch{$netStatus('#network-note-status','Enter and approve one safe public question in the closing circle first. Private notes cannot be imported.');}
});
$('#network-note-submit').addEventListener('click',()=>void withNetwork(async()=>{
 if(!network||!$('#network-note-consent').checked){
   $netStatus('#network-note-status','Please approve this exact public contribution separately from any invitation consent.');
   return;
 }
 if(!liveNetworkOrigin(window.location.href)){
   $netStatus('#network-note-status','Network posting is enabled only on live abundent.org.');
   return;
 }
 try {
   const entry=publicNotePayload($('#network-kind').value,$('#network-nickname').value,$('#network-note').value);
   const result=await networkRequest('post',{id:network.id,token:network.token,...entry});
   if(!result.note?.id||!result.withdrawKey)throw Error('UNCONFIRMED_NOTE');
   lastWithdraw={id:network.id,token:network.token,noteId:result.note.id,withdrawKey:result.withdrawKey};
   $('#network-withdraw-id').value=result.note.id;
   $('#network-withdraw-key').value=result.withdrawKey;
   $('#network-save-withdraw').hidden=false;
   $('#network-note-consent').checked=false;
   $('#network-note').value='';
   $netStatus('#network-note-status',result.note.status==='PENDING'
     ? 'Received. Your note is PENDING HOST REVIEW and is not visible to other guests. Download its withdrawal receipt below.'
     : 'Received and visible to guests of this table. Download its withdrawal receipt below.');
   $netStatus('#network-withdraw-status','SAVE THE ONE-TIME RECEIPT. The secret withdrawal code will not be displayed again by the server.');
   await refreshNetwork();
 }catch(error){$netStatus('#network-note-status',netError(error));}
}));
$('#network-save-withdraw').addEventListener('click',()=>{
 if(!lastWithdraw)return;
 localFile('abundent-my-note-withdrawal.txt',[
  'ABUNDENT / PRIVATE NOTE WITHDRAWAL RECEIPT',
  'Keep this private. It authorizes removal of one specific note.',
  'Open your guest or host link, then enter the following in Withdraw My Contribution:',
  'Table link: '+networkLink(lastWithdraw.id,lastWithdraw.token),
  'Note ID: '+lastWithdraw.noteId,
  'Withdrawal code: '+lastWithdraw.withdrawKey,
  'Nothing has been withdrawn merely by saving this receipt.'
 ].join('\n')+'\n');
 $netStatus('#network-withdraw-status','Withdrawal receipt download requested. Check the file before leaving.');
});
$('#network-withdraw').addEventListener('click',()=>void withNetwork(async()=>{
 if(!network)return;
 const noteId=$('#network-withdraw-id').value.trim();
 const withdrawKey=$('#network-withdraw-key').value.trim();
 if(!/^[0-9a-f-]{36}$/i.test(noteId)||!/^[A-Za-z0-9_-]{43}$/.test(withdrawKey)) {
   $netStatus('#network-withdraw-status','Enter both values from your private withdrawal receipt.');
   return;
 }
 if(!window.confirm('Permanently remove this one contribution from the network table? This cannot be undone.'))return;
 try {
   await networkRequest('withdraw',{id:network.id,token:network.token,noteId,withdrawKey});
   $('#network-withdraw-id').value='';$('#network-withdraw-key').value='';
   $('#network-save-withdraw').hidden=true;lastWithdraw=null;
   $netStatus('#network-withdraw-status','Contribution removed from this network table. Your other private notes were not touched.');
   await refreshNetwork();
 }catch(error){$netStatus('#network-withdraw-status',netError(error));}
}));
$('#network-refresh').addEventListener('click',()=>void withNetwork(async()=>{
 try{await refreshNetwork();$netStatus('#network-link-status','Current visible notes refreshed.');}
 catch(error){$netStatus('#network-link-status',netError(error));}
}));
const arrivalNet=readNetworkLink(window.location.hash);
if(arrivalNet) {
 if(!liveNetworkOrigin(window.location.href)) {
   $netStatus('#network-publish-status','Network participation works on the live abundent.org origin. This preview cannot use its network service.');
 }else {
   void withNetwork(async()=>{
     try {
       const found=await networkRequest('read',{id:arrivalNet.id,token:arrivalNet.key});
       network={...found,id:arrivalNet.id,token:arrivalNet.key};
       renderNetwork();
       $netStatus('#network-publish-status','You entered with a network link. It does not enroll you or notify anyone. You may contribute voluntarily below.');
     }catch(error){$netStatus('#network-publish-status',netError(error));}
   });
 }
}
