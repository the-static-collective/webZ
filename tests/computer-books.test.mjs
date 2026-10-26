import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {buildComputerBooks} from '../scripts/build-computer-books.mjs';

const sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('lemonPRESS machine edition indexes all released public HTML, not visitor text',async()=>{
  const root=await mkdtemp(join(tmpdir(),'computer-books-'));
  try{
    const output=pathToFileURL(root+sep);
    await mkdir(join(root,'welcome'),{recursive:true});
    const home='<!doctype html><html><head><title>Abundent &amp; friends</title><meta name="description" content="Public workbench"></head><body><p>NOT_FOR_METADATA</p></body></html>';
    const welcome='<html><head><title>Welcome</title></head><body><h1>Welcome</h1></body></html>';
    await writeFile(join(root,'index.html'),home);
    await writeFile(join(root,'welcome','index.html'),welcome);
    const files=[
      {path:'index.html',sha256:sha(Buffer.from(home)),bytes:Buffer.byteLength(home)},
      {path:'welcome/index.html',sha256:sha(Buffer.from(welcome)),bytes:Buffer.byteLength(welcome)},
      {path:'app/file.js',sha256:'unchanged',bytes:5}
    ];
    const result=await buildComputerBooks({output,files,commit:'a'.repeat(40)});
    assert.equal(result.pages,2);
    assert.equal(result.books,2);
    assert.ok(result.generated>=10);
    const decorated=await readFile(join(root,'index.html'),'utf8');
    assert.match(decorated,/rel="alternate" type="application\/json"/);
    assert.match(decorated,/href="\/for-computers\/pages\/home.json"/);
    assert.ok(files[0].sourceSha256);
    assert.notEqual(files[0].sourceSha256,files[0].sha256);
    assert.equal(files[2].sha256,'unchanged');
    const catalog=JSON.parse(await readFile(join(root,'for-computers','index.json'),'utf8'));
    assert.deepEqual(catalog.pages.map(p=>p.path),['/','/welcome/']);
    assert.equal(catalog.pages[0].title,'Abundent & friends');
    assert.equal(catalog.pages[0].sourceCommit,'a'.repeat(40));
    assert.doesNotMatch(JSON.stringify(catalog),/NOT_FOR_METADATA/);
    const manifest=JSON.parse(await readFile(join(root,'for-computers','manifest.json'),'utf8'));
    assert.equal(manifest.schema_version,'computer-book-manifest-v0');
    assert.equal(manifest.lane,'crawler');
    assert.equal(manifest.fragments.length,2);
    for(const law of ['retrieved_is_read','chunk_is_book','fragment_is_context',
      'retrieval_order_is_authority','reading_order_is_ancestry'])
      assert.equal(manifest.retrieval_contract[law],false);
    const fragmentDir=join(root,'for-computers','fragments');
    const edges=(await readFile(join(root,'for-computers','relations.jsonl'),'utf8'))
      .trim().split('\n').map(line=>JSON.parse(line));
    const observed=[];
    for(const entry of manifest.fragments) {
      const fragment=JSON.parse(await readFile(join(fragmentDir,entry.fragment_id+'.json'),'utf8'));
      assert.equal(fragment.schema_version,'computer-book-fragment-v0');
      assert.equal(fragment.work_id,manifest.work_id);
      assert.equal(fragment.edition_id,manifest.edition_id);
      assert.equal(fragment.fragment_id,entry.fragment_id);
      assert.equal(fragment.retrieval.warning,'FRAGMENT != BOOK');
      assert.equal(fragment.retrieval.manifest,'../manifest.json');
      assert.equal(fragment.authority.level,'none');
      assert.ok(fragment.ancestry.length>0);
      assert.ok(fragment.uncertainty.length>0);
      for(const edge of fragment.retrieval.continuations)
        observed.push({from:fragment.fragment_id,relation:edge.relation,to:edge.target,scope:edge.scope});
    }
    assert.deepEqual(observed,edges);
    assert.ok(edges.every(e=>manifest.fragments.some(f=>f.fragment_id===e.to)));

    assert.match(await readFile(join(root,'llms.txt'),'utf8'),/RETRIEVAL != COMPLETE READING/);
    assert.match(await readFile(join(root,'sitemap.xml'),'utf8'),/https:\/\/abundent.org\/welcome\//);
    assert.match(await readFile(join(root,'for-computers','books','001-a-leaf-is-not-the-forest.md'),'utf8'),/A Leaf Is Not the Forest/);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('machine edition rejects duplicate page names after flattening',async()=>{
  const root=await mkdtemp(join(tmpdir(),'computer-books-collision-'));
  try{
    const output=pathToFileURL(root+sep);
    for(const rel of ['a/b/index.html','a--b/index.html']){
      const file=join(root,...rel.split('/'));
      await mkdir(join(file,'..'),{recursive:true});
      await writeFile(file,'<html><head><title>X</title></head></html>');
    }
    const files=['a/b/index.html','a--b/index.html'].map(path=>({path,sha256:'source',bytes:50}));
    await assert.rejects(()=>buildComputerBooks({output,files,commit:'b'.repeat(40)}),/COLLISION/);
  }finally{await rm(root,{recursive:true,force:true});}
});
