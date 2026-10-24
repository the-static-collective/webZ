import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeOpportunity,opportunityLink,readOpportunity,opportunityToken} from '../public/weave/model.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const fields={need:'Community food access needs delivery support.',offer:'Volunteers have time to explore a small delivery pilot.',try:'Ask each group separately whether they want to meet.'};
test('public UTF-8 opportunity link round-trips without an account',()=>{
 const card=makeOpportunity({...fields,need:'Neighbors need jalapeño soup 🍲'});
 const link=opportunityLink(card,'https://abundent.org/weave/');
 assert.match(link,/^https:\/\/abundent\.org\/weave\/#card=/);
 assert.deepEqual(readOpportunity(new URL(link).hash),card);
 assert.equal(readOpportunity('#elsewhere=abc'),null);
});
test('link contains public proposal fields only',()=>{
 const card=makeOpportunity({...fields,notes:'private notes',attendees:['Neighbor A'],consent:true});
 const decoded=readOpportunity('#card='+opportunityToken(card));
 assert.deepEqual(Object.keys(decoded).sort(),['need','offer','try','v']);
 for(const key of ['notes','attendees','consent','outcome','email']) assert.equal(decoded[key],undefined);
});
test('obvious contact details and malformed or expanded payloads fail closed',()=>{
 for(const value of ['hello@example.org','https://example.org/form','Call 555-555-1234']){
  assert.throws(()=>makeOpportunity({...fields,try:value}));
 }
 assert.throws(()=>makeOpportunity({...fields,need:'a'}));
 assert.throws(()=>readOpportunity('#card=%%%'));
 assert.throws(()=>readOpportunity('#card='+'A'.repeat(2501)));
 const object={...makeOpportunity(fields),attendees:['someone']};
 assert.throws(()=>opportunityToken(object));
});
test('weaving door preserves voluntary, no-backend, consent boundaries',()=>{
 const html=read('../public/weave/index.html');
 const app=read('../public/weave/app.mjs');
 const home=read('../public/index.html');
 const doors=read('../public/doors/index.html');
 const tables=read('../public/tables/index.html');
 assert.match(html,/permission/i);
 assert.match(html,/networkweaver\.com\/resources\/closing-triangles/);
 assert.match(html,/No account/i);
 assert.match(html,/name="referrer" content="no-referrer"/);
 assert.match(html,/href="\/tables\/"/);
 for(const page of [home,doors,tables])assert.match(page,/href="\/weave\/"/);
 assert.doesNotMatch(app,/\bfetch\s*\(|localStorage|sessionStorage|sendBeacon|WebSocket/);
 assert.doesNotMatch(html,/<iframe\b|\son(?:click|submit|load)=/i);
 assert.match(read('../public/weave/style.css'),/@media print/);
});
