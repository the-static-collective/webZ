import test from 'node:test';
import assert from 'node:assert/strict';
import {collectSignals, composeLetter, previousUtcDay, dailyIdempotency} from '../post-office/useful-letter.mjs';
import {makeUsefulLetterHandler} from '../api/post-office/useful-letter.js';

const env={CRON_SECRET:'test-secret-that-is-at-least-32-characters-long',RESEND_API_KEY:'fake-resend-secret',POST_OFFICE_TEST_TO:'owner@example.com',USEFUL_LETTER_ENABLED:'1'};
const now=new Date('2026-10-27T15:04:00.000Z');
const release={name:'First useful release',published_at:'2026-10-26T12:00:00.000Z',html_url:'https://github.com/the-static-collective/webZ/releases/tag/1.0.0',draft:false,prerelease:false};
const issue={title:'Owner action: check a supply meeting',updated_at:'2026-10-26T17:00:00Z',html_url:'https://github.com/the-static-collective/JAR-VIS/issues/42',labels:[{name:'post-office-letter'}]};
function fetcher({down=false, countSend=null}={}){
 return async(url,opts={})=>{
   const str=String(url);
   if(str==='https://api.resend.com/emails'){
     if(countSend) countSend.push({url,opts});
     return {ok:true,json:async()=>({id:'send_123'})};
   }
   if(str.includes('/releases?')) {
     return {ok:true,json:async()=>str.includes('/webZ/') ? [release,{...release,published_at:'2026-10-25T18:00:00Z'}]:[]};
   }
   if(str.includes('/issues?')) return {ok:true,json:async()=>str.includes('/JAR-VIS/')?[issue,{...issue,title:'Poison',html_url:'https://evil.example.org/x'}]:[]};
   if(str.includes('webz-field-porch')) return {status: down?500:200};
   throw Error('unknown URL '+str);
 };
}
function response(){return {statusCode:null, headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=JSON.parse(v)}};}
async function call({envOverrides={},authorization='Bearer '+env.CRON_SECRET,method='GET',fake=fetcher(),time=now}={}){
 const res=response();
 await makeUsefulLetterHandler({env:{...env,...envOverrides},request:fake,now:()=>time})({method,headers:{authorization}},res);
 return res;
}

test('last completed UTC day is stable across invocation hour',()=>{
 const d=previousUtcDay(now); assert.equal(d.label,'2026-10-26');
 assert.equal(d.start.toISOString(),'2026-10-26T00:00:00.000Z');
 assert.equal(d.end.toISOString(),'2026-10-27T00:00:00.000Z');
});
test('untrusted URLs, older releases, and unlabelled entries are excluded',async()=>{
 const evidence=await collectSignals({now,fetchImpl:fetcher(),healthCheck:true});
 assert.equal(evidence.signals.length,2);
 assert.ok(evidence.signals.every(x=>x.href.startsWith('https://github.com/the-static-collective/')));
 const msg=composeLetter(evidence); assert.match(msg.text,/First useful release/); assert.match(msg.text,/check a supply meeting/);
 assert.doesNotMatch(msg.text,/Poison/);
});
test('single transient bad health does not trigger letter',async()=>{
 let n=0;
 const fake=async(url,opts)=>{
   if(String(url).includes('webz-field-porch')) return {status: ++n===1?502:200};
   return {ok:true,json:async()=>[]};
 };
 const x=await collectSignals({fetchImpl:fake,now});assert.equal(x.signals.length,0);
});
test('sustained bad health produces actionable owner signal',async()=>{
 const x=await collectSignals({fetchImpl:fetcher({down:true}),now});
 assert.equal(x.signals.some(s=>s.kind==='health'),true);
});
test('unauthorized, missing secret, GET only, disabled letters fail closed before reads',async()=>{
 let hits=0;const fake=async()=>{hits++;throw Error('must not fetch')};
 assert.equal((await call({authorization:'Bearer wrong',fake})).statusCode,401);
 assert.equal((await call({envOverrides:{CRON_SECRET:''},fake})).statusCode,401);
 assert.equal((await call({method:'POST',fake})).statusCode,405);
 assert.equal((await call({envOverrides:{USEFUL_LETTER_ENABLED:'0'},fake})).body.status,'HOLD');
 assert.equal(hits,0);
});
test('quiet day sends no email',async()=>{
 let posted=0;
 const fake=async(url)=>{if(String(url).includes('resend'))posted++;return {status:200,ok:true,json:async()=>[]};};
 const x=await call({fake});assert.equal(x.body.status,'QUIET');assert.equal(posted,0);
});
test('one fixed owner-only message accepted, not labelled delivered',async()=>{
 const sends=[];const x=await call({fake:fetcher({countSend:sends})});
 assert.equal(x.statusCode,202);
 assert.equal(x.body.status,'PROVIDER_ACCEPTED');assert.equal(x.body.delivered,false);
 assert.equal(sends.length,1);
 const p=JSON.parse(sends[0].opts.body);
 assert.equal(p.from,'The Static Collective <us@abundent.org>');
 assert.deepEqual(p.to,['owner@example.com']);assert.equal(p.reply_to,'us@abundent.org');
 assert.match(sends[0].opts.headers['Idempotency-Key'],/^[a-f0-9]{64}$/);
 assert.equal(sends[0].opts.headers['Idempotency-Key'],dailyIdempotency('2026-10-26'));
});
test('provider failure is not misreported as delivery',async()=>{
 const fake=async(url)=>String(url).includes('resend')?{ok:false,status:403}:{ok:true,status:200,json:async()=>[release]};
 const x=await call({fake});assert.equal(x.statusCode,502);assert.equal(x.body.status,'HOLD');
});
