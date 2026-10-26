import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 CIRCLES,OPEN_WORK,OUTCOMES,makeTryPlan,makeInterestHash,readInterestHash,
 makeLocalReturn
} from '../public/still-here/start/model.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const page=read('../public/still-here/start/index.html');
const ui=read('../public/still-here/start/app.mjs');
const contact=read('../public/contact/contact.mjs');
const parent=read('../public/still-here/index.html');

test('the survivor stewardship campfire reuses real Campfire standing choices',()=>{
 assert.deepEqual(CIRCLES.map(c=>c.id),['curious','helper','starter','coordinator']);
 assert.equal(OPEN_WORK.length,5);
 assert.equal(new Set(OPEN_WORK.map(r=>r.id)).size,OPEN_WORK.length);
 for(const role of OPEN_WORK)for(const circle of CIRCLES){
  const trial=makeTryPlan(role.id,circle.id);
  assert.equal(trial.schema,'still-here/campfire-try-v1');
  assert.equal(trial.days,7);
  assert.equal(trial.standing.authority,'NONE');
  assert.equal(trial.authority,'NONE');
  assert.equal(trial.verifiedHelpers,0);
  assert.equal(trial.appointments,0);
  assert.equal(trial.steps.length,3);
  assert.match(trial.invitation,/no reply is required/i);
  assert.match(trial.invitation,/no names, allegations, custody details/i);
  assert.match(trial.release,/no live peer-matching/i);
  assert.match(trial.status,/NOT_AN_ACTIVE_SERVICE/);
 }
});

test('the next bottleneck recruits for safeguards before stranger matching',()=>{
 const safety=makeTryPlan('safeguards','starter');
 assert.match(safety.first,/one-page boundary and incident-response checklist/i);
 assert.match(safety.boundary,/no public stranger matching/i);
 const listening=makeTryPlan('listening','starter');
 assert.match(listening.boundary,/do not accept sensitive survivor stories/i);
 assert.doesNotMatch(safety.first,/host an active survivor group/i);
 assert.throws(()=>makeTryPlan('unknown','starter'));
 assert.throws(()=>makeTryPlan('listening','president'));
});

test('voluntary interest crossing is enum-only and never sends a story in the link',()=>{
 for(const role of OPEN_WORK)for(const circle of CIRCLES){
  const hash=makeInterestHash(role.id,circle.id);
  const parsed=readInterestHash(hash);
  assert.equal(parsed.role.id,role.id);
  assert.equal(parsed.circle.id,circle.id);
  assert.match(hash,/^#stillhere=v1&role=/);
  assert.ok(!hash.includes('@'));
  assert.ok(hash.length<140);
 }
 for(const bad of ['#stillhere=v1&role=evil&standing=starter',
  '#stillhere=v1&role=listening&standing=starter&note=private',
  '#stillhere=v1&role=listening&standing=starter&role=builders',
  '#stillhere=v2&role=listening&standing=starter',
  '#stillhere=v1&role=listening&standing=starter%0Aprivate']){
  assert.equal(readInterestHash(bad),null);
 }
 assert.throws(()=>makeInterestHash('listening','member'));
 assert.throws(()=>makeInterestHash('name@example.com','starter'));
});

test('local return counts neither acceptance nor authority, including pause/refusal',()=>{
 for(const [outcome] of OUTCOMES){
  const v=makeLocalReturn('safeguards','helper',outcome,['draft'],
   new Date('2026-10-26T12:00:00Z'));
  assert.equal(v.status,'SELF_REPORTED_NOT_INDEPENDENTLY_VERIFIED');
  assert.equal(v.scope,'LOCAL_EXPORT_ONLY');
  assert.equal(v.authority,'NONE');
  assert.equal(v.verifiedHelpers,0);
  assert.equal(v.contactSent,false);
  assert.equal(v.caseInformationIncluded,false);
 }
 assert.throws(()=>makeLocalReturn('safeguards','helper','APPOINTED'));
 assert.throws(()=>makeLocalReturn('safeguards','helper','DRAFTED',['survivor-records']));
});

test('source UI, survivor door and opt-in contact keep the release boundary visible',()=>{
 assert.match(parent,/href="\/still-here\/start\/"/);
 assert.match(page,/not yet staffed/i);
 assert.match(page,/no public stranger matching/i);
 assert.match(page,/id="roles"/);
 assert.match(page,/id="circles"/);
 assert.match(page,/id="save-return"/);
 assert.match(page,/id="interest-link"/);
 assert.match(page,/src="\/still-here\/start\/app.mjs"/);
 assert.match(contact,/readInterestHash/);
 assert.match(contact,/interest.value='volunteer'/);
 assert.match(contact,/Nothing has been submitted/);
 assert.match(contact,/contact_consent/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|\binnerHTML\s*=/);
 assert.match(ui,/navigator\.share/);
 assert.match(ui,/URL\.createObjectURL/);
 assert.match(ui,/\.textContent=/);
 for(const text of [page,ui]){
  for(const forbidden of ['thehotline.org','dayoneservices.org','800-799-7233','88788','hotline']){
   assert.equal(text.toLowerCase().includes(forbidden),false);
  }
 }
});
