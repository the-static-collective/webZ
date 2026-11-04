import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanThing,makeQuest,publicWords,progress,fieldReport,KINDS} from '../one-thing/quest-core.mjs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const input={kind:'material',thing:'Spare working screwdriver set',when:'now'};

test('one real thing produces a consequence-first, 3-step local quest',()=>{
 const quest=makeQuest(input);
 assert.equal(quest.steps.length,3);
 assert.match(quest.steps[0].text,/Find it and check/);
 assert.match(quest.steps[1].text,/Inspect the condition/);
 assert.match(quest.steps[2].text,/If you still want to share/);
 assert.doesNotMatch(quest.steps[0].text,/make another invitation/i);
});

test('food, skill, space and needs each get a distinct first action',()=>{
 assert.equal(KINDS.length,5);
 const firsts=KINDS.map(kind=>makeQuest({kind,thing:'One small real resource',when:'soon'}).steps[0].text);
 assert.equal(new Set(firsts).size,5);
 assert.match(firsts[1],/food-safety/);
 assert.match(firsts[3],/authority/);
 assert.match(firsts[4],/blocks progress/);
});

test('contact details, phone numbers and exact addresses are refused',()=>{
 for(const thing of ['jane@example.net','Call 507-555-9911','123 Main Street','https://example.com/tool','abc']){
  assert.throws(()=>cleanThing({...input,thing}));
 }
});

test('public invitation says may, requires asking, and never claims a match',()=>{
 const text=publicWords(makeQuest(input));
 assert.match(text,/may be able to offer/i);
 assert.match(text,/today/);
 assert.match(text,/ask before assuming availability/i);
 assert.doesNotMatch(text,/matched|confirmed|guaranteed/i);
});

test('every progress count is self-reported and never independently verified',()=>{
 const quest=makeQuest(input);
 assert.deepEqual(progress(quest,[]),{completed:0,total:3,stage:'PREPARED_ONLY',independentlyVerified:false});
 assert.equal(progress(quest,['check','do','connect']).stage,'SELF_REPORTED_STEPS');
 assert.equal(progress(quest,['check','do','connect']).independentlyVerified,false);
 assert.throws(()=>progress(quest,['check','check']));
 assert.throws(()=>progress(quest,['fake']));
});

test('return is a truthful self-report and blocks contact details',()=>{
 const quest=makeQuest({...input,kind:'need'});
 assert.match(fieldReport(quest,['check'],'not-yet','I checked the tools I already have'),/Not yet/);
 assert.match(fieldReport(quest,['check'],'worked'),/Unverified personal record/);
 assert.throws(()=>fieldReport(quest,[],'worked','Text me 507-555-9911'));
 assert.throws(()=>fieldReport(quest,[],'delivered'));
});

test('quest UI has no automatic external network, public post or third-party analytics',()=>{
 const html=source('one-thing/index.html');
 const js=source('one-thing/quest.mjs');
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/referrer" content="no-referrer"/);
 assert.match(html,/Only if you choose/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
 assert.match(js,/makeInvite\(/);
 assert.match(js,/localStorage\.setItem\(/);
});

test('homepage and sitemap link to a real first-action page',()=>{
 const index=source('index.html');
 const sitemap=source('sitemap.xml');
 assert.match(index,/href="\.\/one-thing\/"/);
 assert.match(sitemap,/<loc>https:\/\/abundent\.org\/one-thing\/<\/loc>/);
});
