import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOURCE_CARDS,PLACES,PLACE_BY_ID,WAYS,SNAPSHOT_COMMIT} from '../public/real-worldz/places.mjs';
import {geography,findPlace,findWay,mapLink,draftPublicQuest,verifyDraft,privateFieldNote,importedFiction} from '../public/real-worldz/model.mjs';
import {initialWorld,choose,exportSimulation} from '../public/labs/living-watershed/world.mjs';
const read=rel=>readFileSync(new URL(rel,import.meta.url),'utf8');
test('real park references are geographically consistent and safety bounded',()=>{
 assert.equal(SNAPSHOT_COMMIT,'eda1444fea2141adff257d5e48976e59a72ef968');
 assert.equal(PLACES.length,3);assert.equal(new Set(PLACES.map(p=>p.id)).size,3);
 assert.deepEqual(PLACES.map(p=>p.name),['Sibley Park','Land of Memories Park','Riverfront Park']);
 for(const p of PLACES){
  assert.equal(p.kind,'river-gate.public-place-reference/v0');
  assert.ok(p.latitude>44.15&&p.latitude<44.185);
  assert.ok(p.longitude>-94.055&&p.longitude<-93.985);
  assert.equal(p.trusted_for_navigation,false);
  assert.equal(p.task_authorized,false);
  assert.equal(p.environmental_condition_verified,false);
  assert.match(p.source.url,/^https:\/\//);
  assert.match(p.geocode_provenance,/approximate named-park reference/);
 }
 for(const mark of geography()){assert.ok(mark.left>=0&&mark.left<=100);assert.ok(mark.top>=0&&mark.top<=100)}
 assert.ok(geography().find(p=>p.id==='riverfront').left>geography().find(p=>p.id==='sibley').left);
 assert.ok(geography().find(p=>p.id==='land-of-memories').top>geography().find(p=>p.id==='sibley').top);
});
test('external map links identify public references, no invented access points',()=>{
 assert.match(mapLink('sibley'),/^https:\/\/www\.openstreetmap\.org\/\?mlat=44\.16151&mlon=-94\.03296#map=15\/44\.16151\/-94\.03296$/);
 assert.throws(()=>mapLink('wrong'),/UNKNOWN_PLACE/);
 assert.throws(()=>findWay('physical-cleanup'),/UNKNOWN_PARTICIPATION_WAY/);
 assert.ok(PLACE_BY_ID['land-of-memories'].humanGate.includes('did not establish an open Kern Bridge'));
});
test('public-safe proposal remains held and has no human or physical effect',()=>{
 assert.equal(WAYS.length,3);
 const p=draftPublicQuest('sibley','observe');
 assert.equal(p.status,'HOLD_UNPUBLISHED');
 for(const key of ['owner_authorized','site_permission_obtained','actual_work_performed','separately_witnessed','measured_pollution','proven_impact','user_note_included'])assert.equal(p[key],false);
 assert.equal(p.full_measure_deed,'NOT_AWARDED');assert.equal(p.gro_action,'NOT_PERFORMED');
 assert.deepEqual(p.person_identifiers,[]);assert.deepEqual(p.report_values,[]);assert.equal(p.recipient,null);
 assert.deepEqual(verifyDraft(p),p);
 for(const w of WAYS)assert.equal(draftPublicQuest('riverfront',w.id).status,'HOLD_UNPUBLISHED');
 const bad=structuredClone(p);bad.owner_authorized=true;assert.throws(()=>verifyDraft(bad),/CHANGED_DRAFT/);
 bad.owner_authorized=false;bad.secret='not allowed';assert.throws(()=>verifyDraft(bad),/CHANGED_DRAFT/);
});
test('private note remains local, separate from fixed public proposal, never proof',()=>{
 const note=privateFieldNote('riverfront','return','I wonder about river history.','2026-10-24T10:00:00.000Z');
 assert.equal(note.storage,'LOCAL_DOWNLOAD_ONLY');assert.equal(note.evidence_state,'UNVERIFIED_SELF_REPORT_OR_REFLECTION');
 assert.equal(note.full_measure_deed,'NOT_AWARDED');assert.equal(note.environmental_verdict,'NONE');
 assert.ok(!JSON.stringify(draftPublicQuest('riverfront','return')).includes(note.observation));
 assert.throws(()=>privateFieldNote('riverfront','return',' '),/INVALID_NOTE/);
 assert.throws(()=>privateFieldNote('riverfront','return','a'.repeat(801)),/INVALID_NOTE/);
});
test('Willow Run is imported as fiction-derived preference only, never real credits',()=>{
 let w=initialWorld();
 for(let i=0;i<3;i++)w=choose(w,'willow-storykeeper','SIMULATE');
 w=choose(w,'willow-first-look','SIMULATE');
 w=choose(w,'willow-caretaker','SIMULATE');
 const pref=importedFiction(exportSimulation(w));
 assert.equal(pref.favorite_fictional_path,'Storykeeper');assert.equal(pref.fictional_turns,5);
 assert.equal(pref.actual_service_credit,0);assert.equal(pref.real_world_permission,false);
 assert.equal(pref.environmental_result,false);
 const bad=exportSimulation(w);bad.real_cleanup_confirmations=1;
 assert.throws(()=>importedFiction(bad),/PROMOTED_FICTION/);
});
test('original publishers and no hidden external requests, accounts or automatic storage',()=>{
 for(const source of Object.values(SOURCE_CARDS))assert.match(source.url,/^https:\/\//);
 assert.match(SOURCE_CARDS.adopt.url,/blueearthproject\.org\/adopt-a-drain\/$/);
 const app=read('../public/real-worldz/app.mjs'),model=read('../public/real-worldz/model.mjs');
 const html=read('../public/real-worldz/index.html'),css=read('../public/real-worldz/style.css');
 assert.match(html,/RIVER/);assert.match(html,/No real cleanup/);
 for(const id of ['place-pins','willow-save','note','draft-quest','save-private','source-list'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/target="_blank" rel="noopener noreferrer"/);
 assert.match(css,/@media print/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|geolocation|navigator\.share/i);
 assert.doesNotMatch(model,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|geolocation/i);
 assert.doesNotMatch(html,/<(?:iframe|form)\b|<script[^>]+src="https?:/i);
});
test('unchanged home, Switchboard, fictional game and old handoffs stay navigable',()=>{
 const doors=read('../public/doors/index.html');
 const home=read('../public/index.html');
 const willow=read('../public/labs/living-watershed/index.html');
 for(const src of [doors,home,willow])assert.match(src,/href="\/real-worldz\/"/);
 assert.match(doors,/href="\/weave\/"/);
 assert.match(home,/href="\/weave\/"/);
 assert.match(willow,/id="game-board"/);
 assert.match(doors,/href="\/contact\/"/);
});