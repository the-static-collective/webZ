import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('Waseca experiment is local-only, explicitly experimental and in the release',async()=>{
 const [html,js,build]=await Promise.all(['waseca/index.html','waseca/app.mjs','scripts/build-release.mjs'].map(p=>readFile(new URL(p,root),'utf8')));
 assert.match(html,/EXPERIMENT 001/);assert.match(html,/not.*official project/i);
 assert.match(html,/No form submissions/);assert.match(js,/LOCAL SELF-REPORT/);
 assert.doesNotMatch(js,/\bfetch\s*\(|\blocalStorage\b|sendBeacon|XMLHttpRequest/);
 for(const p of ['waseca/index.html','waseca/style.css','waseca/app.mjs'])assert.ok(build.includes("'"+p+"'"));
});