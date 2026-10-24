import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialWorld,choose,eligibility,progress,verifyWorld,exportSimulation,importSimulation,fieldNotes,QUEST_INBOX,PLACES,PATHS} from '../public/labs/living-watershed/world.mjs';
const read=rel=>readFileSync(new URL(rel,import.meta.url),'utf8');
test('Full Measure field-test entries use a pinned original fictional source',()=>{
 assert.equal(QUEST_INBOX.schema,'static.field-test-inbox/v0');
 assert.equal(QUEST_INBOX.entries.length,6);
 assert.equal(new Set(QUEST_INBOX.entries.map(q=>q.id)).size,6);
 assert.ok(QUEST_INBOX.entries.every(q=>q.schema==='static.field-test-entry/v0'));
 assert.ok(QUEST_INBOX.entries.every(q=>q.source_commit==='2efd0d1692c475fa6ebb53683b5a71b0b9a8a096'));
 assert.ok(QUEST_INBOX.entries.every(q=>q.status==='PHYSICAL_UNVERIFIED'));
 assert.ok(QUEST_INBOX.entries.every(q=>q.safety_boundaries.length>=1));
 assert.equal(PLACES.length,6);
 assert.equal(Object.keys(PATHS).length,6);
});
test('multiple participation paths; conditional physical actions held independently',()=>{
 const w=initialWorld();
 for(const q of QUEST_INBOX.entries.filter(q=>q.condition==='READY_FOR_FIELD_TEST'))assert.equal(eligibility(w,q.id).canPlayFiction,true);
 assert.equal(eligibility(w,'willow-caretaker').canPlayFiction,false);
 assert.equal(eligibility(w,'willow-caretaker').requiresRealHumanGate,true);
 assert.throws(()=>choose(w,'willow-caretaker','SIMULATE'),/PREREQUISITE/);
 const observed=choose(w,'willow-first-look','SIMULATE');
 assert.equal(eligibility(observed,'willow-caretaker').canPlayFiction,true);
 assert.equal(eligibility(observed,'willow-caretaker').requiresRealHumanGate,true);
 assert.equal(eligibility(observed,'willow-caretaker').nativePreparedAllowed,false);
 const care=choose(observed,'willow-caretaker','SIMULATE');
 assert.equal(eligibility(care,'willow-steward').canPlayFiction,true);
 assert.equal(eligibility(care,'willow-steward').nativePreparedAllowed,false);
 assert.match(fieldNotes(care).echoes.join(' '),/imaginary authorized cleanup/);
 assert.equal(fieldNotes(care).actualEvents,0);
});
test('rest and hold do not count as service or failed progression',()=>{
 let w=initialWorld();w=choose(w,'willow-storykeeper','HOLD');w=choose(w,'willow-first-look','REST');
 assert.equal(progress(w).completed.size,0);
 assert.equal(w.events.length,2);
 assert.equal(exportSimulation(w).real_cleanup_confirmations,0);
 assert.throws(()=>choose(w,'willow-storykeeper','CONFIRMED'),/UNKNOWN_CHOICE/);
});
test('local export/import prevents forged human witnesses, reordered history, partner impact',()=>{
 let w=initialWorld();
 for(const [id,choice] of [
  ['willow-storykeeper','SIMULATE'],['willow-first-look','SIMULATE'],
  ['willow-caretaker','SIMULATE'],['willow-steward','HOLD'],['willow-connector','LEAVE_OPEN']
 ])w=choose(w,id,choice);
 const receipt=exportSimulation(w);
 assert.deepEqual(importSimulation(structuredClone(receipt)),w);
 assert.equal(receipt.full_measure_deed,'NOT_AWARDED');
 assert.equal(receipt.gro_published_tenet,false);
 assert.equal(receipt.independently_witnessed,false);
 const bad=structuredClone(receipt);bad.independently_witnessed=true;
 assert.throws(()=>importSimulation(bad),/PROMOTED_FICTION/);
 const bad2=structuredClone(receipt);bad2.simulation.events[1].plane='REAL_WORK';
 assert.throws(()=>importSimulation(bad2),/INVALID_SIMULATION_EVENT/);
 const bad3=structuredClone(receipt);bad3.simulation.events.reverse();
 assert.throws(()=>importSimulation(bad3),/INVALID_SIMULATION_EVENT/);
 const bad4=structuredClone(receipt);bad4.sponsor_impact_claim=true;
 assert.throws(()=>importSimulation(bad4),/PROMOTED_FICTION/);
});
test('advanced scientific and cleanup paths never become real human approvals',()=>{
 let w=choose(initialWorld(),'willow-first-look','SIMULATE');
 w=choose(w,'willow-researcher','SIMULATE');
 w=choose(w,'willow-caretaker','SIMULATE');
 w=choose(w,'willow-steward','SIMULATE');
 assert.deepEqual(fieldNotes(w).completedRoles,['Observer','Caretaker','Steward','Researcher']);
 assert.equal(eligibility(w,'willow-researcher').requiresRealHumanGate,true);
 assert.ok(QUEST_INBOX.entries.find(q=>q.id==='willow-researcher').safety_boundaries.some(x=>/No sampling/i.test(x)));
 assert.equal(exportSimulation(w).actual_pollution_measurements,0);
});
test('page is static, accountless, consent gated, privacy respecting and printable',()=>{
 const html=read('../public/labs/living-watershed/index.html');
 const app=read('../public/labs/living-watershed/app.mjs');
 const css=read('../public/labs/living-watershed/style.css');
 assert.match(html,/ALL PLACES AND QUESTS HERE ARE FICTIONAL/);
 assert.match(html,/Full Measure/);
 assert.match(html,/GrO/);
 assert.match(html,/id="pins"/);
 assert.match(html,/id="load"/);
 assert.match(html,/FICTION ONLY/);
 assert.match(css,/@media print/);
 assert.match(css,/@media\(prefers-reduced-motion/);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|geolocation|navigator\.share/i);
 assert.doesNotMatch(html,/<(?:iframe|form)\b|<script[^>]+src="https?:/i);
});