// GROUNDS-006 — stewarded proximity. A proposed footpath is not lineage or admission.
import {checksum} from '../gift.mjs';
import {layoutForest} from '../forest/contract.mjs';

export const PATH_SCHEMA='webz/grounds-steward-footpath/v0';
export const ATLAS_SCHEMA='webz/grounds-local-attendance/v0';
export const MAX_FOOTPATHS=48;
export const MAX_ATLAS_BYTES=49152;
const HASH=/^sha256:[0-9a-f]{64}$/;
const KINDS=['RESONANCE','USEFUL_ALONGSIDE','QUESTION_BETWEEN','CONTRAST'];
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const txt=(x,max)=>String(x??'').trim().replace(/\s+/g,' ').slice(0,max);
const size=x=>new TextEncoder().encode(JSON.stringify(x)).length;
const pair=(a,b)=>[a,b].sort().join('|');
const connectedByLineage=(graph,a,b)=>graph.edges.some(e=>pair(e.from,e.to)===pair(a,b));

export async function proposeFootpath(graph,raw){
 if(!graph?.index||!obj(raw)||!HASH.test(raw.a||'')||!HASH.test(raw.b||'')||raw.a===raw.b)throw Error('TWO_DISTINCT_ADDRESSES_REQUIRED');
 if(!graph.index.has(raw.a)||!graph.index.has(raw.b))throw Error('BOTH_GIFTS_MUST_BE_PRESENT');
 if(connectedByLineage(graph,raw.a,raw.b))throw Error('LINEAGE_ALREADY_HAS_A_PATH');
 if(!KINDS.includes(raw.kind))throw Error('INVALID_KIND');
 const note=txt(raw.note,180),keeper=txt(raw.keeper,60)||'Local visitor';
 if(note.length<12)throw Error('EXPLAIN_THE_CONNECTION');
 const [a,b]=[raw.a,raw.b].sort();
 const body={schema:PATH_SCHEMA,a,b,kind:raw.kind,note,keeper,
  standing:'UNREVIEWED_LOCAL_ASSOCIATION',permissionEffect:'NONE',
  verifiedAuthor:false,verifiedRights:false,admitted:false,published:false};
 return {...body,id:await checksum(body)};
}

export async function inspectFootpath(value){
 if(!obj(value)||size(value)>1024||value.schema!==PATH_SCHEMA||!HASH.test(value.id||'')||
    !HASH.test(value.a||'')||!HASH.test(value.b||'')||value.a>=value.b||
    !KINDS.includes(value.kind)||typeof value.note!=='string'||value.note.length<12||value.note.length>180||
    typeof value.keeper!=='string'||!value.keeper||value.keeper.length>60||
    value.standing!=='UNREVIEWED_LOCAL_ASSOCIATION'||value.permissionEffect!=='NONE'||
    value.verifiedAuthor!==false||value.verifiedRights!==false||value.admitted!==false||value.published!==false||
    Object.keys(value).length!==13)throw Error('INVALID_FOOTPATH');
 const {id,...body}=value;
 if(await checksum(body)!==id)throw Error('FOOTPATH_CHECKSUM_MISMATCH');
 return value;
}

export async function combineFootpaths(existing=[],arrivals=[]){
 if(!Array.isArray(existing)||!Array.isArray(arrivals)||existing.length+arrivals.length>MAX_FOOTPATHS)throw Error('FOOTPATH_CAPACITY');
 const collected=[],keys=new Set(),ids=new Set();
 for(const source of [...existing,...arrivals]){
  const p=await inspectFootpath(source);
  const k=pair(p.a,p.b);
  // No vote-farming: one unreviewed relation per pair, no popularity/engagement weight.
  if(keys.has(k)||ids.has(p.id))throw Error('DUPLICATE_PAIR_NOT_A_VOTE');
  keys.add(k);ids.add(p.id);collected.push(p);
 }
 return collected.sort((a,b)=>a.id.localeCompare(b.id));
}

