import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCard, cardText, emailDraft } from "../start/first-step.mjs";

test("one goal produces a useful, clearly unverified first card", () => {
  const c = createCard({ goal: "A community grocery pickup table", kind: "community" });
  assert.match(c.experiment, /willing local steward/);
  assert.match(c.status, /NOT SENT OR VERIFIED/);
  assert.match(cardText(c), /not an AI response, verified plan/);
  assert.match(c.nextGate, /permission|consent/);
  assert.equal(c.available, "To be confirmed");
});

test("the card preserves the person's words and doesn't infer missing people or resources", () => {
  const c = createCard({ goal: "A two-hour guitar workshop", kind: "creative", have: "one guitar", needs: "a willing host" });
  assert.equal(c.available, "one guitar");
  assert.equal(c.firstNeed, "a willing host");
  assert.match(c.experiment, /small draft/);
});

test("invalid, excessive and unknown inputs HOLD", () => {
  assert.throws(() => createCard({ goal: "short" }), RangeError);
  assert.throws(() => createCard({ goal: "x".repeat(601) }), RangeError);
  assert.throws(() => createCard({ goal: "A useful plan for my group", kind: "fake" }), RangeError);
  assert.throws(() => createCard({ goal: "A useful plan for my group", have: "x".repeat(401) }), RangeError);
});

test("email is an explicit user-opened draft, not a sent message", () => {
  const card = createCard({ goal: "Find a safe place for one event" });
  const link = emailDraft(card);
  assert.ok(link.startsWith("mailto:us@abundent.org?subject="));
  assert.ok(decodeURIComponent(link).includes("Find a safe place for one event"));
  assert.throws(() => emailDraft(card, "wrong address"), TypeError);
});

test("the first door is static, local by default and discoverable", () => {
  const page = readFileSync(new URL("../start/index.html", import.meta.url), "utf8");
  const script = readFileSync(new URL("../start/app.mjs", import.meta.url), "utf8");
  const home = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(page, /What are you trying/);
  assert.match(page, /connect-src 'self'/);
  assert.match(page, /No account|NO ACCOUNT/);
  assert.match(page, /does not call an LLM/);
  assert.match(home, /\.\/start\//);
  assert.doesNotMatch(script, /\bfetch\s*\(|localStorage|sessionStorage|sendBeacon/);
});
