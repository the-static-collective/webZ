import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('public Abundent page identifies itself, instead of webZ, in previews', () => {
  const html = read('index.html');
  assert.match(html, /<title>Abundent \| Start with One Small Useful Thing<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/abundent\.org\/"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/abundent\.org\/"/);
  assert.match(html, /<meta property="og:description" content="Bring a need,/);
});

test('sitemap lists verified public static doors only', () => {
  const xml = read('sitemap.xml');
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  for (const path of ['', 'first-circle/', 'invites/', 'jubilee/']) {
    assert.ok(xml.includes('<loc>https://abundent.org/' + path + '</loc>'));
  }
  assert.doesNotMatch(xml, /hello\.abundent\.org|\/invites\/network\/thread\//);
});

test('canonical domain offers robots discovery without rewriting hello review-candidate policy', () => {
  const robots = read('robots.txt');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/abundent\.org\/sitemap\.xml/);
});

test('first-action choices lead straight to actual human Porch paths', () => {
  const html = read('index.html');
  assert.match(html, /https:\/\/hello\.abundent\.org\/porch\/\?kind=need/);
  assert.match(html, /https:\/\/hello\.abundent\.org\/porch\/\?kind=offer/);
  assert.doesNotMatch(html, /<strong>I can help<\/strong><span>See ways to take part/);
});
