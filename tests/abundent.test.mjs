import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const home=new URL('../abundent/index.html',import.meta.url);
const cssURL=new URL('../abundent/threshold.css',import.meta.url);
const html=await readFile(home,'utf8');
const css=await readFile(cssURL,'utf8');
const doors=[...html.matchAll(/<a data-door="([^"]+)" href="([^"]+)"/g)].map(([,id,href])=>({id,href}));
test('ABUNDENT-THRESHOLD-001 offers exactly six honest, navigable doors',async()=>{
  assert.deepEqual(doors.map(d=>d.id),['explore','grow','listen','post','make','witness']);
  assert.deepEqual(doors.map(d=>d.href),[
    '../worlds/sanctuary/','../field/','https://thestaticcollective.bandcamp.com/','../porch/','../press/','../proof/'
  ]);
  for(const {href} of doors.filter(d=>d.href.startsWith('../'))){
    assert.ok(!href.includes('?')&&!href.includes('#'));
    await access(new URL(href+'index.html',home));
  }
  await access(new URL('../app/icon.svg',home));
  await access(cssURL);
});
test('no automatic transport, third-party resource, forms, or executable script in threshold',()=>{
  assert.match(html,/script-src 'none'/);
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/form-action 'none'/);
  assert.doesNotMatch(html,/<script\b|<form\b|<iframe\b|<audio\b|<video\b|<img\b/i);
  assert.doesNotMatch(html,/<(?:link|script|img|source)\\b[^>]*(?:src|href)="https?:\\/\\//i);
});
test('remote destinations are only explicit user-click links',()=>{
  const remote=[...html.matchAll(/<a\b[^>]*href="(https:\/\/[^"]+)"[^>]*>/g)].map(m=>m[0]);
  assert.equal(remote.length,3);
  assert.ok(remote.every(s=>/rel="noreferrer noopener"/.test(s)));
  assert.ok(remote.some(s=>/bandcamp\.com/.test(s)));
  assert.ok(remote.some(s=>/gitbook\.io/.test(s)));
  assert.ok(remote.some(s=>/github\.com/.test(s)));
  assert.doesNotMatch(html,/<(?:link|script|img|source)\b[^>]*(?:src|href)="https?:\/\//i);
});
test('capability labels distinguish the present from future services',()=>{
  for(const label of ['LOCAL WORLD','INSPECTION ONLY','EXTERNAL MUSIC SITE','LOCAL DRAFT ONLY','LOCAL PROPOSAL ONLY','LOCAL VERIFICATION']){
    assert.ok(html.includes(label),label);
  }
  for(const plain of ['No account. No automatic upload.','No delivery yet.','not uploads, payments, orders, or published works','not recorded activity']){
    assert.ok(html.includes(plain),plain);
  }
  assert.match(html,/The Front Room/);
  assert.match(html,/The Static Collective/);
});
test('entrance is usable with narrow screens, keyboard, and reduced motion',()=>{
  assert.match(html,/class="skip" href="#main"/);
  assert.match(html,/<main id="main">/);
  assert.match(html,/<nav aria-label="This entrance">/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/@media\(max-width:360px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/min-height:44px/);
  assert.doesNotMatch(css,/@import|url\(https?:\/\//i);
});
test('the existing root remains webZ; Abundent is a staged entrance',async()=>{
  const root=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(root,/data-page="landing"/);
  assert.match(root,/A porch for/);
  assert.doesNotMatch(root,/ABUNDENT-THRESHOLD-001/);
});
