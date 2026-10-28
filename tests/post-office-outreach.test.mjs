import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOutreachHandler,OUTBOX} from '../api/post-office/outreach.js';

const token='operator-private-token-at-least-32-characters';
const env={POST_OFFICE_OUTREACH_ENABLED:'1',POST_OFFICE_OPERATOR_TOKEN:token,RESEND_API_KEY:'re_test_mock_key'};
const cmd={messageId:'still-here-cada-safeguarding-001',confirm:'SEND'};
const headers={authorization:'Bearer '+token};
async function run(body,{method='POST',headers:h={},vars=env,send=async()=>{throw Error('unexpected provider')}}={}){
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(b){this.body=JSON.parse(b)}};
  await makeOutreachHandler({env:vars,send})({method,headers:h,body},res);
  return res;
}
test('default HOLD, GET and unauthorized never dispatch',async()=>{
  let n=0;const send=async()=>{n++;throw Error('unexpected')};
  assert.equal((await run(cmd,{vars:{...env,POST_OFFICE_OUTREACH_ENABLED:'0'},headers,send})).statusCode,503);
  assert.equal((await run(cmd,{method:'GET',headers,send})).statusCode,405);
  assert.equal((await run(cmd,{headers:{authorization:'Bearer wrong'},send})).statusCode,401);
  assert.equal((await run(cmd,{vars:{...env,POST_OFFICE_OPERATOR_TOKEN:'weak'},headers,send})).statusCode,503);
  assert.equal(n,0);
});
test('rejects arbitrary destination and mutated message fields',async()=>{
  for(const input of [{...cmd,to:'bad@evil.org'},{...cmd,subject:'hello'},{...cmd,body:'hello'},
    {...cmd,confirm:'DRAFT'},{messageId:'arbitrary',confirm:'SEND'},{messageId:'__proto__',confirm:'SEND'},
    {messageId:cmd.messageId},null,[], 'not json',JSON.stringify({...cmd,cc:'bad@evil.org'})]){
    assert.equal((await run(input,{headers})).statusCode,400);
  }
});
test('approved external address with fixed envelope gets provider receipt only',async()=>{
  let n=0,key='';
  const send=async(url,request)=>{
    n++;assert.equal(url,'https://api.resend.com/emails');
    key=request.headers['Idempotency-Key'];
    assert.match(key,/^postoffice006-[a-f0-9]{64}$/);
    const data=JSON.parse(request.body);
    assert.deepEqual(data.to,['info@cadamn.org']);
    assert.equal(data.reply_to,'us@abundent.org');
    assert.equal(data.subject,OUTBOX[cmd.messageId].subject);
    assert.ok(data.text.includes('Still Here'));
    return {ok:true,json:async()=>({id:'re_12345'})};
  };
  const r=await run(cmd,{headers,send});
  assert.equal(r.statusCode,202);
  assert.deepEqual(r.body,{state:'PROVIDER_ACCEPTED',messageId:cmd.messageId,providerId:'re_12345',delivered:false});
  await run(JSON.stringify(cmd),{headers,send});assert.equal(n,2);assert.ok(key);
});
test('missing provider credentials and provider failures HOLD',async()=>{
  assert.equal((await run(cmd,{headers,vars:{...env,RESEND_API_KEY:''}})).statusCode,503);
  const r=await run(cmd,{headers,send:async()=>({ok:false,status:403})});
  assert.equal(r.statusCode,502);assert.equal(r.body.state,'HOLD');
  assert.equal((await run(cmd,{headers,send:async()=>({ok:true,json:async()=>({})})})).statusCode,502);
});
