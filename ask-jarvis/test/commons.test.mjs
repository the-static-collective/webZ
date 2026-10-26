import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMMONS_ENTRIES,COMMONS_RELEASE,COMMONS_DISCLOSURE,selectCommons,publicCommonsFor} from '../public/commons.mjs';
import {normalizeFieldPack} from '../public/field-witness.mjs';
import {verifyReturn} from '../public/evidence.mjs';
import {assemble} from '../src/worker.mjs';
import councilHandler from '../api/council.js';

const q='Could local grocery organizers work with church musicians on a food table experiment?';
const mock=async()=>new Response('# Public repository\nA public project document without actual partner commitments.\n',{status:200});
test('public Commons has 15 safe, distinct, bounded and explicitly unverified project notes',()=>{
 assert.equal(COMMONS_ENTRIES.length,15);
 assert.match(COMMONS_RELEASE,/^commons-011/);
 assert.match(COMMONS_DISCLOSURE,/not operating services/i);
 assert.equal(new Set(COMMONS_ENTRIES.map(x=>x.id)).size,COMMONS_ENTRIES.length);
 const normalized=normalizeFieldPack({schema:'ask-jarvis/field-witness-v1',entries:COMMONS_ENTRIES});
 assert.equal(normalized.entries.length,15);
 const all=JSON.stringify(COMMONS_ENTRIES);
 for(const privateField of ['docs.google.com/document/d/','@gmail.com','PRIVATE_KEY','612-555-'])assert.ok(!all.includes(privateField));
});
test('the Commons selects distinct food, church and music context; no network or model needed',()=>{
 const selected=selectCommons(q);
 assert.ok(selected.length>=3&&selected.length<=6);
 assert.ok(selected.some(x=>x.lane==='grocery'),selected.map(x=>x.lane).join(','));
 assert.ok(selected.some(x=>x.lane==='church_music'),selected.map(x=>x.lane).join(','));
 assert.ok(selected.every(x=>x.relevance==='KEYWORD_MATCH'));
 assert.deepEqual(selected,selectCommons(q));
 assert.equal(selectCommons('What are you working on together?').length>=3,true);
});
test('public question automatically includes bounded project context in its hashed return',async()=>{
 const result=await assemble(q,mock,{kind:'question'});
 assert.equal(result.commons.schema,'jarvis/public-commons-v1');
 assert.equal(result.commons.release,COMMONS_RELEASE);
 assert.ok(result.commons.selected.some(x=>x.lane==='grocery'));
 assert.ok(result.steps.some(x=>x.name==='Public Commons'));
 assert.ok(result.artifact.includes('Related public project notes'));
 assert.match(result.guidance,/starting connection|inspected/i);
 assert.equal(await verifyReturn(result),true);
 const changed=structuredClone(result);
 changed.commons.selected[0].observation='The grocery organizers have approved everything.';
 assert.equal(await verifyReturn(changed),false);
});
test('website offers shared project knowledge and manual import remains optional',()=>{
 const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
 const library=readFileSync(new URL('../public/commons.html',import.meta.url),'utf8');
 assert.match(index,/id="question-form"/);
 assert.match(app,/presentUnified\(data\)/);
 assert.match(index,/sitemap|Sitemap/i);
 assert.match(app,/import \{presentUnified,clearUnified\}/);
 assert.match(readFileSync(new URL('../public/unified.mjs',import.meta.url),'utf8'),/selectCommons\(base.question\)/);
 assert.match(library,/id="commons-library"/);
});
test('protected preview council uses the shared Commons even if the visitor imported nothing',async()=>{
 const names=['VERCEL_ENV','JARVIS_AI_ENABLED','JARVIS_FREE_COMPUTE_ENABLED',
   'JARVIS_COUNCIL_ENABLED','GROQ_API_KEY','JARVIS_ALLOW_GROQ_FREE','Gemini_API_Key',
   'JARVIS_ALLOW_GEMINI_FREE','GEMINI_API_KEY'];
 const old=Object.fromEntries(names.map(k=>[k,process.env[k]])),originalFetch=globalThis.fetch;
 let count=0;
 try {
   Object.assign(process.env,{VERCEL_ENV:'preview',JARVIS_AI_ENABLED:'1',
     JARVIS_FREE_COMPUTE_ENABLED:'1',JARVIS_COUNCIL_ENABLED:'1',
     GROQ_API_KEY:'gsk_no_real_key_for_testing',
     JARVIS_ALLOW_GROQ_FREE:'1',Gemini_API_Key:'fake_gemini_key_for_testing',
     JARVIS_ALLOW_GEMINI_FREE:'1'});
   delete process.env.GEMINI_API_KEY;
   globalThis.fetch=async(url,opts)=>{
     if(url.startsWith('https://raw.githubusercontent.com/'))
       return new Response('# Test document\nNo real-world partner approval is known.\n');
     if(url==='https://api.groq.com/openai/v1/chat/completions'){
       count++;
       const input=JSON.parse(JSON.parse(opts.body).messages[1].content);
       assert.equal(input.fieldPack.status,'SITE_PUBLISHED_UNVERIFIED');
       assert.ok(input.fieldPack.entries.some(x=>x.lane==='grocery'));
       assert.ok(input.fieldPack.entries.some(x=>x.lane==='church_music'));
       assert.ok(input.fieldPack.entries.every(x=>!('relevance' in x)));
       return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({
         hypothesis:'A local organizer might review a fictional table proposal alongside musicians.',
         missingIngredient:'Actual permission from a person who owns a specific food-access problem.',
         whyThisOne:'The public summaries record planned projects but not steward consent.',
         sourceIds:[],firstQuestion:'Who independently agreed to review this hypothetical proposal?',
         firstTest:'Offer one willing person an unsigned draft for review only.',
         unknowns:['No willing organizer is documented in this short snapshot.'],
         consentCheck:'Human approval must precede any invitation, food handling or service.'
       })}}]}));
     }
     if(url.startsWith('https://generativelanguage.googleapis.com/')){
       count++;
       const input=JSON.parse(JSON.parse(opts.body).contents[0].parts[0].text);
       assert.equal(input.fieldPack.status,'SITE_PUBLISHED_UNVERIFIED');
       assert.ok(input.scout.missingIngredient.includes('permission'));
       return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({
         verdict:'HOLD',pressure:'A document summary does not demonstrate steward permission.',
         evidenceGap:'Neither actual consent nor a verified food need has been established.',
         sourceIds:[],smallestCheck:'Ask an appropriate willing organizer to review the draft before planning an event.',
         disagreement:'The scout offered a useful plan but the required person remains hypothetical.'
       })}]}}]}));
     }
     throw Error('Unexpected URL');
   };
   const state={status:null,body:null};
   const res={setHeader(){return this},status(n){state.status=n;return this},json(j){state.body=j;return this}};
   await councilHandler({method:'POST',body:{question:q,kind:'question'}},res);
   assert.equal(state.status,200);
   assert.equal(state.body.status,'COUNCIL_PROPOSAL');
   assert.equal(state.body.fieldWitness.status,'SITE_PUBLISHED_UNVERIFIED');
   assert.ok(state.body.fieldWitness.count>=3);
   assert.equal(count,2);
 }finally {
   globalThis.fetch=originalFetch;
   for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
 }
});
