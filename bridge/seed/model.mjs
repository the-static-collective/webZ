// STATIC COMMONS-001 · local, public-safe field packet. A form is not a receipt.
export const SCHEMA = "abundent.static-commons.first-true-yes/v1";
export const CASE = "WASECA-FOOD-QUESTION-001";
export const DEFAULTS = Object.freeze({
  context: "Prospective Waseca food-access conversation (no enrolled partner)",
  need: "Is there one recurring step in receiving suitable food donations or coordinating an approved pickup that your team genuinely wants made easier?",
  offer: "If useful, I can prepare a one-page process sketch for staff review. No pickup, delivery, volunteering, data access or installation is offered without permission.",
  measure: "The receiving team decides whether the proposed change would save staff time or whether the current approach is better.",
  stop: "Stop if the organization declines, the task duplicates good work, client privacy is affected, or food-handling/volunteer permission is absent."
});
const PRIVATE = /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|www\.|\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b|\b\d{1,6}\s+(?:[a-z]+\s+){0,3}(?:street|st\.|avenue|ave\.|road|rd\.|drive|dr\.|lane|ln\.|boulevard|blvd\.)\b|\b(?:password|api[_ -]?key|bearer token|secret token|custody case|survivor statement|social security number)\b)/i;
export function cleanField(value, label, max=420) {
  if (typeof value !== "string") throw new TypeError(label + ": text required.");
  const v=value.trim().replace(/\s+/g," ");
  if(v.length < 12 || v.length > max) throw new RangeError(label + ": use 12–" + max + " characters.");
  if(PRIVATE.test(v) || /[<>\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v))
    throw new Error(label + ": HOLD. Public-only text; remove contact, private, identifying or markup content.");
  return v;
}
const BLANK = "____________________________";
export function preparePacket(fields) {
  const context=cleanField(fields.context,"Context",120);
  const need=cleanField(fields.need,"Need",420);
  const offer=cleanField(fields.offer,"Offer",420);
  const measure=cleanField(fields.measure,"Measure",360);
  const stop=cleanField(fields.stop,"Stop rule",360);
  return {
    schema: SCHEMA, caseId: CASE, classification: "UNSENT_PUBLIC_SAFE_LOCAL_DRAFT",
    transmission: "NONE", recipientPermission: false, fieldActionAuthorized: false,
    outcomeVerified: false, publicMethodAuthorized: false,
    source: { context, need, offer, measure, stop },
    humanGates: [
      {phase:"ASK", state:"DRAFT_UNSENT", owner:"Proposer", question:need},
      {phase:"ANSWER",state:"NOT_RECEIVED",owner:"Actual recipient steward",dispositions:["DECLINE","HOLD","INVITE_DISCUSSION"],note:"A reply, not a click, establishes this step."},
      {phase:"SCOPE",state:"NOT_AUTHORIZED",owner:"Recipient + task actors",note:"Agree on one safe task and distinct permissions before activity."},
      {phase:"ACT",state:"NOT_PERFORMED",owner:"Authorized actor",note:"Record what actually happened; no inferred completion."},
      {phase:"CONFIRM",state:"NOT_CONFIRMED",owner:"Independent recipient/reviewer",note:"Checks result, costs, adverse effects and evidence; may reject."},
      {phase:"RETURN",state:"WITHHELD",owner:"Source + receiving community",note:"Only consented, redacted, independently reviewed methods travel."}
    ],
    integrations: {
      outbox:"../outbox/",
      publicInbox:"../../commons/inbox/",
      suitcase:"../suitcase/",
      bridgeSource:"../first/",
      portableMethod:"../../commons/"
    }
  };
}
export function printableKit(p) {
  if(p?.schema!==SCHEMA || p.classification!=="UNSENT_PUBLIC_SAFE_LOCAL_DRAFT") throw new Error("Unknown or promoted packet.");
  const s=p.source;
  return [
    "STATIC COMMONS 001 / FIRST TRUE YES", "PUBLIC-SAFE HUMAN FIELD KIT — UNSENT / NOT AUTHORIZED", "",
    "CARD 1 · ASK (proposer owns)", "Context: "+s.context, "Question: "+s.need,
    "Conditional offer: "+s.offer, "Measure: "+s.measure, "Stop: "+s.stop,
    "Date proposed: "+BLANK, "Delivery channel (record privately): "+BLANK,
    "Actual sending witnessed by: "+BLANK, "",
    "CARD 2 · ANSWER (recipient owns — blank until they respond)",
    "Actual recipient role: "+BLANK, "Date received: "+BLANK,
    "[ ] DECLINE (valid end)  [ ] HOLD  [ ] INVITE DISCUSSION ONLY",
    "Recipient's words / limits: "+BLANK, "Independent reply retained privately: "+BLANK,
    "Reply does NOT authorize field work.", "",
    "CARD 3 · SCOPE (separate agreement required)",
    "One bounded task / safe quantity / place and time: "+BLANK,
    "Authorized host: "+BLANK, "Authorized actor: "+BLANK,
    "Safety / food handling / insurance gates checked by: "+BLANK,
    "Human permission and withdrawal channel: "+BLANK, "Status: NOT AUTHORIZED BY THIS KIT", "",
    "CARD 4 · ACT (actor's report, not proof)",
    "What actually happened and when? "+BLANK,
    "What was NOT done / cost / unexpected harm? "+BLANK,
    "Evidence held by which party? "+BLANK, "Status: NOT PERFORMED BY THIS KIT", "",
    "CARD 5 · CONFIRM (different independent recipient/reviewer)",
    "Independent reviewer and decision authority: "+BLANK,
    "[ ] CONFIRMED  [ ] DISPUTED  [ ] INSUFFICIENT  [ ] REFUSED",
    "Evidence inspected, limitations, corrections: "+BLANK,
    "Date and separate acknowledgement: "+BLANK, "Status: NOT CONFIRMED BY THIS KIT", "",
    "CARD 6 · RETURN (consented method, not participant records)",
    "What might another community reuse? "+BLANK,
    "What does NOT transfer? "+BLANK,
    "Source permission / receiver adaptation / publication consent: "+BLANK,
    "Status: WITHHELD UNTIL LOCAL PERMISSION AND REVIEW", "",
    "The first node succeeds only through actual permission, an actual act, and independently checked evidence.",
    "The second node may reuse a method, never another community's authority.",
    "Prepared locally; nothing sent, stored, signed, verified or published by this tool."
  ].join("\n");
}
