import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES,FREE_RESOURCE_CATALOG,availableProviders,resourceStatus,selectRoute,makeFreeApiProvider} from '../src/free-compute.mjs';
import {parseInvestigation} from '../src/investigator.mjs';

const env={
  NVIDIA_API_KEY:'nvapi-testing-only-mock-123456789',
  GROQ_API_KEY:'groq-testing-only-secret-1234',
  GEMINI_API_KEY:'gemini-testing-only-secret-1234',
  OPENROUTER_API_KEY:'openrouter-testing-only-secret-1234',
  CLOUDFLARE_API_TOKEN:'cloudflare-testing-secret-1234',
  CLOUDFLARE_ACCOUNT_ID:'0123456789abcdef0123456789abcdef',
  JARVIS_ALLOW_GROQ_FREE:'1',JARVIS_ALLOW_GEMINI_FREE:'1',
  JARVIS_ALLOW_OPENROUTER_FREE:'1',JARVIS_ALLOW_CLOUDFLARE_FREE:'1'
};
const invoke=async choice=>{
  let call;
  const transport=async(url,opts)=>{call={url,opts};return new Response(
    JSON.stringify(url.includes('generativelanguage')?{candidates:[{content:{parts:[{text:'{"summary":"example"}'}]}}]}:
      url.includes('cloudflare')?{success:true,result:{response:'{"summary":"example"}'}}:
      {choices:[{message:{content:'{"summary":"example"}'}}]}),{status:200,
        headers:{'content-type':'application/json'}});};
  const chosen=selectRoute(env,choice,transport);
  const reply=await chosen.provider({system:'Only safe JSON.',input:'Public synthetic test question'});
  return {chosen,reply,call};
};
test('catalog separates callable inference from future Modal compute; no user-controlled route values',()=>{
  assert.ok(FREE_RESOURCE_CATALOG.some(x=>x.id==='modal-compute'&&x.mode==='PLANNED'));
  assert.deepEqual(ROUTES,['auto','nemotron','fast','reason','explore']);
  assert.throws(()=>selectRoute(env,'https://malicious.test/'),/ROUTE_NOT_ALLOWED/);
  assert.throws(()=>makeFreeApiProvider('unreviewed',env),/FREE_PROVIDER_NOT_ALLOWED/);
  assert.equal(resourceStatus(env).perRequestModelCalls,1);
  assert.equal(resourceStatus(env).autofallback,false);
});
test('keys alone do not activate Groq, Gemini, OpenRouter or metered Cloudflare',()=>{
  const noExtra={GROQ_API_KEY:env.GROQ_API_KEY,GEMINI_API_KEY:env.GEMINI_API_KEY,
    OPENROUTER_API_KEY:env.OPENROUTER_API_KEY,CLOUDFLARE_API_TOKEN:env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID:env.CLOUDFLARE_ACCOUNT_ID};
  assert.deepEqual(availableProviders(noExtra),[]);
  assert.equal(selectRoute(noExtra,'auto'),null);
  assert.equal(selectRoute(noExtra,'fast'),null);
  assert.deepEqual(availableProviders({...env,CLOUDFLARE_ACCOUNT_ID:'attacker.example'})
    .includes('cloudflare-nemotron'),false);
});
test('existing NVIDIA trial is only configured if a valid secret is present; routes honor lane',()=>{
  assert.equal(selectRoute(env,'auto').id,'nvidia-trial');
  assert.equal(selectRoute(env,'nemotron').id,'cloudflare-nemotron');
  assert.equal(selectRoute(env,'fast').id,'groq');
  assert.equal(selectRoute(env,'reason').id,'gemini');
  assert.equal(selectRoute(env,'explore').id,'openrouter');
  assert.equal(selectRoute({NVIDIA_API_KEY:env.NVIDIA_API_KEY},'fast'),null);
  assert.equal(selectRoute({NVIDIA_API_KEY:env.NVIDIA_API_KEY},'nemotron').id,'nvidia-trial');
});
test('Groq request is allowlisted, bounded and credential only appears in header',async()=>{
  const {chosen,call,reply}=await invoke('fast');
  assert.equal(chosen.id,'groq');
  assert.equal(call.url,'https://api.groq.com/openai/v1/chat/completions');
  const body=JSON.parse(call.opts.body);
  assert.equal(body.model,'openai/gpt-oss-120b');
  assert.ok(body.max_completion_tokens<=1100);
  assert.equal(body.stream,false);
  assert.equal(call.opts.redirect,'error');
  assert.equal(call.opts.headers.authorization,'Bearer '+env.GROQ_API_KEY);
  assert.ok(!call.opts.body.includes(env.GROQ_API_KEY));
  assert.equal(reply.choices[0].message.content,'{"summary":"example"}');
});
test('Gemini request sends system instructions only to fixed generateContent endpoint',async()=>{
  const {call,reply}=await invoke('reason');
  assert.equal(call.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent');
  assert.equal(call.opts.headers['x-goog-api-key'],env.GEMINI_API_KEY);
  assert.ok(!('authorization' in call.opts.headers));
  assert.equal(JSON.parse(call.opts.body).generationConfig.responseMimeType,'application/json');
  assert.equal(reply.choices[0].message.content,'{"summary":"example"}');
});
test('OpenRouter uses free-only router, never a paid fallback',async()=>{
  const {call}=await invoke('explore');
  assert.equal(call.url,'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(JSON.parse(call.opts.body).model,'openrouter/free');
  assert.equal(JSON.parse(call.opts.body).stream,false);
});
test('Cloudflare uses only fixed Nemotron model and validated account id',async()=>{
  const {call,reply}=await invoke('nemotron');
  assert.equal(call.url,'https://api.cloudflare.com/client/v4/accounts/0123456789abcdef0123456789abcdef/ai/run/@cf/nvidia/nemotron-3-120b-a12b');
  assert.equal(JSON.parse(call.opts.body).chat_template_kwargs.enable_thinking,false);
  assert.deepEqual(reply.result.response,'{"summary":"example"}');
});
test('upstream error terminates without contacting any alternate provider',async()=>{
  let calls=0;
  const chosen=selectRoute(env,'fast',async()=>{calls++;return new Response('quota exceeded',{status:429});});
  await assert.rejects(()=>chosen.provider({system:'safe',input:'synthetic public'}),/FREE_PROVIDER_HTTP_429/);
  assert.equal(calls,1);
});
test('overlong model body is refused, not accepted as evidence',async()=>{
  const chosen=selectRoute(env,'fast',async()=>new Response('x'.repeat(15000),{status:200}));
  await assert.rejects(()=>chosen.provider({system:'safe',input:'synthetic public'}),/FREE_PROVIDER_RESPONSE_LIMIT/);
});
