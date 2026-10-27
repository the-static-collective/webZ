import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL(path, import.meta.url),'utf8');
const page=read('../public/still-here/founding/index.html');
const parent=read('../public/still-here/start/index.html');
const home=read('../public/index.html');
const governance=read('../STILL-HERE-FIRST-CIRCLE-001.md');

test('the first circle is explicitly only a founding workshop and unstaffed',()=>{
  assert.match(page,/founding workshop only/i);
  assert.match(page,/No second chair, qualified facilitator, survivor roster/i);
  assert.match(page,/The group is not yet operating/i);
  assert.match(governance,/self-declared/i);
  assert.match(governance,/independent review pending/i);
  assert.match(governance,/unfilled/i);
});

test('the first circle tests safeguarding with fictional cases before participants',()=>{
  assert.match(page,/fictional examples only/i);
  for(const item of ['impostor','recording','founder','withdrawal','independent']){
    assert.ok((page+governance).toLowerCase().includes(item),item);
  }
  assert.match(governance,/Any unchecked item = no live survivor circle/i);
  assert.match(page,/no survivor group, anonymous matching, case submissions/i);
  assert.match(governance,/No one must disclose trauma/i);
  assert.match(governance,/cannot independently dispose of concerns about themselves/i);
});

test('page stays static, no sensitive intake, contact, analytics or automatic messaging',()=>{
  assert.match(parent,/href="\/still-here\/founding\/"/);
  assert.match(page,/meta name="referrer" content="no-referrer"/);
  assert.match(page,/name="robots" content="index,follow"/);
  assert.match(page,/window\.print\(\)/);
  assert.match(page,/navigator\.clipboard\?\.writeText/);
  for(const forbidden of [
    /<form\b/i, /<input\b/i, /<textarea\b/i, /<iframe\b/i,
    /\bfetch\s*\(/i, /sendBeacon/i, /XMLHttpRequest/i,
    /localStorage/i, /sessionStorage/i, /navigator\.share/i,
    /<script\s+src=/i, /<link\s+rel="preload"/i,
    /thehotline\.org/i, /800-799-7233/i, /hotline/i
  ]){
    assert.doesNotMatch(page,forbidden,String(forbidden));
  }
});

test('a visitor need not know anyone, and discovery routes through a bounded voluntary desk',()=>{
  assert.match(page,/No existing friend or personal network is required/i);
  assert.match(governance,/no personal-friend prerequisite/i);
  assert.match(page,/href="\/contact\/"/i);
  assert.match(page,/volunteer contact desk/i);
  assert.match(home,/href="\/still-here\/founding\/"/i);
  assert.match(home,/Self-guided private tools available even if you know no one/i);
  assert.doesNotMatch(page,/Invite one known, consenting adult/i);
  assert.doesNotMatch(governance,/send one safe review invitation to a trusted adult/i);
  assert.match(governance,/no automated match/i);
});

test('no participant identity or attendance is treated as a process receipt',()=>{
  assert.match(governance,/no central archive of survivor testimony/i);
  assert.match(governance,/A signed HOLD is not admission/i);
  assert.match(governance,/never copied into common group records/i);
  assert.match(governance,/not invented volunteers/i);
  assert.match(page,/No member count, no attendance tracking/i);
});
