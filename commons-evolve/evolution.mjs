import {origin} from '../commons-selfplay/engine.mjs';

/* COMMONS SELF-PLAY 002 — bounded strategy evolution
 * Toy-world deterministic genetic search. No external effects or model inference.
 * Reuses actor seeding from the sibling Commons Self-Play 001 engine.
 */


export const EVOLUTION_SCHEMA='abundent/commons-self-play-evolution/v1';
export const EVIDENCE='FICTIONAL_SIMULATION_NOT_HUMAN_EVIDENCE';
export const CLIMATES=Object.freeze(['normal','drought','storm','combined']);
export const TRAIN=Object.freeze([{seed:41,climate:'normal'},{seed:107,climate:'drought'},{seed:251,climate:'storm'},{seed:463,climate:'combined'}]);
export const HOLDOUT=Object.freeze([{seed:503,climate:'combined'},{seed:901,climate:'drought'}]);
export const DAYS=14;
export const MAX_GENERATIONS=12;
export const POPULATION=8;
export const MAX_SEED=999999;
const GENE_KEYS=['reserve','reach','helpCap','bridge','order'];
const STOCK=['food','wood','tool'];
const integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const clone=x=>structuredClone(x);
export function seeded(seed){
 if(!integer(seed,0,4294967295))throw Error('Seed out of bounds.');
 let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
}
function checkScenario(s){if(!s||!integer(s.seed,0,MAX_SEED)||!CLIMATES.includes(s.climate))throw Error('Invalid fictional scenario.');}
export function checkGenes(g){
 if(!g||Object.keys(g).sort().join(',')!==GENE_KEYS.slice().sort().join(',')||
   !integer(g.reserve,0,3)||!integer(g.reach,1,6)||!integer(g.helpCap,1,3)||
   typeof g.bridge!=='boolean'||!['nearest','scarcity'].includes(g.order))throw Error('Invalid bounded policy.');
 return g;
}
export const DEFAULT_GENES=Object.freeze({reserve:1,reach:3,helpCap:1,bridge:true,order:'nearest'});
function idFor(g,slot){return 'G'+String(g).padStart(2,'0')+'-P'+String(slot).padStart(2,'0');}
export function randomGenes(random){
 return checkGenes({reserve:Math.floor(random()*4),reach:1+Math.floor(random()*6),
  helpCap:1+Math.floor(random()*3),bridge:random()>.3,order:random()>.5?'nearest':'scarcity'});
}
export function mutate(parent,random){
 const changed={...checkGenes(parent)};
 const which=GENE_KEYS[Math.floor(random()*GENE_KEYS.length)];
 if(which==='reserve')changed.reserve=(changed.reserve+(random()<.5?1:3))%4;
 if(which==='reach')changed.reach=1+(changed.reach-1+(random()<.5?1:5))%6;
 if(which==='helpCap')changed.helpCap=1+(changed.helpCap%3);
 if(which==='bridge')changed.bridge=!changed.bridge;
 if(which==='order')changed.order=changed.order==='nearest'?'scarcity':'nearest';
 return checkGenes(changed);
}
const sum=(actors,type)=>actors.reduce((a,p)=>a+p.stock[type],0);
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function stateFromOrigin(seed){
 const actors=origin(seed).actors.map(a=>({...a,stock:{...a.stock},fed:0,helped:0}));
 if(actors.length!==12)throw Error('Expected twelve scripted actors.');
 return {actors,bridge:false,metrics:{fed:0,unmet:0,spoiled:0,transfers:0,
   refusals:0,effort:0,builds:0,produced:{food:0,wood:0,tool:0},
   injected:{food:0,wood:0,tool:0},spent:{food:0,wood:0,tool:0}},events:[]};
}
function log(w,day,type,detail){if(w.events.length<150)w.events.push({day,type,detail});}
function produce(w,day,climate){
 for(const a of w.actors){
  let type='food',amount=0;
  if(a.role==='farmer')amount=(climate==='drought'||climate==='combined')&&day>=4&&day<=6?0:3;
  else if(a.role==='forager')amount=day%2===1?1:0;
  else if(a.role==='maker'){type='wood';amount=day%3===0?1:0;}
  else if(a.role==='courier'){type='tool';amount=day%4===0?1:0;}
  if(amount){a.stock[type]+=amount;w.metrics.produced[type]+=amount;}
 }
 if(day===4&&(climate==='drought'||climate==='combined'))log(w,day,'DROUGHT','Farm yields reduced for three scripted days.');
 if(day===8&&(climate==='storm'||climate==='combined'))log(w,day,'STORM','Neighborhood travel radius reduced for two scripted days.');
}
function maybeBuild(w,genes,day){
 if(!genes?.bridge||w.bridge)return;
 const wood=w.actors.find(a=>a.willing&&a.stock.wood>0);
 const tool=w.actors.find(a=>a.willing&&a.id!==wood?.id&&a.stock.tool>0);
 if(!wood||!tool)return;
 wood.stock.wood--;tool.stock.tool--;w.metrics.spent.wood++;w.metrics.spent.tool++;
 w.bridge=true;w.metrics.builds++;
 log(w,day,'BRIDGE','Scripted volunteers '+wood.id+' and '+tool.id+' contributed 1 wood and 1 tool; two separate roles.');
}
function share(w,genes,day,climate){
 if(!genes)return;
 const storm=(climate==='storm'||climate==='combined')&&day>=8&&day<=9;
 const reach=Math.max(1,genes.reach+(w.bridge?2:0)-(storm?2:0));
 const helped=new Map(w.actors.map(a=>[a.id,0]));
 const needy=w.actors.filter(a=>a.stock.food===0).sort((a,b)=>a.fed-b.fed||a.id.localeCompare(b.id));
 for(const receiver of needy){
  const neighbors=w.actors.filter(a=>a.id!==receiver.id&&a.stock.food>genes.reserve&&distance(a,receiver)<=reach&&helped.get(a.id)<genes.helpCap);
  neighbors.sort((a,b)=>genes.order==='nearest'?distance(a,receiver)-distance(b,receiver)||a.id.localeCompare(b.id):
   b.stock.food-a.stock.food||distance(a,receiver)-distance(b,receiver)||a.id.localeCompare(b.id));
  for(const donor of neighbors){
   if(!donor.willing){w.metrics.refusals++;continue;}
   donor.stock.food--;receiver.stock.food++;w.metrics.transfers++;
   w.metrics.effort+=distance(donor,receiver);helped.set(donor.id,helped.get(donor.id)+1);
   if(w.events.length<150)log(w,day,'SHARED',donor.id+' → '+receiver.id+' : 1 fictional food unit; trip '+distance(donor,receiver)+'.');
   break;
  }
 }
}
function consume(w,day){
 for(const a of w.actors){
  if(a.stock.food>0){a.stock.food--;a.fed++;w.metrics.fed++;}
  else{w.metrics.unmet++;if(w.events.length<150)log(w,day,'UNMET',a.id+' could not eat a scripted ration.');}
  if(a.stock.food>3){const excess=a.stock.food-3;a.stock.food=3;w.metrics.spoiled+=excess;}
 }
}
function checkConservation(previous,w,before){
 for(const kind of STOCK){
  const delta=w.metrics.produced[kind]-previous.produced[kind];
  const injected=w.metrics.injected[kind]-previous.injected[kind];
  const spent=w.metrics.spent[kind]-previous.spent[kind];
  const consumed=kind==='food'?(w.metrics.fed-previous.fed)+(w.metrics.spoiled-previous.spoiled):0;
  if(before[kind]+delta+injected!==sum(w.actors,kind)+spent+consumed)throw Error('Resource conservation failure: '+kind);
 }
}
export function runWorld({seed,climate},genes=null,days=DAYS){
 checkScenario({seed,climate});if(genes!==null)checkGenes(genes);
 if(!integer(days,1,30))throw Error('Choose 1–30 simulated days.');
 const w=stateFromOrigin(seed);
 for(let day=1;day<=days;day++){
  const before=Object.fromEntries(STOCK.map(k=>[k,sum(w.actors,k)]));
  const previous=clone(w.metrics);
  produce(w,day,climate);
  maybeBuild(w,genes,day);
  share(w,genes,day,climate);
  consume(w,day);
  checkConservation(previous,w,before);
 }
 const worstFed=Math.min(...w.actors.map(a=>a.fed));
 const {fed,unmet,spoiled,effort,builds,transfers}=w.metrics;
 // Normative scoring choices, not discovered laws or real-world value estimates.
 const fitness=Math.round((fed*8-unmet*10-spoiled*4-effort*.6-builds*2+worstFed*3)*100)/100;
 return {schema:EVOLUTION_SCHEMA,evidence:EVIDENCE,seed,climate,days,
  genes:genes?{...genes}:null,fitness,metrics:{...clone(w.metrics),worstFed},
  actors:w.actors.map(a=>({id:a.id,x:a.x,y:a.y,role:a.role,willing:a.willing,food:a.stock.food,fed:a.fed})),
  bridge:w.bridge,events:w.events};
}
const average=a=>Math.round(a.reduce((s,n)=>s+n,0)/a.length*100)/100;
export function evaluateGenes(genes){
 checkGenes(genes);
 const training=TRAIN.map(s=>runWorld(s,genes));
 const holdout=HOLDOUT.map(s=>runWorld(s,genes));
 return {train:average(training.map(x=>x.fitness)),holdout:average(holdout.map(x=>x.fitness)),
  training:training.map(x=>({seed:x.seed,climate:x.climate,fitness:x.fitness})),
  tests:holdout.map(x=>({seed:x.seed,climate:x.climate,fitness:x.fitness}))};
}
export function baseline(){
 return {train:average(TRAIN.map(x=>runWorld(x).fitness)),
   holdout:average(HOLDOUT.map(x=>runWorld(x).fitness))};
}
function evaluatePopulation(generation,population){
 const ranked=population.map(p=>({...p,...evaluateGenes(p.genes)})).sort((a,b)=>b.train-a.train||a.id.localeCompare(b.id));
 return {generation,ranked};
}
export function createLeague(seed=2026){
 if(!integer(seed,0,MAX_SEED))throw Error('Choose a whole-number tournament seed 0–999999.');
 const rand=seeded(seed);
 const starters=[{id:idFor(1,1),parent:null,genes:{...DEFAULT_GENES},note:'Existing commons baseline'}];
 for(let i=2;i<=POPULATION;i++)starters.push({id:idFor(1,i),parent:null,genes:randomGenes(rand),note:'Seed-generated candidate'});
 const round=evaluatePopulation(1,starters);
 return {schema:EVOLUTION_SCHEMA,evidence:EVIDENCE,seed,generation:1,baseline:baseline(),
  history:[{generation:1,championId:round.ranked[0].id,
    train:round.ranked[0].train,holdout:round.ranked[0].holdout}],ranked:round.ranked};
}
export function evolve(league){
 if(league?.schema!==EVOLUTION_SCHEMA||league.evidence!==EVIDENCE||
    !integer(league.seed,0,MAX_SEED)||!integer(league.generation,1,MAX_GENERATIONS)||
    !Array.isArray(league.ranked)||league.ranked.length!==POPULATION)throw Error('Invalid scripted league.');
 if(league.generation>=MAX_GENERATIONS)throw Error('Maximum 12 generations; reset to start another.');
 const next=league.generation+1;
 const random=seeded((league.seed+next*0x9e3779b1)>>>0);
 const elites=league.ranked.slice(0,2);
 const children=elites.map((p,i)=>({id:idFor(next,i+1),parent:p.id,genes:{...p.genes},note:'Unchanged elite'}));
 for(let i=3;i<=POPULATION;i++){
  const parent=elites[(i-3)%2];
  const genes=i===POPULATION?randomGenes(random):mutate(parent.genes,random);
  children.push({id:idFor(next,i),parent:i===POPULATION?null:parent.id,genes,
   note:i===POPULATION?'New random challenger':'One bounded inherited mutation'});
 }
 const round=evaluatePopulation(next,children),winner=round.ranked[0];
 return {...league,generation:next,ranked:round.ranked,
   history:[...league.history,{generation:next,championId:winner.id,
    train:winner.train,holdout:winner.holdout}]};
}
export function faceoff(league,scenario={seed:41,climate:'combined'}){
 if(league?.schema!==EVOLUTION_SCHEMA||!league.ranked?.length)throw Error('Start a scripted league.');
 checkScenario(scenario);
 const champ=league.ranked[0];
 const winner=runWorld(scenario,champ.genes),isolated=runWorld(scenario);
 return {schema:EVOLUTION_SCHEMA,evidence:EVIDENCE,championId:champ.id,
  generation:league.generation,scenario,champion:winner,isolated,
  delta:Math.round((winner.fitness-isolated.fitness)*100)/100};
}
export function exportLeague(league,duel){
 if(league?.schema!==EVOLUTION_SCHEMA||duel?.schema!==EVOLUTION_SCHEMA||
    league.evidence!==EVIDENCE||duel.evidence!==EVIDENCE)throw Error('Not a simulation record.');
 return {schema:'abundent/commons-evolution-export/v1',evidence:EVIDENCE,
  warning:'Scripted agents, toy food units, zero real human testimony, no signatures or field outcomes',
  league:clone(league),duel:clone(duel)};
}


