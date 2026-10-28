import test from 'node:test';import assert from 'node:assert/strict';
import {parseReviewLedger,reviewProjection,readReviewDecisions,LEDGER_URL} from '../src/review-decisions.mjs';
const A='a'.repeat(40),B='b'.repeat(40),id='DIFF-'+'A'.repeat(20),url='https://github.com/the-static-collective/JAR-VIS/issues/7';
const rec={id:'COMMENT-123',candidateId:id,repo:'webZ',from:A,to:B,disposition:'HOLD',
 issueNumber:7,issueUrl:url,commentId:123,commentUrl:url+'#issuecomment-123',reviewer:'reviewer-a',
 reviewerPermission:'write',reviewedAt:'2026-10-28T19:00:00Z',issueBodySha256:'c'.repeat(64),
 authority:'GITHUB_WRITE_REVIEWERS',claim:'SOURCE_REVIEW_ONLY_NOT_DEPLOYMENT_OR_FIELD_PROOF'};
const feed={schema:'static-collective/review-decisions-v1',authority:'GITHUB_WRITE_REVIEWERS',records:[rec]};
test('fixed ledger includes only authorized source-review dispositions',()=>{
 const v=parseReviewLedger(JSON.stringify(feed));const p=reviewProjection(v);
 assert.equal(p.total,1);assert.equal(p.latest[0].disposition,'HOLD');assert.equal(p.latest[0].reviewer,'reviewer-a');
});
test('forged or field-completion statuses fail closed',()=>{
 for(const change of [{disposition:'FIELD_VERIFIED'},{reviewerPermission:'read'},{claim:'REAL_WORLD_COMPLETE'},{commentUrl:'https://evil.test/comment'}]){
  const v=structuredClone(feed);Object.assign(v.records[0],change);assert.throws(()=>parseReviewLedger(JSON.stringify(v)));
 }
});
test('latest of multiple decisions is current, original comment remains in history',()=>{
 const v=structuredClone(feed);v.records.push({...rec,id:'COMMENT-124',commentId:124,
  commentUrl:url+'#issuecomment-124',disposition:'NEEDS_EVIDENCE'});
 const x=reviewProjection(parseReviewLedger(JSON.stringify(v)));
 assert.equal(x.total,2);assert.equal(x.latest[0].disposition,'NEEDS_EVIDENCE');
 assert.equal(x.recent[0].disposition,'HOLD');
});
test('fetch uses only fixed public manifest; never sends a visitor question',async()=>{
 const calls=[];const x=await readReviewDecisions({fetcher:async url=>{calls.push(url);return new Response(JSON.stringify(feed))},now:()=>1000});
 assert.equal(calls[0],LEDGER_URL);assert.equal(x.status,'READ');
});
