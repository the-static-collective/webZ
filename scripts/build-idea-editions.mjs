// Source-pinned machine-native editions for local public idea exploration.
// No external ingestion or visitors; proposals are not publication/admission.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const ORIGIN='https://abundent.org';
const sha=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LAW={retrieved_is_read:false,chunk_is_book:false,fragment_is_context:false,retrieval_order_is_authority:false,reading_order_is_ancestry:false};
const identity=[
 {id:'empty-chair',title:'An Organization of Organizations That Do Not Exist Yet',text:'An organization may begin as an unanswered question. An empty chair is a place prepared for responsibility, not a claim that someone agreed to take it.'},
 {id:'freely-chosen-stewardship',title:'Invitation Is Not Consent',text:'A question may become an invitation; a willing steward may choose a bounded task; useful work may create a project. No one is appointed or committed by a mention or a link.'},
 {id:'weaves-to-weves',title:'Weaves Into We\'ves',text:'A weave is a relation, connection, idea, or possible capacity. A we\'ve is something shared that people can actually demonstrate. Do not call a proposed crossing a completed act.'}
];
function validate(entries){
 const ids=new Set();
 if(!Array.isArray(entries)||entries.length===0)throw Error('EMPTY_IDEA_ATLAS');
 for(const e of entries){
  if(!/^(slice-\d{3}|case-[a-z0-9-]+|clue-[a-z0-9-]+)$/.test(e.id)||ids.has(e.id))throw Error('BAD_IDEA_ID:'+e.id);ids.add(e.id);
  if(!['slice','treasure'].includes(e.lane)||typeof e.title!=='string'||typeof e.summary!=='string')throw Error('BAD_IDEA_ENTRY:'+e.id);
  const expected='https://github.com/'+e.sourceRepo+'/blob/'+e.sourceCommit+'/'+e.sourcePath;
  if(e.sourceUrl!==expected||!/^[a-f0-9]{40}$/.test(e.sourceCommit))throw Error('UNPINNED_UPSTREAM_SOURCE:'+e.id);
  if(!['the-static-collective/the-daily-slice','the-static-collective/national-treasure'].includes(e.sourceRepo))throw Error('OUTSIDE_PUBLIC_SOURCE_SCOPE:'+e.id);
  if(e.lane==='slice'!==e.sourceRepo.endsWith('the-daily-slice'))throw Error('SOURCE_LANE_CONFLICT:'+e.id);
  if(e.summary.length>450)throw Error('UNBOUNDED_SOURCE_SUMMARY:'+e.id);
 }
}
export async function buildIdeaEditions({output,files,commit}){
 if(!/^[0-9a-f]{40}$/.test(commit))throw Error('IMMUTABLE_IDEA_COMMIT_REQUIRED');
 const catalog=JSON.parse(await readFile(new URL('explore/catalog.json',output),'utf8'));
 if(catalog.schema!=='webz/explorable-idea-atlas/v1')throw Error('WRONG_IDEA_ATLAS_SCHEMA');
 validate(catalog.entries);
 let generated=0;
 async function emit(path,content){
  if(files.some(f=>f.path===path))throw Error('DUPLICATE_RELEASE_PATH:'+path);
  const bytes=Buffer.from(content,'utf8'),url=new URL(path,output);
  await mkdir(new URL('./',url),{recursive:true});await writeFile(url,bytes);
  files.push({path,sha256:sha(bytes),bytes:bytes.length,role:'source-pinned-idea-machine-edition'});generated++;
 }
 const editions=[];
 for(const lane of ['slice','treasure']){
  const entries=catalog.entries.filter(e=>e.lane===lane),prefix='for-computers/ideas/'+lane+'/';
  const work='lemonpress:public-idea-explorer:'+lane+':001',edition=work+':crawler:20261026';
  const manifest={
   schema_version:'computer-book-manifest-v0',work_id:work,edition_id:edition,lane:'crawler',
   status:'experimental-public-source-projection',title:lane==='slice'?'The Daily Slice: Forward Engine':'National Treasure: Backward Engine',
   source_ancestry:[{type:'curated-source-index',locator:'webZ:'+commit+':explore/catalog.json'},
    {type:'owner-repository',locator:lane==='slice'?'the-static-collective/the-daily-slice':'the-static-collective/national-treasure'}],
   retrieval_contract:LAW,fragments:entries.map(e=>({fragment_id:e.id,path:'fragments/'+e.id+'.json'}))
  };
  await emit(prefix+'manifest.json',JSON.stringify(manifest,null,2)+'\n');
  const edges=[];
  for(let i=0;i<entries.length;i++){
   const e=entries[i],next=entries.length>1?entries[(i+1)%entries.length]:null;
   const continuations=next?[{relation:'catalog-neighbor',target:next.id,scope:'local'}]:[];
   if(next)edges.push(JSON.stringify({from:e.id,relation:'catalog-neighbor',to:next.id,scope:'local'}));
   await emit(prefix+'fragments/'+e.id+'.json',JSON.stringify({
    schema_version:'computer-book-fragment-v0',work_id:work,edition_id:edition,fragment_id:e.id,
    title:e.title,carrier:e.summary,kind:e.kind,status:e.status,certainty:e.certainty,
    originalSource:e.sourceUrl,
    retrieval:{warning:'FRAGMENT != BOOK',manifest:'../manifest.json',continuations},
    ancestry:[{type:'upstream-public-source',locator:e.sourceUrl,exactCommit:e.sourceCommit},
      {type:'derived-public-index',locator:'webZ:'+commit+':explore/catalog.json'}],
    authority:{level:'none',does_not_grant:['approval','claim-confidence','source-identity','republication','execution','house-admission']},
    uncertainty:['Truncated public summary is not the original record.',
      'This experiment does not verify claims inside the research or historical slice.',
      'Recombination creates a question, not documentary ancestry or evidence.']
   },null,2)+'\n');
  }
  await emit(prefix+'relations.jsonl',edges.join('\n')+(edges.length?'\n':''));
  await emit(prefix+'index.json',JSON.stringify({
   schema:'lemonpress/idea-engine/v1',work_id:work,edition_id:edition,
   sourceCommit:commit,origin:ORIGIN,sourceCount:entries.length,
   sourceSemantics:lane==='slice'?'historical-formation-index':'landed-research-case-or-clue',
   fragments:entries.map(e=>({id:e.id,title:e.title,sourceUrl:e.sourceUrl,machineFragment:ORIGIN+'/'+prefix+'fragments/'+e.id+'.json'})),
   disclaimer:'Discovery is not endorsement or scientific/historical verification.'
  },null,2)+'\n');
  editions.push({lane,title:manifest.title,work_id:work,count:entries.length,
    manifest:ORIGIN+'/'+prefix+'manifest.json',index:ORIGIN+'/'+prefix+'index.json',
    sourceRepository:lane==='slice'?'the-static-collective/the-daily-slice':'the-static-collective/national-treasure'});
 }
 const prefix='for-computers/ideas/identity/';
 const work='lemonpress:organization-of-organizations:001',edition=work+':crawler:20261026';
 await emit(prefix+'manifest.json',JSON.stringify({
  schema_version:'computer-book-manifest-v0',work_id:work,edition_id:edition,
  lane:'crawler',status:'experimental-identity-edition',title:'The Organization-Shaped Empty Chair',
  source_ancestry:[{type:'site-source',locator:'webZ:'+commit+':becoming/index.html'},
   {type:'public-working-statement',locator:'https://github.com/the-static-collective/the-static-collective/blob/main/README.md'}],
  retrieval_contract:LAW,fragments:identity.map(x=>({fragment_id:x.id,path:'fragments/'+x.id+'.json'}))
 },null,2)+'\n');
 const edges=[];
 for(let i=0;i<identity.length;i++){
  const x=identity[i],next=identity[(i+1)%identity.length];
  edges.push(JSON.stringify({from:x.id,relation:'chapter-neighbor',to:next.id,scope:'local'}));
  await emit(prefix+'fragments/'+x.id+'.json',JSON.stringify({
   schema_version:'computer-book-fragment-v0',work_id:work,edition_id:edition,fragment_id:x.id,
   title:x.title,carrier:x.text,
   retrieval:{warning:'FRAGMENT != BOOK',manifest:'../manifest.json',continuations:[{relation:'chapter-neighbor',target:next.id,scope:'local'}]},
   ancestry:[{type:'public-site-projection',locator:'webZ:'+commit+':becoming/index.html'}],
   authority:{level:'none',does_not_grant:['legal-existence','acceptance','consent','partnership','house-admission','execution']},
   uncertainty:['This is a working identity statement, not a factual count of existing institutions.',
     'Any particular project status must be checked at its own source.']
  },null,2)+'\n');
 }
 await emit(prefix+'relations.jsonl',edges.join('\n')+'\n');
 const guide='# Books for Computers — The Organization-Shaped Empty Chair\n\n'
  +'Experimental, retrieval-native machine edition of the Static Collective working identity.\n\n'
  +'Read fragments in any order; none makes an invitation into consent, a project into an institution, or a connection into shared authority.\n\n'
  +'Manifest: '+ORIGIN+'/'+prefix+'manifest.json\n'
  +'Human original: '+ORIGIN+'/becoming/\n'
  +'GitHub working statement: https://github.com/the-static-collective/the-static-collective\n\n'
  +'RETRIEVAL != READING. INVITATION != CONSENT. WEAVE != WE\'VE.\n';
 await emit(prefix+'README.md',guide);
 await emit('for-computers/ideas/index.json',JSON.stringify({
  schema:'lemonpress/explorable-ideas/v1',sourceCommit:commit,snapshotDate:catalog.snapshotDate,
  status:'experimental-projection-no-house-admission',identityEdition:ORIGIN+prefix+'manifest.json',
  editions,proposedHosts:['slice.abundent.org','treasure.abundent.org'],
  domainState:'planned; no subdomain availability implied',
  laws:['SOURCE != PROJECTION','FRAGMENT != BOOK','RESEMBLANCE != ANCESTRY','PROPOSAL != ADMISSION']
 },null,2)+'\n');
 const landing='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Explorable idea editions · lemonPRESS</title><meta name="description" content="Source-pinned books for computer readers exploring the Static Collective, Daily Slice and National Treasure."></head><body><main><h1>Books for Computers · the idea engines</h1><p>Experimental source-linked editions. Fragments are not complete readings, and proposals are not evidence.</p><ul>'
  +'<li><a href="./identity/manifest.json">An Organization of Organizations That Do Not Exist Yet</a></li>'
  + '<li><a href="/for-computers/organizations/">The Unformed Organizations (six organizational seeds)</a></li>'
  +editions.map(x=>'<li><a href="./'+x.lane+'/manifest.json">'+esc(x.title)+'</a> · '+x.count+' source fragments</li>').join('')
  +'</ul><p><a href="./index.json">Machine-readable edition list</a> · <a href="/explore/">Human exploration table</a> · <a href="/for-computers/">Computer library</a></p></main></body></html>\n';
 await emit('for-computers/ideas/index.html',landing);
 return {editions:3,sources:catalog.entries.length,generated};
}
