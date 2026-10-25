// FIRST YES 001 — public HTML field desk + reviewed context + consented return handoff.
// No AI calls, unreviewed GRAFT publication, automatic contact, institutional enrollment or partner claims.
// Deployed as its own Supabase Edge Function so it can be used while Vercel daily deploys are limited.
import { SITE } from './site.ts';
const LEDGER='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/garden-ledger';
const EXPECTED_ORIGIN='https://kbhqacsdvjsstzyplqij.supabase.co';
const HEAD={'x-content-type-options':'nosniff','referrer-policy':'no-referrer','cache-control':'no-store'};
const POLICIES="default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'self'";
const PERSONAL=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|https?:\/\/|www\./i;
const TOKEN=/^[A-Za-z0-9_-]{43}$/,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS=new Set(['commons','commerce','care','research']);
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...HEAD,'content-type':'application/json; charset=utf-8'}});
function fail(status,error){return reply({error},status);}
async function bounded(req){
 const n=Number(req.headers.get('content-length')||0);if(n>1600)return null;
 const reader=req.body?.getReader();if(!reader)return null;
 const parts=[];let bytes=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1600)return null;parts.push(value);}}
 finally{try{await reader.cancel();}catch{}reader.releaseLock();}
 const all=new Uint8Array(bytes);let offset=0;for(const c of parts){all.set(c,offset);offset+=c.length;}
 try{const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}
 catch{return null;}
}
function validSubmit(b){
 if(b.action!=='submit'||b.kind!=='return'||!KINDS.has(b.lane)||b.consentToReview!==true)return false;
 if(typeof b.body!=='string'||b.body.length<30||b.body.length>300||!/^FIRST YES (food|gather|steward|creative) \/ (not-contacted|declined|no-answer|changed|in-principle|self-reported) \(self-report, unverified\): /.test(b.body))return false;
 if(typeof b.nextStep!=='string'||b.nextStep.length>160||PERSONAL.test(b.body)||PERSONAL.test(b.nextStep))return false;
 return true;
}
function validWithdraw(b){return b.action==='withdraw'&&typeof b.id==='string'&&UUID.test(b.id)&&typeof b.withdrawKey==='string'&&TOKEN.test(b.withdrawKey);}
async function ledgerProxy(payload,req){
 const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'').trim().slice(0,64);
 const headers: Record<string,string>={'content-type':'application/json','origin':'https://garden.abundent.org'};
 if(ip&&/^[0-9a-fA-F.:]{3,64}$/.test(ip))headers['x-real-ip']=ip;
 const res=await fetch(LEDGER,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(6000),cache:'no-store'});
 const body=await res.text();if(body.length>3000)throw Error('UPSTREAM_RESPONSE_TOO_LARGE');
 let json;try{json=JSON.parse(body)}catch{throw Error('UPSTREAM_INVALID_RESPONSE');}
 if(!res.ok)return reply({error:String(json.error||'LEDGER_REFUSED').slice(0,75)},res.status>=500?503:res.status);
 if(payload.action==='submit'){
  if(!json.submission?.id||!TOKEN.test(json.withdrawKey||''))throw Error('INCOMPLETE_LEDGER_RECEIPT');
  return reply({ok:true,submission:{id:json.submission.id,status:'PENDING'},withdrawKey:json.withdrawKey},201);
 }
 return reply({ok:true,removed:true});
}
let contextCache={expires:0,body:null};
async function context(){
 if(contextCache.body&&Date.now()<contextCache.expires)return reply(contextCache.body);
 const res=await fetch(LEDGER,{headers:{accept:'application/json'},signal:AbortSignal.timeout(6500),cache:'no-store'});
 if(!res.ok)throw Error('SOURCE_UNAVAILABLE');
 const raw=await res.text();if(raw.length>70000)throw Error('SOURCE_OVERSIZED');
 const data=JSON.parse(raw);
 if(data.schema!=='garden/public-overview-v1'||data.ledger?.state!=='reviewed_only'||!Array.isArray(data.ledger?.entries)||!Array.isArray(data.graft?.entries))throw Error('SOURCE_SHAPE_CHANGED');
 const safe={schema:'garden/public-overview-v1',
 ledger:{state:'reviewed_only',entries:data.ledger.entries.slice(0,35).map(x=>({id:x.id,kind:x.kind,lane:x.lane,body:x.body,createdAt:x.createdAt,status:'PUBLIC_REVIEWED'}))},
 graft:{state:String(data.graft.state||'unavailable'),entries:data.graft.entries.filter(x=>x.publication==='PUBLIC_SUMMARY_APPROVED').slice(0,15).map(x=>({title:x.title,summary:x.summary,sourceUrl:x.sourceUrl,publication:'PUBLIC_SUMMARY_APPROVED'}))}
 };
 contextCache={expires:Date.now()+120000,body:safe};return reply(safe);
}
Deno.serve(async req=>{
 const u=new URL(req.url);
 if(req.method==='GET'){
  if(u.searchParams.get('format')==='context'){
   try{return await context()}catch{return fail(503,'REVIEWED_SOURCES_TEMPORARILY_UNAVAILABLE');}
  }
  return new Response(SITE,{status:200,headers:{...HEAD,'content-type':'text/html; charset=utf-8','content-security-policy':POLICIES,'cache-control':'public,max-age=180'}});
 }
 if(req.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED');
 // This is only an HTML application relay; it never runs arbitrary effect requests.
 if(req.headers.get('origin')!==EXPECTED_ORIGIN)return fail(403,'PAGE_ORIGIN_REQUIRED');
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return fail(415,'CONTENT_TYPE_REQUIRED');
 const body=await bounded(req);if(!body)return fail(400,'INVALID_OR_LARGE_BODY');
 if(!validSubmit(body)&&!validWithdraw(body))return fail(400,'INVALID_RETURN');
 try{return await ledgerProxy(body,req)}catch{return fail(503,'REVIEW_LEDGER_UNAVAILABLE');}
});
