// Reality 2.0 private operator desk. Static UI; keyed write operations go to Supabase Edge, never Data API.
// The credential only grants this specific 30-day experimental moderation capability, not organizational authority.
const API='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/reality2-operator';
const $=id=>document.getElementById(id);
let key='',busy=false;
const STORAGE_KEY='reality2-waseca:operator-session-key';
const KIND={need:'NEED',offer:'OFFER',table:'TABLE',stewardship:'STEWARDSHIP',feedback:'FEEDBACK',return:'RETURN'};
const PROGRESS=['OPEN','NEEDS_STEWARD','IN_PROGRESS','BLOCKED','TESTED','CLOSED'];
function node(type,text,cls){const n=document.createElement(type);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function row(parent,...children){parent.append(...children);return parent;}
function label(text,field){const wrap=node('label'),header=node('span',text);wrap.append(header,field);return wrap;}
function button(title,style,handler){const b=node('button',title);b.type='button';if(style)b.className=style;b.addEventListener('click',handler);return b;}
function field(type,value,max){const n=node(type);if(type==='textarea')n.rows=3;else n.type='text';n.value=value||'';n.maxLength=max;return n;}
function date(s){return s?new Date(s).toLocaleString():'Not recorded';}
function setStatus(msg){$('desk-state').textContent=msg;}
function clearDesk(){
 $('desk').hidden=true;$('gate').hidden=false;$('pending-list').replaceChildren();$('published-list').replaceChildren();$('audit-list').replaceChildren();
 $('pending-count').textContent='–';$('published-count').textContent='–';$('audit-count').textContent='–';
}
function storeKey(k){key=k;sessionStorage.setItem(STORAGE_KEY,k);}
function forget(){key='';sessionStorage.removeItem(STORAGE_KEY);$('key-input').value='';clearDesk();$('gate-state').textContent='Desk locked. Re-enter the operator key to unlock.';}
async function api(action,data={}){
 if(!key)throw Error('Operator key required.');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),14000);
 try{
  const res=await fetch(API,{method:'POST',signal:ctrl.signal,headers:{'content-type':'application/json',authorization:'Bearer '+key},body:JSON.stringify({action,...data})});
  let response;try{response=await res.json();}catch{throw Error('The operator service response was unreadable.');}
  if(!res.ok)throw Error(response.error||'OPERATOR_SERVICE_FAILED');
  return response;
 }finally{clearTimeout(timer);}
}
async function unlock(k){
 if(!/^[A-Za-z0-9_-]{43}$/.test(k))return $('gate-state').textContent='Invalid key format. The operator key contains 43 characters.';
 if(busy)return;busy=true;$('unlock').disabled=true;
 $('gate-state').textContent='Checking private operator access…';
 const old=key;key=k;
 try{
  const me=await api('me');
  storeKey(k);$('gate').hidden=true;$('desk').hidden=false;
  $('operator-name').textContent=me.label;
  $('operator-expiry').textContent='Key expires: '+date(me.expiresAt)+'. Session-only storage; lock the desk on shared devices.';
  $('key-input').value='';
  await reload();
 }catch(e){
  key=old;sessionStorage.removeItem(STORAGE_KEY);clearDesk();$('gate-state').textContent='Access denied: '+e.message;
 }finally{busy=false;$('unlock').disabled=false;}
}
function sectionHeader(item){
 const header=node('header');row(header,node('span',(KIND[item.kind]||item.kind)+' · '+item.lane,'small-tag'),node('small',date(item.created_at)));
 return header;
}
function pendingCard(item){
 const article=node('article',undefined,'review-item');
 article.append(sectionHeader(item),node('h3',item.title));
 const source=node('div',undefined,'original');
 row(source,node('strong','PRIVATE SOURCE · UNVERIFIED'),node('div',item.next_step||'(no next step supplied)'));
 article.append(source,node('p','Stage: '+item.stage+' · '+(item.parent_id?'Related to a reviewed card':'New invitation'),'hint'));
 const publicTitle=field('input',item.title,110);
 const publicStep=field('textarea',item.next_step,420);
 const publicUpdate=field('textarea','',350);
 const progress=node('select');for(const x of PROGRESS){const opt=node('option',x.replaceAll('_',' '));opt.value=x;progress.append(opt);}
 progress.value=item.kind==='feedback'?'BLOCKED':'NEEDS_STEWARD';
 const note=field('textarea','Reviewed for publication; not independently verified.',240);
 article.append(
  label('Public-safe headline (manually review, edit, redact)',publicTitle),
  label('Public-safe next step',publicStep),
  label('Progress label',progress),
  label('Optional public progress note',publicUpdate),
  label('Private review reason / operator note',note)
 );
 const confirm=node('input');confirm.type='checkbox';confirm.style.width='auto';confirm.style.display='inline-block';confirm.style.marginRight='.5rem';
 const reviewAck=node('label');reviewAck.append(confirm,node('span','I read this entry and approve this exact public text; it does not verify the underlying claim.'));
 article.append(reviewAck);
 const state=node('p','Not reviewed.','action-state');
 const actions=node('div',undefined,'actions');
 const yes=button('Publish reviewed copy','primary',async()=>{
  if(!confirm.checked)return state.textContent='Read and check the explicit human-review acknowledgment first.';
  if(publicTitle.value.trim().length<12)return state.textContent='The public title must have at least 12 characters.';
  if(!window.confirm('Publish this edited, non-sensitive copy to the public field and JAR;VIS feed?'))return;
  await change('review',{id:item.id,decision:'PUBLISH',publicTitle:publicTitle.value,publicStep:publicStep.value,progress:progress.value,publicUpdate:publicUpdate.value,reviewNote:note.value},state,yes,no);
 });
 const no=button('Reject / do not publish','danger',async()=>{
  if(!window.confirm('Reject this pending item? It will not be published.'))return;
  await change('review',{id:item.id,decision:'REJECT',reviewNote:note.value},state,yes,no);
 });
 row(actions,yes,no);article.append(actions,state);return article;
}
function publishedCard(item){
 const article=node('article',undefined,'review-item');
 article.append(sectionHeader(item),node('h3',item.public_title||'Untitled'));
 const body=node('p',item.public_step||'(no next step)','original');article.append(body);
 article.append(node('p','Published: '+date(item.published_at),'hint'));
 const progress=node('select');
 for(const x of PROGRESS){const opt=node('option',x.replaceAll('_',' '));opt.value=x;progress.append(opt);}
 progress.value=item.progress;
 const update=field('textarea',item.public_update||'',350);
 const reason=field('input','',240);
 article.append(label('Current work state',progress),label('Public progress note (do not assert unverified success)',update),label('Private reason if withdrawing publication',reason));
 const state=node('p','No changes pending.','action-state'),actions=node('div',undefined,'actions');
 const save=button('Save public progress','primary',async()=>{
  if(!window.confirm('Publish this progress label and update? No independent verification is implied.'))return;
  await change('progress',{id:item.id,progress:progress.value,publicUpdate:update.value},state,save,unpublish);
 });
 const unpublish=button('Remove public copy','danger',async()=>{
  if(reason.value.trim().length<8)return state.textContent='Enter an operator reason (8 or more characters).';
  if(!window.confirm('Remove this entry from the public field and JAR;VIS feed?'))return;
  await change('unpublish',{id:item.id,reviewNote:reason.value},state,save,unpublish);
 });
 row(actions,save,unpublish);article.append(actions,state);return article;
}
function renderQueue(d){
 $('pending-count').textContent=String(d.pending.length)+(d.truncated?.pending?'+':'');
 $('published-count').textContent=String(d.published.length)+(d.truncated?.published?'+':'');
 $('audit-count').textContent=String(d.audit.length)+(d.audit.length===30?'+':'');
 $('pending-list').replaceChildren(...(d.pending.length?d.pending.map(pendingCard):[node('p','No pending reviews. The desk is clear.','feed-empty')]));
 $('published-list').replaceChildren(...(d.published.length?d.published.map(publishedCard):[node('p','No reviewed public entries yet.','feed-empty')]));
 const audit=d.audit.map(e=>{
  const x=node('article',undefined,'audit-item');row(x,node('b',e.action+' · '+e.entry_id.slice(0,8)),node('span',e.old_status+' → '+e.new_status+' · '+e.old_progress+' → '+e.new_progress),node('small',date(e.occurred_at)));
  return x;
 });
 $('audit-list').replaceChildren(...(audit.length?audit:[node('p','No operator review events recorded yet.','feed-empty')]));
 if(d.truncated?.pending)setStatus('Showing the first 100 pending items. Use the backend for anything beyond the first 100.');
 else setStatus('Queue refreshed '+new Date().toLocaleTimeString()+'. No automatic publishing. Review each item independently.');
}
async function reload(){
 try{const d=await api('list');renderQueue(d);}
 catch(e){setStatus('Unable to load private queue: '+e.message);if(/NOT_AUTHORIZED|AUTH_REQUIRED|EXPIRED/.test(e.message))forget();}
}
async function change(action,data,state,...buttons){
 buttons.forEach(b=>b.disabled=true);state.textContent='Saving the operator decision…';
 try{await api(action,data);state.textContent='Recorded. Refreshing public and private review states…';await reload();}
 catch(e){state.textContent='Not saved: '+e.message;}
 finally{buttons.forEach(b=>b.disabled=false);}
}
$('unlock').addEventListener('click',()=>unlock($('key-input').value.trim()));
$('key-input').addEventListener('keydown',e=>{if(e.key==='Enter')unlock($('key-input').value.trim());});
$('refresh').addEventListener('click',reload);
$('logout').addEventListener('click',forget);
(function init(){
 const hash=new URLSearchParams(location.hash.replace(/^#/,''));
 const incoming=hash.get('key');
 if(location.hash){history.replaceState(null,'',location.pathname+location.search);}
 if(incoming){unlock(incoming);return;}
 const saved=sessionStorage.getItem(STORAGE_KEY);
 if(saved)unlock(saved);
})();
