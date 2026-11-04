import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAPABILITIES,routeUsefulWork} from '../app/useful-router.mjs';

test('Every publicly offered capability has an explicit source and measured local scope',()=>{
  assert.ok(CAPABILITIES.length>=6&&CAPABILITIES.length<=12);
  assert.equal(new Set(CAPABILITIES.map(c=>c.id)).size,CAPABILITIES.length);
  for(const c of CAPABILITIES){
    assert.match(c.source,/^https:\/\/github\.com\/the-static-collective\//);
    assert.match(c.readiness,/^LOCAL_(GUIDE|DRAFT|PARTIAL)$/);
    assert.ok(c.scope.length>60);
  }
});
test('A person who asks for food gets an actual recipe now, not a link to an intake form',()=>{
  const r=routeUsefulWork('I need a simple dinner with pantry staples');
  assert.equal(r.capability.id,'food');
  assert.equal(r.status,'LOCAL_WORK_PREPARED');
  assert.match(r.body,/INGREDIENTS:/);
  assert.match(r.body,/rice/);
  assert.doesNotMatch(r.next,/make a simple invitation/i);
});
test('A specific broken phone leads directly to safe troubleshooting steps',()=>{
  const r=routeUsefulWork("My phone won't charge");
  assert.equal(r.capability.id,'repair');
  assert.match(r.body,/known-working outlet/);
  assert.doesNotMatch(r.body,/diagnosed|repaired your phone/i);
});
test('People requesting help for a community meal get a complete draft and no fabricated helper',()=>{
  const r=routeUsefulWork('I need volunteers to set up chairs at a community meal Friday');
  assert.equal(r.capability.id,'volunteer');
  assert.equal(r.status,'LOCAL_WORK_PREPARED');
  assert.match(r.body,/Could someone help/);
  assert.match(r.body,/no one has been contacted/i);
});
test('An offer gets an actual shareable draft without being published',()=>{
  const r=routeUsefulWork('I can help carry groceries');
  assert.equal(r.capability.id,'offer');
  assert.match(r.body,/I can offer:/);
  assert.match(r.body,/not a public listing/);
});
test('A music or event request gets a usable agenda plus an explicitly limited extra resource',()=>{
  for(const [s,id] of [['I want a potluck event','event'],['I want a music circle','music']]){
    const r=routeUsefulWork(s);
    assert.equal(r.capability.id,id);
    assert.equal(r.status,'LOCAL_WORK_PREPARED');
    assert.match(r.body,/0–/);
    assert.equal(r.connection.href,'./jubilee/');
    assert.match(r.connection.note,/not a booked event|not a booked/i);
  }
});
test('Newsletter routing produces work, not false live farm integration',()=>{
  const r=routeUsefulWork('I need a farm newsletter');
  assert.equal(r.capability.id,'newsletter');
  assert.equal(r.status,'LOCAL_PARTIAL');
  assert.match(r.body,/SUBJECT:/);
  assert.match(r.body,/Only send to people who have opted in/);
  assert.match(r.connection.note,/no real farm/);
});
test('Urgent requests are not accidentally converted into a pantry recipe or fake service',()=>{
  const urgent=routeUsefulWork('I am in danger right now and need a safe place tonight');
  assert.equal(urgent.status,'HOLD');
  assert.equal(urgent.blocker,'NO_AUTHENTICATED_REAL_WORLD_RESPONDER');
  assert.doesNotMatch(urgent.body,/INGREDIENTS:/);
  const scarce=routeUsefulWork('I have no food and need groceries');
  assert.equal(scarce.status,'LOCAL_PARTIAL');
  assert.match(scarce.body,/practical food access/);
  assert.doesNotMatch(scarce.body,/dry rice/);
});
test('Existing provider integration code maps to a specific synthetic test, not a newsletter send',()=>{
  const r=routeUsefulWork('Can you sync GrownBy to an email newsletter?');
  assert.equal(r.capability.id,'newsletter');
  assert.equal(r.status,'LOCAL_PARTIAL');
  assert.match(r.body,/one synthetic record/);
  assert.match(r.body,/no real GrownBy/);
});

test('Unknown tasks, secrets, and insufficient requests fail to a truthful state',()=>{
  assert.equal(routeUsefulWork(''),null);
  assert.equal(routeUsefulWork('ok').status,'HOLD');
  const unknown=routeUsefulWork('Could you arrange a commercial flight?');
  assert.equal(unknown.status,'HOLD');
  assert.equal(unknown.blocker,'NO_VERIFIED_CAPABILITY_MATCH');
  assert.doesNotMatch(unknown.body,/booked|reservation confirmed/i);
  const privateCase=routeUsefulWork('Email my plan to hello@example.org please');
  assert.equal(privateCase.status,'PRIVACY_HOLD');
  assert.doesNotMatch(privateCase.body,/hello@example/);
});
test('Home screen renders results locally and does not transmit user text',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../app/wayfinder.mjs',import.meta.url),'utf8');
  const offline=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.ok(html.indexOf('id="first-move-title"')<html.indexOf('id="newspaper-entry"'));
  assert.match(html,/Tell JAR;VIS what you want to get done/);
  assert.match(ui,/routeUsefulWork\(input.value\)/);
  assert.match(ui,/textContent/);
  assert.match(ui,/Copy the useful part/);
  assert.doesNotMatch(ui,/(?<!text)innerHTML\s*=|\bfetch\s*\(|\.send\s*\(|localStorage|sessionStorage/);
  assert.match(offline,/app\/useful-router\.mjs/);
  assert.match(offline,/first-circle\/work\.mjs/);
});
