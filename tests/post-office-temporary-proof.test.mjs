import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {makeTemporaryHandler} from '../api/post-office/temporary-proof.js';
const secret='operator-test-2026-unique-at-least-32-chars';
const env={POST_OFFICE_OPERATOR_TOKEN:secret,RESEND_API_KEY:'fake',POST_OFFICE_TEST_TO:'owner@example.org'};
const purpose='post-office-owner-2026-10-26-v1';
const sig=createHmac('sha256',secret).update(purpose).digest('hex');
async function invoke(req,now,send=async()=>{throw Error('unexpected send')}){
 const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=JSON.parse(body)}};
 await makeTemporaryHandler({env,now:()=>now,send})(req,res);
 return res;
}
test('unsigned, incorrect method or expired GET never sends',async()=>{
 const validUrl='/api/post-office/temporary-proof?sig='+sig;
 for(const req of [{method:'GET',url:'/api/post-office/temporary-proof'}, {method:'GET',url:validUrl.replace(sig,'0'.repeat(64))},{method:'POST',url:validUrl}]) {
   const res=await invoke(req,Date.parse('2026-10-26T19:00:00Z'));
   assert.equal(res.statusCode,404);
 }
 const expired=await invoke({method:'GET',url:validUrl},Date.parse('2026-10-27T00:00:00Z'));
 assert.equal(expired.statusCode,404);
});
test('signed unexpired GET invokes only private fixed-recipient proof once',async()=>{
 let calls=0;
 const res=await invoke({method:'GET',url:'/api/post-office/temporary-proof?sig='+sig},Date.parse('2026-10-26T19:00:00Z'),async(url,args)=>{
   calls++; assert.equal(url,'https://api.resend.com/emails');
   const body=JSON.parse(args.body);
   assert.deepEqual(body.to,['owner@example.org']);
   assert.match(body.from,/us@abundent.org/);
   return {ok:true,json:async()=>({id:'message-test-receipt'})};
 });
 assert.equal(calls,1);
 assert.equal(res.statusCode,202);
 assert.equal(res.body.state,'PROVIDER_ACCEPTED');
 assert.equal(res.body.delivered,false);
});
