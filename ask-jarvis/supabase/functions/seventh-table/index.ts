// THE SEVENTH TABLE 002 · account-free, permission-scoped gathering ledger.
// HTTPS Edge boundary. Tokens are random bearer credentials; database stores hashes only.
// No identity proof, auto-introductions, attendance inference or automatic messaging.
import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
const URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
if (!URL || !SERVICE_KEY) throw Error('SERVER_NOT_CONFIGURED');
const db = createClient(URL, SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS = new Set(['https://abundent.org','https://www.abundent.org']);
const TABLES='seventh_tables',NOTES='seventh_notes';
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
function reply(data,status=200,origin=''){
  const headers={...JSON_HEADERS,...(ORIGINS.has(origin)?{'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'POST, GET, OPTIONS','access-control-allow-headers':'Content-Type'}:{})};
  return new Response(JSON.stringify(data),{status,headers});
}
class Failure extends Error{constructor(message,status=400){super(message);this.status=status;}}
function clean(value,max,min=0){
  if(typeof value!=='string')throw new Failure('INVALID_FIELD');
  const text=value.replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim();
  if(text.length<min||text.length>max)throw new Failure('INVALID_FIELD');
  return text;
}
function secret(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function digest(input){
  const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));
  return Array.from(new Uint8Array(data),n=>n.toString(16).padStart(2,'0')).join('');
}
function compact(table){
  return {id:table.id,title:table.title,purpose:table.purpose,date:table.meeting_day,time:table.meeting_time,venue:table.venue,host:table.host_label,parent:table.parent_id,closed:table.closed,createdAt:table.created_at};
}
function safeNote(n){return {id:n.id,kind:n.kind,nickname:n.nickname,body:n.body,status:n.status,createdAt:n.created_at};}
async function lookup(id,token){
  if(typeof id!=='string'||!UUID.test(id)||typeof token!=='string'||!TOKEN.test(token))throw new Failure('INVITATION_NOT_FOUND',404);
  const {data,error}=await db.from(TABLES).select('*').eq('id',id).maybeSingle();
  if(error)throw new Failure('STORAGE_UNAVAILABLE',503);
  if(!data)throw new Failure('INVITATION_NOT_FOUND',404);
  const sha=await digest(token);
  const role=sha===data.host_hash?'host':sha===data.guest_hash?'guest':null;
  if(!role)throw new Failure('INVITATION_NOT_FOUND',404);
  return {table:data,role};
}
async function limitedBody(req){
  if(Number(req.headers.get('content-length')||0)>6000)throw new Failure('BODY_TOO_LARGE',413);
  const reader=req.body?.getReader();if(!reader)throw new Failure('BODY_REQUIRED');
  const chunks=[];let len=0;
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;len+=value.length;
      if(len>6000)throw new Failure('BODY_TOO_LARGE',413);
      chunks.push(value);
    }
  }finally{try{await reader.cancel();}catch{}reader.releaseLock();}
  const bytes=new Uint8Array(len);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
  let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Failure('INVALID_JSON');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Failure('INVALID_JSON');
  return value;
}
async function quota(key,period,max){
  const {data,error}=await db.rpc('seventh_consume_quota',{p_key:key,p_period:period,p_max:max});
  if(error)throw new Failure('RATE_LIMIT_UNAVAILABLE',503);
  if(!data)throw new Failure('TOO_MANY_REQUESTS',429);
}
async function limitRequest(req,type,id=''){
  const now=new Date();const day=now.toISOString().slice(0,10);const hour=now.toISOString().slice(0,13).replace('T',':');
  // Best-effort per-visitor suppression; all IP values are transformed with a secret
  // before storage, and never stored in plaintext.
  const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,64);
  const visitor=(await digest('seventh-v2|'+SERVICE_KEY+'|'+day+'|'+ip)).slice(0,38);
  if(type==='create'){await quota('create-ip:'+visitor,day,5);await quota('create-global',hour,35);}
  if(type==='note'){await quota('note-ip:'+visitor,day,18);await quota('note-table:'+id,day,100);await quota('note-hour:'+id,hour,16);}
}
const personal=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
function noContact(text){if(personal.test(text))throw new Failure('DO_NOT_INCLUDE_CONTACT_DETAILS');return text;}
function validDate(v){
  const day=clean(v,10,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||Number.isNaN(Date.parse(day+'T12:00:00Z'))||new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day)throw new Failure('INVALID_DATE');
  const ms=Date.parse(day+'T12:00:00Z')-Date.now();
  if(ms<-(30*86400000)||ms>370*86400000)throw new Failure('DATE_OUT_OF_RANGE');
  return day;
}
async function create(body,req){
  const title=clean(body.title,84,3),purpose=noContact(clean(body.purpose,270,5));
  const meeting_day=validDate(body.date), meeting_time=clean(body.time||'',5),venue=noContact(clean(body.venue||'',110)),host_label=clean(body.host||'',48);
  if(meeting_time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(meeting_time))throw new Failure('INVALID_TIME');
  let parent_id=null;
  if(body.parentId||body.parentToken){
    const prev=await lookup(body.parentId,body.parentToken);
    parent_id=prev.table.id;
  }
  await limitRequest(req,'create');
  const hostKey=secret(),guestKey=secret();
  const {data,error}=await db.from(TABLES).insert({
    title,purpose,meeting_day,meeting_time,venue,host_label,parent_id,
    host_hash:await digest(hostKey),guest_hash:await digest(guestKey)
  }).select('*').single();
  if(error)throw new Failure('COULD_NOT_CREATE_TABLE',503);
  return {table:compact(data),hostKey,guestKey,role:'host'};
}
async function read(body){
  const {table,role}=await lookup(body.id,body.token);
  let query=db.from(NOTES).select('id,kind,nickname,body,status,created_at').eq('table_id',table.id);
  if(role!=='host')query=query.eq('status','VISIBLE');
  const {data,error}=await query.order('created_at',{ascending:false}).limit(100);
  if(error)throw new Failure('COULD_NOT_READ_TABLE',503);
  return {table:compact(table),role,notes:(data||[]).map(safeNote).reverse()};
}
async function post(body,req){
  const {table,role}=await lookup(body.id,body.token);
  if(table.closed)throw new Failure('TABLE_IS_CLOSED',409);
  const kind=clean(body.kind,12),nickname=noContact(clean(body.nickname||'',36)),text=noContact(clean(body.body,420,2));
  if(!['question','offer','need','witness','rsvp'].includes(kind))throw new Failure('INVALID_NOTE_KIND');
  await limitRequest(req,'note',table.id);
  const withdrawKey=secret();
  const {data,error}=await db.from(NOTES).insert({
    table_id:table.id,kind,nickname,body:text,withdraw_hash:await digest(withdrawKey),status:role==='host'?'VISIBLE':'PENDING'
  }).select('id,kind,nickname,body,status,created_at').single();
  if(error)throw new Failure('COULD_NOT_POST_NOTE',503);
  return {note:safeNote(data),withdrawKey};
}
async function moderate(body){
  const {table,role}=await lookup(body.id,body.token);
  if(role!=='host')throw new Failure('HOST_TOKEN_REQUIRED',403);
  if(!UUID.test(String(body.noteId||'')))throw new Failure('INVALID_NOTE_ID');
  if(!['VISIBLE','HIDDEN'].includes(body.decision))throw new Failure('INVALID_DECISION');
  const {data,error}=await db.from(NOTES).update({status:body.decision}).eq('table_id',table.id).eq('id',body.noteId).select('id').maybeSingle();
  if(error)throw new Failure('COULD_NOT_MODERATE',503);
  if(!data)throw new Failure('NOTE_NOT_FOUND',404);
  return {ok:true};
}
async function withdraw(body){
  await lookup(body.id,body.token);
  if(!UUID.test(String(body.noteId||''))||!TOKEN.test(String(body.withdrawKey||'')))throw new Failure('INVALID_WITHDRAWAL');
  const hash=await digest(body.withdrawKey);
  const {data,error}=await db.from(NOTES).delete().eq('table_id',body.id).eq('id',body.noteId).eq('withdraw_hash',hash).select('id').maybeSingle();
  if(error)throw new Failure('COULD_NOT_WITHDRAW',503);
  if(!data)throw new Failure('WITHDRAWAL_NOT_FOUND',404);
  return {ok:true};
}
async function closeOrDelete(body,action){
  const {table,role}=await lookup(body.id,body.token);
  if(role!=='host')throw new Failure('HOST_TOKEN_REQUIRED',403);
  if(action==='delete'){
    const {error}=await db.from(TABLES).delete().eq('id',table.id);
    if(error)throw new Failure('COULD_NOT_DELETE',503);
  }else{
    const {error}=await db.from(TABLES).update({closed:true}).eq('id',table.id);
    if(error)throw new Failure('COULD_NOT_CLOSE',503);
  }
  return {ok:true};
}
Deno.serve(async req=>{
  const origin=req.headers.get('origin')||'';
  if(origin&&!ORIGINS.has(origin))return reply({error:'ORIGIN_NOT_ALLOWED'},403);
  if(req.method==='OPTIONS')return reply({},204,origin);
  if(req.method==='GET')return reply({ok:true,service:'seventh-table-002',storage:'account-free-ledger',identity:'not-verified'},200,origin);
  if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405,origin);
  try{
    const body=await limitedBody(req);const action=clean(body.action,16);
    const result=action==='create'?await create(body,req)
      :action==='read'?await read(body)
      :action==='post'?await post(body,req)
      :action==='moderate'?await moderate(body)
      :action==='withdraw'?await withdraw(body)
      :action==='close'||action==='delete'?await closeOrDelete(body,action)
      :(()=>{throw new Failure('UNKNOWN_ACTION');})();
    return reply(result,200,origin);
  }catch(e){const failure=e instanceof Failure?e:new Failure('SERVICE_UNAVAILABLE',503);
    return reply({error:failure.message},failure.status,origin);
  }
});
