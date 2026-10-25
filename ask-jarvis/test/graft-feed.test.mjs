import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGraftFeed,readGraftFeed,graftFieldEntries,selectGraftEntries} from '../src/graft-feed.mjs';
import {normalizeFieldPack} from '../public/field-witness.mjs';
import {verifyReturn} from '../public/evidence.mjs';
import {assemble} from '../src/worker.mjs';

const SHA='aa3984d2dbdf949996639b029ca0d95ab6c290e5';
const entry=(id,publication='PUBLIC_SUMMARY_PROPOSED_FOR_REVIEW')=>({
 id:'GRAFT-'+id,lane:'workbench',status:'DOCUMENTED_ARTIFACT',title:'GRAFT local printable source kit',
 summary:'The GRAFT tool writes a bounded synthetic grocery kit to a deliberately selected local directory and records a hash receipt.',
 firstCheck:'Would a willing human organizer review a single fictional printout without committing to run anything?',
 sourceRepo:'GRAFT',sourceCommit:SHA,sourcePath:'docs/LIVE-WORK-002.md',
 effects:'LOCAL_SYNTHETIC_FILES_ONLY',sourceState:'PUBLIC_DOC_PIN_NOT_OWNER_CANON',publication
});
const feed={schema:'graft/public-commons-feed-v1',release:'GRAFT-COMMONS-001-2026-10-25',
 entries:[entry('WORK-002'),entry('APPROVED-001','PUBLIC_SUMMARY_APPROVED')]};
const raw=JSON.stringify(feed);
test('GRAFT main admits only explicitly approved public summaries while preview marks candidate',()=>{
 const preview=parseGraftFeed(raw,{preview:true});
 const main=parseGraftFeed(raw,{preview:false});
 assert.equal(preview.entries.length,2);
 assert.equal(main.entries.length,1);
 assert.equal(main.entries[0].id,'GRAFT-APPROVED-001');
 assert.equal(preview.state,'STAGED_FOR_REVIEW');
 assert.equal(main.state,'APPROVED_SUMMARIES_ONLY');
 assert.equal(preview.entries[0].sourceUrl,'https://github.com/the-static-collective/GRAFT/blob/'+SHA+'/docs/LIVE-WORK-002.md');
});
test('GRAFT rejects contact data, secret-like payloads, external references and invented effects',()=>{
 for(const field of [
  {summary:'Contact me at person@example.com.'},
  {summary:'Call us on 612-555-7777.'},
  {summary:'api_key=ABCDEFGHsecret keep it public.'},
  {sourceCommit:'a short branch name'},
  {sourceRepo:'unapproved-private-org'},
  {sourcePath:'../../PRIVATE.md'},
  {publication:'CANON'},
  {sourceState:'ADOPTED_BY_PARTNER'}
 ]) {
  const doc={...feed,entries:[{...entry('BAD-001'),...field}]};
  assert.throws(()=>parseGraftFeed(JSON.stringify(doc),{preview:true}),/GRAFT_FEED_ENTRY_INVALID/);
 }
});
test('GRAFT document source selection is bounded and labels candidate context honestly',()=>{
 const parsed=parseGraftFeed(raw,{preview:true});
 const selected=selectGraftEntries(parsed.entries,'groceries grocery local printable kit');
 assert.ok(selected.length<=3);
 const graft={schema:'jarvis/graft-feed-v1',status:'READ',state:parsed.state,
   selected,release:parsed.release,sourceSha256:'sha256:'+'a'.repeat(64)};
 const fp=graftFieldEntries(graft);
 assert.equal(fp.length,2);
 assert.ok(fp.every(x=>x.id.startsWith('FW-GRAFT-')));
 assert.ok(fp.every(x=>x.observation.startsWith('GRAFT STAGED PUBLIC NOTE (REVIEW PENDING): ')));
 assert.equal(normalizeFieldPack({schema:'ask-jarvis/field-witness-v1',entries:[
  ...fp,{...fp[0],id:'FW-THIRD-001'}
 ]}).entries.length,3);
});
test('read-only GRAFT feed uses exact allowed GRAFT host and does not emit unapproved main sources',async()=>{
 let calls=0;
 const preview=await readGraftFeed('grocery printout',{
  env:{VERCEL_ENV:'preview'},now:()=>1600,
  fetcher:async(url,opts)=>{calls++;
    assert.equal(url,'https://raw.githubusercontent.com/the-static-collective/GRAFT/feature/commons-approved-feed-001/commons-feed.json');
    assert.equal(opts.method,'GET');
    return new Response(raw,{status:200,headers:{'content-type':'application/json'}});
  }});
 assert.equal(calls,1);
 assert.equal(preview.status,'READ');
 assert.equal(preview.selected.length,2);
 const live=await readGraftFeed('grocery printout',{
  env:{VERCEL_ENV:'production'},now:()=>1600,
  fetcher:async(url)=>{assert.equal(url,'https://raw.githubusercontent.com/the-static-collective/GRAFT/main/commons-feed.json');return new Response(raw,{status:200})}
 });
 assert.equal(live.selected.length,1);
});
test('question return records the graft source state and detects tampering',async()=>{
 const graft={schema:'jarvis/graft-feed-v1',status:'READ',state:'STAGED_FOR_REVIEW',
  release:'trial',sourceSha256:'sha256:'+'c'.repeat(64),
  selected:selectGraftEntries(parseGraftFeed(raw,{preview:true}).entries,'grocery printed')};
 const mock=async()=>new Response('# synthetic public test source\nAny operation requires human review.\n',{status:200});
 const result=await assemble('How could a fictional grocery kit help local organizers?',mock,{graft});
 assert.equal(result.graft.state,'STAGED_FOR_REVIEW');
 assert.equal(result.graft.selected.length,2);
 assert.ok(result.artifact.includes('GRAFT project-source feed'));
 assert.equal(await verifyReturn(result),true);
 const changed=structuredClone(result);changed.graft.selected[0].publication='PUBLIC_SUMMARY_APPROVED';
 assert.equal(await verifyReturn(changed),false);
});
