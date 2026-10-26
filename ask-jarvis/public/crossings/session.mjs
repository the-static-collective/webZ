// AUTO-CROSSINGS-033 · same-origin, session-scoped, public-only continuation.
// Nothing is sent to a server. In particular this is not the private Firebox.
import {readCrossing} from './model.mjs';

export const SESSION_KEY='abundent.crossings.public.session.v1';
export const MAX_AGE_MS=30*60*1000;
function validNow(at){
  if(!Number.isFinite(at)||at<0)throw Error('INVALID_CLOCK');
  return at;
}
export function putSessionCrossing(storage,packet,at=Date.now()){
  validNow(at);
  const safe=readCrossing(packet);
  // These are the only bytes permitted to cross: validated, nonidentifying
  // public metadata with all authority flags false.
  storage.setItem(SESSION_KEY,JSON.stringify({
    version:1,storedAt:at,expiresAt:at+MAX_AGE_MS,packet:safe
  }));
  return safe;
}
export function readSessionCrossing(storage,at=Date.now()){
  validNow(at);
  const raw=storage.getItem(SESSION_KEY);
  if(!raw)return null;
  try{
    if(raw.length>8192)throw Error('LARGE_SESSION');
    const env=JSON.parse(raw);
    if(!env||typeof env!=='object'||Array.isArray(env)||
       Object.keys(env).sort().join('|')!=='expiresAt|packet|storedAt|version'||
       env.version!==1||
       !Number.isSafeInteger(env.storedAt)||!Number.isSafeInteger(env.expiresAt)||
       env.storedAt>at+60000||env.expiresAt!==env.storedAt+MAX_AGE_MS||
       at>=env.expiresAt)throw Error('EXPIRED_OR_INVALID');
    return readCrossing(env.packet);
  }catch{
    // No corrupted, expired, or authority-upgraded data can persist through navigation.
    try{storage.removeItem(SESSION_KEY);}catch{}
    return null;
  }
}
export function forgetSessionCrossing(storage){
  storage.removeItem(SESSION_KEY);
}
