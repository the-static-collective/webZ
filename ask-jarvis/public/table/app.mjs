import {verifyReturn} from '../evidence.mjs';

const el=id=>document.getElementById(id);
let publicReturn=null,feast=null,selected=null,review=null;
const fail=(ok,why)=>{if(!ok)throw Error(why)};
function canonical(x){
  if(x===null||typeof x==='boolean'||typeof x==='string')return JSON.stringify(x);
  if(typeof x==='number'){fail(Number.isSafeInteger(x),'INVALID_NUMBER');return JSON.stringify(x);}
  if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
  fail(x&&typeof x==='object'&&Object.getPrototypeOf(x)===Object.prototype,'INVALID_OBJECT');
  return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
}
async function sha(x){
 const value=typeof x==='string'?x:canonical(x);
 const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return [...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
async function readFile(file){
 fail(file&&file.size>0&&file.size<=1024*1024,'Expected local JSON under 1 MiB');
 return JSON.parse(await file.text());
}
async function verifyPublic(p){
 fail(p?.schema==='ask-jarvis/return-v0'&&await verifyReturn(p),'ORIGINAL_PUBLIC_RECEIPT_INVALID');
 fail(p.evidence?.signature==='UNSIGNED','PUBLIC_NOT_UNSIGNED');
 fail(['question','invitation','door','song'].includes(p.return?.kind),'UNKNOWN_PUBLIC_RETURN');
 fail(p.workbenchRequest?.dispatch==='MANUAL_EXPORT_ONLY'&&
  p.workbenchRequest?.authority==='NONE','PUBLIC_HANDOFF_AUTHORITY');
 return p;
}
async function verifyPair(f){
 fail(f?.schema==='tablelogic.feast-return/v0'&&f.state==='HOLD_PUBLIC_AND_NATIVE','NOT_HOUSE004');
 const {local_sha256,...body}=f;
 fail(local_sha256===await sha(body),'HOUSE004_DIGEST_CHANGED');
 const p=await verifyPublic(f.public?.original_return);
 const e=f.native?.encounter;
 fail(f.public?.source==='the-static-collective/webZ@03684938fceb8ff4d614413c95634220895fa404'&&
   f.public.original_receipt_sha256===p.receiptHash,'WRONG_ORIGINAL_PR78_SOURCE');
 fail(e?.schema==='tablelogic.encounter/v0'&&e.state==='HOLD_HUMAN_REVIEW'&&
  f.native?.original_encounter_sha256===e.local_sha256,'NO_NATIVE_HOLD_ENCOUNTER');
 const {local_sha256:nativeHash,...nativeBody}=e;
 fail(nativeHash===await sha(nativeBody),'NATIVE_ENCOUNTER_DIGEST_CHANGED');
 fail(e.input?.listening?.schema==='tablelogic.listening-table/v0','NO_ORIGINAL_LISTENING_CONTEXT');
 const {local_sha256:listeningHash,...listeningBody}=e.input.listening;
 fail(listeningHash===await sha(listeningBody),'LISTENING_VIEW_DIGEST_CHANGED');
 const question=e.input.question;
 fail(question===p.encounter?.signal&&question===p.workbenchRequest?.task?.question&&
   question===f.question&&question===e.input.listening.question &&
   f.question_sha256===await sha(question)&&e.input.question_sha256===f.question_sha256,
   'QUESTION_NOT_SAME_PARTICULAR');
 const inv=e.invitations,seen=new Set();
 fail(Array.isArray(inv)&&inv.length>0&&inv.length<=24&&
   inv.length===e.input.listening.aperture.readings.length*3,'INVALID_NATIVE_INVITATION_SET');
 for(const x of inv){
   fail(x.disposition==='HOLD'&&x.authority==='none'&&x.actual_capability_call===false&&
    x.claim==='HYPOTHETICAL_REVIEW_PAIR_NOT_A_HUMAN_NEED_OR_REAL_OFFER',
    'REAL_INVITATION_OR_CAPABILITY_FABRICATED');
   seen.add(x.id);
 }
 fail(seen.size===inv.length&&Array.isArray(f.native.invitations)&&
   f.native.invitations.length===inv.length&&
   f.native.invitations.every(x=>seen.has(x.id)&&x.disposition==='HOLD'&&x.sent===false),
   'NATIVE_INVITATION_PROJECTION_CHANGED');
 fail(f.crossing?.external_effects===0&&f.crossing?.permissions==='NONE'&&
   f.crossing?.public_workbench_dispatch==='MANUAL_EXPORT_ONLY'&&
   f.public_draft_has_receiver!==true&&f.externally_published===false&&
   f.external_messages_sent===0&&f.independent_owner_admit===false&&
   f.permissions_inferred===false,'FORGED_EFFECT_OR_PERMISSION');
 // This is a consistency check only. An unsigned but self-consistent JSON file can be forged.
 return f;
}
function displayPublic(p){
 el('public-kind').textContent='Original '+p.return.kind+' — '+p.return.title;
 el('public-body').textContent=p.return.body;
 const inspections=p.sources.filter(s=>s.status==='INSPECTED').length;
 el('public-sources').textContent=inspections+' of '+p.sources.length+
  ' public source documents inspected by the originating response. Verification here checks the unsigned evidence bytes, not their actual Git objects or issuer identity.';
 el('public-output').hidden=false;
 el('public-status').textContent='Local unsigned evidence digest valid. This does not authenticate the server, source, or human permissions.';
}
function displayNative(f){
 const e=f.native.encounter;
 el('native-status').textContent='Local public and HOUSE-003 consistency checks passed. Original donor signatures NOT reverified in this browser; all crossings HOLD.';
 el('readings').textContent='Original Workbench readings: '+e.input.listening.aperture.readings.map(x=>x.id).join(' / ')+
  ' | original question SHA-256: '+f.question_sha256;
 el('native-output').hidden=false;el('invites').replaceChildren();selected=null;
 for(const item of f.native.invitations){
   const button=document.createElement('button');button.type='button';
   button.className='invitation';button.setAttribute('aria-pressed','false');
   const source=e.invitations.find(i=>i.id===item.id);
   const strong=document.createElement('strong');strong.textContent=source.candidate_name;
   const small=document.createElement('small');small.textContent=
     source.reading_id+' · '+source.source_lookup_status+
     ' · original JAR;VIS HOLD · no person invited';
   button.append(strong,small);
   button.onclick=()=>{
     selected=item.id;review=null;
     el('inspect').disabled=false;el('decline').disabled=false;el('export').disabled=true;
     for(const b of document.querySelectorAll('.invitation'))b.setAttribute('aria-pressed',String(b===button));
     el('choice-status').textContent='Locally selected '+source.candidate_name+
       '. It is not an available service or a real invite.';
   };
   el('invites').append(button);
 }
 el('inspect').disabled=true;el('decline').disabled=true;
}
function resetNative(message){
 feast=null;selected=null;review=null;el('native-output').hidden=true;
 el('inspect').disabled=true;el('decline').disabled=true;el('export').disabled=true;
 el('native-status').textContent=message;
}
el('public-receipt').addEventListener('change',async ev=>{
 try{
   const next=await verifyPublic(await readFile(ev.target.files?.[0]));
   if(feast&&feast.public.original_receipt_sha256!==next.receiptHash){
     resetNative('The imported HOUSE-004 pairing belongs to a DIFFERENT public receipt; native context cleared.');
   }
   publicReturn=next;displayPublic(next);
 }catch(e){publicReturn=null;el('public-output').hidden=true;resetNative('Native pairing cleared after public receipt refusal.');
   el('public-status').textContent='HOLD: '+e.message;}
});
el('native-receipt').addEventListener('change',async ev=>{
 try{
   const next=await verifyPair(await readFile(ev.target.files?.[0]));
   if(publicReturn&&next.public.original_receipt_sha256!==publicReturn.receiptHash)
     throw Error('IMPORTED_PUBLIC_RECEIPT_DOES_NOT_MATCH_THIS_FEAST');
   feast=next;publicReturn=next.public.original_return;displayPublic(publicReturn);displayNative(next);
 }catch(e){resetNative('HOLD: '+e.message);}
});
function choose(c){
 review={choice:c,invitation_id:c==='KEEP_AS_QUESTION'?null:selected};
 if(c!=='KEEP_AS_QUESTION'&&(!feast||!selected)){
   review=null;el('choice-status').textContent='Choose a verified local possibility first.';return;
 }
 el('choice-status').textContent='Local '+c.replaceAll('_',' ')+
   ' chosen. No request, registration or invitation has been sent.';
 el('export').disabled=false;
}
el('keep').onclick=()=>choose('KEEP_AS_QUESTION');
el('inspect').onclick=()=>choose('INVITE_LOCAL_REVIEW');
el('decline').onclick=()=>choose('DECLINE');
el('export').addEventListener('click',async()=>{
 if(!review)return;
 let payload;
 if(feast){
   payload={
    schema:'tablelogic.local-review-return/v0',
    parent_encounter_sha256:feast.native.original_encounter_sha256,
    original_question_sha256:feast.question_sha256,
    invitation_id:review.invitation_id,
    choice:review.choice,
    disposition:review.choice==='DECLINE'?'LOCALLY_DECLINED':'UNSENT_LOCAL_REVIEW',
    human_operator_assertion:'UNAUDITED_LOCAL_CHOICE',
    source_execution_reverified:false,real_human_consent_verification:false,
    delivered:false,receiver:'NONE',external_effects:0,owner_authority:'none'
   };
 } else{
   payload={schema:'tablelogic.public-local-note/v0',choice:review.choice,invitation_id:null,
    original_public_receipt_sha256:publicReturn?.receiptHash??null,
    external_effects:0,delivered:false,owner_authority:'none',
    native_proof_attached:false};
 }
 const note={...payload,local_sha256:await sha(payload)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(note,null,2)+'\n'],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='tablelogic-unsigned-local-return.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 el('choice-status').textContent='Unsigned local note saved. Nothing published or delivered.';
});
