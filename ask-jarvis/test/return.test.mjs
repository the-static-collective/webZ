import test from 'node:test';
import assert from 'node:assert/strict';
import {assemble, CAPABILITIES} from '../src/worker.mjs';

const good = async () => new Response('# Public owner document\nA bounded public source describing its current capabilities.\n');

for (const [question,kind] of [
  ['How could neighbors share extra garden produce?', 'question'],
  ['Can we make a printable invitation to an arts gathering?', 'invitation'],
  ['Where should I start exploring the Static Collective code?', 'door'],
  ['Could you make a little song about a garden?', 'song']
]) test(`composes a useful ${kind} return`, async () => {
  const result = await assemble(question, good);
  assert.equal(result.return.kind, kind);
  assert.equal(result.encounter.schema, 'ask-jarvis/encounter-v1');
  assert.equal(result.encounter.signal, question);
  assert.ok(result.encounter.gaps.length > 0);
  assert.ok(result.return.body.length > 80);
  assert.ok(result.return.nextQuestion.length > 10);
  assert.ok(result.artifact.includes(result.return.body));
  assert.equal(result.workbenchRequest.schema, 'ask-jarvis/workbench-request-v1');
  assert.equal(result.workbenchRequest.dispatch, 'MANUAL_EXPORT_ONLY');
  assert.equal(result.workbenchRequest.authority, 'NONE');
  assert.equal(result.workbenchRequest.task.operation, 'PREPARE_DRAFT');
  assert.ok(result.steps.some(s => s.name === 'TABLElogic encounter' && s.status === 'DONE'));
  assert.ok(result.steps.some(s => s.name === 'Workbench handoff' && s.status === 'PREPARED'));
  if (kind === 'invitation') assert.ok(result.return.body.includes('[choose a place]'));
  if (kind === 'door') assert.ok(result.return.doors.every(d => /\/blob\/[a-f0-9]{40}\//.test(d.url)));
  if (kind === 'song') {
    assert.equal(result.return.song.original, true);
    assert.ok(result.return.song.notes.length >= 16);
    assert.ok(result.return.song.notes.every(n => n.midi >= 48 && n.midi <= 84));
  }
});

test('explicit return kind wins; unknown requests preserve the question and gaps', async () => {
  const q = 'Peux-tu imaginer quelque chose avec moi ?';
  const result = await assemble(q, good, {kind:'invitation'});
  assert.equal(result.return.kind, 'invitation');
  assert.equal(result.encounter.signal, q);
  assert.equal(result.encounter.topic, 'open');
  const auto = await assemble(q, good);
  assert.equal(auto.return.kind, 'question');
  assert.ok(auto.return.nextQuestion.includes('What would'));
  await assert.rejects(() => assemble(q, good, {kind:'execute'}), /RETURN_KIND/);
});

test('sources are full commit pins, never receive question text, and hash original UTF-8 bytes', async () => {
  const q = 'Can we inspect a useful source for this question?';
  const body = '# Évidence 🌱\nAn owner document with Unicode and original byte identity.\n';
  const seen = [];
  const result = await assemble(q, async (url) => {seen.push(url); return new Response(body);});
  assert.equal(seen.length,3);
  assert.ok(CAPABILITIES.every(c=>/^[a-f0-9]{40}$/.test(c.ref)));
  assert.ok(['workbench','tablelogic','planz','cannon','ghot','relatte'].every(id=>CAPABILITIES.some(c=>c.id===id)));
  assert.ok(seen.every(u=>/^https:\/\/raw.githubusercontent.com\/the-static-collective\/[^/]+\/[a-f0-9]{40}\//.test(u)&&!u.includes(q)));
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const expected = 'sha256:'+Buffer.from(bytes).toString('hex');
  assert.ok(result.sources.every(s=>s.sha256===expected));
});

test('oversized and invalid UTF-8 documents fail without partial hashes', async () => {
  for (const make of [
    () => new Response('x'.repeat(90001)),
    () => new Response(new Uint8Array([0xc3,0x28])),
    () => new Response('short',{headers:{'content-length':'90001'}})
  ]) {
    const result = await assemble('Please find a source door for this project', async()=>make());
    assert.ok(result.sources.every(s=>s.status==='UNAVAILABLE'&&s.sha256===null));
    assert.equal(result.return.doors.length,0);
    assert.ok(result.return.body.includes('could not inspect'));
  }
});

test('a stalled response body times out and partial source failures remain distinct', async () => {
  const result = await assemble('Please inspect source code for our project', async (url,{signal}) => {
    if(url.includes('/CANNON/')) return good();
    return new Response(new ReadableStream({start(c){signal.addEventListener('abort',()=>c.error(new Error('timeout')),{once:true});}}));
  });
  assert.ok(result.sources.some(s=>s.status==='UNAVAILABLE'));
  assert.ok(result.sources.some(s=>s.status==='INSPECTED'));
});

test('controls are rejected before whitespace normalization and no source is fetched', async () => {
  let count = 0;
  for (const q of ['Could we make\u0000 a garden?', 'Could we make\u0007 a garden?']) {
    await assert.rejects(()=>assemble(q,()=>{count++;return good();}),/QUESTION_CONTROL/);
  }
  assert.equal(count,0);
});

test('complete downloadable evidence independently verifies; tampering any visible output fails', async () => {
  const {verifyReturn} = await import('../public/evidence.mjs');
  const result = await assemble('Write an invitation to a garden gathering',good);
  assert.equal(await verifyReturn(JSON.parse(JSON.stringify(result))),true);
  for (const mutate of [
    r=>r.return.body+=' changed',
    r=>r.sources[0].source='https://evil.example/',
    r=>r.artifact+=' changed',
    r=>r.guidance='Made up',
    r=>r.steps[0].status='EXECUTED',
    r=>r.workbenchRequest.authority='EXECUTE',
    r=>r.encounter.signal='Another question',
    r=>r.evidence.observedAt='tomorrow'
  ]) {
    const changed=structuredClone(result);mutate(changed);
    assert.equal(await verifyReturn(changed),false);
  }
});
