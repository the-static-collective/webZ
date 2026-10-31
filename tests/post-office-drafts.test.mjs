import test from 'node:test';
import assert from 'node:assert/strict';
import {makePanelHandler} from '../api/post-office/panel.js';
const secret='owner-authenticated-operator-secret-at-least-32-characters';
const bridgeKey='outbox-test-key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const bridgeUrl='https://example.supabase.co/functions/v1/post-office-drafts';
const env={POST_OFFICE_PANEL_ENABLED:'1',POST_OFFICE_OPERATOR_TOKEN:secret,
 POST_OFFICE_TEST_TO:'operator@example.org',RESEND_API_KEY:'re_mock_secret_1234',
 POST_OFFICE_DRAFTS_BRIDGE_URL:bridgeUrl,POST_OFFICE_DRAFTS_BRIDGE_KEY:bridgeKey};
const host='example.vercel.app',head={host,origin:'https://'+host,'content-type':'application/json'};
async function invoke(body,{headers=head,vars=env,send=async()=>{throw Error('unexpected network call')}}={}){
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(b){this.body=JSON.parse(b)}};
 await makePanelHandler({env:vars,send,clock:()=>1793214000000})({method:'POST',headers,body},res);
 return res;
}
async function auth(){
 let code='';
 const send=async(url,opt)=>{code=/code: (\d{12})/.exec(JSON.parse(opt.body).text)?.[1]||'';
   return {ok:true,json:async()=>({id:'re_accepted'})}};
 assert.equal((await invoke({action:'request-code'},{send})).statusCode,202);
 const a=await invoke({action:'verify-code',code});
 const cookie=a.headers['Set-Cookie'].split(';')[0];
 const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(b){this.body=JSON.parse(b)}};
 await makePanelHandler({env,clock:()=>1793214000000})({method:'GET',headers:{cookie}},response);
 return {cookie,csrf:response.body.csrf};
}
test('private drafts require signed owner session and CSRF; never publicly read',async()=>{
 const {cookie,csrf}=await auth();
 let requests=0;const send=async()=>{requests++;return {status:200,json:async()=>({state:'OK',drafts:[]})}};
 assert.equal((await invoke({action:'draft-list'},{send})).statusCode,401);
 assert.equal((await invoke({action:'draft-list'},{headers:{...head,cookie},send})).statusCode,403);
 assert.equal(requests,0);
 const good=await invoke({action:'draft-list'},{headers:{...head,cookie,'x-post-office-csrf':csrf},send});
 assert.equal(good.statusCode,200);assert.deepEqual(good.body.drafts,[]);
 assert.equal(requests,1);
});
test('draft-save stays a server-to-server store operation, never Resend',async()=>{
 const {cookie,csrf}=await auth();
 let url='',headers={},command;
 const send=async(u,args)=>{url=u;headers=args.headers;command=JSON.parse(args.body);
   return {status:200,json:async()=>({state:'OK',draft:{...command.draft,revision:1}})}};
 const draft={id:'nexus-2026',recipient:'',subject:'A question',body:'Hello there',status:'DRAFT',note:''};
 const reply=await invoke({action:'draft-save',draft,revision:null},
  {headers:{...head,cookie,'x-post-office-csrf':csrf},send});
 assert.equal(reply.statusCode,200);assert.equal(reply.body.draft.subject,'A question');
 assert.equal(url,bridgeUrl);assert.equal(headers['x-post-office-bridge-key'],bridgeKey);
 assert.equal(command.action,'save');assert.equal(command.revision,null);
});
test('bridge not configured is HOLD, no network call',async()=>{
 const {cookie,csrf}=await auth();
 const res=await invoke({action:'draft-list'},{
  headers:{...head,cookie,'x-post-office-csrf':csrf},
  vars:{...env,POST_OFFICE_DRAFTS_BRIDGE_KEY:''}
 });
 assert.equal(res.statusCode,503);assert.equal(res.body.state,'HOLD');
});
