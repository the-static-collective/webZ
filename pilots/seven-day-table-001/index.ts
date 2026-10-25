// ONE TABLE / SEVEN DAYS · independent invitation circle, hashed bearer tokens.
import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
import {SITE} from './site.ts';
const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
if(!url||!key)throw Error('SERVER_NOT_CONFIGURED');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const TOKEN=/^[A-Za-z0-9_-]{43}$/,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PHONE=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|(?:https?:\/\/|www\.)/i;
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const CSP="default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; form-action 'self'";
const reply=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:HEAD});
class Fail extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status;}}
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');}
function secret(){const a=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function str(v:unknown,min:number,max:number){if(typeof v!=='string')throw new Fail('INVALID_TEXT');const x=v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ');if(x.length<min||x.length>max)throw new Fail('INVALID_TEXT');if(EMAIL_PHONE.test(x))throw new Fail('REMOVE_PRIVATE_CONTACTS_AND_URLS');return x;}
async function bounded(req:Request){if(Number(req.headers.get('content-length')||0)>2200)throw new Fail('BODY_TOO_LARGE',413);const body=await req.text();if(new TextEncoder().encode(body).length>2200)throw new Fail('BODY_TOO_LARGE',413);try{const v=JSON.parse(body);if(!v||Array.isArray(v)||typeof v!=='object')throw 0;return v;}catch{throw new Fail('INVALID_JSON');}}
async function authorize(b:any){if(typeof b.roomId!=='string'||!UUID.test(b.roomId)||typeof b.key!=='string'||!TOKEN.test(b.key))throw new Fail('INVITE_NOT_FOUND',404);
 const {data:room,error:e}=await db.from('seven_day_rooms').select('*').eq('id',b.roomId).maybeSingle();if(e)throw new Fail('STORAGE_UNAVAILABLE',503);if(!room)throw new Fail('INVITE_NOT_FOUND',404);
 const h=await hash(b.key);if(h===room.host_hash)return {room,role:'host',seat:null};
 if(typeof b.seatId!=='string'||!UUID.test(b.seatId))throw new Fail('INVITE_NOT_FOUND',404);
 const {data:seat,error:se}=await db.from('seven_day_seats').select('*').eq('id',b.seatId).eq('room_id',room.id).maybeSingle();
 if(se)throw new Fail('STORAGE_UNAVAILABLE',503);
 if(!seat||seat.invite_hash!==h)throw new Fail('INVITE_NOT_FOUND',404);
 return {room,role:'seat',seat};}
function open(room:any){if(room.closed||Date.now()>Date.parse(room.closes_at))throw new Fail('TABLE_CLOSED',409);}
const ROOM=(r:any)=>({id:r.id,title:r.title,purpose:r.purpose,opensAt:r.opens_at,closesAt:r.closes_at,closed:r.closed||Date.now()>Date.parse(r.closes_at)});
const SEAT=(s:any,includeResponse=false)=>({id:s.id,parent:s.parent_seat_id,type:s.seat_type,lens:s.lens,status:s.status,availability:includeResponse?s.availability:undefined,response:includeResponse?s.response:undefined,share:includeResponse?s.share_to_table:undefined,respondedAt:includeResponse?s.responded_at:undefined});
async function quota(id:string){const day=new Date().toISOString().slice(0,10);const {data,error}=await db.rpc('seventh_consume_quota',{p_key:'seven-day:'+id,p_period:day,p_max:30});if(error)throw new Fail('QUOTA_UNAVAILABLE',503);if(!data)throw new Fail('RATE_LIMIT',429);}
async function read(b:any){
 const a=await authorize(b);
 const {data:seats,error}=await db.from('seven_day_seats').select('id,room_id,parent_seat_id,seat_type,lens,status,availability,response,share_to_table,responded_at,created_at').eq('room_id',a.room.id).order('created_at',{ascending:true}).limit(50);
 if(error)throw new Fail('STORAGE_UNAVAILABLE',503);
 const all=seats||[];
 if(a.role==='host')return {ok:true,role:'host',room:ROOM(a.room),seats:all.map(s=>SEAT(s,true)),limits:{primary:8,referralsPerPrimary:2}};
 const s=a.seat,refs=all.filter(x=>x.parent_seat_id===s.id&&x.seat_type==='referral').length,amb=all.find(x=>x.parent_seat_id===s.id&&x.seat_type==='ambassador');
 return {ok:true,role:'seat',room:ROOM(a.room),seat:SEAT(s,true),referralsUsed:refs,ambassadorInvited:!!amb,shared:all.filter(x=>x.id!==s.id&&x.share_to_table&&x.response&&x.status==='participating').map(x=>({type:x.seat_type,response:x.response,availability:x.availability,respondedAt:x.responded_at})).slice(0,32)};
}
async function makeSeat(room:any,kind:string,parent:string|null,slot:number|null,lens:string){
 const guestKey=secret();
 const {data,error}=await db.from('seven_day_seats').insert({room_id:room.id,parent_seat_id:parent,seat_type:kind,slot,lens,invite_hash:await hash(guestKey)}).select('id,seat_type,lens,created_at').single();
 if(error)throw new Fail('INVITE_SLOT_UNAVAILABLE',409);
 return {seat:{id:data.id,type:data.seat_type,lens:data.lens},inviteKey:guestKey};
}
async function createInvite(b:any){
 const a=await authorize(b),kind=b.action;
 open(a.room);
 if(kind==='seed'){
  if(a.role!=='host')throw new Fail('HOST_REQUIRED',403);
  const lens=str(b.lens||'Community perspective',2,75);
  await quota(a.room.id);
  const {count,error}=await db.from('seven_day_seats').select('id',{count:'exact',head:true}).eq('room_id',a.room.id).eq('seat_type','primary');
  if(error)throw new Fail('STORAGE_UNAVAILABLE',503);
  if((count||0)>=8)throw new Fail('PRIMARY_SEATS_FULL',409);
  return await makeSeat(a.room,'primary',null,null,lens);
 }
 if(a.role!=='seat'||a.seat.seat_type!=='primary')throw new Fail('PRIMARY_INVITATION_REQUIRED',403);
 if(a.seat.status==='delegated'||a.seat.status==='declined')throw new Fail('SEAT_NOT_ACTIVE',409);
 await quota(a.seat.id);
 if(kind==='referral'){
  const {data,error}=await db.from('seven_day_seats').select('slot').eq('room_id',a.room.id).eq('parent_seat_id',a.seat.id).eq('seat_type','referral');
  if(error)throw new Fail('STORAGE_UNAVAILABLE',503);
  const used=new Set((data||[]).map(x=>x.slot));const slot=[1,2].find(x=>!used.has(x));if(!slot)throw new Fail('TWO_INVITES_ALREADY_USED',409);
  return await makeSeat(a.room,'referral',a.seat.id,slot,'Neighbor invited by a table participant');
 }
 if(kind==='ambassador'){
  const {count,error}=await db.from('seven_day_seats').select('id',{count:'exact',head:true}).eq('room_id',a.room.id).eq('parent_seat_id',a.seat.id).eq('seat_type','ambassador');
  if(error)throw new Fail('STORAGE_UNAVAILABLE',503);
  if(count)throw new Fail('AMBASSADOR_ALREADY_INVITED',409);
  const result=await makeSeat(a.room,'ambassador',a.seat.id,1,'Ambassador, invited in place of a participant');
  const {error:up}=await db.from('seven_day_seats').update({status:'delegated',share_to_table:false}).eq('id',a.seat.id);
  if(up){await db.from('seven_day_seats').delete().eq('id',result.seat.id);throw new Fail('DELEGATION_UNAVAILABLE',503);}
  return {...result,replacedSeat:a.seat.id,note:'Ambassador link created, not yet accepted; the original seat is paused. The invited person must choose whether to participate.'};
 }
 throw new Fail('UNKNOWN_ACTION');
}
async function respond(b:any){
 const a=await authorize(b);open(a.room);
 if(a.role!=='seat')throw new Fail('INVITATION_REQUIRED',403);
 if(a.seat.status==='delegated')throw new Fail('SEAT_DELEGATED',409);
 await quota(a.seat.id);
 const status=b.status;
 if(!['participating','declined'].includes(status))throw new Fail('INVALID_STATUS');
 const text=status==='declined'?str(b.response||'',0,500):str(b.response||'',12,500);
 const availability=str(b.availability||'async',3,24);
 if(!['async','morning','afternoon','evening','weekend','unavailable'].includes(availability))throw new Fail('INVALID_AVAILABILITY');
 const share=status==='participating'&&b.shareToTable===true;
 const {error}=await db.from('seven_day_seats').update({status,availability,response:text,share_to_table:share,responded_at:new Date().toISOString()}).eq('id',a.seat.id).eq('room_id',a.room.id);
 if(error)throw new Fail('COULD_NOT_SAVE',503);return {ok:true,status,note:share?'Shared only within this private invited table.':'Private to table host; not published publicly.'};
}
async function close(b:any){const a=await authorize(b);if(a.role!=='host')throw new Fail('HOST_REQUIRED',403);
 const {error}=await db.from('seven_day_rooms').update({closed:true}).eq('id',a.room.id);if(error)throw new Fail('COULD_NOT_CLOSE',503);return {ok:true,closed:true};}
Deno.serve(async req=>{
 const u=new URL(req.url);
 if(req.method==='GET'||req.method==='HEAD')return new Response(req.method==='HEAD'?null:SITE,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=120','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':CSP}});
 if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
 // Origin check limits drive-by browser calls; cryptographic invitation tokens remain the actual authority.
 if(req.headers.get('origin')!==u.origin)return reply({error:'PAGE_ORIGIN_REQUIRED'},403);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return reply({error:'JSON_REQUIRED'},415);
 try{const b=await bounded(req);let out;
  switch(b.action){case'read':out=await read(b);break;case'seed':case'referral':case'ambassador':out=await createInvite(b);break;case'respond':out=await respond(b);break;case'close':out=await close(b);break;default:throw new Fail('UNKNOWN_ACTION');}
  return reply(out,b.action==='seed'||b.action==='referral'||b.action==='ambassador'?201:200);
 }catch(e){const x=e instanceof Fail?e:new Fail('SERVICE_UNAVAILABLE',503);return reply({error:x.message},x.status);}
});