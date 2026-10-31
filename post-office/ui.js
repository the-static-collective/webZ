// Browser-only operator UI: no token, code or email body goes into localStorage, URLs, or analytics.
const api='/api/post-office/panel';
const byId=id=>document.getElementById(id);
const status=byId('status');
const request=byId('request'),verify=byId('verify'),code=byId('code');
const lock=byId('lock'),desk=byId('desk'),queue=byId('queue'),logout=byId('logout');
let csrf='',sending=false;
function announce(msg){status.textContent=msg}
async function post(body,extra={}){
  const res=await fetch(api,{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json',...extra},
    cache:'no-store',body:JSON.stringify(body)});
  let payload;try{payload=await res.json()}catch{throw Error('No usable response from Post Office.')}
  return {ok:res.ok,status:res.status,...payload};
}
async function refresh(){
  const res=await fetch(api,{credentials:'same-origin',cache:'no-store'});
  if(res.status===401){csrf='';lock.hidden=false;desk.hidden=true;queue.replaceChildren();draftRows=[];selected=null;return}
  if(!res.ok){announce('HOLD: operator desk unavailable ('+res.status+').');return}
  const data=await res.json();csrf=data.csrf;
  if(data.state!=='AUTHORIZED'||!Array.isArray(data.messages)){announce('HOLD: unexpected desk response.');return}
  lock.hidden=true;desk.hidden=false;queue.replaceChildren();
  for(const message of data.messages){
    const card=document.createElement('article');card.className='letter';
    const head=document.createElement('h3');head.textContent='Reviewed letter · '+message.messageId;card.append(head);
    const dl=document.createElement('dl');
    for(const [label,value] of [['From',message.from],['To',message.to],['Subject',message.subject]]){
      const dt=document.createElement('dt');dt.textContent=label;
      const dd=document.createElement('dd');dd.textContent=value;dl.append(dt,dd);
    }
    card.append(dl);
    const copy=document.createElement('div');copy.className='copy';copy.textContent=message.text;card.append(copy);
    const check=document.createElement('label');check.className='confirm';
    const box=document.createElement('input');box.type='checkbox';box.autocomplete='off';
    const txt=document.createElement('span');
    txt.textContent='I have reviewed the exact recipient and letter. I authorize this one external send.';
    check.append(box,txt);card.append(check);
    const sendBtn=document.createElement('button');sendBtn.type='button';sendBtn.className='send';
    sendBtn.textContent='Send this approved letter';sendBtn.disabled=true;
    box.addEventListener('change',()=>{sendBtn.disabled=!box.checked||sending});
    sendBtn.addEventListener('click',async()=>{
      if(!box.checked||sending)return;
      sending=true;sendBtn.disabled=true;box.disabled=true;announce('Sending request to provider…');
      try{
        const result=await post({action:'send',confirm:'SEND',messageId:message.messageId},{'X-Post-Office-CSRF':csrf});
        if(result.state==='PROVIDER_ACCEPTED'){
          announce('PROVIDER ACCEPTED · Receipt '+result.providerId+'. Delivery NOT confirmed. Do not retry without checking provider history.');
          sendBtn.textContent='Provider accepted — inspect receipt';
        }else{
          announce('HOLD · '+(result.reason||'Unconfirmed send')+'. Inspect provider history before any retry.');
          sendBtn.textContent='HOLD — inspect provider history';
        }
      }catch{announce('HOLD · Network result unknown. Inspect provider history before retry.');sendBtn.textContent='HOLD — check provider';}
      // Deliberately leave button locked for the current tab after any attempted dispatch.
      sending=false;
    });
    card.append(sendBtn);queue.append(card);
  }
  if(await loadSavedDrafts())announce('Authorized. Saved drafts are ready to review. Nothing was sent.');
}
request.addEventListener('click',async()=>{
  request.disabled=true;announce('Requesting private owner access code…');
  try{
    const r=await post({action:'request-code'});
    announce(r.state==='CODE_PROVIDER_ACCEPTED'
      ? 'Code accepted by mail provider (not confirmed delivered). Check the existing owner inbox.'
      : 'HOLD · '+(r.reason||'Code request was not accepted')+'.');
  }catch{announce('HOLD · Unable to request code.')}
  request.disabled=false;
});
verify.addEventListener('click',async()=>{
  const pin=code.value.trim();
  if(!/^[0-9]{12}$/.test(pin)){announce('Enter the 12-digit code from your owner inbox.');return}
  verify.disabled=true;
  try{
    const r=await post({action:'verify-code',code:pin});code.value='';
    if(r.state==='SIGNED_IN'){await refresh()}else{announce('HOLD · '+(r.reason||'Unable to authenticate'))}
  }catch{announce('HOLD · Unable to authenticate.');code.value=''}
  verify.disabled=false;
});
logout.addEventListener('click',async()=>{
  logout.disabled=true;
  try{
    const r=await post({action:'logout'},{'X-Post-Office-CSRF':csrf});
    if(r.state==='SIGNED_OUT'){csrf='';queue.replaceChildren();await refresh();announce('Signed out.')}
    else announce('HOLD · Unable to sign out. Close the browser tab.');
  }catch{announce('HOLD · Sign-out network error. Close the tab.')}
  logout.disabled=false;
});
refresh().catch(()=>announce('HOLD · Unable to reach Post Office.'));


