import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {suggestDoor} from '../app/wayfinder.mjs';

const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const apps=readFileSync(new URL('../apps/index.html',import.meta.url),'utf8');
const appCode=readFileSync(new URL('../apps/main.mjs',import.meta.url),'utf8');
const source=readFileSync(new URL('../app/wayfinder.mjs',import.meta.url),'utf8');

test('Home starts with a usable one-step question and retains advanced links',()=>{
  assert.ok(home.indexOf('id="first-move-title"')<home.indexOf('id="newspaper-entry"'));
  for(const id of ['wayfinder-input','wayfinder-find','wayfinder-answer'])assert.match(home,new RegExp('id="'+id+'"'));
  for(const text of ['I need a hand','I can help','I want to explore','I have a question'])assert.ok(home.includes(text));
  assert.match(home,/<details class="nav-more">/);
  assert.match(home,/<details><summary>Your local trace/);
});

test('Typing suggests a link without sending or auto navigating',()=>{
  assert.equal(suggestDoor('I need food').href,'https://hello.abundent.org/');
  assert.equal(suggestDoor('I can volunteer').href,'https://abundent.org/tomorrow/');
  assert.equal(suggestDoor('I have a question').href,'https://hello.abundent.org/feedback/');
  assert.equal(suggestDoor('I want to see the music tools').href,'https://apps.abundent.org/');
  assert.equal(suggestDoor('').href,null);
  assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|\.send\s*\(|localStorage|\.assign\s*\(/);
});

test('Switchboard begins with actionable categories before project inventory',()=>{
  for(const category of ['care','community','creative','tools','all'])assert.ok(apps.includes('data-intent-category="'+category+'"'));
  assert.ok(apps.indexOf('id="quick-question"')<apps.indexOf('id="directory"'));
  assert.match(apps,/<details class="advanced-doors">/);
  assert.match(appCode,/function searchFromTop\(\)/);
  assert.match(appCode,/search\.value=quick\.value\.trim\(\)/);
  assert.doesNotMatch(apps,/All 24 Vercel projects/);
});
