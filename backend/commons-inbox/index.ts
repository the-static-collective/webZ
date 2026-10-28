// Living Receiver 002 — persistent, invitation-capability inbox, no real-world authority.
// Uses ONLY server-side Supabase service role; tables have RLS and no anon grants.
import {createClient} from "npm:@supabase/supabase-js@2.78.0";
import {inspectPacket} from "./receiver-protocol.mjs";

const URL=Deno.env.get("SUPABASE_URL")||"";
const SECRET=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
if(!URL||!SECRET)throw Error("SERVER_NOT_CONFIGURED");
const db=createClient(URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS=new Set([
 "https://apps.abundent.org","https://abundent-switchboard.vercel.app",
 "https://abundent.org","https://www.abundent.org"
]);
const ROOM=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN=/^[a-zA-Z0-9_-]{43}$/;
const PII=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s().-]{8,}\d|\b(?:client|guest|patient|resident)\s*(?:name|id|address|case)\b|\b(?:shelter address|home address|street address|account number|case number|exact location)\b|\b\d{1,5}\s+[a-z]+\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b)/i;
const JSON_HEADERS={"content-type":"application/json; charset=utf-8",
 "cache-control":"no-store, private","referrer-policy":"no-referrer",
 "x-content-type-options":"nosniff","cross-origin-resource-policy":"cross-origin"};
const TABLES={rooms:"commons_inbox_rooms",items:"commons_inbox_items",
 events:"commons_inbox_events"};
