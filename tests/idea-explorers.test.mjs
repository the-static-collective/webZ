import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {buildIdeaEditions} from '../scripts/build-idea-editions.mjs';

const catalogPath=new URL('../explore/catalog.json',import.meta.url);
const htmlPages=['../becoming/index.html','../explore/index.html','../explore/slice/index.html','../explore/treasure/index.html'];
test('the human idea surfaces have source-readable pages and local-only interface',async()=>{
 for(const rel of htmlPages){
  const s=await readFile(new URL(rel,import.meta.url),'utf8');
  assert.match(s,/<title>/);assert.match(s,/<meta name="description"/);
  assert.match(s,/<main\b/);assert.match(s,/\/explore\/style.css/);
 }
 const home=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(home,/href="\/becoming\/"/);
 assert.match(home,/href="\/explore\/"/);
 const js=await readFile(new URL('../explore/app.mjs',import.meta.url),'utf8');
 assert.match(js,/navigator.clipboard.writeText/);
 assert.match(js,/credentials:'omit'/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|sendBeacon|\.innerHTML|eval\(/);
});
test('upstream index contains source-pinned, nonduplicated public pointers only',async()=>{
 const j=JSON.parse(await readFile(catalogPath,'utf8'));
 assert.equal(j.schema,'webz/explorable-idea-atlas/v1');
 assert.equal(j.entries.length,48);
 assert.equal(j.entries.filter(x=>x.lane==='slice').length,29);
 assert.equal(j.entries.filter(x=>x.lane==='treasure').length,19);
 assert.equal(new Set(j.entries.map(x=>x.id)).size,j.entries.length);
 for(const x of j.entries){
  assert.match(x.sourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(x.sourceUrl,'https://github.com/'+x.sourceRepo+'/blob/'+x.sourceCommit+'/'+x.sourcePath);
  assert.ok(x.summary.length>20&&x.summary.length<=450);
  assert.ok(x.certainty.length>8);
  assert.ok(x.lane==='slice'?x.sourceRepo.endsWith('the-daily-slice'):x.sourceRepo.endsWith('national-treasure'));
 }
 assert.match(j.boundaries.join(' '),/no user submissions/);
});
test('computer editions keep independently scoped source authority and a complete local fragment graph',async()=>{
 const root=await mkdtemp(join(tmpdir(),'idea-editions-'));
 try{
  const output=pathToFileURL(root+sep),files=[];
  await mkdir(join(root,'explore'),{recursive:true});
  await writeFile(join(root,'explore/catalog.json'),await readFile(catalogPath));
  files.push({path:'explore/catalog.json',sha256:'committed',bytes:22});
  const result=await buildIdeaEditions({output,files,commit:'a'.repeat(40)});
  assert.deepEqual([result.editions,result.sources],[3,48]);
  const n=JSON.parse(await readFile(join(root,'for-computers/ideas/index.json'),'utf8'));
  assert.equal(n.editions.length,2);
  assert.equal(n.domainState,'planned; no subdomain availability implied');
  for(const [lane,count] of [['slice',29],['treasure',19]]){
   const prefix=join(root,'for-computers/ideas',lane);
   const m=JSON.parse(await readFile(join(prefix,'manifest.json'),'utf8'));
   assert.equal(m.fragments.length,count);
   assert.equal(m.retrieval_contract.retrieved_is_read,false);
   const relation=(await readFile(join(prefix,'relations.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
   assert.equal(relation.length,count);
   for(const f of m.fragments){
    const entry=JSON.parse(await readFile(join(prefix,f.path),'utf8'));
    assert.equal(entry.work_id,m.work_id);
    assert.equal(entry.edition_id,m.edition_id);
    assert.equal(entry.authority.level,'none');
    assert.match(entry.originalSource,/\/blob\/[a-f0-9]{40}\//);
    assert.equal(entry.retrieval.warning,'FRAGMENT != BOOK');
    assert.ok(relation.some(e=>e.from===f.fragment_id && m.fragments.some(b=>b.fragment_id===e.to)));
   }
  }
  const identity=JSON.parse(await readFile(join(root,'for-computers/ideas/identity/manifest.json'),'utf8'));
  assert.equal(identity.fragments.length,3);
  const fragment=JSON.parse(await readFile(join(root,'for-computers/ideas/identity/fragments/empty-chair.json'),'utf8'));
  assert.equal(fragment.authority.level,'none');
  assert.ok(fragment.authority.does_not_grant.includes('legal-existence'));
  assert.equal(files.length,new Set(files.map(f=>f.path)).size);
 }finally{await rm(root,{recursive:true,force:true})}
});
