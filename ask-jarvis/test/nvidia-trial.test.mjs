import test from 'node:test';
import assert from 'node:assert/strict';
import {makeNvidiaTrialProvider,NVIDIA_TRIAL_MODEL,GATEWAY_MODEL} from '../src/investigator.mjs';

test('Nemotron is pinned to NVIDIA Build and Vercel free models',()=>{
 assert.equal(NVIDIA_TRIAL_MODEL,'nvidia/nemotron-3.5-lightning-30b-a3b');
 assert.equal(GATEWAY_MODEL,'nvidia/nemotron-3.5-lightning-free');
});

test('direct NVIDIA trial uses only fixed endpoint and does not leak key in body',async()=>{
 const requests=[];
 const response={choices:[{message:{content:'{"summary":"a reviewed public experiment"}'}}]};
 const provider=makeNvidiaTrialProvider({
   token:'nvapi-mock-test-key-123456789',
   fetcher:async(url,options)=>{
      requests.push({url,options});
      return new Response(JSON.stringify(response),{status:200,headers:{'content-type':'application/json'}});
   }
 });
 const actual=await provider({system:'approved-safe public system instructions',input:'fictional example question'});
 assert.deepEqual(actual,response);
 assert.equal(requests.length,1);
 assert.equal(requests[0].url,'https://integrate.api.nvidia.com/v1/chat/completions');
 const b=JSON.parse(requests[0].options.body);
 assert.equal(b.model,NVIDIA_TRIAL_MODEL);
 assert.equal(b.stream,false);
 assert.ok(b.max_tokens<=900);
 assert.ok(!JSON.stringify(b).includes('nvapi-'));
 assert.equal(requests[0].options.headers.authorization,'Bearer nvapi-mock-test-key-123456789');
});

test('invalid trial keys or failed NVIDIA response HOLD',async()=>{
 assert.throws(()=>makeNvidiaTrialProvider({token:'short'}),/NVIDIA_TRIAL_TOKEN_REQUIRED/);
 const provider=makeNvidiaTrialProvider({
   token:'nvapi-mock-test-key-123456789',
   fetcher:async()=>new Response('not an available trial',{status:429})
 });
 await assert.rejects(()=>provider({system:'safe',input:'safe'}),/NVIDIA_TRIAL_HTTP_429/);
});
