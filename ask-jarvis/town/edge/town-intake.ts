// TOWN-010. Public account-free questions enter a PRIVATE human-review inbox.
// Not a public feed, AI prompt, service request, or automatic Free Graph promotion.
// Supabase Edge secrets stay server-side. No user identity or exact IP stored.
import {createClient} from "npm:@supabase/supabase-js@2.78.0";
const api=Deno.env.get("SUPABASE_URL")||"";
const secretKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
if(!api||!secretKey)throw Error("SERVER_NOT_CONFIGURED");
const db=createClient(api,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
const townOrigin=/^https:\/\/(?:www\.)?abundent\.org$/;
const previewOrigin=/^https:\/\/ask-jarvis-1999-preview-[a-z0-9]+-theotherlucasv-1250s-projects\.vercel\.app$/;
const safeOrigin=o=>townOrigin.test(o)||previewOrigin.test(o);
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(data,status,origin)=>new Response(JSON.stringify(data),{status,headers:{
  ...JSON_HEADERS,...(safeOrigin(origin)?{'access-control-allow-origin':origin,'vary':'Origin',
  'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'Content-Type'}:{})
}});
const fail=(code,status=400)=>{throw Object.assign(new Error(code),{status});};
const categories=new Set(['Food','Gather','Help','Create','Care','Share','Get there','Other']);
const kinds=new Set(['need','offer','question','idea']);
const noContact=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|https?:\/\/|\b\d{1,5}\s+(?:[\w-]+\s+){0,4}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Drive|Dr)\b/i;
async function hash(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');}
function token(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function cleaned(v){
  if(typeof v!=='string')fail('INVALID_TEXT',422);
  const text=v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
  if(text.length<12||text.length>260||noContact.test(text))fail('PUBLIC_SAFE_TEXT_REQUIRED',422);
  return text;
}
async function body(req){
  if(Number(req.headers.get('content-length'))>1700)fail('REQUEST_TOO_LARGE',413);
  if(!req.body)fail('INVALID_BODY',422);
  const reader=req.body.getReader();const chunks=[];let n=0;
  try{for(;;){const x=await reader.read();if(x.done)break;n+=x.value.length;
    if(n>1700)fail('REQUEST_TOO_LARGE',413);chunks.push(x.value);
  }} finally {try{await reader.cancel();}catch{}reader.releaseLock();}
  const buffer=new Uint8Array(n);let at=0;for(const c of chunks){buffer.set(c,at);at+=c.length;}
  let result;try{result=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer));}catch{fail('INVALID_JSON',422);}
  if(!result||typeof result!=='object'||Array.isArray(result))fail('INVALID_JSON',422);
  return result;
}
async function quota(key,period,max){
  const {data,error}=await db.rpc('town_consume_quota',{p_key:key,p_period:period,p_max:max});
  if(error)fail('QUEUE_UNAVAILABLE',503);
  if(!data)fail('TRY_AGAIN_LATER',429);
}
async function limit(req,action) {
  const now=new Date().toISOString(),day=now.slice(0,10),hour=now.slice(0,13).replace('T',':');
  // IP is salted with a server secret and day and used only for counted quotas.
  // This is best-effort abuse prevention, not strong identity authentication.
  const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||
    req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').slice(0,80).trim();
  const visitor=(await hash('town010:'+secretKey+':'+day+':'+ip)).slice(0,42);
  if(action==='submit'){
    await quota('ip:'+visitor,day,18);
    await quota('global',day,1100);
    await quota('hour',hour,240);
  }else{
    await quota('withdraw:'+visitor,hour,30);
  }
}
async function submit(data,req){
  if(Object.keys(data).sort().join('|')!=='action|body|category|consent|kind|relatedSeed')fail('INVALID_FIELDS',422);
  if(data.action!=='submit'||data.consent!==true||!kinds.has(data.kind)||!categories.has(data.category))fail('INVALID_FIELDS',422);
  const text=cleaned(data.body);
  const related=typeof data.relatedSeed==='string'?data.relatedSeed:'';
  if(!/^[a-z0-9-]{0,35}$/.test(related))fail('INVALID_SEED',422);
  await limit(req,'submit');
  const key=token();
  const {data:row,error}=await db.from('town_ideas').insert({
    kind:data.kind,category:data.category,related_seed:related,body:text,
    consent_to_review:true,withdraw_hash:await hash(key),status:'PENDING'
  }).select('id,created_at,status').single();
  if(error||!row)fail('QUEUE_UNAVAILABLE',503);
  return {schema:'abundent/town-inbox-receipt-v1',status:'PENDING_PRIVATE_REVIEW',
    receiptId:row.id,receivedAt:row.created_at,withdrawKey:key,
    published:false,modelInvoked:false,
    note:'Saved privately for review. It is not on the public Free Graph, is not a verified need or offer, and does not enroll or contact anyone. Save the withdrawal key; it is shown only once.'};
}
async function withdraw(data,req){
  if(Object.keys(data).sort().join('|')!=='action|receiptId|withdrawKey')fail('INVALID_FIELDS',422);
  if(data.action!=='withdraw'||typeof data.receiptId!=='string'||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(data.receiptId)||
    typeof data.withdrawKey!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.withdrawKey))fail('INVALID_WITHDRAWAL',422);
  await limit(req,'withdraw');
  const {data:row,error}=await db.from('town_ideas').delete().eq('id',data.receiptId)
    .eq('withdraw_hash',await hash(data.withdrawKey)).select('id').maybeSingle();
  if(error)fail('QUEUE_UNAVAILABLE',503);
  if(!row)fail('NOT_FOUND',404);
  return {schema:'abundent/town-inbox-receipt-v1',status:'WITHDRAWN',receiptId:row.id,
    note:'The private unreviewed inbox record was deleted. Previously shared exports, if any, cannot be recalled.'};
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(!safeOrigin(origin))return reply({error:'ORIGIN_NOT_ALLOWED'},403,'');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{
  'access-control-allow-origin':origin,'vary':'Origin',
  'access-control-allow-methods':'POST,OPTIONS',
  'access-control-allow-headers':'Content-Type'}});
 if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405,origin);
 try{const data=await body(req);
   if(data.action==='submit')return reply(await submit(data,req),201,origin);
   if(data.action==='withdraw')return reply(await withdraw(data,req),200,origin);
   fail('UNKNOWN_ACTION',422);
 }catch(e){
   const code=typeof e?.message==='string'&&/^[A-Z0-9_]{3,45}$/.test(e.message)?e.message:'INTERNAL_UNAVAILABLE';
   return reply({error:code},Number.isInteger(e?.status)?e.status:503,origin);
 }
});
