import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assemble} from '../src/worker.mjs';
import {reasonQuestion,parseAdaptive} from '../src/adaptive.mjs';
import adaptiveHandler from '../api/adaptive.js';
import {verifyAdaptive,matchesAdaptiveSources} from '../public/evidence.mjs';

const q='Could grocery volunteers and church musicians create a useful paper invitation together?';
const mockFetch=async()=>new Response('# Source material\nA draft card could be reviewed by an independent steward first.\n');
const good={answer:'A small shared invitation could connect an existing food planning effort to a separately approved music gathering. Start with a paper draft, not an event announcement.',
 firstMove:'Ask one willing grocery organizer to review a three-line invitation without claiming any church partnership.',
 draft:'DRAFT: Would you consider a short conversation about food access? Bring one question or offer. No event or service is promised.',
 unknown:'No particular grocery steward, host, venue, partner permission or actual food need has been verified.',
 sourceIds:[]};
const reply=JSON.stringify(good);
const res=()=>{const state={status:null,headers:{},body:null};return {state,
 setHeader(k,v){state.headers[k]=v;return this;},
 status(n){state.status=n;return this;},json(v){state.body=v;return this;}}};

test('one model is given relevant Commons context and returns a useful artifact with source lineage',async()=>{
 let count=0;
 const base=await assemble(q,mockFetch);
 const answer=await reasonQuestion({question:q,assemble,fetcher:mockFetch,providerId:'groq',provider:async({system,input})=>{
   count++;const ctx=JSON.parse(input);
   assert.match(system,/Answer the actual question first/);
   assert.ok(ctx.commonsNotes.some(n=>n.id==='FW-GROCERY-001'));
   assert.ok(ctx.commonsNotes.some(n=>n.id==='FW-WORSHIP-009'));
   assert.ok(ctx.sourceObservations.every(s=>s.excerpt.length<=235));
   return {choices:[{message:{content:reply}}]};
 }});
 assert.equal(count,1);assert.equal(answer.status,'MODEL_PROPOSAL');
 assert.equal(answer.modelCalls,1);assert.equal(answer.executedActions,false);
 assert.equal(answer.researchedExternally,false);assert.ok(answer.proposal.draft.includes('DRAFT'));
 assert.equal(await verifyAdaptive(answer),true);
 assert.equal(matchesAdaptiveSources(base,answer),true);
 const changed=structuredClone(answer);changed.proposal.firstMove='Actually sign people up automatically';
 assert.equal(await verifyAdaptive(changed),false);
});

test('independent question excludes local Commons and GRAFT promotions',async()=>{
 const other='Why did ancient astronomers study comets?';
 const a=await reasonQuestion({question:other,assemble,fetcher:mockFetch,providerId:'groq',
   provider:async({input})=>{
     const ctx=JSON.parse(input);
     assert.equal(ctx.northStar.relation,'INDEPENDENT_QUESTION');
     assert.deepEqual(ctx.commonsNotes,[]);assert.deepEqual(ctx.graftNotes,[]);
     assert.deepEqual(ctx.northStar.relatedWorkstreams,[]);
     return reply;
   }});
 assert.equal(a.status,'MODEL_PROPOSAL');assert.deepEqual(a.editorialIds,[]);
 assert.equal(await verifyAdaptive(a),true);
});

test('invalid source claims, invented actions and secrets never become accepted model answers',()=>{
 assert.throws(()=>parseAdaptive(JSON.stringify({...good,sourceIds:['fake-donor']}),['tablelogic']),/ADAPTIVE_OUTPUT_INVALID/);
 assert.throws(()=>parseAdaptive(JSON.stringify({...good,answer:'The organizer already agreed to run the event and is committed to attending.'}),[]),/ADAPTIVE_UNSUPPORTED_EFFECT/);
 assert.throws(()=>parseAdaptive(JSON.stringify({...good,draft:'Please email private@example.com to obtain the password.'}),[]),/ADAPTIVE_PRIVATE_OUTPUT/);
 assert.throws(()=>parseAdaptive('not-json',[]),/ADAPTIVE_OUTPUT_NOT_JSON/);
});

