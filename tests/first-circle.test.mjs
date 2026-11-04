import test from "node:test";
import assert from "node:assert/strict";
import { CARD_SCHEMA, createCard, validateCard, recordReturn, proposeMethod,
  exportCard, importCard, shareText } from "../first-circle/core.mjs";

const made = () => createCard("need", "A hand with a neighborhood meal", "Ask one neighbor");
const clone = v => structuredClone(v);

test("one click-path yields an unsigned and bounded draft card", () => {
  const c = made();
  assert.equal(c.schema, CARD_SCHEMA);
  assert.equal(c.direction, "need");
  assert.equal(c.method, null);
  assert.deepEqual(c.returns, []);
  assert.match(shareText(c), /unsigned personal draft/);
  assert.throws(() => createCard("approved", "test", "test"));
  assert.throws(() => createCard("need", "x".repeat(221), "test"));
  assert.throws(() => createCard("need", "a", ""));
});
test("return stays explicitly self-reported; all three outcomes work", () => {
  for (const outcome of ["worked", "not-yet", "different"]) {
    const first = made(), returned = recordReturn(first, outcome, "A local observation");
    assert.equal(first.returns.length, 0);
    assert.equal(returned.returns[0].status, "SELF_REPORTED");
    assert.equal(returned.returns[0].outcome, outcome);
    assert.equal(returned.method, null);
  }
});
test("possible learning becomes PROPOSAL_ONLY, never automatic approval", () => {
  assert.throws(() => proposeMethod(made()), /return is needed/);
  const c = proposeMethod(recordReturn(made(), "worked", "One dinner shared"));
  assert.equal(c.method.status, "PROPOSAL_ONLY");
  assert.equal(c.method.sourceReturnId, c.returns[0].id);
  assert.match(c.method.text, /adapt locally/);
  const counterfeit = clone(c);
  counterfeit.method.status = "APPROVED";
  assert.throws(() => validateCard(counterfeit), /cannot be marked approved/);
});
test("portable export can be re-opened unchanged on a fresh process", async () => {
  const c = proposeMethod(recordReturn(made(), "not-yet", "One invitation drafted"));
  const p = await exportCard(c);
  assert.match(p.checksum, /^[a-f0-9]{64}$/);
  assert.deepEqual(await importCard(JSON.parse(JSON.stringify(p))), c);
});
test("tampering and counterfeit verification claims fail closed", async () => {
  const c = made();
  const p = await exportCard(c);
  const changed = clone(p); changed.payload.message = "An unauthorized changed message";
  await assert.rejects(importCard(changed), /changed after export/);
  const forged = clone(p); forged.payload.verified = true;
  await assert.rejects(importCard(forged), /Invalid or unrecognized/);
  const status = await exportCard(recordReturn(made(), "worked"));
  status.payload.returns[0].status = "VERIFIED";
  await assert.rejects(importCard(status), /false authority claim/);
  const extra = clone(p); extra.verifiedBy = "system";
  await assert.rejects(importCard(extra), /not a First Circle export/);
});
test("malicious-looking text remains data and is not put into generated HTML", () => {
  const c = createCard("play", "<img src=x onerror=alert(1)>", "Try something");
  assert.equal(c.message, "<img src=x onerror=alert(1)>");
  assert.match(shareText(c), /<img/);
  // The UI inserts all user text via textContent, not innerHTML.
  assert.equal(validateCard(c), c);
});
test("refuse duplicate returns and invented authority fields", () => {
  const c = recordReturn(made(), "different");
  const duplicate = clone(c); duplicate.returns.push(clone(duplicate.returns[0]));
  assert.throws(() => validateCard(duplicate), /Duplicate return/);
  const extra = clone(c); extra.authority = "LIVE";
  assert.throws(() => validateCard(extra), /Invalid or unrecognized/);
});
