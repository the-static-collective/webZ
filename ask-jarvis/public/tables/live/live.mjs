// The Living Chair: no accounts; every action is explicit and capability-scoped.
// Tokens live in URL fragments (never HTTP referrers), not localStorage.
const API='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/seventh-table';
const $=id=>document.querySelector(id);
const allowed=/^#table=([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/i;
const fields=['title','purpose','date','time','venue','host'];
let held=null, parent=null, guestKey=null, withdrawal=null, loading=false;
function say(message,isError=false){const e=$('#status');e.textContent=message;e.classList.toggle('error',isError);}
function cell(tag,text,cls=''){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function calendar(date){return new Date(date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
function weekLater(day){const at=new Date(day+'T12:00:00');at.setDate(at.getDate()+7);return [at.getFullYear(),String(at.getMonth()+1).padStart(2,'0'),String(at.getDate()).padStart(2,'0')].join('-');}
function link(id,token){return location.origin+'/tables/live/#table='+id+'.'+token;}
function values(){return Object.fromEntries(fields.map(k=>[k,$('#'+k).value]));}
function fill(row){for(const key of fields)$('#'+key).value=row[key]||'';}
async function call(body){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(API,{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
    let data;try{data=await response.json();}catch{throw Error('Server response could not be read.');}
    if(!response.ok)throw Error((data.error||'Request failed.').replaceAll('_',' '));
    return data;
  }finally{clearTimeout(timer);}
}
async function copy(text,output){
  try{await navigator.clipboard.writeText(text);$(output).textContent='Copied. Share only with the intended recipients.';}
  catch{const input=output==='#share-status'?'#guest-link':null;if(input){$(input).focus();$(input).select();}$(output).textContent='Clipboard blocked. Select the link and use your browser’s Copy command.';}
}
async function refresh(){
  if(!held)return;
  const {id,token}=held;
  try{const result=await call({action:'read',id,token});show(result);}
  catch(error){say('Unable to open this room: '+error.message,true);}
}
function show(result){
  const t=result.table;held={id:t.id,token:held.token,role:result.role,table:t};
  $('#start').hidden=true;$('#room').hidden=false;
  $('#room-title').textContent=t.title;$('#room-purpose').textContent=t.purpose;
  $('#role-label').textContent=result.role==='host'?'HOST KEY · PRIVATE':'GUEST INVITATION';
  $('#room-state').textContent=t.closed?'CLOSED':'OPEN';$('#room-state').classList.toggle('closed',t.closed);
  $('#room-date').textContent=calendar(t.date)+(t.time?' · '+t.time:' · time to be arranged');
  $('#room-venue').textContent=t.venue||'Ask the host separately for location';
  $('#room-host').textContent=t.host||'A neighbor';
  $('#parent-row').hidden=!t.parent;$('#room-parent').textContent=t.parent?'Prior table '+t.parent.slice(0,8)+' (unverified relation)':'';
  $('#host-tools').hidden=result.role!=='host';$('#host-manage').hidden=result.role!=='host';
  $('#note-form').hidden=t.closed;
  if(result.role==='host'&&guestKey){
    $('#guest-link').value=link(t.id,guestKey);
    $('#share').disabled=false;
  }else if(result.role==='guest'){
    $('#guest-link').value=link(t.id,held.token);
    $('#share').disabled=false;
  }else{
    $('#guest-link').value='';
    $('#guest-link').placeholder='Guest link not available on this device. Use the copy saved at creation.';
    $('#share').disabled=true;
  }
  render(result.notes,result.role);
  say((result.role==='host'?'Host view':'Guest view')+' · '+(result.notes.length)+' cards loaded. No identity claims.');
}
function render(notes,role){
  const box=$('#notes');box.replaceChildren();
  $('#note-count').textContent='('+notes.length+')';
  if(!notes.length){box.append(cell('p','No published cards yet. Bring one question or offer.','fine'));return;}
  for(const note of notes){
    const item=cell('article','','note');
    const top=cell('div','','note-head');top.append(cell('strong',note.kind.toUpperCase()),cell('span',note.status+' · '+new Date(note.createdAt).toLocaleString()));
    item.append(top,cell('p',note.body,'note-body'),cell('small',(note.nickname||'An unnamed chair')+' · Self-reported; not verified.'));
    if(role==='host'){
      const tools=cell('div','','actions');
      if(note.status!=='VISIBLE'){
        const approve=cell('button','APPROVE FOR GUESTS','button soft');approve.type='button';
        approve.addEventListener('click',()=>moderate(note.id,'VISIBLE'));tools.append(approve);
      }
      if(note.status!=='HIDDEN'){
        const hide=cell('button','HIDE','button soft');hide.type='button';
        hide.addEventListener('click',()=>moderate(note.id,'HIDDEN'));tools.append(hide);
      }
      item.append(tools);
    }
    box.append(item);
  }
}
async function moderate(noteId,decision){
  if(!held||held.role!=='host')return;
  try{await call({action:'moderate',id:held.id,token:held.token,noteId,decision});say('Card updated.');await refresh();}
  catch(e){say(e.message,true);}
}
$('#new-table').addEventListener('submit',async ev=>{
  ev.preventDefault();if(loading||!$('#new-table').reportValidity())return;
  loading=true;$('#create').disabled=true;say('Opening a table…');
  try{
    const result=await call({action:'create',...values(),...(parent?{parentId:parent.id,parentToken:parent.token}:{})});
    held={id:result.table.id,token:result.hostKey,role:'host',table:result.table};
    guestKey=result.guestKey;withdrawal=null;parent=null;
    history.replaceState(null,'',link(held.id,held.token));
    $('#receipt').hidden=true;
    await refresh();$('#room').scrollIntoView({block:'start'});
    say('Table created. Keep your host link private and use COPY GUEST INVITATION to invite people.');
  }catch(e){say('Could not open table: '+e.message,true);}
  finally{loading=false;$('#create').disabled=false;}
});
$('#share').addEventListener('click',()=>{if($('#guest-link').value)copy($('#guest-link').value,'#share-status');});
$('#copy-host').addEventListener('click',async()=>{if(held?.role==='host'){try{await navigator.clipboard.writeText(link(held.id,held.token));say('Private host link copied. Do not send this to guests.');}catch{say('Copy blocked: use the browser address bar to privately save the host URL.',true);}}});
$('#refresh').addEventListener('click',refresh);
$('#pass').addEventListener('click',()=>{
  if(!held)return;
  const t=held.table;
  parent={id:t.id,token:held.token};
  fill({title:'Next table after '+t.title,purpose:'What should we carry forward from '+t.title+'?',date:weekLater(t.date),time:t.time,venue:'',host:''});
  $('#parent-info').textContent='This successor will link to '+t.title+'. Its venue and host are deliberately blank. Linking does not prove attendance or partnership.';
  $('#parent-info').hidden=false;$('#start').hidden=false;$('#create-panel').scrollIntoView({behavior:'smooth',block:'start'});$('#title').focus({preventScroll:true});
});
$('#note-form').addEventListener('submit',async ev=>{
  ev.preventDefault();if(!held||!$('#note-form').reportValidity())return;
  const button=$('#post');button.disabled=true;
  try{
    const result=await call({action:'post',id:held.id,token:held.token,kind:$('#kind').value,nickname:$('#nickname').value,body:$('#body').value});
    withdrawal={tableId:held.id,noteId:result.note.id,withdrawKey:result.withdrawKey,guestOrHostKey:held.token};
    $('#receipt').hidden=false;$('#receipt-title').textContent=result.note.status==='VISIBLE'?'CARD PUBLISHED':'CARD SUBMITTED FOR HOST REVIEW';
    $('#receipt-text').value='CARD: '+result.note.id+'\nWITHDRAWAL KEY: '+result.withdrawKey;
    $('#withdraw-id').value=result.note.id;$('#withdraw-key').value=result.withdrawKey;
    $('#body').value='';say('Card accepted by the server. Save your private withdrawal receipt.');
    await refresh();$('#receipt').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(e){say('Card not submitted: '+e.message,true);}
  finally{button.disabled=false;}
});
$('#save-receipt').addEventListener('click',()=>{
  if(!withdrawal)return;
  const content=['THE SEVENTH TABLE · PRIVATE WITHDRAWAL RECEIPT','Table: '+withdrawal.tableId,'Card: '+withdrawal.noteId,
    'Withdrawal key: '+withdrawal.withdrawKey,'Use the original table invitation or host link to open the room and withdraw this card.',
    'Do not publish this key; anyone holding it AND an invitation link can withdraw your card.','Not proof of identity or a witnessed act.'].join('\n');
  const blob=new Blob([content],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='seventh-table-private-withdrawal.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#withdraw').addEventListener('click',async()=>{
  if(!held)return;
  if(!confirm('Withdraw this card from the room? This cannot be undone.'))return;
  try{
    await call({action:'withdraw',id:held.id,token:held.token,noteId:$('#withdraw-id').value.trim(),withdrawKey:$('#withdraw-key').value.trim()});
    $('#withdraw-id').value='';$('#withdraw-key').value='';$('#receipt').hidden=true;withdrawal=null;say('Card withdrawn from Abundent. Previously saved copies elsewhere cannot be recalled.');await refresh();
  }catch(e){say('Withdrawal failed: '+e.message,true);}
});
$('#close').addEventListener('click',async()=>{
  if(held?.role!=='host'||!confirm('Close this room? Guests will no longer be able to contribute.'))return;
  try{await call({action:'close',id:held.id,token:held.token});say('Room closed.');await refresh();}
  catch(e){say(e.message,true);}
});
$('#erase').addEventListener('click',async()=>{
  if(held?.role!=='host'||!confirm('Permanently erase the room and all server-held cards?')||!confirm('Final confirmation: delete the entire table?'))return;
  try{
    await call({action:'delete',id:held.id,token:held.token});
    held=null;guestKey=null;parent=null;withdrawal=null;
    history.replaceState(null,'',location.pathname);$('#room').hidden=true;$('#start').hidden=false;$('#new-table').reset();
    say('Room deleted from the database. Copies or links others have saved cannot be recalled.');
  }catch(e){say('Deletion failed: '+e.message,true);}
});
$('#date').value=weekLater([new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-'));
const match=location.hash.match(allowed);
if(match){held={id:match[1],token:match[2]};refresh();}
else if(location.hash){$('#service-error').hidden=false;$('#service-error').textContent='This room link is malformed. Open a new table or request another invitation.';}
