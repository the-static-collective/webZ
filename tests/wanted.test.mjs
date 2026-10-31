import test from "node:test";
import assert from "node:assert/strict";
import { createWant, fictionalWant, currentStatus, transition, exportWantText } from "../wanted/model.mjs";

const now = Date.UTC(2026, 9, 31, 17, 0);
test("creates only unfunded device-local intent", () => {
  const w = createWant({ item: "Bike helmet", region: "Waseca area", amount: 20, minutes: 120 }, { now, id: "one" });
  assert.equal(w.funding, "UNFUNDED");
  assert.equal(w.visibility, "THIS_DEVICE_ONLY");
  assert.match(exportWantText(w), /NOT A SECURED SALE/);
  assert.throws(() => transition(w, "HOLD", { now: now + 1 }), /No verified buyer funds/);
});
test("strict input and deadline bounds", () => {
  const base = { item: "Bike helmet", region: "Waseca area", amount: 20, minutes: 120 };
  assert.throws(() => createWant({ ...base, amount: 0 }, { now, id: "a" }));
  assert.throws(() => createWant({ ...base, minutes: 0 }, { now, id: "b" }));
  assert.throws(() => createWant({ ...base, amount: 20.001 }, { now, id: "c" }));
  assert.equal(createWant({ ...base, amount: 20.29 }, { now, id: "c2" }).amountCents, 2029);
  assert.throws(() => createWant({ ...base, region: "X" }, { now, id: "d" }));
});
test("fictional hold is ten minutes; never a money claim", () => {
  const w = fictionalWant({ now });
  const held = transition(w, "HOLD", { now });
  assert.equal(held.status, "HELD");
  assert.equal(held.holdUntil, now + 600000);
  assert.throws(() => transition(held, "HOLD", { now: now + 10 }), /not available/);
  assert.equal(currentStatus(held, now + 600001), "OPEN");
  const reheld = transition(held, "HOLD", { now: now + 600002 });
  assert.equal(reheld.history.at(-1).action, "HOLD");
});
test("finder report and buyer acceptance are separate, unpaid states", () => {
  const w = fictionalWant({ now });
  const held = transition(w, "HOLD", { now });
  assert.throws(() => transition(held, "ACCEPT", { now: now + 1, actor: "FINDER" }));
  const reported = transition(held, "REPORT", { now: now + 100 });
  assert.throws(() => transition(reported, "ACCEPT", { now: now + 101, actor: "FINDER" }));
  const accepted = transition(reported, "ACCEPT", { now: now + 101, actor: "BUYER" });
  assert.equal(accepted.status, "ACCEPTED");
  assert.equal(accepted.funding, "SIMULATED_ONLY");
  assert.equal(accepted.paymentReceived, undefined);
  assert.throws(() => transition(accepted, "HOLD", { now: now + 102 }));
});
test("release, refusal, cancellation and expiry are explicit", () => {
  const w = fictionalWant({ now });
  const held = transition(w, "HOLD", { now });
  assert.equal(transition(held, "RELEASE", { now: now + 1 }).status, "OPEN");
  const reported = transition(held, "REPORT", { now: now + 1 });
  assert.equal(transition(reported, "REFUSE", { now: now + 2, actor: "BUYER" }).status, "OPEN");
  assert.equal(transition(w, "CANCEL", { now: now + 1, actor: "BUYER" }).status, "CANCELLED");
  assert.throws(() => transition(w, "HOLD", { now: now + 7200001 }), /expired/i);
});
