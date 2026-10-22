import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../circulation/index.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../circulation/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../circulation/style.css", import.meta.url), "utf8");

test("Circulation Door is a separate, static, public-safe route", () => {
  assert.match(html, /FICTIONAL \/ WORKING PROTOTYPE/);
  assert.match(html, /No one has been contacted/);
  assert.match(html, /not deployed to Abundent production/);
  assert.match(html, /<script src="\.\/app\.js" defer>/);
  assert.match(html, /<link rel="stylesheet" href="\.\/style\.css">/);
  assert.doesNotMatch(html, /<form\b|<input\b|<textarea\b|<iframe\b/i);
  assert.doesNotMatch(js, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|WebSocket/);
  assert.doesNotMatch(css, /@import|url\s*\(\s*https?:/i);
});

test("CI witness IDs are explicit, copied from green CANNON three-organ run", () => {
  assert.match(html, /actions\/runs\/39827920267/);
  assert.match(html, /fgp:sha256:db6438c6e26c68779325b693fc6e8fe5afe5a80ec9e077838206eaf3d234afcb/);
  assert.match(html, /fgp:sha256:a2521fc26a3fcd41a0feca546553c790926de07916f7d2e6167455520837774f/);
  assert.match(html, /sha256:ce19be412bb8b2c9acfa357b4dc7f2a196a03a97e02cc45f49c6ec5dc1b02ffb/);
});

test("Distinct recipient states remain explicitly synthetic; no acceptance, rights or field proof", () => {
  assert.match(html, /BananaSpork/);
  assert.match(html, /Static Live/);
  assert.match(html, /fictional HOLD/i);
  assert.match(html, /fictional DECLINE/i);
  assert.match(js, /Fictional HOLD/);
  assert.match(js, /Fictional DECLINE/);
  assert.match(html, /not signatures of people/);
  assert.match(js, /No owner accepted a task/);
  assert.match(html, /no partnership is claimed/i);
  assert.match(html, /No QR, account, sign-up, app, or answer is required/);
});

test("Each interactive element has a visible document target", () => {
  for (const target of ["care-details", "culture-details", "replay", "reset", "print", "return-record", "return-summary", "return-title", "care-state", "culture-state"]) {
    assert.ok(html.includes('id="' + target + '"'), target + " missing");
  }
  assert.match(css, /@media print/);
  assert.match(css, /@media\(max-width:750px\)/);
});

test("the protected immutable release includes all three actual route assets", () => {
  const builder = readFileSync(new URL("../scripts/build-release.mjs", import.meta.url), "utf8");
  for (const file of ["circulation/index.html", "circulation/style.css", "circulation/app.js"]) {
    assert.ok(builder.includes("'" + file + "'"), "release manifest omits " + file);
  }
  const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(vercel.git.deploymentEnabled, false);
});
