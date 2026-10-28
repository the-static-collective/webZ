import { test } from 'node:test';import assert from 'node:assert/strict';
import { DOORS } from './manifest.mjs';
test('index includes every inventoried project exactly once',()=>{
  assert.equal(DOORS.length,24);
  assert.equal(new Set(DOORS.map(d=>d.project)).size,24);
  assert.equal(new Set(DOORS.map(d=>d.slug)).size,24);
});
test('public destinations use HTTPS and no broken routes are advertised as usable',()=>{
  for(const door of DOORS){
    assert.match(door.href,/^https:\/\//);
    assert.ok(['open','restricted','repair'].includes(door.status));
    assert.ok(['care','community','tools','publishing','creative'].includes(door.category));
    assert.ok(door.description && door.note);
    if(door.status==='repair') assert.match(door.note,/error|repair|ERROR/i);
  }
});
test('partner-safe descriptions never conflate prototypes and live services',()=>{
  assert.ok(DOORS.find(d=>d.slug==='porchlight')?.note.includes('demonstration'));
  assert.ok(DOORS.find(d=>d.slug==='farm')?.note.includes('No farm partnership'));
  assert.ok(DOORS.find(d=>d.slug==='msyou')?.note.includes('not a university service'));
});

// Regression: the switchboard must ship its own /jubilee/ path, not a dangling link.
test('Jubilee Circuit is linked and included in the portable static build',async()=>{
 const fs=await import('node:fs');
 const build=fs.readFileSync(new URL('./build.mjs',import.meta.url),'utf8');
 const landing=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.match(build,/join\(root,'\.\.\/jubilee'\)/);
 assert.match(landing,/href="\.\/jubilee\/"/);
 assert.ok(fs.existsSync(new URL('../jubilee/index.html',import.meta.url)));
});

test('Between Rooms proposal room is linked and shipped in the static artifact',async()=>{
 const fs=await import('node:fs');
 const build=fs.readFileSync(new URL('./build.mjs',import.meta.url),'utf8');
 const landing=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(build.includes("cpSync(join(root,'../bridge'),join(out,'bridge'),{recursive:true});"));
 assert.ok(landing.includes('href="./bridge/"'));
 for(const p of ['index.html','app.mjs','style.css','model.mjs','bridge-proposal-v0.json']){
  assert.ok(fs.existsSync(new URL('../bridge/'+p,import.meta.url)),p);
 }
 const manifest=JSON.parse(fs.readFileSync(new URL('../bridge/bridge-proposal-v0.json',import.meta.url),'utf8'));
 assert.equal(manifest.schema,'abundent/bridge-network-manifest-v0');
 assert.equal(manifest.status,'PROSPECTIVE_ONLY');
 assert.equal(manifest.doors.length,9);
});

test('Constellation atlas has an independently built source address rack',async()=>{
 const fs=await import('node:fs');
 const build=fs.readFileSync(new URL('./build.mjs',import.meta.url),'utf8');
 const landing=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.ok(build.includes("cpSync(join(root,'../bridge'),join(out,'bridge'),{recursive:true});"));
 assert.ok(landing.includes('href="./bridge/atlas/"'));
 const atlas=JSON.parse(fs.readFileSync(new URL('../bridge/atlas/atlas.json',import.meta.url),'utf8'));
 assert.equal(atlas.repositories.length,89);
});

test('portable Switchboard includes the private source-derived outbox with no backend client',async()=>{
 const fs=await import('node:fs');
 const src=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const outbox=fs.readFileSync(new URL('../bridge/outbox/index.html',import.meta.url),'utf8');
 assert.ok(src.includes('href="./bridge/outbox/"'));
 assert.ok(outbox.includes("connect-src 'none'"));
 assert.ok(fs.existsSync(new URL('../bridge/outbox/vault.mjs',import.meta.url)));
});

test('Pages publication triggers for independently owned rooms, without an apps file touch',async()=>{
 const fs=await import('node:fs');
 const workflow=fs.readFileSync(new URL('../.github/workflows/abundent-portable-static.yml',import.meta.url),'utf8');
 for(const path of ["'apps/**'","'bridge/**'","'commons/**'","'jubilee/**'"]) assert.ok(workflow.includes(path),path);
 assert.ok(workflow.includes('test -f apps/dist/bridge/outbox/index.html'));
});
