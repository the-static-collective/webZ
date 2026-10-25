// Public independent Waseca grocery conversation. NOT official member enrollment.
// Only read-only HTML + explicit opt-in question to existing private Garden review queue.
// No auto-publication, third-party outreach, analytics or co-op account access.
import {SITE} from './site.ts';
const ORIGIN='https://kbhqacsdvjsstzyplqij.supabase.co';
const LEDGER=ORIGIN+'/functions/v1/garden-ledger';
const HEAD={'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const POLICY="default-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'none'";
const PERSONAL=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|https?:\/\/|www\./i;
const KEY=/^[A-Za-z0-9_-]{43}$/,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const words=['Affordable everyday groceries','Local farms and makers','Accessibility and convenience','A shared community place'];
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...HEAD,'content-type':'application/json; charset=utf-8'}});
async function bodyOf(req){
 if(Number(req.headers.get('content-length')||0)>1400)return null;
 const reader=req.body?.getReader();if(!reader)return null;
 const parts=[];let n=0;try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>1400)return null;parts.push(value);}}
 finally{try{await reader.cancel()}catch{}reader.releaseLock();}
 const b=new Uint8Array(n);let at=0;for(const p of parts){b.set(p,at);at+=p.length;}
 try{const j=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));return j&&typeof j==='object'&&!Array.isArray(j)?j:null;}catch{return null;}
}
function validSubmit(b){
 if(b.action!=='submit'||b.consentToReview!==true||b.kind!=='question'||b.lane!=='commerce')return false;
 if(typeof b.body!=='string'||b.body.length<55||b.body.length>300||PERSONAL.test(b.body))return false;
 if(!words.some(w=>b.body.startsWith('INDEPENDENT GROCERY PRIORITY: '+w+'. ')))return false;
 if(b.nextStep!=='Public conversation theme, not a co-op member enrollment or partner commitment.')return false;
 return true;
}
function validWithdraw(b){return b.action==='withdraw'&&typeof b.id==='string'&&UUID.test(b.id)&&typeof b.withdrawKey==='string'&&KEY.test(b.withdrawKey);}
async function relay(b,req){
 // Only a validated, bounded Garden intake can cross this seam. Existing Garden
 // quotas, review status, withdrawal hashing, and private RLS remain authoritative.
 const headers: Record<string,string>={'content-type':'application/json','origin':'https://garden.abundent.org'};
 const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'').trim().slice(0,64);
 if(ip&&/^[0-9a-fA-F:.]{3,64}$/.test(ip))headers['x-real-ip']=ip;
 const r=await fetch(LEDGER,{method:'POST',headers,body:JSON.stringify(b),signal:AbortSignal.timeout(6500),cache:'no-store'});
 const raw=await r.text();if(raw.length>2500)throw Error('UPSTREAM_RESPONSE_SIZE');
 let j;try{j=JSON.parse(raw)}catch{throw Error('UPSTREAM_RESPONSE_FORMAT')}
 if(!r.ok)return response({error:String(j.error||'NOT_ACCEPTED').slice(0,70)},r.status>=500?503:r.status);
 if(b.action==='submit'){
  if(!UUID.test(j.submission?.id||'')||!KEY.test(j.withdrawKey||''))throw Error('NO_VALID_RECEIPT');
  return response({ok:true,submission:{id:j.submission.id,status:'PENDING'},withdrawKey:j.withdrawKey},201);
 }
 return response({ok:true,removed:true});
}
Deno.serve(async req=>{
 if(req.method==='GET'||req.method==='HEAD')return new Response(req.method==='HEAD'?null:SITE,{status:200,headers:{...HEAD,'content-type':'text/html; charset=utf-8','content-security-policy':POLICY,'cache-control':'public,max-age=180','permissions-policy':'camera=(),microphone=(),geolocation=()'}});
 if(req.method!=='POST')return response({error:'METHOD_NOT_ALLOWED'},405);
 if(req.headers.get('origin')!==ORIGIN)return response({error:'ORIGIN_REQUIRED'},403);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return response({error:'CONTENT_TYPE_REQUIRED'},415);
 const b=await bodyOf(req);if(!b)return response({error:'BAD_OR_LARGE_BODY'},400);
 if(!validSubmit(b)&&!validWithdraw(b))return response({error:'INVALID_CONVERSATION_ACTION'},400);
 try{return await relay(b,req)}catch{return response({error:'GARDEN_LEDGER_TEMPORARILY_UNAVAILABLE'},503)}
});
