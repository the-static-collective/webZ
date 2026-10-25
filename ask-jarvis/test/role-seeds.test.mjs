import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROLES,ROLE_STATES,getRole,roleForMission,roleForQuestion,
  firstStewardshipMove,draftRoleInvite,makeRoleLink,readRoleHash,intakePreview}
 from '../public/role-seeds.mjs';
import {EXAMPLES,buildBoard} from '../public/tomorrow-machine.mjs';
import {assemble} from '../src/worker.mjs';

test('all seven starter roles are open, bounded proposals with a first action',()=>{
 assert.equal(ROLES.length,7);
 assert.equal(new Set(ROLES.map(x=>x.id)).size,7);
 assert.ok(ROLE_STATES.includes('OPEN_ROLE'));
 for(const role of ROLES){
  assert.match(role.id,/^[a-z-]{4,40}$/);
  assert.ok(role.starter.length>=25);
  assert.ok(role.trial.length>=25);
  assert.ok(role.boundary.length>=25);
  assert.ok(['grocery','potluck','volunteer','arts','technology','resources','general'].includes(role.interest));
  assert.match(firstStewardshipMove(role),/No existing steward required/i);
  assert.match(draftRoleInvite(role,'self'),/not an appointment/i);
  assert.match(draftRoleInvite(role,'peer'),/Would you be interested/i);
  assert.match(draftRoleInvite(role,'ambassador'),/pass the role idea/i);
 }
});
test('specific questions surface topical open role, unrelated questions stay unrelated',()=>{
 assert.equal(roleForQuestion('Could we share surplus tomatoes at a community grocery?').id,'food-bridge');
 assert.equal(roleForQuestion('Want to plan a neighborhood music guitar song night?').id,'song-circle');
 assert.equal(roleForQuestion('Where could we clean up trash at a city park?').id,'park-quest');
 assert.equal(roleForQuestion('Can someone repair broken electronics?').id,'repair-table');
 assert.equal(roleForQuestion('I could help with a mural for local artists.').id,'artist-porch');
 assert.equal(roleForQuestion('How can I study planetary astrophysics?').id,'question-listener');
 assert.equal(roleForQuestion('My email is hello@example.org').id,'question-listener');
});
test('every Tomorrow mission maps to an unfilled, human-started exploration role',()=>{
 for(const example of EXAMPLES){
  const board=buildBoard(example);
  for(const mission of board.missions){
   const role=roleForMission(mission.id);
   assert.equal(mission.openRole.id,role.id);
   assert.equal(mission.openRole.state,'OPEN_ROLE');
   assert.equal(roleForMission(mission.id).id,role.id);
   assert.equal(mission.state,'UNCONFIRMED_PROPOSAL');
  }
 }
});
test('role links carry only canonical public role id; never names, emails or uncontrolled text',()=>{
 const link=makeRoleLink('https://abundent.org/tomorrow.html','food-bridge');
 const u=new URL(link);
 assert.equal(u.pathname,'/roles/');
 assert.equal(u.search,'');
 assert.equal(u.hash,'#role=food-bridge');
 assert.equal(readRoleHash(u.hash).id,'food-bridge');
 assert.equal(new URL(makeRoleLink(link,'food-bridge','/contact/')).pathname,'/contact/');
 for(const x of ['#role=unknown','#role=food-bridge&name=abc','#role=food-bridge&role=music','#role=hello%40example.org','#role='])assert.equal(readRoleHash(x),null);
 assert.throws(()=>makeRoleLink('https://example.org','unauthorized'));
 assert.throws(()=>makeRoleLink('http://example.org','food-bridge'));
});
test('contact prefill is draft-only and does not send or register anyone',()=>{
 const role=getRole('food-bridge');
 const draft=intakePreview(role);
 assert.equal(draft.interest,'grocery');
 assert.equal(draft.status,'DRAFT_NOT_SUBMITTED');
 assert.ok(draft.note.includes(role.id));
 assert.ok(draft.note.length<1200);
 assert.match(draft.note,/not enrollment/i);
 const form=readFileSync(new URL('../public/contact/contact.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/contact/index.html',import.meta.url),'utf8');
 assert.match(form,/readRoleHash\(location.hash\)/);
 assert.match(form,/contact_consent/);
 assert.match(form,/form\.addEventListener\('submit'/);
 assert.match(html,/contact-consent/);
 assert.match(html,/role-intent/);
});
test('JAR public answer includes the open role and a specific self-starting task',async()=>{
 const resp=await assemble('How could neighbors help a community grocery with extra tomatoes?',async()=>new Response('no',{status:503}));
 assert.equal(resp.synthesis.openStarterRole.id,'food-bridge');
 assert.equal(resp.synthesis.openStarterRole.state,'OPEN_ROLE_NO_INCUMBENT_REQUIRED');
 assert.equal(resp.synthesis.openStarterRole.appointment,false);
 assert.match(resp.synthesis.firstMove,/No existing steward required/);
 assert.match(resp.artifact,/roles\/#role=food-bridge/);
 assert.equal(resp.steps.some(x=>x.name==='Open role invitation'&&x.status==='OPEN'),true);
});
test('browser UI invites interest rather than pretending automatic enrollment',()=>{
 const roleUI=readFileSync(new URL('../public/roles/app.mjs',import.meta.url),'utf8');
 const rolePage=readFileSync(new URL('../public/roles/index.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const unified=readFileSync(new URL('../public/unified.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(roleUI,/fetch\s*\(|sendBeacon|localStorage|sessionStorage/);
 assert.match(roleUI,/navigator\.share/);
 assert.match(rolePage,/I.m interested/);
 assert.match(main,/href="\/roles\/"/);
 assert.match(unified,/s\.openStarterRole/);
 assert.match(unified,/\/roles\/#role=/);
});
