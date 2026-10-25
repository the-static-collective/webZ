import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
const unified=readFileSync(new URL('../public/unified.mjs',import.meta.url),'utf8');

test('question-first UI offers Council only by an explicit click; never auto-dispatches',()=>{
 assert.match(html,/id="question-form"/);
 assert.match(app,/presentUnified\(data\)/);
 assert.match(unified,/Ask Groq and Gemini/);
 assert.match(unified,/button\.addEventListener\('click'/);
 assert.match(unified,/verifyCouncil\(value\)/);
 assert.match(unified,/matchesCouncilSources\(base,value\)/);
 assert.match(unified,/active\?\.abort\(\)/);
 assert.match(unified,/packHash/);
 assert.match(unified,/No automatic outreach or action/);
});

test('public source links only accept exact-commit GitHub URLs',()=>{
 assert.match(app,/\[A-Za-z0-9\.\-\]\+/);
 assert.match(unified,/the-static-collective/);
 const url='https://github.com/the-static-collective/ALEX.2/blob/7d116b716df82ee2379b399d90936d2fc01b7b16/README.md';
 assert.match(url,/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9.-]+\/blob\/[a-f0-9]{40}\/[A-Za-z0-9./-]+$/);
});
