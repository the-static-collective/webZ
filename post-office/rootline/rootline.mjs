import {plant,grow,verifyChain,readableCard,MAX_ADDITIONS,MAX_MESSAGE} from './rootline-core.mjs';
const $=id=>document.getElementById(id);
const station=new URL(location.href).searchParams.get('station')?.toUpperCase()==='B'?'B':
 new URL(location.href).searchParams.get('station')?.toUpperCase()==='C'?'C':'A';
$('station-id').textContent='ROOTLINE · STATION '+station;
$('compose').hidden=station!=='A';
$('receive').hidden=station==='A';
let pack=null,busy=false;
const updateStatus=(message,bad=false)=>{const el=$('status');el.textContent=message;el.dataset.error=String(bad)};
const output=$('rendered');
function display(){
 output.replaceChildren();
 $('download').disabled=!pack;
 $('copy-json').disabled=!pack;
 $('copy-text').disabled=!pack;
 $('keep').disabled=!pack;
 $('grow').disabled=!pack||pack.additions.length>=MAX_ADDITIONS;
 $('grow-note').disabled=!pack||pack.additions.length>=MAX_ADDITIONS;
 $('grow-consent').disabled=!pack||pack.additions.length>=MAX_ADDITIONS;
 if(!pack){$('summary').textContent='Nothing loaded. No one is waiting for an answer.';return}
 $('summary').textContent=(1+pack.additions.length)+' distinct authored note(s). Last integrity hash: '+
  (pack.additions.length?pack.additions.at(-1).link:pack.origin.link);
 const notes=[pack.origin,...pack.additions];
 for(const [i,n] of notes.entries()){
  const article=document.createElement('article');article.className='note';
  const label=document.createElement('span');label.className='eyebrow';
  label.textContent=i===0?'ORIGINAL SEED':'VOLUNTARY ADDITION '+i;
  const p=document.createElement('p');p.textContent=n.message;
  const tiny=document.createElement('small');tiny.textContent='CONTENT FINGERPRINT · '+n.link;
  article.append(label,p,tiny);output.append(article);
 }
 if(pack.additions.length===MAX_ADDITIONS)$('grow-hint').textContent='This experimental chain is full. You can keep or carry it unchanged.';
 else $('grow-hint').textContent='Optional. A new note stays separate from the original; adding never overwrites earlier text.';
}
async function act(fn){
 if(busy)return;busy=true;
 try{await fn()}catch(e){updateStatus('HOLD · '+(e?.message||'UNEXPECTED_ERROR'),true)}
 finally{busy=false;display()}
}
function download(content){
 const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='rootline-public-encouragement.json';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),500);
}
async function copy(content){
 $('outbox').value=content;
 try{await navigator.clipboard.writeText(content);updateStatus('COPIED · YOU CHOOSE WHETHER AND WHERE TO SHARE')}
 catch{$('outbox').focus();$('outbox').select();updateStatus('COPY BLOCKED · SELECT AND COPY THE TEXT BELOW',true)}
}
$('plant').addEventListener('click',()=>act(async()=>{
 if(station!=='A'||!$('plant-consent').checked)throw Error('PUBLIC_SHARING_PERMISSION_REQUIRED');
 pack=await plant($('initial-note').value);
 updateStatus('SEED CREATED LOCALLY · NOT SENT OR PUBLISHED');
 $('plant-consent').checked=false;
}));
$('import-paste').addEventListener('click',()=>act(async()=>{
 if(station==='A')throw Error('CHOOSE_RECEIVING_STATION');
 pack=null;display();
 // Parse only explicit local paste, never load a contact list or social inbox.
 pack=await verifyChain($('inbox').value.trim());
 updateStatus('CONTENT DIGEST VERIFIED · KEEPING IS ENOUGH');
}));
$('import-file').addEventListener('change',ev=>act(async()=>{
 if(station==='A')throw Error('CHOOSE_RECEIVING_STATION');
 pack=null;display();
 const file=ev.target.files?.[0];if(!file)return;
 if(file.size>3800)throw Error('ROOTLINE_TOO_LARGE');
 pack=await verifyChain(await file.text());
 ev.target.value='';
 updateStatus('LOCAL FILE VERIFIED · NO REPLY OR FORWARD REQUIRED');
}));
$('keep').addEventListener('click',()=>{
 if(!pack)return;
 updateStatus('KEPT FOR THIS OPEN PAGE · NO MESSAGE SENT, SAVED OR FORWARDED');
});
$('grow').addEventListener('click',()=>act(async()=>{
 if(!pack)throw Error('NO_ROOTLINE_SEED');
 if(!$('grow-consent').checked)throw Error('EXPLICIT_PUBLIC_NOTE_PERMISSION_REQUIRED');
 pack=await grow(pack,$('grow-note').value);
 $('grow-note').value='';$('grow-consent').checked=false;
 updateStatus('YOUR ADDITION IS SEPARATE AND VERIFIABLE · NOT PUBLISHED OR FORWARDED');
}));
$('download').addEventListener('click',()=>{if(pack)download(JSON.stringify(pack,null,2)+'\n')});
$('copy-json').addEventListener('click',()=>{if(pack)void copy(JSON.stringify(pack))});
$('copy-text').addEventListener('click',()=>{if(pack)void copy(readableCard(pack))});
$('clear').addEventListener('click',()=>{
 pack=null;$('initial-note').value='';$('grow-note').value='';$('inbox').value='';$('outbox').value='';
 $('grow-consent').checked=false;$('plant-consent').checked=false;
 updateStatus('SESSION CLEARED · NOTHING WAS SAVED HERE');display();
});
$('initial-note').maxLength=MAX_MESSAGE;$('grow-note').maxLength=MAX_MESSAGE;
display();
