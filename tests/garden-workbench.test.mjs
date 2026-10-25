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
test('Workbench includes account-free live table and contact, no direct collection',()=>{
  assert.match(desk,/https:\/\/abundent.org\/tables\/live\//);
  assert.match(desk,/https:\/\/abundent.org\/contact\//);
  assert.match(desk,/e.preventDefault\(\)/);
  assert.match(desk,/card.textContent/);
  assert.doesNotMatch(desk,/<script[^>]+src=/i);
  assert.doesNotMatch(desk,/\bfetch\s*\(/i);
  assert.doesNotMatch(desk,/\blocalStorage\b/i);
});
test('Workbench is a standalone HTML document',()=>{
  assert.match(desk,/^<!doctype html>/i);
  assert.match(desk,/<meta name="viewport"/);
  assert.match(desk,/@media print/);
  assert.match(desk,/<\/body><\/html>$/);
});
