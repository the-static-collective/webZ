import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {renderWorker,assetVersion,STATIC_PATHS} from '../scripts/render-field.mjs';
function worker(failed=false){
 const handlers={},requests=[],stored=new Map(),deleted=[];
 const prefix='webz-static:/nested/webZ/:';
 const names=new Set([prefix+'old','webz-offline-001:/nested/webZ/','webz-static:/other/:old','other-app']);
 const cache={put:async(u,r)=>stored.set(u,r),match:async r=>stored.get(typeof r==='string'?r:r.url)};
 const sandbox={URL,Request,Error,caches:{open:async n=>{names.add(n);return cache;},keys:async()=>[...names],delete:async n=>{deleted.push(n);names.delete(n);stored.clear();}},fetch:async r=>{requests.push(r);return {ok:!failed};},self:{location:{href:'https://example.org/nested/webZ/sw.js'},addEventListener:(k,h)=>handlers[k]=h,skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
 vm.runInNewContext(renderWorker('current'),sandbox);
 const run=async kind=>{let task;handlers[kind]({waitUntil:p=>task=p});await task;};
 return {handlers,requests,stored,deleted,run,prefix};
}
test('worker caches only the fixed shell with omitted credentials and refused redirects',async()=>{
 const w=worker();await w.run('install');assert.equal(w.stored.size,STATIC_PATHS.length);
 assert.ok(w.requests.every(r=>r.method==='GET'&&r.credentials==='omit'&&r.redirect==='error'&&r.cache==='reload'));
 const before=w.requests.length;
 for(const [url,method] of [['https://external.example/audio','GET'],['https://example.org/nested/webZ/proposal','POST'],['https://example.org/nested/webZ/field/?private=x','GET'],['https://example.org/nested/webZ/arbitrary.json','GET']]){
  let handled=false;w.handlers.fetch({request:new Request(url,{method}),respondWith:()=>{handled=true;}});assert.equal(handled,false);
 }
 assert.equal(w.requests.length,before);assert.equal(w.stored.size,STATIC_PATHS.length);
 let response;w.handlers.fetch({request:new Request('https://example.org/nested/webZ/field/public-field.json'),respondWith:p=>response=p});await response;assert.equal(w.requests.length,before);
});
test('failed bootstrap removes its partial cache and does not install a false offline shell',async()=>{
 const w=worker(true);await assert.rejects(()=>w.run('install'),/STATIC_BOOTSTRAP_FAILED/);assert.deepEqual(w.deleted,[w.prefix+'current']);
});
test('activation removes incompatible same-scope caches and leaves neighboring scopes intact',async()=>{
 const w=worker();await w.run('activate');assert.deepEqual(w.deleted,[w.prefix+'old','webz-offline-001:/nested/webZ/']);
});
test('asset version deterministically changes when field bytes or any shell bytes change',()=>{
 const assets=[['field/public-field.json',Buffer.from('a')],['app/style.css',Buffer.from('x')]];
 assert.equal(assetVersion(assets),assetVersion(assets));
 assert.notEqual(assetVersion(assets),assetVersion([[assets[0][0],Buffer.from('b')],assets[1]]));
 assert.notEqual(assetVersion(assets),assetVersion([assets[0],[assets[1][0],Buffer.from('y')]]));
});

// Fragment canonicalization adapted from PR #25, 118eb60f4d8b1c244a0b40ea71f229946940669e.
test('exact navigator fragment replay works offline and query-bearing inputs are not cached',async()=>{
 const w=worker();await w.run('install');const before=w.requests.length;let task;
 w.handlers.fetch({request:new Request('https://example.org/nested/webZ/field/navigate/#WFN1/catalog/t01g01'),respondWith:p=>task=p});assert.ok(task);await task;assert.equal(w.requests.length,before);
 let handled=false;w.handlers.fetch({request:new Request('https://example.org/nested/webZ/field/navigate/?private=ignored#WFN1/catalog/t01g01'),respondWith:()=>handled=true});assert.equal(handled,false);
});
