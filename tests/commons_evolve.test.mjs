import test from 'node:test';
import assert from 'node:assert/strict';
import {origin} from '../commons-selfplay/engine.mjs';
import {createLeague,evolve,faceoff,runWorld,checkGenes,DEFAULT_GENES,MAX_GENERATIONS,exportLeague} from '../commons-evolve/evolution.mjs';
import {readFileSync} from 'node:fs';

test('league is deterministic with same seed and unseen holdout worlds',()=>{
 const a=createLeague(2026),b=createLeague(2026);
 assert.deepEqual(a,b);assert.equal(a.ranked.length,8);
 assert.equal(a.ranked[0].training.length,4);
 assert.equal(a.ranked[0].tests.length,2);
 assert.equal(a.evidence,'FICTIONAL_SIMULATION_NOT_HUMAN_EVIDENCE');
});
test('descendants mutate exactly one bounded gene, with unchanged elites',()=>{
 const a=createLeague(2026),b=evolve(a),parents=a.ranked.slice(0,2);
 assert.equal(a.generation,1);assert.equal(b.generation,2);
 assert.equal(b.history.length,2);assert.equal(a.history.length,1);
 for(const p of parents)assert(b.ranked.some(x=>x.parent===p.id&&JSON.stringify(x.genes)===JSON.stringify(p.genes)));
 for(const c of b.ranked.filter(x=>x.note==='One bounded inherited mutation')){
   const p=parents.find(x=>x.id===c.parent);assert(p);
   assert.equal(Object.keys(c.genes).filter(k=>c.genes[k]!==p.genes[k]).length,1);
 }
 assert.deepEqual(evolve(createLeague(2026)),b);
});
test('evolution terminates after twelve generations',()=>{
 let world=createLeague(47);
 for(let i=1;i<MAX_GENERATIONS;i++)world=evolve(world);
 assert.equal(world.generation,12);assert.throws(()=>evolve(world),/Maximum/);
});
test('all material is accounted for across three seasons, isolation and commons',()=>{
 for(const climate of ['normal','drought','storm','combined'])for(const seed of [0,41,2026]){
   const initial=origin(seed).actors.reduce((n,p)=>n+p.stock.food,0);
   for(const genes of [DEFAULT_GENES,null]){
     const w=runWorld({seed,climate},genes,14);
     assert.equal(w.metrics.fed+w.metrics.unmet,168);
     assert.equal(initial+w.metrics.produced.food+w.metrics.injected.food,
       w.metrics.fed+w.metrics.spoiled+w.actors.reduce((n,p)=>n+p.food,0));
   }
 }
});
test('weather intervention is described; opt-out agents never donate',()=>{
 const genes={reserve:0,reach:6,helpCap:3,bridge:true,order:'scarcity'};
 const w=runWorld({seed:41,climate:'combined'},genes);
 assert(w.events.some(x=>x.type==='DROUGHT'));
 assert(w.events.some(x=>x.type==='STORM'));
 const no=new Set(w.actors.filter(x=>!x.willing).map(x=>x.id));
 for(const e of w.events.filter(x=>x.type==='SHARED'))for(const id of no)assert(!e.detail.startsWith(id+' →'));
 assert.equal(w.metrics.injected.food,0);
});
test('no infinite policy, unauthorized consent fields or fake climate',()=>{
 assert.throws(()=>checkGenes({...DEFAULT_GENES,forceConsent:true}),/Invalid/);
 assert.throws(()=>checkGenes({...DEFAULT_GENES,reach:999}),/Invalid/);
 assert.throws(()=>createLeague(-1),/seed/i);
 assert.throws(()=>runWorld({seed:41,climate:'magic'},DEFAULT_GENES),/Invalid/);
});
test('world faceoff is labeled fictional and reports full rations',()=>{
 const league=createLeague(2026),face=faceoff(league,{seed:41,climate:'combined'});
 assert.equal(face.champion.metrics.fed+face.champion.metrics.unmet,168);
 assert.equal(face.isolated.metrics.transfers,0);
 const exportData=exportLeague(league,face);
 assert.match(exportData.warning,/zero real human/);
 assert.equal(exportData.evidence,'FICTIONAL_SIMULATION_NOT_HUMAN_EVIDENCE');
});
test('UI is offline, non-networked and contains no untrusted HTML injection',()=>{
 const h=readFileSync(new URL('../commons-evolve/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../commons-evolve/app.mjs',import.meta.url),'utf8');
 const en=readFileSync(new URL('../commons-evolve/evolution.mjs',import.meta.url),'utf8');
 assert.match(h,/connect-src 'none'/);
 assert.match(h,/not a real society/i);
 assert.match(js,/textContent/);assert.match(js,/replaceChildren/);assert.match(js,/FICTIONAL-/);
 assert.doesNotMatch(js,/innerHTML|document\.write|\bfetch\s*\(/);
 assert.doesNotMatch(en,/\bfetch\s*\(|WebSocket|localStorage|sessionStorage|supabase/i);
});