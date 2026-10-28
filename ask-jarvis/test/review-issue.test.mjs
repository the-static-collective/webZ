import test from 'node:test';import assert from 'node:assert/strict';
import {reviewIssueUrl} from '../public/review-issue.mjs';
const a='a'.repeat(40),b='b'.repeat(40);
test('GitHub review link contains only exact public candidate identifiers',()=>{
 const url=reviewIssueUrl({id:'DIFF-'+'A'.repeat(20),repo:'webZ',from:a,to:b});
 const u=new URL(url);assert.equal(u.host,'github.com');assert.equal(u.pathname,'/the-static-collective/JAR-VIS/issues/new');
 const body=u.searchParams.get('body');
 assert.match(body,/^JARVIS_CHANGE_REVIEW_V1\n/);assert.match(body,/END_JARVIS_CHANGE_REVIEW_V1$/);
 assert.ok(!body.includes('reviewer'));assert.ok(!body.includes('email'));
});
test('untrusted raw IDs cannot construct issue links',()=>{
 assert.throws(()=>reviewIssueUrl({id:'fake',repo:'webZ',from:a,to:b}));
 assert.throws(()=>reviewIssueUrl({id:'DIFF-'+'A'.repeat(20),repo:'../evil',from:a,to:b}));
});
