import {CAPABILITIES,EXAMPLES,RESPONSES,openExercise,simulateResponse,makeReturn,verifyReturn} from './model.mjs';
import {verifyFieldQuestion} from '../003/packet.mjs';

const byId=id=>document.getElementById(id);
const lanes=new Map();
let origin='EXAMPLE_ONLY', fieldPacket=null, exercise=null, receipt=null, rendering=false;
function say(message,isError=false){const target=byId('notification');target.textContent=message;target.dataset.error=isError?'true':'false';}
function node(tag,text,className){
  const e=document.createElement(tag);
  if(text!==undefined&&text!==null)e.textContent=text;
  if(className)e.className=className;
  return e;
}
function refreshSelectedExample(id=null){
  for(const b of byId('examples').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.example===id));
}
function chooseExample(example){
  origin='EXAMPLE_ONLY';fieldPacket=null;
  byId('question').value=example.question;
  byId('kind').value=example.kind;
  byId('permission').checked=false;
  byId('import-003').value='';
  for(const [id,checkbox] of lanes)checkbox.checked=example.lanes.includes(id);
  refreshSelectedExample(example.id);
  say('Fictional example loaded. Choose possible doors and open the local round trip.');
}
for(const sample of EXAMPLES){
  const b=node('button',undefined,'example');
  b.type='button';b.dataset.example=sample.id;b.setAttribute('aria-pressed','false');
  b.append(node('small','EXAMPLE / '+sample.kind),node('strong',sample.title));
  b.addEventListener('click',()=>chooseExample(sample));
  byId('examples').append(b);
}
for(const cap of CAPABILITIES){
  const label=node('label',undefined,'capability');
  const input=node('input');input.type='checkbox';input.className='lane-check';input.value=cap.id;
  input.setAttribute('aria-label','Consider '+cap.name);
  const area=node('div');
  area.append(node('small',cap.eyebrow+' / '+cap.family),node('strong',cap.name),node('span',cap.owner,'sub'));
  label.append(input,area);byId('capabilities').append(label);lanes.set(cap.id,input);
  const card=node('article',undefined,'source');
  card.append(node('small',cap.eyebrow+' / '+cap.owner),node('h3',cap.name),node('p',cap.role));
  const a=node('a','Inspect this source ↗');
  a.href=cap.href;a.target='_blank';a.rel='noopener noreferrer';card.append(a);byId('source-grid').append(card);
}
function becomeOwnQuestion(){
  origin='SELF_ATTESTED_LOCAL';fieldPacket=null;refreshSelectedExample();
  byId('import-003').value='';
}
byId('question').addEventListener('input',becomeOwnQuestion);
byId('kind').addEventListener('change',becomeOwnQuestion);
byId('import-003').addEventListener('change',async e=>{
  const f=e.target.files?.[0];
  if(!f)return;
  try{
    if(f.size>12000)throw new Error('PACKET_TOO_LARGE');
    const packet=JSON.parse(await f.text());
    await verifyFieldQuestion(packet);
    origin='IMPORT_003_VERIFIED_BYTES';fieldPacket=packet;
    byId('question').value=packet.public_question;byId('kind').value=packet.kind;
    byId('permission').checked=true;refreshSelectedExample();
    say('CIRCULATION-003 packet structure and hash verified locally. Human consent and authority remain unverified.');
  }catch(err){
    origin='SELF_ATTESTED_LOCAL';fieldPacket=null;byId('import-003').value='';
    say('Import refused: '+(err?.message||'invalid file')+'. Nothing was transmitted.',true);
  }
});
function hashShort(value){return value?.length>33?value.slice(0,24)+'…'+value.slice(-9):value;}
function tally(){const out={PENDING:0,HOLD_FOR_DISCUSSION:0,DECLINE:0,CONSIDER_FURTHER:0};for(const i of exercise.invitations)out[i.status]++;return out;}
function stat(container,title,count){const c=node('div',undefined,'receipt-stat');c.append(node('b',String(count)),node('span',title));container.append(c);}
async function render(){
  if(!exercise||rendering)return;
  rendering=true;
  try{
    await verifyReturn(receipt,exercise);
    byId('empty-loop').hidden=true;byId('active-loop').hidden=false;
    byId('origin-text').textContent=exercise.question;
    byId('origin-hash').textContent='LOCAL QUESTION DIGEST · '+hashShort(exercise.id);
    const group=byId('response-cards');group.replaceChildren();
    for(const invitation of exercise.invitations){
      const cap=CAPABILITIES.find(c=>c.id===invitation.lane);
      const card=node('article',undefined,'response-card');
      card.append(node('small',cap.eyebrow+' / FICTIONAL RECIPIENT MODEL'),node('h3',cap.name),node('p',cap.role));
      for(const item of RESPONSES){
        const b=node('button',item.label,'choice');
        b.type='button';b.setAttribute('aria-pressed',String(invitation.status===item.id));
        b.setAttribute('aria-label',cap.name+': simulate '+item.label);
        b.addEventListener('click',async()=>{
          if(rendering)return;
          try{
            const next=await simulateResponse(exercise,cap.id,item.id);
            const nextReceipt=await makeReturn(next);
            exercise=next;receipt=nextReceipt;
            await render();
            say('Only a local simulation changed. The actual project has not received or answered anything.');
          }catch(err){say('Response refused: '+err.message,true);}
        });
        card.append(b);
      }
      const chosen=RESPONSES.find(x=>x.id===invitation.status);
      card.append(node('span',chosen?'SIMULATION: '+chosen.label.toUpperCase():'AWAITING LOCAL SIMULATION','state'));
      group.append(card);
    }
    const counts=tally();const summary=byId('receipt-summary');summary.replaceChildren();
    stat(summary,'POSSIBLE DOORS',exercise.invitations.length);
    stat(summary,'HELD (FICTIONAL)',counts.HOLD_FOR_DISCUSSION);
    stat(summary,'DECLINED (FICTIONAL)',counts.DECLINE);
    stat(summary,'CONSIDER (FICTIONAL)',counts.CONSIDER_FURTHER);
    stat(summary,'REAL-WORLD OUTCOMES',0);
    byId('receipt-hash').textContent='LOCAL RETURN DIGEST · '+receipt.id;
  }finally{rendering=false;}
}
byId('run').addEventListener('click',async()=>{
  try{
    const selected=Array.from(lanes.entries()).filter(([,x])=>x.checked).map(([id])=>id);
    const e=await openExercise({
      kind:byId('kind').value,question:byId('question').value,lanes:selected,
      origin,consent:byId('permission').checked,fieldPacket
    });
    exercise=e;receipt=await makeReturn(exercise);
    await render();
    say('Local crossing ready. Choose an independent fictional response for each possible door.');
    byId('loop').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){say('Crossing refused: '+(err?.message||'unknown error')+'. Nothing was sent.',true);byId('notification').scrollIntoView({block:'center'});}
});
byId('download').addEventListener('click',async()=>{
  if(!exercise||!receipt)return;
  try{
    await verifyReturn(receipt,exercise);
    const safe={format:'abundent.pando-export/v0',exercise,receipt,note:'Local simulation only. No organizer endorsement, recipient decision, actual aid, service, publication, or authority.'};
    const blob=new Blob([JSON.stringify(safe,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=node('a');a.href=url;a.download='pando-004-local-witness-'+receipt.id.slice(-12)+'.json';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    say('Export requested on this device. No upload occurred.');
  }catch(err){say('Export refused: '+err.message,true);}
});
byId('print').addEventListener('click',()=>window.print());
byId('reset').addEventListener('click',()=>{
  exercise=null;receipt=null;origin='SELF_ATTESTED_LOCAL';fieldPacket=null;
  byId('active-loop').hidden=true;byId('empty-loop').hidden=false;
  byId('question-form').reset();byId('import-003').value='';
  for(const [,input] of lanes)input.checked=false;
  refreshSelectedExample();say('Local exercise discarded. Nothing was sent, stored remotely or published.');
  byId('workbench').scrollIntoView({behavior:'smooth'});
});
chooseExample(EXAMPLES[0]);
