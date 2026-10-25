// LAUNCH-GUARD-017 — shared, atomic, fail-closed Vercel public API quotas.
// Preview without a store remains an explicitly protected development surface;
// no production model/search call can proceed without a shared rate store.
import {createHmac} from 'node:crypto';

export const QUOTAS=Object.freeze({
  ai:Object.freeze({ipMinute:4,ipDay:15,allMinute:20,allDay:150}),
  search:Object.freeze({ipMinute:3,ipDay:18,allMinute:25,allDay:250}),
  source:Object.freeze({ipMinute:10,ipDay:120,allMinute:120,allDay:2500})
});
const SCRIPT=`
-- Atomic all-or-nothing reservation: never count only one side of an allowance.
local cost=tonumber(ARGV[9])
for i=1,4 do
  local used=tonumber(redis.call('GET',KEYS[i]) or '0')
  if used+cost>tonumber(ARGV[i]) then return {0,i,used} end
end
for i=1,4 do
  redis.call('INCRBY',KEYS[i],cost)
  redis.call('EXPIRE',KEYS[i],tonumber(ARGV[i+4]))
end
return {1,0,0}
`;

const keyOK=s=>typeof s==='string'&&s.length>=24;
export function hasSharedQuota(env={}){
  let url;
  try{url=new URL(env.UPSTASH_REDIS_REST_URL||'')}catch{return false}
  return url.protocol==='https:'&&/^[a-z0-9-]+\.upstash\.io$/.test(url.hostname)
    &&url.pathname==='/'&&keyOK(env.UPSTASH_REDIS_REST_TOKEN)
    &&keyOK(env.JARVIS_RATE_HASH_SECRET);
}
function trustedVisitor(req,env) {
  // Vercel overwrites x-forwarded-for; NEVER use visitor-provided cookie,
  // query string, host, X-Real-IP or arbitrary forwarded address as identity.
  if(env.VERCEL!=='1'&&env.VERCEL_ENV!=='production')return null;
  const header=req.headers?.['x-vercel-forwarded-for']||req.headers?.['x-forwarded-for'];
  const value=Array.isArray(header)?header[0]:header;
  if(typeof value!=='string'||value.length>200)return null;
  // A single Vercel-provided IPv4/IPv6. Missing/ambiguous addresses fail shut.
  const ip=value.split(',')[0].trim();
  if(!/^[a-f\d.:]{3,45}$/i.test(ip)||ip.includes('..'))return null;
  return ip;
}
export function clientDigest(req,env={}){
  const ip=trustedVisitor(req,env);
  if(!ip||!keyOK(env.JARVIS_RATE_HASH_SECRET))return null;
  return createHmac('sha256',env.JARVIS_RATE_HASH_SECRET).update(ip).digest('hex').slice(0,32);
}
function quotaKeys(kind,hash,stamp) {
 const minute=Math.floor(stamp/60000),day=new Date(stamp).toISOString().slice(0,10);
 const prefix='jarvis:{public-quotas}:'+kind;
 return [`${prefix}:client:${hash}:m:${minute}`,
  `${prefix}:client:${hash}:d:${day}`,
  `${prefix}:all:m:${minute}`,
  `${prefix}:all:d:${day}`];
}
export function makeReservation(kind,hash,at=Date.now(),weight=1){
 if(!QUOTAS[kind]||!hash||!Number.isInteger(weight)||weight<1||weight>2)throw Error('BAD_QUOTA_REQUEST');
 const q=QUOTAS[kind],minuteTTL=Math.ceil((60000-at%60000)/1000)+10;
 const dayTTL=Math.ceil((86400000-at%86400000)/1000)+60;
 return ['EVAL',SCRIPT,4,...quotaKeys(kind,hash,at),
  q.ipMinute,q.ipDay,q.allMinute,q.allDay,minuteTTL,dayTTL,minuteTTL,dayTTL,weight];
}
async function reserve(command,env,fetcher){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2100);
 try{
  const res=await fetcher(env.UPSTASH_REDIS_REST_URL,{
   method:'POST',redirect:'error',signal:controller.signal,
   headers:{authorization:'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,
     'content-type':'application/json',accept:'application/json'},
   body:JSON.stringify(command)});
  if(!res.ok||Number(res.headers.get('content-length'))>2000)throw Error('QUOTA_STORE_ERROR');
  const value=await res.json();
  const v=value?.result;
  if(value?.error||!Array.isArray(v)||v.length<2||![0,1].includes(Number(v[0])))
    throw Error('QUOTA_STORE_ERROR');
  return {ok:Number(v[0])===1,window:Number(v[1])||0};
 }finally{clearTimeout(timer);controller.abort()}
}
const hold=(reason,httpStatus,message,retryAfter=60)=>({allowed:false,reason,httpStatus,message,retryAfter});
export async function admitRequest(req,kind,{env=process.env,fetcher=fetch,now=Date.now,
  weight=1}={}){
 if(!QUOTAS[kind])throw Error('UNKNOWN_QUOTA_KIND');
 const production=env.VERCEL_ENV==='production';
 if(!hasSharedQuota(env)){
  // Only Node's built-in test runner can exercise preview adapters without a
  // real Redis service. An actual hosted Preview URL, including custom-domain
  // aliases that may bypass SSO, ALWAYS fails closed without shared quotas.
  return production||!process.env.NODE_TEST_CONTEXT
   ?hold('SHARED_QUOTA_NOT_CONFIGURED',503,
      'This service is temporarily unavailable. The shared usage guard is not configured.',60)
   :{allowed:true,mode:'LOCAL_NODE_TEST_ONLY'};
 }
 const digest=clientDigest(req,env);
 if(!digest)return hold('TRUSTED_CLIENT_ADDRESS_UNAVAILABLE',503,
   'A verified request address was not available for the usage guard.',60);
 try{
  const result=await reserve(makeReservation(kind,digest,now(),weight),env,fetcher);
  return result.ok?{allowed:true,mode:'ATOMIC_SHARED_QUOTA',kind}
   :hold('RATE_LIMITED',429,'Too many requests right now. Please try again later.',
     result.window===1||result.window===3?60:3600);
 }catch{return hold('QUOTA_STORE_UNAVAILABLE',503,
   'The shared usage guard is unavailable. No paid or external call was made.',60)}
}
export function applyAdmission(res,result){
 if(result.allowed)return false;
 res.setHeader('Retry-After',String(result.retryAfter||60));
 res.setHeader('Cache-Control','no-store');
 res.status(result.httpStatus).json({
  schema:'ask-jarvis/usage-guard-v1',status:'HOLD',reason:result.reason,
  message:result.message,modelInvoked:false,retryAfterSeconds:result.retryAfter||60
 });
 return true;
}

/** Avoid knowingly sending direct contact details or secrets to third-party free models. */
export function rejectPrivatePrompt(question) {
 if(typeof question!=='string'||question.length<8||question.length>360)return 'INVALID_QUESTION';
 const privateData=/(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b(?:password|api[_ -]?key|access[_ -]?token|secret)\s*[:=]\s*\S+)/i;
 return privateData.test(question)?'PRIVATE_INPUT_NOT_FOR_AI':null;
}
