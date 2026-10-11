import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectReceipt} from '../receipts/inspect.mjs';
import {projectAncestry,makeGoatnoteHandoff} from '../receipts/goatnote.mjs';
import {createSignedReceiptWitness} from './receipt-witness-002.mjs';
const date='2026-10-11T12:00:00.000Z';
test('a verified GrO journal gives real receiver-local edges and exact preserved source',async()=>{
 const raw=JSON.stringify(createSignedReceiptWitness());
 const report=await inspectReceipt(raw);
 const graph=projectAncestry(raw,report);
 assert.equal(graph.nodes.length,3);
 assert.equal(graph.edges.length,2);
 assert.equal(graph.edges[0].posture,'VERIFIED_JOURNAL_LINK');
 assert.equal(graph.historical_crossing_authorized,false);
 const packet=await makeGoatnoteHandoff(raw,report,date);
 assert.equal(packet.source.json,raw);
 assert.equal(packet.source.schema,'gro.abundent-signed-receiver/v0');
 assert.match(packet.source.sha256,/^sha256:[a-f0-9]{64}$/);
 assert.match(packet.checksum,/^sha256:[a-f0-9]{64}$/);
 assert.equal(packet.inspection.mode,'LOCAL_JOURNAL_VERIFIED');
 assert.equal(packet.authority,'NO_AUTHORITY_TRANSFER');
});
test('a standalone receipt has a reference-only missing crossing, not invented verification',async()=>{
 const raw=JSON.stringify(createSignedReceiptWitness().events[1].receipt);
 const r=await inspectReceipt(raw),g=projectAncestry(raw,r);
 assert.equal(g.edges.length,1);
 assert.equal(g.edges[0].posture,'SIGNED_REFERENCE_ONLY');
 assert.equal(g.nodes[0].posture,'REFERENCE_ONLY');
 assert.equal(g.nodes[1].posture,'VERIFIED_OBJECT');
});
test('archive descendants are reported-only claims, even after export',async()=>{
 const raw=readFileSync(new URL('../receipts/fixtures/cannon-009.json',import.meta.url),'utf8');
 const r=await inspectReceipt(raw),packet=await makeGoatnoteHandoff(raw,r,date);
 assert.equal(packet.inspection.cryptographic_verification,false);
 assert.equal(packet.ancestry.nodes.every(n=>n.posture==='ARCHIVE_CLAIM'),true);
 assert.equal(packet.ancestry.edges.every(e=>e.posture==='ARCHIVE_CLAIM'),true);
});
test('unknown or unsupported ancestry profiles refuse',async()=>{
 const raw=JSON.stringify(createSignedReceiptWitness().carrier.crossing);
 const r=await inspectReceipt(raw);
 const x=JSON.parse(raw);
 x.parents=Array.from({length:25},(_,i)=>'parent:'+i);
 assert.throws(()=>projectAncestry(x,r),/LIMIT/);
 await assert.rejects(makeGoatnoteHandoff(raw,{mode:'AUTHORITY_GRANTED'}));
 await assert.rejects(makeGoatnoteHandoff(' '.repeat(131073),r));
});
test('browser export stays deliberate with no native receiver or network send',()=>{
 const ui=readFileSync(new URL('../receipts/ui.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../receipts/index.html',import.meta.url),'utf8');
 const core=readFileSync(new URL('../receipts/goatnote.mjs',import.meta.url),'utf8');
 assert.match(ui,/goatExport.*addEventListener\('click'/);
 assert.match(ui,/URL.createObjectURL/);
 assert.match(html,/id="goatExport" disabled/);
 assert.doesNotMatch(core,/fetch\(|localStorage|WebSocket|sendBeacon/);
});
