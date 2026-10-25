// DISCOVERY-011: manual, preview-only public search. No LLM token usage,
// arbitrary URL fetching, public submissions or automatic learned authority.
import mission from '../context/mission-v1.json' with {type:'json'};
import catalog from '../town/catalog.json' with {type:'json'};
import {orientQuestion,searchExternal,weaveCandidates,validatePublicQuestion} from '../src/discovery.mjs';
import {sha256} from '../public/evidence.mjs';
import {admitRequest,applyAdmission} from '../src/usage-guard.mjs';

const MEMORY_URL='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/discovery-memory';
async function reviewedContext(q,fetcher=fetch){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),2900);
  try{
    const res=await fetcher(MEMORY_URL,{signal:ctl.signal,redirect:'error',
      headers:{'Accept':'application/json','Origin':'https://abundent.org'}});
    if(!res.ok||Number(res.headers.get('content-length'))>12000)return [];
    const raw=await res.text();
    if(raw.length>12000)return [];
    const data=JSON.parse(raw);
    if(data?.schema!=='abundent/reviewed-context-v1'||!Array.isArray(data.entries))return [];
    const words=new Set((q.toLowerCase().match(/[a-z]{4,}/g)||[]));
    return data.entries.filter(x=>typeof x?.title==='string'&&typeof x?.url==='string')
      .map(x=>({...x,overlap:(String(x.title)+' '+String(x.description)).toLowerCase().match(/[a-z]{4,}/g)?.filter(w=>words.has(w)).length||0}))
      .filter(x=>x.overlap>0).sort((a,b)=>b.overlap-a.overlap).slice(0,3)
      .map(({overlap,...item})=>item);
  }catch{return [];}finally{clearTimeout(timer);ctl.abort();}
}
const MAX=1100;
const cache=new Map();
function hold(reason,message,status=503){return {code:status,value:{schema:'ask-jarvis/discovery-v1',status:'HOLD',reason,message,modelInvoked:false,externalSources:[],weave:[]}};}
export default async function handler(req,res){
 for(const [k,v] of Object.entries({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}))res.setHeader(k,v);
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(process.env.VERCEL_ENV!=='preview'||process.env.JARVIS_DISCOVERY_ENABLED!=='1'){
  const h=hold('DISCOVERY_PREVIEW_DISABLED','Bounded external discovery is not available here. The Town Desk remains readable.');
  return res.status(h.code).json(h.value);
 }
 const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
 if(Object.keys(body).sort().join('|')!=='question|search')return res.status(422).json({error:'UNKNOWN_DISCOVERY_INPUT'});
 if(body.search!==true)return res.status(422).json({error:'MANUAL_SEARCH_CONSENT_REQUIRED'});
 if(new TextEncoder().encode(JSON.stringify(body)).byteLength>MAX)return res.status(413).json({error:'QUESTION_TOO_LARGE'});
 let orientation;
 try{
  validatePublicQuestion(body.question);
  orientation=orientQuestion(body.question,mission,catalog);
 }catch(e){return res.status(422).json({error:e.message==='PRIVATE_INQUIRY_REFUSED'?'PRIVATE_INQUIRY_REFUSED':'INVALID_QUESTION'});}
 const admission=await admitRequest(req,'search');
 if(applyAdmission(res,admission))return;
 // Preview-only process-local cache is an optimization, NOT a shared quota
 // or persistent community memory. Expire at 10m and bound entry count.
 const key=await sha256(body.question.trim().toLowerCase());
 const hit=cache.get(key);let search;
 if(hit&&Date.now()-hit.savedAt<600_000)search=hit.value;
 else if(orientation.needsLiveLocal&&!process.env.BRAVE_SEARCH_API_KEY)
   search={provider:'NONE',results:[],status:'HOLD_LOCAL_LOOKUP_NOT_CONFIGURED',modelInvoked:false};
 else {
   search=await searchExternal(body.question,{braveToken:process.env.BRAVE_SEARCH_API_KEY});
   if(cache.size>31)cache.delete(cache.keys().next().value);
   cache.set(key,{savedAt:Date.now(),value:search});
 }
 const reviewed=await reviewedContext(body.question);
 const connections=weaveCandidates(orientation,search.results,catalog);
 const result={
   schema:'ask-jarvis/discovery-v1',status:search.status,
   mode:'USER_REQUESTED_RESEARCH_ONLY',question:orientation.question,
   mission:{revision:mission.revision,goal:orientation.goal,relationship:orientation.relation},
   orientation:{
     relatedWorkstreams:orientation.workstreams,relatedIdeas:orientation.ideas,
     local:orientation.local,needsLiveLocal:orientation.needsLiveLocal,
     advice:orientation.advice
   },
   search:{provider:search.provider,querySubmitted:search.provider==='NONE'?false:true,
     note:search.provider==='WIKIPEDIA'?'General encyclopedia search only. Does not validate local businesses, operating hours or availability.':
       search.provider==='BRAVE'?'Web search snippets only. Verify with original authoritative source before acting.':
       'No general web search credentials configured for live local services. No result was invented.'},
   externalSources:search.results,weave:connections,reviewedContext:reviewed,
   persistence:'REVIEWED_SOURCES_RETRIEVED; NEW_RESULTS_NOT_SAVED_TO_COMMUNITY_GRAPH',
   approval:'Every new relationship is PROPOSED, every external hit is UNVERIFIED; publication requires review.',
   limits:['Search results are snippets, not independently checked page contents.',
     'No external source is an endorsement or proof of a consenting local steward.',
     'Question is sent to the selected search provider only after a visitor explicitly clicks Discover.',
     'Nothing contacts outside partners, posts publicly, or calls the NVIDIA model.'],
   observedAt:new Date().toISOString(),modelInvoked:false,authority:'NONE'
 };
 result.receiptHash=await sha256(JSON.stringify(result));
 return res.status(200).json(result);
}
