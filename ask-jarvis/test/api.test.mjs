import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import handler from '../api/ask.js';
import healthHandler from '../api/health.js';

test('both health adapters identify the public return release and manual-only bridge',async()=>{
  const expected=await (await worker.fetch(new Request('https://test/api/health'),{})).json();
  let actual;
  const res={setHeader(){},status(){return this;},json(value){actual=value;}};
  await healthHandler({method:'GET'},res);
  assert.equal(actual.release,'public-return-008');
  assert.deepEqual(actual.returns,expected.returns);
  assert.equal(actual.bridge,'manual-export-only');
  assert.ok(actual.returns.includes('plan'));
});

test('Worker bounds chunked input, rejects invalid kinds and methods before source fetch', async()=>{
  const huge=new Request('https://test/api/ask',{method:'POST',body:JSON.stringify({question:'x'.repeat(2000)})});
  assert.equal((await worker.fetch(huge,{})).status,413);
  for(const kind of ['execute',{},2]) {
    const req=new Request('https://test/api/ask',{method:'POST',body:JSON.stringify({question:'Please prepare a useful draft',kind})});
    assert.equal((await worker.fetch(req,{})).status,422);
  }
  assert.equal((await worker.fetch(new Request('https://test/api/ask'),{})).status,405);
});

test('Vercel and Worker compose the same explicit return contract', async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response('# Public source\nA source-owned document for read-only inspection.');
  try {
    const body={question:'Make something useful from this question',kind:'song'};
    const workerReply=await worker.fetch(new Request('https://test/api/ask',{method:'POST',body:JSON.stringify(body)}),{});
    assert.equal(workerReply.status,200);
    assert.equal((await workerReply.json()).return.kind,'song');
    let status,reply;const headers={};
    const res={setHeader(k,v){headers[k]=v;},status(n){status=n;return this;},json(value){reply=value;return this;}};
    await handler({method:'POST',body},res);
    assert.equal(status,200);
    assert.equal(reply.return.kind,'song');
    assert.equal(headers['Cache-Control'],'no-store');
    assert.equal(reply.workbenchRequest.authority,'NONE');
    await handler({method:'POST',body:{question:'🌱'.repeat(180),extra:'🌱'.repeat(300)}},res);
    assert.equal(status,413,'Vercel body budget counts UTF-8 bytes');
  } finally {globalThis.fetch=originalFetch;}
});

test('Vercel /api/ask and Worker both honor the exact same explicit triad source cut',async()=>{
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response('# Owner public source\nAn inspected project reference is not a locally confirmed food need or willing host.');
  try {
    const body={question:'Could a grocery planning group review a public source with a steward?',kind:'question',lens:'triad'};
    let value,status;
    const res={setHeader(){},status(n){status=n;return this;},json(v){value=v;return this;}};
    await handler({method:'POST',body},res);
    assert.equal(status,200);
    assert.deepEqual(value.sources.map(s=>s.id),['alex','3rdi','loadout']);
    assert.equal(value.triad.loadout.nativeBind,false);
    const workerResponse=await worker.fetch(new Request('https://test/api/ask',{method:'POST',body:JSON.stringify(body)}),{});
    const candidate=await workerResponse.json();
    assert.equal(workerResponse.status,200);
    assert.deepEqual(candidate.sources.map(s=>s.id),value.sources.map(s=>s.id));
    assert.deepEqual(candidate.triad.loadout.fenced,value.triad.loadout.fenced);
  } finally {globalThis.fetch=oldFetch;}
});
