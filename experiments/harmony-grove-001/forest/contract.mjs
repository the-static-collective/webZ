// GIVING-TREE-005 — local ancestry map. A connected checksum is not a witnessed event.
import {inspectGift,wrapGift,composeReturn,checksum} from '../gift.mjs';
import {compose,receipt} from '../engine.mjs';

export const FOREST_SCHEMA='webz/giving-tree-local-forest/v0';
export const MAX_GIFTS=40;
export const MAX_GIFT_BYTES=32768;
export const MAX_FOREST_BYTES=1500000;
const HASH=/^sha256:[0-9a-f]{64}$/;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
export const emptyForest=()=>new Map();

export async function inspectArrivals(bundles,existing=emptyForest()){
 if(!Array.isArray(bundles)||!bundles.length||bundles.length>MAX_GIFTS)throw Error('INVALID_ARRIVALS');
 const next=new Map(existing),accepted=[];
 for(const bundle of bundles){
  if(!object(bundle)||bytes(bundle)>MAX_GIFT_BYTES)throw Error('GIFT_TOO_LARGE');
  const check=await inspectGift(bundle);
  if(next.has(check.giftSha256)){
   if(!existing.has(check.giftSha256))throw Error('DUPLICATE_IN_BATCH');
   continue;
  }
  if(next.size>=MAX_GIFTS)throw Error('FOREST_FULL');
  next.set(check.giftSha256,{id:check.giftSha256,bundle,checked:check});
  accepted.push(check.giftSha256);
 }
 return {forest:next,added:accepted}; // All-or-nothing: caller replaces state only on success.
}

const byTitle=(a,b)=>a.title.localeCompare(b.title,'en')||a.id.localeCompare(b.id,'en');
export function buildGraph(forest){
 if(!(forest instanceof Map))throw Error('FOREST_REQUIRED');
 const nodes=[...forest.values()].map(({id,checked,bundle})=>{
  const seed=checked.gift.seedPacket.seed;
  const lineage=seed.lineage;
  const parentHash=checked.gift.parentGiftSha256;
  return {id,title:seed.title,creator:checked.gift.creator,message:checked.gift.message,
   fragment:seed.origin.fragment,permission:checked.gift.permission,canRemix:checked.canRemix,
   originAuthority:checked.gift.originAuthority,seedHash:checked.seedSha256,
   parentRef:parentHash,parentSeedRef:lineage?.parentSeedSha256||null,
   ancestralClaims:Array.isArray(lineage?.ancestors)?lineage.ancestors.length:0,
   signed:false,approved: false,sourceVerified:false,sourceBundle:bundle,
   parentId:null,parentStatus:'ROOT',children:[]};
 }).sort(byTitle);
 const index=new Map(nodes.map(n=>[n.id,n]));
 for(const n of nodes){
  if(!n.parentRef){n.parentStatus='ROOT';continue;}
  if(!HASH.test(n.parentRef)||!HASH.test(n.parentSeedRef||'')){
   n.parentStatus='INVALID_REFERENCE';continue;
  }
  const p=index.get(n.parentRef);
  if(!p){n.parentStatus='UNSEEN_PARENT';continue;}
  if(p.seedHash!==n.parentSeedRef){n.parentStatus='PARENT_SEED_CONFLICT';continue;}
  if(!p.canRemix){n.parentStatus='PARENT_REMIX_NOT_INVITED';continue;}
  if(n.id===p.id){n.parentStatus='SELF_REFERENCE';continue;}
  n.parentId=p.id;n.parentStatus='MATCHED_LOCAL_PARENT';
 }
 // Defensive graph integrity: malicious local manifests must not create cyclic walk paths.
 for(const n of nodes){
  let cursor=n,seen=new Set([n.id]);
  while(cursor.parentId){
   if(seen.has(cursor.parentId)){
    n.parentId=null;n.parentStatus='CYCLIC_REFERENCE';break;
   }
   seen.add(cursor.parentId);cursor=index.get(cursor.parentId);
  }
 }
 for(const n of nodes)if(n.parentId)index.get(n.parentId).children.push(n.id);
 for(const n of nodes)n.children.sort((a,b)=>byTitle(index.get(a),index.get(b)));
 const roots=nodes.filter(n=>!n.parentId).map(n=>n.id);
 return {nodes,roots,index,edges:nodes.filter(n=>n.parentId).map(n=>({from:n.parentId,to:n.id,kind:'LOCALLY_MATCHED_REFERENCES'})),
   warnings:nodes.filter(n=>!['ROOT','MATCHED_LOCAL_PARENT'].includes(n.parentStatus)).map(n=>({id:n.id,reason:n.parentStatus,parentRef:n.parentRef}))};
}

