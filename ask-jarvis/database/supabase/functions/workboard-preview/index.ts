// WORKBOARD-025 · Public read-only preview with stable query-routed modules.
import {ASSETS} from './site.ts';
Deno.serve(req=>{
 if(req.method!=='GET'&&req.method!=='HEAD')return new Response('READ_ONLY',{status:405,headers:{allow:'GET, HEAD'}});
 const url=new URL(req.url),name=url.searchParams.get('asset'),path=name?'/'+name:'/board/';
 if(name&&(!/^[a-z][a-z0-9/.-]{2,100}\.mjs$/.test(name)||name.includes('..')))
  return new Response('Invalid asset',{status:400});
 const content=ASSETS[path];if(typeof content!=='string')return new Response('Not found',{status:404});
 const html=path==='/board/';
 const headers={'content-type':html?'text/html; charset=utf-8':'text/javascript; charset=utf-8',
  'cache-control':html?'no-store':'public,max-age=60','x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer','permissions-policy':'camera=(), microphone=(), geolocation=()',
  'content-security-policy':"default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'none'"};
 return new Response(req.method==='HEAD'?null:content,{status:200,headers});
});