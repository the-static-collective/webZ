/** Vercel Cron GET, once daily, 15:00 UTC. No public manual sending, no newsletter. */
import { createHash, timingSafeEqual } from 'node:crypto';
import { collectSignals, composeLetter, dailyIdempotency } from '../../post-office/useful-letter.mjs';

function authorized(value, expected) {
  if (typeof value!=='string'||!value.startsWith('Bearer ') || typeof expected!=='string'|| expected.length < 32) return false;
  const a=createHash('sha256').update(value.slice(7)).digest();
  const b=createHash('sha256').update(expected).digest();
  return timingSafeEqual(a,b);
}
function respond(res, code, info) {
  res.statusCode=code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(info));
}
const validEmail=e=>typeof e==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e)&&e.length<=254;

export function makeUsefulLetterHandler({env=process.env,request=fetch,now=()=>new Date()}={}) {
  return async (req,res)=>{
    if(req.method!=='GET') {res.setHeader('Allow','GET');return respond(res,405,{status:'HOLD',reason:'GET only'});}
    if(!authorized(req.headers?.authorization,env.CRON_SECRET)) return respond(res,401,{status:'HOLD',reason:'not authorized'});
    if(env.USEFUL_LETTER_ENABLED!=='1') return respond(res,200,{status:'HOLD',reason:'owner letters disabled'});
    if(!env.RESEND_API_KEY||!validEmail(env.POST_OFFICE_TEST_TO)) return respond(res,503,{status:'HOLD',reason:'private sender not configured'});
    let findings;
    try {findings=await collectSignals({fetchImpl:request,now:now()});}
    catch {return respond(res,503,{status:'HOLD',reason:'signal check failed'});}
    if(findings.signals.length===0) return respond(res,200,{status:'QUIET',day:findings.day,checkedSources:findings.evidenceReads});
    const letter=composeLetter(findings);
    const message={...letter,to:[env.POST_OFFICE_TEST_TO]};
    try {
      const provider=await request('https://api.resend.com/emails',{
        method:'POST',
        headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':dailyIdempotency(findings.day)},
        body:JSON.stringify(message),signal:AbortSignal.timeout(12000),
      });
      if(!provider.ok) return respond(res,502,{status:'HOLD',reason:'provider rejected',providerStatus:provider.status});
      const receipt=await provider.json();
      if(typeof receipt?.id!=='string'||!receipt.id) return respond(res,502,{status:'HOLD',reason:'receipt absent'});
      return respond(res,202,{status:'PROVIDER_ACCEPTED',day:findings.day,signalCount:findings.signals.length,providerId:receipt.id,delivered:false});
    } catch {return respond(res,502,{status:'HOLD',reason:'provider response unconfirmed'});}
  };
}
export default makeUsefulLetterHandler();
