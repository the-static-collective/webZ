import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canonical,verify,validate,projection,portableHtml,LENSES,escapeHtml} from '../post-office/seed-lab/seed.mjs';
const seed=JSON.parse(readFileSync(new URL('../post-office/seed-lab/seed-000.json',import.meta.url),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x));
test('seed 000 has deterministic content address independent of JSON key order',async()=>{
 assert.equal(validate(seed),seed.payload);
 const hash=createHash('sha256').update(canonical(seed.payload)).digest('hex');
 assert.equal(seed.digest,'sha256:'+hash);
 assert.deepEqual(await verify(seed),seed.payload);
 const reordered=clone(seed);reordered.payload=Object.fromEntries(Object.entries(reordered.payload).reverse());
 assert.deepEqual(await verify(reordered),seed.payload);
});
test('every independent reader recomputes the same payload hash',async()=>{
 const a=await verify(clone(seed));const b=await verify(clone(seed));
 assert.equal(canonical(projection(a,0,10)),canonical(projection(b,0,10)));
 assert.equal(canonical(projection(a,1,10)),canonical(projection(b,1,10)));
});
test('content tamper, metadata tamper, and invalid envelopes fail closed',async()=>{
 for(const change of [
  s=>s.payload.sections[0].text+=' An unauthorized change.',
  s=>s.payload.publisher='a counterfeit author',
  s=>s.payload.sections[0].facets.push('unknown'),
  s=>s.payload.sections[0].text='<img src=x onerror=alert(1)>',
  s=>s.payload.source='https://evil.invalid/untrusted',
  s=>s.payload.extra='silent new claim',
  s=>s.schema='different-schema',
  s=>s.digest='sha256:'+'0'.repeat(64),
  s=>s.payload.sections.push(s.payload.sections[0])
 ]){const altered=clone(seed);change(altered);await assert.rejects(verify(altered));}
});
test('11-stop dials reveal authored content, preserve empty HOLD',async()=>{
 const p=await verify(seed);
 assert.equal(LENSES.length,11);
 assert.equal(projection(p,3,10).empty,true); // no engineering claim exists in source
 assert.equal(projection(p,7,10).empty,true); // no visual claim exists in source
 assert.equal(projection(p,1,10).sections.length,2); // music-tagged source
 assert.equal(projection(p,0,10).sections.length,4);
 assert.ok(projection(p,0,3).sections.every(s=>s.text===null));
 assert.ok(projection(p,0,4).sections.every(s=>typeof s.text==='string'));
 assert.ok(projection(p,0,7).sections.every(s=>s.facets.length===0));
 assert.ok(projection(p,0,8).sections.every(s=>s.facets.length>0));
 assert.throws(()=>projection(p,-1,5));
 assert.throws(()=>projection(p,0,11));
});
test('portable HTML contains no code, remote assets, or subscriber data',async()=>{
 await verify(seed);
 const page=portableHtml(seed,0,10);
 assert.match(page,/Content-Security-Policy/);
 assert.doesNotMatch(page,/<script|<iframe|<img|<link|<form|https?:\/\/[^<]*\.(js|css|png)/i);
 assert.match(page,/No automatic|offline projection|offline projection/i);
 assert.match(page,/sha256:b335d30c/);
 assert.match(page,/We play where we arrive/);
 assert.doesNotMatch(page,/buttondown|subscriber-email|api\/emails/i);
 assert.equal(escapeHtml('<script>"'), '&lt;script&gt;&quot;');
});
test('seed lab is a public, bounded static route and cannot silently mutate offline cache',()=>{
 const release=readFileSync(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');
 for(const path of ['post-office/seed-lab/','post-office/seed-lab/seed.mjs','post-office/seed-lab/reader.mjs','post-office/seed-lab/seed-000.json']) assert.ok(release.includes("'"+path+"'"));
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.doesNotMatch(sw,/post-office\/seed-lab/);
 const entry=readFileSync(new URL('../post-office/seed-lab/index.html',import.meta.url),'utf8');
 assert.match(entry,/HASH ≠ AUTHORSHIP/);
 assert.doesNotMatch(entry,/name="email"|type="email"|localStorage/);
});
