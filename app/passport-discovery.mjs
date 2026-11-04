// JAR;VIS CAPABILITY PASSPORTS 001.
// Only read published, owner-attributed descriptions. NEVER import/eval/execute a
// remote payload, forward a visitor question, create a service request, or infer
// that source publication proves a live runtime or real-world outcome.
export const INDEX_URL='https://raw.githubusercontent.com/the-static-collective/JAR-VIS/main/commons/capability-index-v1.json';
export const PASSPORT_PATH='capabilities/passport.v1.json';
const OWNER='the-static-collective';
const REPOS=Object.freeze({webZ:'webz',BananaSpork:'garden',reLATTE:'relatte','JAR-VIS':'jarvis',GHoT:'ghot'});
const READINESS=new Set(['LOCAL_BROWSER','SOURCE_REVIEW','LOCAL_OPERATOR','LOCAL_LIBRARY','LOCAL_APP_UNVERIFIED','DOCUMENTED_ONLY','RESEARCH_ONLY']);
const WEBZ_ROUTES=new Set(['./first-circle/','./glean/','./jubilee/']);
const STATUS_LABELS=Object.freeze({
  LOCAL_BROWSER:'Browser tool · available in this project',
  SOURCE_REVIEW:'Source-guided tool · needs input and consent',
  LOCAL_OPERATOR:'Local operator setup required',
  LOCAL_LIBRARY:'Developer integration · not connected',
  LOCAL_APP_UNVERIFIED:'Application source · live availability unverified',
  DOCUMENTED_ONLY:'Published documentation · not executable here',
  RESEARCH_ONLY:'Research proposal · not a live service'
});
export const passportStatusLabel=readiness=>STATUS_LABELS[readiness]??'Unverified published source';
const keys=(v,expected)=>{
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join('|')!==[...expected].sort().join('|'))throw Error('UNEXPECTED_FIELDS');
};
const str=(s,min=1,max=280)=>typeof s==='string'&&s.trim()===s&&s.length>=min&&s.length<=max&&!/[\u0000-\u001f\u007f]/.test(s);
const repoName=full=>{
 if(typeof full!=='string')return null;
 const name=full.startsWith(OWNER+'/')?full.slice(OWNER.length+1):null;
 return name && Object.hasOwn(REPOS,name)?name:null;
};
export function validateIndex(raw){
 keys(raw,['schema','version','reviewedOn','authority','sources']);
 if(raw.schema!=='jarvis.capability-index/v1'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}\.\d+$/.test(raw.version)||
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.reviewedOn)||raw.authority!=='PUBLIC_SOURCE_DIRECTORY_NOT_EXECUTION'||
    !Array.isArray(raw.sources)||raw.sources.length<2||raw.sources.length>8)throw Error('INVALID_CAPABILITY_INDEX');
 const seen=new Set();
 for(const src of raw.sources){
  keys(src,['repository','path']);
  const name=repoName(src.repository);
  if(!name||src.path!==PASSPORT_PATH||seen.has(name))throw Error('UNTRUSTED_CAPABILITY_SOURCE');
  seen.add(name);
 }
 return Object.freeze({schema:raw.schema,version:raw.version,reviewedOn:raw.reviewedOn,sources:raw.sources.map(s=>({...s}))});
}
const sourcePathOk=p=>typeof p==='string'&&p.length<=150&&/^[A-Za-z0-9._/-]+$/.test(p)&&!p.startsWith('/')&&!p.split('/').some(t=>t===''||t==='.'||t==='..');
const safeHref=(entry,name)=>{
 keys(entry,['kind','href']);
 if(entry.kind==='WEBZ_LOCAL_LINK')return name==='webZ'&&WEBZ_ROUTES.has(entry.href);
 if(entry.kind!=='SOURCE_REFERENCE'||!str(entry.href,40,290))return false;
 try{
  const u=new URL(entry.href);
  return u.origin==='https://github.com'&&!u.username&&!u.password&&!u.search&&!u.hash&&
   u.pathname.startsWith('/'+OWNER+'/'+name+'/blob/main/') &&
   sourcePathOk(u.pathname.slice(('/'+OWNER+'/'+name+'/blob/main/').length));
 }catch{return false;}
};
export function validatePassport(raw,expectedRepository){
 keys(raw,['schema','repository','version','authority','availability','capabilities']);
 const name=repoName(expectedRepository);
 if(!name||raw.repository!==expectedRepository||raw.schema!=='jarvis.capability-passport/v1'||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}\.\d+$/.test(raw.version)||
    raw.authority!=='PUBLIC_DESCRIPTION_ONLY_NOT_RUNTIME_OR_PERMISSION'||
    raw.availability!=='NOT_OBSERVED'||!Array.isArray(raw.capabilities)||
    raw.capabilities.length<1||raw.capabilities.length>12)throw Error('UNTRUSTED_CAPABILITY_PASSPORT');
 const ids=new Set();
 const accepted=[];
 for(const c of raw.capabilities){
  keys(c,['id','title','intents','readiness','delivers','entry','sourcePath','requires']);
  if(!str(c.id,5,80)||!c.id.startsWith(REPOS[name]+'.')||
     !/^[a-z][a-z0-9.-]+$/.test(c.id)||ids.has(c.id)||
     !str(c.title,8,100)||!READINESS.has(c.readiness)||!str(c.delivers,35,420)||
     !sourcePathOk(c.sourcePath)||!str(c.requires,40,420)||!safeHref(c.entry,name)||
     !Array.isArray(c.intents)||c.intents.length<2||c.intents.length>16)throw Error('INVALID_CAPABILITY_ENTRY');
  const intents=new Set();
  for(const phrase of c.intents){
   if(!str(phrase,3,40)||!/^[a-z0-9][a-z0-9 '-]*$/.test(phrase)||intents.has(phrase))throw Error('INVALID_INTENT_HINT');
   intents.add(phrase);
  }
  ids.add(c.id);
  accepted.push(Object.freeze({id:c.id,title:c.title,intents:[...c.intents],readiness:c.readiness,
    delivers:c.delivers,entry:{...c.entry},sourcePath:c.sourcePath,requires:c.requires,
    repository:raw.repository,version:raw.version,availability:'NOT_OBSERVED'}));
 }
 return Object.freeze({repository:raw.repository,version:raw.version,capabilities:accepted});
}
export const passportUrlFor=src=>{
 const indexSource={repository:src.repository,path:src.path};
 // validation is done both here and on the index prior to any fetch
 const name=repoName(indexSource.repository);
 if(!name||indexSource.path!==PASSPORT_PATH)throw Error('UNTRUSTED_SOURCE_URL');
 return 'https://raw.githubusercontent.com/'+OWNER+'/'+name+'/main/'+PASSPORT_PATH;
};
const MAX_BYTES=48*1024;
async function fetchJsonExact(url,fetchImpl,timeoutMs){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchImpl(url,{method:'GET',mode:'cors',credentials:'omit',
   redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',
   headers:{accept:'application/json, text/plain'},signal:controller.signal});
  if(!response?.ok||response.redirected||(response.url&&response.url!==url))throw Error('SOURCE_NOT_AVAILABLE');
  const type=response.headers?.get('content-type')||'';
  if(type&&!/^(application\/json|text\/plain|application\/octet-stream)/i.test(type))throw Error('BAD_SOURCE_TYPE');
  if(Number(response.headers?.get('content-length')||0)>MAX_BYTES)throw Error('SOURCE_TOO_LARGE');
  if(!response.body)throw Error('SOURCE_BODY_UNAVAILABLE');
  const reader=response.body.getReader();let count=0;const parts=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;
   count+=value.length;if(count>MAX_BYTES)throw Error('SOURCE_TOO_LARGE');
   parts.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(count);let n=0;
  for(const b of parts){bytes.set(b,n);n+=b.length;}
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  return JSON.parse(text);
 }finally{clearTimeout(timer);}
}
export async function discoverPassports({fetchImpl=globalThis.fetch,timeoutMs=4000}={}){
 if(typeof fetchImpl!=='function')throw Error('NO_PUBLIC_READ_AVAILABLE');
 const index=validateIndex(await fetchJsonExact(INDEX_URL,fetchImpl,timeoutMs));
 const settled=await Promise.allSettled(index.sources.map(async src=>{
  const url=passportUrlFor(src);
  return validatePassport(await fetchJsonExact(url,fetchImpl,timeoutMs),src.repository);
 }));
 const passports=[],failures=[];
 settled.forEach((r,i)=>{if(r.status==='fulfilled')passports.push(r.value);
  else failures.push({repository:index.sources[i].repository,reason:'UNAVAILABLE_OR_INVALID'});});
 return {schema:'jarvis.capability-observation/v1',indexVersion:index.version,
  reviewedOn:index.reviewedOn,sourceCount:index.sources.length,passports,failures,
  authority:'PUBLISHED_TEXT_ONLY',executionAllowed:false,availabilityVerified:false};
}
function phrasePresent(text,p){
 // fixed bounded phrases validated above; match word boundaries without sending text anywhere
 const escaped=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp('(?:^|[^a-z0-9])'+escaped+'(?=$|[^a-z0-9])','i').test(text);
}
const rank=Object.freeze({LOCAL_BROWSER:6,SOURCE_REVIEW:4,LOCAL_APP_UNVERIFIED:2,LOCAL_LIBRARY:1,LOCAL_OPERATOR:1,DOCUMENTED_ONLY:0,RESEARCH_ONLY:-1});
export function matchPassports(observation,input,{limit=3}={}){
 if(!observation||observation.schema!=='jarvis.capability-observation/v1'||!Array.isArray(observation.passports))throw Error('INVALID_OBSERVATION');
 const query=typeof input==='string'?input.toLowerCase().trim().slice(0,220):'';
 if(!query||!Number.isSafeInteger(limit)||limit<1||limit>5)return [];
 const all=[];
 for(const p of observation.passports){
  for(const c of p.capabilities){
   const hits=c.intents.filter(t=>phrasePresent(query,t));
   if(!hits.length)continue;
   const total=hits.reduce((n,t)=>n+2+(t.includes(' ')?3:0)+Math.min(t.length,24)/24,0);
   all.push({...c,score:total+(rank[c.readiness]||0),matchedHints:hits});
  }
 }
 all.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const chosen=[],seenProjects=new Set();
 for(const c of all){
  if(seenProjects.has(c.repository))continue;
  chosen.push(c);seenProjects.add(c.repository);
  if(chosen.length>=limit)break;
 }
 return chosen;
}
