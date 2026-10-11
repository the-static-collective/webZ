import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = readFileSync(new URL('../week/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../week/week.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../week/week.css', import.meta.url), 'utf8');
test('listening room has seven accessible static letters and fourteen unique tracks', () => {
  assert.equal((page.match(/class="day"/g) || []).length, 7);
  const ids = [...page.matchAll(/href="https:\/\/suno\.com\/song\/([0-9a-f-]{36})"/g)].map(match => match[1]);
  assert.equal(ids.length, 14);
  assert.equal(new Set(ids).size, 14);
  assert.equal((page.match(/<option value="[0-9a-f-]{36}"/g) || []).length, 14);
  assert.match(page, /<title>a week together/);
  assert.match(page, /https:\/\/suno\.com\/album\/7c2ca64a-32ed-4477-a7cb-e00d1a14c9bf/);
});
test('postcard has explicit share actions without subscription or collection backend', () => {
  for (const id of ['song','note','sms','email','native','copy','share-status']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.doesNotMatch(page, /<form|<input[^>]+type="email"|<script[^>]+src="https:/i);
  assert.match(script, /navigator\.share/);
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /encodeURIComponent/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sendBeacon|XMLHttpRequest|addressbook/i);
});
test('styling and public source have no injected inline scripts or CSS imports', () => {
  assert.doesNotMatch(page, /<script(?![^>]*src=)/);
  assert.doesNotMatch(css, /@import/);
  assert.match(page, /Content-Security-Policy/);
  assert.match(css, /prefers-reduced-motion/);
});