/* Editable and persistent letters. Stored in private database through authenticated server only. */
const draftList=byId('draft-list'),draftForm=byId('draft-editor'),draftEmpty=byId('draft-empty');
const draftFields={recipient:byId('draft-to'),subject:byId('draft-subject'),body:byId('draft-body'),
 note:byId('draft-note'),status:byId('draft-state')};
let draftRows=[],selected=null,dirty=false,draftWorking=false;
function draftText(){
 return {id:selected.id,recipient:draftFields.recipient.value.trim(),
  subject:draftFields.subject.value.trim(),body:draftFields.body.value.trim(),
  note:draftFields.note.value.trim(),status:draftFields.status.value};
}
function warnChanges(){return !dirty||confirm('Leave this letter without saving your latest edits?')}
function displayDraft(d){
 selected=d;dirty=false;draftForm.hidden=!d;draftEmpty.hidden=!!d;
 if(!d)return;
 for(const [field,input] of Object.entries(draftFields))input.value=d[field]|| (field==='status'?'DRAFT':'');
 byId('draft-when').textContent=d.revision
   ? 'Saved revision '+d.revision+' · '+new Date(d.updated_at).toLocaleString()
   : 'New draft — not saved yet';
 drawDraftList();
}
function drawDraftList(){
 draftList.replaceChildren();
 const term=byId('draft-filter').value.trim().toLowerCase();
 for(const d of draftRows){
   if(term&&![d.recipient,d.subject,d.note,d.body].join(' ').toLowerCase().includes(term))continue;
   const b=document.createElement('button');b.type='button';b.className='draft-choice';
   b.setAttribute('aria-current',String(selected?.id===d.id));
   const head=document.createElement('strong');head.textContent=d.subject;
   const meta=document.createElement('small');meta.textContent=(d.recipient||'Recipient not chosen')+' · '+d.status;
   b.append(head,meta);
   b.addEventListener('click',()=>{if(warnChanges())displayDraft(d)});
   draftList.append(b);
 }
 if(!draftList.children.length){const p=document.createElement('p');p.className='fine';p.textContent='No saved letters match.';draftList.append(p)}
}
async function loadSavedDrafts(){
 if(!csrf)return false;
 try{
   const r=await post({action:'draft-list'},{'X-Post-Office-CSRF':csrf});
   if(!r.ok||r.state!=='OK'||!Array.isArray(r.drafts)){
     announce('HOLD · Private draft storage unavailable: '+(r.reason||r.status)+'.');
     return false;
   }
   draftRows=r.drafts;
   const pick=draftRows.find(d=>d.id===selected?.id)||draftRows[0]||null;
   displayDraft(pick);drawDraftList();
   return true;
 }catch{announce('HOLD · Private draft storage is unavailable. No drafts were sent.');return false}
}
function validAddress(line){
 return !!line&&line.split(',').every(addr=>/^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test(addr.trim()));
}
async function saveDraft(){
 if(!selected||draftWorking)return false;
 const draft=draftText();
 if(!draft.subject||!draft.body){announce('Add a subject and message before saving.');return false}
 if(draft.recipient&&!validAddress(draft.recipient)){announce('Please review the email address.');return false}
 draftWorking=true;byId('draft-save').disabled=true;
 try{
   const r=await post({action:'draft-save',draft,revision:selected.revision??null},{'X-Post-Office-CSRF':csrf});
   if(r.state!=='OK'||!r.draft){
     announce('HOLD · '+(r.reason||'Draft was not saved')+'. Refresh before editing if there is a conflict.');
     return false;
   }
   const i=draftRows.findIndex(x=>x.id===r.draft.id);
   if(i<0)draftRows.unshift(r.draft);else draftRows[i]=r.draft;
   displayDraft(r.draft);
   announce('Saved privately · '+r.draft.subject+'. Not sent.');
   return true;
 }catch{announce('HOLD · Save failed. Your unsaved text remains in the editor.');return false}
 finally{draftWorking=false;byId('draft-save').disabled=false}
}
for(const input of Object.values(draftFields))input.addEventListener('input',()=>{dirty=true;byId('draft-when').textContent='Unsaved changes'});
byId('draft-filter').addEventListener('input',drawDraftList);
byId('draft-reload').addEventListener('click',async()=>{if(warnChanges())await loadSavedDrafts()});
byId('draft-new').addEventListener('click',()=>{
 if(!warnChanges())return;
 const id='letter-'+crypto.randomUUID();
 displayDraft({id,recipient:'',subject:'',body:'',note:'',status:'DRAFT',revision:null});
 draftFields.subject.focus();
});
draftForm.addEventListener('submit',async event=>{event.preventDefault();await saveDraft()});
byId('draft-copy').addEventListener('click',async()=>{
 if(!selected)return;
 const d=draftText();
 try{
   await navigator.clipboard.writeText('To: '+(d.recipient||'[recipient to review]')+'\nSubject: '+d.subject+'\n\n'+d.body);
   announce('Copied current draft. No email sent.');
 }catch{announce('Clipboard blocked. Select and copy the draft text manually.')}
});
byId('draft-email').addEventListener('click',async()=>{
 if(!selected)return;
 const d=draftText();
 if(!validAddress(d.recipient)){announce('Enter and verify a recipient before opening the email app.');return}
 if(d.body.length>7000){announce('Long message: use Copy to transfer to your email app without truncation.');return}
 if(dirty||!selected.revision){if(!await saveDraft())return}
 const params=new URLSearchParams({subject:d.subject,body:d.body});
 announce('Preparing mail app · verify the From account and press Send yourself.');
 window.location.href='mailto:'+d.recipient.split(',').map(x=>x.trim()).join(',')+'?'+params.toString();
});
byId('draft-remove').addEventListener('click',async()=>{
 if(!selected||!confirm('Delete this saved letter? This cannot undo an external email send.'))return;
 if(selected.revision===null){displayDraft(draftRows[0]||null);return}
 const id=selected.id,rev=selected.revision;
 try{
   const r=await post({action:'draft-delete',id,revision:rev},{'X-Post-Office-CSRF':csrf});
   if(r.state==='OK'){draftRows=draftRows.filter(d=>d.id!==id);displayDraft(draftRows[0]||null);announce('Deleted saved draft. No email sent.')}
   else announce('HOLD · '+(r.reason||'Delete failed')+'. Refresh if this changed elsewhere.');
 }catch{announce('HOLD · Unable to delete; no change confirmed.')}
});
