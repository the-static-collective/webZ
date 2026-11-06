import test from 'node:test';
import assert from 'node:assert/strict';
import {makeObservationHandler} from '../api/one-thing/observe.js';
import {createObservationClient} from '../one-thing/observation-client.mjs';

const journey='11111111-2222-4333-8444-555555555555';
const env={
 POSTHOG_OBSERVATION_ENABLED:'1',
 POSTHOG_OBSERVATION_TOKEN:'phc_testing_token_0123456789',
 POSTHOG_OBSERVATION_HOST:'https://us.i.posthog.com',
 OBSERVATION_ALLOWED_ORIGINS:'https://abundent.org,https://webz.abundent.org'
};
async function server(body,{method='POST',headers={
 origin:'https://abundent.org','content-type':'application/json'
},vars=env,send=async()=>{throw Error('unexpected upstream')}}={}){
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(b){this.body=JSON.parse(b)}};
 await makeObservationHandler({env:vars,send})({method,headers,body},res);
 return res;
}

test('relay is OFF by default and does not fetch upstream',async()=>{
 let calls=0;
 const vars={...env,POSTHOG_OBSERVATION_ENABLED:'0'};
 const send=async()=>{calls++;return {ok:true}};
 assert.deepEqual((await server(undefined,{method:'GET',vars})).body,{enabled:false,scope:'future-opt-in-events-only',version:1});
 assert.equal((await server({event:'quest_prepared',journey_id:journey},{vars,send})).statusCode,503);
 assert.equal(calls,0);
});

test('only allowed origin, known event, valid ephemeral UUID, strict keys',async()=>{
 const send=async()=>{throw Error('forbidden upstream')};
 const valid={event:'quest_prepared',journey_id:journey};
 for(const bad of [
   {...valid,thing:'A private resource'},
   {...valid,url:'https://example.com/secret'},
   {...valid,event:'person_identified'},
   {...valid,event:'worked'},
   {...valid,journey_id:'not-uuid'},
   {...valid,journey_id:true},
   null,[], '{}'
 ]){
   const r=await server(bad,{send});
   assert.equal(r.statusCode,400,JSON.stringify(bad));
 }
 assert.equal((await server(valid,{headers:{origin:'https://attacker.example','content-type':'application/json'},send})).statusCode,403);
 assert.equal((await server(valid,{headers:{origin:'https://abundent.org','content-type':'text/plain'},send})).statusCode,415);
 assert.equal((await server(valid,{headers:{origin:'https://abundent.org','content-type':'application/json','content-length':'1200'},send})).statusCode,413);
});

test('relay sends only two allowed event types and no human data',async()=>{
 const out=[];
 const send=async(url,init)=>{
  out.push({url,init});
  return {ok:true,status:200};
 };
 for(const event of ['quest_prepared','return_prepared']){
  const r=await server({event,journey_id:journey},{send});
  assert.equal(r.statusCode,202);
  assert.deepEqual(r.body,{state:'PROVIDER_ACCEPTED',counted:false,real_world_outcome_verified:false});
 }
 assert.equal(out.length,2);
 for(const {url,init} of out){
  assert.equal(url,'https://us.i.posthog.com/i/v0/e/');
  const body=JSON.parse(init.body);
  assert.deepEqual(Object.keys(body).sort(),['distinct_id','event','properties','token']);
  assert.equal(body.distinct_id,journey);
  assert.equal(body.token,env.POSTHOG_OBSERVATION_TOKEN);
  assert.deepEqual(body.properties,{$geoip_disable:true,$process_person_profile:false,source:'one-thing-007',unverified:true});
  assert.ok(!JSON.stringify(body).includes('private'));
 }
 assert.deepEqual(out.map(x=>JSON.parse(x.init.body).event),['one_thing_quest_prepared','one_thing_return_prepared']);
});

test('provider failure is a HOLD, not a completed observation',async()=>{
 const r=await server({event:'return_prepared',journey_id:journey},{send:async()=>({ok:false})});
 assert.equal(r.statusCode,502);
 assert.equal(r.body.state,'HOLD');
});

test('client is silent by default, then only future opted-in events emit',async()=>{
 const calls=[];
 const fetchImpl=async(url,opts)=>{
  calls.push({url,opts});
  if(opts.method==='GET')return {ok:true,json:async()=>({enabled:true})};
  return {ok:true,json:async()=>({state:'PROVIDER_ACCEPTED'})};
 };
 const client=createObservationClient({fetchImpl,uuid:()=>journey});
 assert.equal(await client.begin(),false);
 assert.equal(await client.report(),false);
 assert.equal(calls.length,0);
 assert.equal(await client.enable(),true);
 assert.equal(await client.report(),false);
 assert.equal(await client.begin(),true);
 assert.equal(await client.report(),true);
 assert.equal(await client.report(),false);
 assert.deepEqual(calls.map(x=>x.opts.method),['GET','POST','POST']);
 const payloads=calls.filter(x=>x.opts.body).map(x=>JSON.parse(x.opts.body));
 assert.deepEqual(payloads,[
  {event:'quest_prepared',journey_id:journey},
  {event:'return_prepared',journey_id:journey}
 ]);
 for(const x of calls){
  assert.equal(x.url,'../api/one-thing/observe');
  assert.equal(x.opts.credentials,'omit');
  assert.equal(x.opts.referrerPolicy,'no-referrer');
 }
 client.disable();
 assert.equal(client.isEnabled(),false);
 assert.equal(await client.report(),false);
 assert.equal(await client.begin(),false);
 assert.equal(calls.length,3);
});

test('disabled server prevents opt-in and no action data flows',async()=>{
 const calls=[];
 const client=createObservationClient({fetchImpl:async(url,opts)=>{
  calls.push({url,opts});
  return {ok:true,json:async()=>({enabled:false})};
 },uuid:()=>journey});
 assert.equal(await client.enable(),false);
 await client.begin();
 await client.report();
 assert.equal(calls.length,1);
});

test('later return is held if beginning event failed',async()=>{
 const calls=[];
 const client=createObservationClient({fetchImpl:async(url,opts)=>{
  calls.push(opts.method);
  return opts.method==='GET'?{ok:true,json:async()=>({enabled:true})}:{ok:false};
 },uuid:()=>journey});
 assert.equal(await client.enable(),true);
 assert.equal(await client.begin(),false);
 assert.equal(await client.report(),false);
 assert.deepEqual(calls,['GET','POST']);
});
