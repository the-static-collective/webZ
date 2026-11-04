import {detectMode,makeInvite,decodeInvite,encodeInvite,actionsFor,forkInvite,makeResponse} from './engine.mjs';

const $=id=>document.getElementById(id);
const status=(id,s)=>{$(id).textContent=s;};
const getId=()=>{
 const b=new Uint8Array(16);crypto.getRandomValues(b);
 b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
 const s=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
 return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);
};
let current=null,responseText='',selectedAction='',when='open',forkWhen='open',manualWhen=false;
const publicRoot=()=>new URL('./',location.href);
function invitationUrl(invite) {
 const url=publicRoot();url.hash='i='+encodeInvite(invite);return url.href;
}
function setTime(value,scope){
 const target=scope==='fork'?'forkWhen':'when';
 if(scope==='fork')forkWhen=value;else when=value;
 const q=scope==='fork'?'[data-fork-when]':'[data-when]';
 document.querySelectorAll(q).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[target==='forkWhen'?'forkWhen':'when']===value)));
}
document.querySelectorAll('[data-when]').forEach(b=>b.addEventListener('click',()=>{
 manualWhen=true;setTime(b.dataset.when,'primary');
}));
document.querySelectorAll('[data-fork-when]').forEach(b=>b.addEventListener('click',()=>setTime(b.dataset.forkWhen,'fork')));
$('invite-words').addEventListener('input',()=>{
 if(!manualWhen)setTime(detectMode($('invite-words').value),'primary');
 status('create-status','');
});
function displayInvite(invite,changeURL=true){
 current=invite;responseText='';selectedAction='';
 $('invitation-panel').hidden=false;$('create-panel').hidden=true;
 $('action-panel').hidden=true;$('response-result').hidden=true;
 const times={now:'AVAILABLE NOW · SELF-DECLARED',soon:'AVAILABLE SOON · SELF-DECLARED',open:'OPEN TIMING · ASK FIRST'};
 $('invite-when').textContent=times[invite.when];
 $('invite-message').textContent=invite.words;
 $('invite-chain').textContent=invite.parentId ?
  'A branch of a previous invitation. '+invite.trail.length+' step(s) of self-declared ancestry. No provenance has been authenticated.':
  'Original invitation. Its public link can be carried, answered, or forked.';
 $('invitation-link').value=invitationUrl(invite);
 const area=$('invite-actions');area.replaceChildren();
 for(const action of actionsFor(invite)){
  const button=document.createElement('button');
  button.type='button';button.dataset.action=action.id;button.setAttribute('aria-pressed','false');
  const b=document.createElement('strong');b.textContent=action.label;
  const note=document.createElement('small');note.textContent=action.description;
  button.append(b,note);
  button.addEventListener('click',()=>selectAction(action.id,button));
  area.append(button);
 }
 if(changeURL)history.replaceState(null,'',invitationUrl(invite));
 status('share-status','Ready to share only when you choose.');
 $('invitation-panel').scrollIntoView({block:'start',behavior:'auto'});
}
function selectAction(actionId,button){
 selectedAction=actionId;
 document.querySelectorAll('#invite-actions button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 $('response-result').hidden=true;
 $('response-compose').hidden=true;$('fork-compose').hidden=true;$('action-tool').hidden=true;
 $('action-tool').replaceChildren();$('action-panel').hidden=false;
 status('action-status','');
 const title={
  act:'Do something useful now',offer:'Your offer is welcome',question:'Ask whatever matters',fork:'Grow another possibility',
  pass:'Carry it to someone else',decline:'That is a complete answer'
 };
 $('action-title').textContent=title[actionId]||'Choose your response';
 if(actionId==='pass'){
  $('action-intro').textContent='Passing a public link preserves its text and gives the next person all the same choices. No one is automatically contacted.';
  shareInvite();return;
 }
 if(actionId==='decline'){
  $('action-intro').textContent='No problem. You owe nothing, and nothing will be transmitted. You can leave or choose another path.';
  status('action-status','Closed locally. No decline was sent or recorded on a server.');return;
 }
 if(actionId==='fork'){
  $('action-intro').textContent='Make an independent, shareable invitation with this one as its declared ancestor. You choose the new words; no original is overwritten.';
  $('fork-compose').hidden=false;$('fork-words').value='';setTime(current.when==='now'?'open':current.when,'fork');
  $('fork-words').focus();return;
 }
 if(actionId==='act'){
  $('action-intro').textContent='If you can act now, choose a real working tool or send back the specific thing you can do. A possible action is not permission to act for someone else.';
  const l=document.createElement('a');
  const routes={
   creative:{href:'../jubilee/live/',label:'Open working audio/video capture and creative tools →'},
   make:{href:'../first-circle/',label:'Open the useful-work tool →'},
   food:{href:'../commons/',label:'Explore food and community possibilities →'},
   transport:{href:'../first-circle/',label:'Open the useful-work tool →'},
   question:{href:'../',label:'Ask JAR;VIS for a local answer →'},
   open:{href:'../first-circle/',label:'Open the useful-work tool →'}
  };
  const route=routes[current.lane]||routes.open;
  l.href=route.href;l.textContent=route.label;$('action-tool').append(l);
  const p=document.createElement('p');p.className='tiny';
  p.textContent='This opens an existing tool; the invitation is not transmitted to it and no real-world action is automatically performed.';
  $('action-tool').append(p);$('action-tool').hidden=false;
 }
 $('response-compose').hidden=false;
 $('response-words').value='';
 $('response-words').placeholder=actionId==='question'?'What would you like to know?':actionId==='act'?'I can take this specific step now…':'I can offer this specific help…';
 $('make-response').textContent=actionId==='question'?'Prepare my question →':'Prepare my response →';
 $('response-words').focus();
}
async function copy(value,id,fallback){
 try{
  if(!navigator.clipboard?.writeText)throw Error('Unsupported');
  await navigator.clipboard.writeText(value);
  status(id,'Copied. Nothing has been posted automatically.');
 }catch{
  if(fallback){fallback.focus();fallback.select();}
  status(id,'Clipboard unavailable. Select the visible text and copy it manually.');
 }
}
async function share(value,id,kind,fallback){
 if(navigator.share){
  try{await navigator.share(kind==='url'?{url:value,title:'An invitation to something possible'}:{text:value,title:'A response to an invitation'});
    status(id,'Shared through your device. No public feed or server receipt was created.');return;}
  catch(e){if(e.name==='AbortError'){status(id,'Sharing canceled. Nothing was sent.');return;}}
 }
 await copy(value,id,fallback);
}
function file(name,content,type='application/json'){
 const blob=new Blob([content],{type});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function responseAsText(r){
 return 'RESPONSE TO INVITATION '+r.invitationId+'\n'+r.choice.toUpperCase()+' · SELF-DECLARED\n\n'+r.words+
 '\n\nOriginal invitation: '+invitationUrl(current)+
 '\n\nNot a confirmation of delivery, permission, or a binding commitment.';
}
function shareInvite(){share($('invitation-link').value,'action-status','url',$('invitation-link'));}
$('create-invite').addEventListener('click',()=>{
 try{
  const inv=makeInvite({words:$('invite-words').value,when,originId:getId()});
  displayInvite(inv);
 }catch(e){status('create-status',e.message);}
});
$('make-response').addEventListener('click',()=>{
 try{
  const r=makeResponse(current,selectedAction,$('response-words').value,getId());
  responseText=responseAsText(r);
  $('response-preview').textContent=responseText;
  $('response-result').hidden=false;
  status('action-status','Your response is prepared locally. It has NOT been delivered to the inviter.');
  $('response-result').scrollIntoView({block:'nearest',behavior:'auto'});
 }catch(e){status('action-status',e.message);}
});
$('make-fork').addEventListener('click',()=>{
 try{
  const next=forkInvite(current,$('fork-words').value,getId(),forkWhen);
  displayInvite(next);
  status('share-status','New linked invitation created. Share this new link if you want; its ancestry is self-declared, not signed.');
 }catch(e){status('action-status',e.message);}
});
$('copy-response').addEventListener('click',()=>copy(responseText,'share-status',$('response-preview')));
$('share-response').addEventListener('click',()=>share(responseText,'share-status','text',$('response-preview')));
$('save-response').addEventListener('click',()=>file('invitation-response.txt',responseText,'text/plain;charset=utf-8'));
$('copy-invite').addEventListener('click',()=>copy($('invitation-link').value,'share-status',$('invitation-link')));
$('share-invite').addEventListener('click',()=>share($('invitation-link').value,'share-status','url',$('invitation-link')));
$('save-invite').addEventListener('click',()=>file('any-invitation.json',JSON.stringify(current,null,2)+'\n'));
$('new-invite').addEventListener('click',()=>{
 current=null;responseText='';
 history.replaceState(null,'',publicRoot().href);
 $('invitation-panel').hidden=true;$('create-panel').hidden=false;
 $('invite-words').value='';manualWhen=false;setTime('open','primary');
 $('invite-words').focus();status('create-status','');
});
try{
 const hash=new URLSearchParams(location.hash.slice(1));
 if(hash.has('i'))displayInvite(decodeInvite(hash.get('i')),false);
}catch(e){status('create-status','That shared link could not be read. You can make a fresh invitation here.');}
