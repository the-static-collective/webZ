import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeHandoffLink,readHandoff,shareableQuestion} from '../public/cafe.mjs';
import {assemble} from '../src/worker.mjs';
const root=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
const privacy=readFileSync(new URL('../vercel.json',import.meta.url),'utf8');
const fake=async()=>new Response('# Independent project source\nA public source to inspect, but not a venue booking or an owner's consent.\n',{status:200});
test('public café has clear 3-stage interactive entry and keeps originals',()=>{
  for(const s of ['CAFÉ MODE','ONE QUESTION.','id="received-note"','data-kind="plan"','id="copy-question"','id="copy-next"','id="handoff-link"','href="/gather/"','href="/games/tomorrow/"'])assert.ok(root.includes(s),s);
  assert.ok(client.includes('readHandoff(window.location.hash)'));
  assert.ok(client.includes('navigator.clipboard?.writeText'));
  assert.doesNotMatch(client,/localStorage|sessionStorage|serviceWorker/);
  assert.match(privacy,/form-action 'none'/);
});
test('portable link contains the one approved question only, with no POST or server state',()=>{
  const question='How can our neighbors explore a community grocery without making commitments?';
  const url=makeHandoffLink('https://abundent.org/gather/?tracking=123',question,'plan');
  const parsed=new URL(url);
  assert.equal(parsed.pathname,'/');
  assert.equal(parsed.search,'');
  assert.equal(parsed.origin,'https://abundent.org');
  assert.deepEqual(readHandoff(parsed.hash),{question,kind:'plan'});
  assert.equal(new URLSearchParams(parsed.hash.slice(1)).get('q'),question);
});
test('handoffs fail closed for PII, too long, invalid types, unknown flags and malformed URLs',()=>{
  for(const text of ['a@b.com and lots of other words','Contact 612-555-1234 for the gathering','short','x'.repeat(361)]) {
    assert.equal(shareableQuestion(text),false);
    assert.throws(()=>makeHandoffLink('https://abundent.org/',text,'plan'),/SHARING_REQUIRES/);
  }
  assert.throws(()=>makeHandoffLink('https://abundent.org/','A real usable question?', 'execute'),/UNKNOWN_RETURN_KIND/);
  assert.throws(()=>makeHandoffLink('http://example.com/','A real usable question?'),/HTTPS_REQUIRED/);
  assert.equal(readHandoff('#q=short&kind=plan'),null);
  assert.equal(readHandoff('#q=longer+question+here&kind=execute'),null);
  assert.equal(readHandoff('#q=longer+question+here&kind=plan&run=true'),null);
  assert.equal(readHandoff('#q=A+safe+question+indeed%3F&q=second'),null);
});
test('grocery and event plans have genuinely distinct first approaches and stop gates',async()=>{
  const event=await assemble('Could Harmony Park host a small music festival gathering?',fake,{kind:'plan'});
  const food=await assemble('How could we plan a community grocery food-access pilot?',fake,{kind:'plan'});
  const general=await assemble('Can we build a better public website for the neighborhood?',fake,{kind:'plan'});
  assert.equal(event.encounter.topic,'event');
  assert.equal(food.encounter.topic,'grocery');
  assert.match(event.return.body,/venue permission/);
  assert.match(food.return.body,/grocery store/);
  assert.match(food.return.body,/food safety/);
  assert.doesNotMatch(general.return.body,/venue or willing host/);
  assert.notEqual(event.return.body,food.return.body);
  assert.notEqual(event.nextQuestion,food.nextQuestion);
  assert.equal(food.workbenchRequest.dispatch,'MANUAL_EXPORT_ONLY');
  assert.ok(food.steps.some(s=>s.name==='GHoT / project execution'&&s.status==='NOT_RUN'));
  assert.ok(food.sources.every(s=>s.status==='INSPECTED'));
});
