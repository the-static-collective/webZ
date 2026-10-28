import test from 'node:test';import assert from 'node:assert/strict';
import {parseObservations,pickObservedSources,readObservations,OBS_URL} from '../src/source-observations.mjs';
const repos=['webZ','reLATTE','BananaSpork','Static-live','lemonPRESS','GRAFT','GHoT','planZ','Free-Graph','CANNON','LOADOUT'];
const sha='a'.repeat(40),time='2026-10-28T17:48:04Z';
const feed={schema:'static-collective/source-observations-v1',authority:'NONE',scannedAt:time,events:[],sources:repos.map(repo=>({repo,ref:'main',status:'OBSERVED_HEAD',sha,checkedAt:time,commitTime:time,commitUrl:'https://github.com/the-static-collective/'+repo+'/commit/'+sha}))};
const recent={selected:[{source:'https://github.com/the-static-collective/webZ/blob/'+sha+'/docs/JUBILEE-CIRCUIT-001.md'}]};
test('fixed feed verifies 11 distinct public refs and never treats main as canon',()=>{const x=parseObservations(JSON.stringify(feed));assert.equal(x.sources.length,11);assert.equal(pickObservedSources(x,recent)[0].repo,'webZ');assert.match(pickObservedSources(x,recent)[0].statement,/not proof of execution/);});
test('stale and missing sources HOLD; malformed or forged statuses rejected',async()=>{
 const seen=[];const r=await readObservations(recent,{fetcher:async u=>{seen.push(u);return new Response(JSON.stringify(feed))},now:()=>Date.parse(time)+49*3600000});
 assert.equal(seen[0],OBS_URL);assert.equal(r.status,'HOLD');
 for(const change of [{status:'COMPLETED'},{commitUrl:'https://evil.test/'}]){
  const x=structuredClone(feed);Object.assign(x.sources[0],change);assert.throws(()=>parseObservations(JSON.stringify(x)));
 }
});
