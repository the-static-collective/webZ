import {validateIntake,publicProjection,sha256,secureEqualHex,LIMIT_BYTES} from './contract.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const err=(code,status=400)=>json({ok:false,error:code},status);
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
async function readLimited(req){
 const reader=req.body?.getReader();if(!reader)throw Error('EMPTY_BODY');
 let bytes=0,chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>LIMIT_BYTES){await reader.cancel();throw Error('PAYLOAD_TOO_LARGE');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const buf=new Uint8Array(bytes);let pos=0;for(const chunk of chunks){buf.set(chunk,pos);pos+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buf));}catch{throw Error('INVALID_JSON');}
}
// Store contract: create(row), listPublished(limit), listPending(limit), decide(id,action), withdraw(id,secretHash).
// No public table grants: only the backend uses a private service credential.
export function makeCommons({store,verifyChallenge=async()=>false,intakeEnabled=false,galleryEnabled=false,allowedOrigin='',moderatorTokenHash=''}){
 return async function handle(req){
  const url=new URL(req.url);const route=url.pathname.replace(/^.*\/giving-tree-commons(?=\/|$)/,'').replace(/\/$/,'')||'/';
  const origin=req.headers.get('origin');
  if(origin&&origin!==allowedOrigin)return err('ORIGIN_NOT_ALLOWED',403);
  if(req.method==='OPTIONS'){
   if(!allowedOrigin||origin!==allowedOrigin)return err('ORIGIN_NOT_ALLOWED',403);
   return new Response(null,{status:204,headers:{'access-control-allow-origin':allowedOrigin,'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'content-type, authorization','access-control-max-age':'600','vary':'origin'}});
  }
  const respond=(data,status=200)=>{const response=json(data,status);if(origin&&origin===allowedOrigin){response.headers.set('access-control-allow-origin',allowedOrigin);response.headers.set('vary','origin');}return response;};
  try{
   if(req.method==='GET'&&route==='/health')return respond({ok:true,intakeOpen:intakeEnabled,galleryOpen:galleryEnabled,review:'HUMAN_ONLY',rightsVerified:false});
   if(req.method==='GET'&&route==='/gifts'){
    if(!galleryEnabled)return respond({ok:false,error:'GALLERY_ON_HOLD'},503);
    const rows=await store.listPublished(20);return respond({ok:true,gifts:rows.map(publicProjection),notice:'Publication was reviewed, but identity and underlying rights were not authenticated. Withdrawn items may remain in prior copies.'});
   }
   if(req.method==='POST'&&route==='/submit'){
    if(!intakeEnabled)return respond({ok:false,error:'INTAKE_ON_HOLD'},503);
    const data=await readLimited(req);
    if(!isObj(data)||typeof data.challengeToken!=='string'||data.challengeToken.length>4096||data.challengeToken.length<10)return respond({ok:false,error:'BOT_CHALLENGE_REQUIRED'},403);
    if(!await verifyChallenge(data.challengeToken))return respond({ok:false,error:'BOT_CHALLENGE_FAILED'},403);
    const item=await validateIntake(data);
    const withdrawalToken=hexToken();const withdrawalHash=await sha256(withdrawalToken);
    const row=await store.create({...item,withdrawal_sha256:withdrawalHash});
    return respond({ok:true,status:'PENDING_HUMAN_REVIEW',id:row.id,digest:item.digest,withdrawalToken,warning:'Keep the withdrawal token private. Submission does not guarantee publication.'},202);
   }
   if(req.method==='POST'&&route==='/withdraw'){
    const data=await readLimited(req);
    if(!isObj(data)||!/^[0-9a-f-]{36}$/.test(data.id||'')||typeof data.withdrawalToken!=='string'||data.withdrawalToken.length!==64)return respond({ok:false,error:'INVALID_WITHDRAWAL_REQUEST'},400);
    const affected=await store.withdraw(data.id,await sha256(data.withdrawalToken));
    return respond({ok:affected,withdrawn:affected,notice:'Withdrawal stops future gallery delivery; copies previously downloaded cannot be recalled.'},affected?200:404);
   }
   if((route==='/review'||route==='/queue')&&(req.method==='GET'||req.method==='POST')){
    const auth=req.headers.get('authorization')||'';const match=/^Bearer ([0-9a-f]{64})$/.exec(auth);
    const candidate=match?await sha256(match[1]):'';
    if(!await secureEqualHex(moderatorTokenHash,candidate))return respond({ok:false,error:'REVIEWER_AUTH_REQUIRED'},401);
    if(req.method==='GET'&&route==='/queue')return respond({ok:true,pending:await store.listPending(25)});
    if(req.method==='POST'&&route==='/review'){
     const data=await readLimited(req);if(!isObj(data)||!/^[0-9a-f-]{36}$/.test(data.id||'')||!['PUBLISH','REJECT'].includes(data.action))return respond({ok:false,error:'INVALID_REVIEW'},400);
     const changed=await store.decide(data.id,data.action);return respond({ok:changed,decision:changed?data.action:null},changed?200:409);
    }
   }
   return respond({ok:false,error:'NOT_FOUND'},404);
  }catch(e){
   if(e.message==='PAYLOAD_TOO_LARGE')return respond({ok:false,error:e.message},413);
   if(['INVALID_JSON','EMPTY_BODY'].includes(e.message))return respond({ok:false,error:e.message},400);
   if(['EXPLICIT_PUBLIC_CONSENT_REQUIRED','INVALID_OR_OVERSIZED_SUBMISSION','UNKNOWN_RIGHTS_NOT_PUBLIC'].includes(e.message)||e.message.startsWith('INVALID_')||e.message.endsWith('_MISMATCH'))return respond({ok:false,error:e.message},422);
   if(e.message==='DUPLICATE_GIFT')return respond({ok:false,error:'ALREADY_SUBMITTED'},409);
   return respond({ok:false,error:'SERVER_HOLD'},503);
  }
 };
}
function hexToken(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');}
