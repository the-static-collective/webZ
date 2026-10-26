// OPEN-SEATS-027 · A missing capability becomes a voluntary invitation.
// Public-facing interface does not collect, transmit or store contact details.
import {BOTTLENECK_GATES,getGate,matchGate,safePublicIssue,seatPacket,recruitmentCopy,gateForSummary} from './open-seats.mjs';
const $=id=>document.getElementById(id);
const node=(tag,value='',className='')=>{const n=document.createElement(tag);n.textContent=value;if(className)n.className=className;return n;};
let active=getGate('review');
function note(value){$('seat-status').textContent=value;}
function snapshot(){return seatPacket(active,{issue:$('seat-issue').value.trim()});}
function show(){
 const s=seatPacket(active);
 for(const [id,val] of [['seat-name',s.title],['seat-why',s.reason],['seat-first',s.firstMove],
   ['seat-proof',s.evidenceOfTrial],['seat-approval',s.approvalFrom],['seat-limit',s.limit]]){
   $(id).textContent=val;
 }
 $('seat-source').textContent=s.source==='CONFIRMED_WORKBOARD_CAPABILITY_GAP'?
  'KNOWN WORKBOARD IMPLEMENTATION GAP · NOT AN APPOINTED ROLE':
  'EDITORIAL OPEN INVITATION · NOT A VERIFIED VACANCY';
 for(const n of $('seat-cards').querySelectorAll('button[data-gate]'))
  n.setAttribute('aria-current',String(n.dataset.gate===active.id));
 $('seat-choice').value=active.id;
 note('Interest is not an appointment. The first safe task needs no private data or credentials.');
}
function choose(id,scroll=false){
 const next=getGate(id);if(!next)return;
 active=next;show();
 if(scroll)$('seat-detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function card(gate){
 const b=node('button','','seat-card');b.type='button';b.dataset.gate=gate.id;
 b.append(node('span',gate.source==='CONFIRMED_WORKBOARD_CAPABILITY_GAP'?'KNOWN BOTTLENECK':'POSSIBLE CAPABILITY','tag'),
  node('strong',gate.title),node('span',gate.label,'seat-card-desc'));
 b.addEventListener('click',()=>choose(gate.id,true));return b;
}
for(const gate of BOTTLENECK_GATES)$('seat-cards').append(card(gate));
$('seat-choice').addEventListener('change',e=>choose(e.target.value));
$('seat-diagnose').addEventListener('submit',e=>{
 e.preventDefault();const issue=$('seat-issue').value.trim();
 if(!safePublicIssue(issue)){note('Use a 12–220 character public-safe description, without names, contact details, URLs or private stories.');return;}
 choose(matchGate(issue).id);
 note('A possible missing capability: '+active.title+'. Nobody is assigned. You can invite someone to help shape the role.');
});
async function copy(text){
 if(navigator.clipboard&&isSecureContext)return navigator.clipboard.writeText(text);
 const box=node('textarea');box.value=text;box.style.position='fixed';box.style.left='-9999px';
 document.body.append(box);box.select();const ok=document.execCommand('copy');box.remove();
 if(!ok)throw Error('COPY_UNAVAILABLE');
}
$('seat-copy').addEventListener('click',async()=>{
 try{await copy(recruitmentCopy(snapshot(),'invite'));
  note('Invitation copied. You decide whom to ask. Nobody is enrolled or appointed.');
 }catch{note('Copy was blocked. You can print the invitation.');}
});
$('seat-ambassador').addEventListener('click',async()=>{
 try{await copy(recruitmentCopy(snapshot(),'ambassador'));
  note('Ambassador invitation copied. Any introduction requires the people involved to consent.');
 }catch{note('Copy was blocked. You can print the invitation instead.');}
});
$('seat-print').addEventListener('click',()=>{
 $('print-detail').textContent=recruitmentCopy(snapshot(),'invite');
 note('This is an invitation draft, not an appointment.');window.print();
});
$('seat-help').addEventListener('click',()=>{
 // The existing account-free, opt-in Abundent contact desk is the single intake.
 // No private data or applicant status is attached to a URL.
 const form=document.createElement('a');form.href='https://abundent.org/contact/';
 form.target='_blank';form.rel='noopener noreferrer';document.body.append(form);form.click();form.remove();
 note('The separate Abundent contact desk opened. Choose Helping / volunteering and describe the '+active.title+
  ' interest if you wish. Only the desk can receive the private message, with your explicit consent.');
});
window.addEventListener('open-seat-from-memory',e=>{
 try{
  const suggestion=gateForSummary(e.detail.summary);
  choose(suggestion.gate,true);
  note('This conversation suggests exploring '+suggestion.title+'. The source contribution does not enroll its author.');
 }catch{note('Unable to connect this question with a specific capability yet.');}
});
choose('review');
