// WORKBOARD-025 · Shared, durable, HUMAN-REVIEWED conversation history.
// The public feed and the private submission queue intentionally have different visibility.
import {readOpportunityLink} from './model.mjs';
const API='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/workboard-history';
const KINDS={question:'Question',concern:'Concern / correction',offer:'Bounded offer',
 proposal:'Possible experiment',return:'Self-reported return'};
const LABEL={grocery:'Community grocery',milk:'Milk supply',care:'Care connections',
 artists:'Artist-led gathering',park:'Park stewardship',church:'Church/community'};
const $=id=>document.getElementById(id);
const node=(tag,text='',cls='')=>{const x=document.createElement(tag);x.textContent=text;if(cls)x.className=cls;return x;};
let scope='all',cursor=null,items=[],busy=false;
const panel=$('history-entries'),status=$('history-status'),reply=$('history-parent');
const isKnown=t=>Object.hasOwn(LABEL,t);
const topic=()=>{const t=readOpportunityLink(location.hash)?.id||'grocery';return isKnown(t)?t:null;};
function message(s){status.textContent=s;}
function selectScope(s){
 scope=s;cursor=null;items=[];$('history-scope').value=s;
 $('history-more').hidden=true;
 $('history-thread').value=isKnown(s)?s:(topic()||'grocery');
 $('history-post').hidden=false;
 void loadHistory(false);
}
async function readJSON(url,init={}){
 const controller=new AbortController(),time=setTimeout(()=>controller.abort(),9500);
 try{
  const res=await fetch(url,{cache:'no-store',signal:controller.signal,...init});
  const text=await res.text();
  if(text.length>100000)throw Error('RESPONSE_TOO_LARGE');
  let data;try{data=JSON.parse(text);}catch{throw Error('INVALID_RESPONSE');}
  if(!res.ok)throw Error(typeof data.error==='string'?data.error:'SERVICE_UNAVAILABLE');
  return data;
 }finally{clearTimeout(time);}
}
function render(){
 panel.replaceChildren();reply.replaceChildren();
 const none=node('option','A new top-level contribution');none.value='';reply.append(none);
 if(!items.length){
  const empty=node('p','No reviewed community contributions yet. You can propose one below; it will remain private until a human reviewer approves it.','empty');
  panel.append(empty);return;
 }
 for(const item of items){
  const card=node('article','','history-entry');
  const meta=node('div',(LABEL[item.thread]||'Open topic')+' · '+(KINDS[item.kind]||'Contribution')+
   ' · '+new Date(item.publishedAt||item.createdAt).toLocaleDateString(), 'tag');
  card.append(meta);
  if(item.status==='WITHDRAWN'){
   card.append(node('p','A previously published contribution was withdrawn. Its text is no longer shown.','withdrawn'));
  }else{
   const body=node('p',item.text||'','history-text');card.append(body);
   card.append(node('small','Human-reviewed for publication; the claims have not been independently verified.','quiet'));
   const option=node('option',(LABEL[item.thread]||item.thread)+' · '+(item.text||'').slice(0,80));
   option.value=item.id;option.dataset.thread=item.thread;reply.append(option);
  }
  if(item.parentId)card.append(node('small','Reply to an earlier contribution · '+item.parentId.slice(0,8),'quiet'));
  panel.append(card);
 }
 const t=$('history-thread').value;
 for(const o of reply.options)if(o.value&&o.dataset.thread!==t)o.hidden=true;
}
async function loadHistory(append=false){
 if(busy)return;busy=true;
 $('history-refresh').disabled=true;$('history-more').disabled=true;
 message('Reading reviewed community history…');
 try{
  const search=new URLSearchParams({thread:scope});
  if(append&&cursor)search.set('before',cursor);
  const data=await readJSON(API+'?'+search);
  if(data.schema!=='abundent/workboard-history-v1'||data.reviewedOnly!==true||!Array.isArray(data.entries))
   throw Error('UNEXPECTED_HISTORY');
  const seen=new Set(append?items.map(x=>x.id):[]);
  items=(append?items:[]).concat(data.entries.filter(x=>!seen.has(x.id)));
  cursor=data.nextBefore||null;
  $('history-more').hidden=!cursor;
  render();
  message(items.length?items.length+' reviewed contributions shown · '+(scope==='all'?'all threads':LABEL[scope]):
   'The reviewed public history is currently empty. Unreviewed contributions are never shown.');
 }catch{
  if(!append){items=[];render();}
  message('The shared history could not be loaded. Local drafting still works. You can try Refresh.');
 }finally{busy=false;$('history-refresh').disabled=false;$('history-more').disabled=false;}
}
$('history-scope').addEventListener('change',e=>selectScope(e.target.value));
$('history-refresh').addEventListener('click',()=>{cursor=null;void loadHistory(false);});
$('history-more').addEventListener('click',()=>void loadHistory(true));
$('history-thread').addEventListener('change',()=>{
 for(const o of reply.options)if(o.value)o.hidden=o.dataset.thread!==$('history-thread').value;
 reply.value='';
});
window.addEventListener('board-topic-selected',e=>{
 const t=e.detail?.thread;if(isKnown(t))selectScope(t);
 else selectScope('all');
});
$('history-post').addEventListener('submit',async e=>{
 e.preventDefault();const button=$('history-send');
 if(busy||button.disabled)return;
 const thread=$('history-thread').value,kind=$('history-kind').value;
 const text=$('history-text').value.trim();
 const parentId=reply.value||null;
 const consent=$('history-consent').checked;
 if(!isKnown(thread)||!Object.hasOwn(KINDS,kind)||text.length<12||text.length>400||!consent){
  $('history-post-status').textContent='Check the thread, text length (12–400), and review consent.';return;
 }
 if(parentId&&reply.selectedOptions[0]?.dataset.thread!==thread){
  $('history-post-status').textContent='A reply must stay inside its original thread.';return;
 }
 button.disabled=true;$('history-post-status').textContent='Submitting privately for review…';
 try{
  const receipt=await readJSON(API,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({action:'submit',thread,kind,text,parentId,consentToReview:consent})});
  if(!receipt?.ok||!receipt?.receipt?.id||!receipt.withdrawKey)throw Error('INVALID_RECEIPT');
  $('receipt-id').textContent=receipt.receipt.id;
  $('receipt-key').textContent=receipt.withdrawKey;
  $('history-receipt').hidden=false;
  $('withdraw-id').value=receipt.receipt.id;
  $('withdraw-key').value=receipt.withdrawKey;
  $('history-text').value='';$('history-consent').checked=false;reply.value='';
  $('history-post-status').textContent='Saved in the PRIVATE moderation queue. It is not public, and publication is not guaranteed. Copy your receipt before leaving.';
 }catch(err){
  $('history-post-status').textContent='Could not confirm private receipt ('+
   String(err?.message||'network error').slice(0,75)+'). Please check before retrying to avoid duplicates.';
 }finally{button.disabled=false;}
});
$('history-copy-receipt').addEventListener('click',async()=>{
 const contents='ABUNDENT PRIVATE WITHDRAWAL RECEIPT\nID: '+$('receipt-id').textContent+
  '\nKEY: '+$('receipt-key').textContent+'\nKeep private. This receipt cannot verify work or publication.';
 try{await navigator.clipboard.writeText(contents);
  $('history-post-status').textContent='Private receipt copied. Store it somewhere only you can access.';}
 catch{$('history-post-status').textContent='Copy blocked. Manually select both ID and key before leaving.';}
});
$('history-withdraw').addEventListener('submit',async e=>{
 e.preventDefault();
 const id=$('withdraw-id').value.trim(),withdrawKey=$('withdraw-key').value.trim();
 const button=$('history-withdraw-button');button.disabled=true;
 $('withdraw-status').textContent='Requesting withdrawal…';
 try{
  const data=await readJSON(API,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({action:'withdraw',id,withdrawKey})});
  if(data.status!=='WITHDRAWN')throw Error('NO_CONFIRMATION');
  $('withdraw-status').textContent='Withdrawal confirmed. Previously public wording is replaced by a tombstone.';
  $('withdraw-key').value='';$('receipt-key').textContent='[used and invalidated]';
  await loadHistory(false);
 }catch(err){$('withdraw-status').textContent='Withdrawal was not confirmed: '+String(err?.message||'network error').slice(0,75);}
 finally{button.disabled=false;}
});
// This is an actual shared, reviewed feed; the rest of Workboard remains available offline.
void loadHistory(false);
