// WORKBOARD-025 · A persistent, human-moderated conversation layer.
// Public GET = reviewed entries only. Anonymous POST = PRIVATE PENDING only.
// No automatic publishing, partner consent, model calls or moderator bypass.
import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
const HOST=Deno.env.get('SUPABASE_URL')||'';
const SECRET=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
if(!HOST||!SECRET)throw Error('WORKBOARD_SERVER_CONFIG_REQUIRED');
const db=createClient(HOST,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS=new Set([
 'https://abundent.org','https://www.abundent.org','https://connections.abundent.org',
 'https://ask-jarvis-workboard-024-review-rbjcudset.vercel.app',
 'https://ask-jarvis-workboard-0-git-00aa71-theotherlucasv-1250s-projects.vercel.app'
]);
const THREADS=new Set(['grocery','milk','care','artists','park','church']);
const isAllowedOrigin=o=>ORIGINS.has(o)||/^https:\/\/ask-jarvis-workboard-024-review-[a-z0-9]+\.vercel\.app$/.test(o);
const KINDS=new Set(['question','concern','offer','proposal','return']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const WITHDRAW=/^[A-Za-z0-9_-]{43}$/;
const PII=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|(?:https?:\/\/|www\.)|\b\d{1,5}\s+(?:[a-z]+\s+){0,4}(?:street|avenue|road|drive|lane|st|ave|rd|dr|ln)\b|\b(?:password|api[_ -]?key|access[_ -]?token|social security|ssn|private key)\b/i;
class Err extends Error{constructor(message,status=400){super(message);this.status=status;}}
function cors(origin){
 const allowed=isAllowedOrigin(origin);
 return {'access-control-allow-origin':allowed?origin:'null','vary':'Origin',
  'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'};
}
function respond(data,status=200,origin=''){
 return new Response(JSON.stringify(data),{status,headers:{
  'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'referrer-policy':'no-referrer','x-content-type-options':'nosniff',...cors(origin)}});
}
function clean(v,min=12,max=400){
 if(typeof v!=='string')throw new Err('TEXT_REQUIRED');
 const s=v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 if(s.length<min||s.length>max||PII.test(s))throw new Err('USE_NON_IDENTIFYING_TEXT');
 return s;
}
function token(){
 const b=crypto.getRandomValues(new Uint8Array(32));
 return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
}
async function sha(s){
 const a=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 return [...a].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function bounded(req){
 const advertised=Number(req.headers.get('content-length')||0);
 if(advertised>1800)throw new Err('REQUEST_TOO_LARGE',413);
 const reader=req.body?.getReader();if(!reader)throw new Err('BODY_REQUIRED');
 let bytes=0;const chunks=[];
 try{for(;;){const r=await reader.read();if(r.done)break;bytes+=r.value.length;
  if(bytes>1800)throw new Err('REQUEST_TOO_LARGE',413);chunks.push(r.value);
 }}finally{try{await reader.cancel();}catch{}reader.releaseLock();}
 const data=new Uint8Array(bytes);let pos=0;
 for(const c of chunks){data.set(c,pos);pos+=c.length;}
 try{const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
  if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error('bad');
  return parsed;
 }catch{throw new Err('INVALID_JSON');}
}
async function publicFeed(url){
 const key=url.searchParams.get('thread');
 if(key!=='all'&&!THREADS.has(key))throw new Err('INVALID_THREAD');
 const limit=25;const before=url.searchParams.get('before')||'';
 if(before&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(before)||!Number.isFinite(Date.parse(before))))
  throw new Err('INVALID_CURSOR');
 let q=db.from('workboard_entries')
  .select('id,thread_key,parent_id,kind,public_body,status,created_at,published_at,withdrawn_at')
  .or('status.eq.PUBLIC_REVIEWED,and(status.eq.WITHDRAWN,published_at.not.is.null)')
  .order('created_at',{ascending:false})
  .limit(limit+1);
 if(key!=='all')q=q.eq('thread_key',key);
 if(before)q=q.lt('created_at',before);
 const {data,error}=await q;
 if(error)throw new Err('HISTORY_UNAVAILABLE',503);
 const page=(data||[]).slice(0,limit);
 return {schema:'abundent/workboard-history-v1',thread:key,reviewedOnly:true,
  entries:page.map(e=>({
   id:e.id,thread:e.thread_key,parentId:e.parent_id,kind:e.kind,
   text:e.status==='WITHDRAWN'?null:e.public_body,
   status:e.status==='WITHDRAWN'?'WITHDRAWN':'PUBLIC_REVIEWED',
   publishedAt:e.published_at,
   createdAt:e.created_at,
   note:e.status==='WITHDRAWN'?'A previously published contribution was withdrawn.':
    'Reviewed for publication, not independently verified as factual.'
  })),
  nextBefore:(data||[]).length>limit?new Date(page.at(-1).created_at).toISOString():null};
}
async function admission(req){
 // Network headers are not an identity system: per-client controls are best effort.
 // The atomic *global* budget always applies even when a header can be spoofed.
 const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||
  req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').slice(0,64);
 const day=new Date().toISOString().slice(0,10);
 const digest=(await sha('board-025|'+SECRET+'|'+day+'|'+ip)).slice(0,32);
 const {data,error}=await db.rpc('workboard_reserve',{p_hash:digest});
 if(error)throw new Err('ADMISSION_UNAVAILABLE',503);
 if(data!==true)throw new Err('RATE_LIMITED',429);
}
async function submit(req,b){
 if(b.consentToReview!==true)throw new Err('CONSENT_REQUIRED');
 const thread=b.thread,kind=b.kind,body=clean(b.text);
 if(!THREADS.has(thread)||!KINDS.has(kind))throw new Err('INVALID_THREAD_OR_KIND');
 let parentId=null;
 if(b.parentId!==undefined&&b.parentId!==null&&b.parentId!==''){
  if(typeof b.parentId!=='string'||!UUID.test(b.parentId))throw new Err('INVALID_PARENT');
  const {data,error}=await db.from('workboard_entries')
   .select('id,thread_key,status').eq('id',b.parentId).maybeSingle();
  if(error)throw new Err('HISTORY_UNAVAILABLE',503);
  if(!data||data.thread_key!==thread||data.status!=='PUBLIC_REVIEWED')
   throw new Err('PARENT_NOT_PUBLIC');
  parentId=data.id;
 }
 await admission(req);
 const withdrawKey=token();
 const {data,error}=await db.from('workboard_entries').insert({
  thread_key:thread,kind,body,parent_id:parentId,status:'PENDING',
  consent_to_review:true,withdraw_hash:await sha(withdrawKey)
 }).select('id,created_at,status').single();
 if(error)throw new Err('SUBMISSION_UNAVAILABLE',503);
 return {ok:true,receipt:{id:data.id,createdAt:data.created_at,status:'PENDING',thread},
  withdrawKey,notice:'Saved privately for human review. It is NOT a public post. Keep this withdrawal key. Publication is not guaranteed.'};
}
async function withdraw(b){
 if(typeof b.id!=='string'||!UUID.test(b.id)||typeof b.withdrawKey!=='string'||!WITHDRAW.test(b.withdrawKey))
  throw new Err('INVALID_WITHDRAWAL');
 const {data,error}=await db.from('workboard_entries')
  .update({status:'WITHDRAWN',withdraw_hash:null,body:'[withdrawn by author]',public_body:null,withdrawn_at:new Date().toISOString()})
  .eq('id',b.id).eq('withdraw_hash',await sha(b.withdrawKey))
  .in('status',['PENDING','PUBLIC_REVIEWED'])
  .select('id,created_at,status,published_at').maybeSingle();
 if(error)throw new Err('WITHDRAWAL_UNAVAILABLE',503);
 // Stable non-enumerating result: a missing ID/key/status never reveals the row.
 if(!data)throw new Err('INVALID_OR_USED_RECEIPT');
 return {ok:true,status:'WITHDRAWN',publishedTombstone:data.published_at!==null,
   notice:'Text withdrawn. A previously public entry leaves a non-identifying tombstone.'};
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(req.method==='OPTIONS')
  return new Response(null,{status:ORIGINS.has(origin)?204:403,headers:cors(origin)});
 if(req.method==='GET'){
  try{return respond(await publicFeed(new URL(req.url)),200,origin);}
  catch(e){return respond({error:e instanceof Err?e.message:'HISTORY_UNAVAILABLE'},e instanceof Err?e.status:503,origin);}
 }
 if(req.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405,origin);
 if(!ORIGINS.has(origin))return respond({error:'ORIGIN_NOT_ALLOWED'},403,origin);
 if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))
  return respond({error:'JSON_REQUIRED'},415,origin);
 try{
  const body=await bounded(req),out=body.action==='submit'?await submit(req,body):
   body.action==='withdraw'?await withdraw(body):(()=>{throw new Err('INVALID_ACTION')})();
  return respond(out,body.action==='submit'?201:200,origin);
 }catch(e){
  const error=e instanceof Err?e:new Err('WORKBOARD_UNAVAILABLE',503);
  return respond({error:error.message},error.status,origin);
 }
});
