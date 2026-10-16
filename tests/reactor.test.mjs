import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateReactor,selectedCatalogParticular,selectedLocalParticular,rankChambers,composeCandidate} from '../composer/reactor.mjs';
const raw=readFileSync(new URL('../composer/reactor-catalog.json',import.meta.url),'utf8');
const catalog=JSON.parse(raw);
const clone=()=>structuredClone(catalog);
test('pin valid 64 conversation seeds and 8 independent unissued chambers',()=>{
 assert.equal(validateReactor(catalog),true);
 assert.equal(catalog.seeds.length,64);
 assert.equal(catalog.chambers.length,8);
 assert.equal(catalog.provenance.sourceCommit,'7481da74c98b66ef34daf04a6d36458fedae7167');
 assert.equal(new Set(catalog.chambers.flatMap(c=>[...c.primary,...c.orbit])).size,64);
 assert.equal(catalog.chambers.reduce((a,c)=>a+c.primary.length+c.orbit.length,0),98);
 assert.ok(catalog.seeds.every(s=>s.disposition==='UNKNOWN'&&s.confidence==='LOW'));
});
test('all source groups and 34 multi-chamber seed leads survive',()=>{
 const counts=new Map();
 for(const c of catalog.chambers)for(const id of [...c.primary,...c.orbit])counts.set(id,(counts.get(id)||0)+1);
 assert.equal([...counts.values()].filter(n=>n>1).length,34);
 for(const [group,n] of Object.entries({N:12,M:10,V:9,W:10,P:11,C:12}))
  assert.equal(catalog.seeds.filter(s=>s.id.startsWith(group)).length,n);
});
test('suggestions are medium-affinity only, never execution permissions',()=>{
 const song=selectedCatalogParticular({id:'song:abc',label:'My Source Song',kind:'song',
  source:'music/rooms/catalog.json',owner:'The Static Collective',url:'https://suno.com/song/abc'});
 const first=rankChambers(catalog,song);
 assert.equal(first[0].chamber.id,'FOSSIL-JUKEBOX');
 assert.equal(first[1].chamber.id,'ORCHARD-CINEMA');
 assert.match(first[0].basis,/no source, rights/);
 const plan=composeCandidate(catalog,song,first[0].chamber.id);
 assert.equal(plan.status,'PROPOSED_UNVERIFIED');
 assert.equal(plan.authority,'NONE');
 assert.deepEqual(plan.effects,{published:false,executed:false,ownerAdmitted:false,mediaTransferred:false});
 assert.ok(plan.chamber.unsatisfiedGates.length>=2);
 assert.ok(plan.chamber.coreProposalsNotDependencies.every(x=>x.disposition==='UNKNOWN'&&x.confidence==='LOW'));
 assert.equal(plan.particular.catalogId,'song:abc');
});
test('local input remains unverified, bounded and never becomes an address',()=>{
 const local=selectedLocalParticular('   a  living     question   ','question');
 assert.equal(local.label,'a living question');
 assert.equal(local.url,null);
 assert.equal(local.sourceKind,'LOCAL_UNVERIFIED');
 const plan=composeCandidate(catalog,local,'MISSION-FORGE');
 assert.equal(plan.particular.catalogId,null);
 assert.equal(plan.particular.sourceKind,'LOCAL_UNVERIFIED');
 assert.deepEqual(plan,composeCandidate(catalog,local,'MISSION-FORGE'));
 assert.ok(!JSON.stringify(plan).includes('https://abundent.org/composer/#'));
 for(const input of ['', ' '.repeat(8), 'x'.repeat(161)])assert.throws(()=>selectedLocalParticular(input));
 assert.throws(()=>selectedLocalParticular('hello','identity'));
});
test('bad corpus, misleading escalation, forged members and missing consent gates all fail closed',()=>{
 const dropped=clone();dropped.seeds.pop();assert.throws(()=>validateReactor(dropped),/counts/);
 const promoted=clone();promoted.seeds[0].disposition='LANDED';assert.throws(()=>validateReactor(promoted),/illicit seed promotion/);
 const repeat=clone();repeat.chambers[0].orbit.push(repeat.chambers[0].primary[0]);assert.throws(()=>validateReactor(repeat),/duplicate local member/);
 const added=clone();added.chambers[0].orbit.push('Z99');assert.throws(()=>validateReactor(added),/unrecognized member/);
 const gates=clone();gates.chambers[0].gates=[];assert.throws(()=>validateReactor(gates),/composition gate/);
 const changed=clone();changed.state='LANDED';assert.throws(()=>validateReactor(changed),/schema or authority/);
});
test('input catalogs and compound relationships remain untouched',()=>{
 const before=JSON.stringify(catalog);
 for(const c of catalog.chambers)composeCandidate(catalog,selectedLocalParticular('reversible thing','object'),c.id);
 assert.equal(JSON.stringify(catalog),before);
 assert.ok(catalog.chambers.every(c=>c.primary.length>0));
});
