import {test} from 'node:test';
import assert from 'node:assert/strict';
const M = await import('../app/model.mjs').catch(()=>({}));
test('manifest validation stays inside a nested static base',()=>{
 assert.equal(typeof M.validateManifest,'function');
 const base='https://example.org/webZ/';
 assert.equal(M.validateManifest(M.manifests[0],base).world_id,M.WORLDS[0]);
 for(const bad of ['javascript:alert(1)','data:text/html,x','//evil.org/','../escape/','https://evil.org/','worlds/%2e%2e/','worlds/a/?secret=x','worlds/a/#secret','worlds/a/\\evil']){
  const m=structuredClone(M.manifests[0]);m.doors[0].to_entry=bad;assert.throws(()=>M.validateManifest(m,base));
 }
 const extra={...M.manifests[0],authority:'grant'};assert.throws(()=>M.validateManifest(extra,base));
 const dup=structuredClone(M.manifests[0]);dup.doors.push(dup.doors[0]);assert.throws(()=>M.validateManifest(dup,base));
});
test('discovery and remain do not cross; explicit round trip carries nothing',()=>{
 assert.equal(typeof M.append,'function');let j=M.empty();
 j=M.append(j,{kind:'INSPECT',from:M.WORLDS[0],to:M.WORLDS[1]});
 j=M.append(j,{kind:'REMAIN',from:M.WORLDS[0],to:M.WORLDS[1]});
 assert.equal(M.project(j).arrivals,0);
 j=M.append(j,{kind:'DEPART',from:M.WORLDS[0],to:M.WORLDS[1]});
 j=M.append(j,{kind:'ARRIVE',from:M.WORLDS[0],to:M.WORLDS[1]});
 j=M.append(j,{kind:'RETURN',from:M.WORLDS[1],to:M.WORLDS[0]});
 j=M.append(j,{kind:'ARRIVE',from:M.WORLDS[1],to:M.WORLDS[0]});
 assert.equal(M.project(j).arrivals,2);assert.equal(M.project(j).current_world,M.WORLDS[0]);
 assert.ok(j.events.every(e=>e.carry_mode==='none'));
 assert.throws(()=>M.append(M.empty(),{kind:'ARRIVE',from:M.WORLDS[0],to:M.WORLDS[1]}));
 assert.throws(()=>M.append(j,{kind:'DEPART',from:M.WORLDS[0],to:'unknown'}));
 assert.throws(()=>M.append(j,{kind:'DEPART',from:M.WORLDS[0],to:M.WORLDS[1],carry_mode:'protected'}));
});
test('proposal consent, UTF-8 byte bound and independent immutable human choices',async()=>{
 assert.equal(typeof M.proposal,'function');
 await assert.rejects(()=>M.proposal('hello',false));await assert.rejects(()=>M.proposal('🪐'.repeat(513),true));
 await assert.rejects(()=>M.proposal('Bearer abc.def.ghi',true));
 const p=await M.proposal('A public seed for both worlds.',true);let j=M.empty();
 j=M.choose(j,M.WORLDS[0],p,'HOLD');j=M.choose(j,M.WORLDS[1],p,'REFUSE');
 assert.deepEqual(M.project(j).decisions.map(d=>d.decision),['HOLD','REFUSE']);
 assert.throws(()=>M.choose(j,M.WORLDS[1],p,'ADMIT'));
 j=M.choose(j,M.WORLDS[0],p,'ADMIT');assert.equal(M.project(j).decisions.at(-1).decision,'ADMIT');
 assert.ok(!JSON.stringify(j).includes('A public seed'));assert.ok(j.events.every(e=>e.authority==='browser-local-observation'));
});
test('frozen export verifies integrity and replays without repairing malformed history',async()=>{
 assert.equal(typeof M.freeze,'function');let j=M.empty();
 j=M.append(j,{kind:'DEPART',from:M.WORLDS[0],to:M.WORLDS[1]});
 j=M.append(j,{kind:'UNRESOLVED',from:M.WORLDS[0],to:M.WORLDS[1]});
 const f=await M.freeze(j);assert.deepEqual(M.project(await M.thaw(f)),M.project(j));
 const bad=structuredClone(f);bad.record.events[0].to_world_id=M.WORLDS[0];await assert.rejects(()=>M.thaw(bad));
 const seq=structuredClone(j);seq.events[0].seq=9;assert.throws(()=>M.project(seq));
 const extra=structuredClone(j);extra.secret='no';assert.throws(()=>M.project(extra));
 const event=structuredClone(j);event.events[0].authority='MAXHINAL';assert.throws(()=>M.project(event));
});
test('Remain resolves a pending explicit departure without inventing arrival',()=>{
 let j=M.append(M.empty(),{kind:'DEPART',from:M.WORLDS[0],to:M.WORLDS[1]});
 j=M.append(j,{kind:'REMAIN',from:M.WORLDS[0],to:M.WORLDS[1]});
 assert.equal(M.project(j).pending_departure,null);assert.equal(M.project(j).arrivals,0);
});

for (const [label, consent] of [
 ['string true', 'true'],
 ['string false', 'false'],
 ['empty string', ''],
 ['empty object', {}],
 ['object with consent flag', {consent: true}],
 ['empty array', []],
 ['array containing true', [true]],
 ['number zero', 0],
 ['number one', 1],
 ['negative number', -1],
 ['NaN', NaN],
 ['Infinity', Infinity],
 ['null', null],
 ['undefined', undefined],
]) {
 test(`proposal rejects ${label} consent`, async () => {
  await assert.rejects(
   () => M.proposal('A bounded public seed.', consent),
   /PUBLIC_TEXT_AND_CONSENT_REQUIRED/,
  );
 });
}
