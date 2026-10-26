import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../public/still-here/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/still-here/style.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../public/still-here/app.mjs', import.meta.url), 'utf8');
const home = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('Still Here is a navigable first door for isolated parents and people facing relationship conflict', () => {
  assert.match(home, /href="\/still-here\/"/);
  for (const name of ['tonight', 'remember', 'person', 'parent']) {
    assert.match(html, new RegExp('data-door="'+name+'"'));
    assert.match(html, new RegExp('id="'+name+'"'));
  }
  assert.match(html, /no public feed/i);
  assert.match(html, /directly witnessed/i);
  assert.match(html, /inferred, not confirmed/i);
  assert.match(html, /reported to me/i);
  assert.match(html, /fee waiver/i);
  assert.match(html, /you don't have to start over/i);
});

test('No sensitive narrative is transmitted, tracked, placed into a URL or persisted silently', () => {
  assert.doesNotMatch(app, /\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|XMLHttpRequest|\binnerHTML\s*=/);
  assert.doesNotMatch(app, /location\.(search|hash)|URLSearchParams|navigator\.share/);
  assert.match(app, /\.textContent=/);
  assert.match(app, /URL\.createObjectURL/);
  assert.match(html, /No account/i);
  assert.match(html, /monitored device/i);
  assert.match(html, /not independent verification/i);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /<script\s+src="https?:/i);
});

test('No inline scripts or styles are needed under site CSP; print and keyboard usage remain possible', () => {
  assert.match(html, /src="\/still-here\/app\.mjs" type="module"/);
  assert.match(html, /href="\/still-here\/style\.css"/);
  assert.doesNotMatch(html, /<script>(.|\n)*?<\/script>/i);
  assert.doesNotMatch(html, /style="/i);
  assert.match(css, /@media print/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /aria-live="polite"/);
});

test('Survivor-first door gives private action tools, not crisis hotline routing', () => {
  assert.match(html, /survivors standing beside survivors/i);
  assert.match(html, /beginning with fathers/i);
  assert.match(html, /we are not yet operating an authenticated peer network/i);
  assert.match(html, /private-in-your-browser toolkit/i);
  assert.ok(html.includes('https://mncourts.gov/selfhelp'));
  assert.ok(html.includes('https://mncourts.gov/help-topics/fee-waiver-ifp'));
  for (const phrase of ['thehotline.org', 'dayoneservices.org', '800-799-7233', '88788', '988', 'hotline', 'crisis line']) {
    assert.equal(html.toLowerCase().includes(phrase), false, 'unwanted crisis routing: '+phrase);
  }
  assert.match(home, /YOU DON'T HAVE TO DO THIS ALONE/);
  assert.match(home, /no live helper service claimed/);
});
