// MUSIC FIELD 003 — explicit, memory-only, read-only Google/YouTube bridge.
// Loopback desktop flow; external domains hard-coded, never a generic proxy.
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export const SCOPE='https://www.googleapis.com/auth/youtube.readonly';
export const GOOGLE_AUTH='https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN='https://oauth2.googleapis.com/token';
export const GOOGLE_REVOKE='https://oauth2.googleapis.com/revoke';
export const YOUTUBE_API='https://www.googleapis.com/youtube/v3';
export const MAX_PLAYLIST_PAGES=2,MAX_ITEM_PAGES=3;
export const boundedId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{2,120}$/.test(x);
const requireIt=(value,code)=>{if(!value)throw Error(code);return value};
const safeString=(x,max)=>typeof x==='string'?x.slice(0,max):'';
export const secret=()=>randomBytes(32).toString('base64url');
export const challenge=verifier=>createHash('sha256').update(verifier,'ascii').digest('base64url');
export function makeAuthorization({clientId,redirectUri,state,verifier}){
 requireIt(/^[A-Za-z0-9._-]{10,200}\.apps\.googleusercontent\.com$/.test(clientId),'CLIENT_ID_INVALID');
 requireIt(/^http:\/\/127\.0\.0\.1:\d{1,5}\/oauth\/youtube\/callback$/.test(redirectUri),'REDIRECT_INVALID');
 requireIt(/^[A-Za-z0-9_-]{43,128}$/.test(state)&&/^[A-Za-z0-9_-]{43,128}$/.test(verifier),'PKCE_INPUT_INVALID');
 const url=new URL(GOOGLE_AUTH);
 for(const [k,v] of Object.entries({client_id:clientId,redirect_uri:redirectUri,response_type:'code',
  scope:SCOPE,state,code_challenge:challenge(verifier),code_challenge_method:'S256',
  access_type:'online',prompt:'consent'}))url.searchParams.set(k,v);
 return url.href;
}
export function compareState(a,b){
 if(typeof a!=='string'||typeof b!=='string')return false;
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length&&timingSafeEqual(x,y);
}
export function tokenAccept(data){
 requireIt(data&&typeof data==='object'&&!Array.isArray(data),'TOKEN_RESPONSE_INVALID');
 requireIt(data.token_type?.toLowerCase()==='bearer'&&
 typeof data.access_token==='string'&&data.access_token.length>=10&&data.access_token.length<=6000,
 'TOKEN_INVALID');
 requireIt(typeof data.scope==='string'&&data.scope.split(' ').includes(SCOPE),'OAUTH_SCOPE_MISSING');
 requireIt(Number.isInteger(Number(data.expires_in))&&Number(data.expires_in)>=1&&Number(data.expires_in)<=7200,
 'TOKEN_EXPIRATION_INVALID');
 return {accessToken:data.access_token,expiry:Date.now()+Number(data.expires_in)*1000};
}
export function playlistsResponse(data){
 requireIt(data&&Array.isArray(data.items)&&data.items.length<=50,'PLAYLISTS_API_INVALID');
 const list=data.items.map(item=>{
  requireIt(boundedId(item.id)&&item.snippet&&typeof item.snippet.title==='string','PLAYLIST_INVALID');
  return {id:item.id,title:safeString(item.snippet.title,140),
   count:Math.max(0,Math.min(50000,Number(item.contentDetails?.itemCount)||0))};
 });
 const next=data.nextPageToken;
 requireIt(next===undefined||typeof next==='string'&&next.length<=300,'PAGE_TOKEN_INVALID');
 return {list,next:next||null};
}
export function itemsResponse(data,playlistName){
 requireIt(data&&Array.isArray(data.items)&&data.items.length<=50,'PLAYLIST_ITEMS_INVALID');
 const list=[];
 for(const item of data.items){
  const sn=item.snippet||{},videoId=item.contentDetails?.videoId||sn.resourceId?.videoId;
  if(!/^[A-Za-z0-9_-]{11}$/.test(videoId||''))continue; // unavailable/private/deleted entries HOLD at source
  // Ignore descriptions, tags, thumbnails, IDs of viewers/comments, and tokens.
  list.push({source_id:videoId,title:safeString(sn.title||'Untitled video',180),
   artist:safeString(sn.videoOwnerChannelTitle||sn.channelTitle||'',140),
   album:safeString(playlistName,140),created_at:item.contentDetails?.videoPublishedAt||sn.publishedAt||'',
   source_url:'https://www.youtube.com/watch?v='+videoId});
 }
 const next=data.nextPageToken;
 requireIt(next===undefined||typeof next==='string'&&next.length<=300,'PAGE_TOKEN_INVALID');
 return {list,next:next||null};
}
export async function fetchJSON(fetchImpl,url,options={}){
 const res=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(15000)});
 requireIt(res&&res.ok,'UPSTREAM_REQUEST_FAILED');
 const typ=res.headers?.get('content-type')||'';
 requireIt(typ.includes('application/json'),'UPSTREAM_NOT_JSON');
 const text=await res.text();
 requireIt(text.length<=1_000_000,'UPSTREAM_TOO_LARGE');
 try{return JSON.parse(text)}catch{throw Error('UPSTREAM_JSON_INVALID')}
}
export async function requestToken(fetchImpl,{code,verifier,clientId,clientSecret,redirectUri,tokenEndpoint=GOOGLE_TOKEN}){
 const params=new URLSearchParams({client_id:clientId,code,code_verifier:verifier,
  grant_type:'authorization_code',redirect_uri:redirectUri});
 if(clientSecret)params.set('client_secret',clientSecret);
 const result=await fetchJSON(fetchImpl,tokenEndpoint,{
  method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:params.toString()
 });
 return tokenAccept(result);
}
export async function fetchPlaylistPage(fetchImpl,accessToken,pageToken,apiRoot=YOUTUBE_API){
 const url=new URL(apiRoot+'/playlists');
 url.searchParams.set('part','snippet,contentDetails');url.searchParams.set('mine','true');
 url.searchParams.set('maxResults','50');
 if(pageToken)url.searchParams.set('pageToken',pageToken);
 const data=await fetchJSON(fetchImpl,url,{headers:{Authorization:'Bearer '+accessToken}});
 return playlistsResponse(data);
}

