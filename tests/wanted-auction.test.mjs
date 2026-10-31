import test from "node:test";
import assert from "node:assert/strict";
import { startLab, availableCredits, phase, boost, shiftScout, poke, addOffer, selectOffer, reopen, confirm, cancel, options, reset } from "../wanted/auction/model.mjs";
const now = Date.UTC(2026, 9, 31, 12, 0);
const wantId = "demo-drill";
const seller = (name, quote, etaMinutes) => ({ name, quote, etaMinutes });
test("new lab is synthetic and starts with unallocated credits", () => {
  const l = startLab(now);
  assert.equal(l.mode, "DEMO_ONLY");
  assert.equal(availableCredits(l), 40);
  assert.equal(l.wants[0].budget, 20);
  assert.equal(l.wants[0].scoutCredits, 2);
  assert.equal(l.wants[0].status, "OPEN");
});
test("boost transfers credits to the bounty; cannot mint more than wallet", () => {
  let l = startLab(now);
  l = boost(l, wantId, 15, now);
  assert.equal(l.wants[0].budget, 35);
  assert.equal(availableCredits(l), 25);
  assert.throws(() => boost(l, wantId, 26, now), /Boost/);
  l = boost(l, wantId, 20, now);
  assert.equal(availableCredits(l), 5);
  assert.throws(() => boost(l, wantId, 6, now), /Not enough/);
});
test("scout and seller divide ONE cap, not double payout", () => {
  let l = shiftScout(startLab(now), wantId, 5, now);
  assert.throws(() => addOffer(l, wantId, seller("Garage A", 16, 20), now), /exceeds/);
  l = addOffer(l, wantId, seller("Garage A", 15, 20), now);
  const o = options(l, wantId, now)[0];
  assert.equal(o.remaining, 0);
  assert.equal(o.quote + l.wants[0].scoutCredits, 20);
});
test("POKE expresses interest without a lock", () => {
  let l = poke(startLab(now), wantId, now);
  assert.equal(l.wants[0].pokes, 1);
  assert.equal(l.wants[0].status, "OPEN");
  assert.equal(l.wants[0].selectedOfferId, null);
});
test("reverse bids are separate and buyer selects explicitly, not lowest auto-wins", () => {
  let l = addOffer(startLab(now), wantId, seller("Fast garage", 18, 10), now);
  l = addOffer(l, wantId, seller("Slow garage", 12, 60), now);
  assert.equal(l.wants[0].status, "OPEN");
  l = selectOffer(l, wantId, "offer-1", now + 100);
  assert.equal(l.wants[0].selectedOfferId, "offer-1");
  assert.throws(() => selectOffer(l, wantId, "offer-2", now + 101), /not open/);
  l = reopen(l, wantId, now + 102);
  l = selectOffer(l, wantId, "offer-2", now + 103);
  assert.equal(l.wants[0].selectedOfferId, "offer-2");
});
test("confirmed fictional credits only burn quote plus scout and release surplus", () => {
  let l = addOffer(startLab(now), wantId, seller("Found it", 15, 20), now);
  l = selectOffer(l, wantId, "offer-1", now + 100);
  assert.equal(availableCredits(l), 40);
  l = confirm(l, wantId, now + 200);
  assert.equal(l.wants[0].status, "DEMO_CONFIRMED");
  assert.equal(l.wants[0].spentCredits, 17);
  assert.equal(availableCredits(l), 43);
  assert.match(l.events.at(-1).note, /Neither seller nor scout was paid/);
  assert.throws(() => confirm(l, wantId, now + 201), /Select/);
});
test("cancel returns only the fictional allocation", () => {
  let l = boost(startLab(now), wantId, 10, now);
  l = cancel(l, wantId, now + 10);
  assert.equal(availableCredits(l), 60);
  assert.equal(l.wants[0].status, "CANCELLED");
  assert.throws(() => poke(l, wantId, now + 11), /not open/);
  assert.equal(reset(l, now + 30).wants[0].budget, 20);
});
test("expired wants reject offers, and late arrival cannot satisfy deadline", () => {
  const l = startLab(now);
  assert.equal(phase(l.wants[0], now + 7200001), "EXPIRED");
  assert.throws(() => addOffer(l, wantId, seller("Late", 18, 5), now + 7200001), /not open/);
  assert.throws(() => addOffer(l, wantId, seller("Almost", 18, 20), now + 119 * 60000), /after/);
  const selected = selectOffer(addOffer(l, wantId, seller("Early", 18, 20), now), wantId, "offer-1", now + 10);
  assert.equal(phase(selected.wants[0], now + 7200001), "EXPIRED");
  assert.throws(() => confirm(selected, wantId, now + 7200001), /expired/i);
});
test("synthetic offer and scout data cannot be used to claim payment", () => {
  let l = addOffer(startLab(now), wantId, seller("Found", 18, 10), now);
  l = selectOffer(l, wantId, "offer-1", now + 100);
  l = confirm(l, wantId, now + 200);
  assert.equal(l.paymentReceived, undefined);
  assert.equal(l.wants[0].offers[0].verified, false);
  assert.equal(l.wants[0].offers[0].synthetic, true);
});
