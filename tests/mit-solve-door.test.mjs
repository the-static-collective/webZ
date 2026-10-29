import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('../bridge/mit-solve/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../docs/MIT-SOLVE-2027-LIVING-SUITCASE.md',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../bridge/index.html',import.meta.url),'utf8');

test('MIT doorway is reachable through existing Bridge and identifies official challenge',()=>{
 assert.match(bridge,/href="\.\/mit-solve\/"/);
 assert.match(page,/2027 Global Economic Prosperity|Economic Prosperity/);
 assert.match(page,/solve\.mit\.edu\/challenges\/2027-global-economic-prosperity-challenge/);
 assert.match(page,/November 6, 2026/);
 assert.match(source,/November 6, 2026/);
});
test('public page has no outbound scripts, forms, network data collection or PII',()=>{
 assert.match(page,/script-src 'none'/);
 assert.match(page,/connect-src 'none'/);
 assert.match(page,/form-action 'none'/);
 assert.doesNotMatch(page,/<script|<form|<input|\bfetch\s*\(|localStorage|sessionStorage/i);
 assert.match(page,/noindex,nofollow/);
});
test('separate source ownership and unearned proof are explicit',()=>{
 for(const wording of ['no completed physical installer','not yet verified','No verified beneficiaries',
  'No MIT Solve application','Component','Privacy']) {
  assert.match(page.toLowerCase(),new RegExp(wording.toLowerCase(),'i'),wording);
 }
 assert.match(source,/PROTOTYPE_COMPONENT != INTEGRATED_PRODUCT/);
 assert.match(source,/SIGNED != TRUE/);
 assert.match(source,/No real beneficiaries|0 verified/i);
 assert.match(source,/Church.*participation is not required/i);
});
test('MIT application packet is subject to evidence, eligibility and user-controlled submission',()=>{
 assert.match(source,/concept-stage/i);
 assert.match(source,/working prototype/);
 assert.match(source,/before Nov 6, 2026, noon EST/);
 assert.match(source,/draft != submitted/i);
 assert.match(source,/AI guidance/);
 assert.match(source,/no-exaggeration/i);
});

test('machine-readable doorway carries no fictional institutional authority',()=>{
 const packet=JSON.parse(readFileSync(new URL('../bridge/mit-solve/doorway.json',import.meta.url),'utf8'));
 assert.equal(packet.schema,'abundent/mit-solve-door-v1');
 assert.equal(packet.application.state,'DRAFT_NOT_SUBMITTED');
 assert.equal(packet.application.partner_count_verified,0);
 assert.equal(packet.application.recipient_count_verified,0);
 assert.equal(packet.pilot.first_table_observed,false);
 assert.equal(packet.pilot.completion_observed,false);
 assert.equal(packet.pilot.reviewed_real_result,false);
 assert.equal(packet.risk_policy.auto_contacts,false);
 assert.equal(packet.risk_policy.auto_submits,false);
 assert.equal(packet.risk_policy.global_discoverability,false);
 assert.equal(packet.opportunity.deadline_local,'2026-11-06T11:00:00-06:00');
 assert.equal(packet.core_fabric.length,6);
 for(const c of packet.core_fabric)assert.ok(c.source.startsWith('https://github.com/the-static-collective/'));
});
