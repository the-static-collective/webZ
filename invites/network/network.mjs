import {decodeInvite} from '../engine.mjs';
const API='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/invitation-network-002';
const $=id=>document.getElementById(id);
const KEY=/^[A-Za-z0-9_-]{43}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let draft=null,thread=null,selectedPost=null,watchKey='',cursor=0,pollTimer=null,polling=false;
let receipts=[];
const safeId=x=>typeof x==='string'&&UUID.test(x);
const note=(id,msg)=>{$(id).textContent=msg;};
function el(tag,value,css=''){
 const x=document.createElement(tag);x.textContent=String(value??'');if(css)x.className=css;return x;
}
function aLink(url,label){const a=el('a',label);a.href=url;return a;}
async function request(body){
 const timer=new AbortController();const stop=setTimeout(()=>timer.abort(),10000);
 try{
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:timer.signal,cache:'no-store',referrerPolicy:'no-referrer'});
  const data=await r.json().catch(()=>({error:'INVALID_SERVER_RESPONSE'}));
  if(!r.ok)throw Error(data.error||'SERVICE_UNAVAILABLE');
  return data;
 }finally{clearTimeout(stop)}
}
function privateReceipt(label,key,details){
 receipts.push({label,key,...details});
 const rows=receipts.map(x=>x.label+'\n'+Object.entries(x).filter(([k])=>k!=='label').map(([k,v])=>k+': '+v).join('\n')).join('\n\n');
 $('receipt-preview').textContent='ABUNDENT PRIVATE RECEIPTS — NEVER SHARE THESE KEYS\n\n'+rows+'\n\nThis copy is held only in this open page until saved.';
 $('receipt-preview').scrollIntoView({block:'nearest',behavior:'auto'});
}
function download(filename,content){
 const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
async function copy(text,id){
 try{await navigator.clipboard.writeText(text);note(id,'Copied. Do not share a private receipt key.')}
 catch{note(id,'Clipboard not available. Select and copy the visible text instead.')}
}
const state=()=>{
 $('publish-panel').hidden=true;$('browse-panel').hidden=true;$('thread-panel').hidden=true;
};
function showPublish(invitation){
 draft=invitation;state();
 $('publish-panel').hidden=false;
 $('publish-words').textContent=invitation.words;
 $('publish-when').textContent=invitation.when==='now'?'NOW (self-declared)':invitation.when==='soon'?'SOON (self-declared)':'OPEN TIMING';
 const guess=/\b(i need|could use|looking for|help me|who has)\b/i.test(invitation.words)?'need':
  /\b(question|why|how|what|wonder)\b/i.test(invitation.words)?'question':'offer';
 $('publish-intent').value=guess;
 $('publish-consent').checked=false;
 note('network-status','Nothing has been published.');
}
function showBrowse(){state();$('browse-panel').hidden=false;note('network-status','Browse published invitations or start your own.');}
function link(t){return new URL('./?thread='+encodeURIComponent(t.id),location.href).href;}
function timeLabel(t){return t.timing==='now'?'AVAILABLE NOW — unverified':t.timing==='soon'?'AVAILABLE SOON — unverified':'OPEN TIMING — ask first';}
function updateMatchPanel(post,match){
 selectedPost=post;
 $('matching-panel').hidden=false;
 $('match-intro').textContent='Possible complementary contributions: root '+thread.thread.intent+' / response '+post.kind+'. Both receipt holders must decide independently.';
 $('match-id').value=match?.id||'';
 note('match-status',match?'Current state: '+match.state+'. Both private keys are still required for mutual acknowledgment.':'No match has been proposed. This is only a possible pairing, not a verified real-world result.');
 $('matching-panel').scrollIntoView({block:'nearest',behavior:'auto'});
}
async function openThread(id,{keepBrowse=false}={}){
 const result=await request({action:'read',threadId:id});
 thread=result;selectedPost=null;
 $('publish-panel').hidden=true;$('thread-panel').hidden=false;
 if(!keepBrowse)$('browse-panel').hidden=true;
 $('thread-time').textContent=timeLabel(result.thread);
 $('thread-words').textContent=result.thread.words;
 $('thread-title').textContent=result.thread.intent==='need'?'Someone could use a hand':result.thread.intent==='offer'?'Someone has something to offer':result.thread.intent==='question'?'A question worth answering':'An open possibility';
 $('thread-meta').textContent='Public thread · '+result.thread.lane+' · '+new Date(result.thread.createdAt).toLocaleDateString()+' · expires '+new Date(result.thread.expiresAt).toLocaleDateString()+'. Public statements are not automatically verified.';
 const list=$('thread-posts');list.replaceChildren();
 if(!result.posts.length)list.append(el('p','No replies yet. A question, an offer, or one useful action can be the first return.'));
 for(const p of result.posts){
  const row=el('article','');
  row.append(el('h4',p.kind==='offer'?'An offer':p.kind==='need'?'A need':p.kind==='question'?'A question':p.kind==='act'?'A possible action':'Another possibility'));
  row.append(el('p',p.words));row.append(el('small','Posted '+new Date(p.createdAt).toLocaleString()+' · Reply ID '+p.id));
  const match=result.matches.find(x=>x.postId===p.id);
  const compatible=(result.thread.intent==='need'&&p.kind==='offer')||(result.thread.intent==='offer'&&p.kind==='need');
  if(compatible){
   const action=el('button',match?'Match receipt: '+match.state+' — view':'Propose a two-sided match');
   action.type='button';action.addEventListener('click',()=>updateMatchPanel(p,match));row.append(action);
  }
  list.append(row);
 }
 if(result.thread.intent==='need')$('reply-kind').value='offer';
 else if(result.thread.intent==='offer')$('reply-kind').value='need';
 else $('reply-kind').value='question';
 note('network-status','Conversation refreshed. You decide whether to participate.');
}
async function browse(){
 note('browse-status','Searching public invitations…');
 $('browse-results').replaceChildren();
 try{
  const result=await request({action:'discover',lane:$('browse-lane').value,intent:$('browse-role').value});
  if(!result.candidates.length)$('browse-results').append(el('p','No matching public invitations at the moment. You can create the first.'));
  for(const t of result.candidates){
   const row=el('article','');
   row.append(el('h4',timeLabel(t)));row.append(el('p',t.words));
   row.append(aLink(link(t),'Open public conversation →'));
   $('browse-results').append(row);
  }
  note('browse-status','Showing '+result.candidates.length+' self-declared candidates. Availability and permission remain unverified.');
 }catch(e){note('browse-status','Browse unavailable: '+e.message);}
}
$('browse-button').addEventListener('click',browse);
$('publish-button').addEventListener('click',async()=>{
 if(!draft)return;
 if(!$('publish-consent').checked){note('publish-status','Choose public publication consent first.');return}
 const button=$('publish-button');button.disabled=true;
 note('publish-status','Publishing a public thread…');
 try{
  const result=await request({action:'publish',invitationId:draft.id,words:draft.words,lane:draft.lane,timing:draft.when,intent:$('publish-intent').value,consent:true});
  const t=result.thread;
  privateReceipt('THREAD OWNER KEY',result.ownerKey,{threadId:t.id,publicLink:link(t)});
  history.replaceState(null,'',link(t));
  await openThread(t.id);
  note('network-status','PUBLIC · Conversation created. Save your owner receipt. It can close the thread or confirm a proposed match.');
 }catch(e){note('publish-status',e.message);}finally{button.disabled=false}
});
$('reply-send').addEventListener('click',async()=>{
 if(!thread)return;
 if(!$('reply-consent').checked){note('reply-status','Public reply consent is required.');return}
 const button=$('reply-send');button.disabled=true;
 try{
  const result=await request({action:'reply',threadId:thread.thread.id,kind:$('reply-kind').value,words:$('reply-words').value,consent:true});
  privateReceipt('PUBLIC RESPONSE KEY',result.replyKey,{threadId:thread.thread.id,postId:result.post.id,publicLink:link(thread.thread)});
  $('reply-words').value='';$('reply-consent').checked=false;
  note('reply-status','PUBLIC REPLY RECEIVED · Other watchers can see it. Save the receipt for withdrawal or a match decision.');
  await openThread(thread.thread.id);
 }catch(e){note('reply-status',e.message)}finally{button.disabled=false}
});
$('thread-refresh').addEventListener('click',async()=>{
 if(!thread)return;
 try{await openThread(thread.thread.id)}catch(e){note('network-status','Could not refresh: '+e.message)}
});
$('thread-discover').addEventListener('click',async()=>{
 if(!thread)return;
 $('browse-lane').value=thread.thread.lane;$('browse-role').value=thread.thread.intent;
 $('browse-panel').hidden=false;await browse();$('browse-panel').scrollIntoView({block:'start',behavior:'auto'});
});
$('match-propose').addEventListener('click',async()=>{
 if(!thread||!selectedPost)return;
 const key=$('match-key').value.trim();
 if(!KEY.test(key)){note('match-status','Enter the private owner or response receipt.');return}
 try{
  const r=await request({action:'propose-match',threadId:thread.thread.id,postId:selectedPost.id,key,consent:true});
  $('match-id').value=r.match.id;note('match-status',r.notice+' Match ID: '+r.match.id);
  await openThread(thread.thread.id);$('matching-panel').hidden=false;
 }catch(e){note('match-status',e.message)}
});
$('match-confirm').addEventListener('click',async()=>{
 const key=$('match-key').value.trim(),matchId=$('match-id').value.trim();
 if(!KEY.test(key)||!safeId(matchId)){note('match-status','Use a valid private receipt and match ID.');return}
 try{
  const r=await request({action:'confirm-match',matchId,key});
  note('match-status',r.match.state+' · '+r.notice);
  if(thread){const id=thread.thread.id;await openThread(id);$('matching-panel').hidden=false;note('match-status',r.match.state+' · '+r.notice);}
 }catch(e){note('match-status',e.message)}
});
function rememberWatch(){
 if(!thread||!watchKey)return;
 const scope='ic02:watch:'+thread.thread.id;
 try{if($('watch-remember').checked)localStorage.setItem(scope,watchKey);else localStorage.removeItem(scope)}
 catch{note('watch-status','Local storage unavailable. Keep your private receipt elsewhere.')}
}
$('watch-remember').addEventListener('change',rememberWatch);
function beginPoll(key){
 if(!KEY.test(key)){note('watch-status','Paste a valid 43-character private watch receipt.');return}
 watchKey=key;cursor=0;
 $('watch-key').value=key;$('watch-events').replaceChildren();
 if(pollTimer)clearInterval(pollTimer);
 pollTimer=setInterval(()=>{if(!document.hidden)poll()},20000);
 rememberWatch();poll();
}
async function poll(){
 if(!watchKey||polling)return;
 polling=true;
 try{
  const d=await request({action:'poll',watchKey,after:cursor});
  for(const event of d.events){
   const row=el('article','');row.append(el('h4',event.kind.replaceAll('_',' ')),el('p',event.summary));row.append(el('small',new Date(event.at).toLocaleString()));
   $('watch-events').prepend(row);
   if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&!document.hidden)new Notification('Invitation update',{body:event.summary});
  }
  cursor=d.nextCursor;
  note('watch-status','Receiving automatic in-app updates while this page is open. '+d.events.length+' new update(s) this check.');
  if(d.events.length&&thread)await openThread(thread.thread.id);
 }catch(e){note('watch-status','Notification check unavailable: '+e.message)}finally{polling=false}
}
$('watch-start').addEventListener('click',async()=>{
 if(!thread)return;
 try{
  const d=await request({action:'watch',threadId:thread.thread.id,consent:true});
  privateReceipt('WATCH NOTIFICATION KEY',d.watchKey,{threadId:d.threadId,publicLink:link(thread.thread),expiresAt:d.expiresAt});
  beginPoll(d.watchKey);
 }catch(e){note('watch-status','Could not subscribe: '+e.message)}
});
$('watch-resume').addEventListener('click',()=>beginPoll($('watch-key').value.trim()));
$('watch-browser').addEventListener('click',async()=>{
 if(typeof Notification==='undefined'){note('watch-status','This browser cannot show alerts. On-page updates still work.');return}
 try{
  const p=await Notification.requestPermission();
  note('watch-status',p==='granted'?'Browser alerts enabled while this page is open.':'Browser alerts not enabled; on-page updates still work.');
 }catch{note('watch-status','Browser alerts unavailable; on-page updates still work.')}
});
$('receipt-copy').addEventListener('click',()=>copy($('receipt-preview').textContent,'network-status'));
$('receipt-save').addEventListener('click',()=>download('abundent-invitation-private-receipts.txt',$('receipt-preview').textContent));
$('withdraw-button').addEventListener('click',async()=>{
 if(!thread)return;
 if(!confirm('Hide this public entry from the service? People may already have copied it.'))return;
 const key=$('withdraw-key').value.trim(),postId=$('withdraw-post').value.trim();
 if(!KEY.test(key)||postId&&!safeId(postId)){note('withdraw-status','Enter the appropriate private receipt and optionally a valid reply ID.');return}
 try{
  const r=await request({action:'withdraw',threadId:thread.thread.id,postId:postId||null,key});
  note('withdraw-status',r.notice);
  if(!postId){state();showBrowse()}else await openThread(thread.thread.id);
 }catch(e){note('withdraw-status',e.message)}
});
$('report-button').addEventListener('click',async()=>{
 if(!thread)return;
 const postId=$('report-post').value.trim();
 if(postId&&!safeId(postId)){note('report-status','Reply ID must be a valid UUID.');return}
 try{
  const r=await request({action:'report',threadId:thread.thread.id,postId:postId||null,reason:$('report-reason').value});
  note('report-status',r.notice);
 }catch(e){note('report-status','Report unavailable: '+e.message)}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&watchKey)poll()});
window.addEventListener('pagehide',()=>{if(pollTimer)clearInterval(pollTimer)});
const params=new URLSearchParams(location.search);
const requested=params.get('thread');
if(requested){
 if(safeId(requested)){
  openThread(requested).then(()=>{
   try{const stored=localStorage.getItem('ic02:watch:'+requested);if(stored&&KEY.test(stored)){$('watch-remember').checked=true;beginPoll(stored)}}catch{}
  }).catch(e=>{showBrowse();note('network-status','This public thread is unavailable: '+e.message)});
 }else{showBrowse();note('network-status','Invalid thread link.')}
}else{
 try{
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.has('i'))showPublish(decodeInvite(hash.get('i')));
  else showBrowse();
 }catch(e){showBrowse();note('network-status','Could not read the portable invitation: '+e.message)}
}
