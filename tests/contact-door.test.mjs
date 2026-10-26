import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('public landing page links to consent-based external email compose, never submits visitor data to a backend', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /href="mailto:us@abundent\.org\?subject=Hello%20from%20Abundent"/);
  assert.match(html, /<a[^>]*>Write us<\/a>/);
  assert.doesNotMatch(html, /<form\b/i);
});
