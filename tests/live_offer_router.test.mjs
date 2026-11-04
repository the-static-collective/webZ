import test from 'node:test';
import assert from 'node:assert/strict';
import {CARTRIDGE} from '../jubilee/live/cartridge.mjs';
import {readFileSync} from 'node:fs';
import {validateCartridge,interpret,propose,learn} from '../jubilee/live/router.mjs';
test('cartridge has no authority, even when copied into another system',()=>{assert.ok(validateCartridge(CARTRIDGE));assert.throws(()=>validateCartridge({...CARTRIDGE,authority:'SIGNED'}),/BOUNDARY/);});
test('now-first when a person explicitly says now',()=>{const p=propose('I can play guitar for 20 minutes right now',CARTRIDGE);assert.equal(p.intent.when,'now');assert.equal(p.intent.kind,'music');assert.equal(p.intent.durationMinutes,20);assert.equal(p.actions[0].id,'record-audio');assert.ok(p.actions.some(a=>a.id==='stream'));});
test('now is suggested, not presumed',()=>{const p=propose('I can play guitar for 20 minutes',CARTRIDGE);assert.equal(p.intent.when,'unspecified');assert.equal(p.intent.nowCandidate,true);assert.ok(p.actions.some(a=>a.id==='record-audio'));});
test('no secretly inferring now after not now',()=>{const p=propose('I cannot play guitar now, maybe later',CARTRIDGE);assert.equal(p.intent.when,'later');assert.ok(p.actions.every(a=>!a.id.startsWith('record-')));});
test('other kinds retain useful action paths without turning into wrong answers',()=>{for(const [input,kind] of [['I have extra vegetables','food'],['Can I give someone a ride soon?','transport'],['I can repair a laptop','tools'],['I have a question','question']]){const p=propose(input,CARTRIDGE);assert.equal(p.intent.kind,kind);assert.ok(p.actions.some(a=>a.id==='private-offer'));assert.ok(p.actions.some(a=>a.id==='catalog'));}});
test('manual selection can override temporal guess; learning is bounded and caller-owned',()=>{const p=propose('I can play guitar now',CARTRIDGE,{when:'later'});assert.equal(p.intent.when,'later');const first=learn({},'catalog');assert.deepEqual(Object.getPrototypeOf(first),null);assert.equal(first.catalog,1);assert.equal(learn({catalog:20},'catalog').catalog,20);assert.throws(()=>learn({},'send-to-strangers'));});
test('future edges must exist',()=>{const bad=structuredClone(CARTRIDGE);bad.actions[0].next.push('fake-action');assert.throws(()=>validateCartridge(bad),/UNKNOWN_ACTION_EDGE/);});

test('browser module and transported cartridge data have identical source semantics',()=>{const portable=JSON.parse(readFileSync(new URL('../jubilee/live/cartridge.json',import.meta.url),'utf8'));assert.deepEqual(portable,CARTRIDGE);});
