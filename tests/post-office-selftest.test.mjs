import test from 'node:test';
import assert from 'node:assert/strict';
import {makeProofHandler} from '../api/post-office/proof.js';

const token = 'long-operator-token-private-at-least-32-characters';
const good = {
  POST_OFFICE_OPERATOR_TOKEN: token,
  RESEND_API_KEY: 're_mock_test_secret',
  POST_OFFICE_TEST_TO: 'owner@example.org'
};

async function invoke(env, method='POST', authorization=null, send=async()=>{throw new Error('unexpected send')}) {
  const out={statusCode:200,headers:{},body:null,
    setHeader(key,value){this.headers[key]=value;},
    end(value){this.body=JSON.parse(value);}
  };
  await makeProofHandler({env,send})({
    method,headers:authorization ? {authorization} : {}
  },out);
  return out;
}

test('never sends for unauthenticated traffic, missing operator secret or GET',async()=>{
  let calls=0;
  const send=async()=>{calls++;throw Error('must not call')};
  assert.equal((await invoke(good,'GET',null,send)).statusCode,405);
  assert.equal((await invoke(good,'POST','Bearer wrong',send)).statusCode,401);
  assert.equal((await invoke({...good,POST_OFFICE_OPERATOR_TOKEN:'short'},'POST','Bearer short',send)).statusCode,503);
  assert.equal(calls,0);
});
test('no provider credentials or owner recipient means HOLD',async()=>{
  const absent={POST_OFFICE_OPERATOR_TOKEN:token};
  assert.equal((await invoke(absent,'POST','Bearer '+token)).statusCode,503);
  assert.equal((await invoke({...good,POST_OFFICE_TEST_TO:'bad'},'POST','Bearer '+token)).statusCode,503);
});
test('approved owner request sends only fixed self-test, receives provider receipt',async()=>{
  let calls=0,key;
  const send=async(url,args)=>{
    calls++;assert.equal(url,'https://api.resend.com/emails');
    key=args.headers['Idempotency-Key'];assert.match(key,/^[a-f0-9]{64}$/);
    const payload=JSON.parse(args.body);
    assert.deepEqual(payload.to,['owner@example.org']);
    assert.equal(payload.reply_to,'us@abundent.org');
    assert.match(payload.from,/us@abundent.org/);
    assert.match(payload.subject,/Post Office proof 001/);
    return {ok:true,json:async()=>({id:'re_test_123'})};
  };
  const a=await invoke(good,'POST','Bearer '+token,send);
  assert.equal(a.statusCode,202);
  assert.deepEqual(a.body,{state:'PROVIDER_ACCEPTED',providerId:'re_test_123',delivered:false});
  assert.equal(calls,1);
  assert.ok(key);
});
test('provider errors cannot be reported as delivered',async()=>{
 const result=await invoke(good,'POST','Bearer '+token,async()=>({ok:false,status:403}));
 assert.equal(result.statusCode,502);
 assert.equal(result.body.state,'HOLD');
});
