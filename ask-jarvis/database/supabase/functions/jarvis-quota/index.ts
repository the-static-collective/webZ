// JAR;VIS quota bridge: the only public operation is reserving a bounded budget.
// RPC access is service-role only; DB validates the caller's HMAC from private settings.
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async (req:Request)=>{
 if(req.method!=='POST')return reply({ok:false,reason:'METHOD_NOT_ALLOWED'},405);
 if(Number(req.headers.get('content-length')||0)>700)return reply({ok:false,reason:'BODY_TOO_LARGE'},413);
 let obj:unknown;
 try{const data=await req.text();if(data.length>700)return reply({ok:false,reason:'BODY_TOO_LARGE'},413);
   obj=JSON.parse(data)}catch{return reply({ok:false,reason:'INVALID_JSON'},400)}
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return reply({ok:false,reason:'INVALID_SHAPE'},400);
 const {payload,signature}=obj as Record<string,unknown>;
 if(typeof payload!=='string'||payload.length>350||typeof signature!=='string'||!/^[a-f0-9]{64}$/.test(signature))
  return reply({ok:false,reason:'INVALID_SHAPE'},400);
 const url=Deno.env.get('SUPABASE_URL'),token=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!token)return reply({ok:false,reason:'SERVICE_UNAVAILABLE'},503);
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),1750);
 try{
  const res=await fetch(url+'/rest/v1/rpc/jarvis_quota_reserve',{
   method:'POST',redirect:'error',signal:ctl.signal,
   headers:{'content-type':'application/json','accept':'application/json',
    'apikey':token,'authorization':'Bearer '+token},
   body:JSON.stringify({p_payload:payload,p_signature:signature})
  });
  if(!res.ok||Number(res.headers.get('content-length'))>2500)
   return reply({ok:false,reason:'STORE_UNAVAILABLE'},503);
  const data=await res.json();
  if(!data||typeof data.ok!=='boolean')return reply({ok:false,reason:'STORE_UNAVAILABLE'},503);
  if(data.ok===false&&data.reason==='RATE_LIMITED')
    return reply({ok:false,reason:'RATE_LIMITED',window:Number(data.window)||0},429);
  if(!data.ok) return reply({ok:false,reason:'BAD_SIGNATURE'},403);
  return reply({ok:true,window:0});
 }catch{return reply({ok:false,reason:'STORE_UNAVAILABLE'},503)}
 finally{clearTimeout(timer);ctl.abort();}
});