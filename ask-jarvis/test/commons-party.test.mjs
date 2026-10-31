import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,normalize} from '../api/commons-party.js';

const ENV={VERCEL_ENV:'preview',JARVIS_AI_ENABLED:'1',JARVIS_FREE_COMPUTE_ENABLED:'1',
 COMMONS_AI_PARTY_ENABLED:'1',JARVIS_ALLOW_GROQ_FREE:'1',GROQ_API_KEY:'test-only-fake-provider-secret',
 COMMONS_GROQ_SEAT_TOKEN:'T'.repeat(48)};
const ID='d188f137-1086-4ae2-96f9-258f31b792b2';
const SOURCE={room:'first-table',events:[{id:ID,text:'Fictional octopus in Waseca with beans.',content_sha256:'a'.repeat(64)}]};
const makeRes=()=>({code:0,setHeader(){},status(n){this.code=n;return this},json(o){this.body=o;return this}});
const req=(headers={})=>({method:'POST',headers:{host:'localhost','x-commons-explicit-action':'I_APPROVE_PUBLIC_AI_PARTY',...headers},body:{room:'first-table',provider:'groq'}});
const ok=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
test('model must supply a small actual structured contribution',()=>{
 assert.match(normalize({choices:[{message:{content:JSON.stringify({contribution:'One octopus-led bean exchange station.',uncertainty:'The scene is imaginary.'})}}]},'groq'),/held for operator review/);
 assert.throws(()=>normalize({choices:[{message:{content:'not json'}}]},'gemini'),/MODEL_JSON_INVALID/);
});
test('preview and explicit opt-in gate run before any network',async()=>{
 let n=0;const f=()=>{n++;throw Error('not allowed')};
 const a=await createHandler({env:{...ENV,VERCEL_ENV:'production'},fetcher:f})(req(),makeRes());
 assert.equal(a.code,503);assert.equal(n,0);
 const b=await createHandler({env:ENV,fetcher:f})(req({'x-commons-explicit-action':'no'}),makeRes());
 assert.equal(b.code,403);assert.equal(n,0);
 const c=await createHandler({env:ENV,fetcher:f})(req({origin:'https://evil.example'}),makeRes());
 assert.equal(c.code,403);assert.equal(n,0);
});
test('one actual provider call comes only AFTER claim and is HELD after submission',async()=>{
 const calls=[];let models=0;
 const fetcher=async(url,init)=>{
  calls.push(String(url));
  if(String(url).includes('/rooms/'))return ok(200,SOURCE);
  if(String(url).endsWith('/claim'))return ok(200,{claim_id:'c7d54ad7-6b06-4766-ad8f-d39d01f0683e',status:'CLAIMED_ONE_ATTEMPT'});
  if(String(url).endsWith('/mcp')){
   const a=JSON.parse(init.body).params.arguments;
   assert.equal(a.parent_id,ID);
   assert.equal(a.room,'first-table');
   return ok(200,{result:{content:[{type:'text',text:JSON.stringify({receipt:{receipt_id:'a5c424a0-d0ce-48f9-9d40-6aa4accf79bb',status:'HELD_FOR_REVIEW'}})}]}});
  }
  if(String(url).endsWith('/finish')){assert.equal(JSON.parse(init.body).status,'HELD_SUBMITTED');return ok(200,{status:'HELD_SUBMITTED'})}
  throw Error('unexpected external URL');
 };
 const provider=()=>async()=>{models++;return {choices:[{message:{content:JSON.stringify({contribution:'Let each visitor leave a bean recipe to share.',uncertainty:'This is a fictional room, no commitments.'})}}]}};
 const res=await createHandler({env:ENV,fetcher,freeProvider:provider})(req(),makeRes());
 assert.equal(res.code,200,JSON.stringify(res.body));
 assert.equal(models,1);assert.equal(res.body.publiclyAdmitted,false);
 assert.deepEqual(calls.map(x=>x.split('/').pop()),['first-table','claim','mcp','finish']);
});
test('duplicate/limit claim prevents all model calls',async()=>{
 let models=0;
 const fetcher=async url=>String(url).includes('/rooms/')?ok(200,SOURCE):ok(409,{error:'ALREADY_CLAIMED_NO_RETRY'});
 const res=await createHandler({env:ENV,fetcher,freeProvider:()=>async()=>{models++;throw Error('model should not run')}})(req(),makeRes());
 assert.equal(res.code,409);assert.equal(models,0);assert.equal(res.body.providerCalls,0);
});
test('provider failed once is recorded as hold, never retried or switched',async()=>{
 let models=0,finished=0;
 const fetcher=async(url,init)=>{
  if(String(url).includes('/rooms/'))return ok(200,SOURCE);
  if(String(url).endsWith('/claim'))return ok(200,{claim_id:'c7d54ad7-6b06-4766-ad8f-d39d01f0683e',status:'CLAIMED_ONE_ATTEMPT'});
  if(String(url).endsWith('/finish')){finished++;assert.equal(JSON.parse(init.body).status,'PROVIDER_HOLD');return ok(200,{status:'PROVIDER_HOLD'})}
  throw Error('unexpected');
 };
 const res=await createHandler({env:ENV,fetcher,freeProvider:()=>async()=>{models++;throw Error('FREE_PROVIDER_HTTP_429')}})(req(),makeRes());
 assert.equal(res.code,429);assert.equal(models,1);assert.equal(finished,1);assert.equal(res.body.providerCalls,1);
});
