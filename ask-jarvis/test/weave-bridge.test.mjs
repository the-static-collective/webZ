import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeOpportunity} from '../public/weave/model.mjs';
import {prepareHandoff,verifyHandoff,SCHEMA} from '../public/weave/handoff.mjs';
const fields={need:'Neighborhood produce needs sorting help.',offer:'Volunteers can try a small produce sorting event.',try:'Ask both groups before proposing any event.'};
const q='Could neighbors voluntarily try one small shared produce-sorting afternoon?';
test('bounded local handoff is inspectable and source-stable',async()=>{
 const proposal=makeOpportunity(fields);
 const pkt=await prepareHandoff({opportunity:proposal,question:q,reviewed:true});
 assert.equal(pkt.schema,SCHEMA);
 assert.equal(pkt.status,'UNPUBLISHED_CANDIDATE');
 assert.equal(pkt.recipient,'NONE');
 assert.equal(await verifyHandoff(pkt),true);
 assert.deepEqual(pkt.opportunity,proposal);
 for(const k of ['permission_verified','recipient_accepted','person_authenticated','work_performed','published'])assert.equal(pkt[k],false);
});
test('draft refuses missing human self-review and contact details',async()=>{
 const opportunity=makeOpportunity(fields);
 await assert.rejects(prepareHandoff({opportunity,question:q,reviewed:false}),/LOCAL_REVIEW_REQUIRED/);
 for(const question of ['Call 555-555-1234', 'Contact me@example.org to help', 'Read https://example.org', 'No']){
   await assert.rejects(prepareHandoff({opportunity,question,reviewed:true}));
 }
});
test('exact proposed bytes cannot be rewritten or falsely promoted',async()=>{
 const pkt=await prepareHandoff({opportunity:makeOpportunity(fields),question:q,reviewed:true});
 for(const mutate of [
 p=>{p.public_question+=' tomorrow';},p=>{p.published=true;},
 p=>{p.permission_verified=true;},p=>{p.recipient='Some named group';},
 p=>{p.opportunity.offer+=' and a payment';},p=>{p.attendees=['somebody'];}
 ]){
   const wrong=structuredClone(pkt);mutate(wrong);
   await assert.rejects(verifyHandoff(wrong));
 }
});
test('public UI makes explicit local JSON handoff, not automatic routing or historic event packet',()=>{
 const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 const html=read('../public/weave/index.html');
 const app=read('../public/weave/app.mjs');
 assert.match(html,/id="handoff-question"/);
 assert.match(html,/id="handoff-reviewed"/);
 assert.match(html,/id="download-handoff"/);
 assert.match(html,/not the event-specific Coalition CIRCULATION-003 record/i);
 assert.match(app,/prepareHandoff/);
 assert.doesNotMatch(app,/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|WebSocket/);
 assert.match(read('../public/weave/style.css'),/@media print/);
});
