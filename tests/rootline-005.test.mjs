import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {plant,grow,verifyChain,readableCard,viewText,validateMessage,SCHEMA,MAX_ADDITIONS} from '../post-office/rootline/rootline-core.mjs';
const cp=x=>structuredClone(x);
test('an original human-written public encouragement becomes a bounded local seed',async()=>{
 const seed=await plant('I am glad you made it this far.');
 const verified=await verifyChain(JSON.stringify(seed));
 assert.equal(verified.schema,SCHEMA);
 assert.equal(verified.origin.message,'I am glad you made it this far.');
 assert.equal(verified.additions.length,0);
 assert.match(verified.origin.id,/^[a-f0-9]{32}$/);
 assert.match(verified.origin.link,/^sha256:[a-f0-9]{64}$/);
 assert.doesNotMatch(JSON.stringify(seed),/"contact"|"sender"|"recipient"|"phone"|"email"|"date"|"timestamp"/);
 assert.match(readableCard(seed),/No need to reply or pass it on/);
});
test('A–B–C chain preserves every distinct authored sentence and parent links',async()=>{
 const a=await plant('This day might be difficult, but your presence matters.');
 const b=await grow(a,'I carried this through a rainy day.');
 const c=await grow(b,'Somebody else can keep it now.');
 const received=await verifyChain(JSON.stringify(c));
 assert.equal(received.additions.length,MAX_ADDITIONS);
 assert.equal(received.origin.link,a.origin.link);
 assert.equal(received.additions[0].previous,a.origin.link);
 assert.equal(received.additions[1].previous,b.additions[0].link);
 assert.equal(viewText(c),'This day might be difficult, but your presence matters.\n\n—\n\nI carried this through a rainy day.\n\n—\n\nSomebody else can keep it now.');
 assert.deepEqual((await verifyChain(a)).origin,received.origin);
 await assert.rejects(grow(c,'A fourth hop would encourage chain pressure.'),/ROOTLINE_FULL/);
});
test('tampering with any note, link, hop order or injected metadata fails closed',async()=>{
 const chain=await grow(await grow(await plant('Keep the light, even if only for a little while.'),'You can rest here.'),'Another day is coming.');
 const mutations=[
  x=>{x.origin.message='Malicious replacement';},
  x=>{x.origin.link='sha256:'+'0'.repeat(64);},
  x=>{x.origin.recipient='secret phone';},
  x=>{x.policy='FORWARD_TO_TEN';},
  x=>{x.additions[0].message='Changed while in transit';},
  x=>{x.additions[0].previous='sha256:'+'f'.repeat(64);},
  x=>{x.additions[0].index=9;},
  x=>{x.additions[1].link='sha256:'+'a'.repeat(64);},
  x=>{x.additions.push(x.additions[1]);},
  x=>{x.extra='hidden contact list';}
 ];
 for(const mutate of mutations){const altered=cp(chain);mutate(altered);await assert.rejects(verifyChain(altered))}
 await assert.rejects(verifyChain('{bad'));
 await assert.rejects(verifyChain(' '.repeat(3900)));
});
test('notes reject obvious contacts, URLs, control text and oversized payloads',()=>{
 for(const message of ['','a','https://example.com','Visit www.example.com','contact jane@example.com',
  'Call 505 555 0101', 'hello\nworld', 'x'.repeat(221)]){
  assert.throws(()=>validateMessage(message),message.slice(0,15));
 }
 assert.equal(validateMessage('  This is enough.  '),'This is enough.');
});
test('ROOTLINE is manual, public-only and separate from Post Office subscriptions and PWA',()=>{
 const ui=readFileSync(new URL('../post-office/rootline/rootline.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../post-office/rootline/index.html',import.meta.url),'utf8');
 const release=readFileSync(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const path of ['post-office/rootline/','post-office/rootline/rootline.mjs','post-office/rootline/rootline-core.mjs','post-office/rootline/style.css'])
  assert.ok(release.includes("'"+path+"'"),path);
 assert.doesNotMatch(ui,/fetch\(|WebSocket|EventSource|sendBeacon|RTCPeerConnection|indexedDB|localStorage|sessionStorage|sms:|mailto:/);
 assert.doesNotMatch(html,/name="email"|type="email"|name="phone"|type="tel"|<form/i);
 assert.doesNotMatch(sw,/post-office\/rootline/);
 assert.match(ui,/plant-consent/);
 assert.match(ui,/grow-consent/);
 assert.match(html,/No need|no/i);
});
