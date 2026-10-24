// WORKBENCH 002 synthetic-only native source handoff.
// Do not accept a file path, pasted data or real-world input.
import {mkdirSync,writeFileSync} from 'node:fs';
import {makeOpportunity} from '../public/weave/model.mjs';
import {prepareHandoff,verifyHandoff} from '../public/weave/handoff.mjs';
import {prepareFieldQuestion,verifyFieldQuestion} from '../../deps/webz-field/circulation/003/packet.mjs';
if(process.argv.length!==3||process.argv[2]!=='--synthetic-only')throw Error('SYNTHETIC_FLAG_REQUIRED');
const out='.weave-bridge';
mkdirSync(out,{recursive:false});
const opportunity=makeOpportunity({
 need:'A fictional community table needs help moving garden supplies.',
 offer:'A fictional workshop has spare carts and time to discuss a small trial.',
 try:'Ask hypothetical organizers separately about a one-time cooperative experiment.'
});
const question='FICTIONAL: Could neighbors explore one voluntary community garden supply exchange?';
const handoff=await prepareHandoff({opportunity,question,reviewed:true});
await verifyHandoff(handoff);
const field=await prepareFieldQuestion({
 kind:'BUILD',text:question,authorRole:'AUTHOR',permissionReviewed:true,privacyReviewed:true
});
if(!await verifyFieldQuestion(field))throw Error('DONOR_PACKET_REFUSED');
const seed={
 schema:'cannon.circulation-seed/v0',
 fictional:true,title:question,
 receivers:[
  {destination:'the-static-collective/BananaSpork',lane:'care',question:'FICTIONAL: CARE question: '+question.slice(11)},
  {destination:'the-static-collective/static-live',lane:'culture',question:'FICTIONAL: CULTURE question: '+question.slice(11)}
 ]
};
for(const obj of [seed,...seed.receivers]){
 const s=obj.title??obj.question;
 if(s.length>180||!s.startsWith('FICTIONAL:'))throw Error('NOT_A_BOUNDED_FIXTURE');
}
for(const [file,body] of [['handoff.json',handoff],['field.json',field],['seed.json',seed]]){
 writeFileSync(out+'/'+file,JSON.stringify(body,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({status:'FICTIONAL_ONLY',handoff:handoff.id,field:field.id,recipient:'NONE',actual_human_evidence:false}));
