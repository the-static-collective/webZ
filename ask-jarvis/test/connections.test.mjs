import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SOURCE,TOPICS,ORGANIZATIONS,byId,sharedTopics,candidateNeighbors,pairLink} from '../public/connections/data.mjs';

test('CONNECT photo transcription is nonempty, unique and deliberately uncertain',()=>{
 assert.equal(SOURCE.observed,'2026-10-24');
 assert.ok(ORGANIZATIONS.length>=35);
 assert.equal(new Set(ORGANIZATIONS.map(o=>o.id)).size,ORGANIZATIONS.length);
 for(const o of ORGANIZATIONS){
  assert.ok(o.name.length>2);
  assert.equal(o.status,'observed-name-only');
  assert.ok(o.topics.length>=1);
  assert.ok(o.topics.every(t=>Object.hasOwn(TOPICS,t)));
  assert.ok(!o.email&&!o.person&&!o.partner&&!o.contact);
 }
 assert.ok(byId('static-collective'));
 assert.ok(byId('living-earth-center'));
});
test('shared tags are hypotheses, never declared relationships',()=>{
 assert.deepEqual(sharedTopics(byId('lec-garden'),byId('living-earth-center')),['food-land','community']);
 assert.equal(candidateNeighbors('not-here').length,0);
 assert.ok(candidateNeighbors('lec-garden').every(x=>x.shared.length>0));
});
test('two-chair links carry only validated identifiers; old URL data is erased',()=>{
 const safe=pairLink('https://abundent.org/connections/?secret=123#private',['lec-garden','static-collective']);
 const url=new URL(safe);
 assert.equal(url.origin,'https://abundent.org');
 assert.equal(url.pathname,'/connections/');
 assert.equal(url.searchParams.get('pair'),'lec-garden,static-collective');
 assert.equal(url.hash,'');
 assert.ok(!safe.includes('secret'));
 assert.throws(()=>pairLink('https://abundent.org/connections/',['lec-garden','unknown']));
 assert.throws(()=>pairLink('https://abundent.org/connections/',['lec-garden','lec-garden']));
});
test('page has accessible map navigation and no automated outreach',async()=>{
 const html=await readFile(new URL('../public/connections/index.html',import.meta.url),'utf8');
 for(const id of ['board','filters','search','comparison','copy-card','copy-link','print-card','print-sheet']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/not a verified network/i);
 assert.match(html,/no tracking, accounts, automatic invitations or RSVPs/i);
 assert.match(html,/\/tables\//);
});