export async function exportAttendance(paths){
 const normalized=await combineFootpaths([],paths);
 const body={schema:ATLAS_SCHEMA,kind:'LOCAL_STEWARDSHIP_NOT_PUBLICATION',paths:normalized,
  claims:'CHECKSUMS_ONLY_NO_AUTHORSHIP_OR_PROXIMITY_AUTHORITY'};
 const result={body,integrity:{algorithm:'sha256',value:await checksum(body),isSignature:false}};
 if(size(result)>MAX_ATLAS_BYTES)throw Error('ATLAS_TOO_LARGE');
 return result;
}
export async function inspectAttendance(envelope,existing=[]){
 if(!obj(envelope)||size(envelope)>MAX_ATLAS_BYTES||!obj(envelope.body)||
   envelope.body.schema!==ATLAS_SCHEMA||envelope.body.kind!=='LOCAL_STEWARDSHIP_NOT_PUBLICATION'||
   envelope.body.claims!=='CHECKSUMS_ONLY_NO_AUTHORSHIP_OR_PROXIMITY_AUTHORITY'||
   !obj(envelope.integrity)||envelope.integrity.algorithm!=='sha256'||envelope.integrity.isSignature!==false||
   !HASH.test(envelope.integrity.value||''))throw Error('INVALID_ATTENDANCE_FILE');
 if(await checksum(envelope.body)!==envelope.integrity.value)throw Error('ATLAS_CHECKSUM_MISMATCH');
 if(!Array.isArray(envelope.body.paths))throw Error('INVALID_ATTENDANCE_PATHS');
 return combineFootpaths(existing,envelope.body.paths);
}

export function composeGrounds(graph,paths=[]){
 if(!graph?.nodes||!graph?.index)throw Error('GRAPH_REQUIRED');
 const base=layoutForest(graph),active=[],held=[];
 for(const path of paths){
  if(!graph.index.has(path.a)||!graph.index.has(path.b)){held.push({id:path.id,reason:'ADDRESS_NOT_PRESENT'});continue;}
  if(connectedByLineage(graph,path.a,path.b)){held.push({id:path.id,reason:'LINEAGE_IS_DISTINCT'});continue;}
  active.push({from:path.a,to:path.b,kind:'PROPOSED_STEWARDSHIP',relation:path.kind,id:path.id,note:path.note,keeper:path.keeper});
 }
 // X-only, deterministic local pull. Ancestry depth (Y) never changes.
 const positions=new Map([...base.positions].map(([id,p])=>[id,{...p}]));
 for(let step=0;step<18;step++){
  const shifts=new Map();
  for(const edge of active){
   const a=positions.get(edge.from),b=positions.get(edge.to),delta=(b.x-a.x)*0.11;
   shifts.set(edge.from,(shifts.get(edge.from)||0)+delta);
   shifts.set(edge.to,(shifts.get(edge.to)||0)-delta);
  }
  for(const [id,p] of positions){
   const anchor=base.positions.get(id);
   p.x=anchor.x+(p.x+(shifts.get(id)||0)-anchor.x)*0.93;
  }
 }
 const sites=graph.nodes.map(n=>({id:n.id,title:n.title,creator:n.creator,
  landmark:'PAPER_PAVILION',permission:n.permission,parentStatus:n.parentStatus,
  sourceBundle:n.sourceBundle,fragment:n.fragment,seedHash:n.seedHash,
  // This indicates an independently inspectable gift, not a published item.
  publicationVerified:false}));
 const edges=[...graph.edges.map(e=>({...e,kind:'LOCAL_PARENT_MATCH'})),...active];
 const trails=new Map(sites.map(n=>[n.id,[]]));
 for(const edge of edges){
  trails.get(edge.from).push({to:edge.to,kind:edge.kind,id:edge.id||null});
  trails.get(edge.to).push({to:edge.from,kind:edge.kind,id:edge.id||null});
 }
 for(const t of trails.values())t.sort((a,b)=>a.to.localeCompare(b.to)||a.kind.localeCompare(b.kind));
 return {sites,edges,active,held,positions,trails,width:base.width,height:base.height,
  disclaimer:'An association changes this local map and navigation, not lineage, permission, rights or public proximity.'};
}

export function shortestWalk(grounds,from,to){
 if(!grounds.trails.has(from)||!grounds.trails.has(to))throw Error('GIFT_NOT_IN_GROUNDS');
 const queue=[from],seen=new Map([[from,null]]);
 for(let i=0;i<queue.length;i++){
  const at=queue[i];if(at===to)break;
  for(const step of grounds.trails.get(at))if(!seen.has(step.to)){
   seen.set(step.to,{from:at,via:step.kind});queue.push(step.to);
  }
 }
 if(!seen.has(to))return null;
 const result=[];for(let cursor=to;cursor!==from;){const p=seen.get(cursor);result.push({id:cursor,via:p.via});cursor=p.from;}
 result.push({id:from,via:'ARRIVAL'});return result.reverse();
}
