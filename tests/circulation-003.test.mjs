import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareFieldQuestion, verifyFieldQuestion, SCHEMA, EVENT, FieldRefusal } from '../circulation/003/packet.mjs';

const root = new URL('../circulation/003/', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const app = readFileSync(new URL('app.mjs', root), 'utf8');
const css = readFileSync(new URL('style.css', root), 'utf8');
const good = {
  kind: 'BUILD',
  text: 'FICTIONAL: Could neighbors compare available meeting spaces with artists?',
  authorRole: 'AUTHOR',
  permissionReviewed: true, privacyReviewed: true
};

test('one public-safe self-attested question is hashed and repeatable without a timestamp or contact', async () => {
  const result = await prepareFieldQuestion(good);
  assert.equal(result.schema, SCHEMA);
  assert.equal(result.event, EVENT);
  assert.equal(result.event_date, '2026-10-24');
  assert.match(result.id, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(result, await prepareFieldQuestion(good));
  assert.equal(await verifyFieldQuestion(result), true);
  assert.equal(result.state, 'UNPUBLISHED_CANDIDATE');
  assert.equal(result.person_authenticated, false);
  assert.equal(result.publication_authorized, false);
  assert.equal(result.organization_endorsed, false);
  assert.equal(result.contact_collected, false);
  assert.equal(result.recipient, 'NONE');
});

test('permission and privacy acknowledgements are mandatory even for the author', async () => {
  await assert.rejects(prepareFieldQuestion({...good, permissionReviewed: false}), FieldRefusal);
  await assert.rejects(prepareFieldQuestion({...good, privacyReviewed: false}), FieldRefusal);
  await assert.rejects(prepareFieldQuestion({...good, authorRole: 'UNKNOWN'}), FieldRefusal);
  await assert.rejects(prepareFieldQuestion({...good, kind: 'FULFILLED'}), FieldRefusal);
});

test('identity-shaped, location/link and sensitive prompts cannot be exported as public questions', async () => {
  const samples = [
    'Contact jane@example.org for those vegetables',
    'Please text 507-555-1212 for a ride',
    'Follow https://example.org/my-personal-story now',
    'Talk to @username about childcare support',
    'Here is my street address and private family problem',
    'my SSN 123-45-6789',
    'short',
    'A'.repeat(181),
    'Should we?\nWith private notes'
  ];
  for (const value of samples) {
    await assert.rejects(prepareFieldQuestion({...good, text: value}), FieldRefusal, value);
  }
});

test('hash and authority fields are tamper-evident but never certify actual consent', async () => {
  const ok = await prepareFieldQuestion(good);
  for (const [key, value] of [
    ['public_question', 'FICTIONAL: Could someone else do this work?'],
    ['recipient_acceptance', true],
    ['person_authenticated', true],
    ['fulfillment_claimed', true],
    ['publication_authorized', true],
    ['organization_endorsed', true],
    ['state', 'ACCEPTED_BY_GROCERY'],
    ['event_date', '2026-10-25']
  ]) {
    await assert.rejects(verifyFieldQuestion({...ok, [key]: value}), FieldRefusal, key);
  }
  await assert.rejects(verifyFieldQuestion({...ok, privatePhone: '5551234567'}), FieldRefusal);
});

test('field kit provides exactly eight physical cards and no in-page data recipient', () => {
  assert.equal((html.match(/class="pocket pocket-/g) ?? []).length, 8);
  for (const kind of ['OFFER', 'NEED', 'BUILD', 'QUESTION']) {
    assert.equal((html.match(new RegExp('class="pocket-type">' + kind, 'g')) ?? []).length, 2);
  }
  assert.match(html, /No one has to write anything down/);
  assert.match(html, /INDEPENDENT COMMUNITY PROTOTYPE/);
  assert.match(html, /No names, contacts, addresses, or stories/);
  assert.match(html, /not independent verification/i);
  assert.match(html, /NO DATA UPLOAD/);
  assert.match(html, /print-sheet/);
  assert.match(css, /@page\{size:8in 10in;margin:0\}/);
  assert.match(css, /grid-template-rows:repeat\(4,2\.5in\)/);
  assert.doesNotMatch(html, /<iframe\b|<script[^>]*https?:|<form[^>]*action=|<input[^>]*type="email"/i);
  assert.doesNotMatch(app, /fetch\s*\(|WebSocket|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|navigator\.geolocation|indexedDB/);
});

test('preview invalidates on every input change and exports only by separate click', () => {
  assert.match(app, /input\.addEventListener\('input', \(\) => \{ discard\(\)/);
  assert.match(app, /await verifyFieldQuestion\(candidate\)/);
  assert.match(app, /link\.click\(\)/);
  assert.match(app, /window\.print\(\)/);
  const build = readFileSync(new URL('../scripts/build-release.mjs', import.meta.url), 'utf8');
  for (const path of ['circulation/003/index.html','circulation/003/style.css','circulation/003/app.mjs','circulation/003/packet.mjs']) {
    assert.ok(build.includes("'" + path + "'"), 'Missing immutable release allowlist ' + path);
  }
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(vercel.git.deploymentEnabled, false);
});
