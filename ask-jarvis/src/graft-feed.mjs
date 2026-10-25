// GRAFT-BRIDGE-011 — read-only, bounded publication feed from the GRAFT
// public repository. GRAFT is a donor nursery: branch != canon and public
// source != a verified human field outcome.
import {sha256} from '../public/evidence.mjs';

const GRAFT_URL='https://raw.githubusercontent.com/the-static-collective/GRAFT/';
const STAGED='feature/commons-approved-feed-001';
const FEED_SCHEMA='graft/public-commons-feed-v1';
const STATUSES=new Set(['DOCUMENTED_PROTOTYPE','DOCUMENTED_ARTIFACT','DOCUMENTED_PROTOCOL','DOCUMENTED_DESIGN']);
const TERMS=new Set(['that','this','which','what','could','would','should','from','into','with','about','make','some',
  'your','their','there','where','when','have','has','doing','really','help','want','the','and','for','are','how','our','can']);
const unsafe=/(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}\b|https?:\/\/|(?:api[_ -]?key|private[_ -]?key|password|bearer|access[_ -]?token)\s*[=:])/i;
const clean=(s,max=600)=>typeof s==='string'&&s.trim()===s&&s.length>=7&&s.length<=max
  &&!/[\u0000-\u001f\u007f]/.test(s)&&!unsafe.test(s);
const words=s=>[...new Set((String(s).toLowerCase().match(/[a-z0-9]+/g)||[])
  .filter(x=>x.length>2&&!TERMS.has(x)))];
const score=(entry,want)=>{const title=new Set(words(entry.title+' '+entry.lane+' '+entry.id));
  const body=new Set(words(entry.summary+' '+entry.firstCheck));
  return want.reduce((n,w)=>n+(title.has(w)?5:0)+(body.has(w)?1:0),0);};
export function selectGraftEntries(entries,question,limit=3) {
  const wanted=words(question),ranked=entries.map((entry,i)=>({entry,i,score:score(entry,wanted)}))
    .sort((a,b)=>b.score-a.score||a.i-b.i);
  const positive=ranked.filter(x=>x.score>0);
  // For a broad question, give a few different preinspected source doors.
  return (positive.length?positive:ranked.slice(0,Math.min(2,limit)))
    .slice(0,limit).map(x=>({...x.entry,relevance:x.score?'TOPIC_MATCH':'STARTER_CONTEXT'}));
}
export function parseGraftFeed(raw,{preview=false}={}) {
  if(typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>32000)throw Error('GRAFT_FEED_TOO_LARGE');
  let d;try{d=JSON.parse(raw)}catch{throw Error('GRAFT_FEED_BAD_JSON')}
  if(!d||Array.isArray(d)||d.schema!==FEED_SCHEMA
    ||!clean(d.release,100)||!Array.isArray(d.entries)||d.entries.length>30
    ||d.entries.length<1)throw Error('GRAFT_FEED_BAD_SCHEMA');
  const seen=new Set(),entries=[];
  for(const v of d.entries){
    if(!v||typeof v!=='object'||Array.isArray(v)||!/^GRAFT-[A-Z0-9-]{7,45}$/.test(v.id)
      ||seen.has(v.id)||!(/^[a-z_]{3,26}$/.test(v.lane))||!STATUSES.has(v.status)
      ||!clean(v.title,130)||!clean(v.summary,600)||!clean(v.firstCheck,320)
      ||v.sourceRepo!=='GRAFT'||!(/^[0-9a-f]{40}$/.test(v.sourceCommit))
      ||!(/^docs\/[A-Za-z0-9.-]+\.md$/.test(v.sourcePath))
      ||!clean(v.effects,80)||v.sourceState!=='PUBLIC_DOC_PIN_NOT_OWNER_CANON'
      ||!['PUBLIC_SUMMARY_PROPOSED_FOR_REVIEW','PUBLIC_SUMMARY_APPROVED'].includes(v.publication))
      throw Error('GRAFT_FEED_ENTRY_INVALID');
    seen.add(v.id);
    // Stage candidates may be viewed only on authenticated Preview; main
    // emits only explicitly approved editorial summaries, never raw leads.
    if(!preview&&v.publication!=='PUBLIC_SUMMARY_APPROVED')continue;
    entries.push({id:v.id,lane:v.lane,status:v.status,title:v.title,
      summary:v.summary,firstCheck:v.firstCheck,effects:v.effects,
      publication:v.publication,sourceCommit:v.sourceCommit,
      sourceUrl:'https://github.com/the-static-collective/GRAFT/blob/'+v.sourceCommit+'/'+v.sourcePath,
      sourceState:v.sourceState});
  }
  return {schema:'jarvis/graft-feed-v1',release:d.release,
    state:preview?'STAGED_FOR_REVIEW':'APPROVED_SUMMARIES_ONLY',entries};
}
const cache=new Map();
export async function readGraftFeed(question,{env=process.env,fetcher=fetch,now=Date.now}={}) {
  const preview=env?.VERCEL_ENV==='preview';
  const ref=preview?STAGED:'main';
  const stamp=now();
  let cached=cache.get(ref);
  if(!cached||cached.expires<=stamp){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),4500);
    try {
      const url=GRAFT_URL+ref+'/commons-feed.json';
      const res=await fetcher(url,{method:'GET',headers:{accept:'application/json'},redirect:'error',signal:ctrl.signal});
      if(!res.ok)throw Error('GRAFT_FEED_UNAVAILABLE');
      if(Number(res.headers.get('content-length'))>32000)throw Error('GRAFT_FEED_TOO_LARGE');
      const body=await res.text();
      const parsed=parseGraftFeed(body,{preview});
      cached={expires:stamp+180000,parsed,sha256:await sha256(body)};
      cache.set(ref,cached);
    } catch {
      // A failed network read never invents an approved source; cache only a
      // short, explicit HOLD. An earlier successful response may be stale and
      // must not be silently presented as fresh.
      cached={expires:stamp+20000,parsed:null,sha256:null};
      cache.set(ref,cached);
    }finally{clearTimeout(timer);ctrl.abort();}
  }
  if(!cached.parsed)return {schema:'jarvis/graft-feed-v1',
    status:'HOLD',state:preview?'STAGED_FOR_REVIEW':'APPROVED_SUMMARIES_ONLY',
    sourceSha256:null,release:null,selected:[],
    reason:'GRAFT_FEED_UNAVAILABLE_OR_NOT_PUBLISHED'};
  const selected=selectGraftEntries(cached.parsed.entries,question,3);
  return {schema:'jarvis/graft-feed-v1',status:'READ',state:cached.parsed.state,
    release:cached.parsed.release,sourceSha256:cached.sha256,selected,
    disclosure:preview
      ? 'GRAFT candidate summaries from a public staging branch; review pending, not admitted for public distribution or CANNON canon.'
      : 'Explicitly approved public GRAFT editorial summaries only. Public source does not prove deployment, partner agreement or real-world outcomes.'};
}
export function graftFieldEntries(graft) {
  if(graft?.status!=='READ'||!Array.isArray(graft.selected))return [];
  const label=graft.state==='STAGED_FOR_REVIEW'?'GRAFT STAGED PUBLIC NOTE (REVIEW PENDING): '
    :'GRAFT APPROVED PUBLIC EDITORIAL SUMMARY: ';
  return graft.selected.map(({id,lane,status,summary,firstCheck})=>({
    id:'FW-'+id,lane,status,observation:(label+summary).slice(0,600),
    firstCheck,sourceId:'S10'
  }));
}
