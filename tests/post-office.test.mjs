import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { embedEndpoint } from '../post-office/subscribe.mjs';
import { BUTTONDOWN_USERNAME } from '../post-office/provider.mjs';

const get = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('newsletter endpoint is provider-owned and public username is strictly validated', () => {
  assert.equal(embedEndpoint('my-newsletter'), 'https://buttondown.com/api/emails/embed-subscribe/my-newsletter');
  for (const bad of ['', '../secret', 'https://evil.test', 'new sletter', 'x/anything', 'abc?tag=hey', 'a']) {
    assert.equal(embedEndpoint(bad), null);
  }
});
test('public newsletter luv is configured but requires a deliberate visitor submission', () => {
  assert.equal(BUTTONDOWN_USERNAME, 'luv');
  assert.equal(embedEndpoint(BUTTONDOWN_USERNAME), 'https://buttondown.com/api/emails/embed-subscribe/luv');
  const html = get('../post-office/index.html');
  assert.match(html, /<form id="subscribe" method="post" hidden>/);
  assert.match(html, /name="email"[^>]*required disabled/);
  assert.match(html, /type="submit" disabled/);
  assert.match(html, /I want to receive Letters from the Field by email/);
  assert.match(html, /Subscriptions are not being collected yet/); // truthful without JavaScript
  assert.match(get('../post-office/subscribe.mjs'), /form\.action = endpoint/);
  assert.match(get('../post-office/subscribe.mjs'), /form\.hidden = false/);
  assert.doesNotMatch(get('../post-office/subscribe.mjs'), /fetch\(|sendBeacon\(|localStorage/);
  assert.doesNotMatch(html, /name="phone"|type="tel"|localStorage|fetch\(/);
});
test('public letter is clearly not a sent email and is readable without javascript', () => {
  assert.match(get('../post-office/archive/000/index.html'), /NOT EMAILED/);
  assert.match(get('../post-office/archive/index.html'), /ISSUE 000/);
  assert.doesNotMatch(get('../post-office/archive/000/index.html'), /<script/i);
});
test('release has a narrow explicit public allowlist and email CSP', () => {
  const build = get('../scripts/build-release.mjs');
  for (const path of ['post-office/', 'post-office/style.css', 'post-office/provider.mjs',
     'post-office/subscribe.mjs', 'post-office/archive/', 'post-office/archive/000/']) {
    assert.ok(build.includes("'" + path + "'"), path);
  }
  const vercel = JSON.parse(get('../vercel.json'));
  assert.equal(vercel.git.deploymentEnabled, false);
  const policy = vercel.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
  assert.match(policy, /form-action https:\/\/buttondown.com/);
  assert.match(policy, /connect-src 'self'/);
});
