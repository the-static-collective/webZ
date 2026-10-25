import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {researchTargets} from '../src/triad.mjs';
import {assemble} from '../src/worker.mjs';
import {selectSources} from '../src/registry.mjs';
import {verifyReturn} from '../public/evidence.mjs';
import {publicContext,investigate} from '../src/investigator.mjs';

const q='Which food access project should ask a willing steward for permission before a small experiment?';
const body='# Source project constitution\nAn inspected public document is not a local stewards agreement or proof that work was completed.\nA reversible community experiment requires explicit permission from a real organizer before field work.\n';
const mock=async()=>new Response(body);

test('triad uses exactly three immutable owner README pins; normal source selection remains separate',()=>{
 const targets=researchTargets('triad');
 assert.deepEqual(targets.map(x=>x.id),['alex','3rdi','loadout']);
 assert.deepEqual(targets.map(x=>x.repo),['ALEX.2','3rdi','Loadout']);
 assert.ok(targets.every(x=>/^[0-9a-f]{40}$/.test(x.ref)&&x.path==='README.md'));
 assert.equal(researchTargets('standard'),null);
 assert.throws(()=>researchTargets('auto-execute'),/RESEARCH_LENS/);
 const standard=selectSources(q,'question',['food']);
 assert.notDeepEqual(standard.map(x=>x.id),targets.map(x=>x.id));
});

test('ALEX formation witnesses, 3rdi observer cut and LOADOUT fence are local receipt-bound representations',async()=>{
 const calls=[];
 const obj=await assemble(q,(url)=>{calls.push(url);return mock()},{kind:'question',lens:'triad'});
 assert.equal(calls.length,3);
 assert.ok(calls.every(url=>/^https:\/\/raw\.githubusercontent\.com\/the-static-collective\/(?:ALEX\.2|3rdi|Loadout)\/[0-9a-f]{40}\/README\.md$/.test(url)));
 assert.deepEqual(obj.sources.map(s=>s.id),['alex','3rdi','loadout']);
 assert.equal(obj.triad.nativeRuntimesInvoked,false);
 assert.equal(obj.triad.authority,'NONE');
 assert.equal(obj.triad.usableWitnesses,3);
 assert.ok(obj.triad.alex.formation.every(f=>f.status==='INSPECTED'&&/^sha256:/.test(f.sha256)&&/#L\d+$/.test(f.excerptLocus)));
 assert.equal(obj.triad.alex.claimLayer,'UNESTABLISHED');
 assert.equal(obj.triad.rdi.cut.occurrenceTime,'UNKNOWN_FOR_SOURCE_HISTORY');
 assert.equal(obj.triad.rdi.cut.observedAt,obj.observedAt);
 assert.ok(obj.triad.loadout.fenced.includes('partner_contact'));
 assert.ok(obj.triad.loadout.fenced.includes('project_code_execution'));
 assert.ok(obj.triad.loadout.selected.every(d=>d.decision==='READ_OBSERVED'));
 assert.equal(obj.triad.loadout.nativeBind,false);
 assert.equal(obj.workbenchRequest.authority,'NONE');
 assert.equal(obj.workbenchRequest.dispatch,'MANUAL_EXPORT_ONLY');
 assert.ok(obj.steps.some(s=>s.name==='ALEX provenance floor'&&s.status==='READ'));
 assert.ok(obj.steps.some(s=>s.name==='3rdi observer cut'&&s.status==='PREPARED'));
 assert.ok(obj.steps.some(s=>s.name==='LOADOUT effect fence'&&s.status==='PREPARED'));
 assert.equal(await verifyReturn(obj),true);
 const tampered=structuredClone(obj);tampered.triad.loadout.fenced.pop();
 assert.equal(await verifyReturn(tampered),false);
});

test('missing owner documents remain HOLDS and never become fabricated evidence',async()=>{
 const result=await assemble(q,async()=>{throw Error('unavailable')},{kind:'plan',lens:'triad'});
 assert.equal(result.triad.usableWitnesses,0);
 assert.ok(result.triad.alex.formation.every(x=>x.sha256===null&&x.excerptLocus===null&&x.status==='UNAVAILABLE'));
 assert.ok(result.triad.rdi.projections.every(x=>x.availability==='HOLD'));
 assert.ok(result.triad.loadout.selected.every(x=>x.decision==='UNAVAILABLE_HOLD'));
 assert.ok(result.triad.unresolved.length>0);
 assert.equal(await verifyReturn(result),true);
 await assert.rejects(()=>assemble(q,mock,{lens:'write'}),/RESEARCH_LENS/);
});

test('model receives only bounded observed excerpts and explicit three-owner constraints, never grants effects',async()=>{
 let used=0;
 const proposal=await investigate({question:q,kind:'question',lens:'triad',
   assemble:(question,_,opts)=>assemble(question,mock,opts),
   provider:async ({input,system})=>{
     used++;
     const context=JSON.parse(input);
     assert.equal(context.sourceObservations.length,3);
     assert.ok(context.sourceObservations.every(x=>x.excerpt.length<=235));
     assert.equal(context.researchCut.alex.claimLayer,'UNESTABLISHED');
     assert.ok(context.researchCut.loadout.fenced.includes('partner_contact'));
     assert.equal(context.researchCut.loadout.nativeBind,false);
     assert.match(system,/not native runtimes|never as native runtimes/);
     return {choices:[{message:{content:JSON.stringify({
       summary:'An unsigned research proposition with no participant enrolled.',
       connections:[{idea:'Review one draft with a willing steward before publishing.',sourceIds:[]}],
       firstTest:'Ask one willing responsible person to review a bounded, fictional example.',
       unknowns:['Host willingness and actual conditions remain unverified.'],
       consentCheck:'No one has been contacted or signed up.'
     })}}]};
   }
 });
 assert.equal(used,1);
 assert.equal(proposal.status,'MODEL_PROPOSAL');
 assert.equal(proposal.sourceReferences.length,3);
 assert.equal(proposal.authority,'NONE');
});

test('triad opt-in is explicit in browser, model request and page; no implicit adoption in default',()=>{
 const page=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
 assert.match(page,/id="triad-opt-in" type="checkbox"/);
 assert.match(page,/NO NATIVE TOOL EXECUTION/);
 assert.ok(app.includes("triadToggle.checked?'triad':'standard'"));
 assert.ok(app.includes("lens:last.triad?'triad':'standard'"));
 assert.ok(app.includes("if(data.triad)"));
});
