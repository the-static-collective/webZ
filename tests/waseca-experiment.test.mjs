import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('Waseca experiment is local-only, explicitly experimental and in the release',async()=>{
 const [html,js,build,live]=await Promise.all(['waseca/index.html','waseca/app.mjs','scripts/build-release.mjs','waseca/live.mjs'].map(p=>readFile(new URL(p,root),'utf8')));
 assert.match(html,/EXPERIMENT 001/);assert.match(html,/not.*official project/i);
 assert.match(html,/Optional submissions are stored privately for human review/);assert.match(js,/LOCAL SELF-REPORT/); assert.match(live,/functions\\/v1\\/reality2-waseca/);
 assert.doesNotMatch(js,/\bfetch\s*\(|\blocalStorage\b|sendBeacon|XMLHttpRequest/);
 for(const p of ['waseca/index.html','waseca/style.css','waseca/app.mjs','waseca/live.mjs','waseca/operator/index.html','waseca/operator/style.css','waseca/operator/app.mjs'])assert.ok(build.includes("'"+p+"'"));
});