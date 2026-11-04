// USEFUL WORK 002 — deterministic local procedures and ready-to-use drafts.
// No AI, remote dispatch, diagnosis, verified outcome, or partnership is implied.
const limit = (value, max = 220) => {
  if (typeof value !== "string") throw new Error("Expected text.");
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text || text.length > max) throw new Error("Text must be non-empty and bounded.");
  return text;
};
const repair = /\b(fix(?:ing|ed|es)?|repair(?:ing|ed|s)?|broken|troubleshoot(?:ing)?|doesn.t work|won.t work|not working|malfunction)\b/i;
const food = /\b(meal|dinner|lunch|cook|food|rice|beans|recipe|groceries)\b/i;
const helper = /\b(volunteer|helper|extra hand|set ?up|clean ?up|recruit|invite)\b/i;

export function workContext(direction, message) {
  const m = limit(message);
  if (direction === "need" && repair.test(m))
    return { topic:"repair", prompt:"What's broken, and what is it doing?",
      examples:["Washing machine won't drain","Phone won't charge","Bicycle tire is flat"] };
  if (direction === "need" && food.test(m))
    return { topic:"food", prompt:"Which meal would you like help preparing?",
      examples:["Rice and beans for two","A pantry dinner for two","Simple filling breakfast"] };
  if (direction === "need" && helper.test(m))
    return { topic:"volunteer", prompt:"What's the actual task, and when would help matter?",
      examples:["Help set up chairs Friday","Two hands for a cleanup","Help carry groceries"] };
  if (direction === "need")
    return { topic:"other-need", prompt:"What specifically would useful help look like?",
      examples:["Find the first safe check","Help explain the problem","A short request I can send"] };
  if (direction === "offer")
    return { topic:"offer", prompt:"What's available, with what limits?",
      examples:["One hour this weekend","Lend it for one afternoon","Share instructions, not equipment"] };
  if (direction === "play")
    return { topic:"play", prompt:"How small should the first test be?",
      examples:["One person, ten minutes","Two people, three moves","A paper-only rehearsal"] };
  throw new Error("Choose an available direction.");
}

