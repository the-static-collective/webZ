// STILL-HERE-028 · No data collection, no fetch, no storage, no analytics.
// All interactions use local editorial text. Case narratives are never typed here.
import {NEEDS,SEATS,needFor,seatFor,seatForNeed,careStep,inviteText,BLANK_CHRONOLOGY,trialWorksheet} from './model.mjs';
const $=id=>document.getElementById(id);
const el=(tag,value='',className='')=>{const n=document.createElement(tag);n.textContent=value;if(className)n.className=className;return n;};
const slow=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let need=needFor('steady'),seat=seatFor('safety');
function note(id,message){$(id).textContent=message;}
function mark(container,key,id){
 for(const b of $(container).querySelectorAll('button[data-choice]'))
  b.setAttribute('aria-current',String(b.dataset.choice===id));
}
function pickNeed(id,move=false){
 const chosen=needFor(id);if(!chosen)return;
 need=chosen;mark('needs','need',id);
 $('need-title').textContent=chosen.name;
 $('need-first').textContent=chosen.first;
 $('need-limit').textContent=chosen.boundary;
 $('need-bottleneck').textContent='What is missing from the group right now? '+chosen.bottleneck;
 $('need-seat').textContent='Explore the missing '+seatForNeed(chosen.id).name+' capacity ↓';
 note('need-status','No information was submitted, saved or shared.');
 if(move)$('need-detail').scrollIntoView({behavior:slow()?'auto':'smooth'});
}
function pickSeat(id,move=false){
 const chosen=seatFor(id);if(!chosen)return;
 seat=chosen;mark('seats','seat',id);
 for(const [key,value] of [['seat-name',seat.name],['seat-capability',seat.capability],
  ['seat-first',seat.first],['seat-return',seat.return],
  ['seat-authority',seat.authority],['seat-boundary',seat.boundary],
  ['seat-state','UNFILLED DESIGN SEAT · NOT AN APPOINTMENT · '+seat.kind]]){
  $(key).textContent=value;
 }
 note('seat-status','Nobody has been enrolled or appointed. These are optional design tasks, not live peer support.');
 if(move)$('seat-detail').scrollIntoView({behavior:slow()?'auto':'smooth'});
}
for(const item of NEEDS){
 const button=el('button','','tile');button.type='button';button.dataset.choice=item.id;
 button.append(el('small','I MIGHT NEED · NO STORY REQUIRED','tag'),el('strong',item.name));
 button.addEventListener('click',()=>pickNeed(item.id,true));
 $('needs').append(button);
}
for(const item of SEATS){
 const button=el('button','','tile');button.type='button';button.dataset.choice=item.id;
 button.append(el('small',item.kind==='GATE_BEFORE_LIVE_PILOT'?'FIRST: SAFEGUARD THE SPACE':'VOLUNTARY DESIGN TASK','tag'),
  el('strong',item.name),el('small',item.capability));
 button.addEventListener('click',()=>pickSeat(item.id,true));
 $('seats').append(button);
}
async function copy(words){
 // A user's explicit click is the ONLY clipboard operation.
 if(navigator.clipboard?.writeText && window.isSecureContext)return navigator.clipboard.writeText(words);
 const input=document.createElement('textarea');
 input.value=words;input.setAttribute('aria-label','Temporary copy field');
 input.style.position='fixed';input.style.left='-9999px';
 document.body.append(input);input.select();
 try{if(!document.execCommand('copy'))throw Error('COPY_NOT_AVAILABLE');}
 finally{input.remove();}
}
async function tryCopy(words,id,success){
 try{await copy(words);note(id,success);}
 catch{note(id,'Copy is unavailable on this device. Nothing was submitted or stored.');}
}
$('need-seat').addEventListener('click',()=>{
 pickSeat(seatForNeed(need.id).id);
 $('open-seats').scrollIntoView({behavior:slow()?'auto':'smooth'});
 note('seat-status','A possible missing capability—not a person—is highlighted. No case details were shared.');
});
$('need-copy').addEventListener('click',()=>{
 const p=careStep(need.id);
 const words=['A SMALL PRIVATE REQUEST','',p.question,'',p.first,'',
  'This is a generic prompt, not advice about any particular case.',
  'I choose whether to use this text; nothing is sent by the page.'].join('\n');
 void tryCopy(words,'need-status','Generic wording copied. Only paste or share it where you judge it safe.');
});
$('copy-chronology').addEventListener('click',()=>void tryCopy(BLANK_CHRONOLOGY,'need-status',
 'A blank template was copied. Clipboards may be visible to others using or monitoring your device.'));
$('seat-worksheet').addEventListener('click',()=>void tryCopy(trialWorksheet(seat.id),'seat-status',
 'The fictional starter exercise was copied. You can test it without receiving any survivor information.'));
$('seat-invite').addEventListener('click',()=>void tryCopy(inviteText(seat.id,'invite'),'seat-status',
 'An independent invitation was copied. Send it only to someone you choose; no enrollment occurred.'));
$('seat-ambassador').addEventListener('click',()=>void tryCopy(inviteText(seat.id,'ambassador'),'seat-status',
 'An ambassador invitation was copied. Any introduction requires the people involved to agree.'));
$('seat-print').addEventListener('click',()=>{
 $('print-sheet').textContent=inviteText(seat.id,'invite');
 note('seat-status','Print preview opened. Printed documents may remain visible to other people.');
 window.print();
});
window.addEventListener('afterprint',()=>$('print-sheet').replaceChildren());
pickNeed('steady');pickSeat('safety');
