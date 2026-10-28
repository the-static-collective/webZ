import test from 'node:test';
import assert from 'node:assert/strict';
import {makePanelHandler} from '../api/post-office/panel.js';

const secret='owner-authenticated-operator-secret-at-least-32-characters';
const env={POST_OFFICE_PANEL_ENABLED:'1',POST_OFFICE_OUTREACH_ENABLED:'1',
  POST_OFFICE_OPERATOR_TOKEN:secret,POST_OFFICE_TEST_TO:'operator-private@example.org',
  RESEND_API_KEY:'re_mock_secret_1234'};
let now=1793214000000;
const host='webz-field-porch-theotherlucasv-1250s-projects.vercel.app';
const validHeaders={origin:'https://'+host,host,'content-type':'application/json','sec-fetch-site':'same-origin'};
function makeSend(){
 const calls=[];
 return {calls,send:async(url,args)=>{
   calls.push({url,args});
   return {ok:true,json:async()=>({id:'re_mock_'+calls.length})};
 }};
}
async function invoke(method,body,{headers={},vars=env,send=async()=>{throw Error('unexpected dispatch')},time=now}={}){
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(raw){this.body=JSON.parse(raw)}};
 await makePanelHandler({env:vars,send,clock:()=>time})({method,headers,body},res);
 return res;
}
function cookieFor(res){return res.headers['Set-Cookie'].split(';')[0]}
async function authenticate(){
 const provider=makeSend();
 const a=await invoke('POST',{action:'request-code'},{headers:validHeaders,send:provider.send});
 assert.equal(a.statusCode,202);
 assert.equal(provider.calls.length,1);
 const letter=JSON.parse(provider.calls[0].args.body);
 assert.deepEqual(letter.to,['operator-private@example.org']);
 const code=/Your sign-in code: ([0-9]{12})/.exec(letter.text)[1];
 const v=await invoke('POST',{action:'verify-code',code},{headers:validHeaders});
 assert.equal(v.statusCode,200);
 const cookie=cookieFor(v);
 const g=await invoke('GET',null,{headers:{cookie}});
 assert.equal(g.statusCode,200);
 return {cookie,csrf:g.body.csrf,provider,code};
}
test('disabled, unauthenticated and wrong-origin requests cannot send',async()=>{
 let calls=0;const send=async()=>{calls++;throw Error('must not send')};
 assert.equal((await invoke('GET',null,{vars:{...env,POST_OFFICE_PANEL_ENABLED:'0'}})).statusCode,503);
 assert.equal((await invoke('GET',null)).statusCode,401);
 assert.equal((await invoke('POST',{action:'request-code'},{headers:{...validHeaders,origin:'https://evil.example'},send})).statusCode,403);
 assert.equal((await invoke('POST',{action:'send',messageId:'still-here-cada-safeguarding-001',confirm:'SEND'},{headers:validHeaders,send})).statusCode,401);
 assert.equal(calls,0);
});
test('only fixed owner mailbox receives limited login request, never visitor input',async()=>{
 const {calls,send}=makeSend();
 assert.equal((await invoke('POST',{action:'request-code',to:'attacker@example.org'},{headers:validHeaders,send})).statusCode,400);
 await invoke('POST',{action:'request-code'},{headers:validHeaders,send});
 await invoke('POST',{action:'request-code'},{headers:validHeaders,send});
 assert.equal(calls.length,2);
 assert.equal(calls[0].args.headers['Idempotency-Key'],calls[1].args.headers['Idempotency-Key']);
 assert.deepEqual(JSON.parse(calls[0].args.body).to,['operator-private@example.org']);
 assert.equal((await invoke('POST',{action:'request-code'},{headers:validHeaders,vars:{...env,POST_OFFICE_TEST_TO:''},send})).statusCode,503);
});
test('email code, signed cookie, expiry, and CSRF gates',async()=>{
 const {cookie,csrf,code}=await authenticate();
 assert.match(cookie,/^abundent_post_office=v1\./);
 assert.match(csrf,/^[0-9a-f]{64}$/);
 const bad=await invoke('POST',{action:'verify-code',code:'000000000000'},{headers:validHeaders});
 assert.equal(bad.statusCode,401);
 assert.equal((await invoke('GET',null,{headers:{cookie},time:now+2*60*60*1000+1})).statusCode,401);
 assert.equal((await invoke('GET',null,{headers:{cookie:cookie.replace(/.$/,'a')}})).statusCode,401);
 const badCSRF=await invoke('POST',{action:'send',confirm:'SEND',messageId:'still-here-cada-safeguarding-001'},
   {headers:{...validHeaders,cookie,'x-post-office-csrf':'wrong'}});
 assert.equal(badCSRF.statusCode,403);
 const out=await invoke('POST',{action:'logout'},{headers:{...validHeaders,cookie,'x-post-office-csrf':csrf}});
 assert.equal(out.statusCode,200);assert.match(out.headers['Set-Cookie'],/Max-Age=0/);
});
test('review returns immutable source-approved correspondence, no self-signoff',async()=>{
 const {cookie}=await authenticate();
 const out=await invoke('GET',null,{headers:{cookie}});
 assert.equal(out.body.messages.length,1);
 const m=out.body.messages[0];
 assert.equal(m.to,'info@cadamn.org');
 assert.match(m.text,/Still Here/);
 assert.equal(m.status,'REVIEW_REQUIRED_NOT_SENT_BY_THIS_ACTION');
});
test('approved explicit send reuses strict Post Office 006, provider acceptance not delivery',async()=>{
 const {cookie,csrf}=await authenticate();
 const {calls,send}=makeSend();
 const command={action:'send',confirm:'SEND',messageId:'still-here-cada-safeguarding-001'};
 for(const bad of [{...command,to:'no@evil.org'},{...command,text:'bad'},{...command,confirm:'YES'},
  {...command,messageId:'unknown'},{...command,messageId:'__proto__'}]){
   assert.equal((await invoke('POST',bad,{headers:{...validHeaders,cookie,'x-post-office-csrf':csrf},send})).statusCode,400);
 }
 assert.equal(calls.length,0);
 const sent=await invoke('POST',command,{headers:{...validHeaders,cookie,'x-post-office-csrf':csrf},send});
 assert.equal(sent.statusCode,202);assert.equal(sent.body.state,'PROVIDER_ACCEPTED');
 assert.equal(sent.body.delivered,false);
 assert.equal(calls.length,1);
 assert.deepEqual(JSON.parse(calls[0].args.body).to,['info@cadamn.org']);
 assert.match(JSON.parse(calls[0].args.body).from,/us@abundent.org/);
});
test('expired codes and provider errors stay HOLD',async()=>{
 const {code}=await authenticate();
 assert.equal((await invoke('POST',{action:'verify-code',code},{headers:validHeaders,time:now+2*20*60*1000})).statusCode,401);
 const bad=await invoke('POST',{action:'request-code'},{headers:validHeaders,send:async()=>({ok:false,status:403})});
 assert.equal(bad.statusCode,502);assert.equal(bad.body.state,'HOLD');
});
