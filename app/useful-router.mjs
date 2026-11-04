// ASK JAR;VIS / HUMAN-FIRST 005 — bounded, reviewed capability router.
// Not a live model, GitHub crawler, service directory, or field-dispatch authority.
// Never stores, sends, or logs visitor input. The public site produces its own
// prepared local work using existing First Circle 002 functions.
import { prepareWork, auditWork } from '../first-circle/work.mjs';

const SOURCE = Object.freeze({
  useful: 'https://github.com/the-static-collective/webZ/blob/main/first-circle/work.mjs',
  jubilee: 'https://github.com/the-static-collective/webZ/blob/main/docs/JUBILEE-CIRCUIT-001.md',
  commuter: 'https://github.com/the-static-collective/reLATTE/blob/main/docs/COMMUTER-001.md'
});
export const CAPABILITIES = Object.freeze([
  Object.freeze({id:'repair', name:'Troubleshoot something safely', readiness:'LOCAL_GUIDE', source:SOURCE.useful,
    scope:'Specific first checks for a washer that will not drain, a phone that will not charge, a flat bike tire, or a computer that will not start. No repair diagnosis or service is promised.'}),
  Object.freeze({id:'food', name:'Make a simple meal', readiness:'LOCAL_GUIDE', source:SOURCE.useful,
    scope:'A two-serving pantry recipe. Ingredients and dietary suitability must be checked by the cook.'}),
  Object.freeze({id:'volunteer', name:'Write a concrete volunteer request', readiness:'LOCAL_DRAFT', source:SOURCE.useful,
    scope:'Prepares text only. No volunteer is contacted, matched, screened, or scheduled.'}),
  Object.freeze({id:'offer', name:'Offer a skill, item, or hour', readiness:'LOCAL_DRAFT', source:SOURCE.useful,
    scope:'Prepares text only. No promise, listing, commitment, or third-party acceptance is created.'}),
  Object.freeze({id:'event', name:'Run a small gathering', readiness:'LOCAL_GUIDE', source:SOURCE.jubilee,
    scope:'A usable small-event agenda; Jubilee has a fuller public host kit. No church, venue, or artist has agreed.'}),
  Object.freeze({id:'music', name:'Host a short music circle', readiness:'LOCAL_GUIDE', source:SOURCE.jubilee,
    scope:'A usable rehearsal or music-circle agenda. Public performance and music rights require separate permission.'}),
  Object.freeze({id:'newsletter', name:'Start a community newsletter', readiness:'LOCAL_PARTIAL', source:SOURCE.commuter,
    scope:'Prepares an editable newsletter skeleton. reLATTE COMMUTER is a synthetic implementation, not a connected farm, subscriber list, or email service.'})
]);

const clean = input => {
  if (typeof input !== 'string') return '';
  return input.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0,220);
};
const privateLike = input => /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,})|(?:\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b)|(?:\b(?:password|api[ _-]?key|secret|access[ _-]?token)\s*[:=])|(?:\b\d{1,5}\s+(?:[a-z]+\s+){0,3}(?:street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd\.)\b)/i.test(input);
const match = (re, input) => re.test(input);
const cap = id => CAPABILITIES.find(c=>c.id===id);

