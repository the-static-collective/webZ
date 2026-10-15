import {empty,validate,open,pledge,accept,report,confirm,stage,recommend,demo,helpSlip,freeze,thaw} from './model.mjs';
const $=id=>document.getElementById(id),key='webz.needs001.local';
let journal=empty(),durable=false,exported=null,inspected=null;
const say=t=>$('status').textContent=t;
const el=(tag,t)=>{const x=document.createElement(tag);x.textContent=t;return x;};
const btn=(t,fn)=>{const b=el('button',t);b.type='button';b.onclick=fn;return b;};
const addOption=(parent,id,t)=>{const o=el('option',t);o.value=id;parent.append(o);};
const identifier=prefix=>prefix+'-'+crypto.randomUUID();
function download(name,obj){const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
try{const t=localStorage.getItem(key);if(t){journal=validate(JSON.parse(t));durable=true;}}catch{journal=empty();durable=false;}
function save(j){journal=validate(j);exported=null;inspected=null;if(durable)try{localStorage.setItem(key,JSON.stringify(journal));}catch{durable=false;say('Storage unavailable; memory only.');}render();}
function action(fn){try{save(fn());say('Changed on this device only. No public write occurred.');}catch(e){say('Not recorded: '+e.message);}}
function render(){
 $('remember').checked=durable;const n=recommend(journal),candidate=$('candidate');candidate.replaceChildren();
 if(!n)candidate.append(el('p','Nothing open yet. Bring a need or load explicitly marked specimens.'));
 else candidate.append(el('h3',n.title),el('p',n.requirement),el('p',(n.origin==='demo'?'SPECIMEN / ':'DEVICE HOLD / ')+(n.offers.length?'A pledge exists for human selection.':'No pledge yet.')+' Scope: '+n.effort));
 const board=$('board'),returns=$('return-actions'),offers=$('offer-need'),slips=$('slip-need');
 board.replaceChildren();returns.replaceChildren();offers.replaceChildren();slips.replaceChildren();
 for(const item of journal.needs){
  const card=el('article','');card.className='card';
  card.append(el('small',item.origin==='demo'?'DEMO · NOT COMMUNITY DEMAND':'HELD ON THIS DEVICE'),el('h3',item.title),el('p',item.requirement),el('p',stage(item).replaceAll('-',' ')+' · '+item.offers.length+' offer(s) · '+item.effort));board.append(card);
  if(!item.confirmed&&item.acceptedOfferId===null){
   addOption(offers,item.id,item.title);
   const row=el('div','');row.className='action';row.append(el('strong',item.title),el('p',item.offers.length?'A pledge is ready for review.':'Awaiting a possible offer.'));
   item.offers.forEach(o=>row.append(btn('Accept: '+o.text.slice(0,35),()=>action(()=>accept(journal,item.id,o.id)))));
   returns.append(row);
  }
  if(item.acceptedOfferId&&!item.confirmed){
   const row=el('div','');row.className='action';row.append(el('strong',item.title));
   if(item.report===null){
    const text=document.createElement('textarea');text.maxLength=600;text.placeholder='What actually happened? Only non-sensitive details.';row.append(text,btn('Record self-report',()=>action(()=>report(journal,item.id,text.value))));
   }else{
    row.append(el('p','Unverified self-report: '+item.report));
    if(item.origin==='local')row.append(btn('Confirm locally (not external proof)',()=>action(()=>confirm(journal,item.id))));
   }returns.append(row);
  }
  if(item.origin==='local'&&!item.confirmed)addOption(slips,item.id,item.title);
 }
 if(!journal.needs.length)board.append(el('p','No community submissions. This is an empty local trial.'));
 if(!returns.childElementCount)returns.append(el('p','No selections to make.'));
 $('slip').disabled=!slips.childElementCount;$('offer-form').querySelector('button').disabled=!offers.childElementCount;
}
$('need-form').onsubmit=e=>{e.preventDefault();action(()=>open(journal,{id:identifier('need'),title:$('title').value,requirement:$('requirement').value,effort:$('effort').value,createdAt:new Date().toISOString(),consent:$('consent').checked}));};
$('offer-form').onsubmit=e=>{e.preventDefault();action(()=>pledge(journal,$('offer-need').value,identifier('offer'),$('offer-text').value));};
$('demo').onclick=()=>action(()=>demo(journal,new Date().toISOString()));
$('slip').onclick=()=>{try{download('garden-help-slip.json',helpSlip(journal,$('slip-need').value));say('Garden Help Slip downloaded. No submission or publication occurred.');}catch(e){say(e.message);}};
$('remember').onchange=()=>{durable=$('remember').checked;try{if(durable)localStorage.setItem(key,JSON.stringify(journal));else localStorage.removeItem(key);say(durable?'Local persistence enabled.':'Local persistence disabled.');}catch{durable=false;say('Storage unavailable; memory only.');}render();};
$('review').onclick=async()=>{try{exported=await freeze(journal);$('preview').textContent=JSON.stringify(exported,null,2);$('preview').hidden=false;$('download').hidden=false;say('Review this unsigned export before sharing it.');}catch(e){say(e.message);}};
$('download').onclick=()=>{if(exported)download('needs-local-board.json',exported);};
$('file').onchange=async e=>{inspected=null;$('restore').hidden=true;const f=e.target.files[0];if(!f)return;try{if(f.size>262144)throw Error('FILE_TOO_LARGE');inspected=await thaw(JSON.parse(await f.text()));$('preview').textContent='Inspected '+inspected.needs.length+' need(s). Restoring REPLACES the current local board. Checksum is not an identity signature.';$('preview').hidden=false;$('restore').hidden=false;say('Inspected, not yet restored.');}catch(err){say('Refused: '+err.message);}};
$('restore').onclick=()=>{if(inspected){save(inspected);$('restore').hidden=true;say('Reviewed board restored locally; no external write.');}};
$('erase').onclick=()=>{if(!confirm('Erase this device-local board? Already exported copies remain outside this browser.'))return;try{localStorage.removeItem(key);}catch{}durable=false;save(empty());$('preview').hidden=true;$('download').hidden=true;$('restore').hidden=true;say('Local board erased.');};
render();
