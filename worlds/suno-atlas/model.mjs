/* SUNO ATLAS 001 — user-supplied metadata only.
 * No Suno API, scraping, credentials, cookies, downloads or media embedding.
 */
export const SCHEMA='webz/suno-atlas-catalog/v0';
export const VIEW='webz/suno-atlas-view/v0';
export const MAX_TRACKS=20000,MAX_BYTES=6_000_000,MAX_DEPTH=24;
const allowed=['id','id_kind','title','created_at','seconds','style','tags','model','album','source_url','parent_id','origin'];
const failure=m=>{throw new Error(m)};
const assert=(v,m)=>{if(!v)failure(m)};
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(x=>Object.hasOwn(o,x));
const str=(v,n=512)=>typeof v==='string'&&v.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const clean=(v,n=512)=>String(v??'').trim().slice(0,n);
const field=(o,keys)=>{for(const x of keys){const v=o[x];if(v!==undefined&&v!==null&&v!=='')return v}return ''};
const fnv=s=>{let x=14695981039346656037n;for(const b of new TextEncoder().encode(s)){x^=BigInt(b);x=(x*1099511628211n)&((1n<<64n)-1n)}return x.toString(16).padStart(16,'0')};
const tagSplit=v=>{
 const parts=Array.isArray(v)?v:typeof v==='string'?v.split(/[,;|]/):[];
 return [...new Set(parts.map(x=>clean(x,64).toLowerCase()).filter(x=>x.length>0&&!/[<>\u0000-\u001f]/.test(x)))].slice(0,24).sort();
};
const dateValue=v=>{
 if(!v)return null;
 const d=new Date(v);
 if(!Number.isFinite(d.getTime())||d.getUTCFullYear()<1900||d.getUTCFullYear()>2200)failure('INVALID_TRACK_DATE');
 return d.toISOString();
};
function secondsValue(v){
 if(v===''||v===undefined||v===null)return null;
 if(typeof v==='string'&&/^\d{1,3}:\d{2}$/.test(v)){
  const [m,s]=v.split(':').map(Number);
  assert(s<60,'INVALID_DURATION');
  return m*60+s;
 }
 const n=Number(v);assert(Number.isInteger(n)&&n>=0&&n<=86400,'INVALID_DURATION');return n;
}
function link(v){
 if(!v)return null;
 assert(str(v,500),'SOURCE_LINK_INVALID');
 let u;try{u=new URL(v)}catch{failure('SOURCE_LINK_INVALID')}
 assert(u.protocol==='https:'&&['suno.com','www.suno.com'].includes(u.hostname)&&
  /^\/(?:song|s)\/[a-zA-Z0-9-]{5,80}\/?$/.test(u.pathname)&&!u.username&&!u.password&&!u.search&&!u.hash,
  'ONLY_DIRECT_SUNO_SONG_LINKS');
 return u.href;
}
function normalize(row,index,origin){
 assert(row&&typeof row==='object'&&!Array.isArray(row),'TRACK_OBJECT_INVALID');
 // Whitelist: never carry lyrics, prompts, privacy flags, auth fields, or raw accounts.
 const nested=(row.metadata&&typeof row.metadata==='object'&&!Array.isArray(row.metadata))?row.metadata:{};
 const title=clean(field(row,['title','display_name','name','song_title']),180);
 assert(title.length>0,'TITLE_REQUIRED');
 const remote=clean(field(row,['id','song_id','clip_id','uuid']),120);
 assert(!remote||/^[a-zA-Z0-9_-]{4,120}$/.test(remote),'TRACK_ID_INVALID');
 const date=dateValue(field(row,['created_at','createdAt','date','created','timestamp']));
 const duration=secondsValue(field(row,['seconds','duration','duration_seconds','length']));
 const style=clean(field(row,['style','styles','genre','style_prompt'])||field(nested,['style','tags']),280);
 const tags=tagSplit(field(row,['tags','genres','moods'])||style);
 const model=clean(field(row,['model','model_name','version'])||field(nested,['model']),100);
 const album=clean(field(row,['album','collection','project']),150);
 const parent=clean(field(row,['parent_id','source_song_id','variant_of']),120)||null;
 assert(!parent||/^[a-zA-Z0-9_-]{4,120}$/.test(parent),'PARENT_ID_INVALID');
 const url=link(field(row,['url','source_url','song_url','link']));
 const id=remote||'local-'+fnv(JSON.stringify([origin,index,title,date,duration,style,model,album]));
 return {id,id_kind:remote?'SOURCE_FIELD':'LOCAL_DERIVED',title,created_at:date,seconds:duration,
  style,tags,model,album,source_url:url,parent_id:parent,origin};
}
export function csvRows(input){
 assert(typeof input==='string'&&new TextEncoder().encode(input).length<=MAX_BYTES,'CSV_TOO_LARGE');
 const s=input.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false,closed=false;
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(quoted){
   if(ch==='"'){if(s[i+1]==='"'){field+='"';i++}else{quoted=false;closed=true}}
   else field+=ch;
  }else if(ch==='"'&&field.length===0&&!closed)quoted=true;
  else if(ch===','||ch==='\n'||ch==='\r'){
   row.push(field);field='';closed=false;
   if(ch!==','){
    if(ch==='\r'&&s[i+1]==='\n')i++;
    if(row.some(x=>x.trim()!==''))rows.push(row);
    row=[];
   }
  }else{
   if(closed)failure('CSV_INVALID_AFTER_QUOTE');
   field+=ch;
  }
  if(field.length>MAX_BYTES)failure('CSV_FIELD_TOO_LARGE');
 }
 assert(!quoted,'CSV_UNCLOSED_QUOTE');
 if(field!==''||row.length){row.push(field);if(row.some(x=>x.trim()!==''))rows.push(row)}
 assert(rows.length<=MAX_TRACKS+1,'TRACK_LIMIT');
 if(!rows.length)return [];
 const headers=rows.shift().map(x=>x.trim().toLowerCase().replace(/\s+/g,'_'));
 assert(headers.length>0&&headers.length<=70&&headers.some(x=>['title','name','display_name','song_title'].includes(x)),'CSV_TITLE_COLUMN_REQUIRED');
 assert(new Set(headers).size===headers.length,'CSV_DUPLICATE_HEADERS');
 return rows.map(cells=>{
  assert(cells.length===headers.length,'CSV_COLUMN_COUNT');
  return Object.fromEntries(headers.map((k,i)=>[k,cells[i]]));
 });
}
export function fromText(text,format='auto',origin='USER_SELECTED'){
 assert(typeof text==='string'&&new TextEncoder().encode(text).length<=MAX_BYTES,'INPUT_TOO_LARGE');
 assert(['auto','csv','json'].includes(format),'FORMAT_INVALID');
 assert(['USER_SELECTED','SYNTHETIC_DEMO'].includes(origin),'ORIGIN_INVALID');
 let rows;
 if(format==='csv'||format==='auto'&&!/^\s*[\[{]/.test(text))rows=csvRows(text);
 else{
  let data;try{data=JSON.parse(text)}catch{failure('JSON_INVALID')}
  if(data?.schema==='webz/suno-atlas-portable/v0'){
   assert(data.catalog&&data.notes==='User-selected or fictional metadata only. No lyrics/audio/account credentials.','PORTABLE_CONTRACT');
   return structuredClone(validateCatalog(data.catalog));
  }
  if(data?.schema===SCHEMA)return structuredClone(validateCatalog(data));
  rows=Array.isArray(data)?data:data?.songs??data?.tracks;
  assert(Array.isArray(rows),'JSON_SONG_ARRAY_REQUIRED');
 }
 assert(rows.length<=MAX_TRACKS,'TRACK_LIMIT');
 const tracks=rows.map((row,i)=>normalize(row,i,origin));
 const out={schema:SCHEMA,tracks};
 validateCatalog(out);return out;
}
export function validateCatalog(c){
 assert(exact(c,['schema','tracks'])&&c.schema===SCHEMA&&Array.isArray(c.tracks)&&c.tracks.length<=MAX_TRACKS,'CATALOG_SHAPE');
 const ids=new Map();
 for(const t of c.tracks){
  assert(exact(t,allowed)&&str(t.id,150)&&/^(?:[a-zA-Z0-9_-]{4,120}|local-[a-f0-9]{16})$/.test(t.id),'TRACK_FIELDS');
  assert(['SOURCE_FIELD','LOCAL_DERIVED'].includes(t.id_kind),'ID_ORIGIN');
  assert(str(t.title,180)&&t.title.length>0&&str(t.style,280)&&str(t.model,100)&&str(t.album,150),'TRACK_TEXT');
  assert((t.created_at===null||typeof t.created_at==='string'&&new Date(t.created_at).toISOString()===t.created_at)
    &&(t.seconds===null||Number.isInteger(t.seconds)&&t.seconds>=0&&t.seconds<=86400),'TRACK_MEASURES');
  assert(Array.isArray(t.tags)&&t.tags.length<=24&&t.tags.every(x=>str(x,64)&&x&&x===x.toLowerCase()),'TRACK_TAGS');
  assert((t.source_url===null||link(t.source_url)===t.source_url)&&
   (t.parent_id===null||/^[a-zA-Z0-9_-]{4,120}$/.test(t.parent_id)),'TRACK_LINKS');
  assert(['USER_SELECTED','SYNTHETIC_DEMO'].includes(t.origin),'TRACK_ORIGIN');
  assert(!ids.has(t.id),'DUPLICATE_ID:'+t.id);ids.set(t.id,true);
 }
 return c;
}
export const emptyCatalog=()=>({schema:SCHEMA,tracks:[]});
export function mergeCatalog(a,b){
 validateCatalog(a);validateCatalog(b);
 const m=new Map(a.tracks.map(t=>[t.id,t]));
 for(const t of b.tracks){
  if(!m.has(t.id)){m.set(t.id,t);continue}
  if(JSON.stringify(m.get(t.id))!==JSON.stringify(t))failure('CONFLICTING_TRACK_ID:'+t.id);
 }
 const out={schema:SCHEMA,tracks:[...m.values()]};
 validateCatalog(out);return out;
}
export const indexId=c=>{validateCatalog(c);return 'idx-'+fnv(JSON.stringify(c.tracks.slice().sort((a,b)=>a.id.localeCompare(b.id))))};
export const freshView=()=>({schema:VIEW,path:[],tuning:1,granularity:6,search:''});
export function validView(s){
 assert(exact(s,['schema','path','tuning','granularity','search'])&&s.schema===VIEW&&
  Number.isInteger(s.tuning)&&s.tuning>=1&&s.tuning<=11&&
  Number.isInteger(s.granularity)&&s.granularity>=1&&s.granularity<=11&&
  Array.isArray(s.path)&&s.path.length<=MAX_DEPTH&&
  s.path.every(p=>exact(p,['t','g'])&&Number.isInteger(p.t)&&p.t>=1&&p.t<=11&&Number.isInteger(p.g)&&p.g>=1&&p.g<=11)&&
  str(s.search,100),'VIEW_INVALID');
 return s;
}
export function withDial(s,which,n){
 validView(s);assert(['tuning','granularity'].includes(which)&&Number.isInteger(n)&&n>=1&&n<=11,'DIAL_INVALID');
 return {...s,path:s.path.map(p=>({...p})),[which]:n};
}
export function withSearch(s,q){validView(s);assert(str(q,100),'SEARCH_INVALID');return {...s,path:s.path.map(p=>({...p})),search:q}}
export function enter(s){
 validView(s);assert(s.path.length<MAX_DEPTH,'DEPTH_LIMIT');
 return {schema:VIEW,path:[...s.path.map(p=>({...p})),{t:s.tuning,g:s.granularity}],tuning:1,granularity:6,search:s.search};
}
export function rise(s){
 validView(s);if(!s.path.length)return {...s,path:[]};
 const path=s.path.slice(0,-1).map(p=>({...p})),p=s.path.at(-1);
 return {...s,path,tuning:p.t,granularity:p.g};
}
const pad=v=>String(v).padStart(2,'0');
export function address(c,s){
 validateCatalog(c);validView(s);
 return 'SA1/'+indexId(c)+'/'+[...s.path,{t:s.tuning,g:s.granularity}]
  .map(p=>'t'+pad(p.t)+'g'+pad(p.g)).join('/');
}
export function parseAddress(c,raw){
 validateCatalog(c);assert(typeof raw==='string'&&raw.length<300,'ADDRESS_INVALID');
 const parts=raw.split('/');
 assert(parts.shift()==='SA1'&&parts.shift()===indexId(c)&&parts.length>0&&parts.length<=MAX_DEPTH+1,'CATALOG_MISMATCH_OR_DEPTH');
 const pairs=parts.map(x=>{
  const m=/^t(0[1-9]|1[01])g(0[1-9]|1[01])$/.exec(x);
  assert(m,'ADDRESS_DIGITS');return {t:Number(m[1]),g:Number(m[2])};
 });
 const cur=pairs.pop();
 return validView({schema:VIEW,path:pairs,tuning:cur.t,granularity:cur.g,search:''});
}
const byWeight=(a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]);
export function lanes(tracks){
 const counts=new Map();
 for(const t of tracks)for(const k of t.tags)counts.set(k,(counts.get(k)||0)+1);
 return [{label:'All tracks',tag:null,count:tracks.length},...[...counts].sort(byWeight).slice(0,10).map(([tag,count])=>({label:tag,tag,count}))];
}
export function choose(c,s){
 validateCatalog(c);validView(s);
 let tracks=c.tracks.slice();
 for(const p of [...s.path,{t:s.tuning,g:s.granularity}]){
  const lane=lanes(tracks)[p.t-1];
  tracks=lane?(lane.tag?tracks.filter(x=>x.tags.includes(lane.tag)):tracks):[];
 }
 const q=s.search.toLowerCase().trim();
 if(q)tracks=tracks.filter(t=>[t.title,t.style,t.album,t.model,t.id,...t.tags].some(x=>x.toLowerCase().includes(q)));
 tracks.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
 const total=tracks.length;
 const max=Math.min(MAX_TRACKS,11*2**(s.granularity-1));
 return {tracks:tracks.slice(0,max),total,shown:Math.min(total,max),
  family:lanes(c.tracks)[s.tuning-1]?.label||'Unused position',all:tracks};
}
export function timeline(tracks,g){
 assert(Number.isInteger(g)&&g>=1&&g<=11,'GRANULARITY_INVALID');
 const map=new Map(),time=g<=3?'year':g<=6?'quarter':g<=9?'month':'week';
 for(const t of tracks){
  let bucket='undated';
  if(t.created_at){
   const d=new Date(t.created_at);
   if(time==='year')bucket=String(d.getUTCFullYear());
   if(time==='quarter')bucket=d.getUTCFullYear()+' Q'+(Math.floor(d.getUTCMonth()/3)+1);
   if(time==='month')bucket=t.created_at.slice(0,7);
   if(time==='week'){
    const iso=t.created_at.slice(0,10),sun=new Date(iso+'T00:00:00Z');
    sun.setUTCDate(sun.getUTCDate()-(sun.getUTCDay()+6)%7);
    bucket=sun.toISOString().slice(0,10);
   }
  }
  map.set(bucket,(map.get(bucket)||0)+1);
 }
 const bins=[...map].sort((a,b)=>a[0].localeCompare(b[0])).map(([bucket,count])=>({bucket,count}));
 return {resolution:time,bins:bins.length>70?bins.slice(-70):bins,
  truncated:bins.length>70,total:tracks.length};
}
export function styleGraph(tracks){
 const weights=new Map(),pairs=new Map();
 for(const t of tracks){
  const keys=t.tags.slice(0,8);
  for(const key of keys)weights.set(key,(weights.get(key)||0)+1);
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){
   const pair=[keys[i],keys[j]].sort().join('\u241f');
   pairs.set(pair,(pairs.get(pair)||0)+1);
  }
 }
 const nodes=[...weights].sort(byWeight).slice(0,18).map(([id,count])=>({id,count}));
 const present=new Set(nodes.map(n=>n.id));
 const edges=[...pairs].map(([key,count])=>{
  const [source,target]=key.split('\u241f');return {source,target,count};
 }).filter(e=>present.has(e.source)&&present.has(e.target)).sort((a,b)=>b.count-a.count).slice(0,50);
 return {nodes,edges,totalTracks:tracks.length,derived:true};
}
