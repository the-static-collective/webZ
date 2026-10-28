// CHANGE-REVIEW-001 consumer: a bounded public queue of candidate source differences.
// These records do not assert feature readiness, a passing test, or useful completed work.
import {sha256} from '../public/evidence.mjs';
export const CHANGES_URL='https://raw.githubusercontent.com/the-static-collective/JAR-VIS/main/commons/change-candidates-v1.json';
const REPOS=new Set(['webZ','reLATTE','BananaSpork','Static-live','lemonPRESS','GRAFT','GHoT','planZ','Free-Graph','CANNON','LOADOUT']);
const SHA=/^[a-f0-9]{40}$/,TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const CATS=new Set(['TESTS','DOCUMENTATION','CONFIGURATION','SOURCE_CODE','OTHER']);
const STATUSES=new Set(['added','modified','removed','renamed','copied','changed','unchanged']);
const cache={until:0,data:null,digest:null};
export function parseChangeCandidates(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>60000)throw Error('CANDIDATE_SIZE');
 let v;try{v=JSON.parse(raw)}catch{throw Error('CANDIDATE_JSON')}
 if(!v||v.schema!=='static-collective/change-candidates-v1'||v.authority!=='NONE'
  ||!TIME.test(v.scannedAt)||!Array.isArray(v.monitoredRepos)||v.monitoredRepos.length!==REPOS.size
  ||new Set(v.monitoredRepos).size!==REPOS.size||!v.monitoredRepos.every(r=>REPOS.has(r))
  ||!Array.isArray(v.candidates)||v.candidates.length>24)throw Error('CANDIDATE_SCHEMA');
 const ids=new Set();
 for(const c of v.candidates){
  if(!c||!/^DIFF-[A-F0-9]{20}$/.test(c.id)||ids.has(c.id)||!REPOS.has(c.repo)||c.ref!=='main'
   ||!SHA.test(c.from)||!SHA.test(c.to)||c.from===c.to
   ||!TIME.test(c.observedAt)||!['PENDING_REVIEW','HOLD_COMPARE'].includes(c.state)
   ||c.authority!=='NONE'||c.admission!=='NOT_ADMITTED'
   ||c.compareUrl!=='https://github.com/the-static-collective/'+c.repo+'/compare/'+c.from+'...'+c.to
   ||!Array.isArray(c.files)||c.files.length>12)throw Error('CANDIDATE_ENTRY');
  for(const f of c.files){
   if(typeof f.path!=='string'||f.path.length>180||f.path.length===0||/[\x00-\x1f\x7f<>]/.test(f.path)
     ||f.path.split('/').some(x=>x==='..'||x==='.')||!STATUSES.has(f.status)||!CATS.has(f.category))
     throw Error('CANDIDATE_FILE');
  }
  if(c.state==='PENDING_REVIEW'&&(!Number.isSafeInteger(c.totalFiles)||c.totalFiles<0||c.totalFiles>60))throw Error('CANDIDATE_COUNT');
  if(c.state==='HOLD_COMPARE'&&c.files.length)throw Error('CANDIDATE_HOLD');
  ids.add(c.id);
 }
 return v;
}
export function filterCandidates(data,recent){
 const matching=new Set();
 for(const e of recent?.selected||[]){
  const m=String(e.source).match(/^https:\/\/github\.com\/the-static-collective\/([A-Za-z0-9.-]+)\/blob\/[a-f0-9]{40}\//);
  if(m)matching.add(m[1]);
 }
 return data.candidates.filter(x=>matching.has(x.repo)).slice(0,5);
}
export async function readChangeCandidates(recent=null,{fetcher=fetch,now=Date.now}={}){
 const time=now();
 if(!cache.data||cache.until<=time){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),3500);
  try{
   const res=await fetcher(CHANGES_URL,{headers:{accept:'application/json'},redirect:'error',signal:ctrl.signal});
   if(!res.ok||Number(res.headers.get('content-length'))>60000)throw Error('UNAVAILABLE');
   const body=await res.text();const parsed=parseChangeCandidates(body);
   cache.data=parsed;cache.digest=await sha256(body);cache.until=time+120000;
  }catch{cache.data=null;cache.digest=null;cache.until=time+12000}
  finally{clearTimeout(timer);ctrl.abort()}
 }
 if(!cache.data)return {schema:'jarvis/change-review-cut-v1',status:'HOLD',reason:'FEED_UNAVAILABLE_OR_INVALID',selected:[]};
 const age=time-Date.parse(cache.data.scannedAt);
 if(!Number.isFinite(age)||age>48*3600000||age< -5*60000)
  return {schema:'jarvis/change-review-cut-v1',status:'HOLD',reason:'FEED_STALE_OR_FUTURE',selected:[]};
 return {schema:'jarvis/change-review-cut-v1',status:'READ',scannedAt:cache.data.scannedAt,
  sourceSha256:cache.digest,totalCandidates:cache.data.candidates.length,
  pendingCount:cache.data.candidates.filter(x=>x.state==='PENDING_REVIEW').length,
  holdCount:cache.data.candidates.filter(x=>x.state==='HOLD_COMPARE').length,
  selected:recent?filterCandidates(cache.data,recent):cache.data.candidates,
  disclosure:'Filenames and statuses from GitHub compare; all candidates require human source review and separate implementation or field evidence.'};
}
