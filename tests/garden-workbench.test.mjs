import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const atlas=readFileSync(new URL('../garden/index.html',import.meta.url),'utf8');
const desk=readFileSync(new URL('../garden/workbench/index.html',import.meta.url),'utf8');
test('Garden atlas links to the working center',()=>{
  assert.match(atlas,/href="\/workbench\/"/);
  assert.match(atlas,/Independent working proposal/);
});
test('Workbench has four concrete next-action questions and consent boundaries',()=>{
  for(const str of ['Who owns the first experiment?','Would three producers want to talk?','What would one safe handoff require?','How will the town know what happened?','not an official cooperative','PROPOSED — NOT SENT'])assert.ok(desk.toLowerCase().includes(str.toLowerCase()),str);
});
test('Workbench keeps local drafts separate from opt-in private submission',()=>{
  assert.match(desk,/https:\/\/abundent.org\/tables\/live\//);
  assert.match(desk,/https:\/\/abundent.org\/contact\//);
  assert.match(desk,/e.preventDefault\(\)/);
  assert.match(desk,/card.textContent/);
  assert.doesNotMatch(desk,/<script[^>]+src=/i);
  assert.match(desk,/garden-ledger/);
  assert.match(desk,/reviewConsent/);
  assert.match(desk,/consentToReview:true/);
  assert.match(desk,/as PENDING/);
  assert.match(desk,/withdrawKey/);
  assert.match(desk,/g.entries/);
  assert.match(desk,/textContent/);
  assert.doesNotMatch(desk,/\blocalStorage\b/i);
});
test('Workbench is a standalone HTML document',()=>{
  assert.match(desk,/^<!doctype html>/i);
  assert.match(desk,/<meta name="viewport"/);
  assert.match(desk,/@media print/);
  assert.match(desk,/<\/body><\/html>$/);
});


test('Garden backend is source-limited, nonpublishing and access-controlled',()=>{
 const api=readFileSync(new URL('../garden/workbench/server/garden-ledger/index.ts',import.meta.url),'utf8');
 for(const pattern of [/PUBLIC_SUMMARY_APPROVED/,/sourceRepo!==['"]GRAFT['"]/,/awaiting_approved_main/,/eq\('status','PUBLIC'\)/,/status:'PENDING'/,/consentToReview!==true/,/ORIGIN_REQUIRED/,/garden_consume_quota/,/withdraw_hash/,/limit\(35\)/])assert.match(api,pattern);
 assert.doesNotMatch(api,/INSERT INTO.*service_role/);
 assert.doesNotMatch(api,/https?:\/\/[^\s'"]+\/private\//);
});
