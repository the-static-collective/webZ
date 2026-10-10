import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildWitness} from '../scripts/name-orchard-001-core.mjs';
import {packClaim,assembleTexts,postcard,parseSegment,CHUNK,MAX_PARTS,MAX_BYTES} from '../scripts/name-orchard-002-sms.mjs';

const candidate=()=>buildWitness().claims[0];
test('one signed real song claim survives offline SMS reorder and duplicate delivery',()=>{
 const claim=candidate(),parts=packClaim(claim);
 assert.ok(parts.length>1&&parts.length<=MAX_PARTS);
 assert.ok(parts.every(p=>p.length<=140&&/^[\x20-\x7e]+$/.test(p)));
 const received=assembleTexts([...parts].reverse().concat(parts[0]));
 assert.equal(received.state,'SIGNED_CLAIM_VERIFIED');
 assert.deepEqual(received.claim,claim);
 assert.equal(received.claim.body.subject.title,'Let It Find Us');
 assert.ok(!parts.join('').includes('BEGIN PRIVATE KEY'));
});
test('missing fragments must HOLD instead of accepting partial signature or name',()=>{
 const parts=packClaim(candidate());
 const result=assembleTexts(parts.slice(1));
 assert.equal(result.state,'HOLD_MISSING_PARTS');
 assert.deepEqual(result.missing,[1]);
 assert.equal(result.claim,null);
});
test('same-index disagreement and mixed messages fail closed',()=>{
 const parts=packClaim(candidate());
 const other=packClaim(candidate());
 const changed=parts[0].slice(0,-1)+(parts[0].at(-1)==='X'?'Y':'X');
 assert.throws(()=>assembleTexts([...parts,changed]),/SMS_CONFLICTING_DUPLICATE/);
 assert.throws(()=>assembleTexts([parts[0],other[0]]),/SMS_MIXED_MESSAGES/);
});
test('altered transport content and signature fail independently',()=>{
 const parts=packClaim(candidate());
 const p=parts[0],last=p.slice(-1)==='X'?'Y':'X';
 assert.throws(()=>assembleTexts([p.slice(0,-1)+last,...parts.slice(1)]),/SMS_TRANSPORT_HASH_MISMATCH/);
});
test('numeric bounds, shells, rogue separators and fake sender text fail',()=>{
 const parts=packClaim(candidate());
 for(const fake of [
  'NO2-ffffffffffff-00-02-aaa','NO2-ffffffffffff-02-01-aaa',
  'NO2-ffffffffffff-01-99-aaa','NO2-ffffffffffff-01-01-aaa?token=hi',
  'sms body: '+parts[0], 'https://evil.example/'+parts[0],
  'NO2-ffffffffffff-01-01-'+('a'.repeat(CHUNK+1)),
  parts[0]+'☺'
 ])assert.throws(()=>parseSegment(fake));
 assert.throws(()=>assembleTexts([]));
 assert.throws(()=>assembleTexts(Array(74).fill(parts[0])),/SMS_INPUT_LIMIT/);
});
test('source authority cannot be invented through a syntactically correct unsiged message',()=>{
 const claim=candidate(),parts=packClaim(claim);
 const mixed=parts.join('\n').replace(/NO2/g,'NO3');
 assert.throws(()=>assembleTexts(mixed));
 const forged=structuredClone(claim);
 forged.body.subject.title='Wrong song';
 assert.throws(()=>packClaim(forged),/BAD_SIGNATURE/);
});
test('human one-text invitation is brief but explicitly unsigned',()=>{
 const msg=postcard();
 assert.ok(msg.length<=140);
 assert.ok(msg.includes('https://suno.com/s/'));
 assert.ok(!msg.startsWith('NO2'));
});
test('browser has no silent send, provider fetch, audio or off-device save',()=>{
 const html=readFileSync(new URL('../worlds/name-orchard/sms.html',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../worlds/name-orchard/sms.mjs',import.meta.url),'utf8');
 assert.ok(html.includes("connect-src 'none'"));
 assert.ok(html.includes("media-src 'none'"));
 assert.ok(browser.includes("crypto.subtle.verify('Ed25519'"));
 assert.ok(browser.includes("sms:?body="));
 assert.ok(browser.includes("navigator.share"));
 assert.ok(browser.includes("navigator.clipboard"));
 assert.ok(!browser.includes('fetch('));
 assert.ok(!browser.includes('localStorage'));
 assert.ok(!browser.includes('WebSocket'));
 assert.ok(!browser.includes('sendTextMessage'));
 assert.ok(!html.includes('<audio'));
 assert.ok(MAX_BYTES<=2048);
 execFileSync(process.execPath,['--check',fileURLToPath(new URL('../worlds/name-orchard/sms.mjs',import.meta.url))],{stdio:'pipe'});
});
