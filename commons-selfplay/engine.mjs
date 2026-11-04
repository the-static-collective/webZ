/* COMMONS SELF-PLAY 001
 * Deterministic toy-world agent policies and immutable hash-labelled cartridges.
 * Fictional agents are rule-based scripts, NOT real humans or autonomous AI models.
 * Every effect stays inside this local simulation.
 */
export const SCHEMA='abundent/commons-self-play/v1';
export const CARTRIDGE='abundent/commons-world-cartridge/v1';
export const MODE='SIMULATION_ONLY';
export const POLICIES=Object.freeze(['isolated','commons']);
export const EVENTS=Object.freeze(['none','drought','storm','relief']);
const N=12, WIDTH=8;
const num=n=>Number.isSafeInteger(n)&&n>=0;
const idPattern=/^[a-f0-9]{64}$/;
const clone=x=>structuredClone(x);
const stock=w=>Object.fromEntries(['food','wood','tool'].map(k=>[k,w.actors.reduce((n,a)=>n+a.stock[k],0)]));
function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function log(w,type,who,detail){
 w.trace.push({day:w.day,type,who,detail});
 if(w.trace.length>500)w.trace.shift();
}
function bounded(w){
 if(!w||w.schema!==SCHEMA||w.mode!==MODE||w.authority!=='GAME_ONLY_HOLD'||
   !num(w.seed)||w.seed>999999||!num(w.day)||w.day>30||
   !Array.isArray(w.actors)||w.actors.length!==N||!Array.isArray(w.trace)||
   w.trace.length>500||!POLICIES.concat('origin').includes(w.policy)||
   !Array.isArray(w.scheduled)||w.scheduled.length>20||
   !w.metrics||!w.infrastructure||!w.weather||!Array.isArray(w.lineage)||w.lineage.length>16||
   (w.parentHash!==null&&!idPattern.test(w.parentHash)))throw Error('Invalid fictional world boundary.');
 if(w.actors.some(a=>!/^P(?:0[1-9]|1[0-2])$/.test(a.id)||!num(a.x)||a.x>=WIDTH||!num(a.y)||a.y>=WIDTH||
   !['farmer','forager','maker','courier'].includes(a.role)||typeof a.willing!=='boolean'||
   !a.stock||['food','wood','tool'].some(k=>!num(a.stock[k])||a.stock[k]>100)))
   throw Error('Invalid scripted actors or stocks.');
 if(w.scheduled.some(e=>!num(e.day)||e.day>30||!EVENTS.slice(1).includes(e.type)||e.source!=='DIRECTOR_SIM'))
   throw Error('Invalid operator intervention.');
 if(w.lineage.some(h=>!idPattern.test(h)))throw Error('Invalid cartridge lineage.');
 if(['food','wood','tool'].some(k=>!num(w.metrics.produced[k])||!num(w.metrics.granted[k])||!num(w.metrics.buildSpent[k]))||
    ['fed','unmet','spoiled','transfers','refusals','structures'].some(k=>!num(w.metrics[k])))throw Error('Invalid fictional counters.');
 if(typeof w.infrastructure.bridge!=='boolean'||!num(w.weather.droughtUntil)||!num(w.weather.stormUntil))
    throw Error('Invalid fictional terrain state.');
 return w;
}
function makeActor(i,r){
 const roles=['farmer','forager','maker','courier'];
 const role=roles[i%4];
 const x=(i*3+Math.floor(r()*3))%WIDTH,y=(i*5+Math.floor(r()*3))%WIDTH;
 return {id:'P'+String(i+1).padStart(2,'0'),x,y,role,
   willing:i%5!==0,stock:{food:Math.floor(r()*3),wood:role==='maker'?2:0,tool:role==='courier'?1:0}};
}
export function origin(seed=41){
 if(!num(seed)||seed>999999)throw Error('Seed must be an integer from 0 to 999999.');
 const random=rng(seed), actors=Array.from({length:N},(_,i)=>makeActor(i,random));
 return bounded({schema:SCHEMA,mode:MODE,authority:'GAME_ONLY_HOLD',
   seed,day:0,policy:'origin',parentHash:null,lineage:[],
   actors,scheduled:[],infrastructure:{bridge:false},
   weather:{droughtUntil:0,stormUntil:0},
   metrics:{produced:{food:0,wood:0,tool:0},granted:{food:0,wood:0,tool:0},
    buildSpent:{food:0,wood:0,tool:0},fed:0,unmet:0,spoiled:0,
    transfers:0,refusals:0,structures:0},
   trace:[{day:0,type:'WORLD_CREATED',who:'DIRECTOR_SIM',detail:'Seed '+seed+'; 12 scripted actors, not people.'}]});
}
function digestInput(v){
 if(Array.isArray(v))return '['+v.map(digestInput).join(',')+']';
 if(v!==null&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+digestInput(v[k])).join(',')+'}';
 return JSON.stringify(v);
}
async function sha(w){
 const d=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(digestInput(w)));
 return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function seal(world){
 bounded(world);
 const snapshot=clone(world);
 return Object.freeze({schema:CARTRIDGE,mode:MODE,proof:'HASH_ONLY_NOT_SIGNATURE',
   contentHash:await sha(snapshot),world:snapshot});
}
export async function inspect(packet){
 if(!packet||packet.schema!==CARTRIDGE||packet.mode!==MODE||
    packet.proof!=='HASH_ONLY_NOT_SIGNATURE'||!idPattern.test(packet.contentHash))throw Error('Not a solo simulation cartridge.');
 bounded(packet.world);
 if(await sha(packet.world)!==packet.contentHash)throw Error('Snapshot changed since hash was recorded.');
 return packet.world;
}
export async function fork(packet,policy,intervention='none'){
 const source=await inspect(packet);
 if(!POLICIES.includes(policy)||!EVENTS.includes(intervention)||source.day>=30)
   throw Error('Invalid simulated branch.');
 const w=clone(source);
 w.policy=policy;
 w.parentHash=packet.contentHash;
 w.lineage=[...source.lineage,packet.contentHash];
 if(w.lineage.length>16)throw Error('World ancestry limit reached.');
 if(intervention!=='none')w.scheduled.push({day:w.day+2,type:intervention,source:'DIRECTOR_SIM'});
 if(w.scheduled.length>20)throw Error('Event deck is full.');
 log(w,'BRANCH_CREATED','DIRECTOR_SIM',policy+' policy; parent hash '+packet.contentHash.slice(0,12)+'; event '+intervention+'.');
 return bounded(w);
}
function event(w,type){
 if(type==='drought'){
   w.weather.droughtUntil=w.day+1;
   log(w,'DIRECTOR_DROUGHT','DIRECTOR_SIM','Farm production suppressed for two fictional days.');
 }else if(type==='storm'){
   w.weather.stormUntil=w.day+1;
   log(w,'DIRECTOR_STORM','DIRECTOR_SIM','Local delivery radius reduced for two fictional days.');
 }else if(type==='relief'){
   // Explicit operator-injected food; never mislabelled as harvested or donated.
   const order=[...w.actors].sort((a,b)=>a.stock.food-b.stock.food||a.id.localeCompare(b.id));
   for(let i=0;i<6;i++)order[i%N].stock.food++;
   w.metrics.granted.food+=6;
   log(w,'DIRECTOR_INJECTION','DIRECTOR_SIM','6 imaginary rations created externally, not from cooperation.');
 }
}
function produce(w){
 for(const a of w.actors){
   const amount=a.role==='farmer'?(w.day<=w.weather.droughtUntil?0:3):
     a.role==='forager'?(w.day%2===1?1:0):a.role==='maker'?(w.day%3===0?1:0):
     a.role==='courier'?(w.day%4===0?1:0):0;
   const resource=a.role==='maker'?'wood':a.role==='courier'?'tool':'food';
   if(amount){a.stock[resource]+=amount;w.metrics.produced[resource]+=amount;
     log(w,'PRODUCED',a.id,amount+' scripted '+resource+' units; simulation only.');}
 }
}
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function share(w){
 if(w.policy!=='commons')return;
 const radius=w.day<=w.weather.stormUntil?(w.infrastructure.bridge?3:1):(w.infrastructure.bridge?5:3);
 for(const needy of [...w.actors].filter(a=>a.stock.food===0).sort((a,b)=>a.id.localeCompare(b.id))){
   const candidates=w.actors.filter(a=>a.id!==needy.id&&a.stock.food>1&&distance(a,needy)<=radius)
     .sort((a,b)=>distance(a,needy)-distance(b,needy)||a.id.localeCompare(b.id));
   for(const donor of candidates){
     if(!donor.willing){w.metrics.refusals++;log(w,'VOLUNTARY_REFUSAL',donor.id,'No ration transferred.');continue;}
     donor.stock.food--;needy.stock.food++;w.metrics.transfers++;
     log(w,'VOLUNTARY_TRANSFER',donor.id,'1 imaginary food unit to '+needy.id+'; scripted willingness, not human consent.');
     break;
   }
 }
}
function buildBridge(w){
 if(w.policy!=='commons'||w.infrastructure.bridge)return;
 const wood=w.actors.find(a=>a.willing&&a.stock.wood>0);
 const tool=w.actors.find(a=>a.willing&&a.stock.tool>0&&a.id!==wood?.id);
 if(!wood||!tool)return;
 wood.stock.wood--;tool.stock.tool--;
 w.metrics.buildSpent.wood++;w.metrics.buildSpent.tool++;w.metrics.structures++;
 w.infrastructure.bridge=true;
 log(w,'SHARED_BRIDGE','DIRECTOR_SIM','One wood from '+wood.id+' and one tool from '+tool.id+
   ' (distinct scripted donors); shared radius improved. Not a real build.');
}
function consume(w){
 for(const a of w.actors){
   if(a.stock.food>0){a.stock.food--;w.metrics.fed++;}
   else{w.metrics.unmet++;log(w,'UNMET',a.id,'One fictional daily ration unavailable.');}
   if(a.stock.food>3){const excess=a.stock.food-3;a.stock.food=3;w.metrics.spoiled+=excess;
     log(w,'SPOILED',a.id,excess+' unused imaginary rations expired.');}
 }
}
export function step(world){
 bounded(world);
 if(world.policy==='origin'||world.day>=30)throw Error('Fork a world before stepping; maximum 30 days.');
 const w=clone(world);
 const before=stock(w);
 w.day++;
 for(const e of w.scheduled.filter(e=>e.day===w.day))event(w,e.type);
 produce(w);
 buildBridge(w);
 share(w);
 const oldConsumed=w.metrics.fed,oldSpoiled=w.metrics.spoiled;
 consume(w);
 const after=stock(w);
 // Conservation is checked within the engine, not inferred from traces.
 for(const kind of ['food','wood','tool']){
   const produced=w.metrics.produced[kind]-world.metrics.produced[kind];
   const granted=w.metrics.granted[kind]-world.metrics.granted[kind];
   const spent=w.metrics.buildSpent[kind]-world.metrics.buildSpent[kind];
   const used=kind==='food'?(w.metrics.fed-oldConsumed)+(w.metrics.spoiled-oldSpoiled):0;
   if(before[kind]+produced+granted!==after[kind]+spent+used)
     throw Error('Conservation failure: '+kind);
 }
 log(w,'DAY_CLOSED','WORLD_SIM','Tick '+w.day+' complete, simulated only.');
 return bounded(w);
}
export function runDays(world,days=7){
 if(!Number.isSafeInteger(days)||days<1||days>14||world.day+days>30)throw Error('Choose 1–14 remaining days.');
 let w=world;
 for(let i=0;i<days;i++)w=step(w);
 return w;
}
export function scoreDelta(parent,child){
 bounded(parent);bounded(child);
 if(child.day<parent.day)throw Error('Child precedes parent.');
 const names=['fed','unmet','spoiled','transfers','refusals','structures'];
 return Object.fromEntries(names.map(k=>[k,child.metrics[k]-parent.metrics[k]]));
}
export async function experiment(parent,days=7,intervention='none'){
 const root=await inspect(parent);
 const a=await fork(parent,'isolated',intervention);
 const b=await fork(parent,'commons',intervention);
 const left=await seal(runDays(a,days));
 const right=await seal(runDays(b,days));
 return {parent,isolated:left,commons:right,days,intervention,
   isolatedScore:scoreDelta(root,left.world),commonsScore:scoreDelta(root,right.world)};
}
export async function verifyPair(pair){
 if(!pair||!pair.parent||!pair.isolated||!pair.commons||!EVENTS.includes(pair.intervention))throw Error('Not a pair.');
 const root=await inspect(pair.parent),a=await inspect(pair.isolated),b=await inspect(pair.commons);
 if(a.parentHash!==pair.parent.contentHash||b.parentHash!==pair.parent.contentHash||
   a.policy!=='isolated'||b.policy!=='commons'||a.day!==b.day||a.day-root.day!==pair.days)
   throw Error('Cartridge family does not agree with its declared parent.');
 // Cold re-run is stronger than comparing hashes alone: both children must be
 // reproducible from the exact parent under the named policy and event.
 const replay=await experiment(pair.parent,pair.days,pair.intervention);
 if(replay.isolated.contentHash!==pair.isolated.contentHash||
    replay.commons.contentHash!==pair.commons.contentHash||
    digestInput(replay.isolatedScore)!==digestInput(pair.isolatedScore)||
    digestInput(replay.commonsScore)!==digestInput(pair.commonsScore))
   throw Error('A child, event deck or displayed result diverges from cold replay.');
 return true;
}
