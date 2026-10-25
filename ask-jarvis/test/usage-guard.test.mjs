import test from 'node:test';
import assert from 'node:assert/strict';
import {hasSharedQuota,clientDigest,makeReservation,admitRequest,applyAdmission,rejectPrivatePrompt,QUOTAS} from '../src/usage-guard.mjs';
import adaptiveHandler from '../api/adaptive.js';
import askHandler from '../api/ask.js';

const env={VERCEL_ENV:'production',VERCEL:'1',
 UPSTASH_REDIS_REST_URL:'https://glowing-swan-12345.upstash.io/',
 UPSTASH_REDIS_REST_TOKEN:'fake_server_side_token_not_valid_123456',
 JARVIS_RATE_HASH_SECRET:'sample_HMAC_key_fake_but_long_enough_1234567890'};
const req=ip=>({headers:{'x-vercel-forwarded-for':ip}});
function fakeStore() {
 const db=new Map(),calls=[];
 // Emulate the Redis EVAL check-and-reserve behavior, with a single atomic script
 // per request. The production path sends the actual Lua script instead.
 return {db,calls,fetcher:async(url,opts)=>{
  calls.push({url,auth:opts.headers.authorization,command:JSON.parse(opts.body)});
  const cmd=JSON.parse(opts.body);
  if(cmd[0]!=='EVAL'||cmd[2]!==4)throw Error('EVAL_REQUIRED');
  const keys=cmd.slice(3,7),limits=cmd.slice(7,11).map(Number),cost=Number(cmd.at(-1));
  let denied=-1;
  for(let i=0;i<4;i++)if((db.get(keys[i])||0)+cost>limits[i]){denied=i;break}
  if(denied>=0)return new Response(JSON.stringify({result:[0,denied+1,db.get(keys[denied])||0]}));
  for(const key of keys)db.set(key,(db.get(key)||0)+cost);
  return new Response(JSON.stringify({result:[1,0,0]}));
 }};
}
test('counter keys use HMAC digest and no IP address, raw prompt or credentials',()=>{
 assert.equal(hasSharedQuota(env),true);
 assert.equal(hasSharedQuota({...env,UPSTASH_REDIS_REST_URL:'https://evil.example/'}),false);
 assert.equal(clientDigest(req('192.0.2.19'),env).length,32);
 assert.notEqual(clientDigest(req('192.0.2.19'),env),clientDigest(req('192.0.2.20'),env));
 assert.equal(clientDigest(req('192.0.2.19'),{...env,VERCEL_ENV:'preview',VERCEL:'0'}),null);
 const command=makeReservation('ai',clientDigest(req('192.0.2.19'),env),1780000000000);
 const all=JSON.stringify(command);
 assert.equal(command[0],'EVAL');assert.equal(command[2],4);
 assert.ok(!all.includes('192.0.2.19'));assert.ok(!all.includes(env.JARVIS_RATE_HASH_SECRET));
 assert.ok(all.includes('all:d:'));assert.equal(command.at(-1),1);
});
test('public IP quota enforces 4/min and makes no source/body leak',async()=>{
 const store=fakeStore(),at=()=>1780000000000;
 for(let i=0;i<4;i++){
  const r=await admitRequest(req('198.51.100.9'),'ai',{env,now:at,fetcher:store.fetcher});
  assert.equal(r.allowed,true);
 }
 const denied=await admitRequest(req('198.51.100.9'),'ai',{env,now:at,fetcher:store.fetcher});
 assert.equal(denied.allowed,false);assert.equal(denied.reason,'RATE_LIMITED');assert.equal(denied.httpStatus,429);
 const other=await admitRequest(req('198.51.100.10'),'ai',{env,now:at,fetcher:store.fetcher});
 assert.equal(other.allowed,true);
 assert.equal(store.calls.length,6);
 assert.deepEqual(Object.keys(QUOTAS.ai).sort(),['allDay','allMinute','ipDay','ipMinute']);
});
test('Council reserves two model passes atomically against the same AI budget',async()=>{
 const store=fakeStore(),at=()=>1780000000000;
 for(let i=0;i<2;i++)assert.equal((await admitRequest(req('203.0.113.14'),'ai',
  {env,fetcher:store.fetcher,now:at,weight:2})).allowed,true);
 const rejected=await admitRequest(req('203.0.113.14'),'ai',{env,fetcher:store.fetcher,now:at});
 assert.equal(rejected.httpStatus,429);
 // IP remains at four, no partial increment from rejected request.
 const digest=clientDigest(req('203.0.113.14'),env);
 const day=makeReservation('ai',digest,at())[4];
 assert.equal(store.db.get(day),4);
});
test('storage unavailable, missing trusted IP, spoofed host and invalid token all fail closed',async()=>{
 const broken=async()=>{throw Error('DISCONNECTED')};
 assert.equal((await admitRequest(req('192.0.2.1'),'ai',{env,fetcher:broken})).reason,'QUOTA_STORE_UNAVAILABLE');
 assert.equal((await admitRequest({headers:{host:'spoof.attacker'}},'ai',{env,fetcher:broken})).reason,'TRUSTED_CLIENT_ADDRESS_UNAVAILABLE');
 assert.equal((await admitRequest(req('192.0.2.1'),'ai',{env:{...env,UPSTASH_REDIS_REST_TOKEN:''}})).reason,'SHARED_QUOTA_NOT_CONFIGURED');
 const preview={...env,VERCEL_ENV:'preview',UPSTASH_REDIS_REST_TOKEN:''};
 assert.equal((await admitRequest(req('192.0.2.1'),'ai',{env:preview})).mode,
  'LOCAL_NODE_TEST_ONLY');
});
test('response adapter emits machine-readable 429, Retry-After, no model invocation',()=>{
 const state={headers:{},status:0,body:null};
 const response={setHeader(k,v){state.headers[k]=v;return this},
  status(n){state.status=n;return this},json(x){state.body=x;return this}};
 assert.equal(applyAdmission(response,{allowed:false,reason:'RATE_LIMITED',httpStatus:429,message:'Slow down.',retryAfter:60}),true);
 assert.equal(state.status,429);assert.equal(state.headers['Retry-After'],'60');
 assert.equal(state.body.modelInvoked,false);
});
test('public AI enable switch and distributed store are separate requirements',async()=>{
 const vars=['VERCEL_ENV','JARVIS_ADAPTIVE_ENABLED','JARVIS_AI_ENABLED',
  'JARVIS_FREE_COMPUTE_ENABLED','JARVIS_PUBLIC_AI_ENABLED','UPSTASH_REDIS_REST_URL'];
 const saved=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
 try{
  Object.assign(process.env,{VERCEL_ENV:'production',JARVIS_ADAPTIVE_ENABLED:'1',
   JARVIS_AI_ENABLED:'1',JARVIS_FREE_COMPUTE_ENABLED:'1',
   JARVIS_PUBLIC_AI_ENABLED:'1'});
  delete process.env.UPSTASH_REDIS_REST_URL;
  const state={headers:{},body:null,statusCode:0};
  const res={setHeader(k,v){state.headers[k]=v;return this;},
   status(n){state.statusCode=n;return this;},json(v){state.body=v;return this}};
  await adaptiveHandler({method:'GET'},res);
  assert.equal(state.body.enabled,false);
  assert.equal(state.body.publicModelEnabled,false);
  await adaptiveHandler({method:'POST',body:{question:'Where could we start a community food project?'}},res);
  assert.equal(state.statusCode,503);
  assert.equal(state.body.modelInvoked,false);
 }finally{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v}}
});
test('public source query refuses external work when shared store is absent',async()=>{
 const vars=['VERCEL_ENV','UPSTASH_REDIS_REST_URL'];const saved=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
 const old=globalThis.fetch;let external=0;
 try{
  Object.assign(process.env,{VERCEL_ENV:'production'});delete process.env.UPSTASH_REDIS_REST_URL;
  globalThis.fetch=async()=>{external++;throw Error('MUST_NOT_FETCH')};
  const state={statusCode:0,body:null};
  const response={setHeader(){return this},status(n){state.statusCode=n;return this},json(v){state.body=v;return this}};
  await askHandler({method:'POST',body:{question:'Can we draft a grocery flyer?'}},response);
  assert.equal(state.statusCode,503);
  assert.equal(state.body.reason,'SHARED_QUOTA_NOT_CONFIGURED');
  assert.equal(external,0);
 }finally{globalThis.fetch=old;for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v}}
});

test('model privacy screen refuses direct email, phone and credential data',()=>{
 assert.equal(rejectPrivatePrompt('Can we contact someone at neighbor@example.com?'),'PRIVATE_INPUT_NOT_FOR_AI');
 assert.equal(rejectPrivatePrompt('Please phone 507-555-1234 about this offer.'),'PRIVATE_INPUT_NOT_FOR_AI');
 assert.equal(rejectPrivatePrompt('Set API key: real-example-secret-12'),'PRIVATE_INPUT_NOT_FOR_AI');
 assert.equal(rejectPrivatePrompt('What is a good food cooperative?'),null);
});
