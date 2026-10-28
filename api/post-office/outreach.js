/**
 * POST OFFICE 006 — reviewed external-recipient sending.
 * No public choice of destination, subject, body or attachments.
 */
import {createHash,timingSafeEqual} from 'node:crypto';

export const OUTBOX = Object.freeze({
  'still-here-cada-safeguarding-001': Object.freeze({
    to: 'info@cadamn.org',
    subject: 'Request for Guidance — Community Survivor Peer-Support Initiative',
    text: [
      'Hello,',
      '',
      "I'm developing a small, community-based peer-support initiative in southern Minnesota for adults experiencing isolation following relationship abuse, particularly fathers who may struggle to find appropriate support.",
      '',
      'The initiative is called Still Here, and we are currently developing its founding structure.',
      '',
      'Before inviting participants, I want to ensure the group is designed responsibly, with appropriate safeguards for privacy, confidentiality, and facilitation.',
      '',
      'Would someone on your community education team be willing to discuss our proposed approach briefly, or recommend someone qualified to review a fictional practice session?',
      '',
      "We're not requesting access to survivor information or assuming an organizational partnership. We're simply hoping to learn from people with practical experience so that we can build something genuinely useful and safe.",
      '',
      'Thank you for the work you do in our communities.',
      '',
      'The Static Collective',
      'us@abundent.org',
      'https://abundent.org/'
    ].join('\n')
  })
});
const FROM='The Static Collective <us@abundent.org>';
const REPLY_TO='us@abundent.org';
function respond(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, private');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(body));
}
function operatorAuthorized(authorization,secret){
  if(typeof authorization!=='string'||!authorization.startsWith('Bearer ')||typeof secret!=='string'||secret.length<32) return false;
  const supplied=authorization.slice(7);
  if(supplied.length<32) return false;
  return timingSafeEqual(createHash('sha256').update(supplied).digest(),createHash('sha256').update(secret).digest());
}
function commandId(body){
  if(typeof body==='string'){
    if(Buffer.byteLength(body,'utf8')>512) return null;
    try{body=JSON.parse(body)}catch{return null}
  }
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  if(Object.keys(body).sort().join(',')!=='confirm,messageId')return null;
  if(body.confirm!=='SEND'||typeof body.messageId!=='string'||!Object.hasOwn(OUTBOX,body.messageId))return null;
  return body.messageId;
}
export function makeOutreachHandler({env=process.env,send=fetch}={}){
  return async function handler(req,res){
    if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(res,405,{state:'HOLD',reason:'post-only'})}
    if(env.POST_OFFICE_OUTREACH_ENABLED!=='1')return respond(res,503,{state:'HOLD',reason:'external-outreach-disabled'});
    if(typeof env.POST_OFFICE_OPERATOR_TOKEN!=='string'||env.POST_OFFICE_OPERATOR_TOKEN.length<32)return respond(res,503,{state:'HOLD',reason:'operator-not-provisioned'});
    if(!operatorAuthorized(req.headers?.authorization??'',env.POST_OFFICE_OPERATOR_TOKEN))return respond(res,401,{state:'HOLD',reason:'not-authorized'});
    const id=commandId(req.body);
    if(!id)return respond(res,400,{state:'HOLD',reason:'unknown-or-unconfirmed-message'});
    const apiKey=env.RESEND_API_KEY;
    if(typeof apiKey!=='string'||apiKey.length<12)return respond(res,503,{state:'HOLD',reason:'sending-service-not-ready'});
    const approved=OUTBOX[id];
    const email={from:FROM,to:[approved.to],reply_to:REPLY_TO,subject:approved.subject,text:approved.text};
    const digest=createHash('sha256').update(JSON.stringify(email)).digest('hex');
    // Resend idempotency protects retries inside 24 hours, not indefinitely.
    const key='postoffice006-'+createHash('sha256').update(id+String.fromCharCode(0)+digest).digest('hex');
    try{
      const provider=await send('https://api.resend.com/emails',{
        method:'POST',
        headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':key},
        body:JSON.stringify(email),
        signal:AbortSignal.timeout(15000)
      });
      if(!provider.ok)return respond(res,502,{state:'HOLD',reason:'provider-not-accepted',providerStatus:provider.status});
      const result=await provider.json();
      if(typeof result?.id!=='string'||!result.id)return respond(res,502,{state:'HOLD',reason:'provider-receipt-unverified'});
      return respond(res,202,{state:'PROVIDER_ACCEPTED',messageId:id,providerId:result.id,delivered:false});
    }catch{return respond(res,502,{state:'HOLD',reason:'provider-unreachable-or-unconfirmed'})}
  }
}
export default makeOutreachHandler();
