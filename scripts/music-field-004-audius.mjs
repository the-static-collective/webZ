/* MUSIC FIELD 004 — read-only Audius public catalog adapter.
 * Fixed official host; explicit CLI call; sanitized metadata only.
 * Produces local import candidates, NEVER writes into a Music Field index.
 */
import {pathToFileURL} from 'node:url';

const ROOT='https://api.audius.co/v1/';
const MAX_RESPONSE=1_000_000;
const idPattern=/^[A-Za-z0-9_-]{4,120}$/;
const text=(v,n)=>typeof v==='string'&&v.length<=n&&!/[\u0000-\u001f\u007f<>]/.test(v)?v.trim():'';
function absolutePermalink(value){
 if(typeof value!=='string'||value.length>500)return null;
 let u;
 try{u=new URL(value.startsWith('/')?'https://audius.co'+value:value)}catch{return null}
 if(u.protocol!=='https:'||!['audius.co','www.audius.co'].includes(u.hostname)||
    u.username||u.password||u.search||u.hash||u.port||
    !/^\/[A-Za-z0-9_.@%-]+\/[A-Za-z0-9_.%-]+\/?$/.test(u.pathname))return null;
 return u.href;
}
function released(value){
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d(?:T[^\s]*)?$/.test(value))return undefined;
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toISOString():undefined;
}
export function audiusRow(t){
 if(!t||typeof t!=='object'||Array.isArray(t)||!idPattern.test(t.id||''))throw Error('AUDIUS_TRACK_ID');
 const title=text(t.title,180),artist=text(t.user?.name||t.user?.handle||'',140);
 if(!title)throw Error('AUDIUS_TITLE');
 const seconds=Number.isInteger(t.duration)&&t.duration>=0&&t.duration<=86400?t.duration:undefined;
 const genres=[t.genre,t.mood,...(typeof t.tags==='string'?t.tags.split(','):Array.isArray(t.tags)?t.tags:[])];
 const tags=[...new Set(genres.map(x=>text(x,55).toLowerCase()).filter(Boolean))].slice(0,24);
 const row={source_id:t.id,title,artist,album:'',tags,source_url:absolutePermalink(t.permalink)};
 if(seconds!==undefined)row.seconds=seconds;
 const when=released(t.release_date||t.created_at);
 if(when)row.created_at=when;
 return row;
}
export async function lookupAudius(mode,value,fetcher=globalThis.fetch){
 if(mode!=='search'&&mode!=='track')throw Error('MODE_REQUIRED');
 if(typeof value!=='string'||(mode==='track'?!idPattern.test(value):
    value.length<2||value.length>100||/[\u0000-\u001f\u007f<>]/.test(value)))throw Error('LOOKUP_INPUT');
 const path=mode==='track'?'tracks/'+encodeURIComponent(value):'tracks/search';
 const url=new URL(path,ROOT);
 if(mode==='search'){url.searchParams.set('query',value);url.searchParams.set('limit','8')}
 // No supplied endpoint, credentials, cookies, redirects, playback or downloads.
 const r=await fetcher(url.href,{method:'GET',redirect:'error',headers:{accept:'application/json'},signal:AbortSignal.timeout(10000)});
 if(!r||!r.ok)throw Error('AUDIUS_HTTP_'+(r?.status||'UNKNOWN'));
 if(Number(r.headers?.get('content-length')||0)>MAX_RESPONSE)throw Error('AUDIUS_SIZE');
 const payload=await r.text();
 if(Buffer.byteLength(payload,'utf8')>MAX_RESPONSE)throw Error('AUDIUS_SIZE');
 let json;try{json=JSON.parse(payload)}catch{throw Error('AUDIUS_JSON')}
 const records=mode==='search'?json?.data:[json?.data];
 if(!Array.isArray(records)||records.length>8)throw Error('AUDIUS_SHAPE');
 return records.map(audiusRow);
}
export async function runAudiusCLI(args,write=process.stdout.write.bind(process.stdout)){
 const [mode,value,...extra]=args;
 if(extra.length)throw Error('TOO_MANY_ARGS');
 const rows=await lookupAudius(mode,value);
 write(JSON.stringify(rows,null,2)+'\n');
 return rows.length;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 runAudiusCLI(process.argv.slice(2)).catch(e=>{process.stderr.write('HOLD: '+e.message+'\n');process.exitCode=1});
}
