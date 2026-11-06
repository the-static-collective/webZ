/**
 * ONE THING 007 — explicit-opt-in, event-only PostHog relay.
 *
 * GET is a no-identity readiness probe performed only after the human checks
 * the consent box. POST accepts exactly two event names and one short-lived
 * journey UUID, never notes, text, links, categories, outcomes, or personal data.
 * Disabled by default. Provider acknowledgement is NOT independent proof.
 */
const EVENTS=Object.freeze({
  quest_prepared:'one_thing_quest_prepared',
  return_prepared:'one_thing_return_prepared'
});
const HOSTS=new Set(['https://us.i.posthog.com','https://eu.i.posthog.com']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reply(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, private');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.end(JSON.stringify(payload));
}
function ready(env){
  return env.POSTHOG_OBSERVATION_ENABLED==='1'
    && typeof env.POSTHOG_OBSERVATION_TOKEN==='string'
    && /^phc_[A-Za-z0-9_-]{8,}$/.test(env.POSTHOG_OBSERVATION_TOKEN)
    && HOSTS.has(env.POSTHOG_OBSERVATION_HOST)
    && typeof env.OBSERVATION_ALLOWED_ORIGINS==='string'
    && env.OBSERVATION_ALLOWED_ORIGINS.split(',').some(s=>s.trim().length>0);
}
function permittedOrigin(origin,env){
  if(typeof origin!=='string')return false;
  const allowed=env.OBSERVATION_ALLOWED_ORIGINS.split(',').map(s=>s.trim());
  return allowed.includes(origin) && /^https:\/\/[^/?#]+$/.test(origin);
}
function readBody(body){
  if(typeof body==='string'){
    if(Buffer.byteLength(body,'utf8')>300)return null;
    try{body=JSON.parse(body)}catch{return null}
  }
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const keys=Object.keys(body);
  if(keys.length!==2||!keys.includes('event')||!keys.includes('journey_id'))return null;
  if(typeof body.event!=='string'||!Object.hasOwn(EVENTS,body.event))return null;
  if(typeof body.journey_id!=='string'||!UUID.test(body.journey_id))return null;
  return {event:EVENTS[body.event],journey_id:body.journey_id};
}
export function makeObservationHandler({env=process.env,send=fetch}={}){
  return async function handler(req,res){
    if(req.method==='GET'){
      return reply(res,200,{enabled:ready(env),scope:'future-opt-in-events-only',version:1});
    }
    if(req.method!=='POST'){
      res.setHeader('Allow','GET, POST');
      return reply(res,405,{state:'HOLD',reason:'method-not-allowed'});
    }
    if(!ready(env))return reply(res,503,{state:'HOLD',reason:'observation-disabled'});
    if(!permittedOrigin(req.headers?.origin,env)){
      return reply(res,403,{state:'HOLD',reason:'unapproved-origin'});
    }
    if(!/^application\/json(?:;|$)/i.test(req.headers?.['content-type']||'')){
      return reply(res,415,{state:'HOLD',reason:'json-only'});
    }
    const count=Number(req.headers?.['content-length']||0);
    if(!Number.isFinite(count)||count>300)return reply(res,413,{state:'HOLD',reason:'payload-too-large'});
    const observed=readBody(req.body);
    if(!observed)return reply(res,400,{state:'HOLD',reason:'unexpected-observation-fields'});
    // No raw user text or URL properties. The journey ID is random and tab-local.
    // This is a transport receipt, not proof a human completed any work.
    const payload={
      token:env.POSTHOG_OBSERVATION_TOKEN,
      event:observed.event,
      distinct_id:observed.journey_id,
      properties:{$geoip_disable:true,$process_person_profile:false,source:'one-thing-007',unverified:true}
    };
    try{
      const provider=await send(env.POSTHOG_OBSERVATION_HOST+'/i/v0/e/',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload),
        signal:AbortSignal.timeout(5000)
      });
      if(!provider.ok)return reply(res,502,{state:'HOLD',reason:'provider-rejected'});
      return reply(res,202,{state:'PROVIDER_ACCEPTED',counted:false,real_world_outcome_verified:false});
    }catch{
      return reply(res,502,{state:'HOLD',reason:'provider-unavailable'});
    }
  };
}
export default makeObservationHandler();
