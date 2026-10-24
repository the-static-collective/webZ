import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{assemble,CAPABILITIES} from '../src/worker.mjs';
const mock=async()=>new Response('# First-party project\nA public inspectable source that describes capabilities without committing a venue.\n');
test('source inspection remains bounded and no project execution is run',async()=>{
 const r=await assemble('Could Harmony Park host a small music and arts gathering?',mock,{kind:'plan'});
 assert.equal(r.schema,'ask-jarvis/return-v0');
 assert.equal(r.mode,'LIVE_PUBLIC_SOURCE_INSPECTION_ONLY');
 assert.equal(r.sources.length,3);
 assert.equal(r.sources.filter(s=>s.status==='INSPECTED').length,3);
 assert.equal(r.return.kind,'plan');
 assert.equal(r.encounter.topic,'event');
 assert.match(r.return.body,/venue|host/i);
 assert.match(r.return.body,/costs|budget/i);
 assert.match(r.return.body,/no event|no.*booking/i);
 assert.notEqual(r.nextQuestion,'What is the smallest public-safe, permission-respecting experiment that would move this question forward?');
 assert.equal(r.workbenchRequest.dispatch,'MANUAL_EXPORT_ONLY');
 assert.equal(r.workbenchRequest.authority,'NONE');
 assert.ok(r.steps.some(s=>s.name==='GHoT / project execution'&&s.status==='NOT_RUN'));
 assert.ok(r.steps.some(s=>s.name==='reLATTE boundary'&&s.status==='UNSIGNED'));
 assert.ok(/^sha256:[a-f0-9]{64}$/.test(r.receiptHash));
});
test('real source unavailable is reported as HOLD, not fabricated',async()=>{
 const r=await assemble('Could we plan a music festival?',async()=>{throw Error('offline')},{kind:'plan'});
 assert.ok(r.sources.every(s=>s.status==='UNAVAILABLE'));
 assert.match(r.guidance,/could not verify/i);
});
test('source and consent boundaries remain explicit',async()=>{
 assert.ok(CAPABILITIES.length>=6);
 let called=false;
 await assert.rejects(()=>assemble('Reach me at example@example.com',async()=>{called=true;return mock()}),/PRIVATE_CONTACT/);
 assert.equal(called,false);
 const health=await worker.fetch(new Request('https://local.test/api/health'),{});
 assert.equal(health.status,200);
 const data=await health.json();
 assert.equal(data.release,'public-return-003');
 assert.ok(data.returns.includes('plan'));
});
