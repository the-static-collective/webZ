import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeTableSeedLink,readTableSeed,draftFromQuestion} from '../public/table-bridge.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const jarvis=read('../public/index.html');
const client=read('../public/app.mjs');
const tables=read('../public/tables/index.html');
const receiver=read('../public/tables/app.mjs');

test('one deliberate same-site handoff carries only a public-safe question',()=>{
 const question='Could we ask neighbors to host a grocery table before promising a store?';
 const url=new URL(makeTableSeedLink('https://abundent.org/?via=anything#old',question));
 assert.equal(url.origin,'https://abundent.org');
 assert.equal(url.pathname,'/tables/');
 assert.equal(url.search,'');
 assert.deepEqual([...new URLSearchParams(url.hash.slice(1)).keys()],['from','q']);
 assert.equal(readTableSeed(url.hash),question);
 assert.deepEqual(draftFromQuestion(readTableSeed(url.hash)),{title:'A table for one question',purpose:question,shortened:false});
});
test('unicode survives URL round trip without synthetic identity or attendee metadata',()=>{
 const question='Could neighbors gather for soup and music? 🌱✳';
 const link=new URL(makeTableSeedLink('https://abundent.org/',question));
 assert.equal(readTableSeed(link.hash),question);
 assert.ok(!/invite=|host=|attendees=|rsvp=/i.test(link.hash));
});
test('unsupported, duplicate, oversized and contact-bearing arrivals fail closed',()=>{
 for(const q of ['short','Please call 612-555-1234 to discuss it','Send mail to a@b.com for contact', 'x'.repeat(361)])
  assert.throws(()=>makeTableSeedLink('https://abundent.org/',q),/PUBLIC_SAFE_QUESTION/);
 assert.throws(()=>makeTableSeedLink('http://somewhere.example/','A real and usable question?'),/HTTPS_REQUIRED/);
 for(const hash of [
  '', '#from=jarvis&q=short', '#from=jarvis&q=Reach+me+at+612-555-1234',
  '#from=jarvis&q=Eight+character+question%3F&q=second',
  '#from=jarvis&q=Can+we+organize+a+table%3F&run=1',
  '#from=calendar&q=Can+we+organize+a+table%3F',
  '#from=jarvis', '#'+ 'A'.repeat(5001)
 ]) assert.equal(readTableSeed(hash),null,hash.slice(0,100));
});
test('long questions remain visible as originals and only a clearly marked shortened draft enters the invite editor',()=>{
 const original='Is it possible to organize a shared community grocery, dinner night, and repair clinic without assuming that any participant is a volunteer or that any organization has endorsed the idea? '+
  'What could people freely offer without making a permanent commitment, and how would we find the next appropriate table?';
 assert.ok(original.length>270);
 const draft=draftFromQuestion(original);
 assert.equal(draft.shortened,true);
 assert.ok(draft.purpose.endsWith('…'));
 assert.ok(draft.purpose.length<=270);
 assert.notEqual(draft.purpose,original);
 assert.ok(original.startsWith(draft.purpose.slice(0,-1)));
});
test('UI offers only an explicit click from verified JAR;VIS result; arrival remains editable, unsent',()=>{
 assert.match(jarvis,/id="start-table-from-question"/);
 assert.match(client,/makeTableSeedLink\(window\.location\.href,last\.question\)/);
 assert.match(client,/window\.location\.assign\(link\)/);
 assert.match(tables,/id="jarvis-seed"/);
 assert.match(tables,/id="seed-question"/);
 assert.match(tables,/id="seed-disclosure"/);
 assert.match(receiver,/readTableSeed\(window\.location\.hash\)/);
 assert.match(receiver,/window\.history\.replaceState/);
 assert.match(receiver,/fill\(\{title:draft\.title,purpose:draft\.purpose,date:/);
 assert.match(receiver,/if\(arrival\)/);
 assert.doesNotMatch(receiver,/\bfetch\(|localStorage|sessionStorage/);
});
