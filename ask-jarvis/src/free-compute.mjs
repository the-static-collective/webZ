// FREE-COMPUTE-007. Server-side, allowlisted, one-provider-per-click routing.
// No arbitrary hosts/models, no cross-provider retry, no tools/actions and no secrets in responses.
// External trial/free labels are NOT a guarantee that an account cannot be billed.
import {makeNvidiaTrialProvider,makeWorkersProvider,NVIDIA_TRIAL_MODEL,WORKERS_MODEL} from './investigator.mjs';

export const ROUTES = Object.freeze(['auto','nemotron','fast','reason','explore']);
const ORDER = Object.freeze({
  auto:['nvidia-trial','cloudflare-nemotron','groq','gemini','openrouter','worker-ai'],
  nemotron:['cloudflare-nemotron','nvidia-trial'],
  fast:['groq','worker-ai','gemini','openrouter'],
  reason:['gemini','cloudflare-nemotron','groq','openrouter'],
  explore:['openrouter','gemini','groq','worker-ai']
});
export const FREE_RESOURCE_CATALOG = Object.freeze([
  {id:'nvidia-trial',kind:'text',model:NVIDIA_TRIAL_MODEL,mode:'EVALUATION_ONLY',credential:'NVIDIA_API_KEY',note:'NVIDIA Build: private supervised development only; NOT public or commercial production.'},
  {id:'groq',kind:'text',model:'openai/gpt-oss-120b',mode:'FREE_PLAN_ONLY',credential:'GROQ_API_KEY',note:'Verify account remains on Groq Free; rates and daily limits can change.'},
  {id:'gemini',kind:'text',model:'gemini-2.5-flash-lite',mode:'FREE_TIER_ONLY',credential:'GEMINI_API_KEY',note:'Free-tier prompts may be used to improve products; do not send private data.'},
  {id:'openrouter',kind:'text',model:'openrouter/free',mode:'FREE_MODELS_ONLY',credential:'OPENROUTER_API_KEY',note:'OpenRouter selects an available free model; prompts may go to different upstreams.'},
  {id:'cloudflare-nemotron',kind:'text',model:'@cf/nvidia/nemotron-3-120b-a12b',mode:'FREE_ALLOWANCE_METERED',credential:'CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID',note:'Workers AI consumption above free Neurons can be billable; check account hard caps.'},
  {id:'worker-ai',kind:'text',model:WORKERS_MODEL,mode:'WORKERS_BINDING',credential:'Cloudflare Worker AI binding',note:'Workers-native alternative; not deployed by this Vercel branch.'},
  {id:'modal-compute',kind:'compute',model:null,mode:'PLANNED',credential:null,note:'Modal monthly compute credit is not a hosted inference API. Requires a separately deployed, reviewed service.'}
]);
const validSecret=v=>typeof v==='string'&&v.trim().length>=12;
const isOn=v=>v==='1';
export function availableProviders(env={},ai=null) {
  const names=[];
  if(validSecret(env.NVIDIA_API_KEY)&&env.NVIDIA_API_KEY.startsWith('nvapi-'))names.push('nvidia-trial');
  if(isOn(env.JARVIS_ALLOW_GROQ_FREE)&&validSecret(env.GROQ_API_KEY))names.push('groq');
  if(isOn(env.JARVIS_ALLOW_GEMINI_FREE)&&validSecret(env.GEMINI_API_KEY))names.push('gemini');
  if(isOn(env.JARVIS_ALLOW_OPENROUTER_FREE)&&validSecret(env.OPENROUTER_API_KEY))names.push('openrouter');
  if(isOn(env.JARVIS_ALLOW_CLOUDFLARE_FREE)&&validSecret(env.CLOUDFLARE_API_TOKEN)
    &&/^[a-f\d]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID||''))names.push('cloudflare-nemotron');
  if(isOn(env.JARVIS_ALLOW_WORKERS_AI)&&typeof ai?.run==='function')names.push('worker-ai');
  return names;
}
export function resourceStatus(env={},ai=null) {
  const enabled=new Set(availableProviders(env,ai));
  return {schema:'jarvis/free-compute-v1',stage:'PROTECTED_PREVIEW_ONLY',routes:[...ROUTES],
    providers:FREE_RESOURCE_CATALOG.map(p=>({
      id:p.id,kind:p.kind,model:p.model,mode:p.mode,ready:enabled.has(p.id),note:p.note
    })),autofallback:false,publicProductionEnabled:false,perRequestModelCalls:1};
}
export function selectRoute(env={},route='auto',fetcher=fetch,ai=null) {
  if(!ROUTES.includes(route))throw Error('ROUTE_NOT_ALLOWED');
  const ready=new Set(availableProviders(env,ai));
  const id=ORDER[route].find(key=>ready.has(key));
  if(!id)return null;
  const info=FREE_RESOURCE_CATALOG.find(x=>x.id===id);
  const provider=id==='nvidia-trial'
    ? makeNvidiaTrialProvider({token:env.NVIDIA_API_KEY,fetcher})
    : id==='worker-ai' ? makeWorkersProvider(ai)
    : makeFreeApiProvider(id,env,fetcher);
  return {id,model:info.model,mode:info.mode,route,provider};
}
async function boundedPost(url,token,body,fetcher,headers={},deadlineMs=10500) {
  // url is fixed by the caller's immutable provider id, never supplied by visitor.
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),deadlineMs);
  try {
    const res=await fetcher(url,{method:'POST',redirect:'error',signal:controller.signal,
      headers:{'content-type':'application/json',accept:'application/json',...headers,
        ...(token?{authorization:'Bearer '+token}:{})},
      body:JSON.stringify(body)
    });
    if(!res.ok)throw Error('FREE_PROVIDER_HTTP_'+res.status);
    if(Number(res.headers.get('content-length'))>14000)throw Error('FREE_PROVIDER_RESPONSE_LIMIT');
    const reader=res.body?.getReader();
    if(!reader)throw Error('FREE_PROVIDER_EMPTY');
    const chunks=[];let bytes=0;
    try {
      while(true) {
        const {value,done}=await reader.read();
        if(done)break;
        bytes+=value.byteLength;
        if(bytes>14000)throw Error('FREE_PROVIDER_RESPONSE_LIMIT');
        chunks.push(value);
      }
    } finally {void reader.cancel().catch(()=>{});reader.releaseLock();}
    const joined=new Uint8Array(bytes);let offset=0;
    for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}
    try{return JSON.parse(new TextDecoder().decode(joined));}
    catch{throw Error('FREE_PROVIDER_INVALID_JSON');}
  } finally {clearTimeout(timer);controller.abort();}
}
export function makeFreeApiProvider(id,env={},fetcher=fetch) {
  if(!availableProviders(env).includes(id)||!['groq','gemini','openrouter','cloudflare-nemotron'].includes(id))
    throw Error('FREE_PROVIDER_NOT_ALLOWED');
  return async ({system,input})=>{
    const messages=[{role:'system',content:system},{role:'user',content:input}];
    switch(id) {
      case 'groq': return boundedPost('https://api.groq.com/openai/v1/chat/completions',env.GROQ_API_KEY,
        {model:'openai/gpt-oss-120b',messages,temperature:0.2,max_completion_tokens:1100,
          reasoning_effort:'low',response_format:{type:'json_object'},stream:false},fetcher);
      case 'openrouter':return boundedPost('https://openrouter.ai/api/v1/chat/completions',env.OPENROUTER_API_KEY,
        {model:'openrouter/free',messages,max_tokens:1100,temperature:0.2,stream:false},fetcher);
      case 'gemini': {
        const raw=await boundedPost(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
          null,{systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:input}]}],
            generationConfig:{responseMimeType:'application/json',temperature:0.2,maxOutputTokens:1100}},
          fetcher,{'x-goog-api-key':env.GEMINI_API_KEY});
        const answer=raw?.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('');
        if(!answer)throw Error('GEMINI_EMPTY_RESULT');
        return {choices:[{message:{content:answer}}]};
      }
      case 'cloudflare-nemotron': {
        // REST endpoint is fixed; account IDs are validated 32-character hex, not arbitrary URLs.
        const account=env.CLOUDFLARE_ACCOUNT_ID;
        return boundedPost('https://api.cloudflare.com/client/v4/accounts/'+account+
          '/ai/run/@cf/nvidia/nemotron-3-120b-a12b',env.CLOUDFLARE_API_TOKEN,
          {messages,max_tokens:1100,temperature:0.2,stream:false,
            chat_template_kwargs:{enable_thinking:false}},fetcher);
      }
      default:throw Error('FREE_PROVIDER_NOT_ALLOWED');
    }
  };
}
