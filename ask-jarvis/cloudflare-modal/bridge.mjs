// CF-MODAL-019: portable server-to-server authentication and shared quota.
// Import only in Cloudflare Workers or a Node WebCrypto test, never client JS.
const te=new TextEncoder();
const hex=buffer=>Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,'0')).join('');
export async function hmacHex(secret,data){
 if(typeof secret!=='string'||secret.length<32)throw Error('BRIDGE_SECRET_MISSING');
 const key=await crypto.subtle.importKey('raw',te.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,te.encode(data)));
}
export function safeModalUrl(input){
 try{
  const u=new URL(input);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash
   &&u.port===''&&u.hostname.endsWith('.modal.run')&&u.hostname.split('.').length===3
   &&u.pathname==='/'?u.toString():null;
 }catch{return null}
}
const publicData=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|\b(?:ssn|password|api[_ -]?key|access[_ -]?token|secret)\s*[:=]\s*\S+)/i;
export function publicQuestion(input){
 return typeof input==='string'&&input.trim()===input&&input.length>=8&&input.length<=360
   &&!/[\u0000-\u001f\u007f]/.test(input)&&!publicData.test(input);
}
export async function quotaForWorker(req,env,kind,fetcher=fetch,now=Date.now()){
 if(!['source','ai'].includes(kind))return {ok:false,reason:'INVALID_LANE'};
 if(typeof env.JARVIS_RATE_HASH_SECRET!=='string'||env.JARVIS_RATE_HASH_SECRET.length<32)
  return {ok:false,reason:'QUOTA_SECRET_MISSING'};
 const url=env.JARVIS_SUPABASE_QUOTA_URL;
 if(url!=='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-quota')
  return {ok:false,reason:'QUOTA_ENDPOINT_MISSING'};
 // This header is inserted by Cloudflare on incoming requests. We refuse
 // Forwarded/X-Real-IP/client-supplied user IDs and any absent edge identity.
 const ip=req.headers.get('CF-Connecting-IP');
 if(typeof ip!=='string'||ip.length>45||!(/^[0-9a-f.:]{3,45}$/i.test(ip))||ip.includes('..'))
  return {ok:false,reason:'TRUSTED_CLIENT_IP_MISSING'};
 const hash=(await hmacHex(env.JARVIS_RATE_HASH_SECRET,ip)).slice(0,32);
 const payload=JSON.stringify({kind,hash,weight:1,stamp:now()});
 const signature=await hmacHex(env.JARVIS_RATE_HASH_SECRET,payload);
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),2400);
 try{
  const res=await fetcher(url,{method:'POST',redirect:'error',signal:control.signal,
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify({payload,signature})});
  if(Number(res.headers.get('content-length'))>1024)throw Error('QUOTA_OUTPUT_TOO_LARGE');
  const data=await res.json();
  if(res.status===429&&data?.reason==='RATE_LIMITED')
   return {ok:false,reason:'RATE_LIMITED',retryAfter:data.window===1||data.window===3?60:3600};
  if(!res.ok||data?.ok!==true)throw Error('QUOTA_UNAVAILABLE');
  return {ok:true};
 }catch{return {ok:false,reason:'QUOTA_UNAVAILABLE'};}
 finally{clearTimeout(timer);control.abort();}
}
export async function signedModalCall(url,secret,input,proxyKey,proxySecret,fetcher=fetch){
 const endpoint=safeModalUrl(url);
 if(!endpoint||typeof secret!=='string'||secret.length<32
   ||typeof proxyKey!=='string'||!/^wk-[A-Za-z0-9_-]{8,}$/.test(proxyKey)
   ||typeof proxySecret!=='string'||!/^ws-[A-Za-z0-9_-]{8,}$/.test(proxySecret))
  throw Error('MODAL_NOT_CONFIGURED');
 const body=JSON.stringify(input);
 if(te.encode(body).length>4500)throw Error('MODAL_PAYLOAD_TOO_LARGE');
 const stamp=String(Date.now());
 const signature=await hmacHex(secret,stamp+'.'+body);
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),14000);
 try{
  const res=await fetcher(endpoint,{method:'POST',redirect:'error',signal:control.signal,
   headers:{'Content-Type':'application/json','Accept':'application/json','X-Jarvis-Timestamp':stamp,
    'X-Jarvis-Signature':signature,'Modal-Key':proxyKey,'Modal-Secret':proxySecret},body});
  if(!res.ok||Number(res.headers.get('content-length'))>18000)throw Error('MODAL_FAILURE');
  const raw=await res.text();if(raw.length>18000)throw Error('MODAL_OUTPUT_TOO_LARGE');
  const value=JSON.parse(raw);
  if(value?.schema!=='jarvis/modal-field-kit-v1'||value?.status!=='DRAFT_ONLY'
    ||!Array.isArray(value?.steps)||value.steps.length>6||typeof value?.printableHtml!=='string'
    ||value.printableHtml.length>12000||!value.printableHtml.startsWith('<!DOCTYPE html>'))
   throw Error('MODAL_OUTPUT_INVALID');
  return value;
 }finally{clearTimeout(timer);control.abort()}
}