class Failure extends Error {constructor(code,status=400){super(code);this.status=status}}
function reply(value,status,origin){
 const headers={...JSON_HEADERS};
 if(ORIGINS.has(origin)){
  headers["access-control-allow-origin"]=origin;
  headers["vary"]="Origin";
  headers["access-control-allow-methods"]="POST, OPTIONS";
  headers["access-control-allow-headers"]="content-type";
 }
 return new Response(JSON.stringify(value),{status,headers});
}
async function sha(v){
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));
 return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,"0")).join("");
}
function secret(){
 const b=new Uint8Array(32);crypto.getRandomValues(b);
 return btoa(String.fromCharCode(...b)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
}
function clean(value,min,max){
 if(typeof value!=="string")throw new Failure("INVALID_TEXT");
 const s=value.trim().replace(/\s+/g," ");
 if(s.length<min||s.length>max||PII.test(s)||/https?:\/\//i.test(s))
  throw new Failure("USE_ONLY_NON_SENSITIVE_ORGANIZATIONAL_TEXT");
 return s;
}
function exact(obj,keys){
 if(!obj||typeof obj!=="object"||Array.isArray(obj)||
   Object.keys(obj).sort().join("|")!==[...keys].sort().join("|"))
  throw new Failure("UNKNOWN_REQUEST_FIELDS");
}
function canonical(v){
 if(Array.isArray(v))return "["+v.map(canonical).join(",")+"]";
 if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")+"}";
 return JSON.stringify(v);
}
async function jsonBody(req){
 const size=Number(req.headers.get("content-length")||0);
 if(size>18000)throw new Failure("BODY_TOO_LARGE",413);
 const chunks=[];let total=0;
 for await(const c of req.body??[]){total+=c.byteLength;if(total>18000)throw new Failure("BODY_TOO_LARGE",413);chunks.push(c)}
 const data=new Uint8Array(total);let at=0;
 for(const c of chunks){data.set(c,at);at+=c.byteLength}
 let value;
 try{value=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(data))}
 catch{throw new Failure("INVALID_JSON")}
 if(!value||typeof value!=="object"||Array.isArray(value))throw new Failure("INVALID_JSON");
 return value;
}
async function quota(key,period,max){
 const {data,error}=await db.rpc("commons_inbox_consume_quota",{
  p_key:key,p_period:period,p_max:max
 });
 if(error)throw new Failure("RATE_LIMIT_UNAVAILABLE",503);
 if(!data)throw new Failure("RATE_LIMITED",429);
}
async function limit(req,action,room=""){
 const now=new Date().toISOString();
 // Only pseudonymous daily counters are persisted; never raw IP addresses.
 const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||
   req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").slice(0,64);
 const fingerprint=(await sha("commons-inbox-v2|"+SECRET+"|"+now.slice(0,10)+"|"+ip)).slice(0,36);
 const day=now.slice(0,10),hour=now.slice(0,13).replace("T",":");
 if(action==="create"){
  await quota("create-ip:"+fingerprint,day,3);
  await quota("create-global",day,40);
 }else if(action==="submit"){
  await quota("submit-ip:"+fingerprint,day,25);
  await quota("submit-room:"+room,day,120);
 }else if(action==="event"){
  await quota("event-room:"+room,day,180);
 }else if(action==="open"){
  await quota("open-ip:"+fingerprint,hour,120);
 }
}
async function lookup(body){
 if(typeof body.roomId!=="string"||!ROOM.test(body.roomId)||
    typeof body.token!=="string"||!TOKEN.test(body.token))
  throw new Failure("INVITATION_NOT_FOUND",404);
 const {data,error}=await db.from(TABLES.rooms)
  .select("id,title,region,closed,owner_hash,reviewer_hash,submitter_hash,created_at")
  .eq("id",body.roomId).maybeSingle();
 if(error)throw new Failure("STORAGE_UNAVAILABLE",503);
 if(!data)throw new Failure("INVITATION_NOT_FOUND",404);
 const hash=await sha(body.token);
 const role=hash===data.owner_hash?"owner":
   hash===data.reviewer_hash?"reviewer":
   hash===data.submitter_hash?"submitter":null;
 if(!role)throw new Failure("INVITATION_NOT_FOUND",404);
 return {room:data,role};
}
function describe(room){
 return {id:room.id,title:room.title,region:room.region,closed:room.closed,
  createdAt:room.created_at};
}
async function create(body,req){
 exact(body,["action","title","region"]);
 const title=clean(body.title,4,90),region=clean(body.region,3,90);
 await limit(req,"create");
 const keys={owner:secret(),reviewer:secret(),submitter:secret()};
 const hashes=await Promise.all([keys.owner,keys.reviewer,keys.submitter].map(sha));
 const {data,error}=await db.from(TABLES.rooms)
  .insert({title,region,owner_hash:hashes[0],
     reviewer_hash:hashes[1],submitter_hash:hashes[2]})
  .select("id,title,region,closed,created_at").single();
 if(error)throw new Failure("CREATE_UNAVAILABLE",503);
 return {room:describe(data),role:"owner",keys,
  notice:"Capability links authorize actions, not identity or partner affiliation. Keep the owner key private; this response cannot be recovered later."};
}
async function open(body,req){
 exact(body,["action","roomId","token"]);
 const {room,role}=await lookup(body);
 await limit(req,"open",room.id);
 if(role==="submitter")return {room:describe(room),role,items:[],events:[]};
 const [{data:items,error:e1},{data:events,error:e2}]=await Promise.all([
  db.from(TABLES.items).select("id,kind,content_hash,packet,created_at")
   .eq("room_id",room.id).order("created_at",{ascending:false}).limit(80),
  db.from(TABLES.events).select("id,item_id,event_kind,actor_role,note,quantity_reported,unit,created_at")
   .eq("room_id",room.id).order("created_at",{ascending:false}).limit(160),
 ]);
 if(e1||e2)throw new Failure("INBOX_READ_UNAVAILABLE",503);
 return {room:describe(room),role,items:items||[],events:events||[],
  notice:"Unverified source cards and self-attested reviews. Do not infer signatures, service commitments or real-world outcomes."};
}
async function submit(body,req){
 exact(body,["action","roomId","token","packet"]);
 const {room,role}=await lookup(body);
 if(role!=="submitter"&&role!=="owner")throw new Failure("SUBMITTER_CAPABILITY_REQUIRED",403);
 if(room.closed)throw new Failure("INBOX_CLOSED",409);
 const string=JSON.stringify(body.packet);
 if(new TextEncoder().encode(string).byteLength>12500)throw new Failure("CARD_TOO_LARGE",413);
 if(PII.test(string))throw new Failure("REMOVE_PERSONAL_OR_CASE_DETAILS");
 let x;
 try{x=await inspectPacket(body.packet)}catch{throw new Failure("UNSAFE_OR_UNKNOWN_SOURCE_CARD")}
 if(!x.actionable||!["organizational-need","method-candidate"].includes(x.kind))
  throw new Failure("ONLY_ORIGINAL_HELD_CARDS_ALLOWED");
 await limit(req,"submit",room.id);
 const content_hash=await sha(canonical(x.packet));
 const {data,error}=await db.from(TABLES.items)
  .upsert({room_id:room.id,kind:x.kind,content_hash,packet:x.packet},
    {onConflict:"room_id,content_hash",ignoreDuplicates:true})
  .select("id,kind,content_hash,created_at").maybeSingle();
 if(error)throw new Failure("CARD_STORAGE_UNAVAILABLE",503);
 let item=data;
 if(!item){
  const found=await db.from(TABLES.items).select("id,kind,content_hash,created_at")
   .eq("room_id",room.id).eq("content_hash",content_hash).maybeSingle();
  if(found.error||!found.data)throw new Failure("CARD_LOOKUP_UNAVAILABLE",503);
  item=found.data;
 }
 return {ok:true,roomId:room.id,item,role,acceptedAs:"UNVERIFIED_SOURCE_CARD",
   stored:true,dispatch:false,receiptKind:"STORAGE_ACK_ONLY_NOT_SIGNED"};
}
function uuid(value){if(typeof value!=="string"||!ROOM.test(value))throw new Failure("INVALID_ITEM");return value}
async function decide(body,req){
 exact(body,["action","roomId","token","itemId","decision","reason"]);
 const {room,role}=await lookup(body);
 if(role!=="owner"&&role!=="reviewer")throw new Failure("REVIEWER_CAPABILITY_REQUIRED",403);
 if(room.closed)throw new Failure("INBOX_CLOSED",409);
 const itemId=uuid(body.itemId);
 const decision=body.decision;
 if(!["HOLD","REFUSE","ACCEPT_FOR_LOCAL_REVIEW"].includes(decision))
  throw new Failure("INVALID_DECISION");
 const note=clean(body.reason,12,220);
 const {data:item,error:readErr}=await db.from(TABLES.items)
  .select("id").eq("room_id",room.id).eq("id",itemId).maybeSingle();
 if(readErr||!item)throw new Failure("ITEM_NOT_IN_INBOX",404);
 await limit(req,"event",room.id);
 const {data,error}=await db.from(TABLES.events)
  .insert({room_id:room.id,item_id:itemId,event_kind:decision,
    actor_role:role,note}).select("id,item_id,event_kind,actor_role,note,created_at").single();
 if(error)throw new Failure("COULD_NOT_SAVE_REVIEW",503);
 return {ok:true,event:data,authority:"SELF_ATTESTED_CAPABILITY_NOT_IDENTITY",
  crossSystemAdmission:false,realWorldPermission:false};
}
async function report(body,req){
 exact(body,["action","roomId","token","itemId","status","summary","quantity","unit"]);
 const {room,role}=await lookup(body);
 if(role!=="owner"&&role!=="reviewer")throw new Failure("REVIEWER_CAPABILITY_REQUIRED",403);
 if(room.closed)throw new Failure("INBOX_CLOSED",409);
 const itemId=uuid(body.itemId);
 if(!["REPORTED_PARTIAL","REPORTED_COMPLETE","BLOCKED"].includes(body.status))
  throw new Failure("INVALID_REPORT_STATUS");
 const note=clean(body.summary,20,220);
 const quantity=Number(body.quantity),unit=body.unit;
 if(!Number.isSafeInteger(quantity)||quantity<0||quantity>100000||
   !["parcels","kg","meals","items","hours","kWh","sessions"].includes(unit))
  throw new Failure("INVALID_REPORTED_AMOUNT");
 if(body.status==="BLOCKED"&&quantity!==0||
    body.status==="REPORTED_COMPLETE"&&quantity===0)
  throw new Failure("REPORT_QUANTITY_CONTRADICTION");
 const [{data:item,error:e1},{data:prior,error:e2}]=await Promise.all([
  db.from(TABLES.items).select("id,kind,packet").eq("room_id",room.id).eq("id",itemId).maybeSingle(),
  db.from(TABLES.events).select("event_kind").eq("room_id",room.id).eq("item_id",itemId)
   .in("event_kind",["HOLD","REFUSE","ACCEPT_FOR_LOCAL_REVIEW"])
   .order("created_at",{ascending:false}).limit(1)
 ]);
 if(e1||e2||!item)throw new Failure("ITEM_NOT_IN_INBOX",404);
 if(!prior?.length||prior[0].event_kind!=="ACCEPT_FOR_LOCAL_REVIEW")
  throw new Failure("LOCAL_REVIEW_ACCEPTANCE_REQUIRED",409);
 if(item.kind==="organizational-need"){
  const requirement=item.packet?.need?.requirement;
  if(requirement?.unit!==unit||quantity>requirement.quantity)
   throw new Failure("REPORT_EXCEEDS_SOURCE_SCOPE",409);
 }else if(quantity!==0)throw new Failure("METHOD_CANDIDATE_HAS_NO_DELIVERY_QUANTITY",409);
 await limit(req,"event",room.id);
 const {data,error}=await db.from(TABLES.events)
  .insert({room_id:room.id,item_id:itemId,event_kind:body.status,
   actor_role:role,note,quantity_reported:quantity,unit})
  .select("id,item_id,event_kind,actor_role,note,quantity_reported,unit,created_at").single();
 if(error)throw new Failure("COULD_NOT_SAVE_REPORT",503);
 return {ok:true,event:data,verified:false,recipientConfirmed:false,
  capacityGranted:0,notice:"Reporter assertion only, not independent evidence of benefit."};
}
async function control(body){
 if(!["rotate","close","delete"].includes(body.action))throw new Failure("INVALID_CONTROL");
 const fields=body.action==="rotate"?["action","roomId","token","role"]:["action","roomId","token"];
 exact(body,fields);
 const {room,role}=await lookup(body);
 if(role!=="owner")throw new Failure("OWNER_CAPABILITY_REQUIRED",403);
 if(body.action==="rotate"){
  if(room.closed)throw new Failure("INBOX_CLOSED",409);
  if(!["reviewer","submitter"].includes(body.role))throw new Failure("INVALID_ROLE");
  const key=secret();
  const col=body.role+"_hash";
  const {error}=await db.from(TABLES.rooms).update({[col]:await sha(key),updated_at:new Date().toISOString()})
   .eq("id",room.id);
  if(error)throw new Failure("COULD_NOT_ROTATE",503);
  return {ok:true,role:body.role,key,oldCapabilityRevoked:true,
   notice:"Share new link explicitly. Previously issued role links no longer authorize access."};
 }
 if(body.action==="close"){
  const {error}=await db.from(TABLES.rooms).update({closed:true,updated_at:new Date().toISOString()})
   .eq("id",room.id);
  if(error)throw new Failure("COULD_NOT_CLOSE",503);
  return {ok:true,closed:true};
 }
 const {error}=await db.from(TABLES.rooms).delete().eq("id",room.id);
 if(error)throw new Failure("COULD_NOT_DELETE_INBOX",503);
 return {ok:true,deleted:true};
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="OPTIONS")return ORIGINS.has(origin)?
  new Response(null,{status:204,headers:{
   "access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS",
   "access-control-allow-headers":"content-type","access-control-max-age":"3600",
   "vary":"Origin"
  }}):new Response(null,{status:403});
 if(origin&&!ORIGINS.has(origin))return reply({error:"ORIGIN_NOT_ALLOWED"},403,"");
 if(req.method!=="POST")return reply({error:"METHOD_NOT_ALLOWED"},405,origin);
 try{
  const body=await jsonBody(req);
  const result=body.action==="create"?await create(body,req):
   body.action==="open"?await open(body,req):
   body.action==="submit"?await submit(body,req):
   body.action==="decide"?await decide(body,req):
   body.action==="report"?await report(body,req):
   await control(body);
  return reply(result,200,origin);
 }catch(e){
  if(e instanceof Failure)return reply({error:e.message},e.status,origin);
  // Never log a raw token, packet, or local personal text on unexpected errors.
  return reply({error:"INBOX_UNAVAILABLE"},503,origin);
 }
});
