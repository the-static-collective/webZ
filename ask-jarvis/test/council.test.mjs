import test from 'node:test';
import assert from 'node:assert/strict';
import {assemble} from '../src/worker.mjs';
import {council,COUNCIL_PINS,parseScout,parseCritic} from '../src/council.mjs';
import {verifyCouncil,matchesCouncilSources} from '../public/evidence.mjs';

const question='What single missing ingredient could turn a surplus food table with volunteers and music into one safe steward-reviewed experiment?';
const text={summary:'dummy'};
const mockSource=async(url)=>new Response(
  url.includes('/ALEX.2/')?'# ALEX.2\n## Constitutional line\nhistorical object != scan != interpretation != claim\n':
  url.includes('/3rdi/')?'# 3rdi\n## The floor\noccurrence != availability != attention role != relevance\n':
  url.includes('/LOADOUT/')?'# LOADOUT\n## What LOADOUT owns\nKnowledge may load, but authority does not silently expand.\n':
  '# TABLElogic\nA willing host must review the draft with participants before any proposed action.\n',
  {status:200,headers:{'content-type':'text/plain'}}
);
const scout={
  hypothesis:'A small food-access discussion might bridge existing volunteer energy and an individual need.',
  missingIngredient:'One willing steward who can identify an actual unmet food need and review a tiny draft.',
  whyThisOne:'Without an actual identified need, there is no justified experiment to select.',
  sourceIds:['loadout'],firstQuestion:'Would one willing steward review a single food-access draft without agreeing to host it?',
  firstTest:'Invite one willing steward to review a paper-only draft, without sending invitations or handling food.',
  unknowns:['The relevant need is not confirmed.','No steward has agreed.'],
  consentCheck:'The actual steward and any participants must consent to their scoped roles before any real activity.'
};
const critic={
  verdict:'REVISE',pressure:'The missing steward is still only a proposed role and needs direct confirmation.',
  evidenceGap:'No source establishes a specific person or actual priority food need.',
  sourceIds:['3rdi'],smallestCheck:'Ask one willing steward to review a paper-only need/offer question and decide whether it represents a real gap.',
  disagreement:'The scout could prematurely treat a hypothetical food need as a demonstrated local condition.'
};
test('ALEX, 3rdi and LOADOUT use immutable exact-commit read-only source pins',()=>{
  assert.deepEqual(COUNCIL_PINS.map(x=>x.id),['alex','3rdi','loadout']);
  assert.ok(COUNCIL_PINS.every(x=>/^[0-9a-f]{40}$/.test(x.commit)));
  assert.ok(COUNCIL_PINS.every(x=>x.url.includes('/blob/'+x.commit+'/README.md')));
});
test('two-provider protocol sees one source-first scout and then a critic who sees scout, without execution',async()=>{
  let calls=0,scoutPayload,criticPayload;
  const result=await council({question,kind:'plan',assemble,fetcher:mockSource,
    scoutProvider:async({system,input})=>{
      calls++;scoutPayload=JSON.parse(input);assert.match(system,/missing ingredient/i);
      assert.ok(!('apiKey' in scoutPayload));
      assert.ok(scoutPayload.notes.length>=3);
      return {choices:[{message:{content:JSON.stringify(scout)}}]};
    },
    criticProvider:async({system,input})=>{
      calls++;criticPayload=JSON.parse(input);assert.match(system,/pressure tester/);
      assert.deepEqual(criticPayload.scout,scout);
      return {choices:[{message:{content:JSON.stringify(critic)}}]};
    }});
  assert.equal(calls,2);
  assert.equal(result.status,'COUNCIL_PROPOSAL');
  assert.equal(result.modelCalls,2);
  assert.equal(result.authority,'NONE');
  assert.equal(result.pressureVerdict,'HOLD');
  assert.equal(result.missingIngredientStatus,'UNVERIFIED_HYPOTHESIS');
  assert.equal(result.sourceReferences.filter(x=>['alex','3rdi','loadout'].includes(x.id)).length,3);
  assert.equal(await verifyCouncil(result),true);
  const parent=await assemble(question,mockSource,{kind:'plan'});
  assert.equal(matchesCouncilSources(parent,result),true);
  const fake=structuredClone(result);fake.critic.pressure='Changed after receipt';assert.equal(await verifyCouncil(fake),false);
  const forged=structuredClone(result);forged.sourceReferences.find(x=>x.id==='loadout').commit='a'.repeat(40);
  assert.equal(matchesCouncilSources(parent,forged),false);
});
test('first provider failure stops before critic; no source prevents both calls',async()=>{
  let first=0,second=0;
  const failed=await council({question,assemble,fetcher:mockSource,
    scoutProvider:async()=>{first++;throw Error('FREE_PROVIDER_HTTP_429');},
    criticProvider:async()=>{second++;return JSON.stringify(critic);}
  });
  assert.equal(failed.status,'HOLD');
  assert.equal(failed.reason,'FREE_PROVIDER_HTTP_429');
  assert.equal(second,0);
  const offline=async()=>{throw Error('offline')};
  const held=await council({question,assemble,fetcher:offline,
    scoutProvider:async()=>{first++;return JSON.stringify(scout)},
    criticProvider:async()=>{second++;return JSON.stringify(critic)}});
  assert.equal(held.status,'HOLD');
  assert.equal(held.reason,'NO_INSPECTED_SOURCES');
  assert.equal(first,1);assert.equal(second,0);
});
test('criticism failing returns partial HOLD, not an accepted consensus',async()=>{
  const result=await council({question,assemble,fetcher:mockSource,
    scoutProvider:async()=>JSON.stringify(scout),
    criticProvider:async()=>{throw Error('FREE_PROVIDER_HTTP_404')}});
  assert.equal(result.status,'PARTIAL_HOLD');
  assert.equal(result.reason,'FREE_PROVIDER_HTTP_404');
  assert.equal(result.modelCalls,2);
  assert.equal(result.critic,null);
  assert.equal(await verifyCouncil(result),false);
});
test('fabricated source IDs, invalid shapes and scope violations cannot be presented as cited claims',()=>{
  assert.throws(()=>parseScout(JSON.stringify({...scout,sourceIds:['imaginary-org']}),['3rdi','loadout']),/COUNCIL_BAD_SHAPE/);
  assert.throws(()=>parseCritic(JSON.stringify({...critic,verdict:'RUN_EVENT'}),['3rdi','loadout']),/COUNCIL_BAD_SHAPE/);
  assert.throws(()=>parseCritic(JSON.stringify({...critic,sourceIds:['fake']}),['3rdi','loadout']),/COUNCIL_BAD_SHAPE/);
});
