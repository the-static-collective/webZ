import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ghostCut,relayInvitation,helperReply,NATIVE_BLACKSTAR_PIN} from '../public/still-here/provenance.mjs';

const html=readFileSync(new URL('../public/still-here/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/still-here/app.mjs',import.meta.url),'utf8');
const relay=readFileSync(new URL('../public/still-here/relay.mjs',import.meta.url),'utf8');

test('Black Star is actual pinned donor source reached from the local-only UI',()=>{
  assert.equal(NATIVE_BLACKSTAR_PIN,'08f42f769f9590d78b85c8d84358e1791d5bd318');
  assert.match(html,/GRAFT\/archive\/08f42f769f9590d78b85c8d84358e1791d5bd318\.zip/);
  assert.match(html,/GRAFT\/tree\/graft\/black-star/);
  assert.match(html,/GRAFT\/tree\/graft\/reconstruction-001/);
  assert.match(html,/id="export-cut"/);
  assert.match(html,/blackstar --json validate-cut/);
  assert.match(app,/export const timeline=\[\]/);
  assert.match(app,/event-discovered/);
  assert.match(html,/data-door="blackstar"/);
});
test('Native Ghost Cut contract preserves source encounter clock distinct from occurrence',()=>{
  const events=[
    {when:'2025-01-01T08:00',learnedAt:'2025-05-01T12:00',basis:'Document or message I possess',account:'VERY SENSITIVE THIRD PARTY ACCOUNT',original:'phone number and name',unknown:'Unknown private location'},
    {when:'2025-02-01T08:00',learnedAt:'',basis:'Reported to me by someone else',account:'Another PRIVATE allegation'},
    {when:'2025-03-01T08:00',learnedAt:'2099-01-01T08:00',basis:'Inferred, not confirmed',account:'Future item'}
  ];
  const cut=ghostCut(events,'2026-10-26T12:00:00Z');
  assert.deepEqual(Object.keys(cut).sort(),['cut_id','observer','focus','knowledge_horizon','carriers','decoder','stance','projection','withheld','counterpressure','fog','authority'].sort());
  assert.equal(cut.carriers.length,1);
  assert.equal(cut.carriers[0].carrier_id,'local-event-001');
  assert.equal(cut.carriers[0].contact,false);
  assert.match(cut.carriers[0].discovered_at,/2025-05-01/);
  assert.equal(cut.withheld.length,2);
  assert.equal(cut.authority,'projection_only');
  assert.equal(cut.projection,null);
  assert.deepEqual(cut.counterpressure,[]);
  const text=JSON.stringify(cut);
  for(const sensitive of ['VERY SENSITIVE','PRIVATE allegation','phone number and name','Unknown private location','Future item']){
    assert.equal(text.includes(sensitive),false,'cut must not include narrative: '+sensitive);
  }
  const duplicate=ghostCut(events,'2026-10-26T12:00:00Z');
  assert.deepEqual(cut,duplicate);
});
test('Invitation chain is an explicit small human request, never transferable authority',()=>{
  const invite=relayInvitation('listen for 20 minutes without judging the story','within the next 24 hours');
  assert.match(invite,/20 minutes/);
  assert.match(invite,/ask my permission/i);
  assert.match(invite,/no is completely okay/i);
  assert.doesNotMatch(invite,/automatically forward|you must|verify this allegation/i);
  for(const kind of ['can','smaller','permission','decline'])assert.ok(helperReply(kind).length>20);
  assert.match(helperReply('permission'),/explicitly say yes/);
  assert.match(helperReply('decline'),/won't forward/);
});
test('No local story transmitted, implicitly stored or injected through browser links',()=>{
  assert.doesNotMatch(relay,/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|XMLHttpRequest|\binnerHTML\s*=/);
  assert.doesNotMatch(relay,/location\.(search|hash)|URLSearchParams/);
  assert.match(relay,/navigator\.share/);
  assert.match(relay,/relay-share'\)\.addEventListener\('click'/);
  assert.match(relay,/\.textContent=/);
  assert.match(relay,/URL\.createObjectURL/);
  assert.match(html,/Nothing (typed|has been invited)/);
  assert.match(html,/type="module"/);
  assert.doesNotMatch(html, /\sstyle="/);
});
