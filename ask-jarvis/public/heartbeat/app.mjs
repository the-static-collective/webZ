import {UUID,PHASES,projectRoom,proposalCard,assentCard,witnessCard} from './model.mjs';
const API='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/seventh-table';
const KEY=/^#table=([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/i;
const $=id=>document.querySelector(id);
const node=(tag,value,css='')=>{const el=document.createElement(tag);el.textContent=value;if(css)el.className=css;return el;};
let held=null,readResult=null,view=null,busy=false,receipt=null;
const status=(message,error=false)=>{$('#status').textContent=message;$('#status').classList.toggle('error',error);};
async function request(body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
    const res=await fetch(API,{method:'POST',mode:'cors',cache:'no-store',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
    let data;
    try{data=await res.json();}catch{throw Error('The service did not return readable JSON.');}
    if(!res.ok)throw Error(String(data.error||'Service unavailable').replaceAll('_',' '));
    return data;
  }finally{clearTimeout(timer);}
}
function sourceUrl(){
  const url=new URL('/tables/live/',location.origin);
  if(held)url.hash='table='+held.id+'.'+held.token;
  return url.href;
}
function options(selector,records,description){
  const select=$(selector),previous=select.value;select.replaceChildren();
  select.append(new Option(description,''));
  records.forEach(record=>select.append(new Option((record.body||record.plan||'Card').slice(0,82)+' · '+record.id.slice(0,8),record.id)));
  if(records.some(x=>x.id===previous))select.value=previous;
}
function fieldCards(selector,records,empty){
  const parent=$(selector);parent.replaceChildren();
  if(!records.length){parent.append(node('p',empty,'fine'));return;}
  records.forEach(card=>{
    const item=node('article','','source-card');
    item.append(node('strong',(card.kind||'card').toUpperCase()+' · '+card.id.slice(0,8)));
    item.append(node('p',card.body),node('small',
      (card.nickname||'An unnamed chair')+' · published by host review; identity and details unverified'));
    parent.append(item);
  });
}
function statusStages(){
  const latest=view.proposals.at(-1);
  const states=[
    view.needs.length&&view.offers.length?'At least one published NEED and OFFER.':'Waiting for a visible NEED and OFFER.',
    latest?'A scoped proposal is visible.':'No proposal is visible yet.',
    latest?(latest.twoStatements?'Two separate YES notes recorded. Reconfirm both people directly.':'HOLD: both self-declared YES notes are not visible.'):'No proposal; no action.',
    latest?.latestReport?'A self-reported outcome is visible.':'No outcome report is visible.',
    latest?.latestReport?'A return is available in this room; still unverified.':'No return yet.'
  ];
  $('#stage-list').replaceChildren(...PHASES.map((phase,i)=>{
    const item=node('article','','stage');
    item.append(node('b',String(i+1).padStart(2,'0')+' / '+phase),node('p',states[i]));
    return item;
  }));
}
function renderProposals(){
  const parent=$('#proposals');parent.replaceChildren();
  if(!view.proposals.length){parent.append(node('p','No visible proposal yet. A guest proposal remains pending until the host approves it.','fine'));return;}
  view.proposals.forEach(p=>{
    const item=node('article','','proposal');
    item.append(node('strong','PROPOSAL '+p.id.slice(0,8)+' · NOT AN AUTHORIZATION'));
    item.append(node('p',p.plan),node('small','NEED: '+p.need.body.slice(0,95)),node('small','OFFER: '+p.offer.body.slice(0,95)));
    item.append(node('p',p.twoStatements
      ? 'TWO SELF-DECLARED YES NOTES — NOT IDENTITY-VERIFIED OR PERMISSION TO ACT.'
      : 'HOLD — Need-side YES: '+p.selfReportedYes.need+' · Offer-side YES: '+p.selfReportedYes.offer,
      'pill'));
    if(p.latestReport)item.append(node('p','LATEST REPORT · '+p.latestReport.outcome.toUpperCase()+': '+p.latestReport.details,'result'));
    parent.append(item);
  });
}
function renderReturns(){
  const box=$('#returns');box.replaceChildren();
  const reported=view.proposals.filter(p=>p.latestReport);
  if(!reported.length){box.append(node('p','No return has been published. A plan alone is not accomplished work.','fine'));return;}
  reported.forEach(p=>{
    const item=node('article','','source-card');
    item.append(node('strong','RETURN FOR '+p.id.slice(0,8)+' · '+p.latestReport.outcome.toUpperCase()));
    item.append(node('p',p.latestReport.details),node('small','Self-reported, not verified. No automatic effects, payments or public broadcast.'));
    box.append(item);
  });
}
function render(){
  const table=readResult.table;
  $('#entry').hidden=true;$('#room').hidden=false;
  $('#room-title').textContent=table.title;$('#room-purpose').textContent=table.purpose;
  $('#role').textContent=readResult.role==='host'?'PRIVATE HOST KEY':'GUEST INVITATION';
  view=projectRoom(readResult.notes);
  fieldCards('#needs',view.needs,'No visible NEED card yet.');
  fieldCards('#offers',view.offers,'No visible OFFER card yet.');
  options('#need-select',view.needs,'Choose a published need…');
  options('#offer-select',view.offers,'Choose a published offer…');
  options('#yes-proposal',view.proposals,'Choose a published proposal…');
  options('#witness-proposal',view.proposals,'Choose a published proposal…');
  statusStages();renderProposals();renderReturns();
  const open=!table.closed;
  for(const form of ['#proposal-form','#yes-form','#witness-form']){
    const button=$(form).querySelector('button[type="submit"]');
    button.disabled=!open||(form==='#proposal-form'?!view.needs.length||!view.offers.length:!view.proposals.length);
  }
  if(!open)status('The host closed this room. Cards can be read with a valid invitation, but no new notes can be added.');
}
async function refresh(){
  if(!held)return;
  try{
    const result=await request({action:'read',id:held.id,token:held.token});
    readResult=result;render();
    if(!result.table.closed)status('Room refreshed. Only host-approved guest cards are visible here. No identities or physical outcomes were verified.');
  }catch(e){status('Could not read this room: '+e.message,true);}
}
function roomFromHash(hash){
  const match=hash.match(KEY);
  if(!match||!UUID.test(match[1]))throw Error('Use a valid Living Chair room invitation.');
  return {id:match[1],token:match[2]};
}
function openRoom(hash){
  held=roomFromHash(hash);
  history.replaceState(null,'',location.pathname+'#table='+held.id+'.'+held.token);
  $('#receipt').hidden=true;receipt=null;
  refresh();
}
async function submitCard(kind,body,confirmation){
  if(!held||!readResult||readResult.table.closed)throw Error('Open an active room first.');
  if(!confirmation)throw Error('Explicit personal acknowledgment is required.');
  const result=await request({action:'post',id:held.id,token:held.token,kind,body,nickname:''});
  const card=result.note;
  if(!card?.id||!result.withdrawKey)throw Error('The service did not return a withdrawal receipt. Check the room before resubmitting.');
  receipt={roomId:held.id,noteId:card.id,withdrawKey:result.withdrawKey};
  $('#receipt-text').value=[
    'ABUNDENT / HEARTBEAT · PRIVATE WITHDRAWAL RECEIPT',
    'ROOM: '+receipt.roomId,'CARD: '+receipt.noteId,
    'WITHDRAWAL KEY: '+receipt.withdrawKey,
    'Open the original Living Chair room to withdraw this card. Do not share this key.'
  ].join('\n');
  $('#receipt').hidden=false;
  await refresh();
  status(card.status==='VISIBLE'
    ? 'Card stored and visible in this room. Save its withdrawal receipt. Nothing else was sent.'
    : 'Card stored PENDING host review. It is NOT published to guests or counted by the heartbeat yet. Save your withdrawal receipt.');
  $('#receipt').scrollIntoView({block:'nearest'});
}
async function guardedSubmit(action){
  if(busy)return;busy=true;
  for(const b of document.querySelectorAll('form button[type="submit"]'))b.disabled=true;
  try{await action();}
  catch(e){status('Nothing confirmed: '+e.message,true);}
  finally{busy=false;if(readResult)render();}
}
$('#join-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=$('#join-url').value.trim();
  try{
    const url=new URL(input);
    if(url.protocol!=='https:'||url.pathname.replace(/\/$/,'')!=='/tables/live'||
      !new Set(['abundent.org','www.abundent.org',location.hostname]).has(url.hostname))
      throw Error('This must be an Abundent Living Chair invitation.');
    openRoom(url.hash);
    $('#join-url').value='';
  }catch(e){status('Invalid invitation: '+e.message,true);}
});
$('#open-source').addEventListener('click',()=>{location.href=sourceUrl();});
$('#refresh').addEventListener('click',()=>{void refresh();});
$('#leave').addEventListener('click',()=>{
  held=null;readResult=null;view=null;receipt=null;
  history.replaceState(null,'',location.pathname);$('#room').hidden=true;$('#entry').hidden=false;$('#receipt').hidden=true;
  status('You left the room on this device. Any earlier contribution remains until withdrawn with its receipt.');
});
$('#proposal-form').addEventListener('submit',event=>{
  event.preventDefault();if(!$('#proposal-form').reportValidity())return;
  void guardedSubmit(async()=>{
    const needId=$('#need-select').value,offerId=$('#offer-select').value;
    if(!view.needs.some(n=>n.id===needId)||!view.offers.some(n=>n.id===offerId))
      throw Error('Choose two current host-visible cards.');
    await submitCard('question',proposalCard({needId,offerId,plan:$('#plan').value}),$('#plan-confirm').checked);
    $('#plan').value='';$('#plan-confirm').checked=false;
  });
});
$('#yes-form').addEventListener('submit',event=>{
  event.preventDefault();if(!$('#yes-form').reportValidity())return;
  void guardedSubmit(async()=>{
    const proposalId=$('#yes-proposal').value;
    if(!view.proposals.some(p=>p.id===proposalId))throw Error('Choose a visible proposal.');
    await submitCard('rsvp',assentCard({proposalId,side:$('#yes-side').value}),$('#yes-confirm').checked);
    $('#yes-confirm').checked=false;
  });
});
$('#witness-form').addEventListener('submit',event=>{
  event.preventDefault();if(!$('#witness-form').reportValidity())return;
  void guardedSubmit(async()=>{
    const proposal=view.proposals.find(p=>p.id===$('#witness-proposal').value);
    if(!proposal)throw Error('Choose a visible proposal.');
    const outcome=$('#outcome').value;
    if(['completed','partial'].includes(outcome)&&!proposal.twoStatements)
      throw Error('HOLD: collect two separate visible self-declared YES notes first, then reconfirm directly.');
    await submitCard('witness',witnessCard({proposalId:proposal.id,outcome,details:$('#details').value}),$('#witness-confirm').checked);
    $('#details').value='';$('#witness-confirm').checked=false;
  });
});
$('#receipt-save').addEventListener('click',()=>{
  if(!receipt)return;
  const url=URL.createObjectURL(new Blob([$('#receipt-text').value],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='heartbeat-private-withdrawal.txt';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
if(location.hash){try{openRoom(location.hash);}catch(e){status(e.message,true);}}