function result(nextStep, title, body, status) {
  const step = limit(nextStep, 160);
  const heading = limit(title, 100);
  if (typeof body !== "string" || !body.trim() || body.length > 1600) throw new Error("Work is missing or oversized.");
  const text = body.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim();
  if (!["BOUNDED_GUIDE","READY_TO_USE_DRAFT","UNRESOLVED"].includes(status)) throw new Error("Invalid work status.");
  return { nextStep:step, work:{title:heading,body:text,status} };
}
function repairResult(message, detail) {
  const t = (message + " " + detail).toLowerCase();
  if (/\b(washing machine|washer)\b/.test(t) && /\b(drain|water|empty|spin)\b/.test(t)) {
    return result("Look for an accessible kink in the external drain hose.",
      "Washing machine won't drain · first safe checks",
      "1. Stop the cycle. Do not reach into live wiring or standing water. Unplug only if it is safe and accessible.\n2. Look at the visible external drain hose for a kink or compression; do not move a heavy machine alone.\n3. Note the model number and any displayed error. Consult that model's manual before opening a filter, panel, or hose—trapped water may spill.\n4. If there is a leak, burning smell, exposed wiring, or uncertainty, stop and seek qualified repair help.\nReport whether the hose was kinked and the exact error. This is triage, not a diagnosis.",
      "BOUNDED_GUIDE");
  }
  if (/\b(phone|tablet|mobile)\b/.test(t) && /\b(charge|battery|power)\b/.test(t)) {
    return result("Try one known-working charger, cable, and outlet.",
      "Phone won't charge · safe isolation test",
      "1. Try a known-working outlet, charger, and cable one at a time.\n2. Look into the charging port with a light. Do not put metal tools or liquids into it.\n3. If safe, restart the phone and check for a charge indicator.\n4. If the battery is swollen, the device gets unusually hot, or you smell burning, stop charging and seek professional help.\nWrite down which combinations changed the indicator. This narrows the cause; it does not certify a repair.",
      "BOUNDED_GUIDE");
  }
  if (/\b(bike|bicycle|tire|tyre|tube)\b/.test(t) && /\b(flat|puncture|leak|air)\b/.test(t)) {
    return result("Inspect the tire for obvious damage before reinflating.",
      "Flat bicycle tire · first safe checks",
      "1. Keep the bike stationary and look for visible cuts, nails, or pinching.\n2. Read the pressure range printed on the tire sidewall.\n3. If the tire and rim look intact, inflate gradually within that range and listen for leaking air.\n4. If it immediately deflates, the tube or tire may need repair; don't ride until the wheel is safe.\nRecord where air escapes. Do not pull out an embedded sharp object with bare hands.",
      "BOUNDED_GUIDE");
  }
  if (/\b(laptop|computer|pc)\b/.test(t) && /\b(start|turn on|boot|power)\b/.test(t)) {
    return result("Test a known-working outlet and the normal power indicator.",
      "Computer won't start · first safe checks",
      "1. Check the outlet and the specified power adapter; inspect for visible cable damage without opening anything.\n2. Disconnect nonessential USB accessories and try normal startup once.\n3. Record any lights, fan sounds, messages, or beep patterns.\n4. Do not open a power supply or swollen battery. Stop if there is heat, smoke, or a burning smell.\nThe observed lights and sounds determine the next diagnostic branch; no diagnosis is claimed.",
      "BOUNDED_GUIDE");
  }
  return result("Use this filled-in fault report to get specific help, not a generic invitation.",
    "Fault report · exact missing information",
    "THING / SYMPTOM: " + detail + "\nWHAT I AM TRYING TO SOLVE: " + message +
    "\nI need a safe first check for this exact equipment and behavior. Please tell me what to observe before I touch anything, and which warning signs mean stop.\nNo device-specific repair instructions are available in this offline prototype. It has not diagnosed the problem.",
    "UNRESOLVED");
}
function foodResult(message, detail) {
  return result("If you have the ingredients, start a two-serving pantry meal.",
    "Two-serving pantry dinner · ready recipe",
    "INGREDIENTS: 1/2 cup dry rice, about 1 cup cooked or canned beans (rinsed), water as directed on the rice package, salt or seasoning if available. Optional: onion, frozen vegetables, oil.\n1. Cook rice using its package directions; do not assume all rice needs the same water or time.\n2. Heat cooked/canned beans thoroughly in a separate pan with a splash of water and optional seasoning.\n3. Combine and divide into two portions. Refrigerate leftovers promptly.\nYOUR CHOICE: " + detail + "\nThis is a concrete fallback recipe, not a promise that ingredients are available or suitable for everyone's dietary needs.",
    "BOUNDED_GUIDE");
}
function volunteerResult(message, detail) {
  return result("A specific volunteer request is written below; decide where to share it.",
    "Ready-to-send volunteer request",
    "Could someone help with this specific task: " + detail + "?\nContext: " + message +
    ".\nIf you might be available, please reply with what time you could offer. We can confirm the details together before anyone commits.\nThis is a prepared message only: no one has been contacted, enrolled, or scheduled.",
    "READY_TO_USE_DRAFT");
}
function unknownNeed(message, detail) {
  return result("A targeted request is written below; the underlying need remains open.",
    "Ready-to-send specific help request",
    "I am looking for practical help with: " + message +
    ".\nWhat would help most: " + detail +
    ".\nIf you know an actual first step or can help directly, please reply with what you can do. There is no assumed commitment.\nThe offline assistant has not solved the underlying problem or contacted anyone.",
    "UNRESOLVED");
}
function offerResult(message, detail) {
  return result("The complete offer is written below; share only if you choose.",
    "Ready-to-send offer",
    "I can offer: " + message + ".\nAvailability / limits: " + detail +
    ".\nIf that would help, tell me what you need; I will confirm what is possible before anyone relies on it.\nThis is a local draft, not a public listing or a promise of delivery.",
    "READY_TO_USE_DRAFT");
}
function playResult(message, detail) {
  return result("Run the first 10-minute round below; the rules are already written.",
    "Play-ready mini-experiment · three moves",
    "TITLE: " + message +
    "\nSETUP: " + detail +
    "\nRULES:\n0–2 min — Pick one imaginary resource (a tool, ingredient, or skill). Each player gets one; solo play is allowed.\n2–5 min — Name one real-world problem your resource might help. Pick one possible move, without spending money or contacting anyone.\n5–8 min — Add a constraint (no cash, no car, or ten minutes). Change your move to fit.\n8–10 min — Record: what became possible, what remained impossible, and the next test you would want to try.\nWIN CONDITION: one concrete move survives the constraint. No one else is presumed to participate.",
    "BOUNDED_GUIDE");
}

export function prepareWork(direction, message, detail) {
  const m = limit(message), d = limit(detail, 160), context = workContext(direction,m);
  if (direction === "need") {
    if (context.topic === "repair") return repairResult(m,d);
    if (context.topic === "food") return foodResult(m,d);
    if (context.topic === "volunteer") return volunteerResult(m,d);
    return unknownNeed(m,d);
  }
  if (direction === "offer") return offerResult(m,d);
  if (direction === "play") return playResult(m,d);
  throw new Error("Unknown direction.");
}

// Use as an operator or regression-audit helper; this cannot establish human utility.
export function auditWork(candidate) {
  if (!candidate || typeof candidate !== "object" || !candidate.work) return {pass:false,reason:"NO_DELIVERABLE"};
  const {work,nextStep} = candidate;
  if (!["BOUNDED_GUIDE","READY_TO_USE_DRAFT","UNRESOLVED"].includes(work.status))
    return {pass:false,reason:"UNSUPPORTED_AUTHORITY"};
  if (typeof work.body !== "string" || work.body.length < 90)
    return {pass:false,reason:"NO_USABLE_CONTENT"};
  if (/^\s*(make|write|create|draft|prepare)\s+(an?\s+)?(?:simple\s+|generic\s+)?(invitation|request|plan|card)\s*\.?\s*$/i.test(nextStep))
    return {pass:false,reason:"EMPTY_HANDOFF"};
  return {pass:true,reason:work.status === "UNRESOLVED" ? "PARTIAL_WITH_BLOCKER" : "PREPARED_WORK_NOT_FIELD_PROOF"};
}