test('production always refuses model transport even when free credentials exist',async()=>{
 const env=['VERCEL_ENV','JARVIS_ADAPTIVE_ENABLED','JARVIS_AI_ENABLED',
 'JARVIS_FREE_COMPUTE_ENABLED','JARVIS_ALLOW_GROQ_FREE','GROQ_API_KEY'];
 const saved=Object.fromEntries(env.map(k=>[k,process.env[k]])),old=globalThis.fetch;
 let count=0;
 try{
  Object.assign(process.env,{VERCEL_ENV:'production',JARVIS_ADAPTIVE_ENABLED:'1',
   JARVIS_AI_ENABLED:'1',JARVIS_FREE_COMPUTE_ENABLED:'1',JARVIS_ALLOW_GROQ_FREE:'1',
   GROQ_API_KEY:'fake_groq_example_long_token'});
  globalThis.fetch=async()=>{count++;throw Error('NO_NET_ACCESS')};
  const get=res();await adaptiveHandler({method:'GET'},get);
  assert.equal(get.state.status,200);assert.equal(get.state.body.enabled,false);
  const post=res();await adaptiveHandler({method:'POST',body:{question:q}},post);
  assert.equal(post.state.status,503);assert.equal(post.state.body.modelInvoked,false);
  assert.equal(count,0);
 }finally{globalThis.fetch=old;for(const [k,v] of Object.entries(saved)){
  if(v===undefined)delete process.env[k];else process.env[k]=v;
 }}
});

test('protected preview uses exactly one real adapter call, never an automatic council',async()=>{
 const env=['VERCEL_ENV','JARVIS_ADAPTIVE_ENABLED','JARVIS_AI_ENABLED',
  'JARVIS_FREE_COMPUTE_ENABLED','JARVIS_ALLOW_GROQ_FREE','GROQ_API_KEY','JARVIS_ALLOW_GEMINI_FREE','GEMINI_API_KEY'];
 const saved=Object.fromEntries(env.map(k=>[k,process.env[k]])),old=globalThis.fetch;
 let calls=0;
 try{
  Object.assign(process.env,{VERCEL_ENV:'preview',JARVIS_ADAPTIVE_ENABLED:'1',
   JARVIS_AI_ENABLED:'1',JARVIS_FREE_COMPUTE_ENABLED:'1',JARVIS_ALLOW_GROQ_FREE:'1',
   GROQ_API_KEY:'fake_groq_example_long_token',JARVIS_ALLOW_GEMINI_FREE:'0'});
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch=async(url,options)=>{
   if(url.startsWith('https://raw.githubusercontent.com/the-static-collective/GRAFT/'))return new Response('Unavailable',{status:404});
   if(url.startsWith('https://raw.githubusercontent.com/'))return mockFetch();
   if(url==='https://api.groq.com/openai/v1/chat/completions'){
     calls++;const body=JSON.parse(options.body),ctx=JSON.parse(body.messages[1].content);
     assert.ok(ctx.commonsNotes.some(n=>n.id==='FW-GROCERY-001'));
     return new Response(JSON.stringify({choices:[{message:{content:reply}}]}),{status:200});
   }
   throw Error('UNEXPECTED_ENDPOINT: '+url);
  };
  const get=res();await adaptiveHandler({method:'GET'},get);
  assert.equal(get.state.body.enabled,true);
  const post=res();await adaptiveHandler({method:'POST',body:{question:q}},post);
  assert.equal(post.state.status,200);assert.equal(calls,1);
  assert.equal(post.state.body.providerId,'groq');assert.equal(post.state.body.modelCalls,1);
  assert.equal(await verifyAdaptive(post.state.body),true);
  assert.ok(!JSON.stringify(post.state.body).includes(process.env.GROQ_API_KEY));
 }finally{globalThis.fetch=old;for(const [k,v] of Object.entries(saved)){
  if(v===undefined)delete process.env[k];else process.env[k]=v;
 }}
});

test('answer UI is automatic after verified card but never triggers on submission before it',()=>{
 const client=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/adaptive-ui.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(client,/void startAdaptive\(data\)/);
 assert.match(ui,/verifyAdaptive\(value\)/);
 assert.match(ui,/matchesAdaptiveSources\(base,value\)/);
 assert.match(ui,/if\(!statusRes.ok\) return/);
 assert.match(ui,/status.enabled/);
 assert.match(html,/external AI model/);
 assert.match(ui,/Copy this draft/);
 assert.match(ui,/active\?\.abort/);
});