export function layoutForest(graph){
 const positions=new Map();let leaf=0,maxDepth=0;
 const place=(id,depth)=>{
  maxDepth=Math.max(maxDepth,depth);
  const n=graph.index.get(id);
  const xs=n.children.map(c=>place(c,depth+1));
  const x=xs.length?(xs[0]+xs[xs.length-1])/2:leaf++;
  positions.set(id,{x:135+x*250,y:110+depth*220});
  return x;
 };
 for(const id of graph.roots)place(id,0);
 return {positions,width:Math.max(650,leaf*250+30),height:Math.max(350,220*(maxDepth+1)+35)};
}

export async function exportForest(forest){
 if(!(forest instanceof Map))throw Error('FOREST_REQUIRED');
 const gifts=[...forest.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(x=>x.bundle);
 const body={schema:FOREST_SCHEMA,kind:'LOCAL_COLLECTION_NOT_PUBLICATION',gifts,claims:'CHECKSUMS_ONLY_NO_ADMISSION_OR_RIGHTS_VERIFICATION'};
 const envelope={body,integrity:{algorithm:'sha256',value:await checksum(body),isSignature:false}};
 if(bytes(envelope)>MAX_FOREST_BYTES)throw Error('FOREST_TOO_LARGE');
 return envelope;
}
export async function inspectForest(envelope,existing=emptyForest()){
 if(!object(envelope)||bytes(envelope)>MAX_FOREST_BYTES||!object(envelope.body)||
    envelope.body.schema!==FOREST_SCHEMA||envelope.body.kind!=='LOCAL_COLLECTION_NOT_PUBLICATION'||
    envelope.body.claims!=='CHECKSUMS_ONLY_NO_ADMISSION_OR_RIGHTS_VERIFICATION'||
    !object(envelope.integrity)||envelope.integrity.algorithm!=='sha256'||
    envelope.integrity.isSignature!==false||!HASH.test(envelope.integrity.value||''))throw Error('INVALID_FOREST_FILE');
 if(await checksum(envelope.body)!==envelope.integrity.value)throw Error('FOREST_CHECKSUM_MISMATCH');
 if(!Array.isArray(envelope.body.gifts)||!envelope.body.gifts.length)throw Error('EMPTY_FOREST_FILE');
 const {forest,added}=await inspectArrivals(envelope.body.gifts,existing);
 if(new Set(envelope.body.gifts.map(g=>g.checksum?.value)).size!==envelope.body.gifts.length)throw Error('DUPLICATE_FOREST_ENTRY');
 return {forest,added};
}

// Explicitly imaginary inhabitants. Demo is opt-in and never described as public evidence.
export async function makeDemoForest(){
 const origin=compose({title:'The radio beneath the orchard',fragment:'An antenna gathers rain. The dial still clicks.',authority:'DEMO',weather:6,roughness:8});
 const first=await wrapGift({seed:origin,receipt:await receipt(origin)},{creator:'Fictional keeper',message:'A song without a station.',permission:'REMIX_ALLOWED'});
 const p=await inspectGift(first);
 const left=composeReturn(p,{title:'The blue plate',fragment:'Someone placed a chipped blue plate beside the radio.',roughness:9});
 const right=composeReturn(p,{title:'The room hears back',fragment:'A distant person hums the frequency in another room.',distance:2});
 const second=await wrapGift({seed:left,receipt:await receipt(left)},{creator:'Imaginary visitor A',message:'I followed the clatter.',permission:'REMIX_ALLOWED'});
 const third=await wrapGift({seed:right,receipt:await receipt(right)},{creator:'Imaginary visitor B',message:'Another angle.',permission:'VIEW_ONLY'});
 const next=composeReturn(await inspectGift(second),{title:'A repaired antenna',fragment:'Someone tied a little copper wire where the metal broke.',weather:8});
 const fourth=await wrapGift({seed:next,receipt:await receipt(next)},{creator:'Imaginary visitor C',message:'The sound remains incomplete.',permission:'VIEW_ONLY'});
 return inspectArrivals([first,second,third,fourth]);
}
