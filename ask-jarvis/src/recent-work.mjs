// RECENT-001: bounded, read-only source-owned editorial catalog. Not a task dispatcher.
// The visitor's question is matched LOCALLY. No question is forwarded to GitHub.
import {sha256} from '../public/evidence.mjs';
export const RECENT_FEED_URL='https://raw.githubusercontent.com/the-static-collective/JAR-VIS/main/commons/recent-work-v1.json';
const SCHEMA='static-collective/recent-work-feed-v1';
const STATES=new Set(['PUBLIC_PROTOTYPE','RESEARCH_PROPOSAL','DOCUMENTED_IMPLEMENTATION','DOCUMENTED_PROTOCOL','LOCAL_OPERATOR_PROTOTYPE']);
const publicHost=/^(?:apps|garden|night|postoffice|becoming)\.abundent\.org$|^webz-field-porch-theotherlucasv-1250s-projects\.vercel\.app$|^github\.com$/;
const sourceRx=/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9.-]+\/blob\/[a-f0-9]{40}\/[A-Za-z0-9_./-]+$/;
const safe=v=>typeof v==='string'&&!/[\u0000-\u001f\u007f<>]/.test(v);
const words=v=>[...new Set((String(v).toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!STOP.has(w)).map(w=>w.endsWith('ies')?w.slice(0,-3)+'y':w.endsWith('s')&&w.length>4?w.slice(0,-1):w))];
const STOP=new Set(['and','the','with','from','what','would','could','should','there','their','your','does','this','that','these','about','some','when','where','which','into','have','will','just','make','our','want','need','project','projects','field','community','communities','people','work','help','today','please','recently']);
export function parseRecentFeed(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>32000)throw Error('RECENT_FEED_SIZE');
 let d;try{d=JSON.parse(raw)}catch{throw Error('RECENT_FEED_JSON')}
 if(!d||Array.isArray(d)||d.schema!==SCHEMA||!/^RECENT-\d{4}-\d{2}-\d{2}-\d{3}$/.test(d.release)
   ||!/^\d{4}-\d{2}-\d{2}$/.test(d.reviewedOn)||!Array.isArray(d.entries)
   ||d.entries.length<1||d.entries.length>24)throw Error('RECENT_FEED_SCHEMA');
 const seen=new Set();
 for(const e of d.entries){
  if(!e||typeof e!=='object'||Array.isArray(e)||!(/^[A-Z0-9-]{6,50}$/.test(e.id))||seen.has(e.id)
    ||!STATES.has(e.state)||!safe(e.title)||e.title.length<8||e.title.length>100
    ||!safe(e.summary)||e.summary.length<40||e.summary.length>400
    ||!safe(e.firstCheck)||e.firstCheck.length<20||e.firstCheck.length>220
    ||!Array.isArray(e.tags)||e.tags.length<3||e.tags.length>20||e.tags.some(t=>!(/^[a-z0-9'-]{2,30}$/.test(t)))
    ||!sourceRx.test(e.source))throw Error('RECENT_FEED_ENTRY');
  let u;try{u=new URL(e.publicUrl)}catch{throw Error('RECENT_FEED_URL')}
  if(u.protocol!=='https:'||!publicHost.test(u.hostname)||u.username||u.password||u.search||u.hash||u.href.length>240)throw Error('RECENT_FEED_URL');
  seen.add(e.id);
 }
 return {release:d.release,reviewedOn:d.reviewedOn,entries:d.entries};
}
export function selectRecentWork(entries,question,limit=3){
 if(!Array.isArray(entries)||typeof question!=='string'||question.length>360)throw Error('RECENT_SELECTION');
 const wanted=words(question);
 const broad=/\b(recent|latest|last week|what (?:have|did) (?:we|you) (?:build|make)|what's new)\b/i.test(question);
 const ranked=entries.map((e,i)=>{
  const tag=new Set(words(e.tags.join(' '))),title=new Set(words(e.title)),summary=new Set(words(e.summary+' '+e.firstCheck));
  const score=wanted.reduce((n,w)=>n+(tag.has(w)?7:0)+(title.has(w)?4:0)+(summary.has(w)?1:0),0);
  return {e,i,score};
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 return (ranked.some(x=>x.score>0)?ranked.filter(x=>x.score>0):broad?ranked:[])
  .slice(0,Math.min(3,Math.max(0,limit))).map(({e,score})=>({
   id:e.id,title:e.title,state:e.state,summary:e.summary,firstCheck:e.firstCheck,
   publicUrl:e.publicUrl,source:e.source,relevance:score>0?'TOPIC_MATCH':'RECENT_OVERVIEW',
   authority:'EDITORIAL_NOT_CONFIRMED_PARTNER'
  }));
}
const cache=new Map();
export async function readRecentWork(question,{fetcher=fetch,now=Date.now}={}){
 const timestamp=now(),key=RECENT_FEED_URL;let v=cache.get(key);
 if(!v||v.expires<=timestamp){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),3000);
  try{
   const res=await fetcher(key,{headers:{accept:'application/json'},redirect:'error',signal:ctrl.signal});
   if(!res.ok||Number(res.headers.get('content-length'))>32000)throw Error('UPSTREAM');
   const body=await res.text();const parsed=parseRecentFeed(body);
   v={expires:timestamp+120000,parsed,sha256:await sha256(body)};
  }catch{v={expires:timestamp+12000,parsed:null,sha256:null};}
  finally{clearTimeout(timer);ctrl.abort()}
  cache.set(key,v);
 }
 if(!v.parsed)return {schema:'jarvis/recent-work-cut-v1',status:'HOLD',reason:'FEED_UNAVAILABLE_OR_INVALID',
  release:null,reviewedOn:null,sourceSha256:null,selected:[],source:RECENT_FEED_URL};
 return {schema:'jarvis/recent-work-cut-v1',status:'READ',release:v.parsed.release,reviewedOn:v.parsed.reviewedOn,
  sourceSha256:v.sha256,selected:selectRecentWork(v.parsed.entries,question),source:RECENT_FEED_URL,
  disclosure:'Dated public editorial descriptions, not independent source inspection, consent, a live service or completed work.'};
}
