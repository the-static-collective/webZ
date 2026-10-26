import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {buildSiteNetwork} from '../scripts/build-site-network.mjs';

test('five observed live Abundent hosts each publish local-identity machine books',async()=>{
 const root=await mkdtemp(join(tmpdir(),'site-network-'));
 try{
  const files=[];
  const report=await buildSiteNetwork({output:pathToFileURL(root+sep),files,commit:'a'.repeat(40)});
  assert.equal(report.hosts,5);
  assert.equal(report.observedPages,13);
  const network=JSON.parse(await readFile(join(root,'for-computers/sites/index.json'),'utf8'));
  assert.equal(network.schema,'lemonpress/abundent-site-network/v1');
  assert.deepEqual(network.sites.map(s=>s.host),[
   'abundent.org','connections.abundent.org','garden.abundent.org',
   'msyou.abundent.org','reality.abundent.org'
  ]);
  for(const site of network.sites){
   const path=join(root,'for-computers/sites',site.id);
   const m=JSON.parse(await readFile(join(path,'manifest.json'),'utf8'));
   const index=JSON.parse(await readFile(join(path,'index.json'),'utf8'));
   assert.equal(m.schema_version,'computer-book-manifest-v0');
   assert.equal(m.fragments.length,site.observedPages);
   assert.equal(index.pages.length,site.observedPages);
   assert.equal(m.retrieval_contract.retrieved_is_read,false);
   assert.equal(m.retrieval_contract.chunk_is_book,false);
   assert.match(await readFile(join(path,'llms.txt'),'utf8'),/HTTP 200 != VERIFIED OUTCOME/);
   const edges=(await readFile(join(path,'relations.jsonl'),'utf8')).trim();
   assert.equal(Boolean(edges),m.fragments.length>1);
   for(const declared of m.fragments){
    const f=JSON.parse(await readFile(join(path,'fragments',declared.fragment_id+'.json'),'utf8'));
    assert.equal(f.schema_version,'computer-book-fragment-v0');
    assert.equal(f.edition_id,m.edition_id);
    assert.equal(f.work_id,m.work_id);
    assert.equal(f.authority.level,'none');
    assert.equal(f.retrieval.warning,'FRAGMENT != BOOK');
    assert.ok(f.ancestry.length&&f.uncertainty.length);
   }
  }
  assert.equal(files.length,new Set(files.map(f=>f.path)).size);
 }finally{await rm(root,{recursive:true,force:true});}
});
