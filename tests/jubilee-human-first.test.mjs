import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROLES} from '../jubilee/invite.mjs';
const html=readFileSync(new URL('../jubilee/index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../jubilee/main.mjs',import.meta.url),'utf8');
test('every Jubilee role is a visible one-tap action before the worksheet',()=>{
 const hero=html.indexOf('id="jubilee-first-title"');
 const form=html.indexOf('id="invitation-form"');
 assert.ok(hero>0&&form>hero);
 for(const role of Object.keys(ROLES))assert.ok(html.includes('data-jubilee-role="'+role+'"'),role);
 assert.match(html,/id="jubilee-quick-text"/);
 assert.match(html,/id="jubilee-quick-next"/);
 assert.match(html,/<option value="" selected disabled>Choose a way to help<\/option>/);
 assert.match(html,/<input id="public-only" type="checkbox" required>/);
});
test('role and words are copied locally without a network request or inferred consent',()=>{
 assert.match(script,/roleSelect\.value=role/);
 assert.match(script,/offerInput\.value=text/);
 assert.match(script,/new Event\('input'/);
 assert.doesNotMatch(script,/\bfetch\s*\(|localStorage|sessionStorage|XMLHttpRequest|\.submit\s*\(/);
 assert.doesNotMatch(script,/public-only.*checked\s*=\s*true/);
});
