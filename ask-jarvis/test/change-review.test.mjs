import test from 'node:test';import assert from 'node:assert/strict';
import {parseChangeCandidates,filterCandidates,readChangeCandidates,CHANGES_URL} from '../src/change-review.mjs';
const sha='a'.repeat(40),other='b'.repeat(40),now='2026-10-28T18:00:00Z';
const repos=['webZ','reLATTE','BananaSpork','Static-live','lemonPRESS','GRAFT','GHoT','planZ','Free-Graph','CANNON','LOADOUT'];
const item={id:'DIFF-'+'A'.repeat(20),repo:'webZ',ref:'main',from:sha,to:other,observedAt:now,
 state:'PENDING_REVIEW',authority:'NONE',admission:'NOT_ADMITTED',
 compareUrl:'https://github.com/the-static-collective/webZ/compare/'+sha+'...'+other,
 totalFiles:1,files:[{path:'docs/JUBILEE.md',status:'modified',category:'DOCUMENTATION'}]};
const feed={schema:'static-collective/change-candidates-v1',authority:'NONE',scannedAt:now,monitoredRepos:repos,candidates:[item]};
test('bounded public queue makes one exact-source candidate visible without admission',()=>{
 const p=parseChangeCandidates(JSON.stringify(feed));assert.equal(p.candidates.length,1);
 const selected=filterCandidates(p,{selected:[{source:'https://github.com/the-static-collective/webZ/blob/'+sha+'/README.md'}]});
 assert.equal(selected[0].id,item.id);assert.equal(selected[0].admission,'NOT_ADMITTED');
});
test('malformed statuses and unsafe paths HOLD instead of inventing evidence',()=>{
 for(const c of [{state:'VERIFIED_WORK'},{admission:'ADMITTED'},{compareUrl:'https://attacker.example/diff'},{files:[{path:'../secrets',status:'modified',category:'SOURCE_CODE'}]}]){
  const copy=structuredClone(feed);Object.assign(copy.candidates[0],c);assert.throws(()=>parseChangeCandidates(JSON.stringify(copy)));
 }
});
test('question never travels to Github and stale queue is not fresh',async()=>{
 const seen=[];const x=await readChangeCandidates(null,{fetcher:async u=>{seen.push(u);return new Response(JSON.stringify(feed))},now:()=>Date.parse(now)+49*3600000});
 assert.equal(seen[0],CHANGES_URL);assert.equal(x.status,'HOLD');assert.equal(x.reason,'FEED_STALE_OR_FUTURE');
});
