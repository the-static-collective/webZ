import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CIRCLES} from '../public/campfire/model.mjs';
import {CHIPS} from '../public/tomorrow-machine.mjs';
const model=JSON.parse(readFileSync(new URL('../aippy/sparkfork-seed-v1.json',import.meta.url),'utf8'));
const ids=a=>a.map(x=>x.id);

test('Aippy seed retains campfire choices and Tomorrow Machine inventory vocabulary',()=>{
 assert.equal(model.schema,'abundent/aippy-sparkfork-seed-v1');
 assert.deepEqual(ids(model.rings),ids(CIRCLES));
 assert.deepEqual(ids(model.offerings),CHIPS.map(x=>x[0]));
 assert.equal(new Set(ids(model.offerings)).size,10);
 assert.equal(new Set(ids(model.rings)).size,4);
});
test('no Aippy publication, outsider consent, website deep link or API integration is falsely claimed',()=>{
 assert.equal(model.liveAppUrl,null);
 assert.equal(model.liveDeepLinkVerified,false);
 assert.equal(model.state,'LOCAL_EDITORIAL_TEMPLATE_NOT_PUBLISHED');
 assert.equal(model.privacy.collectsIdentity,false);
 assert.equal(model.privacy.automaticSubmissions,false);
 assert.equal(model.privacy.realWorldAuthority,'NONE');
 assert.equal(model.exportPolicy.deepLinks,false);
 assert.equal(model.exportPolicy.mode,'COPY_OR_NATIVE_SHARE_BY_EXPLICIT_USER_ACTION');
 assert.equal(model.qualityTest.noBackend,true);
});
test('the two-offering recipes are duplicate-free and require real-world permission checks',()=>{
 const known=new Set(ids(model.offerings));
 const seen=new Set();
 for(const recipe of model.recipes){
  assert.equal(recipe.keys.length,2);
  assert.ok(recipe.keys.every(k=>known.has(k)));
  const key=[...recipe.keys].sort().join('+');
  assert.ok(!seen.has(key),'Duplicate combo '+key);seen.add(key);
  assert.ok(recipe.title.length>=8);
  assert.ok(recipe.first.length>=30);
  assert.ok(recipe.gate.length>=24);
 }
 assert.ok(model.genericFallback.first.length>=40);
 assert.equal(model.qualityTest.forceTouchFallback,true);
});
test('Aippy prompt and launch guide are available without embedding any private source',()=>{
 const prompt=readFileSync(new URL('../aippy/SPARKFORK-AIPPY-BUILD-PROMPT.md',import.meta.url),'utf8');
 const guide=readFileSync(new URL('../aippy/README.md',import.meta.url),'utf8');
 assert.match(prompt,/GIVE IT A SPARK/);
 assert.match(prompt,/native.*REMIX|Remix|remix/i);
 assert.match(prompt,/No person or organization has agreed/);
 assert.match(prompt,/no accounts, databases, API calls/i);
 assert.match(prompt,/https:\/\/abundent\.org\//);
 assert.match(guide,/not verified production/i);
 assert.match(guide,/only .*explicitly/i);
 assert.match(guide,/credits/i);
});
