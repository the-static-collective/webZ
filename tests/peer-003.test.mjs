import test from 'node:test';
import assert from 'node:assert/strict';
import {randomSession,makeSignal,parseSignal,packSeed,parseSeedMessage,receipt,parseReceipt,pairingCode,MAX_WIRE_BYTES} from '../post-office/seed-lab/peer/peer-core.mjs';
import {readFileSync} from 'node:fs';
import {verify} from '../post-office/seed-lab/seed.mjs';
const seed=JSON.parse(readFileSync(new URL('../post-office/seed-lab/seed-000.json',import.meta.url),'utf8'));
const session='0123456789abcdef0123456789abcdef';
const sdp=(marker)=>'v=0\r\n'+('o=- 0 0 IN IP4 127.0.0.1\r\n').repeat(2)+'a=fingerprint:sha-256 '+marker.repeat(95)+'\r\n';
const offer=makeSignal('offer',session,seed.digest,sdp('a'));
const answer=makeSignal('answer',session,seed.digest,sdp('b'));
test('strict manual signal is bounded, session-linked and rejects counterfeit shape',()=>{
 assert.equal(parseSignal(JSON.stringify(offer),'offer').session,session);
 assert.throws(()=>parseSignal(JSON.stringify(offer),'answer'));
 assert.throws(()=>parseSignal(JSON.stringify({...offer,extra:'backdoor'})));
 assert.throws(()=>parseSignal(JSON.stringify({...offer,session:'invalid'})));
 assert.throws(()=>parseSignal(JSON.stringify({...offer,sdp:'v=0\nno fingerprint'})));
 assert.throws(()=>parseSignal(JSON.stringify({...offer,digest:'sha256:'+'a'.repeat(63)})));
 assert.throws(()=>parseSignal('x'.repeat(43000)));
 assert.throws(()=>parseSignal('{broken'));
});
test('two exchanged signals derive the same peer code; switched session is refused',async()=>{
 const a=await pairingCode(offer,answer);
 const b=await pairingCode(JSON.parse(JSON.stringify(offer)),JSON.parse(JSON.stringify(answer)));
 assert.match(a,/^[A-F0-9]{12}$/);
 assert.equal(a,b);
 await assert.rejects(pairingCode(offer,{...answer,session:'a'.repeat(32)}));
 assert.match(randomSession(),/^[a-f0-9]{32}$/);
});
test('receiver gets exactly a bounded seed, and re-verifies original content',async()=>{
 const packet=packSeed(seed,session);
 assert.ok(new TextEncoder().encode(packet).length<MAX_WIRE_BYTES);
 const arrived=parseSeedMessage(packet,session,seed.digest);
 assert.deepEqual(await verify(arrived),seed.payload);
 assert.throws(()=>parseSeedMessage(packet,'f'.repeat(32),seed.digest));
 assert.throws(()=>parseSeedMessage(JSON.stringify({...JSON.parse(packet),extra:true}),session,seed.digest));
 assert.throws(()=>parseSeedMessage('q'.repeat(MAX_WIRE_BYTES+1),session,seed.digest));
 const fake=structuredClone(seed);fake.payload.title='counterfeit';
 await assert.rejects(verify(parseSeedMessage(packSeed(fake,session),session,seed.digest)));
});
test('receipt is explicitly UNSIGNED local observation and binds exact session and digest',()=>{
 const r=receipt(session,seed.digest);
 assert.equal(r.authority,'unsigned-local-peer-observation');
 assert.deepEqual(parseReceipt(JSON.stringify(r),session,seed.digest),r);
 assert.throws(()=>parseReceipt(JSON.stringify(r),'f'.repeat(32),seed.digest));
 assert.throws(()=>parseReceipt(JSON.stringify({...r,decision:'ACCEPTED_AS_TRUTH'}),session,seed.digest));
 assert.throws(()=>parseReceipt(JSON.stringify({...r,authority:'signed-crossing'}),session,seed.digest));
});
test('no server signaling/relay, service worker caching or subscriber data included',()=>{
 const ui=readFileSync(new URL('../post-office/seed-lab/peer/peer.mjs',import.meta.url),'utf8');
 const page=readFileSync(new URL('../post-office/seed-lab/peer/index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const release=readFileSync(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/WebSocket|EventSource|sendBeacon|fetch\(\s*['"]https?:|localStorage|sessionStorage/);
 assert.doesNotMatch(page,/subscriber-email|name="email"|type="email"/);
 assert.doesNotMatch(sw,/seed-lab\/peer/);
 assert.match(release,/post-office\/seed-lab\/peer\/peer-core\.mjs/);
 assert.match(ui,/stun:stun\.l\.google\.com:19302/); // strictly opt-in
 assert.match(ui,/receive-consent/);
 assert.match(ui,/send-consent/);
 assert.match(ui,/compare/);
});
