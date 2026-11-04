import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 INDEX_URL,PASSPORT_PATH,validateIndex,validatePassport,discoverPassports,
 matchPassports,passportUrlFor
} from '../app/passport-discovery.mjs';

const passport=JSON.parse(readFileSync(new URL('../capabilities/passport.v1.json',import.meta.url),'utf8'));
const directory={
 schema:'jarvis.capability-index/v1',version:'2026-11-04.1',reviewedOn:'2026-11-04',
 authority:'PUBLIC_SOURCE_DIRECTORY_NOT_EXECUTION',sources:[
  {repository:'the-static-collective/webZ',path:PASSPORT_PATH},
  {repository:'the-static-collective/reLATTE',path:PASSPORT_PATH}
 ]
};
const commuter={
 schema:'jarvis.capability-passport/v1',repository:'the-static-collective/reLATTE',
 version:'2026-11-04.1',authority:'PUBLIC_DESCRIPTION_ONLY_NOT_RUNTIME_OR_PERMISSION',
 availability:'NOT_OBSERVED',
 capabilities:[{
  id:'relatte.commuter',title:'Plan a consent-aware farm-to-email connection',
  intents:['grownby','newsletter integration','sync email'],
  readiness:'LOCAL_LIBRARY',
  delivers:'A documented signed crossing with independent receiver-owned HOLD; no live farm or email adapter.',
  entry:{kind:'SOURCE_REFERENCE',href:'https://github.com/the-static-collective/reLATTE/blob/main/docs/COMMUTER-001.md'},
  sourcePath:'docs/COMMUTER-001.md',
  requires:'Needs independently approved provider accounts, consent checks and an explicitly authorized receiver.'
 }]
};
const clone=x=>structuredClone(x);
test('source-owner passport and index have strict fail-closed bounded shapes',()=>{
 assert.equal(validateIndex(directory).sources.length,2);
 assert.equal(validatePassport(passport,'the-static-collective/webZ').capabilities.length,3);
 assert.equal(validatePassport(commuter,'the-static-collective/reLATTE').capabilities.length,1);
 assert.throws(()=>validatePassport(passport,'the-static-collective/reLATTE'),/UNTRUSTED/);
 for(const broken of [
  {...directory,sources:[{repository:'attacker/fake',path:PASSPORT_PATH}]},
  {...directory,sources:[{repository:'the-static-collective/webZ',path:'../../secrets'}]},
  {...directory,sources:[directory.sources[0],directory.sources[0]]},
  {...directory,anything:'not reviewed'}
 ])assert.throws(()=>validateIndex(broken));
});
test('no executable or cross-owner URL is admitted from a passport',()=>{
 const bad=clone(passport);
 bad.capabilities[0].entry={kind:'SOURCE_REFERENCE',href:'javascript:alert(1)'};
 assert.throws(()=>validatePassport(bad,'the-static-collective/webZ'),/INVALID_CAPABILITY_ENTRY/);
 const bad2=clone(passport);
 bad2.capabilities[0].entry={kind:'SOURCE_REFERENCE',href:'https://github.com/an-opportunist/webZ/blob/main/readme.md'};
 assert.throws(()=>validatePassport(bad2,'the-static-collective/webZ'),/INVALID_CAPABILITY_ENTRY/);
 const bad3=clone(commuter);
 bad3.capabilities[0].readiness='LIVE';
 assert.throws(()=>validatePassport(bad3,'the-static-collective/reLATTE'),/INVALID_CAPABILITY_ENTRY/);
 const bad4=clone(passport);
 bad4.capabilities[0].sourcePath='../.env';
 assert.throws(()=>validatePassport(bad4,'the-static-collective/webZ'),/INVALID_CAPABILITY_ENTRY/);
});
function fakeFetch({missing=[]}={}){
 const calls=[];
 const values=new Map([
  [INDEX_URL,directory],
  [passportUrlFor(directory.sources[0]),passport],
  [passportUrlFor(directory.sources[1]),commuter]
 ]);
 const fetchImpl=async(url,init)=>{
  calls.push({url,method:init?.method,body:init?.body,referrerPolicy:init?.referrerPolicy,credentials:init?.credentials});
  if(missing.includes(url)||!values.has(url))return new Response('unavailable',{status:404});
  return new Response(JSON.stringify(values.get(url)),{status:200,headers:{'content-type':'application/json'}});
 };
 return {fetchImpl,calls};
}
test('one public index discovers two independent source-owned passports with no user question transmitted',async()=>{
 const {fetchImpl,calls}=fakeFetch();
 const found=await discoverPassports({fetchImpl,timeoutMs:1000});
 assert.equal(found.passports.length,2);
 assert.equal(found.failures.length,0);
 assert.equal(found.executionAllowed,false);
 assert.equal(found.availabilityVerified,false);
 const surplus=matchPassports(found,'I have extra fish to share with a neighbor');
 assert.equal(surplus[0].id,'webz.glean');
 assert.equal(surplus[0].entry.href,'./glean/');
 const mail=matchPassports(found,'Can you sync GrownBy for our newsletter integration?');
 assert.equal(mail[0].id,'relatte.commuter');
 assert.equal(calls.length,3);
 assert.deepEqual(calls.map(c=>c.url),[INDEX_URL,...directory.sources.map(passportUrlFor)]);
 assert.ok(calls.every(c=>c.method==='GET'&&c.body===undefined&&c.credentials==='omit'&&c.referrerPolicy==='no-referrer'));
 assert.ok(calls.every(c=>!c.url.includes('extra')&&!c.url.includes('GrownBy')));
});
test('one unavailable source does not become a fictional live capability',async()=>{
 const missing=passportUrlFor(directory.sources[1]);
 const r=await discoverPassports({fetchImpl:fakeFetch({missing:[missing]}).fetchImpl,timeoutMs:1000});
 assert.equal(r.passports.length,1);
 assert.equal(r.failures.length,1);
 assert.equal(matchPassports(r,'sync GrownBy newsletter integration').length,0);
 assert.equal(r.failures[0].reason,'UNAVAILABLE_OR_INVALID');
});
test('malformed source, oversized source and stale unknown schema never enter the result',async()=>{
 const url=passportUrlFor(directory.sources[1]);
 const bad={...commuter,schema:'jarvis.capability-passport/v99'};
 const failFetch=async(u,init)=>{
  if(u===INDEX_URL)return new Response(JSON.stringify(directory),{headers:{'content-type':'application/json'}});
  if(u===url)return new Response(JSON.stringify(bad),{headers:{'content-type':'application/json'}});
  return new Response(JSON.stringify(passport),{headers:{'content-type':'application/json'}});
 };
 const observed=await discoverPassports({fetchImpl:failFetch,timeoutMs:1000});
 assert.equal(observed.passports.length,1);
 assert.equal(observed.failures.length,1);
 const tooBig=async()=>new Response(' '.repeat(100000),{headers:{'content-type':'application/json'}});
 await assert.rejects(()=>discoverPassports({fetchImpl:tooBig,timeoutMs:1000}));
});
test('unknown user text does not conjure an authorized public or private worker',()=>{
 const obs={schema:'jarvis.capability-observation/v1',passports:[
  validatePassport(passport,'the-static-collective/webZ'),
  validatePassport(commuter,'the-static-collective/reLATTE')
 ]};
 assert.equal(matchPassports(obs,'Buy a plane ticket for tomorrow').length,0);
 assert.equal(matchPassports(obs,'').length,0);
 assert.ok(matchPassports(obs,'extra fish').every(c=>c.availability==='NOT_OBSERVED'));
});
