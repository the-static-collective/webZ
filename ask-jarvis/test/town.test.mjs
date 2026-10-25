import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {makeTownPacket} from '../scripts/build-town-graph.mjs';

const raw=readFileSync(new URL('../town/catalog.json',import.meta.url));
const catalog=JSON.parse(raw);
const packet=makeTownPacket(catalog,raw);
const canonical=v=>JSON.stringify(Array.isArray(v)?v.map(JSON_):JSON_(v));
function JSON_(v){return v&&typeof v==='object'&&!Array.isArray(v)
 ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON_(v[k])]))
 :Array.isArray(v)?v.map(JSON_):v;}
const digest=v=>'sha256:'+createHash('sha256').update(canonical(v)).digest('hex');
test('Free Graph draft packet uses five portable verbs and canonical source/node/link identities',()=>{
 assert.equal(packet.schema,'free-graph.packet/v0');
 assert.equal(packet.sources.length,1);
 assert.equal(packet.nodes.length,catalog.ideas.length*3);
 assert.equal(packet.links.length,catalog.ideas.length*2+catalog.paths.length);
 assert.ok(packet.sources.every(s=>s.id==='fgs:'+digest(Object.fromEntries(Object.entries(s).filter(([k])=>k!=='id')))));
 assert.ok(packet.nodes.every(n=>n.id==='fgn:'+digest(Object.fromEntries(Object.entries(n).filter(([k])=>k!=='id')))));
 assert.ok(packet.links.every(l=>l.id==='fgl:'+digest(Object.fromEntries(Object.entries(l).filter(([k])=>k!=='id')))));
 const {packet_id,...withoutId}=packet;
 assert.equal(packet_id,'fgp:'+digest(withoutId));
 assert.ok(packet.links.every(l=>['connects','descends-from','tests','bears-on','constitutes'].includes(l.verb)));
});
test('editorial seeds cannot become observed, owner-local, completed work or a real-person roster',()=>{
 assert.equal(packet.task_world_cut.status,'unresolved');
 assert.ok(packet.links.every(l=>l.verb==='connects'&&l.status==='proposed'&&l.authority==='none'));
 assert.ok(packet.nodes.filter(n=>n.kind==='claim').every(n=>n.status==='proposed'&&n.claim_class==='design'));
 assert.ok(packet.nodes.filter(n=>n.kind==='test').every(n=>n.status==='proposed'));
 assert.ok(packet.nodes.filter(n=>n.kind==='question').every(n=>n.status==='unresolved'));
 assert.ok(packet.task_world_cut.omitted.some(o=>/consenting/i.test(o.reason)));
 assert.ok(packet.non_imports.some(n=>/flyer/i.test(n)));
 assert.ok(packet.residual_fog.some(n=>/steward/i.test(n)));
 assert.ok(!/\b(email|phone|password|address)\s*:\s*\S+@/i.test(JSON.stringify(packet)));
});
test('catalog rejects malicious IDs and out-of-contract links rather than guessing source canon',()=>{
 assert.throws(()=>makeTownPacket({...catalog,ideas:[{...catalog.ideas[0],id:'../private'}]},raw),/INVALID_ID/);
 assert.throws(()=>makeTownPacket({...catalog,paths:[['food-access','unknown','connects','unknown']]},raw),/INVALID_RELATION/);
 assert.throws(()=>makeTownPacket({...catalog,paths:[['food-access','shared-table','constitutes','auto approves']]},raw),/UNSUPPORTED_EDITORIAL_VERB/);
});
test('town page remains account-free, graph browsable, and private submissions never auto-publish',()=>{
 const html=readFileSync(new URL('../public/town/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/town/app.mjs',import.meta.url),'utf8');
 for(const id of ['option-list','option-detail','town-form','entry','review','receipt-withdraw','graph-status'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(js.includes("fetch('/town/graph.json'"));
 assert.ok(js.includes('PENDING_PRIVATE_REVIEW'));
 assert.ok(js.includes("credentials:'omit'"));
 assert.ok(js.includes("action:'withdraw'"));
 assert.ok(!js.includes('localStorage'));
 assert.ok(!js.includes('sendBeacon'));
 assert.ok(html.includes('These are possibilities—not available services.'));
});
