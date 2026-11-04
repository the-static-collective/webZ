/**
 * ONE THING 006 — a bounded, device-local, voluntary gleaning quest.
 * No models, backends, analytics, public writes, identity or verified fulfillment.
 */
export const KINDS = Object.freeze(['material','food','skill','space','need']);
export const WHENS = Object.freeze(['now','soon','open']);
const PRIVATE = /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?\d[\d\s().-]{8,}\d)\b|\b\d{1,5}\s+\w+(?:\s+\w+){0,3}\s+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b)/i;
const words = value => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim() : '';
export function cleanThing(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Choose a real starting point.');
  const kind=raw.kind,when=raw.when,thing=words(raw.thing);
  if(!KINDS.includes(kind))throw Error('Pick one kind of resource or need.');
  if(!WHENS.includes(when))throw Error('Choose when it could be available.');
  if(thing.length<5||thing.length>180)throw Error('Describe one thing in 5–180 characters.');
  if(PRIVATE.test(thing)||/https?:\/\/|www\./i.test(thing))throw Error('Remove contact details, precise addresses and links. Keep this safe to share.');
  return Object.freeze({kind,when,thing});
}
const ROUTES = Object.freeze({
 material: {
  headline:'An object can become useful again',
  first:'Find it and check that it exists and can be safely used.',
  second:'Inspect the condition. Decide whether you can give, lend, or repair it without risk.',
  third:'If you still want to share it, describe only the item and your broad availability. Arrange details privately, with consent.',
  question:'Could somebody actually use this object as it stands?'
 },
 food: {
  headline:'Make one safe food opportunity visible',
  first:'Identify what you have and check its freshness, storage, and food-safety condition.',
  second:'Choose a small, safe use today. Perishable food needs appropriate storage and handling; discard anything unsafe.',
  third:'If food is safe and yours to share, describe the general offer. Handle pickup and personal details privately.',
  question:'Can you use or share this safely before it spoils?'
 },
 skill: {
  headline:'Make fifteen minutes of skill useful',
  first:'Choose one specific task you could demonstrate or complete within fifteen minutes.',
  second:'Prepare a tiny example, checklist, or demonstration someone could use without hiring you.',
  third:'Offer that specific result, not an unlimited promise. Ask for consent before working on another person’s property.',
  question:'What would be visibly better after fifteen minutes?'
 },
 space: {
  headline:'An hour or a corner can open a door',
  first:'Check the actual time, space, or equipment you control, and who has authority to use it.',
  second:'Define one modest, low-risk use and a clear limit. Respect privacy, accessibility, and permission.',
  third:'Describe the offer generally, without publishing a private address or promising access you cannot grant.',
  question:'What can safely happen here with permission?'
 },
 need: {
  headline:'Turn a blockage into a small solvable request',
  first:'Name the one missing tool, step, bit of knowledge, or material that blocks progress.',
  second:'Check what you already have. Write one smallest task you can do without waiting for someone else.',
  third:'If help is still needed, ask for a specific bounded contribution. Keep private circumstances and addresses out of public text.',
  question:'What single thing would make progress possible?'
 }
});
export function makeQuest(raw){
 const input=cleanThing(raw),route=ROUTES[input.kind];
 return Object.freeze({
   version:'abundent.one-thing/v1',
   input,headline:route.headline,
   question:route.question,
   steps:Object.freeze([
     Object.freeze({id:'check',label:'01 · Check what is real',text:route.first}),
     Object.freeze({id:'do',label:'02 · Do one useful thing',text:route.second}),
     Object.freeze({id:'connect',label:'03 · Connect only if useful',text:route.third})
   ]),
   evidence:'All step results are self-reported until someone independently confirms an outcome.'
 });
}
export function publicWords(quest){
 const {thing,kind,when}=cleanThing(quest.input);
 const prefix=kind==='need'?'I could use help with ':'I may be able to offer ';
 const suffix=when==='now'?' today.':when==='soon'?' soon.':' when practical.';
 const result=prefix+thing+suffix+' Please ask before assuming availability.';
 if(result.length>240)throw Error('Shorten your description before making a public invitation.');
 return result;
}
export function progress(quest,done){
 if(!quest||!Array.isArray(quest.steps))throw Error('No quest yet.');
 const ids=new Set(quest.steps.map(s=>s.id));
 if(!Array.isArray(done)||done.some(x=>!ids.has(x))||new Set(done).size!==done.length)throw Error('Invalid reported progress.');
 return Object.freeze({
   completed:done.length,total:quest.steps.length,stage:done.length===0?'PREPARED_ONLY':done.length===quest.steps.length?'SELF_REPORTED_STEPS':'SELF_REPORTED_PARTIAL',
   independentlyVerified:false
 });
}
export function fieldReport(quest,done,outcome,note=''){
 const p=progress(quest,done),text=words(note);
 if(!['worked','not-yet','different'].includes(outcome))throw Error('Choose what happened.');
 if(text.length>220||PRIVATE.test(text)||/https?:\/\/|www\./i.test(text))throw Error('Keep your note short and free of personal details.');
 const description=quest.input.thing;
 return [
  'ONE THING · LOCAL FIELD RETURN',
  'Started with: '+description,
  'Steps attempted: '+p.completed+'/'+p.total+' (self-reported)',
  'What happened: '+({worked:'Something worked', 'not-yet':'Not yet', different:'Something different'})[outcome],
  text?'Note: '+text:'',
  'Unverified personal record. Not a receipt from another person, a publication, or a guaranteed match.'
 ].filter(Boolean).join('\n');
}