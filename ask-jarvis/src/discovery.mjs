// DISCOVERY-011: public-source-first research, NEVER an effect dispatcher.
// North star is a relevance guide, not an instruction to redirect every query.
const BAD_PRIVATE=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\b(?:api[_ -]?key|password|bearer token|private key)\b/i;
const STOP=new Set(['the','that','there','what','which','where','when','would','could','with','from','about','your','this','and','have','has','are','how','does','for','can','one','our','should','into','just','some','near','like','any','get','who','why','will','them','their','were','really','please','want','need','know','find','tell']);
const wordSet=text=>new Set((String(text).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]).filter(x=>!STOP.has(x)).slice(0,80));
const capped=(v,n)=>typeof v==='string'?v.replace(/<[^>]*>/g,' ').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n):'';
export function validatePublicQuestion(question){
 if(typeof question!=='string'||question.trim().length<8||question.length>360||/[\x00-\x1f\x7f]/.test(question))throw Error('INVALID_QUESTION');
 if(BAD_PRIVATE.test(question))throw Error('PRIVATE_INQUIRY_REFUSED');
 return question.trim();
}
export function orientQuestion(question,mission,catalog){
 const q=validatePublicQuestion(question);
 if(mission?.schema!=='abundent/mission-context-v1'||catalog?.schema!=='abundent/town-options-v1')
   throw Error('CONTEXT_NOT_VERSIONED');
 const terms=wordSet(q);
 const findOverlap=items=>[...wordSet(items)].filter(w=>terms.has(w)).length;
 const workstreams=mission.workstreams.map(s=>({id:s.id,title:s.title,score:findOverlap([s.title,...s.keywords].join(' '))*3,
   state:s.state})).filter(s=>s.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3);
 const ideas=catalog.ideas.map(i=>({id:i.id,title:i.title,category:i.category,question:i.question,
   status:i.status,score:findOverlap([i.title,i.question,i.category,i.test].join(' '))})).filter(i=>i.score>0)
   .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3);
 const local=/\b(waseca|waseka|wasika|mankato|near me|nearby|locally|in town|around here|where can i)\b/i.test(q);
 const services=/\b(shop|store|repair|clinic|doctor|restaurant|food shelf|open now|hours|address|directions|appointment|price|business|available now|today)\b/i.test(q);
 const publicHelp=/\b(emergency|food shelf|hungry|immediate help|crisis)\b/i.test(q);
 const needsLiveLocal=local&&services;
 const relevant=workstreams.length>0||ideas.some(i=>i.score>1);
 return {
  schema:'ask-jarvis/orientation-v1',question:q,missionRevision:mission.revision,
  goal:mission.identity.purpose,
  relation:relevant?'OPTIONAL_CONTEXT':'INDEPENDENT_QUESTION',
  workstreams,ideas,local,needsLiveLocal,publicHelp,
  advice:needsLiveLocal?'An encyclopedia cannot confirm a currently open nearby service; require a dated local or official source.':
   'Relevant projects are optional context, not the required subject of the answer.',
  searchQuery:q.replace(/[?!.]+$/,'').slice(0,180),
  retained:{currentSources:'NOT_YET',newProposals:'NONE',humanApproval:'REQUIRED'}
 };
}
export function normalizeExternalResults(provider,data,observedAt){
 const out=[]; const items=provider==='BRAVE'?(data?.web?.results||[]):(data?.pages||[]);
 if(!Array.isArray(items))throw Error('SEARCH_RESPONSE_SHAPE');
 for(const r of items.slice(0,4)){
  if(!r||typeof r!=='object')continue;
  let title=capped(r.title,120),description=capped(provider==='BRAVE'?r.description:(r.description||r.excerpt),350),url;
  try{
   url=new URL(provider==='BRAVE'?r.url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(r.key||r.title).replace(/%20/g,'_'));
   if(url.protocol!=='https:'||url.username||url.password||url.href.length>650)continue;
   if(provider==='WIKIPEDIA'&&url.hostname!=='en.wikipedia.org')continue;
   if(provider==='BRAVE'&&(/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(url.hostname)||url.hostname.includes('.local')))continue;
  }catch{continue;}
  if(!title||!description)continue;
  out.push({source:'EXTERNAL_SEARCH_SNIPPET',provider,title,url:url.toString(),description,
    observedAt,authority:'NONE',status:'CANDIDATE_UNVERIFIED',sourceDate:'UNKNOWN'});
 }
 return out;
}
export async function searchExternal(question,{fetcher=fetch,braveToken,now=()=>new Date().toISOString(),timeoutMs=6500}={}){
 const q=validatePublicQuestion(question);
 const enabled=typeof braveToken==='string'&&braveToken.length>=20;
 const provider=enabled?'BRAVE':'WIKIPEDIA';
 const url=enabled?'https://api.search.brave.com/res/v1/web/search?q='+encodeURIComponent(q)+'&count=4&country=US&search_lang=en&safesearch=strict':
  'https://en.wikipedia.org/w/rest.php/v1/search/page?q='+encodeURIComponent(q)+'&limit=4';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(8000,timeoutMs));
 try{
  const res=await fetcher(url,{redirect:'error',signal:controller.signal,
    headers:enabled?{'Accept':'application/json','X-Subscription-Token':braveToken}:
      {'Accept':'application/json','User-Agent':'Abundent-Discovery-011/0.1 (https://abundent.org/contact/)'}});
  if(!res.ok)throw Error('SEARCH_UPSTREAM_UNAVAILABLE');
  if(Number(res.headers.get('content-length'))>18000)throw Error('SEARCH_BODY_LIMIT');
  const raw=await res.text();
  if(raw.length>18000)throw Error('SEARCH_BODY_LIMIT');
  const candidates=normalizeExternalResults(provider,JSON.parse(raw),now());
  return {provider,results:candidates,status:candidates.length?'RESULTS_UNVERIFIED':'NO_RESULTS',modelInvoked:false};
 }catch{return {provider,results:[],status:'SEARCH_UNAVAILABLE',modelInvoked:false};}
 finally{clearTimeout(timer);controller.abort();}
}
export function weaveCandidates(orientation,results,catalog){
 if(!Array.isArray(results))throw Error('INVALID_RESULTS');
 const possible=orientation.ideas.map(i=>i.id);
 const first=possible[0]||null;
 const neighbor=first?catalog.paths.find(([from,to,verb])=>verb==='connects'&&(from===first||to===first)):null;
 const neighborId=neighbor?(neighbor[0]===first?neighbor[1]:neighbor[0]):null;
 const neighborTitle=catalog.ideas.find(x=>x.id===neighborId)?.title||null;
 return results.slice(0,4).map(r=>({
  relation:'connects',status:'proposed',authority:'none',
  source:r.url,sourceTitle:r.title,from:'public-source-candidate',
  to:first,existingGraphNeighbor:neighborTitle?{id:neighborId,title:neighborTitle,status:'proposed',authority:'none'}:null,
  hypothesis:first
   ?'This external result may inform the existing '+(catalog.ideas.find(x=>x.id===first)?.category||'')+
    ' question.'+(neighborTitle?' That editorial option has another proposed Free Graph connection: '+neighborTitle+'.':'')+
    ' Neither connection verifies an available capability or consenting person.'
   :'Independent research result. No Collective project connection is implied.',
  admission:'PENDING_HUMAN_REVIEW'
 }));
}
