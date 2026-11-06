/**
 * ONE THING 007 — deliberate opt-in for TWO action receipts.
 * No automatic capture, cookies, storage, input text, URL, identity, SDK,
 * session recording, or third-party browser request. Uses same-origin relay.
 */
const ENDPOINT='../api/one-thing/observe';
export function createObservationClient({fetchImpl=globalThis.fetch,uuid=()=>globalThis.crypto.randomUUID()}={}){
 let enabled=false,journey=null,starting=null,returnAttempted=false;
 const controllers=new Set();
 async function request(method,body){
  const controller=new AbortController();
  controllers.add(controller);
  try{
   const response=await fetchImpl(ENDPOINT,{
    method,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',
    ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),
    signal:controller.signal
   });
   if(!response.ok)return false;
   const result=await response.json();
   return method==='GET'?result?.enabled===true:result?.state==='PROVIDER_ACCEPTED';
  }catch{return false}
  finally{controllers.delete(controller)}
 }
 async function enable(){
  if(enabled)return true;
  // A human must explicitly request readiness. Never check on page load.
  enabled=(await request('GET'))===true;
  return enabled;
 }
 function disable(){
  enabled=false;journey=null;starting=null;returnAttempted=false;
  for(const controller of controllers)controller.abort();
  controllers.clear();
 }
 function begin(){
  if(!enabled)return Promise.resolve(false);
  journey=uuid();
  returnAttempted=false;
  const thisJourney=journey;
  starting=request('POST',{event:'quest_prepared',journey_id:thisJourney});
  return starting;
 }
 async function report(){
  if(!enabled||!journey||!starting||returnAttempted)return false;
  returnAttempted=true;
  const thisJourney=journey;
  const started=await starting;
  if(!started||!enabled||journey!==thisJourney)return false;
  return request('POST',{event:'return_prepared',journey_id:thisJourney});
 }
 return Object.freeze({enable,disable,begin,report,isEnabled:()=>enabled});
}
