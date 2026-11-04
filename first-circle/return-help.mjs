// Field Return 003 — a self-report can trigger another *prepared* useful step.
// Pure projection from existing portable card, no new authority, storage or network.
import { validateCard } from "./core.mjs";

function result(title, body, status = "BOUNDED_GUIDE") {
  return Object.freeze({ title, body, status });
}
export function prepareReturnHelp(card) {
  validateCard(card);
  if (!card.work || card.returns.length === 0) return null;
  const latest = card.returns.at(-1);
  if (latest.outcome === "worked") return null;
  const source = (card.message + " " + card.work.title).toLowerCase();
  if (card.direction === "need" && card.work.status === "UNRESOLVED") {
    return result("The original need is still open",
      "I don't have a safe, task-specific procedure for the equipment or situation described. I can preserve the exact fault summary already on your card, but can't claim a repair or invent the next test. The missing evidence is the specific make/model, observed symptom and relevant instructions from its manufacturer or a qualified person.",
      "UNRESOLVED");
  }
  if (/washing machine|washer/.test(source) && /drain|water/.test(source)) {
    return result("Next safe washer check · identify the exact fault",
      "The hose check did not settle the issue. Before opening any panel, look for the manufacturer's model label on the accessible exterior or door frame and note any displayed error code. Do not move a heavy washer alone, remove hoses holding trapped water, or work around live wiring. With the exact model and code, consult the corresponding official manual's drain troubleshooting section. If leaking, hot, or unsafe, stop and get qualified help. This is a second observation step, not proof of repair.");
  }
  if (/phone/.test(source) && /charg|battery/.test(source)) {
    return result("Next safe phone check · isolate the power path",
      "If a known-working outlet, adapter and cable did not help, check whether the phone displays any charging symbol or vibration when connected while powered off, if the manufacturer supports this. Record the observation and any unusual warmth. Do not insert metal tools into the port, force cables, or charge a hot or swollen device. The next decision depends on the model and observed indicator; no fix has been confirmed.");
  }
  if (/bicycle|bike|tire/.test(source) && /flat|puncture|tire/.test(source)) {
    return result("Next safe bicycle check · locate the leak",
      "Do not ride on a flat tire. If the tire and wheel look intact and you have a suitable pump, inflate only within the marked sidewall pressure range and listen for escaping air around the valve and tire. Record where the leak seems to be. If it cannot hold air, stop riding; a tube, valve or tire repair may be necessary. No repair has been performed.");
  }
  if (/computer|laptop/.test(source) && /start|power/.test(source)) {
    return result("Next safe computer check · capture startup evidence",
      "If a known-good outlet and proper power adapter changed nothing, record precisely whether the normal charging indicator, power light, fan, screen or beep pattern appears on one ordinary startup attempt. Do not open a power supply or swollen battery. That observation helps locate the next model-specific diagnostic step; the machine is not declared fixed.");
  }
  if (card.direction === "need" && /meal|food|dinner|rice|beans/.test(source)) {
    return result("Alternative pantry dinner · beans without rice",
      "If rice was the obstacle but beans are available: warm about one cup of cooked or canned beans with a few tablespoons of water in a small pan, add available vegetables or seasoning, and heat thoroughly. Serve with bread or another available starch if desired. If beans are unavailable, this alternative is not actionable; ingredient availability and dietary restrictions are still unknown. No meal is claimed prepared.");
  }
  if (card.direction === "play") {
    return result("Second playable round · reduce the resources",
      "Use the same experiment, but now allow only one ordinary item and five minutes. Minute 0–1: pick the item and one problem. Minute 1–3: make one reversible test or paper simulation. Minute 3–4: add a 'no money' constraint. Minute 4–5: compare the two versions and record one observation. This is an already-defined alternative game, not another instruction to design a game.");
  }
  if (card.direction === "offer" || /volunteer|helper|extra hand/.test(source)) {
    return result("Second ready-to-send version · one bounded request",
      "Original offer or need: " + card.message + "\nConcrete limit or step: " + card.nextStep +
      "\n\nI can consider one small, mutually agreed test. If this could be useful, please reply with one suitable time or requirement. I will confirm before making a commitment. This draft is complete but has NOT been sent, accepted or matched.",
      "READY_TO_USE_DRAFT");
  }
  return result("Still unresolved · the limits are visible",
    "Your return is recorded as self-reported, but it does not establish that the original need was resolved. The prepared work on the card remains available. I do not have a reliable new task-specific action for this case, and will not issue a new card instructing you to make another card.",
    "UNRESOLVED");
}
