import test from 'node:test';
import assert from 'node:assert/strict';
import askHandler from '../api/ask.js';
import councilHandler from '../api/council.js';
import {verifyReturn,verifyCouncil} from '../public/evidence.mjs';

const q='How could a community grocery combine an optional music supper with a GRAFT printable kit?';
const gql={
 schema:'graft/public-commons-feed-v1',release:'test-graft-release-001',
 entries:[{
  id:'GRAFT-LIVE-WORK-002',lane:'workbench',status:'DOCUMENTED_ARTIFACT',
  title:'GRAFT local printable food kit',
  summary:'A local GRAFT synthetic experiment produced bounded printable need offer build return materials, not an operating food exchange.',
  firstCheck:'Would one willing organizer inspect a fictional printed kit first?',
  sourceRepo:'GRAFT',sourceCommit:'aa3984d2dbdf949996639b029ca0d95ab6c290e5',
  sourcePath:'docs/LIVE-WORK-002.md',effects:'LOCAL_SYNTHETIC_FILES_ONLY',
  sourceState:'PUBLIC_DOC_PIN_NOT_OWNER_CANON',publication:'PUBLIC_SUMMARY_PROPOSED_FOR_REVIEW'
 }]
};
const response=()=>{const state={status:null,body:null};return {state,
  setHeader(){return this},status(n){state.status=n;return this},json(v){state.body=v;return this}}};
const keys=['VERCEL_ENV','JARVIS_AI_ENABLED','JARVIS_FREE_COMPUTE_ENABLED','JARVIS_COUNCIL_ENABLED',
  'GROQ_API_KEY','JARVIS_ALLOW_GROQ_FREE','Gemini_API_Key','JARVIS_ALLOW_GEMINI_FREE','GEMINI_API_KEY'];

test('question and two-model Council use the same GRAFT candidate as opt-in, unverified context; no upload',async()=>{
 const original=Object.fromEntries(keys.map(k=>[k,process.env[k]])),oldFetch=globalThis.fetch;
 let scout=0,critic=0,feedCalls=0;
 try {
  Object.assign(process.env,{VERCEL_ENV:'preview',JARVIS_AI_ENABLED:'1',JARVIS_FREE_COMPUTE_ENABLED:'1',
    JARVIS_COUNCIL_ENABLED:'1',GROQ_API_KEY:'test_groq_test_only_123456789',
    JARVIS_ALLOW_GROQ_FREE:'1',Gemini_API_Key:'test_gemini_test_only_123456789',
    JARVIS_ALLOW_GEMINI_FREE:'1'});
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch=async(url,opts)=>{
   if(url.startsWith('https://raw.githubusercontent.com/the-static-collective/GRAFT/')){
     feedCalls++;return new Response(JSON.stringify(gql),{status:200});
   }
   if(url.startsWith('https://raw.githubusercontent.com/')){
     return new Response('# Source\nA source title and bounded README document. No real permission.\n',{status:200});
   }
   if(url==='https://api.groq.com/openai/v1/chat/completions'){
     const request=JSON.parse(opts.body),payload=JSON.parse(request.messages.at(-1).content);
     assert.ok(payload.fieldPack.entries.some(x=>x.id==='FW-GRAFT-LIVE-WORK-002'));
     assert.ok(payload.fieldPack.entries.some(x=>x.observation.includes('REVIEW PENDING')));
     scout++;
     return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({
      hypothesis:'An unsigned local kit might be useful to a willing host without operating food handling.',
      missingIngredient:'A real person willing to review a small hypothetical food-and-music proposal.',
      whyThisOne:'GRAFT sources show a synthetic work kit but no enrolled field partner.',
      sourceIds:[],firstQuestion:'Would anyone choose to read this fictional kit without committing to perform?',
      firstTest:'Show one willing human a draft for correction only.',
      unknowns:['No real food handling has been documented.'],
      consentCheck:'A willing authorizer must approve any activity before it happens.'
     })}}]}));
   }
   if(url.startsWith('https://generativelanguage.googleapis.com/')){
     const request=JSON.parse(opts.body),payload=JSON.parse(request.contents[0].parts[0].text);
     assert.ok(payload.fieldPack.entries.some(x=>x.id==='FW-GRAFT-LIVE-WORK-002'));
     assert.ok(payload.scout.missingIngredient.includes('willing'));
     critic++;
     return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({
      verdict:'HOLD',pressure:'The available material cannot establish actual stewardship or permission.',
      evidenceGap:'A willing steward and actual food-access need are unverified.',
      sourceIds:[],smallestCheck:'Offer one organizer a fictional kit for review, not adoption.',
      disagreement:'The scout model sees a candidate but none of the sources confirms a human willing to use it.'
     })}]}}]}));
   }
   throw Error('Unexpected upstream URI');
  };
  const a=response();await askHandler({method:'POST',body:{question:q,kind:'plan'}},a);
  assert.equal(a.state.status,200);
  assert.equal(a.state.body.graft.status,'READ');
  assert.equal(a.state.body.graft.state,'STAGED_FOR_REVIEW');
  assert.equal(a.state.body.graft.selected[0].publication,'PUBLIC_SUMMARY_PROPOSED_FOR_REVIEW');
  assert.equal(await verifyReturn(a.state.body),true);
  const b=response();await councilHandler({method:'POST',body:{question:q,kind:'plan'}},b);
  assert.equal(b.state.status,200);
  assert.equal(b.state.body.status,'COUNCIL_PROPOSAL');
  assert.equal(b.state.body.fieldWitness.count>=4,true);
  assert.equal(b.state.body.fieldWitness.status,'SITE_PUBLISHED_UNVERIFIED');
  assert.equal(await verifyCouncil(b.state.body),true);
  assert.equal(scout,1);assert.equal(critic,1);
  assert.ok(feedCalls>=1);
 }finally{
  globalThis.fetch=oldFetch;
  for(const [k,v] of Object.entries(original)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
 }
});
