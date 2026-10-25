import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {hasSharedQuota,hasSupabaseQuota,makeSupabaseReservation,admitRequest} from '../src/usage-guard.mjs';

const env={VERCEL:'1',VERCEL_ENV:'production',
 JARVIS_RATE_HASH_SECRET:'testing_fake_secret_long_random_value_321123321',
 JARVIS_SUPABASE_QUOTA_URL:'https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-quota'};
const req={headers:{'x-vercel-forwarded-for':'198.51.100.18'}};
test('Supabase bridge is allowlisted and production-ready without Upstash',()=>{
 assert.equal(hasSupabaseQuota(env),true);
 assert.equal(hasSharedQuota(env),true);
 assert.equal(hasSharedQuota({...env,JARVIS_SUPABASE_QUOTA_URL:'https://example.org/jarvis-quota'}),false);
 assert.equal(hasSupabaseQuota({...env,JARVIS_SUPABASE_QUOTA_URL:'https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-quota?leak=1'}),false);
});
test('reservation HMAC signs bounded payload; no raw address or secret exposed in body',()=>{
 const body=makeSupabaseReservation('ai','f'.repeat(32),1792948000000,1,env.JARVIS_RATE_HASH_SECRET);
 const x=JSON.parse(body.payload);
 assert.deepEqual(Object.keys(x).sort(),['hash','kind','stamp','weight']);
 assert.equal(body.signature,createHmac('sha256',env.JARVIS_RATE_HASH_SECRET).update(body.payload).digest('hex'));
 assert.ok(!JSON.stringify(body).includes(env.JARVIS_RATE_HASH_SECRET));
 assert.throws(()=>makeSupabaseReservation('root','f'.repeat(32),1,1,env.JARVIS_RATE_HASH_SECRET));
});
test('server reserves exactly one signed request using the shared HTTPS ledger',async()=>{
 let count=0;
 const result=await admitRequest(req,'ai',{env,fetcher:async(url,opt)=>{
  count++;
  assert.equal(url,env.JARVIS_SUPABASE_QUOTA_URL);
  assert.equal(opt.method,'POST');
  const body=JSON.parse(opt.body);
  assert.equal(body.signature,createHmac('sha256',env.JARVIS_RATE_HASH_SECRET).update(body.payload).digest('hex'));
  assert.equal(JSON.parse(body.payload).weight,1);
  return new Response(JSON.stringify({ok:true,window:0}),{status:200});
 }});
 assert.equal(count,1);assert.equal(result.allowed,true);
});
test('atomic denial is 429 with retry information; database outages refuse requests',async()=>{
 const limited=await admitRequest(req,'ai',{env,fetcher:async()=>new Response(JSON.stringify({ok:false,reason:'RATE_LIMITED',window:1}),{status:429})});
 assert.equal(limited.allowed,false);assert.equal(limited.httpStatus,429);
 const unavailable=await admitRequest(req,'ai',{env,fetcher:async()=>new Response(JSON.stringify({ok:false,reason:'STORE_UNAVAILABLE'}),{status:503})});
 assert.equal(unavailable.reason,'QUOTA_STORE_UNAVAILABLE');
});
