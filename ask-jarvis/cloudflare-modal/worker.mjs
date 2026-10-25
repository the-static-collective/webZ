// EDGE-019: independent Cloudflare Worker canary; leaves current Vercel domain alone.
// A source-grounded question + atomic shared quota precedes any Modal compute.
// Not a proxy to Vercel, not a browser-accessible Modal secret.
import {assemble,inputError} from '../src/worker.mjs';
import {publicQuestion,quotaForWorker,signedModalCall} from './bridge.mjs';

const headers={'content-type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'};
const reply=(body,status=200,extra={})=>new Response(JSON.stringify(body),{
 status,headers:{...headers,...extra}
});
function hold(reason,status=503,retry=60) {
 return reply({schema:'jarvis/edge-compute-v1',status:'HOLD',reason,
  message:'The original project documents remain available. No external computation was performed.',
  executedActions:false,externalCompute:false},
  status,status===429?{'Retry-After':String(retry)}:{});
}
async function inputOf(req) {
 if(Number(req.headers.get('content-length'))>1100)return null;
 const body=await req.text();
 if(new TextEncoder().encode(body).length>1100)return null;
 try{
  const input=JSON.parse(body);
  if(!input||Array.isArray(input)||typeof input!=='object'
    ||Object.keys(input).sort().join(',')!=='question'
    ||!publicQuestion(input.question))return null;
  return input;
 }catch{return null;}
}
export default {
 async fetch(req,env) {
  const url=new URL(req.url);
  if(url.pathname==='/api/health'&&req.method==='GET')
   return reply({schema:'jarvis/edge-lab-health-v1',ok:true,provider:'cloudflare-worker',
    mode:'PUBLIC_SAFE_NO_AUTOMATIC_EFFECTS',
    sharedQuotaConfigured:env.JARVIS_RATE_HASH_SECRET?.length>=32
      &&env.JARVIS_SUPABASE_QUOTA_URL==='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-quota',
    modalEnabled:env.JARVIS_MODAL_ENABLED==='1'
      &&typeof env.MODAL_BRIDGE_SECRET==='string'&&env.MODAL_BRIDGE_SECRET.length>=32
      &&typeof env.MODAL_FIELD_KIT_URL==='string'
      &&typeof env.MODAL_PROXY_KEY==='string'&&typeof env.MODAL_PROXY_SECRET==='string',
    note:'Status is configuration, not proof that downstream calls succeeded.'});
  if(['/api/ask','/api/field-kit'].includes(url.pathname)){
   if(req.method!=='POST')return hold('METHOD_NOT_ALLOWED',405);
   const input=await inputOf(req);
   if(!input)return hold('INVALID_PUBLIC_QUESTION',422);
   const isKit=url.pathname==='/api/field-kit';
   if(isKit&&env.JARVIS_MODAL_ENABLED!=='1')return hold('MODAL_DISABLED');
   const quota=await quotaForWorker(req,env,isKit?'ai':'source');
   if(!quota.ok)return hold(quota.reason,quota.reason==='RATE_LIMITED'?429:503,quota.retryAfter||60);
   let base;
   try{base=await assemble(input.question,fetch,{kind:isKit?'plan':'auto'});}
   catch(e){return reply({error:inputError(e)},422);}
   if(!isKit)return reply(base);
   // No arbitrary source injection or document bodies reach Modal; pass three
   // exact-commit metadata pins and bounded editorial plan guidance.
   const pins=base.sources.filter(s=>s.status==='INSPECTED').slice(0,3)
    .map(s=>({id:s.id,name:s.name,commit:s.commit,sha256:s.sha256,
       document:s.document,status:'INSPECTED'}));
   try{
    const result=await signedModalCall(env.MODAL_FIELD_KIT_URL,env.MODAL_BRIDGE_SECRET,{
     schema:'jarvis/modal-input-v1',question:base.question,
     context:{relation:base.context?.relation||'UNKNOWN',
       goal:String(base.context?.goal||'').slice(0,240),
       editorialFirstMove:base.context?.relation==='INDEPENDENT_QUESTION'?''
         :String(base.synthesis?.firstMove||'').slice(0,250)},
     sourcePins:pins,sourceStatus:'INSPECTED_DOCUMENT_NOT_FIELD_OUTCOME'
    },env.MODAL_PROXY_KEY,env.MODAL_PROXY_SECRET);
    return reply({schema:'jarvis/edge-compute-v1',status:'COMPUTE_DRAFT',
     question:base.question,provider:'modal',sourcePins:pins,
     sourceDigest:base.receiptHash,modelInvoked:false,executedActions:false,
     authority:'NONE',publication:'REVIEW_REQUIRED',
     result,disclosure:'Modal generated a draft from an inspected public-source cut. No service, event, volunteer, partner, message or approval was created.'});
   }catch{return hold('MODAL_UNAVAILABLE_OR_INVALID');}
  }
  if(url.pathname.startsWith('/api/'))return hold('NOT_FOUND',404);
  if(env.ASSETS?.fetch){
   const r=await env.ASSETS.fetch(req);
   const h=new Headers(r.headers);h.set('X-Robots-Tag','noindex');
   return new Response(r.body,{status:r.status,headers:h});
  }
  return hold('STATIC_ASSETS_NOT_CONFIGURED');
 }
};
