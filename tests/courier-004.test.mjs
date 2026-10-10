import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonical,verify,portableHtml} from '../post-office/seed-lab/seed.mjs';
import {newParcel,verifyParcel,forwardParcel,receiveReceipt,verifyReceipt,size,MAX_PARCEL_BYTES} from '../post-office/seed-lab/courier/courier-core.mjs';
const seed=JSON.parse(readFileSync(new URL('../post-office/seed-lab/seed-000.json',import.meta.url),'utf8'));
const cp=x=>structuredClone(x);
test('A issues a verified portable public parcel without receiver identity',async()=>{
 const p=await newParcel(seed);
 assert.deepEqual((await verifyParcel(p)).seed.payload,seed.payload);
 assert.equal(p.journey.hops.length,1);
 assert.equal(p.journey.hops[0].action,'ISSUE');
 assert.equal(p.journey.hops[0].station,'A');
 assert.match(p.journey.id,/^[a-f0-9]{32}$/);
 assert.ok(size(JSON.stringify(p))<MAX_PARCEL_BYTES);
 assert.doesNotMatch(JSON.stringify(p),/subscriber[-_]?email|buttondown|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
});
test('B forwards the exact same verified source after a durable HOLD',async()=>{
 const initial=await newParcel(seed);
 const out=await forwardParcel(initial);
 assert.equal(out.journey.hops.length,2);
 assert.equal(out.journey.hops[1].action,'FORWARD');
 assert.equal(out.journey.hops[1].station,'B');
 assert.equal(out.journey.hops[1].previous,initial.journey.hops[0].link);
 assert.equal(canonical(out.seed),canonical(initial.seed));
 await assert.rejects(()=>forwardParcel(out),/PARCEL_ALREADY_FORWARDED/);
});
test('C independently verifies source and all transit hashes without access to A',async()=>{
 const initial=await newParcel(seed);
 const carried=JSON.stringify(await forwardParcel(initial));
 const reconstructed=await verifyParcel(carried);
 const localReceipt=await receiveReceipt(reconstructed);
 assert.equal(localReceipt.station,'C');
 assert.equal(localReceipt.authority,'unsigned-device-observation');
 assert.deepEqual(await verifyReceipt(JSON.stringify(localReceipt),reconstructed),localReceipt);
 const page=portableHtml(reconstructed.seed,0,10);
 assert.match(page,/We play where we arrive/);
 assert.doesNotMatch(page,/<script|<form|<iframe|buttondown/i);
 await assert.rejects(()=>receiveReceipt(initial),/RECEIVE_REQUIRES_FORWARD/);
});
test('tamper: source, journey, changed station and replays fail closed',async()=>{
 const start=await newParcel(seed),middle=await forwardParcel(start);
 for(const mutate of [
  p=>{p.seed.payload.sections[0].text='altered by courier';},
  p=>{p.journey.hops[1].station='A';},
  p=>{p.journey.hops[0].link='sha256:'+'0'.repeat(64);},
  p=>{p.journey.hops[1].previous='sha256:'+'1'.repeat(64);},
  p=>{p.journey.hops[1].action='RECEIVE';},
  p=>{p.journey.hops[1].extra='hidden';},
  p=>{p.journey.hops.push(p.journey.hops[1]);},
  p=>{p.schema='unbounded-transport';},
  p=>{p.journey.id='not-a-valid-uuid';},
 ]){const altered=cp(middle);mutate(altered);await assert.rejects(()=>verifyParcel(altered));}
 await assert.rejects(()=>verifyParcel('not json'));
 await assert.rejects(()=>verifyParcel(' '.repeat(MAX_PARCEL_BYTES+1)));
 const r=await receiveReceipt(middle);r.parent='fake';await assert.rejects(()=>verifyReceipt(r,middle),/RECEIPT_MISMATCH/);
});
test('new courier public export stays outside the PWA and auto-sync boundary',()=>{
 const release=readFileSync(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../post-office/seed-lab/courier/courier.mjs',import.meta.url),'utf8');
 const page=readFileSync(new URL('../post-office/seed-lab/courier/index.html',import.meta.url),'utf8');
 for(const path of ['post-office/seed-lab/courier/','post-office/seed-lab/courier/courier.mjs','post-office/seed-lab/courier/courier-core.mjs'])assert.ok(release.includes("'"+path+"'"),path);
 assert.doesNotMatch(sw,/seed-lab\/courier/);
 assert.doesNotMatch(ui,/fetch\(\s*['"]https?:|WebSocket|EventSource|sendBeacon|RTCPeerConnection/);
 assert.doesNotMatch(page,/name="email"|type="email"|autoplay|<iframe/);
 assert.match(ui,/indexedDB\.open/);
 assert.match(ui,/hold-consent/);
 assert.match(ui,/forward-consent/);
 assert.match(ui,/receive-consent/);
});
