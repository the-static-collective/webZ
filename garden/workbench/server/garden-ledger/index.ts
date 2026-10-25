// Garden Ledger 001 — account-free pending submissions + human-approved public return.
// GRAFT automatically pulls only explicit approved public summaries from GRAFT main.
// No partner, steward, donation, food order or real-world effect is conferred by this function.
import { createClient } from 'npm:@supabase/supabase-js@2.78.0';
const PROJECT_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
if(!PROJECT_URL||!SERVICE_KEY)throw Error('GARDEN_LEDGER_SERVER_NOT_CONFIGURED');
const db=createClient(PROJECT_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS=new Set(['https://garden.abundent.org','https://garden-network-atlas.vercel.app']);
const ALLOWED={kind:new Set(['offer','need','question','experiment','return']),lane:new Set(['commons','commerce','care','research'])};
const PATTERN=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|https?:\/\/|www\./i;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const HEX=/^[a-f0-9]{64}$/;
const GRAFT_URL='https://raw.githubusercontent.com/the-static-collective/GRAFT/main/commons-feed.json';
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
class Failure extends Error{constructor(message,status=400){super(message);this.status=status;}}
function respond(data,status=200,origin='',cache='no-store'){
 const headers={...JSON_HEADERS,'cache-control':cache,...(ORIGINS.has(origin)?{'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'Content-Type'}:{})};
 return new Response(JSON.stringify(data),{status,headers});
}
function str(v,min,max){
 if(typeof v!=='string')throw new Failure('INVALID_FIELD');
 const s=v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 if(s.length<min||s.length>max)throw new Failure('INVALID_FIELD');
 if(PATTERN.test(s))throw new Failure('REMOVE_CONTACT_DETAILS_AND_URLS');
 return s;
}
async function digest(input){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input)));return Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');}
function randomToken(){const b=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
async function boundedJson(req){
 if(Number(req.headers.get('content-length')||0)>2400)throw new Failure('BODY_TOO_LARGE',413);
 const reader=req.body?.getReader();if(!reader)throw new Failure('BODY_REQUIRED');
 const chunks=[];let total=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>2400)throw new Failure('BODY_TOO_LARGE',413);chunks.push(value);}}
 finally{try{await reader.cancel();}catch{}reader.releaseLock();}
 const all=new Uint8Array(total);let at=0;for(const c of chunks){all.set(c,at);at+=c.length;}
 try{const j=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));if(!j||Array.isArray(j)||typeof j!=='object')throw Error('bad');return j;}
 catch{throw new Failure('INVALID_JSON');}
}
async function quota(key,period,max){
 const {data,error}=await db.rpc('garden_consume_quota',{p_key:key,p_period:period,p_max:max});
 if(error)throw new Failure('QUOTA_UNAVAILABLE',503);if(!data)throw new Failure('RATE_LIMITED',429);
}
async function limits(req){
 const now=new Date().toISOString(),day=now.slice(0,10),hour=now.slice(0,13).replace('T',':');
 // Network headers may be missing or spoofed. Per-visitor quota is only best effort;
 // global quotas still bound total write volume independent of those headers.
 const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').slice(0,64);
 const visitor=(await digest('garden-001|'+SERVICE_KEY+'|'+day+'|'+ip)).slice(0,32);
 await quota('global-hour',hour,80);
 await quota('global-day',day,300);
 await quota('submit:'+visitor,day,8);
}
async function submit(body,req){
 if(body.consentToReview!==true)throw new Failure('REVIEW_CONSENT_REQUIRED');
 const kind=str(body.kind,3,16),lane=str(body.lane,4,16);
 if(!ALLOWED.kind.has(kind)||!ALLOWED.lane.has(lane))throw new Failure('INVALID_KIND_OR_LANE');
 const text=str(body.body,12,300),next=str(body.nextStep||'',0,160);
 await limits(req);
 const withdrawKey=randomToken();
 const {data,error}=await db.from('garden_entries').insert({kind,lane,body:text,next_step:next,consent_to_review:true,withdraw_hash:await digest(withdrawKey),status:'PENDING'}).select('id,created_at,status').single();
 if(error)throw new Failure('STORAGE_UNAVAILABLE',503);
 return {ok:true,submission:{id:data.id,createdAt:data.created_at,status:'PENDING'},withdrawKey,note:'Saved privately for human review; not yet publicly visible. Copy withdrawal key now; it is not stored by this page.'};
}
async function withdraw(body){
 if(typeof body.id!=='string'||!UUID.test(body.id)||typeof body.withdrawKey!=='string'||!(/^[A-Za-z0-9_-]{43}$/.test(body.withdrawKey)))throw new Failure('INVALID_WITHDRAWAL',400);
 const hash=await digest(body.withdrawKey);
 const {data,error}=await db.from('garden_entries').delete().eq('id',body.id).eq('withdraw_hash',hash).select('id').maybeSingle();
 if(error)throw new Failure('STORAGE_UNAVAILABLE',503);
 if(!data)throw new Failure('NOT_FOUND',404);
 return {ok:true,removed:true};
}
let graftCache={at:0,value:null};
async function graft(){
 if(graftCache.value&&Date.now()-graftCache.at<300000)return graftCache.value;
 let result={state:'unavailable',release:null,observedAt:new Date().toISOString(),entries:[],note:'The GRAFT approved source feed could not be inspected.'};
 try{
  const res=await fetch(GRAFT_URL,{signal:AbortSignal.timeout(4500),headers:{accept:'application/json'}});
  if(res.status===404){result={...result,state:'awaiting_approved_main',note:'GRAFT has a staged candidate feed; main has no reviewed public release yet.'};}
  else if(res.ok){
   const len=Number(res.headers.get('content-length')||0);if(len>75000)throw Error('oversized');
   const raw=await res.text();if(raw.length>75000)throw Error('oversized');
   const src=JSON.parse(raw);
   if(src.schema!=='graft/public-commons-feed-v1'||src.publishedBy!=='the-static-collective/GRAFT'||!Array.isArray(src.entries))throw Error('unsupported_feed');
   const safe=[];
   for(const e of src.entries.slice(0,60)){
    if(e.publication!=='PUBLIC_SUMMARY_APPROVED'||e.sourceRepo!=='GRAFT'||!(/^[a-f0-9]{40}$/.test(e.sourceCommit||''))||!(/^docs\/[A-Za-z0-9_.\/-]{1,140}\.md$/.test(e.sourcePath||''))||e.sourcePath.includes('..'))continue;
    if(!(['research','workbench','planning','graph','provenance'].includes(e.lane)))continue;
    const title=String(e.title||'').slice(0,105),summary=String(e.summary||'').slice(0,380),firstCheck=String(e.firstCheck||'').slice(0,200);
    if(!title||!summary)continue;
    safe.push({id:String(e.id||'').slice(0,64),lane:e.lane,title,summary,firstCheck,sourceCommit:e.sourceCommit,sourceUrl:'https://github.com/the-static-collective/GRAFT/blob/'+e.sourceCommit+'/'+e.sourcePath,publication:'PUBLIC_SUMMARY_APPROVED'});
    if(safe.length>=15)break;
   }
   result={state:safe.length?'approved_sources':'no_approved_entries',release:String(src.release||'').slice(0,80),observedAt:new Date().toISOString(),entries:safe,note:safe.length?'Approved source summaries, not evidence of real-world project results.':'The current public feed has no editor-approved summaries.'};
  }
 }catch{ /* fail closed; no staged entries are published */ }
 graftCache={at:Date.now(),value:result};return result;
}
async function overview(){
 const {data,error}=await db.from('garden_entries').select('id,kind,lane,body,next_step,created_at,reviewed_at').eq('status','PUBLIC').order('created_at',{ascending:false}).limit(35);
 if(error)throw new Failure('STORAGE_UNAVAILABLE',503);
 return {ok:true,schema:'garden/public-overview-v1',ledger:{state:'reviewed_only',entries:(data||[]).map(e=>({id:e.id,kind:e.kind,lane:e.lane,body:e.body,nextStep:e.next_step,createdAt:e.created_at,reviewedAt:e.reviewed_at,status:'PUBLIC_REVIEWED'}))},graft:await graft(),limitations:'No automatic partner enrollment, confirmation of activity, private queue exposure, or promotion of staged GRAFT proposals.'};
}
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin')||'';
 if(origin&&!ORIGINS.has(origin))return respond({error:'ORIGIN_NOT_ALLOWED'},403);
 if(req.method==='OPTIONS'){if(!ORIGINS.has(origin))return respond({error:'ORIGIN_NOT_ALLOWED'},403);return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'Content-Type','vary':'Origin'}});}
 if(req.method==='GET'){try{return respond(await overview(),200,origin,'public,max-age=60');}catch(e){return respond({error:e instanceof Failure?e.message:'SERVER_ERROR'},e instanceof Failure?e.status:503,origin);}}
 if(req.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405,origin);
 if(!ORIGINS.has(origin))return respond({error:'ORIGIN_REQUIRED'},403);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return respond({error:'CONTENT_TYPE_REQUIRED'},415,origin);
 try{const body=await boundedJson(req);let result;
 if(body.action==='submit')result=await submit(body,req);
 else if(body.action==='withdraw')result=await withdraw(body);
 else throw new Failure('UNKNOWN_ACTION');
 return respond(result,body.action==='submit'?201:200,origin);
 }catch(e){return respond({error:e instanceof Failure?e.message:'SERVER_ERROR'},e instanceof Failure?e.status:503,origin);}
});
