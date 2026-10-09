// MUSIC FIELD 003 — desktop-only, loopback-bound, in-memory OAuth service.
// This is not a hosted account service. Start with an operator-supplied Google
// Desktop OAuth client ID. NEVER log or persist bearer tokens.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {
 secret,compareState,makeAuthorization,requestToken,fetchPlaylistPage,fetchItemsPage,
 MAX_PLAYLIST_PAGES,MAX_ITEM_PAGES,boundedId,GOOGLE_REVOKE
} from './music-field-003-core.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const permitted=new Set([
 '/worlds/music-field/','/worlds/music-field/index.html','/worlds/music-field/field.mjs',
 '/worlds/music-field/field.css','/worlds/music-field/model.mjs',
 '/worlds/music-field/storage.mjs','/worlds/music-field/youtube-bridge.mjs',
 '/worlds/suno-atlas/model.mjs'
]);
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const guardHeaders={
 'cache-control':'no-store, max-age=0','referrer-policy':'no-referrer',
 'x-content-type-options':'nosniff','x-frame-options':'DENY',
 'cross-origin-resource-policy':'same-origin',
 'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; media-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'"
};
function answer(res,code,body,more={}){
 const data=typeof body==='string'?body:JSON.stringify(body);
 res.writeHead(code,{...guardHeaders,'content-type':typeof body==='string'?'text/plain; charset=utf-8':'application/json; charset=utf-8',...more});
 res.end(data);
}
const no=(res,code,reason)=>answer(res,code,{error:reason});
const cookie=(sid)=>'mf3_session='+sid+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800';
const validClient=x=>typeof x==='string'&&/^[A-Za-z0-9._-]{10,200}\.apps\.googleusercontent\.com$/.test(x);
const safePath=x=>x==='/'?'/worlds/music-field/':x;
function isSameOrigin(req,expected,mutation=false){
 const origin=req.headers.origin;
 const fetchSite=req.headers['sec-fetch-site'];
 if(fetchSite&&fetchSite!=='same-origin'&&fetchSite!=='none')return false;
 if(origin&&origin!==expected)return false;
 if(mutation&&origin!==expected)return false;
 if(mutation&&req.headers['x-music-field-action']!=='003')return false;
 return true;
}
export function createBridge({
 clientId,clientSecret='',fetchImpl=globalThis.fetch,
 authEndpoint,tokenEndpoint,apiRoot,revocationEndpoint=GOOGLE_REVOKE
}={}){
 const configured=validClient(clientId);
 let sid=secret(),pending=null,token=null,selected=new Map(),closing=false,server;
 async function upstream(fn,res){
  try{return await fn()}
  catch(e){
   if(e.message==='UPSTREAM_REQUEST_FAILED'){no(res,502,'PROVIDER_UNAVAILABLE_OR_REVOKED');return null}
   no(res,502,'UPSTREAM_HOLD');return null;
  }
 }
 function reset(){token=null;pending=null;selected.clear()}
 const listener=async(req,res)=>{
  const port=server.address()?.port,origin='http://127.0.0.1:'+port;
  const host=req.headers.host;
  // DNS rebinding and localhost name/IPv6 aliases are not accepted.
  if(host!=='127.0.0.1:'+port){no(res,403,'LOOPBACK_HOST_REQUIRED');return}
  const u=new URL(req.url,origin),path=u.pathname;
  const route=safePath(path);
  const isAsset=req.method==='GET'&&permitted.has(route);
  const callback=req.method==='GET'&&path==='/oauth/youtube/callback';
  if(isAsset){
   try{
    const relative=route==='/worlds/music-field/'?'worlds/music-field/index.html':route.slice(1);
    const data=await readFile(resolve(root,relative));
    const extra=route.endsWith('.html')||route.endsWith('/')?{'set-cookie':cookie(sid)}:{};
    res.writeHead(200,{...guardHeaders,'content-type':mime[extname(relative)]||'text/html; charset=utf-8',...extra});res.end(data);
   }catch{no(res,404,'ASSET_NOT_FOUND')}
   return;
  }
  if(callback){
   if(!pending||Date.now()-pending.time>300000||!compareState(u.searchParams.get('state'),pending.state)){
    no(res,400,'INVALID_OR_EXPIRED_OAUTH_STATE');return;
   }
   const current=pending;pending=null;
   if(u.searchParams.has('error')){
    reset();res.writeHead(303,{...guardHeaders,location:'/worlds/music-field/#youtube=denied'});res.end();return;
   }
   const code=u.searchParams.get('code');
   if(typeof code!=='string'||code.length<5||code.length>3000){no(res,400,'CODE_INVALID');return}
   try{
    const response=await requestToken(fetchImpl,{code,verifier:current.verifier,
      clientId,clientSecret,redirectUri:origin+'/oauth/youtube/callback',tokenEndpoint});
    token=response;selected.clear();
    res.writeHead(303,{...guardHeaders,location:'/worlds/music-field/#youtube=connected'});res.end();
   }catch{reset();no(res,400,'OAUTH_EXCHANGE_HELD')}
   return;
  }
  if(!path.startsWith('/api/')){no(res,404,'NOT_FOUND');return}
  if(!isSameOrigin(req,origin,req.method!=='GET')){
   no(res,403,'ORIGIN_OR_ACTION_DENIED');return;
  }
  if(!req.headers.cookie?.split(/;\s*/).includes('mf3_session='+sid)){
   no(res,403,'SESSION_REQUIRED');return;
  }
  if(req.method==='GET'&&path==='/api/youtube/status'){
   answer(res,200,{schema:'webz/music-field-youtube-status/v0',
    configured,connected:!!token&&token.expiry-Date.now()>60000,
    pending:!!pending,ephemeral:true,scope:'youtube.readonly',
    importMode:'EXPLICIT_SELECTED_PLAYLIST',providers:{suno:'FILE_IMPORT',bandcamp:'FILE_IMPORT',youtube:configured?'OAUTH_READY':'CLIENT_NOT_CONFIGURED'}});
   return;
  }
  if(req.method==='POST'&&path==='/api/youtube/connect'){
   if(!configured){no(res,409,'GOOGLE_DESKTOP_CLIENT_ID_REQUIRED');return}
   // Re-connect requires a separate new opt-in; do not silently replace an active session.
   reset();const state=secret(),verifier=secret();
   pending={state,verifier,time:Date.now()};
   const authorize=makeAuthorization({clientId,state,verifier,redirectUri:origin+'/oauth/youtube/callback'});
   // Production auth endpoint always Google's pinned HTTPS host.
   answer(res,200,{authorization_url:authEndpoint?new URL(authorize).href.replace('https://accounts.google.com/o/oauth2/v2/auth',authEndpoint):authorize});
   return;
  }
  if(req.method==='POST'&&path==='/api/youtube/disconnect'){
   const existing=token?.accessToken;reset();
   let remotelyRevoked=false;
   if(existing){
    try{
     const result=await fetchImpl(revocationEndpoint,{method:'POST',redirect:'error',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({token:existing}).toString(),signal:AbortSignal.timeout(4000)});
     remotelyRevoked=!!result?.ok;
    }catch{}
   }
   answer(res,200,{disconnected:true,locallyCleared:true,
    remotelyRevoked,googlePermissionMayPersist:!remotelyRevoked});
   return;
  }
  if(!token||token.expiry-Date.now()<=60000){reset();no(res,401,'YOUTUBE_CONSENT_REQUIRED_OR_EXPIRED');return}
  if(req.method==='GET'&&path==='/api/youtube/playlists'){
   const result=await upstream(async()=>{
    selected.clear();const all=[];let next=null,truncated=false;
    for(let i=0;i<MAX_PLAYLIST_PAGES;i++){
     const page=await fetchPlaylistPage(fetchImpl,token.accessToken,next,apiRoot);
     all.push(...page.list);
     next=page.next;if(!next)break;
     if(i===MAX_PLAYLIST_PAGES-1)truncated=true;
    }
    for(const p of all)selected.set(p.id,p.title);
    return {schema:'webz/music-field-playlist-selection/v0',playlists:all,truncated,
     signedInWith:'GOOGLE_OAUTH_READONLY',autoImported:false};
   },res);
   if(result)answer(res,200,result);return;
  }
  if(req.method==='GET'&&path==='/api/youtube/playlist-items'){
   const playlistId=u.searchParams.get('id');
   if(!boundedId(playlistId)||!selected.has(playlistId)){no(res,403,'PLAYLIST_NOT_SELECTED_FROM_ACCOUNT');return}
   const result=await upstream(async()=>{
    const name=selected.get(playlistId),items=[];let next=null,truncated=false;
    for(let i=0;i<MAX_ITEM_PAGES;i++){
     const page=await fetchItemsPage(fetchImpl,token.accessToken,playlistId,name,next,apiRoot);
     items.push(...page.list);next=page.next;if(!next)break;
     if(i===MAX_ITEM_PAGES-1)truncated=true;
    }
    // De-duplicate repeated video IDs within the same playlist by first occurrence.
    const seen=new Set(),records=items.filter(x=>{if(seen.has(x.source_id))return false;seen.add(x.source_id);return true});
    return {schema:'webz/music-field-youtube-selected/v0',playlist:{id:playlistId,title:name},
      rows:records,truncated,requestedBy:'EXPLICIT_HUMAN_SELECTION',autoSaved:false};
   },res);
   if(result)answer(res,200,result);return;
  }
  no(res,404,'API_ROUTE_NOT_FOUND');
 };
 server=createServer((req,res)=>{listener(req,res).catch(()=>no(res,500,'LOCAL_BRIDGE_HOLD'))});
 return {
  server,listen:(port=0)=>new Promise((resolve,reject)=>{
   server.once('error',reject);
   server.listen(port,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+'/worlds/music-field/'));
  }),
  stop:()=>new Promise(resolve=>server.close(resolve)),
  inspect:()=>({configured,hasToken:!!token,hasPending:!!pending,selectedCount:selected.size}),
  clear:reset
 };
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const bridge=createBridge({clientId:process.env.MUSIC_FIELD_GOOGLE_CLIENT_ID,
  clientSecret:process.env.MUSIC_FIELD_GOOGLE_CLIENT_SECRET||''});
 const port=Number(process.env.MUSIC_FIELD_PORT||0);
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT_INVALID');
 const url=await bridge.listen(port);
 // URL only; never log OAuth state/code/token, client secrets or user metadata.
 console.log('Music Field 003 local desktop bridge: '+url);
 if(!process.env.MUSIC_FIELD_GOOGLE_CLIENT_ID)console.log('YouTube disabled until MUSIC_FIELD_GOOGLE_CLIENT_ID is supplied.');
}
