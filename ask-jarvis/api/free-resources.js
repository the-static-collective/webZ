// Operator-only preview inspection of available zero-upgrade route slots.
// Never returns API keys, tokens, usage, or credentials.
import {resourceStatus} from '../src/free-compute.mjs';
export default function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  if(process.env.VERCEL_ENV!=='preview')return res.status(404).json({error:'NOT_AVAILABLE_ON_PUBLIC_HOST'});
  return res.status(200).json({...resourceStatus(process.env),
    routerEnabled:process.env.JARVIS_AI_ENABLED==='1'&&process.env.JARVIS_FREE_COMPUTE_ENABLED==='1'});
}