/* A pasted public/share playlist is an address proposal, not evidence of
 * access or ownership. The only accepted origin is YouTube HTTPS.
 * "si" is share tracking and intentionally never retained. */
export function parsePlaylistURL(text){
 requireIt(typeof text==='string'&&text.length>0&&text.length<=750,'PLAYLIST_URL_INVALID');
 let u;try{u=new URL(text.trim())}catch{throw Error('PLAYLIST_URL_INVALID')}
 requireIt(u.protocol==='https:'&&['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)&&
  !u.username&&!u.password&&!u.port&&!u.hash&&
  ['/playlist','/watch'].includes(u.pathname),'PLAYLIST_ORIGIN_DENIED');
 const values=u.searchParams.getAll('list');
 requireIt(values.length===1&&/^[A-Za-z0-9_-]{8,120}$/.test(values[0]),'PLAYLIST_ID_INVALID');
 requireIt([...u.searchParams.keys()].every(x=>['list','si','v'].includes(x)),'PLAYLIST_QUERY_DENIED');
 return {id:values[0],canonical_url:'https://www.youtube.com/playlist?list='+encodeURIComponent(values[0])};
}
export async function fetchNamedPlaylist(fetchImpl,accessToken,id,apiRoot=YOUTUBE_API){
 requireIt(typeof id==='string'&&/^[A-Za-z0-9_-]{8,120}$/.test(id),'PLAYLIST_ID_INVALID');
 const url=new URL(apiRoot+'/playlists');
 url.searchParams.set('part','snippet,contentDetails');
 url.searchParams.set('id',id);url.searchParams.set('maxResults','1');
 const result=await fetchJSON(fetchImpl,url,{headers:{Authorization:'Bearer '+accessToken}});
 requireIt(Array.isArray(result.items)&&result.items.length<=1,'PLAYLIST_LOOKUP_INVALID');
 const item=result.items[0];
 requireIt(item&&item.id===id&&item.snippet&&typeof item.snippet.title==='string',
  'PLAYLIST_NOT_ACCESSIBLE');
 return {id,title:safeString(item.snippet.title,140),
  count:Math.max(0,Math.min(50000,Number(item.contentDetails?.itemCount)||0))};
}

export async function fetchItemsPage(fetchImpl,accessToken,playlistId,playlistName,pageToken,apiRoot=YOUTUBE_API){
 requireIt(boundedId(playlistId),'PLAYLIST_ID_INVALID');
 const url=new URL(apiRoot+'/playlistItems');
 url.searchParams.set('part','snippet,contentDetails');url.searchParams.set('playlistId',playlistId);
 url.searchParams.set('maxResults','50');
 if(pageToken)url.searchParams.set('pageToken',pageToken);
 const data=await fetchJSON(fetchImpl,url,{headers:{Authorization:'Bearer '+accessToken}});
 return itemsResponse(data,playlistName);
}
