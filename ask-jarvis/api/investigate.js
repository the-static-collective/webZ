// Optional VIS model investigator. Intentionally disabled by default on public Vercel.
import {assemble,inputError,REQUEST_LIMIT} from '../src/worker.mjs';
import {investigate,makeGatewayProvider} from '../src/investigator.mjs';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  // Rate limiting + cost cap are prerequisites for operator enabling this on public domains.
  if(process.env.JARVIS_AI_ENABLED!=='1')return res.status(503).json({
    schema:'ask-jarvis/investigation-v1',status:'HOLD',reason:'MODEL_NOT_ENABLED',
    message:'VIS model investigation is not enabled on this site. The original question machine still works.'
  });
  // Vercel Functions may provide their OIDC assertion as a platform-injected
  // request header. The AI Gateway independently validates its signature.
  const oidcFromPlatform = req.headers?.['x-vercel-oidc-token'];
  const token=process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    || (typeof oidcFromPlatform==='string' ? oidcFromPlatform : undefined);
  if(!token)return res.status(503).json({
    schema:'ask-jarvis/investigation-v1',status:'HOLD',reason:'NO_MODEL_CREDENTIAL',
    message:'VIS model credentials are not configured. No model was called.'
  });
  const obj=req.body && typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
  if(typeof obj.question!=='string')return res.status(400).json({error:'QUESTION_REQUIRED'});
  if(new TextEncoder().encode(JSON.stringify(obj)).byteLength>REQUEST_LIMIT)return res.status(413).json({error:'QUESTION_TOO_LARGE'});
  try{
    const provider=makeGatewayProvider({token});
    const result=await investigate({question:obj.question,kind:obj.kind??'auto',assemble,provider});
    return res.status(200).json(result);
  }catch(error) {
    // Never expose service credentials, model responses, stack traces or upstream details.
    return res.status(422).json({error:inputError(error)});
  }
}
