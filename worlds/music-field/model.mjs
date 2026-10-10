/* MUSIC FIELD 002 — import from user-selected metadata, not accounts.
 * One source-qualified record identity per platform. Every cross-source
 * equivalence is explicit and human-supplied, NEVER inferred from title.
 */
import {csvRows} from '../suno-atlas/model.mjs';
export const SCHEMA='webz/music-field-records/v0';
export const VIEW='webz/music-field-view/v0';
export const PORTABLE='webz/music-field-portable/v0';
export const MAX_TRACKS=20000,MAX_BYTES=6000000,MAX_DEPTH=24;
export const PLATFORMS=['SUNO','BANDCAMP','YOUTUBE','AUDIUS'];
const keys=['key','platform','source_id','id_kind','title','artist','album','model','created_at','seconds','tags','source_url','relations','origin','kind'];
const assert=(v,err)=>{if(!v)throw Error(err)};
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===k.length&&k.every(x=>own(o,x));
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const clean=(s,n=200)=>String(s??'').trim().slice(0,n);
const validText=(s,n)=>typeof s==='string'&&s.length<=n&&!/[\u0000-\u001f\u007f<>]/.test(s);
const choose=(r,names)=>{for(const n of names)if(r[n]!==undefined&&r[n]!==null&&r[n]!=='')return r[n];return ''};
const fnv=s=>{let h=14695981039346656037n;for(const b of new TextEncoder().encode(s)){h^=BigInt(b);h=h*1099511628211n&((1n<<64n)-1n)}return h.toString(16).padStart(16,'0')};
const asTags=v=>[...new Set((Array.isArray(v)?v:typeof v==='string'?v.split(/[,;|]/):[])
 .map(x=>clean(x,55).toLowerCase()).filter(x=>x&&!/[\u0000-\u001f<>]/.test(x)))].sort().slice(0,24);
