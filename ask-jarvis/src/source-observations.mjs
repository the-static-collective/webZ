// SOURCE-WATCH-001: provenance-bounded, public read-only observation manifest.
// Not authority, not an agent, not a deployment monitor and not a field result.
import {sha256} from '../public/evidence.mjs';
export const OBS_URL='https://raw.githubusercontent.com/the-static-collective/JAR-VIS/main/commons/source-observations-v1.json';
const REPOS=new Set(['webZ','reLATTE','BananaSpork','Static-live','lemonPRESS','GRAFT','GHoT','planZ','Free-Graph','CANNON','LOADOUT']);
const SHA=/^[0-9a-f]{40}$/,TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const cache={expires:0,data:null,digest:null};
export function parseObservations(body){
 if(typeof body!=='string'||new TextEncoder().encode(body).byteLength>24000)throw Error('WATCH_SIZE');
 let v;try{v=JSON.parse(body)}catch{throw Error('WATCH_JSON')}
 if(!v||v.schema!=='static-collective/source-observations-v1'||!TIME.test(v.scannedAt)
    ||v.authority!=='NONE'||!Array.isArray(v.sources)||v.sources.length!==REPOS.size
    ||!Array.isArray(v.events)||v.events.length>30)throw Error('WATCH_SCHEMA');
 const seen=new Set();
 for(const x of v.sources){
  if(!REPOS.has(x.repo)||seen.has(x.repo)||x.ref!=='main'||!['OBSERVED_HEAD','HOLD'].includes(x.status)
     ||!TIME.test(x.checkedAt)||x.checkedAt!==v.scannedAt)throw Error('WATCH_ENTRY');
  if(x.status==='OBSERVED_HEAD'&&(!SHA.test(x.sha)||!TIME.test(x.commitTime)
     ||x.commitUrl!=='https://github.com/the-static-collective/'+x.repo+'/commit/'+x.sha))throw Error('WATCH_SOURCE');
  if(x.status==='HOLD'&&x.sha!==null)throw Error('WATCH_HOLD');
  seen.add(x.repo);
 }
 for(const e of v.events){
  if(e.kind!=='REF_MOVED'||!REPOS.has(e.repo)||!SHA.test(e.from)||!SHA.test(e.to)
     ||e.from===e.to||!TIME.test(e.detectedAt))throw Error('WATCH_EVENT');
 }
 return v;
}
export function pickObservedSources(snapshot,recent){
 if(!recent?.selected?.length)return [];
 const byRepo=new Map(snapshot.sources.map(s=>[s.repo,s]));
 const rows=[];
 for(const e of recent.selected){
  const match=String(e.source).match(/^https:\/\/github\.com\/the-static-collective\/([A-Za-z0-9.-]+)\/blob\/[a-f0-9]{40}\//);
  const source=match?byRepo.get(match[1]):null;
  if(!source||rows.some(x=>x.repo===source.repo))continue;
  rows.push({repo:source.repo,ref:source.ref,status:source.status,sha:source.status==='OBSERVED_HEAD'?source.sha:null,
   checkedAt:source.checkedAt,commitUrl:source.status==='OBSERVED_HEAD'?source.commitUrl:null,
   statement:'Observed public branch tip only. The editorial source above remains independently pinned; neither is proof of execution, participation or field completion.'});
 }
 return rows.slice(0,3);
}
export async function readObservations(recent=null,{fetcher=fetch,now=Date.now}={}){
 const timestamp=now();if(!cache.data||cache.expires<timestamp){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
  try{
   const response=await fetcher(OBS_URL,{headers:{accept:'application/json'},redirect:'error',signal:controller.signal});
   if(!response.ok||Number(response.headers.get('content-length'))>24000)throw Error('WATCH_UNAVAILABLE');
   const body=await response.text(),data=parseObservations(body);
   cache.data=data;cache.digest=await sha256(body);cache.expires=timestamp+90000;
  }catch{
   cache.data=null;cache.digest=null;cache.expires=timestamp+12000;
  }finally{clearTimeout(timer);controller.abort()}
 }
 const data=cache.data;
 if(!data)return {schema:'jarvis/source-observation-cut-v1',status:'HOLD',reason:'WATCH_UNAVAILABLE_OR_INVALID',selected:[]};
 const scanTime=Date.parse(data.scannedAt),age=timestamp-scanTime;
 // GitHub Actions schedules may be delayed. Never present aged source pointers as current.
 if(!Number.isFinite(scanTime)||age>48*3600000||age< -5*60000)
  return {schema:'jarvis/source-observation-cut-v1',status:'HOLD',reason:'WATCH_STALE_OR_FUTURE',scannedAt:data.scannedAt,selected:[]};
 const selected=pickObservedSources(data,recent);
 return {schema:'jarvis/source-observation-cut-v1',status:'READ',scannedAt:data.scannedAt,sourceSha256:cache.digest,
  observedCount:data.sources.filter(x=>x.status==='OBSERVED_HEAD').length,
  holds:data.sources.filter(x=>x.status==='HOLD').map(x=>x.repo),movementCount:data.events.length,selected,
  disclosure:'Public GitHub ref positions only. Main is not canon. Never infer human agreement, deployed code or completed work.'};
}
