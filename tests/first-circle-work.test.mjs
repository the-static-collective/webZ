import test from "node:test";
import assert from "node:assert/strict";
import { workContext, prepareWork, auditWork } from "../first-circle/work.mjs";
import { CARD_SCHEMA, CARD_SCHEMA_V1, createCard, recordReturn, proposeMethod, exportCard, importCard, shareText, validateCard } from "../first-circle/core.mjs";

test("the user's specific dead-end is rejected: no invitation-to-make-an-invitation", () => {
  const msg = "Advice on fixing something";
  const context = workContext("need", msg);
  assert.equal(context.topic, "repair");
  assert.match(context.prompt, /what.s broken/i);
  const prepared = prepareWork("need", msg, "Washing machine won't drain");
  assert.equal(prepared.work.status, "BOUNDED_GUIDE");
  assert.match(prepared.work.body, /drain hose/i);
  assert.match(prepared.work.body, /stop/i);
  assert.doesNotMatch(prepared.nextStep, /make a simple invitation/i);
  assert.deepEqual(auditWork(prepared), {pass:true,reason:"PREPARED_WORK_NOT_FIELD_PROOF"});
});
test("repair advice is constrained to observed appliance symptom; unsupported help stays unresolved", () => {
  assert.match(prepareWork("need", "Help me fix my phone", "Phone won't charge").work.body, /charger/i);
  assert.match(prepareWork("need", "Repair my bicycle", "Bicycle tire is flat").work.body, /sidewall/i);
  assert.match(prepareWork("need", "Help fix a computer", "Laptop won't start").work.body, /outlet/i);
  const unknown = prepareWork("need", "Help me fix an engine", "Engine rattling");
  assert.equal(unknown.work.status, "UNRESOLVED");
  assert.match(unknown.work.body, /not diagnosed/i);
});
test("help with food delivers an actual small recipe, not a planning ticket", () => {
  const c = prepareWork("need", "Help with a meal", "Rice and beans for two");
  assert.match(c.work.body, /INGREDIENTS/);
  assert.match(c.work.body, /Cook rice/);
  assert.match(c.work.body, /two portions/);
});
test("offer creates a complete draft and play produces playable rules", () => {
  const o = prepareWork("offer", "I can lend a guitar", "Available Saturday morning");
  assert.equal(o.work.status, "READY_TO_USE_DRAFT");
  assert.match(o.work.body, /I can offer: I can lend a guitar/);
  assert.match(o.work.body, /Saturday morning/);
  const p = prepareWork("play", "A tiny potluck", "Solo paper rehearsal");
  assert.match(p.work.body, /RULES:/);
  assert.match(p.work.body, /WIN CONDITION:/);
});
test("coordination becomes an actual ready-to-send message when help truly requires a human", () => {
  const result = prepareWork("need", "I need one extra volunteer", "Set up chairs Friday");
  assert.equal(result.work.status, "READY_TO_USE_DRAFT");
  assert.match(result.work.body, /Could someone help with this specific task: Set up chairs Friday/);
  assert.match(result.work.body, /no one has been contacted/i);
});
test("unknown needs remain explicit partial work with blocker rather than claiming completion", () => {
  const prepared = prepareWork("need", "I need help", "A short answer about the problem");
  assert.equal(prepared.work.status, "UNRESOLVED");
  assert.equal(auditWork(prepared).reason, "PARTIAL_WITH_BLOCKER");
  assert.equal(auditWork({nextStep:"Make a simple invitation",work:{status:"READY_TO_USE_DRAFT",body:"x".repeat(100)}}).reason, "EMPTY_HANDOFF");
});
test("v1 work survives export and never smuggles status or authority", async () => {
  const prepared = prepareWork("need", "Advice on fixing something", "Phone won't charge");
  const c = createCard("need", "Advice on fixing something", prepared.nextStep, prepared.work);
  assert.equal(c.schema, CARD_SCHEMA_V1);
  assert.match(shareText(c), /PREPARED WORK/);
  const exported = await exportCard(c);
  assert.deepEqual(await importCard(JSON.parse(JSON.stringify(exported))), c);
  const fake = structuredClone(c);fake.work.status = "VERIFIED";
  assert.throws(() => validateCard(fake), /false completion claim/);
  const extra = structuredClone(c);extra.work.externalApproved = true;
  assert.throws(() => validateCard(extra), /false completion claim/);
});
test("method only follows self-reported worked bounded work, not unresolved/failed", () => {
  const recipe = prepareWork("need", "Help with a meal", "Rice and beans");
  const initial = createCard("need", "Help with a meal", recipe.nextStep, recipe.work);
  assert.throws(() => proposeMethod(recordReturn(initial, "not-yet")), /No reusable method/);
  const method = proposeMethod(recordReturn(initial, "worked"));
  assert.equal(method.method.status,"PROPOSAL_ONLY");
  assert.match(method.method.text,/self-reported/i);
  const unknown = prepareWork("need", "Help with my problem", "One person");
  const c = createCard("need","Help with my problem",unknown.nextStep,unknown.work);
  assert.throws(() => proposeMethod(recordReturn(c,"worked")), /No reusable method/);
});
test("legacy v0 cards remain readable and their old limitation remains visible", async () => {
  const c = createCard("need","Advice on fixing something","Make a simple invitation");
  assert.equal(c.schema, CARD_SCHEMA);
  assert.equal(c.work, undefined);
  const exported = await exportCard(c);
  assert.deepEqual(await importCard(exported),c);
});
