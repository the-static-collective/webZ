import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 SCOPE,GOOGLE_AUTH,makeAuthorization,secret,challenge,compareState,tokenAccept,
 playlistsResponse,itemsResponse,fetchPlaylistPage,fetchItemsPage,requestToken
} from '../scripts/music-field-003-core.mjs';
import {createBridge} from '../scripts/music-field-003-server.mjs';
import {importText,merge,empty,scope,freshView} from '../worlds/music-field/model.mjs';

const clientId='music-field-test-123456.apps.googleusercontent.com';
const calls=[];
const upstream=async(url,init={})=>{
 const uri=new URL(url);calls.push({url:uri.toString(),method:init.method||'GET',
  authorization:init.headers?.Authorization||null,body:init.body||''});
 if(uri.hostname==='oauth2.googleapis.com'&&uri.pathname==='/token'){
  const params=new URLSearchParams(init.body);
  if(params.get('code')==='INVALID')return Response.json({error:'invalid_grant'},{status:400});
  return Response.json({access_token:'fake-local-test-access-token',token_type:'Bearer',
   expires_in:3600,scope:SCOPE});
 }
 if(uri.hostname==='oauth2.googleapis.com'&&uri.pathname==='/revoke')return new Response('',{status:200});
 if(uri.hostname==='www.googleapis.com'&&uri.pathname.endsWith('/playlists')){
  return Response.json({items:[{id:'PL0000000001',snippet:{title:'My Radio List',description:'PRIVATE_UNUSED'},
   contentDetails:{itemCount:2}}]});
 }
 if(uri.hostname==='www.googleapis.com'&&uri.pathname.endsWith('/playlistItems')){
  return Response.json({items:[
   {snippet:{title:'My Acoustic Song',videoOwnerChannelTitle:'Creator A',description:'PRIVATE_DO_NOT_SAVE',
     resourceId:{videoId:'abcDEF12345'}},contentDetails:{videoId:'abcDEF12345',videoPublishedAt:'2026-10-09T00:00:00Z'}},
   {snippet:{title:'Lost Track',resourceId:{kind:'youtube#video'}},contentDetails:{}}
  ]});
 }
 throw Error('UNEXPECTED_MOCK_URL:'+url);
};
function session(base){return {
 async first(){
  const res=await fetch(base+'worlds/music-field/',{redirect:'manual'});
  assert.equal(res.status,200);
  return res.headers.get('set-cookie').split(';')[0];
 },
 request:async function(cookie,path,method='GET',opts={})=>{
  const res=await fetch(base.replace(/\/worlds\/music-field\/$/,'')+path,{
   method,redirect:'manual',headers:{
    Cookie:cookie,'Origin':opts.origin??base.replace(/\/worlds\/music-field\/$/,''),
    ...(method!=='GET'?{'x-music-field-action':opts.action??'003'}:{})
   }});
  let value;try{value=await res.json()}catch{value=null}
  return {status:res.status,headers:res.headers,body:value};
 }
}}
test('OAuth PKCE request has exact readonly scope, random state and pinned Google origin',()=>{
 const state=secret(),verifier=secret();
 const url=new URL(makeAuthorization({clientId,redirectUri:'http://127.0.0.1:3000/oauth/youtube/callback',state,verifier}));
 assert.equal(url.origin,'https://accounts.google.com');
 assert.equal(url.pathname,'/o/oauth2/v2/auth');
 assert.equal(url.searchParams.get('scope'),SCOPE);
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 assert.equal(url.searchParams.get('code_challenge'),challenge(verifier));
 assert.notEqual(state,verifier);
 assert.equal(url.searchParams.get('response_type'),'code');
 assert.equal(url.searchParams.get('access_type'),'online');
});
test('state comparison denies missing/modified values',()=>{
 const s=secret();assert.equal(compareState(s,s),true);
 for(const bad of ['',s.slice(0,-1),s+'!',undefined,null])assert.equal(compareState(s,bad),false);
});
test('Google client IDs and callback must have exact localhost shape',()=>{
 const payload={clientId,redirectUri:'http://127.0.0.1:2234/oauth/youtube/callback',state:secret(),verifier:secret()};
 for(const invalid of ['http://evil.com','x.apps.googleusercontent.com@evil.com','x']){
  assert.throws(()=>makeAuthorization({...payload,clientId:invalid}));
 }
 assert.throws(()=>makeAuthorization({...payload,redirectUri:'http://0.0.0.0:2234/oauth/youtube/callback'}));
});
test('tokens with missing readonly scope or wrong type are refused',()=>{
 const p={access_token:'token-1234567890123',token_type:'Bearer',expires_in:3600,scope:SCOPE};
 assert.ok(tokenAccept(p).expiry>Date.now());
 for(const mutation of [
  x=>x.scope='https://www.googleapis.com/auth/youtube.upload',
  x=>x.scope='',x=>x.access_token='short',
  x=>x.token_type='Basic',x=>x.expires_in=-1
 ]){const copy={...p};mutation(copy);assert.throws(()=>tokenAccept(copy))}
});
test('import parser avoids descriptions and private fields from YouTube API',()=>{
 const x=itemsResponse({items:[{snippet:{title:'A song',description:'SECRET_DESCRIPTION',videoOwnerChannelTitle:'Owner'},
  contentDetails:{videoId:'abcDEF12345'}}]},'A playlist');
 assert.equal(x.list.length,1);
 assert.ok(!JSON.stringify(x).includes('SECRET_DESCRIPTION'));
 assert.equal(x.list[0].album,'A playlist');
 const parsed=importText(JSON.stringify(x.list),'YOUTUBE','json');
 assert.equal(parsed.records[0].source_id,'abcDEF12345');
});
test('deleted/unavailable videos are excluded from user preview',()=>{
 const x=itemsResponse({items:[{snippet:{title:'Unavailable'},contentDetails:{}}]},'List');
 assert.equal(x.list.length,0);
});
test('malformed pagination tokens and oversized playlist pages refuse',()=>{
 assert.throws(()=>playlistsResponse({items:Array(51).fill({id:'PL123',snippet:{title:'X'}})}));
 assert.throws(()=>itemsResponse({items:[],nextPageToken:'z'.repeat(301)},'List'));
});
test('actual API requests go to documented HTTPS paths with Bearer and one-page cap',async()=>{
 calls.length=0;
 const p=await fetchPlaylistPage(upstream,'fake-local-test-access-token',null);
 assert.equal(p.list[0].title,'My Radio List');
 const q=await fetchItemsPage(upstream,'fake-local-test-access-token','PL0000000001','My Radio List',null);
 assert.equal(q.list.length,1);
 assert.equal(calls.length,2);
 assert.ok(calls[0].url.startsWith('https://www.googleapis.com/youtube/v3/playlists?'));
 assert.ok(calls[1].url.includes('/youtube/v3/playlistItems?'));
 assert.equal(calls[0].authorization,'Bearer fake-local-test-access-token');
});
test('OAuth code exchange uses verifier and never tries browser token exposure',async()=>{
 calls.length=0;
 const p=await requestToken(upstream,{code:'VALID-CODE',verifier:secret(),clientId,
  redirectUri:'http://127.0.0.1:9999/oauth/youtube/callback'});
 assert.ok(p.accessToken);
 assert.equal(calls.length,1);
 const x=new URLSearchParams(calls[0].body);
 assert.ok(x.get('code_verifier'));assert.equal(x.get('grant_type'),'authorization_code');
 assert.equal(x.get('redirect_uri'),'http://127.0.0.1:9999/oauth/youtube/callback');
});
test('standalone bridge without OAuth client permits static files but denies account sync',async()=>{
 const server=createBridge({fetchImpl:upstream});
 const base=await server.listen(),s=session(base);
 try{
  const cookie=await s.first(),status=await s.request(cookie,'/api/youtube/status');
  assert.equal(status.body.configured,false);assert.equal(status.body.connected,false);
  assert.equal((await s.request(cookie,'/api/youtube/connect','POST')).status,409);
  assert.equal((await s.request(cookie,'/api/youtube/playlists')).status,401);
 }finally{await server.stop()}
});
test('local HTTP bridge enforces exact Host, session cookie, same-origin actions and CSRF header',async()=>{
 const b=createBridge({clientId,fetchImpl:upstream}),base=await b.listen(),s=session(base);
 try{
  const cookie=await s.first();
  assert.equal((await s.request('wrong=token','/api/youtube/status')).status,403);
  assert.equal((await s.request(cookie,'/api/youtube/connect','POST',{origin:'https://evil.com'})).status,403);
  assert.equal((await s.request(cookie,'/api/youtube/connect','POST',{action:'WRONG'})).status,403);
  const wrongHost=await fetch(base.replace('/worlds/music-field/','')+'/api/youtube/status',
   {headers:{Cookie:cookie,Host:'evil.com:12345'}});
  assert.equal(wrongHost.status,403);
 }finally{await b.stop()}
});
test('state tampering cannot issue a token, legitimate consent can issue one, and callback is one-use',async()=>{
 const bridge=createBridge({clientId,fetchImpl:upstream}),base=await bridge.listen(),s=session(base);
 try{
  const cookie=await s.first();
  const start=await s.request(cookie,'/api/youtube/connect','POST');
  assert.equal(start.status,200);
  const link=new URL(start.body.authorization_url),state=link.searchParams.get('state');
  assert.equal((await s.request(cookie,'/api/youtube/connect','POST')).status,409);
  const bad=await s.request(cookie,'/oauth/youtube/callback?code=GOOD-CODE&state=bad');
  assert.equal(bad.status,400);
  const callback=await s.request(cookie,'/oauth/youtube/callback?code=GOOD-CODE&state='+encodeURIComponent(state));
  assert.equal(callback.status,303);
  assert.equal(bridge.inspect().hasToken,true);
  assert.equal((await s.request(cookie,'/oauth/youtube/callback?code=GOOD-CODE&state='+encodeURIComponent(state))).status,400);
  const status=await s.request(cookie,'/api/youtube/status');
  assert.equal(status.body.connected,true);
  assert.ok(!JSON.stringify(status.body).includes('fake-local-test-access-token'));
 }finally{await bridge.stop()}
});
test('explicit list, choice, capped preview and separate import data without automatic storage',async()=>{
 const bridge=createBridge({clientId,fetchImpl:upstream}),base=await bridge.listen(),s=session(base);
 try{
  const cookie=await s.first();
  const begin=await s.request(cookie,'/api/youtube/connect','POST');
  const st=new URL(begin.body.authorization_url).searchParams.get('state');
  assert.equal((await s.request(cookie,'/oauth/youtube/callback?code=GOOD-CODE&state='+st)).status,303);
  assert.equal((await s.request(cookie,'/api/youtube/playlist-items?id=PL0000000001')).status,403);
  const choices=await s.request(cookie,'/api/youtube/playlists');
  assert.equal(choices.body.playlists[0].title,'My Radio List');
  assert.equal((await s.request(cookie,'/api/youtube/playlist-items?id=PLNOTALLOWED')).status,403);
  const preview=await s.request(cookie,'/api/youtube/playlist-items?id=PL0000000001');
  assert.equal(preview.status,200);
  assert.equal(preview.body.rows.length,1);
  assert.equal(preview.body.autoSaved,false);
  assert.ok(!JSON.stringify(preview.body).includes('fake-local-test-access-token'));
  const normalized=importText(JSON.stringify(preview.body.rows),'YOUTUBE','json');
  const library=merge(empty(),normalized);
  assert.equal(scope(library,freshView()).total,1);
 }finally{await bridge.stop()}
});
test('disconnect clears local token immediately and attempts Google revocation',async()=>{
 calls.length=0;
 const bridge=createBridge({clientId,fetchImpl:upstream}),base=await bridge.listen(),s=session(base);
 try{
  const cookie=await s.first(),begin=await s.request(cookie,'/api/youtube/connect','POST');
  const state=new URL(begin.body.authorization_url).searchParams.get('state');
  await s.request(cookie,'/oauth/youtube/callback?state='+state+'&code=GOOD-CODE');
  const done=await s.request(cookie,'/api/youtube/disconnect','POST');
  assert.equal(done.body.locallyCleared,true);assert.equal(done.body.remotelyRevoked,true);
  assert.equal(bridge.inspect().hasToken,false);
  assert.equal((await s.request(cookie,'/api/youtube/playlists')).status,401);
  assert.ok(calls.some(x=>x.url==='https://oauth2.googleapis.com/revoke'));
 }finally{await bridge.stop()}
});
test('denied consent never produces a token',async()=>{
 const bridge=createBridge({clientId,fetchImpl:upstream}),base=await bridge.listen(),s=session(base);
 try{
  const cookie=await s.first(),begin=await s.request(cookie,'/api/youtube/connect','POST');
  const state=new URL(begin.body.authorization_url).searchParams.get('state');
  const deny=await s.request(cookie,'/oauth/youtube/callback?state='+state+'&error=access_denied');
  assert.equal(deny.status,303);assert.equal(bridge.inspect().hasToken,false);
 }finally{await bridge.stop()}
});
test('token endpoint rejection prevents connected state and hides provider error',async()=>{
 const bridge=createBridge({clientId,fetchImpl:upstream}),base=await bridge.listen(),s=session(base);
 try{
  const cookie=await s.first(),begin=await s.request(cookie,'/api/youtube/connect','POST');
  const state=new URL(begin.body.authorization_url).searchParams.get('state');
  const x=await s.request(cookie,'/oauth/youtube/callback?state='+state+'&code=INVALID');
  assert.equal(x.status,400);assert.equal(bridge.inspect().hasToken,false);
 }finally{await bridge.stop()}
});
test('no Google client id or token literals in first party UI and snapshots',()=>{
 const code=readFileSync(new URL('../worlds/music-field/youtube-bridge.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../worlds/music-field/index.html',import.meta.url),'utf8');
 assert.ok(code.includes('Connect YouTube through Google')===false);
 assert.ok(html.includes('Connect YouTube through Google'));
 assert.ok(!html.includes('client_secret'));
 assert.ok(!code.includes('localStorage'));
 assert.ok(!code.includes('access_token'));
 assert.ok(!code.includes('Authorization: Bearer'));
});
