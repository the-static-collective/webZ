// INVITATION NETWORK 002: bounded public threads, consented in-app notifications,
// and mutually acknowledged match receipts. No identity claims or unsolicited email.
// A public invitation is not a permission to contact, match, transfer, or enroll.
import {createClient} from "npm:@supabase/supabase-js@2.78.0";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||
  (()=>{try{return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default||""}catch{return ""}})();
if(!SUPABASE_URL||!KEY)throw Error("SERVER_NOT_CONFIGURED");
const db=createClient(SUPABASE_URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS=new Set(["https://abundent.org","https://www.abundent.org","https://webz.abundent.org"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_ID=/^[0-9a-f-]{16,64}$/i;
const KEYFORM=/^[A-Za-z0-9_-]{43}$/;
const PII=/(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?\d[\d\s().-]{8,}\d)\b|\b\d{1,5}\s+\w+(?:\s+\w+){0,3}\s+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr)\b|https?:\/\/|www\.|<[^>]*>|\b(?:password|social security|credit card|account number|medical record)\b)/i;
const LANES=new Set(["creative","food","transport","make","question","open"]);
const TIMES=new Set(["now","soon","open"]);
const INTENTS=new Set(["offer","need","question","open"]);
const POST_KINDS=new Set(["offer","need","question","act","open"]);
const QUERY_LIMIT=15;
class Refusal extends Error{constructor(msg,status=400){super(msg);this.status=status}}
const failure=(msg,status=400)=>{throw new Refusal(msg,status)};
function reply(body,status=200,origin=""){
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","cross-origin-resource-policy":"cross-origin"};
 if(ORIGINS.has(origin)){headers["access-control-allow-origin"]=origin;headers["access-control-allow-methods"]="POST,OPTIONS";headers["access-control-allow-headers"]="content-type";headers["vary"]="Origin"}
 return new Response(JSON.stringify(body),{status,headers});
}
function exact(v,fields){
 if(!v||typeof v!=="object"||Array.isArray(v)||Object.keys(v).sort().join("|")!==fields.slice().sort().join("|"))failure("INVALID_FIELDS");
}
function clean(x,min,max){
 if(typeof x!=="string")failure("TEXT_REQUIRED");
 const t=x.replace(/[\u0000-\u001f\u007f]/g," ").trim().replace(/\s+/g," ");
 if(t.length<min||t.length>max||PII.test(t))failure("PUBLIC_SAFE_WORDS_ONLY");
 return t;
}
const isUUID=v=>typeof v==="string"&&UUID.test(v);
function validKey(key){if(typeof key!=="string"||!KEYFORM.test(key))failure("INVALID_PRIVATE_RECEIPT")}
async function hash(s){const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function token(){const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"")}
async function body(req){
 if(!(req.headers.get("content-type")||"").startsWith("application/json"))failure("JSON_REQUIRED",415);
 if(Number(req.headers.get("content-length")||0)>2900)failure("TOO_LARGE",413);
 let size=0;const pieces=[];
 for await(const chunk of req.body||[]){size+=chunk.byteLength;if(size>2900)failure("TOO_LARGE",413);pieces.push(chunk)}
 const bytes=new Uint8Array(size);let at=0;for(const p of pieces){bytes.set(p,at);at+=p.length}
 try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes))}catch{failure("INVALID_JSON")}
}
function project(t){return {id:t.id,invitationId:t.invitation_id,words:t.words,lane:t.lane,timing:t.timing,intent:t.intent,state:t.state,createdAt:t.created_at,expiresAt:t.expires_at}}
const publicThread=t=>t&&t.state==="PUBLIC"&&new Date(t.expires_at).getTime()>Date.now();
async function quota(req,kind,thread=""){
 const now=new Date();const date=now.toISOString().slice(0,10),hour=now.toISOString().slice(0,13);
 const raw=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").slice(0,96);
 const ip=(await hash("IC02|"+KEY+"|"+date+"|"+raw)).slice(0,40);
 const daily=new Date(now);daily.setUTCHours(24,0,0,0);
 const hourly=new Date(now.getTime()+3600000);
 const limits={create:4,reply:15,watch:12,discover:100,read:250,poll:600,match:45,report:10,withdraw:12};
 const dailyMax=limits[kind]||12;
 for(const [bucket,slot,max,until] of [[kind+":ip:"+ip,date,dailyMax,daily],[kind+":global",hour,kind==="poll"?2500:kind==="read"?1200:300,hourly]]){
  const {data,error}=await db.rpc("ic02_consume_quota",{p_bucket:bucket,p_slot:slot,p_limit:max,p_expires:until.toISOString()});
  if(error)failure("QUOTA_UNAVAILABLE",503);
  if(!data)failure("PLEASE_TRY_AGAIN_LATER",429);
 }
 if(thread&&(kind==="reply"||kind==="watch"||kind==="match")){
  const {data,error}=await db.rpc("ic02_consume_quota",{p_bucket:kind+":thread:"+thread,p_slot:date,p_limit:kind==="reply"?120:kind==="watch"?80:100,p_expires:daily.toISOString()});
  if(error)failure("QUOTA_UNAVAILABLE",503);if(!data)failure("THREAD_BUSY",429);
 }
}
async function getThread(id,includeOwner=false){
 if(!isUUID(id))failure("THREAD_NOT_FOUND",404);
 const {data,error}=await db.from("ic02_threads").select(includeOwner?"*":"id,invitation_id,words,lane,timing,intent,state,created_at,expires_at").eq("id",id).maybeSingle();
 if(error)failure("STORAGE_UNAVAILABLE",503);if(!data)failure("THREAD_NOT_FOUND",404);return data;
}
async function create(b,req){
 exact(b,["action","invitationId","words","lane","timing","intent","consent"]);
 if(b.consent!==true||typeof b.invitationId!=="string"||!PUBLIC_ID.test(b.invitationId)||!LANES.has(b.lane)||!TIMES.has(b.timing)||!INTENTS.has(b.intent))failure("PUBLIC_CONSENT_AND_DECLARATION_REQUIRED");
 const words=clean(b.words,8,240);await quota(req,"create");
 const key=token();
 const {data,error}=await db.from("ic02_threads").insert({invitation_id:b.invitationId,words,lane:b.lane,timing:b.timing,intent:b.intent,owner_hash:await hash(key)}).select("*").single();
 if(error){if(error.code==="23505")failure("INVITATION_ALREADY_PUBLISHED",409);failure("CREATE_UNAVAILABLE",503)}
 return {schema:"abundent/invitation-thread-v1",thread:project(data),ownerKey:key,notice:"Public for up to 30 days. Keep this private key; it is required to withdraw the public thread or confirm a proposed match. The link alone grants no authority."};
}
async function readThread(b,req){
 exact(b,["action","threadId"]);await quota(req,"read");
 const t=await getThread(b.threadId);
 if(!publicThread(t))failure("THREAD_UNAVAILABLE",404);
 const [{data:posts,error:e1},{data:matches,error:e2}]=await Promise.all([
  db.from("ic02_posts").select("id,thread_id,kind,words,state,created_at").eq("thread_id",t.id).eq("state","PUBLIC").order("created_at",{ascending:true}).limit(120),
  db.from("ic02_matches").select("id,post_id,state,owner_agreed,responder_agreed,created_at").eq("thread_id",t.id).limit(100)
 ]);
 if(e1||e2)failure("THREAD_UNAVAILABLE",503);
 return {schema:"abundent/invitation-conversation-v1",thread:project(t),posts:(posts||[]).map(p=>({id:p.id,kind:p.kind,words:p.words,createdAt:p.created_at})),matches:(matches||[]).map(x=>({id:x.id,postId:x.post_id,state:x.state,ownerAgreed:x.owner_agreed,responderAgreed:x.responder_agreed})),notice:"Public contributions are self-declared. A match requires two separate receipt confirmations; that is not proof of identity, delivery or real-world safety."};
}
async function respond(b,req){
 exact(b,["action","threadId","kind","words","consent"]);
 if(b.consent!==true||!POST_KINDS.has(b.kind))failure("PUBLIC_CONSENT_REQUIRED");
 const words=clean(b.words,5,240);
 const t=await getThread(b.threadId);
 if(!publicThread(t))failure("THREAD_UNAVAILABLE",404);
 await quota(req,"reply",t.id);
 const key=token();
 const {data,error}=await db.from("ic02_posts").insert({thread_id:t.id,kind:b.kind,words,receipt_hash:await hash(key)}).select("id,kind,words,created_at").single();
 if(error)failure("REPLY_UNAVAILABLE",503);
 return {schema:"abundent/invitation-reply-v1",post:{id:data.id,kind:data.kind,words:data.words,createdAt:data.created_at},replyKey:key,notice:"This reply is publicly visible. Save the private reply key if you want to retract or confirm a match. Active opt-in watchers receive a notification automatically."};
}
async function watch(b,req){
 exact(b,["action","threadId","consent"]);
 if(b.consent!==true)failure("WATCH_OPT_IN_REQUIRED");
 const t=await getThread(b.threadId);if(!publicThread(t))failure("THREAD_UNAVAILABLE",404);
 await quota(req,"watch",t.id);
 const key=token();
 const {error}=await db.from("ic02_watches").insert({thread_id:t.id,token_hash:await hash(key)});
 if(error)failure("WATCH_UNAVAILABLE",503);
 return {schema:"abundent/invitation-watch-v1",watchKey:key,threadId:t.id,expiresAt:t.expires_at,delivery:"IN_APP_WHILE_PAGE_OPEN",notice:"This anonymous receipt enables in-app checks while the page is open. No email, SMS or background push subscription has been created."};
}
async function poll(b,req){
 exact(b,["action","watchKey","after"]);
 validKey(b.watchKey);
 if(!Number.isSafeInteger(b.after)||b.after<0)failure("INVALID_CURSOR");
 await quota(req,"poll");
 const {data:watch,error}=await db.from("ic02_watches").select("id,thread_id,expires_at").eq("token_hash",await hash(b.watchKey)).gt("expires_at",new Date().toISOString()).maybeSingle();
 if(error)failure("NOTIFICATIONS_UNAVAILABLE",503);
 if(!watch)failure("WATCH_UNAVAILABLE",404);
 const {data:events,error:err}=await db.from("ic02_notices").select("seq,kind,summary,created_at").eq("watch_id",watch.id).gt("seq",b.after).order("seq",{ascending:true}).limit(25);
 if(err)failure("NOTIFICATIONS_UNAVAILABLE",503);
 return {schema:"abundent/invitation-notifications-v1",threadId:watch.thread_id,events:(events||[]).map(x=>({seq:Number(x.seq),kind:x.kind,summary:x.summary,at:x.created_at})),nextCursor:events?.length?Number(events[events.length-1].seq):b.after};
}
async function unwatch(b,req){
 exact(b,["action","watchKey"]);validKey(b.watchKey);
 await quota(req,"withdraw");
 const digest=await hash(b.watchKey);
 const {data,error}=await db.from("ic02_watches").delete().eq("token_hash",digest).select("id").maybeSingle();
 if(error)failure("UNSUBSCRIBE_UNAVAILABLE",503);
 return {state:"UNSUBSCRIBED",deleted:Boolean(data),notice:"The watch receipt and associated queued notifications have been deleted. No further in-app alerts will be delivered to it."};
}
async function discover(b,req){
 exact(b,["action","lane","intent"]);
 if(!LANES.has(b.lane)||!INTENTS.has(b.intent))failure("INVALID_DISCOVERY");
 await quota(req,"discover");
 const counterpart=b.intent==="offer"?"need":b.intent==="need"?"offer":null;
 const query=db.from("ic02_threads").select("id,invitation_id,words,lane,timing,intent,state,created_at,expires_at")
  .eq("lane",b.lane).eq("state","PUBLIC").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(50);
 const {data,error}=await (counterpart?query.eq("intent",counterpart):query);
 if(error)failure("DISCOVERY_UNAVAILABLE",503);
 const results=(data||[]).sort((a,b)=>(a.timing==="now"?1:0)===(b.timing==="now"?1:0)?Date.parse(b.created_at)-Date.parse(a.created_at):(a.timing==="now"?-1:1)).slice(0,QUERY_LIMIT).map(project);
 return {schema:"abundent/invitation-candidates-v1",candidates:results,verified:false,notice:"These are possible related public invitations, not matches. Verify availability and consent directly before proceeding."};
}
async function findPost(threadId,postId){
 if(!isUUID(postId))failure("POST_NOT_FOUND",404);
 const {data,error}=await db.from("ic02_posts").select("*").eq("id",postId).eq("thread_id",threadId).maybeSingle();
 if(error)failure("STORAGE_UNAVAILABLE",503);
 if(!data||data.state!=="PUBLIC")failure("POST_NOT_FOUND",404);
 return data;
}
function compatible(t,p){return (t.intent==="need"&&p.kind==="offer")||(t.intent==="offer"&&p.kind==="need")}
async function proposeMatch(b,req){
 exact(b,["action","threadId","postId","key","consent"]);
 if(b.consent!==true)failure("MATCH_CONSENT_REQUIRED");validKey(b.key);
 const t=await getThread(b.threadId,true);
 if(!publicThread(t))failure("THREAD_UNAVAILABLE",404);
 const p=await findPost(t.id,b.postId);
 if(!compatible(t,p))failure("NOT_A_COMPLEMENTARY_OFFER_AND_NEED");
 const digest=await hash(b.key);
 if(digest!==t.owner_hash&&digest!==p.receipt_hash)failure("MATCH_RECEIPT_REQUIRED",403);
 await quota(req,"match",t.id);
 const {data:found,error:e}=await db.from("ic02_matches").select("id,thread_id,post_id,state,owner_agreed,responder_agreed").eq("post_id",p.id).maybeSingle();
 if(e)failure("STORAGE_UNAVAILABLE",503);
 if(found)return {match:{id:found.id,state:found.state,ownerAgreed:found.owner_agreed,responderAgreed:found.responder_agreed},notice:"Proposal already exists. Both key holders may decide separately."};
 const {data,error}=await db.from("ic02_matches").insert({thread_id:t.id,post_id:p.id}).select("id,state,owner_agreed,responder_agreed").single();
 if(error){if(error.code==="23505")failure("MATCH_ALREADY_PROPOSED_RELOAD",409);failure("MATCH_UNAVAILABLE",503)}
 return {match:{id:data.id,state:data.state,ownerAgreed:data.owner_agreed,responderAgreed:data.responder_agreed},notice:"Possible match proposed, not agreed to or verified. Both participants must confirm."};
}
async function confirmMatch(b,req){
 exact(b,["action","matchId","key"]);
 validKey(b.key);if(!isUUID(b.matchId))failure("MATCH_NOT_FOUND",404);
 await quota(req,"match");
 const {data:m,error}=await db.from("ic02_matches").select("*").eq("id",b.matchId).maybeSingle();
 if(error)failure("MATCH_UNAVAILABLE",503);if(!m)failure("MATCH_NOT_FOUND",404);
 const t=await getThread(m.thread_id,true);const p=await findPost(t.id,m.post_id);
 if(!publicThread(t)||!compatible(t,p))failure("MATCH_UNAVAILABLE",404);
 const digest=await hash(b.key);
 let field;if(digest===t.owner_hash)field="owner_agreed";else if(digest===p.receipt_hash)field="responder_agreed";else failure("MATCH_RECEIPT_REQUIRED",403);
 if(m[field]!==true){
  const {error:err}=await db.from("ic02_matches").update({[field]:true}).eq("id",m.id);
  if(err)failure("MATCH_CONFIRMATION_UNAVAILABLE",503);
 }
 const {data:after,error:e2}=await db.from("ic02_matches").select("id,state,owner_agreed,responder_agreed").eq("id",m.id).single();
 if(e2)failure("MATCH_UNAVAILABLE",503);
 return {schema:"abundent/invitation-match-receipt-v1",match:{id:after.id,state:after.state,ownerAgreed:after.owner_agreed,responderAgreed:after.responder_agreed},verification:"TWO_CAPABILITY_RECEIPTS_ONLY",realWorldOutcomeVerified:false,notice:after.state==="MUTUALLY_ACKNOWLEDGED"?"Both distinct receipt holders confirmed interest. No identity, safety, physical transfer or completion was independently verified.":"Your receipt is acknowledged. The other side has not yet agreed."};
}
async function withdraw(b,req){
 exact(b,["action","threadId","postId","key"]);
 validKey(b.key);const t=await getThread(b.threadId,true);
 await quota(req,"withdraw");
 const digest=await hash(b.key);
 if(b.postId===null){
  if(digest!==t.owner_hash)failure("OWNER_RECEIPT_REQUIRED",403);
  const {error}=await db.from("ic02_threads").update({state:"CLOSED"}).eq("id",t.id);
  if(error)failure("WITHDRAWAL_UNAVAILABLE",503);
 }else{
  const p=await findPost(t.id,b.postId);
  if(digest!==p.receipt_hash)failure("REPLY_RECEIPT_REQUIRED",403);
  const {error}=await db.from("ic02_posts").update({state:"REMOVED"}).eq("id",p.id);
  if(error)failure("WITHDRAWAL_UNAVAILABLE",503);
 }
 return {state:"WITHDRAWN",notice:"The public entry is hidden from this service. Copies others already saved or forwarded cannot be recalled."};
}
async function report(b,req){
 exact(b,["action","threadId","postId","reason"]);
 if(!["private","unsafe","spam"].includes(b.reason))failure("INVALID_REASON");
 const t=await getThread(b.threadId);
 if(!publicThread(t))failure("THREAD_UNAVAILABLE",404);
 if(b.postId!==null)await findPost(t.id,b.postId);
 await quota(req,"report");
 const date=new Date().toISOString().slice(0,10);
 const raw=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").slice(0,96);
 const digest=(await hash("ic02-report|"+KEY+"|"+date+"|"+raw)).slice(0,40);
 const {error}=await db.from("ic02_reports").insert({thread_id:t.id,post_id:b.postId,reporter_digest:digest,reason:b.reason});
 if(error)failure("REPORT_UNAVAILABLE",503);
 const q=db.from("ic02_reports").select("reporter_digest").eq("thread_id",t.id);
 const {data:reports,error:e}=await (b.postId===null?q.is("post_id",null):q.eq("post_id",b.postId));
 if(e)failure("REPORT_UNAVAILABLE",503);
 if(new Set((reports||[]).map(x=>x.reporter_digest)).size>=3){
  const table=b.postId===null?"ic02_threads":"ic02_posts";
  const {error:hold}=await db.from(table).update({state:"HIDDEN"}).eq("id",b.postId||t.id);
  if(hold)failure("HOLD_UNAVAILABLE",503);
 }
 return {state:"REPORTED",notice:"Report recorded. Three distinct reporting fingerprints hide an entry pending manual review; reports are not proof of wrongdoing."};
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="GET"&&new URL(req.url).pathname.endsWith("/health"))
  return reply({ok:true,service:"invitation-network-002",publicThreads:true,automaticDelivery:"ACTIVE_PAGE_POLL",matching:"TWO_RECEIPT_ACK",email:false,push:false});
 if(!ORIGINS.has(origin))return reply({error:"ORIGIN_NOT_ALLOWED"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"content-type","vary":"Origin","cache-control":"no-store"}});
 if(req.method!=="POST")return reply({error:"METHOD_NOT_ALLOWED"},405,origin);
 try{
  const b=await body(req);
  if(!b||typeof b.action!=="string")failure("INVALID_ACTION");
  const actions={publish:create,read:readThread,reply:respond,watch,poll,unwatch,discover,"propose-match":proposeMatch,"confirm-match":confirmMatch,withdraw,report};
  if(!Object.prototype.hasOwnProperty.call(actions,b.action))failure("UNKNOWN_ACTION");
  const result=await actions[b.action](b,req);
  return reply(result,b.action==="publish"||b.action==="reply"||b.action==="watch"?201:200,origin);
 }catch(e){return e instanceof Refusal?reply({error:e.message},e.status,origin):reply({error:"SERVICE_UNAVAILABLE"},503,origin)}
});
