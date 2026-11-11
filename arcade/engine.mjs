// Question Arcade — deterministic, inspectable learning and bounded routing.
// No external API calls, no user profiling, no silent training from guesses.
export const KINDS = [
  { id: 'sunseed', name: 'Sunseed', emoji: '✦', hue: 44, shape: 0.93, size: 0.40, note: 'warm · pointed · small' },
  { id: 'riverbean', name: 'Riverbean', emoji: '◖', hue: 166, shape: 0.48, size: 0.66, note: 'green · oval · medium' },
  { id: 'moonbulb', name: 'Moonbulb', emoji: '●', hue: 254, shape: 0.12, size: 0.78, note: 'violet · round · large' }
];
export const STORAGE_KEY = 'question-arcade-v1';
export const SCOUT_MS = 12000;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const round = (x, dp=3) => Number(x.toFixed(dp));
export function rng(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function makeSpecimen(serial, seed=2027) {
  const r = rng((serial * 1664525 + seed) >>> 0);
  const kind = KINDS[serial % KINDS.length];
  // Small, overlapping clusters. The underlying decision boundary is genuinely learned.
  const jitter = () => (r() + r() + r() - 1.5) / 1.5;
  const hue = clamp(kind.hue / 360 + jitter() * 0.19, 0, 1);
  const shape = clamp(kind.shape + jitter() * 0.32, 0, 1);
  const size = clamp(kind.size + jitter() * 0.32, 0, 1);
  return { id: `spec-${seed}-${serial}`, kind: kind.id, features: {hue:round(hue), shape:round(shape), size:round(size)} };
}
export function distance(a, b) {
  return Math.sqrt(0.9 * (a.hue - b.hue) ** 2 + 1.3 * (a.shape - b.shape) ** 2 + 0.7 * (a.size - b.size) ** 2);
}
export function predict(examples, features, k=3) {
  if (!examples.length) return null;
  const nearest = examples
    .map(e => ({kind:e.kind, id:e.id, distance:distance(e.features,features)}))
    .sort((a,b)=>a.distance - b.distance).slice(0, Math.min(k,examples.length));
  const votes = {};
  for (const item of nearest) votes[item.kind] = (votes[item.kind] || 0) + 1 / (item.distance + 0.08);
  const ranked = Object.entries(votes).sort((a,b)=>b[1]-a[1]);
  const total = ranked.reduce((sum,[,weight])=>sum+weight,0);
  return { kind: ranked[0][0], voteShare:round(ranked[0][1]/total,2), nearest:nearest.map(x=>({...x,distance:round(x.distance)})) };
}
export const HOLDOUT = Object.freeze(Array.from({length:45}, (_,i) => makeSpecimen(i + 90, 8877)));
export function evaluate(examples) {
  if (!examples.length) return { correct:0,total:HOLDOUT.length,accuracy:0 };
  const correct = HOLDOUT.reduce((sum, sample)=>sum + Number(predict(examples,sample.features)?.kind === sample.kind),0);
  return {correct,total:HOLDOUT.length, accuracy:Math.round(correct / HOLDOUT.length * 100)};
}
export const NEEDS = [
  {id:'need-dinner',name:'Community dinner needs produce',tags:['food','produce','dinner'],place:'Waseca'},
  {id:'need-ride',name:'Volunteer needs a delivery ride',tags:['transport','delivery','ride'],place:'Waseca'},
  {id:'need-seeds',name:'School garden needs seeds',tags:['garden','seeds','education'],place:'Waseca'}
];
export const OFFERS = [
  {id:'offer-farm',name:'Farm has extra produce',tags:['food','produce','farm'],place:'Waseca'},
  {id:'offer-driver',name:'Neighbor offers van time',tags:['transport','delivery','ride'],place:'Waseca'},
  {id:'offer-garden',name:'Seed library has spare seeds',tags:['garden','seeds','education'],place:'Waseca'},
  {id:'offer-music',name:'Musician offers a rehearsal',tags:['music','lesson','performance'],place:'Mankato'}
];
export function pairFeatures(need, offer) {
  const shared = need.tags.filter(tag=>offer.tags.includes(tag));
  return { overlap:shared.length/3, samePlace:Number(need.place===offer.place), food:Number(offer.tags.includes('food')), mobility:Number(offer.tags.includes('transport')) };
}
// A second, genuinely trainable k-NN signal. Player-reviewed *synthetic* pairs
// can change priority, but cannot defeat a hard no-shared-tag refusal.
export function learnedPairSignal(need,offer,lessons=[]) {
  if (!lessons.length) return null;
  const f=pairFeatures(need,offer);
  const known=lessons.map(l=>{
    const n=NEEDS.find(n=>n.id===l.needId),o=OFFERS.find(o=>o.id===l.offerId);
    if(!n||!o||typeof l.helpful!=='boolean')return null;
    const x=pairFeatures(n,o);
    const d=Math.sqrt(2*(f.overlap-x.overlap)**2+(f.samePlace-x.samePlace)**2+.3*(f.food-x.food)**2+.3*(f.mobility-x.mobility)**2);
    return {helpful:l.helpful,d};
  }).filter(Boolean).sort((a,b)=>a.d-b.d).slice(0,3);
  if (!known.length)return null;
  const yes=known.reduce((s,x)=>s+(x.helpful?1:0)/(x.d+.25),0);
  const all=known.reduce((s,x)=>s+1/(x.d+.25),0);
  return round(yes/all,3);
}
export function rankOffers(need, offers=OFFERS, lessons=[]) {
  if (!need) return [];
  return offers.map(offer=>{
    const shared = need.tags.filter(tag=>offer.tags.includes(tag));
    const samePlace = offer.place===need.place;
    const baseScore=shared.length * 3 + Number(samePlace);
    const learned=learnedPairSignal(need,offer,lessons);
    const score=shared.length ? round(baseScore + (learned===null?0:(learned-.5)*3),2) : 0;
    return {offer,shared,samePlace,baseScore,learned,score,decision:'SUGGESTION_ONLY'};
  }).sort((a,b)=>b.score-a.score || a.offer.id.localeCompare(b.offer.id));
}
export function canUnlockScout(examples) {
  return examples.length >= 6 && KINDS.every(k=>examples.some(e=>e.kind===k.id)) && evaluate(examples).accuracy>=60;
}
export function canUnlockRouting(examples) {
  return examples.length >= 9 && KINDS.every(k=>examples.filter(e=>e.kind===k.id).length>=2) && evaluate(examples).accuracy>=70;
}
export function newState(now=Date.now()) {
  return {version:1,serial:0,examples:[],queued:[],routeLessons:[],scoutSerial:0,lastScout:now,points:0,corrections:0,decisions:[],activeNeed:NEEDS[0].id,events:[],createdAt:new Date(now).toISOString()};
}
export function cleanState(input, now=Date.now()) {
  if (!input || input.version!==1 || !Array.isArray(input.examples)) return newState(now);
  const validKind = new Set(KINDS.map(x=>x.id));
  const cleanExample = e => e && typeof e.id==='string' && validKind.has(e.kind) && e.features && ['hue','shape','size'].every(p=>Number.isFinite(e.features[p]) && e.features[p]>=0 && e.features[p]<=1);
  return {
    ...newState(now), ...input,
    serial:clamp(Math.floor(Number(input.serial)||0),0,1000000),
    scoutSerial:clamp(Math.floor(Number(input.scoutSerial)||0),0,1000000),
    examples:input.examples.filter(cleanExample).slice(-1000),
    queued:Array.isArray(input.queued)?input.queued.filter(q=>q&&q.sample&&cleanExample(q.sample)).slice(-12):[],
    decisions:Array.isArray(input.decisions)?input.decisions.filter(x=>x&&typeof x.needId==='string').slice(-30):[],
    routeLessons:Array.isArray(input.routeLessons)?input.routeLessons.filter(x=>x&&NEEDS.some(n=>n.id===x.needId)&&OFFERS.some(o=>o.id===x.offerId)&&typeof x.helpful==='boolean').slice(-60):[],
    events:Array.isArray(input.events)?input.events.filter(x=>typeof x==='string').slice(-16):[],
    lastScout:Number.isFinite(input.lastScout)?clamp(input.lastScout,0,now):now,
    points:clamp(Number(input.points)||0,0,100000000),
    corrections:clamp(Number(input.corrections)||0,0,100000000)
  };
}
// Deliberately generates *predictions only*. Time away never creates trusted labels.
export function catchUpScouts(state, now=Date.now()) {
  if (!canUnlockScout(state.examples)) {state.lastScout=now; return 0;}
  const elapsed = Math.max(0,now-state.lastScout);
  const cycles=Math.min(32, Math.floor(elapsed/SCOUT_MS));
  let made=0;
  for (let i=0;i<cycles && state.queued.length<12;i++) {
    const sample = makeSpecimen(3000+state.scoutSerial++, 441);
    state.queued.push({sample,guess:predict(state.examples,sample.features),at:new Date(now).toISOString()});
    made++;
  }
  state.lastScout = now - (elapsed % SCOUT_MS);
  return made;
}
export function buildHeldCrossing(state, needId, offerId, now=Date.now()) {
  const need=NEEDS.find(n=>n.id===needId);
  const ranked=rankOffers(need,OFFERS,state.routeLessons).find(o=>o.offer.id===offerId);
  if(!need || !ranked || !ranked.shared.length) throw new Error('No supported shared tag. Refuse this route.');
  return {
    schema:'question-arcade/held-crossing/v1', id:`qa-local-${now}-${state.decisions.length}`,
    status:'HOLD', authority:'NONE', source:'Question Arcade local demonstration',
    origin:'SYNTHETIC_FIXTURES_ONLY', receiver:'JAR;VIS review inbox (not connected)',
    proposedNeed:{id:need.id,title:need.name,place:need.place},
    proposedOffer:{id:ranked.offer.id,title:ranked.offer.name,place:ranked.offer.place},
    method:'tag-overlap-with-optional-reviewed-knn-v1', evidence:{sharedTags:ranked.shared,score:ranked.score,samePlace:ranked.samePlace,routeLessonsUsed:state.routeLessons.length},
    model:{kind:'local-knn-3',lessonCount:state.examples.length,holdout:evaluate(state.examples),routeLessonCount:state.routeLessons.length,examplesIncluded:false},
    permissions:{transmission:false,publication:false,realWorldAction:false,recipientConsent:false},
    reviewedBy:'local player (self-attested)', createdAt:new Date(now).toISOString(),
    notice:'Illustration, not evidence of an actual need, offer, partner, exchange, or real-world outcome.'
  };
}
