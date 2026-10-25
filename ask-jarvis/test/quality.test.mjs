import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assemble} from '../src/worker.mjs';
import {verifyReturn} from '../public/evidence.mjs';
import {rejectPrivatePrompt} from '../src/usage-guard.mjs';

const scenarios=JSON.parse(readFileSync(new URL('../quality/real-world-scenarios.json',import.meta.url),'utf8'));
const mock=async()=>new Response('# Project README\nThis repository discusses possible designs, not verified field work.\n',{status:200});
test('real-world acceptance deck has twelve distinct, public-safe questions',()=>{
 assert.equal(scenarios.schema,'jarvis/real-world-quality-v1');
 assert.equal(scenarios.cases.length,12);
 assert.equal(new Set(scenarios.cases.map(x=>x.id)).size,12);
 for(const c of scenarios.cases){
  assert.ok(c.question.length>=8&&c.question.length<=360,c.id);
  assert.equal(rejectPrivatePrompt(c.question),null,c.id);
  assert.ok(c.expected.length>=3&&c.risk.length>20,c.id);
 }
 const lanes=new Set(scenarios.cases.map(c=>c.lane));
 for(const lane of ['food_access','church_music','arts','independent','independent_live','adversarial','privacy'])
  assert.ok(lanes.has(lane),lane);
});
test('all twelve questions generate a verified fallback card without model inference',async()=>{
 for(const {id,question} of scenarios.cases) {
  const answer=await assemble(question,mock);
  assert.equal(answer.schema,'ask-jarvis/return-v0',id);
  assert.equal(answer.question,question,id);
  assert.equal(await verifyReturn(answer),true,id);
  assert.ok((answer.return?.body||'').length>8,id);
 }
});
test('external-time queries are not converted into confirmed live facts',async()=>{
 const x=await assemble(scenarios.cases.find(x=>x.id==='LOCAL-TIME-SENSITIVE').question,mock);
 assert.ok(!/library closes at \d{1,2}/i.test(JSON.stringify(x.return)));
});

test('public quality-lab is account-free, local-only, and has independent question handoffs',()=>{
 const html=readFileSync(new URL('../public/quality-lab.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/quality-lab.mjs',import.meta.url),'utf8');
 const homepage=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(homepage,/quality-lab.html/);
 assert.match(html,/How useful was the actual reply/);
 assert.match(html,/No account, analytics, automatic uploads or contacts/);
 assert.match(js,/makeHandoffLink/);
 assert.match(js,/noExternalSubmission:true/);
 assert.match(js,/new Blob/);
 assert.doesNotMatch(js,/fetch\(/);
 assert.doesNotMatch(js,/localStorage\.|sessionStorage\./);
});