function packageWork(id, result, {connection=null, next=null}={}) {
  const audit=auditWork(result);
  if (!audit.pass) return {status:'HOLD', heading:'I cannot claim a usable result here.', body:'The local work did not pass its useful-result check.', blocker:audit.reason, capability:cap(id), connection:null};
  return {status:result.work.status==='UNRESOLVED'?'LOCAL_PARTIAL':'LOCAL_WORK_PREPARED',
    heading:result.work.title, body:result.work.body, next:next??result.nextStep,
    blocker:result.work.status==='UNRESOLVED'?'The underlying need is still unresolved. No external action has been performed.':null,
    capability:cap(id), connection};
}
function canned(id,heading,body,now,connection=null,status='LOCAL_WORK_PREPARED') {
  return {status,heading,body,next:now,blocker:status==='LOCAL_PARTIAL'?'Confirm missing facts and permission before sending or publishing.':null,capability:cap(id),connection};
}
const kitLink = Object.freeze({label:'Open the full Jubilee hosting guide',href:'./jubilee/',note:'A public host kit, not a booked event or enrolled partner.'});
export function routeUsefulWork(raw) {
  const input=clean(raw), lower=input.toLowerCase();
  if (!input) return null;
  if (privateLike(input)) return {status:'PRIVACY_HOLD',heading:'Keep private details private',body:'Remove contact details, street addresses, passwords or other identifiers, then describe the task without naming anyone. Nothing has been sent.',next:'You can describe the goal without identifying a person.',blocker:'POTENTIALLY_PRIVATE_INPUT',capability:null,connection:null};
  if (input.length<5) return {status:'HOLD',heading:'What are you trying to do?',body:'A few more words about the task will let me check which of the existing tools can actually help.',next:'Describe the object, goal, or first useful result.',blocker:'TOO_SHORT',capability:null,connection:null};
  // Explicit safeguards: do not turn urgent or material scarcity into a recipe.
  if(match(/\\b(immediate danger|being threatened|not safe tonight|nowhere to sleep|no place to sleep|domestic violence|in danger right now)\\b/i,lower))
    return {status:'HOLD',heading:'This page cannot dispatch real-world help.',
      body:'I can prepare local drafts and guides, but I cannot contact a shelter, verify nearby help, or protect someone in immediate danger. If the danger is immediate, contact local emergency services or a trusted nearby person. This page has not notified anyone.',
      next:'If it is safe to do so, choose a trusted person or established local service you can contact directly.',
      blocker:'NO_AUTHENTICATED_REAL_WORLD_RESPONDER',capability:null,connection:null};
  if(match(/\\b(no food|nothing to eat|out of food|food shelf|food bank|need groceries|cannot afford food|can.t afford groceries)\\b/i,lower))
    return canned('food','A specific food request, ready to share',
      'Could someone help with a simple meal or shelf-stable groceries today? I am looking for practical food access, not a recipe. Please reply only with what you can actually offer so we can agree on a safe handoff.\\n\\nThis is a draft only. No food provider, volunteer or delivery has been contacted or verified.',
      'Choose a trusted person or verified local food program to contact; no request has been sent.',
      null,'LOCAL_PARTIAL');
  if(match(/\\b(sync|synchroniz|integrat|automat|connect)\\w*\\b/i,lower) &&
     match(/\\b(grownby|squarespace|storefront|mailing list|newsletter|email platform|crm)\\b/i,lower))
    return canned('newsletter','A safe first integration test, not a fake live sync',
      'SOURCE: identify the exact storefront change you need to observe (for example, a new public item).\\nDESTINATION: identify the exact opt-in email action that should follow.\\nTEST: use one synthetic record and an explicitly permitted receiver account.\\nBOUNDARY: require manual owner approval, idempotency and a visible HOLD/REFUSE path before any real recipient message.\\nRETURN: record whether the destination actually accepted the test record, without calling that inbox delivery.\\n\\nreLATTE COMMUTER documents the underlying pattern, but no real GrownBy, Squarespace or mailing provider is connected here.',
      'Test with synthetic data and explicit account-owner permission before considering real contacts.',
      {label:'Inspect reLATTE COMMUTER specification',href:SOURCE.commuter,note:'Documented synthetic profile. Not connected to a provider.'},'LOCAL_PARTIAL');

  // Order matters: a person asking volunteers to cook is asking for people, not a recipe.
  if(match(/\b(i can|i could|i have|i offer|i want to help|i'd like to help|donate|lend|offer my|offer an)\b/i,lower))
    return packageWork('offer',prepareWork('offer',input.replace(/^i (?:can|could|have|offer|want to help)\s+/i,'').replace(/[.!?]+$/,'')||input,'Time and conditions to be confirmed by me before anyone relies on this offer'));
  if(match(/\b(volunteers?|helpers?|extra hands?|recruit|need people|help set up|help clean up|staff an event)\b/i,lower))
    return packageWork('volunteer',prepareWork('need','Need volunteer help with a specific practical task',input.replace(/[.!?]+$/,'')));
  if(match(/\b(fix|repair|broken|not working|won.t|doesn.t work|flat tire|flat tyre|drain|won.t charge|won.t start|troubleshoot)\b/i,lower))
    return packageWork('repair',prepareWork('need', /\b(fix|repair|broken|not working|troubleshoot|malfunction)\b/i.test(input)?input:input.slice(0,195)+' not working',input));
  if(match(/\b(food|hungry|meal|cook|dinner|lunch|breakfast|groceries|pantry|rice|beans|recipe)\b/i,lower))
    return packageWork('food',prepareWork('need',input,'Two servings using basic pantry ingredients; adjust for known dietary needs.'));
  if(match(/\b(newsletter|mailing list|email update|subscriber|grownby|squarespace|farm email|crm)\b/i,lower))
    return canned('newsletter','Newsletter draft you can work with now',
      'SUBJECT: A note from our community\n\nHello neighbors,\n\nHere is what we can share this week:\n• One confirmed update: [add an approved fact].\n• What is available: [verify before promising].\n• Where to ask questions: [add an authorized contact method].\n\nThanks for being part of this.\n\nOnly send to people who have opted in. This local draft is not a connected mailing service.',
      'Edit the three factual blanks and confirm recipient consent. Do not send automatically.',
      {label:'Read the experimental farm correspondence protocol',href:'https://github.com/the-static-collective/reLATTE/blob/main/docs/COMMUTER-001.md',note:'Documented synthetic connector; no real farm or email system connected.'},'LOCAL_PARTIAL');
  if(match(/\b(music|song|sing|choir|band|jam|worship|performance|concert)\b/i,lower))
    return canned('music','A 25-minute music circle you can actually run',
      '0–3 min — Welcome and agree on volume, accessibility and whether recording is allowed.\n3–7 min — One person plays or sings a familiar, permissioned piece. Others may listen.\n7–15 min — Repeat a simple refrain together or tap a shared rhythm. No one has to perform.\n15–21 min — Each participant may offer one new line or sound; skipping is fine.\n21–25 min — End with one agreed piece and invite feedback without requiring a sign-up.\n\nNo performers, venue, recordings or music licenses are assumed.',
      'Use the 25-minute plan as written, with only voluntary participants.',kitLink);
  if(match(/\b(event|gathering|potluck|church night|festival|community night|fellowship|meetup|host a|organize)\b/i,lower))
    return canned('event','A 75-minute community gathering you can run',
      '0–10 min — Welcome people; name the purpose and any accessibility needs.\n10–25 min — Shared food, introductions or a no-pressure activity.\n25–40 min — Invite anyone to name one useful local need; nobody must disclose private details.\n40–55 min — Offer a small optional shared activity with clear roles and a stop point.\n55–65 min — Ask what actually changed; distinguish plans from completed acts.\n65–75 min — Thank people, clean up, and let anyone leave without signing up.\n\nA venue, food safety arrangements, invitations and any required permissions still belong to the host.',
      'Use the sequence as a draft agenda; the host confirms venue, food and safeguarding.',kitLink);
  return {status:'HOLD',heading:'I cannot verify a ready tool for that yet.',
    body:'I understood the goal: “'+input+'”. The currently reviewed local tools do not have a tested procedure for this exact request. I will not invent a partner, claim a service is operating, or hand you a generic invitation as if it solved the problem.',
    next:'One useful clarification: what finished result would let you say this is done today?',
    blocker:'NO_VERIFIED_CAPABILITY_MATCH',capability:null,
    connection:{label:'Try a focused First Circle conversation',href:'./first-circle/',note:'Its offline tools can prepare work for certain tasks; no external assistance is guaranteed.'}};
}
