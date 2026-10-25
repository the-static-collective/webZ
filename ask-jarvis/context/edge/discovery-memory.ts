// DISCOVERY-011 · research nursery. Every submitted snippet is UNTRUSTED,
// PRIVATE/PENDING until reviewed; never a proof of who agreed or what happened.
import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
const db=createClient(Deno.env.get('SUPABASE_URL')||'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',
 {auth:{persistSession:false,autoRefreshToken:false}});
const table='town_research_candidates';
const originOK=o=>/^https:\/\/(?:(?:www|connections|town)\.)?abundent\.org$/.test(o)||
 /^https:\/\/ask-jarvis-1999-preview-[a-z0-9]+-theotherlucasv-1250s-projects\.vercel\.app$/.test(o);
const json=(data,status=200,origin='')=>new Response(JSON.stringify(data),{status,headers:{
 'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer',
 'x-content-type-options':'nosniff',
 ...(originOK(origin)?{'access-control-allow-origin':origin,'vary':'Origin',
  'access-control-allow-methods':'POST,GET,OPTIONS','access-control-allow-headers':'Content-Type'}:{})
}});
const fail=(reason,status=422)=>{throw Object.assign(new Error(reason),{status});};
const clean=(str,max,min=8)=>{
 if(typeof str!=='string')fail('INVALID_FIELD');
 const s=str.replace(/<[^>]*>/g,' ').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 if(s.length<min||s.length>max)fail('INVALID_FIELD');return s;
};
const personal=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
async function quota(req){
 const day=new Date().toISOString().slice(0,10);
 const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').slice(0,80);
 const visitor=(await sha('disc011:'+Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')+day+ip)).slice(0,32);
 for(const [k,n] of [['disc011-ip:'+visitor,4],['disc011-all',100]]){
  const {data,error}=await db.rpc('town_consume_quota',{p_key:k,p_period:day,p_max:n});
  if(error)fail('QUOTA_UNAVAILABLE',503);
  if(!data)fail('TRY_AGAIN_LATER',429);
 }
}
async function submit(req){
 const len=Number(req.headers.get('content-length'));
 if(len>1400)fail('BODY_TOO_LARGE',413);
 const raw=await req.text();
 if(raw.length>1400)fail('BODY_TOO_LARGE',413);
 let b;try{b=JSON.parse(raw);}catch{fail('INVALID_JSON');}
 if(!b||typeof b!=='object'||Array.isArray(b)||
  Object.keys(b).sort().join('|')!=='description|provider|relatedSeed|title|url')fail('INVALID_SHAPE');
 if(!['WIKIPEDIA','BRAVE'].includes(b.provider)||!typeof b.relatedSeed==='string')fail('INVALID_PROVIDER');
 const title=clean(b.title,120),description=clean(b.description,350);
 if(personal.test(title+' '+description))fail('PRIVATE_DETAILS_REFUSED');
 const relatedSeed=typeof b.relatedSeed==='string'&&/^[a-z0-9-]{0,35}$/.test(b.relatedSeed)?b.relatedSeed:'';
 let u;try{u=new URL(b.url)}catch{fail('BAD_PUBLIC_URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.href.length>700||
   /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)||u.hostname.endsWith('.local'))fail('BAD_PUBLIC_URL');
 if(b.provider==='WIKIPEDIA'&&u.hostname!=='en.wikipedia.org')fail('BAD_PROVIDER_URL');
 await quota(req);
 const fingerprint=await sha(b.provider+'|'+u.toString()+'|'+title);
 const {data,error}=await db.from(table).insert({
  status:'PENDING',source_url:u.toString(),title,description,provider:b.provider,
  related_seed:relatedSeed,observed_at:new Date().toISOString(),content_fingerprint:fingerprint
 }).select('id,created_at').single();
 if(error||!data)fail('RESEARCH_INBOX_UNAVAILABLE',503);
 return json({schema:'abundent/discovery-candidate-receipt-v1',status:'PENDING_PRIVATE_SOURCE_REVIEW',
  candidateId:data.id,receivedAt:data.created_at,published:false,
  note:'Search snippet privately queued. No question or identity stored. Reviewer must verify the original source and decide whether it belongs in a future curated context pack.'},201,req.headers.get('origin')||'');
}
async function readApproved(origin){
 const {data,error}=await db.from(table)
  .select('id,source_url,title,description,provider,related_seed,source_reviewed_at')
  .eq('status','REVIEWED').eq('review_status','SOURCE_LINK_CHECKED')
  .gte('expires_at',new Date().toISOString())
  .order('source_reviewed_at',{ascending:false}).limit(15);
 if(error)fail('RESEARCH_READ_UNAVAILABLE',503);
 return json({schema:'abundent/reviewed-context-v1',status:'HUMAN_REVIEWED_SOURCE_LINKS',
  entries:(data||[]).map(x=>({id:x.id,url:x.source_url,title:x.title,description:x.description,
   provider:x.provider,relatedSeed:x.related_seed,reviewedAt:x.source_reviewed_at,
   caveat:'Reviewed public link only. Content may have changed and no partner consent or available service is implied.'}))},200,origin);
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(!originOK(origin))return json({error:'ORIGIN_NOT_ALLOWED'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{
  'access-control-allow-origin':origin,'access-control-allow-methods':'POST,GET,OPTIONS','access-control-allow-headers':'Content-Type',
  'vary':'Origin'}});
 try{
  if(req.method==='GET')return await readApproved(origin);
  if(req.method==='POST')return await submit(req);
  return json({error:'METHOD_NOT_ALLOWED'},405,origin);
 }catch(e){return json({error:/^[A-Z0-9_]{3,50}$/.test(e?.message||'')?e.message:'RESEARCH_UNAVAILABLE'},
    Number.isInteger(e?.status)?e.status:503,origin);}
});
