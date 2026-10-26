// WORKBOARD-025 · Read-only preview of the moderated Workboard.
import {ASSETS} from './site.ts';
const ROOT='/functions/v1/workboard-preview';
Deno.serve(req=>{
 const url=new URL(req.url);
 if(req.method!=='GET'&&req.method!=='HEAD')return new Response('READ_ONLY',{status:405,headers:{allow:'GET, HEAD'}});
 let path=url.pathname.startsWith(ROOT)?url.pathname.slice(ROOT.length):'';
 if(path===''||path==='/')path='/board/';
 const content=ASSETS[path];
 if(typeof content!=='string')return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
 const html=path==='/board/';
 const headers={
 'content-type':html?'text/html; charset=utf-8':'text/javascript; charset=utf-8',
 'cache-control':html?'no-store':'public,max-age=60',
 'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
 'permissions-policy':'camera=(), microphone=(), geolocation=()',
 'content-security-policy':"default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self' https://kbhqacsdvjsstzyplqij.supabase.co; img-src 'self' data:; form-action 'none'"
 };
 return new Response(req.method==='HEAD'?null:content,{status:200,headers});
});