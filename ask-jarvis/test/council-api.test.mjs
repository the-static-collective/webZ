import test from 'node:test';
import assert from 'node:assert/strict';
import councilHandler from '../api/council.js';
import {verifyCouncil} from '../public/evidence.mjs';

function response(){const state={status:null,headers:{},body:null};return {
 state,setHeader(k,v){state.headers[k]=v;return this;},
 status(n){state.status=n;return this;},json(x){state.body=x;return this;}
};}
const q='Which single missing ingredient would enable a safe and human-reviewed community food experiment with musicians?';
const scout={
 hypothesis:'One reversible public-safe planning exercise might clarify a concrete food need.',
 missingIngredient:'A specific willing steward who can affirm one actual, observable food access gap.',
 whyThisOne:'Without a steward or gap, no pilot has an accountable starting point.',
 sourceIds:['alex'],firstQuestion:'Could one willing steward identify one need they would review but not yet commit to address?',
 firstTest:'Offer a single unsigned question card for the steward to review, without recruiting anyone.',
 unknowns:['No consent has been recorded.'],
 consentCheck:'Ask the relevant human steward before treating any role or project as accepted.'
};
const critic={
 verdict:'HOLD',pressure:'Source excerpts contain no real consent or food need measurement.',
 evidenceGap:'Actual steward identity and scope are entirely unobserved.',
 sourceIds:['3rdi'],smallestCheck:'Review one draft question with a willing organizer without any public commitments.',
 disagreement:'The proposal implies a real food gap that has not been witnessed.'
};
test('council public deployment stays HOLD even when env flags and trial keys exist',async()=>{
 const keys=['VERCEL_ENV','JARVIS_AI_ENABLED','JARVIS_FREE_COMPUTE_ENABLED',
   'JARVIS_COUNCIL_ENABLED','GROQ_API_KEY','JARVIS_ALLOW_GROQ_FREE',
   'Gemini_API_Key','JARVIS_ALLOW_GEMINI_FREE'];
 const original=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 const originalFetch=globalThis.fetch;let calls=0;
 try {
   Object.assign(process.env,{VERCEL_ENV:'production',JARVIS_AI_ENABLED:'1',
     JARVIS_FREE_COMPUTE_ENABLED:'1',JARVIS_COUNCIL_ENABLED:'1',
     GROQ_API_KEY:'gsk_long_example_only_for_tests',
     JARVIS_ALLOW_GROQ_FREE:'1',Gemini_API_Key:'fake_long_gemini_key_123456',
     JARVIS_ALLOW_GEMINI_FREE:'1'});
   globalThis.fetch=async()=>{calls++;throw Error('PRODUCTION_MUST_NOT_CALL_API')};
   const res=response();
   await councilHandler({method:'POST',body:{question:q}},res);
   assert.equal(res.state.status,503);
   assert.equal(res.state.body.reason,'COUNCIL_NOT_ENABLED');
   assert.equal(calls,0);
 }finally{globalThis.fetch=originalFetch;
   for(const [key,val] of Object.entries(original)){if(val===undefined)delete process.env[key];else process.env[key]=val;}
 }
});
test('two live transport adapters pass one scout to critic in protected preview, hashed but unsigned',async()=>{
 const keys=['VERCEL_ENV','JARVIS_AI_ENABLED','JARVIS_FREE_COMPUTE_ENABLED',
   'JARVIS_COUNCIL_ENABLED','GROQ_API_KEY','JARVIS_ALLOW_GROQ_FREE',
   'Gemini_API_Key','JARVIS_ALLOW_GEMINI_FREE','GEMINI_API_KEY'];
 const original=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 const originalFetch=globalThis.fetch;let calls=[],modelCalls=0;
 try {
   Object.assign(process.env,{VERCEL_ENV:'preview',JARVIS_AI_ENABLED:'1',
     JARVIS_FREE_COMPUTE_ENABLED:'1',JARVIS_COUNCIL_ENABLED:'1',
     GROQ_API_KEY:'gsk_long_example_only_for_tests',JARVIS_ALLOW_GROQ_FREE:'1',
     Gemini_API_Key:'fake_long_gemini_key_123456',JARVIS_ALLOW_GEMINI_FREE:'1'});
   delete process.env.GEMINI_API_KEY;
   globalThis.fetch=async (url,opts)=>{
     calls.push(url);
     if(url.startsWith('https://raw.githubusercontent.com/'))return new Response(
       '# Source\n## The floor\n## What LOADOUT owns\n## Constitutional line\nClaims require evidence and consent is not assumed.\n',{status:200});
     if(url==='https://api.groq.com/openai/v1/chat/completions'){
       modelCalls++;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(scout)}}]}),{status:200});
     }
     if(url.startsWith('https://generativelanguage.googleapis.com/')){
       modelCalls++;
       const req=JSON.parse(opts.body),payload=JSON.parse(req.contents[0].parts[0].text);
       assert.equal(payload.scout.missingIngredient,scout.missingIngredient);
       return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(critic)}]}}]}),{status:200});
     }
     throw Error('UNEXPECTED_ENDPOINT');
   };
   const res=response();
   await councilHandler({method:'POST',body:{question:q,kind:'plan'}},res);
   assert.equal(res.state.status,200);
   assert.equal(res.state.body.status,'COUNCIL_PROPOSAL');
   assert.equal(res.state.body.modelCalls,2);
   assert.equal(modelCalls,2);
   assert.equal(res.state.body.sourceReferences.length,6);
   assert.equal(await verifyCouncil(res.state.body),true);
   assert.ok(!JSON.stringify(res.state.body).includes(process.env.GROQ_API_KEY));
   assert.equal(res.state.headers['Cache-Control'],'no-store');
 }finally{globalThis.fetch=originalFetch;
   for(const [key,val] of Object.entries(original)){if(val===undefined)delete process.env[key];else process.env[key]=val;}
 }
});