function date(v){
 if(!v)return null;
 const d=new Date(v);assert(Number.isFinite(d.getTime())&&d.getUTCFullYear()>=1900&&d.getUTCFullYear()<=2200,'DATE_INVALID');
 return d.toISOString();
}
function duration(v){
 if(v===undefined||v===null||v==='')return null;
 if(typeof v==='string'&&/^\d{1,4}:\d{2}$/.test(v)){
  const [m,s]=v.split(':').map(Number);assert(s<60,'DURATION_INVALID');return m*60+s;
 }
 assert(Number.isFinite(Number(v))&&Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=86400,'DURATION_INVALID');
 return Number(v);
}
function platformURL(provider,raw){
 if(!raw)return null;
 assert(typeof raw==='string'&&raw.length<=500,'URL_INVALID');
 let url;try{url=new URL(raw)}catch{throw Error('URL_INVALID')}
 assert(url.protocol==='https:'&&!url.username&&!url.password&&!url.hash,'URL_INVALID');
 if(provider==='SUNO'){
  assert(['suno.com','www.suno.com'].includes(url.hostname)&&/^\/(?:song|s)\/[A-Za-z0-9-]{5,80}\/?$/.test(url.pathname)&&!url.search,'SUNO_URL_INVALID');
 }
 if(provider==='BANDCAMP'){
  assert((url.hostname==='bandcamp.com'||url.hostname==='www.bandcamp.com'||/^[a-z0-9-]+\.bandcamp\.com$/.test(url.hostname))&&
    /^\/(?:track|album)\/[A-Za-z0-9-]+\/?$/.test(url.pathname)&&!url.search,
    'BANDCAMP_URL_INVALID');
 }
 if(provider==='AUDIUS'){
  assert(['audius.co','www.audius.co'].includes(url.hostname)&&
    /^\/[A-Za-z0-9_.@%-]+\/[A-Za-z0-9_.%-]+\/?$/.test(url.pathname)&&!url.search,
    'AUDIUS_URL_INVALID');
 }
 if(provider==='YOUTUBE'){
  const isWatch=(url.hostname==='youtube.com'||url.hostname==='www.youtube.com')&&
    url.pathname==='/watch'&&url.searchParams.has('v')&&[...url.searchParams.keys()].every(x=>x==='v');
  const isShort=url.hostname==='youtu.be'&&/^\/[A-Za-z0-9_-]{11}$/.test(url.pathname)&&!url.search;
  assert(isWatch||isShort,'YOUTUBE_URL_INVALID');
  if(isWatch)assert(/^[A-Za-z0-9_-]{11}$/.test(url.searchParams.get('v')),'YOUTUBE_ID_INVALID');
 }
 return url.href;
}
function normalize(r,platform,index,origin){
 assert(plain(r),'RECORD_INVALID');
 let sourceId=clean(choose(r,['source_id','song_id','clip_id','video_id','id','track_id']),120);
 const title=clean(choose(r,['title','name','song_title','display_name']),180);
 assert(title&&validText(title,180),'TITLE_REQUIRED');
 const artist=clean(choose(r,['artist','creator','channel','channel_title','artist_name','author']),140);
 const album=clean(choose(r,['album','release','collection','playlist','project']),140);
 const model=clean(choose(r,['model','model_name','version']),90);
 const created=date(choose(r,['created_at','createdAt','date','published_at','publishedAt','release_date']));
 const seconds=duration(choose(r,['seconds','duration','length','duration_seconds']));
 const tags=asTags(choose(r,['tags','styles','style','genres','genre','moods']));
 const sourceUrl=platformURL(platform,choose(r,['source_url','url','link','permalink','song_url','video_url']));
 const kind=platform==='YOUTUBE'?'VIDEO':choose(r,['kind','type'])==='RELEASE'?'RELEASE':'TRACK';
 assert(!sourceId||/^[A-Za-z0-9_-]{4,120}$/.test(sourceId),'SOURCE_ID_INVALID');
 if(platform==='YOUTUBE'&&sourceId)assert(/^[A-Za-z0-9_-]{11}$/.test(sourceId),'YOUTUBE_ID_INVALID');
 const idKind=sourceId?'SOURCE_FIELD':'LOCAL_DERIVED';
 if(!sourceId)sourceId='local-'+fnv(JSON.stringify([platform,origin,index,title,artist,album,created,sourceUrl]));
 const key=platform.toLowerCase()+':'+sourceId;
 const relations=Array.isArray(r.related)||Array.isArray(r.relations)?(r.related??r.relations):[];
 assert(Array.isArray(relations)&&relations.length<=16,'RELATION_LIMIT');
 const links=[...new Set(relations.map(x=>clean(x,150)))].sort();
 for(const x of links)assert(/^(suno|bandcamp|youtube|audius):[A-Za-z0-9_-]{4,120}$/.test(x)&&x!==key,'RELATION_INVALID');
 return {key,platform,source_id:sourceId,id_kind:idKind,title,artist,album,model,created_at:created,
  seconds,tags,source_url:sourceUrl,relations:links,origin,kind};
}
function youtubeRows(data){
 let rows=data;
 if(plain(data)&&Array.isArray(data.items))rows=data.items;
 assert(Array.isArray(rows),'YOUTUBE_ITEMS_REQUIRED');
 return rows.map(x=>{
  if(!plain(x)||!plain(x.snippet))return x;
  const snippet=x.snippet,videoId=x.contentDetails?.videoId||snippet.resourceId?.videoId||
   (typeof x.id==='string'?x.id:x.id?.videoId);
  assert(typeof videoId==='string'&&/^[A-Za-z0-9_-]{11}$/.test(videoId),'YOUTUBE_VIDEO_ID_REQUIRED');
  return {source_id:videoId,title:snippet.title,
    artist:snippet.videoOwnerChannelTitle||snippet.channelTitle||'',
    album:snippet.playlistTitle||'',created_at:x.contentDetails?.videoPublishedAt||snippet.publishedAt,
    source_url:'https://www.youtube.com/watch?v='+videoId,
    tags:snippet.tags||[]};
 });
}
export const empty=()=>({schema:SCHEMA,records:[]});
export function validate(c){
 assert(exact(c,['schema','records'])&&c.schema===SCHEMA&&Array.isArray(c.records)&&c.records.length<=MAX_TRACKS,'CATALOG_INVALID');
 const seen=new Set();
 for(const r of c.records){
  assert(exact(r,keys)&&PLATFORMS.includes(r.platform)&&
    typeof r.key==='string'&&r.key===r.platform.toLowerCase()+':'+r.source_id&&
    typeof r.source_id==='string'&&/^[A-Za-z0-9_-]{4,120}$/.test(r.source_id)&&
    ['SOURCE_FIELD','LOCAL_DERIVED'].includes(r.id_kind),'RECORD_ID_INVALID');
  assert(validText(r.title,180)&&r.title.length>0&&validText(r.artist,140)&&validText(r.album,140)&&validText(r.model,90),'RECORD_TEXT_INVALID');
  assert((r.created_at===null||typeof r.created_at==='string'&&date(r.created_at)===r.created_at)&&
    (r.seconds===null||Number.isInteger(r.seconds)&&r.seconds>=0&&r.seconds<=86400),'RECORD_TIME_INVALID');
  assert(Array.isArray(r.tags)&&r.tags.length<=24&&r.tags.every(t=>validText(t,55)&&t===t.toLowerCase()&&t),'RECORD_TAGS_INVALID');
  assert(r.source_url===null||platformURL(r.platform,r.source_url)===r.source_url,'RECORD_URL_INVALID');
  assert(Array.isArray(r.relations)&&r.relations.length<=16&&r.relations.every(x=>typeof x==='string'&&/^(suno|bandcamp|youtube|audius):[A-Za-z0-9_-]{4,120}$/.test(x)&&x!==r.key),'RECORD_RELATION_INVALID');
  assert(['USER_SELECTED','SYNTHETIC_DEMO'].includes(r.origin)&&['TRACK','VIDEO','RELEASE'].includes(r.kind),'RECORD_ORIGIN_INVALID');
  assert(!seen.has(r.key),'DUPLICATE_SOURCE_RECORD:'+r.key);seen.add(r.key);
 }
 return c;
}
export function importText(text,platform,format='auto',origin='USER_SELECTED'){
 assert(typeof text==='string'&&new TextEncoder().encode(text).length<=MAX_BYTES,'FILE_TOO_LARGE');
 assert(['auto','csv','json'].includes(format)&&['USER_SELECTED','SYNTHETIC_DEMO'].includes(origin),'INPUT_FORMAT');
 let data,rows;
 if(format==='csv'||format==='auto'&&!/^\s*[\[{]/.test(text))rows=csvRows(text);
 else{
  try{data=JSON.parse(text)}catch{throw Error('JSON_INVALID')}
  if(data?.schema===PORTABLE){assert(data.catalog&&data.scope==='USER_SELECTED_METADATA','PORTABLE_SCOPE');return structuredClone(validate(data.catalog))}
  if(data?.schema==='webz/suno-atlas-portable/v0'){
    assert(platform==='SUNO'&&data.catalog?.schema==='webz/suno-atlas-catalog/v0'&&Array.isArray(data.catalog.tracks),
      'SUNO_ATLAS_FORMAT_REQUIRED');
    rows=data.catalog.tracks;
  }else if(data?.schema===SCHEMA)return structuredClone(validate(data));
  else rows=Array.isArray(data)?data:data?.records??data?.tracks??data?.songs??data?.items;
 }
 assert(PLATFORMS.includes(platform),'PLATFORM_REQUIRED');
 assert(Array.isArray(rows)&&rows.length<=MAX_TRACKS,'RECORD_ARRAY_REQUIRED');
 if(platform==='YOUTUBE')rows=youtubeRows(rows);
 return validate({schema:SCHEMA,records:rows.map((r,i)=>normalize(r,platform,i,origin))});
}
export function merge(a,b){
 validate(a);validate(b);const map=new Map(a.records.map(r=>[r.key,r]));
 for(const r of b.records){
  if(map.has(r.key)){assert(JSON.stringify(map.get(r.key))===JSON.stringify(r),'SOURCE_CONFLICT:'+r.key)}
  else map.set(r.key,r);
 }
 return validate({schema:SCHEMA,records:[...map.values()]});
}
export function fingerprint(c){
 validate(c);return 'mf-'+fnv(JSON.stringify(c.records.slice().sort((a,b)=>a.key.localeCompare(b.key))));
}
export function freshView(){return {schema:VIEW,path:[],tuning:1,granularity:6,platform:'ALL',search:''}}
export function validView(v){
 assert(exact(v,['schema','path','tuning','granularity','platform','search'])&&v.schema===VIEW&&
  ['ALL',...PLATFORMS].includes(v.platform)&&
  Number.isInteger(v.tuning)&&v.tuning>=1&&v.tuning<=11&&
  Number.isInteger(v.granularity)&&v.granularity>=1&&v.granularity<=11&&
  Array.isArray(v.path)&&v.path.length<=MAX_DEPTH&&v.path.every(p=>exact(p,['t','g'])&&
   Number.isInteger(p.t)&&p.t>=1&&p.t<=11&&Number.isInteger(p.g)&&p.g>=1&&p.g<=11)&&
  validText(v.search,100),'VIEW_INVALID');return v;
}
export function setView(v,k,x){
 validView(v);assert(['tuning','granularity','platform','search'].includes(k),'VIEW_AXIS_INVALID');
 return validView({...v,path:v.path.map(x=>({...x})),[k]:x});
}
export function descend(v){validView(v);assert(v.path.length<MAX_DEPTH,'DEPTH_LIMIT');
 return {...v,path:[...v.path.map(x=>({...x})),{t:v.tuning,g:v.granularity}],tuning:1,granularity:6};
}
export function ascend(v){validView(v);if(!v.path.length)return {...v,path:[]};
 const path=v.path.slice(0,-1),last=v.path.at(-1);
 return {...v,path,tuning:last.t,granularity:last.g};
}
export function lanes(items){
 const n=new Map();for(const r of items)for(const tag of r.tags)n.set(tag,(n.get(tag)||0)+1);
 return [{name:'Everything',tag:null,count:items.length},...[...n].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
  .slice(0,10).map(([tag,count])=>({name:tag,tag,count}))];
}
export function scope(c,v){
 validate(c);validView(v);
 let subset=c.records.filter(r=>v.platform==='ALL'||r.platform===v.platform);
 const ancestors=[];
 for(const p of [...v.path,{t:v.tuning,g:v.granularity}]){
  const chosen=lanes(subset)[p.t-1];ancestors.push(chosen?.name||'Unused');
  subset=chosen?(chosen.tag?subset.filter(r=>r.tags.includes(chosen.tag)):subset):[];
 }
 const text=v.search.toLowerCase().trim();
 if(text)subset=subset.filter(r=>[r.title,r.artist,r.album,r.platform,r.key,...r.tags].some(x=>x.toLowerCase().includes(text)));
 subset.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')||a.key.localeCompare(b.key));
 const total=subset.length,cap=Math.min(MAX_TRACKS,11*2**(v.granularity-1));
 return {all:subset,visible:subset.slice(0,cap),total,cap,lane:ancestors.at(-1)};
}
export function counts(records,v){
 validView(v);
 const platforms=Object.fromEntries(PLATFORMS.map(x=>[x,records.filter(r=>r.platform===x).length]));
 const range=v.granularity<=3?'year':v.granularity<=6?'quarter':v.granularity<=9?'month':'week';
 const histogram=new Map();
 for(const r of records){
  let name='unknown';
  if(r.created_at){
   const d=new Date(r.created_at);
   if(range==='year')name=String(d.getUTCFullYear());
   if(range==='quarter')name=d.getUTCFullYear()+' Q'+(Math.floor(d.getUTCMonth()/3)+1);
   if(range==='month')name=r.created_at.slice(0,7);
   if(range==='week'){d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);name=d.toISOString().slice(0,10)}
  }
  histogram.set(name,(histogram.get(name)||0)+1);
 }
 const tags=new Map();for(const r of records)for(const tag of r.tags)tags.set(tag,(tags.get(tag)||0)+1);
 return {platforms,range,bins:[...histogram].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date,count})).slice(-65),
  tags:[...tags].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,20).map(([tag,count])=>({tag,count})),total:records.length};
}
export function relations(records){
 const known=new Set(records.map(r=>r.key)),edges=[];
 for(const r of records)for(const target of r.relations){
  if(known.has(target))edges.push({from:r.key,to:target,kind:'USER_DECLARED_RELATION'});
 }
 return {edges,totalRecords:records.length,inferredEquivalences:0};
}
const digits=p=>'t'+String(p.t).padStart(2,'0')+'g'+String(p.g).padStart(2,'0');
export function address(c,v){
 validate(c);validView(v);
 return 'MF2/'+fingerprint(c)+'/p'+v.platform+'/'+[...v.path,{t:v.tuning,g:v.granularity}].map(digits).join('/');
}
export function parseAddress(c,s){
 validate(c);assert(typeof s==='string'&&s.length<390,'ADDRESS_INVALID');
 const arr=s.split('/');assert(arr.shift()==='MF2'&&arr.shift()===fingerprint(c),'DATASET_MISMATCH');
 const provider=arr.shift();
 assert(provider?.startsWith('p')&&['ALL',...PLATFORMS].includes(provider.slice(1))&&arr.length>=1&&arr.length<=MAX_DEPTH+1,'ADDRESS_PROVIDER');
 const all=arr.map(x=>{const m=/^t(0[1-9]|1[01])g(0[1-9]|1[01])$/.exec(x);assert(m,'ADDRESS_DIALS');return {t:Number(m[1]),g:Number(m[2])}});
 const now=all.pop();
 return validView({schema:VIEW,path:all,tuning:now.t,granularity:now.g,platform:provider.slice(1),search:''});
}
