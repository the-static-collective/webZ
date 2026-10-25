// ADAPTIVE-016: preview-gated, one-model question reasoning. No production AI,
// no paid/nvidia evaluation fallback, no remote tool calls or user data storage.
import {assemble,inputError,REQUEST_LIMIT} from '../src/worker.mjs';
import {reasonQuestion} from '../src/adaptive.mjs';
import {availableProviders,makeFreeApiProvider} from '../src/free-compute.mjs';
import {readGraftFeed} from '../src/graft-feed.mjs';
import {rejectPrivatePrompt,admitRequest,applyAdmission,hasSharedQuota} from '../src/usage-guard.mjs';

function candidate(env){
 if(!['preview','production'].includes(env.VERCEL_ENV)||env.JARVIS_ADAPTIVE_ENABLED!=='1'
   ||env.JARVIS_AI_ENABLED!=='1'||env.JARVIS_FREE_COMPUTE_ENABLED!=='1')return null;
 // Intentionally exclude paid/evaluation providers and ambiguous upstream free routers.
 // Public production requires a separate explicit operator release and a shared quota store.
 if(env.VERCEL_ENV==='production'&&(env.JARVIS_PUBLIC_AI_ENABLED!=='1'||!hasSharedQuota(env)))return null;
 const available=new Set(availableProviders(env));
 return available.has('groq')?'groq':available.has('gemini')?'gemini':null;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 const which=candidate(process.env);
 if(req.method==='GET')return res.status(200).json({
   schema:'ask-jarvis/adaptive-status-v1',enabled:Boolean(which),
   scope:process.env.VERCEL_ENV==='production'?'PUBLIC_GATED':'PROTECTED_PREVIEW',
   publicModelEnabled:process.env.VERCEL_ENV==='production'&&Boolean(which),
   disclosure:'When active, one bounded public-safe question and public source summaries go to an external AI provider. No model tools or automatic actions.'
 });
 if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 if(!which)return res.status(503).json({schema:'ask-jarvis/adaptive-v1',status:'HOLD',
   reason:'ADAPTIVE_NOT_ENABLED',modelInvoked:false,
   message:'The original source-grounded answer remains available. Adaptive reasoning is not enabled on this site.'});
 const obj=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
 if(typeof obj.question!=='string')return res.status(400).json({error:'QUESTION_REQUIRED'});
 if(new TextEncoder().encode(JSON.stringify(obj)).byteLength>REQUEST_LIMIT)
   return res.status(413).json({error:'QUESTION_TOO_LARGE'});
 const privateReason=rejectPrivatePrompt(obj.question);
 if(privateReason)return res.status(422).json({schema:'ask-jarvis/usage-guard-v1',status:'HOLD',reason:privateReason,message:'Do not send personal contact information or credentials to experimental AI.',modelInvoked:false});
 const admission=await admitRequest(req,'ai');
 if(applyAdmission(res,admission))return;
 try{
   // Server independently rebuilds the bounded source cut. The browser cannot
   // inject sources, arbitrary provider URLs, tools, field claims or instructions.
   const graft=await readGraftFeed(obj.question,{env:process.env,fetcher:fetch});
   const result=await reasonQuestion({question:obj.question,kind:obj.kind??'auto',
     lens:obj.lens??'standard',assemble,graft,providerId:which,
     provider:makeFreeApiProvider(which,process.env)});
   return res.status(result.status==='MODEL_PROPOSAL'?200:503).json(result);
 }catch(error){
   return res.status(422).json({error:inputError(error)});
 }
}
