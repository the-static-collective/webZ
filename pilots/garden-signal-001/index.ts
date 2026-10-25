import { SITE } from './site.ts';
const LEDGER='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/garden-ledger';
const PAGE_ORIGIN='https://kbhqacsdvjsstzyplqij.supabase.co';
const HEAD={'x-content-type-options':'nosniff','referrer-policy':'no-referrer','cache-control':'no-store'};
const CSP="default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; form-action 'self'";
const KINDS=new Set(['question','offer','need','experiment']);
const PII=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|https?:\/\/|www\./i;
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY=/^[A-Za-z0-9_-]{43}$/;
const j=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{...HEAD,'content-type':'application/json; charset=utf-8'}});
async function body(req:Request){
 if(Number(req.headers.get('content-length')||0)>1500)throw Error('REQUEST_TOO_LARGE');
 const text=await req.text();if(text.length>1500)throw Error('REQUEST_TOO_LARGE');
 try {const obj=JSON.parse(text); if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error();return obj;}
 catch{throw Error('INVALID_JSON');}
}
function clean(v:unknown,max:number){if(typeof v!=='string')throw Error('INVALID_FIELD');const s=v.replace(/[\u0000-\u001f]/g,' ').trim();if(s.length>max||PII.test(s))throw Error('REMOVE_CONTACT_DETAILS_AND_URLS');return s;}
async function relay(input:Record<string,unknown>,req:Request){
 const headers:Record<string,string>={'content-type':'application/json','origin':'https://garden.abundent.org'};
 const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'').trim().slice(0,64);
 if(ip&&/^[0-9a-fA-F.:]{3,64}$/.test(ip))headers['x-real-ip']=ip;
 const res=await fetch(LEDGER,{method:'POST',headers,body:JSON.stringify(input),signal:AbortSignal.timeout(7000),cache:'no-store'});
 const raw=await res.text();if(raw.length>3200)throw Error('UPSTREAM_TOO_LARGE');
 let data;try{data=JSON.parse(raw);}catch{throw Error('INVALID_UPSTREAM');}
 if(!res.ok)return j({error:String(data.error||'LEDGER_REJECTED').slice(0,90)},res.status>=500?503:res.status);
 if(input.action==='submit'){if(!data.submission?.id||!KEY.test(data.withdrawKey))throw Error('INCOMPLETE_RECEIPT');return j({ok:true,submission:{id:data.submission.id,status:'PENDING'},withdrawKey:data.withdrawKey},201);}
 return j({ok:true,removed:true});
}
Deno.serve(async req=>{
 const url=new URL(req.url);
 if(req.method==='GET'||req.method==='HEAD'){
   if(url.searchParams.get('feed')==='1'){
     try{const res=await fetch(LEDGER,{headers:{accept:'application/json'},signal:AbortSignal.timeout(7000),cache:'no-store'});
       if(!res.ok)throw Error('LEDGER_UNAVAILABLE');
       const raw=await res.text();if(raw.length>74000)throw Error('LEDGER_RESPONSE_TOO_LARGE');
       const obj=JSON.parse(raw);if(obj.schema!=='garden/public-overview-v1'||obj.ledger?.state!=='reviewed_only'||!Array.isArray(obj.ledger?.entries))throw Error('INVALID_FEED');
       const entries=obj.ledger.entries.filter((x:any)=>x.status==='PUBLIC_REVIEWED').slice(0,35).map((x:any)=>({kind:String(x.kind||'').slice(0,20),lane:String(x.lane||'').slice(0,20),body:String(x.body||'').slice(0,300),createdAt:String(x.createdAt||'').slice(0,40)}));
       return req.method==='HEAD'?new Response(null,{headers:{...HEAD,'content-type':'application/json'}}):j({schema:'garden-signal/public-feed-v1',ledger:{state:'reviewed_only',entries}});
     }catch{return j({error:'PUBLIC_FEED_UNAVAILABLE'},503);}
   }
   return new Response(req.method==='HEAD'?null:SITE,{status:200,headers:{...HEAD,'content-type':'text/html; charset=utf-8','content-security-policy':CSP,'cache-control':'public,max-age=180'}});
 }
 if(req.method!=='POST')return j({error:'METHOD_NOT_ALLOWED'},405);
 if(req.headers.get('origin')!==PAGE_ORIGIN)return j({error:'PAGE_ORIGIN_REQUIRED'},403);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return j({error:'JSON_REQUIRED'},415);
 try{
   const b=await body(req),action=b.action;
   if(action==='submit'){
     const kind=clean(b.kind,20),lane=clean(b.lane,20),message=clean(b.body,300),next=clean(b.nextStep||'',160);
     if(!KINDS.has(kind)||lane!=='commons'||message.length<12||b.consentToReview!==true)throw Error('INVALID_SUBMISSION');
     return await relay({action:'submit',kind,lane,body:message,nextStep:next,consentToReview:true},req);
   }
   if(action==='withdraw'){
      if(typeof b.id!=='string'||!ID.test(b.id)||typeof b.withdrawKey!=='string'||!KEY.test(b.withdrawKey))throw Error('INVALID_WITHDRAWAL');
      return await relay({action:'withdraw',id:b.id,withdrawKey:b.withdrawKey},req);
   }
   return j({error:'UNKNOWN_ACTION'},400);
 }catch(e){const msg=e instanceof Error?e.message:'SERVER_ERROR';return j({error:msg.startsWith('UPSTREAM')?'LEDGER_UNAVAILABLE':msg},msg.includes('UNAVAILABLE')||msg==='INVALID_UPSTREAM'?503:400);}
});
