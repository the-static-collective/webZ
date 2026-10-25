// Optional VIS model investigator. Intentionally disabled by default on public Vercel.
import {assemble,inputError,REQUEST_LIMIT} from '../src/worker.mjs';
import {investigate,makeGatewayProvider,makeNvidiaTrialProvider} from '../src/investigator.mjs';
import {selectRoute,ROUTES} from '../src/free-compute.mjs';
import {sha256} from '../public/evidence.mjs';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='POST')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  // Rate limiting + cost cap are prerequisites for operator enabling this on public domains.
  if(process.env.VERCEL_ENV!=='preview'||process.env.JARVIS_AI_ENABLED!=='1')return res.status(503).json({
    schema:'ask-jarvis/investigation-v1',status:'HOLD',reason:'MODEL_NOT_ENABLED',
    message:'VIS model investigation is not enabled on this site. The original question machine still works.'
  });
  // Vercel Functions may provide their OIDC assertion as a platform-injected
  // request header. The AI Gateway independently validates its signature.
  const oidcFromPlatform = req.headers?.['x-vercel-oidc-token'];
  const token=process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    || (typeof oidcFromPlatform==='string' ? oidcFromPlatform : undefined);
  if(process.env.JARVIS_FREE_COMPUTE_ENABLED!=='1'&&!process.env.NVIDIA_API_KEY && !token)return res.status(503).json({
    schema:'ask-jarvis/investigation-v1',status:'HOLD',reason:'NO_MODEL_CREDENTIAL',
    message:'VIS model credentials are not configured. No model was called.'
  });
  const obj=req.body && typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
  if(typeof obj.question!=='string')return res.status(400).json({error:'QUESTION_REQUIRED'});
  if(new TextEncoder().encode(JSON.stringify(obj)).byteLength>REQUEST_LIMIT)return res.status(413).json({error:'QUESTION_TOO_LARGE'});
  try{
    const route=obj.route??'auto';
    if(!ROUTES.includes(route))return res.status(422).json({error:'ROUTE_NOT_ALLOWED'});
    const freeMode=process.env.JARVIS_FREE_COMPUTE_ENABLED==='1';
    // Exactly one allowlisted model call, never paid-model escalation or cross-provider retry.
    // Existing NVIDIA/Gateway trial behavior remains available when the router flag is off.
    const choice=freeMode?selectRoute(process.env,route):null;
    if(freeMode&&!choice)return res.status(503).json({
      schema:'ask-jarvis/investigation-v1',status:'HOLD',reason:'FREE_PROVIDER_NOT_CONFIGURED',
      message:'No allowed provider is configured for this route. The original question card still works.'
    });
    const provider=freeMode?choice.provider:(process.env.NVIDIA_API_KEY
      ? makeNvidiaTrialProvider({token:process.env.NVIDIA_API_KEY})
      : makeGatewayProvider({token}));
    const result=await investigate({question:obj.question,kind:obj.kind??'auto',assemble,provider});
    if(result.status==='MODEL_PROPOSAL'&&choice) {
      result.routing={provider:choice.id,model:choice.model,mode:choice.mode,route:choice.route,
        modelCalls:1,automaticPaidFallback:false};
      delete result.receiptHash;
      result.receiptHash=await sha256(JSON.stringify(result));
    }
    return res.status(200).json(result);
  }catch(error) {
    // Never expose service credentials, model responses, stack traces or upstream details.
    return res.status(422).json({error:inputError(error)});
  }
}
