// STILL-HERE-028 · Public read-only preview, no state and no case intake.
// This function serves one static page and two JavaScript modules.
// It never receives text from the visitor, invokes a database or stores cookies.
import {ASSETS} from './site.ts';
Deno.serve((request:Request)=>{
 if(request.method!=='GET' && request.method!=='HEAD')
  return new Response('Read-only preview',{status:405,headers:{allow:'GET, HEAD','cache-control':'no-store'}});
 const url=new URL(request.url);
 const key=url.searchParams.get('asset')||'index.html';
 if(!['index.html','app.mjs','model.mjs'].includes(key))
  return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
 const data=ASSETS[key];
 if(typeof data!=='string')return new Response('Unavailable',{status:503,headers:{'cache-control':'no-store'}});
 const header={
  'content-type':key==='index.html'?'text/html; charset=utf-8':'text/javascript; charset=utf-8',
  'cache-control':'no-store',
  'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; connect-src 'none'; img-src 'none'; font-src 'none'",
  'referrer-policy':'no-referrer',
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY',
  'cross-origin-resource-policy':'same-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=()'
 };
 return new Response(request.method==='HEAD'?null:data,{status:200,headers:header});
});