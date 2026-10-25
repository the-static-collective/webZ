// Protected preview-only deliberation: exactly one Groq scout and one Gemini critic.
// Neither may act; no public production inference, no retries, no paid model fallback.
import {assemble,inputError,REQUEST_LIMIT} from '../src/worker.mjs';
import {availableProviders,makeFreeApiProvider} from '../src/free-compute.mjs';
import {council} from '../src/council.mjs';
import {normalizeFieldPack} from '../public/field-witness.mjs';
import {selectCommons} from '../public/commons.mjs';

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  if(process.env.VERCEL_ENV!=='preview'||process.env.JARVIS_AI_ENABLED!=='1'
    ||process.env.JARVIS_FREE_COMPUTE_ENABLED!=='1'||process.env.JARVIS_COUNCIL_ENABLED!=='1')
    return res.status(503).json({status:'HOLD',reason:'COUNCIL_NOT_ENABLED',
      message:'Council is not enabled. The original JAR question card still works.'});
  const available=new Set(availableProviders(process.env));
  if(!available.has('groq')||!available.has('gemini'))
    return res.status(503).json({status:'HOLD',reason:'COUNCIL_PROVIDERS_NOT_CONFIGURED',
      message:'Both Groq and Gemini free-tier providers are required. No model was called.'});
  const obj=req.body && typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
  if(typeof obj.question!=='string')return res.status(400).json({error:'QUESTION_REQUIRED'});
  if(new TextEncoder().encode(JSON.stringify(obj)).byteLength>(obj.fieldPack?14500:REQUEST_LIMIT))
    return res.status(413).json({error:'QUESTION_TOO_LARGE'});
  try {
    // No visitor upload needed: use the versioned site-published Commons by default.
    // An explicit visitor-supplied pack remains an optional operator override.
    const fieldPack=obj.fieldPack?normalizeFieldPack(obj.fieldPack)
      :normalizeFieldPack({schema:'ask-jarvis/field-witness-v1',
        entries:selectCommons(obj.question).map(({relevance,...entry})=>entry)});
    const fieldPackOrigin=obj.fieldPack?'OPERATOR_SELECTED_UNVERIFIED':'SITE_PUBLISHED_UNVERIFIED';
    const result=await council({question:obj.question,kind:obj.kind??'auto',assemble,fieldPack,fieldPackOrigin,
      scoutProvider:makeFreeApiProvider('groq',process.env),
      criticProvider:makeFreeApiProvider('gemini',process.env)});
    return res.status(200).json(result);
  } catch(e) {
    return res.status(422).json({error:inputError(e)});
  }
}
