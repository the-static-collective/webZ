// SOCIAL PORCH 001 · independent, read-only, no third-party posting.
// All copy is draft, no co-op affiliation or page administration is implied.
import {SITE} from './site.ts';
import {CALENDAR} from './calendar.ts';
const HEADERS={'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=180','x-content-type-options':'nosniff','referrer-policy':'no-referrer','permissions-policy':'camera=(), microphone=(), geolocation=()','content-security-policy':"default-src 'none'; base-uri 'none'; object-src 'none'; connect-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; frame-ancestors 'none'"};
Deno.serve(req=>{
 if(req.method!=='GET'&&req.method!=='HEAD')return new Response(JSON.stringify({error:'READ_ONLY'}),{status:405,headers:{'content-type':'application/json','cache-control':'no-store','allow':'GET, HEAD'}});
 const u=new URL(req.url);
 if(u.searchParams.get('format')==='calendar')return new Response(req.method==='HEAD'?null:JSON.stringify({...CALENDAR,publication:'INDEPENDENT_DRAFT_NOT_ADOPTED',publishedPosts:0,scheduledPosts:0}),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public,max-age=180','x-content-type-options':'nosniff','access-control-allow-origin':'*'}});
 return new Response(req.method==='HEAD'?null:SITE,{headers:HEADERS});
});
