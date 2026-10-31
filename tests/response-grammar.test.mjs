import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROOTS, resolvePath, makeCard, asPlainText, SCHEMA } from '../response-grammar/grammar.mjs';

const original = { context: 'The food shelf needs a delivery', path: ['offer','transport'], note: 'I might have a car Tuesday.' };

test('seven human response roots, each meaningfully refined', () => {
  assert.deepEqual(ROOTS.map(x => x.id), ['notice', 'play', 'feel', 'ask', 'offer', 'invite', 'boundary']);
  for (const root of ROOTS) assert.ok(root.next.length >= 3);
});
test('bare acknowledgment works without context; never implies promise', () => {
  const card = makeCard({path:['notice']});
  assert.equal(card.schema, SCHEMA);
  assert.equal(card.response.kind, 'acknowledgment');
  assert.equal(card.context.text, null);
  assert.equal(card.permission, 'NONE');
  assert.equal(card.acceptance, 'NOT_ESTABLISHED');
  assert.equal(card.action, 'NOT_PERFORMED');
  assert.equal(card.delivery, 'NOT_SENT');
});
test('paths become more specific only by explicit selection', () => {
  const initial = makeCard({context:'Need a ride',path:['feel']});
  const deeper = makeCard({context:'Need a ride',path:['feel','concerned','wellbeing']});
  assert.equal(initial.response.selected,'I feel something.');
  assert.equal(deeper.response.selected,'About well-being.');
  assert.equal(deeper.response.kind, 'self_report');
  assert.deepEqual(deeper.response.path,['feel','concerned','wellbeing']);
});
test('question asks but does not become consent, offer or delivery', () => {
  const card = makeCard({context:'Could you use help?',path:['ask','need']});
  assert.equal(card.response.kind,'inquiry');
  assert.equal(card.obligation,'NONE');
  assert.equal(card.status,'LOCAL_DRAFT');
});
test('offer must name a particular, remains unverified draft', () => {
  assert.throws(() => makeCard({path:['offer','food']}),/needs a stated context/);
  const card = makeCard(original);
  assert.equal(card.response.kind,'offer_draft');
  assert.equal(card.identity,'NOT_VERIFIED');
  assert.equal(card.acceptance,'NOT_ESTABLISHED');
  assert.equal(card.response.own_words,'I might have a car Tuesday.');
});
test('invitation must name context and cannot silently accept', () => {
  assert.throws(() => makeCard({path:['invite','try']}),/needs a stated context/);
  assert.equal(makeCard({context:'Neighborhood cleanup',path:['invite','try']}).acceptance,'NOT_ESTABLISHED');
});
test('declination is not converted into engagement or contact consent', () => {
  const card = makeCard({path:['boundary','privacy']});
  assert.equal(card.response.kind,'boundary');
  assert.equal(card.permission,'NONE');
  assert.match(asPlainText(card),/Please do not contact/);
});
test('hostile/out-of-order paths refused', () => {
  for(const p of [[],['offer','concerned'],['notice','here','more'],['__proto__'],['offer',42]]) {
    assert.throws(() => resolvePath(p));
  }
});
test('invalid text and overlong fields refused', () => {
  assert.throws(() => makeCard({path:['notice'],context:'x'.repeat(241)}),/240/);
  assert.throws(() => makeCard({path:['notice'],note:'x'.repeat(181)}),/180/);
  assert.throws(() => makeCard({path:['notice'],context:5}),/must be text/);
});
test('no data leakage through caller mutation or generated state', () => {
  const input = structuredClone(original);
  const card = makeCard(input);
  input.path.push('wrong'); input.note = 'changed';
  assert.deepEqual(card.response.path,['offer','transport']);
  assert.equal(card.response.own_words,'I might have a car Tuesday.');
  assert.equal(JSON.stringify(makeCard(original)),JSON.stringify(card));
});
test('readable draft never claims delivery', () => {
  const words = asPlainText(makeCard(original));
  assert.match(words,/In response to:/);
  assert.match(words,/Not sent/);
  assert.throws(() => asPlainText({schema:'forged'}));
});
test('offline first: no external scripts, forms, storage or analytics', () => {
  const html = readFileSync(new URL('../response-grammar/index.html', import.meta.url),'utf8');
  const app = readFileSync(new URL('../response-grammar/app.mjs', import.meta.url),'utf8');
  assert.match(html,/type="module" src="\.\/app\.mjs"/);
  assert.doesNotMatch(html,/<form\b|https?:\/\/|<iframe\b/i);
  assert.doesNotMatch(app,/\bfetch\s*\(|localStorage|indexedDB|XMLHttpRequest|sendBeacon|WebSocket|new\s+EventSource/);
});

test('a joking person is not silently treated as a spammer or making an offer', () => {
  const card = makeCard({ context:'southpark!', path:['play','absurd'], note:'who framed Roger Rabbit' });
  assert.equal(card.response.kind, 'playful_expression');
  assert.equal(card.response.own_words, 'who framed Roger Rabbit');
  assert.equal(card.action, 'NOT_PERFORMED');
  assert.equal(card.obligation, 'NONE');
});
