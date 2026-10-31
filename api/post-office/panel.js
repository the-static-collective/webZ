/**
 * Post Office 007: owner email-code sign-in and reviewed one-button dispatch.
 * The operator token and Resend key never cross into the browser.
 * No URL query/cookie secrets; no arbitrary recipients or message editing.
 */
import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {makeOutreachHandler,OUTBOX} from './outreach.js';

const COOKIE='abundent_post_office';
const STEP_MS=20*60*1000;
const SESSION_MS=2*60*60*1000;
const FROM='The Static Collective <us@abundent.org>';
const ID_RE=/^[a-z0-9][a-z0-9-]{1,80}$/;

function json(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, private, max-age=0');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Vary','Cookie');
  res.end(JSON.stringify(payload));
}
function safeEqual(a,b){
  if(typeof a!=='string'||typeof b!=='string')return false;
  const aa=Buffer.from(a),bb=Buffer.from(b);
  return aa.length===bb.length && timingSafeEqual(aa,bb);
}
function hmac(secret,part){
  return createHmac('sha256',secret).update('post-office-panel-v1:').update(part).digest('hex');
}
function otp(secret,bucket){
  const digest=createHmac('sha256',secret).update('post-office-panel-otp-v1:'+bucket).digest();
  return String(digest.readBigUInt64BE(0)%1000000000000n).padStart(12,'0');
}
function validConfig(env){
  return env.POST_OFFICE_PANEL_ENABLED==='1'
    && typeof env.POST_OFFICE_OPERATOR_TOKEN==='string'
    && env.POST_OFFICE_OPERATOR_TOKEN.length>=32;
}
function cookieValue(req){
  const c=typeof req.headers?.cookie==='string'?req.headers.cookie:'';
  const found=c.split(';').map(p=>p.trim()).find(p=>p.startsWith(COOKIE+'='));
  return found?found.slice(COOKIE.length+1):'';
}
function sessionFor(req,secret,now){
  const value=cookieValue(req);
  const m=/^v1\.(\d{13})\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(value);
  if(!m)return null;
  const issued=Number(m[1]);
  if(!Number.isSafeInteger(issued)||issued>now+30000||now-issued>SESSION_MS)return null;
  const material='v1.'+m[1]+'.'+m[2];
  if(!safeEqual(m[3],hmac(secret,'session:'+material)))return null;
  return {cookie:value,csrf:hmac(secret,'csrf:'+value)};
}
function makeSession(secret,now){
  const material='v1.'+String(now)+'.'+randomBytes(16).toString('hex');
  return material+'.'+hmac(secret,'session:'+material);
}
function shape(input,maxBytes=1024){
  if(Buffer.isBuffer(input))input=input.toString('utf8');
  if(typeof input==='string'){
    if(Buffer.byteLength(input,'utf8')>maxBytes)return null;
    try{input=JSON.parse(input)}catch{return null}
  }
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  if(Buffer.byteLength(JSON.stringify(input),'utf8')>maxBytes)return null;
  return input;
}
function keysAre(x,expected){
  return Object.keys(x).sort().join(',')===expected.split(',').sort().join(',');
}
function sameOrigin(req){
  const origin=req.headers?.origin;
  const host=req.headers?.host;
  return typeof origin==='string'&&typeof host==='string'
    && origin==='https://'+host
    && req.headers?.['sec-fetch-site']!=='cross-site';
}
function validInbox(value){
  return typeof value==='string'&&value.length<255
    && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)
    && !/[\r\n]/.test(value);
}
function clearedCookie(){
  return COOKIE+'=; Path=/api/post-office/panel; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}
export function makePanelHandler({env=process.env,send=fetch,clock=()=>Date.now()}={}){
  return async function handler(req,res){
    if(!validConfig(env))return json(res,503,{state:'HOLD',reason:'panel-not-configured'});
    if(req.method!=='GET'&&req.method!=='POST'){
      res.setHeader('Allow','GET, POST');
      return json(res,405,{state:'HOLD',reason:'method-not-allowed'});
    }
    const secret=env.POST_OFFICE_OPERATOR_TOKEN;
    const now=clock();
    const session=sessionFor(req,secret,now);
    if(req.method==='GET'){
      if(!session)return json(res,401,{state:'LOCKED'});
      const messages=Object.entries(OUTBOX).map(([messageId,m])=>({
        messageId,to:m.to,subject:m.subject,text:m.text,from:FROM,
        status:'REVIEW_REQUIRED_NOT_SENT_BY_THIS_ACTION'
      }));
      return json(res,200,{state:'AUTHORIZED',csrf:session.csrf,messages});
    }
    if(req.headers?.['content-type']?.split(';')[0].trim()!=='application/json'||!sameOrigin(req)){
      return json(res,403,{state:'HOLD',reason:'same-origin-json-required'});
    }
    const body=shape(req.body,30000);
    if(!body||typeof body.action!=='string'||(!body.action.startsWith('draft-')&&Buffer.byteLength(JSON.stringify(body),'utf8')>1024))return json(res,400,{state:'HOLD',reason:'invalid-command'});
    if(body.action==='request-code'){
      if(!keysAre(body,'action'))return json(res,400,{state:'HOLD',reason:'invalid-command'});
      if(!validInbox(env.POST_OFFICE_TEST_TO)||typeof env.RESEND_API_KEY!=='string'||env.RESEND_API_KEY.length<12){
        return json(res,503,{state:'HOLD',reason:'private-owner-inbox-or-mail-provider-unready'});
      }
      const bucket=Math.floor(now/STEP_MS);
      const pin=otp(secret,bucket);
      const message={
        from:FROM,
        to:[env.POST_OFFICE_TEST_TO],
        reply_to:'us@abundent.org',
        subject:'Abundent Post Office — operator sign-in code',
        text:[
          'A request was made to unlock the Abundent Post Office operator panel.',
          '',
          'Your sign-in code: '+pin,
          '',
          'Enter the code only on the Abundent Post Office page you opened yourself.',
          'Code expires within 40 minutes. If you did not request it, ignore this email.',
          'This message does not authorize any external outreach.'
        ].join('\n')
      };
      try{
        // One provider-idempotent request per 20-minute bucket; not a full anti-abuse throttle.
        const upstream=await send('https://api.resend.com/emails',{
          method:'POST',
          headers:{
            Authorization:'Bearer '+env.RESEND_API_KEY,
            'Content-Type':'application/json',
            'Idempotency-Key':'postoffice007-login-'+hmac(secret,'login-bucket:'+bucket).slice(0,48)
          },
          body:JSON.stringify(message),
          signal:AbortSignal.timeout(15000)
        });
        if(!upstream.ok)return json(res,502,{state:'HOLD',reason:'owner-code-not-accepted',providerStatus:upstream.status});
        const receipt=await upstream.json();
        if(typeof receipt?.id!=='string'||!receipt.id)return json(res,502,{state:'HOLD',reason:'owner-code-receipt-unverified'});
        return json(res,202,{state:'CODE_PROVIDER_ACCEPTED',delivered:false,
          message:'Check the existing private owner receiving inbox; no login information is disclosed here.'});
      }catch{return json(res,502,{state:'HOLD',reason:'owner-code-provider-unreachable'})}
    }
    if(body.action==='verify-code'){
      if(!keysAre(body,'action,code')||typeof body.code!=='string'||!/^[0-9]{12}$/.test(body.code)){
        return json(res,400,{state:'HOLD',reason:'invalid-code-format'});
      }
      const bucket=Math.floor(now/STEP_MS);
      if(!safeEqual(body.code,otp(secret,bucket))&&!safeEqual(body.code,otp(secret,bucket-1))){
        return json(res,401,{state:'HOLD',reason:'invalid-or-expired-code'});
      }
      const signed=makeSession(secret,now);
      res.setHeader('Set-Cookie',COOKIE+'='+signed+'; Path=/api/post-office/panel; HttpOnly; Secure; SameSite=Strict; Max-Age=7200');
      return json(res,200,{state:'SIGNED_IN',message:'Operator session expires in two hours.'});
    }
    if(!session)return json(res,401,{state:'LOCKED'});
    if(!safeEqual(req.headers?.['x-post-office-csrf'],session.csrf)){
      return json(res,403,{state:'HOLD',reason:'session-csrf-required'});
    }
    if(['draft-list','draft-save','draft-delete'].includes(body.action)){
      const bridgeUrl=env.POST_OFFICE_DRAFTS_BRIDGE_URL;
      const bridgeKey=env.POST_OFFICE_DRAFTS_BRIDGE_KEY;
      if(typeof bridgeUrl!=='string'||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/post-office-drafts$/.test(bridgeUrl)
        ||typeof bridgeKey!=='string'||bridgeKey.length<40){
        return json(res,503,{state:'HOLD',reason:'private-drafts-not-configured'});
      }
      let command;
      if(body.action==='draft-list'&&keysAre(body,'action'))command={action:'list'};
      else if(body.action==='draft-save'&&keysAre(body,'action,draft,revision')){
        command={action:'save',draft:body.draft,revision:body.revision};
      }else if(body.action==='draft-delete'&&keysAre(body,'action,id,revision')){
        command={action:'delete',id:body.id,revision:body.revision};
      }else return json(res,400,{state:'HOLD',reason:'invalid-draft-command'});
      try{
        const remote=await send(bridgeUrl,{method:'POST',headers:{
          'content-type':'application/json','x-post-office-bridge-key':bridgeKey
        },body:JSON.stringify(command),signal:AbortSignal.timeout(12000)});
        let result;try{result=await remote.json()}catch{result=null}
        if(!result||typeof result.state!=='string')return json(res,502,{state:'HOLD',reason:'invalid-drafts-response'});
        return json(res,remote.status,result);
      }catch{return json(res,502,{state:'HOLD',reason:'drafts-bridge-unavailable'})}
    }
    if(body.action==='logout'){
      if(!keysAre(body,'action'))return json(res,400,{state:'HOLD',reason:'invalid-command'});
      res.setHeader('Set-Cookie',clearedCookie());
      return json(res,200,{state:'SIGNED_OUT'});
    }
    if(body.action==='send'){
      if(!keysAre(body,'action,confirm,messageId')||body.confirm!=='SEND'
          ||typeof body.messageId!=='string'||!ID_RE.test(body.messageId)||!Object.hasOwn(OUTBOX,body.messageId)){
        return json(res,400,{state:'HOLD',reason:'unapproved-or-unconfirmed-message'});
      }
      let status=500,result=null;
      const capture={
        statusCode:200,
        setHeader(){},
        end(value){status=this.statusCode;try{result=JSON.parse(value)}catch{result={state:'HOLD',reason:'unrecognized-send-receipt'}}}
      };
      await makeOutreachHandler({env,send})({
        method:'POST',
        headers:{authorization:'Bearer '+secret},
        body:{messageId:body.messageId,confirm:'SEND'}
      },capture);
      return json(res,status,result||{state:'HOLD',reason:'missing-provider-receipt'});
    }
    return json(res,400,{state:'HOLD',reason:'unknown-action'});
  };
}
export default makePanelHandler();
