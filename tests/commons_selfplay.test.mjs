import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {origin,seal,inspect,step,runDays,fork,experiment,verifyPair,scoreDelta} from '../commons-selfplay/engine.mjs';

test('same seed + same scripts produce identical world hashes on independent replays',async()=>{
 const start=await seal(origin(41));
 const a=await experiment(start,7,'storm');
 const b=await experiment(start,7,'storm');
 assert.equal(a.isolated.contentHash,b.isolated.contentHash);
 assert.equal(a.commons.contentHash,b.commons.contentHash);
 assert.equal(await verifyPair(a),true);
 assert.notEqual(a.commons.contentHash,a.isolated.contentHash);
});
test('two worlds fork from same parent without mutating that parent',async()=>{
 const start=await seal(origin(61)),saved=JSON.stringify(start);
 const result=await experiment(start,7,'drought');
 assert.equal(JSON.stringify(start),saved);
 assert.equal(result.isolated.world.parentHash,start.contentHash);
 assert.equal(result.commons.world.parentHash,start.contentHash);
 assert.equal(result.isolated.world.day,7);
 assert.equal(result.commons.world.day,7);
 assert.equal(result.commons.world.lineage.length,1);
});
test('operator events remain visible and injection is never credited as cooperation',async()=>{
 const start=await seal(origin(41));
 const rain=await experiment(start,5,'drought');
 assert(rain.commons.world.trace.some(t=>t.type==='DIRECTOR_DROUGHT'));
 const storm=await experiment(start,4,'storm');
 assert(storm.commons.world.trace.some(t=>t.type==='DIRECTOR_STORM'));
 const relief=await experiment(start,4,'relief');
 assert.equal(relief.commons.world.metrics.granted.food,6);
 assert(relief.isolated.world.trace.some(t=>t.type==='DIRECTOR_INJECTION'&&t.who==='DIRECTOR_SIM'));
});
test('forced no-consent world cannot transfer or combine volunteered resources',async()=>{
 const w=origin(41);
 for(const p of w.actors)p.willing=false;
 const parent=await seal(w),result=await experiment(parent,5);
 assert.equal(result.commonsScore.transfers,0);
 assert.equal(result.commonsScore.structures,0);
 assert.equal(result.commons.world.infrastructure.bridge,false);
 assert.equal(result.commonsScore.refusals>=0,true);
});
test('separate fictional contributors must spend wood and tool for a shared bridge',async()=>{
 const start=await seal(origin(41));
 const result=await experiment(start,3);
 assert.equal(result.commons.world.infrastructure.bridge,true);
 assert.equal(result.commons.world.metrics.buildSpent.wood,1);
 assert.equal(result.commons.world.metrics.buildSpent.tool,1);
 const shared=result.commons.world.trace.find(e=>e.type==='SHARED_BRIDGE');
 assert.match(shared.detail,/distinct scripted donors/);
 assert.equal(result.isolated.world.infrastructure.bridge,false);
});
test('only branch copies advance; decline-safe isolated world does not make transfers',async()=>{
 const start=await seal(origin(19));
 const isolate=await fork(start,'isolated');
 const coop=await fork(start,'commons');
 const isolated=runDays(isolate,12),cooperative=runDays(coop,12);
 assert.equal(isolated.metrics.transfers,0);
 assert.equal(isolated.metrics.structures,0);
 assert.equal(isolate.day,0);
 assert.equal(coop.day,0);
 assert(cooperative.metrics.fed>=0);
 assert.equal(isolated.metrics.fed+isolated.metrics.unmet,12*12);
 assert.equal(cooperative.metrics.fed+cooperative.metrics.unmet,12*12);
});
test('cartridges can continue as new branches without overwriting ancestors',async()=>{
 const originPacket=await seal(origin(7));
 const generation=await experiment(originPacket,3);
 const child=await experiment(generation.commons,3,'storm');
 assert.equal(child.parent.contentHash,generation.commons.contentHash);
 assert.equal(child.commons.world.lineage.length,2);
 assert.equal(child.commons.world.day,6);
 assert.equal(generation.commons.world.day,3);
 assert.equal(await verifyPair(child),true);
});
test('tampering, fake authority, malformed settings, and invented proof fail closed',async()=>{
 const packet=await seal(origin(41));
 assert.throws(()=>origin(-1));
 assert.throws(()=>runDays(origin(41),15));
 assert.throws(()=>step(origin(41)),/Fork/);
 assert.rejects(inspect({...packet,proof:'SIGNED_BY_A_HUMAN'}));
 const changed=structuredClone(packet);changed.world.actors[0].stock.food+=1;
 await assert.rejects(inspect(changed),/changed/);
 const fake=structuredClone(packet);fake.world.mode='LIVE';
 await assert.rejects(inspect(fake),/Invalid/);
 await assert.rejects(fork(packet,'force-all'),/Invalid/);
 await assert.rejects(fork(packet,'commons','earthquake'),/Invalid/);
});
test('the browser is local-only, safe text nodes, honest simulation markers',()=>{
 const html=readFileSync(new URL('../commons-selfplay/index.html',import.meta.url),'utf8');
 const client=readFileSync(new URL('../commons-selfplay/app.mjs',import.meta.url),'utf8');
 const src=readFileSync(new URL('../commons-selfplay/engine.mjs',import.meta.url),'utf8');
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/Not AI models/);
 assert.match(html,/hash is not a signature/);
 assert.match(html,/Scripted consent/);
 assert.match(client,/textContent/);
 assert.match(client,/replaceChildren/);
 assert.match(client,/FAKE-WORLD-/);
 for(const s of [client,src])assert.doesNotMatch(s,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|WebSocket/);
});
