import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {buildOrganizationBooks} from '../scripts/build-organization-books.mjs';

const src=new URL('../becoming/doors/seeds.json',import.meta.url);
test('six empty chairs stay proposals and never invent memberships',async()=>{
 const data=JSON.parse(await readFile(src,'utf8'));
 assert.equal(data.schema,'webz/organization-seeds/v1');
 assert.equal(data.status,'design-proposals-only');
 assert.equal(data.seeds.length,6);
 assert.equal(new Set(data.seeds.map(x=>x.id)).size,6);
 assert.ok(data.boundaries.noVisitorDataStorage);
 assert.ok(data.boundaries.noPartnersClaimed);
 assert.ok(data.boundaries.noVolunteersAssigned);
 for(const s of data.seeds){
  assert.match(s.id,/^[a-z0-9-]+$/);
  for(const x of ['mission','firstAct','firstQuestion','firstSteward','firstReceipt','guardrail'])
   assert.ok(s[x].length>=25,s.id+':'+x);
  assert.ok(s.neighbors.every(n=>n.url.startsWith('https://')));
  assert.ok(!s.status||s.status!=='OPERATING');
 }
 const app=await readFile(new URL('../becoming/doors/app.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(app,/\.innerHTML|localStorage|sessionStorage|sendBeacon|eval\(/);
 assert.match(app,/fetch\('\/becoming\/doors\/seeds.json',\{cache:'no-store',credentials:'omit'\}\)/);
 assert.match(app,/UNFORMED_CANDIDATE/);
 assert.match(app,/proposalOnly:true/);
 const html=await readFile(new URL('../becoming/doors/index.html',import.meta.url),'utf8');
 assert.match(html,/No visitor draft is saved/);
 assert.match(html,/id="understand"/);
 assert.match(html,/id="open-blank"/);
 assert.match(html,/id="save-json"/);
 assert.match(await readFile(new URL('../becoming/index.html',import.meta.url),'utf8'),/href="\/becoming\/doors\/"/);
});
test('a computer-native fragment never establishes an actual organization',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'unformed-'));
 try{
  const output=pathToFileURL(dir+sep),files=[];
  await mkdir(join(dir,'becoming/doors'),{recursive:true});
  await writeFile(join(dir,'becoming/doors/seeds.json'),await readFile(src));
  files.push({path:'becoming/doors/seeds.json',sha256:'committed',bytes:42});
  const result=await buildOrganizationBooks({output,files,commit:'b'.repeat(40)});
  assert.equal(result.fragments,6);
  assert.equal(result.releaseStatus,'proposal-only');
  const prefix=join(dir,'for-computers/organizations');
  const m=JSON.parse(await readFile(join(prefix,'manifest.json'),'utf8'));
  assert.equal(m.schema_version,'computer-book-manifest-v0');
  assert.equal(m.fragments.length,6);
  assert.equal(m.organization_contract.established,false);
  assert.equal(m.organization_contract.staff,'none-appointed');
  assert.equal(m.retrieval_contract.fragment_is_context,false);
  const edges=(await readFile(join(prefix,'relations.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(edges.length,6);
  for(const ref of m.fragments){
   const f=JSON.parse(await readFile(join(prefix,ref.path),'utf8'));
   assert.equal(f.work_id,m.work_id);
   assert.equal(f.edition_id,m.edition_id);
   assert.equal(f.status,'UNFORMED_ORGANIZATION_SEED');
   assert.equal(f.authority.level,'none');
   assert.ok(f.authority.does_not_grant.includes('legal-entity'));
   assert.equal(f.domainState,'unconfigured-proposal');
   assert.equal(f.retrieval.warning,'FRAGMENT != BOOK');
   assert.ok(f.ancestry.some(a=>a.locator.includes('webZ:'+'b'.repeat(40))));
   assert.ok(edges.some(e=>e.from===f.fragment_id && m.fragments.some(x=>x.fragment_id===e.to)));
   const card=JSON.parse(await readFile(join(prefix,'cards',ref.fragment_id+'.json'),'utf8'));
   assert.equal(card.status,'UNFORMED');
   assert.equal(card.authority,'NONE');
  }
  const idx=JSON.parse(await readFile(join(prefix,'index.json'),'utf8'));
  assert.equal(idx.entries.length,6);
  assert.equal(idx.status,'PROPOSAL_ONLY');
  assert.equal(new Set(files.map(f=>f.path)).size,files.length);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('machine builder fails closed on duplicate identities and illegal organization-state promotion',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'unformed-failure-'));
 try{
  const output=pathToFileURL(dir+sep),files=[];
  await mkdir(join(dir,'becoming/doors'),{recursive:true});
  const data=JSON.parse(await readFile(src,'utf8'));
  data.status='operating';
  await writeFile(join(dir,'becoming/doors/seeds.json'),JSON.stringify(data));
  await assert.rejects(()=>buildOrganizationBooks({output,files,commit:'f'.repeat(40)}),/SCHEMA_OR_STATUS/);
  data.status='design-proposals-only';data.seeds[1].id=data.seeds[0].id;
  await writeFile(join(dir,'becoming/doors/seeds.json'),JSON.stringify(data));
  await assert.rejects(()=>buildOrganizationBooks({output,files,commit:'f'.repeat(40)}),/BAD_SEED_ID/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
