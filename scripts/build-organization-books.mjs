// WEBZ-036: source-linked, non-admitted computer book of UNFORMED organizational seeds.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const ORIGIN='https://abundent.org';
const SHA=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LAW={retrieved_is_read:false,chunk_is_book:false,fragment_is_context:false,retrieval_order_is_authority:false,reading_order_is_ancestry:false};
const WORK='lemonpress:unformed-organization-doors:001',EDITION=WORK+':crawler:20261026';
export async function buildOrganizationBooks({output,files,commit}){
 if(!/^[0-9a-f]{40}$/.test(commit))throw Error('UNFORMED_BOOK_SOURCE_SHA_REQUIRED');
 const source=JSON.parse(await readFile(new URL('becoming/doors/seeds.json',output),'utf8'));
 if(source.schema!=='webz/organization-seeds/v1'||source.status!=='design-proposals-only'||source.boundaries?.noLegalEntity!==true||!Array.isArray(source.seeds)||source.seeds.length!==6)throw Error('UNFORMED_CATALOG_SCHEMA_OR_STATUS');
 const ids=new Set();
 for(const seed of source.seeds){
  if(!/^[a-z][a-z0-9-]{2,40}$/.test(seed.id)||ids.has(seed.id))throw Error('BAD_SEED_ID');
  ids.add(seed.id);
  for(const k of ['title','mission','firstAct','firstQuestion','firstSteward','firstReceipt','guardrail']){
   if(typeof seed[k]!=='string'||seed[k].trim().length<25)throw Error('BAD_SEED_FIELD:'+seed.id+':'+k);
  }
  if(!Array.isArray(seed.neighbors)||seed.neighbors.some(n=>typeof n.title!=='string'||!/^https:\/\//.test(n.url)))throw Error('BAD_SEED_NEIGHBORS');
 }
 let generated=0;
 async function emit(path,content){
  if(files.some(f=>f.path===path))throw Error('DUPLICATE_RELEASE_ASSET:'+path);
  const bytes=Buffer.from(content,'utf8'),url=new URL(path,output);
  await mkdir(new URL('./',url),{recursive:true});await writeFile(url,bytes);
  files.push({path,sha256:SHA(bytes),bytes:bytes.length,role:'unformed-organization-machine-proposal'});
  generated++;
 }
 const base='for-computers/organizations/';
 const manifest={schema_version:'computer-book-manifest-v0',work_id:WORK,edition_id:EDITION,lane:'crawler',
  status:'experimental-machine-proposal-not-a-house-admission',
  title:'The Unformed Organizations — A Library of Empty Chairs',
  source_ancestry:[{type:'first-party-proposed-seed-catalog',locator:'webZ:'+commit+':becoming/doors/seeds.json'},
   {type:'working-identity-page',locator:'webZ:'+commit+':becoming/index.html'}],
  retrieval_contract:LAW,
  organization_contract:{established:false,legalStatus:'not-claimed',staff:'none-appointed',consent:'not-granted',
   partnership:'not-claimed',invitation:'proposal-only',intake:'none',visitorStorage:'none'},
  fragments:source.seeds.map(s=>({fragment_id:s.id,path:'fragments/'+s.id+'.json'}))
 };
 await emit(base+'manifest.json',JSON.stringify(manifest,null,2)+'\n');
 const relations=[],index=[];
 for(let i=0;i<source.seeds.length;i++){
  const seed=source.seeds[i],next=source.seeds[(i+1)%source.seeds.length];
  const relation={from:seed.id,relation:'adjacent-proposal-not-affiliation',to:next.id,scope:'local'};
  relations.push(JSON.stringify(relation));
  const fragment={
   schema_version:'computer-book-fragment-v0',work_id:WORK,edition_id:EDITION,
   fragment_id:seed.id,title:seed.title,carrier:seed.mission,
   status:'UNFORMED_ORGANIZATION_SEED',suggestedDomain:seed.domainIdea,domainState:'unconfigured-proposal',
   firstQuestion:seed.firstQuestion,firstAct:seed.firstAct,stewardshipRole:seed.firstSteward,
   firstReturn:seed.firstReceipt,consentBoundary:seed.guardrail,
   retrieval:{warning:'FRAGMENT != BOOK',manifest:'../manifest.json',
     continuations:[{relation:relation.relation,target:next.id,scope:'local'}]},
   ancestry:[{type:'public-proposal-source',locator:'webZ:'+commit+':becoming/doors/seeds.json#'+seed.id},
    {type:'inspirational-neighbors-only',locators:seed.neighbors.map(n=>n.url)}],
   authority:{level:'none',does_not_grant:['legal-entity','registered-nonprofit','partnership','voluntary-acceptance','membership','execution','evidence-of-outcome','publisher-house-admission']},
   uncertainty:['A proposal is not proof that anyone is doing the work.',
    'Suggested domains and neighbor sources do not indicate configured hosts, affiliation or consent.',
    'There is no live intake or communication with potential stewards.']
  };
  await emit(base+'fragments/'+seed.id+'.json',JSON.stringify(fragment,null,2)+'\n');
  const card={schema:'lemonpress/unformed-organization-seed/v1',id:seed.id,title:seed.title,
    status:'UNFORMED',sourceCommit:commit,sourcePath:'becoming/doors/seeds.json',
    publicDraftDoor:ORIGIN+'/becoming/doors/',machineFragment:ORIGIN+'/'+base+'fragments/'+seed.id+'.json',
    sourceNotes:seed.neighbors,mission:seed.mission,firstAct:seed.firstAct,
    authority:'NONE',note:'A candidate organizational form, not an existing entity, membership request, partnership or completed act.'};
  await emit(base+'cards/'+seed.id+'.json',JSON.stringify(card,null,2)+'\n');
  await emit(base+'chapters/'+seed.id+'.md',
   '# '+seed.title+' — a proposed organization\n\n'
   +'Status: UNFORMED / PROPOSAL ONLY\n\n'
   +'Mission hypothesis: '+seed.mission+'\n\n'
   +'First question: '+seed.firstQuestion+'\n\n'
   +'Smallest first experiment: '+seed.firstAct+'\n\n'
   +'Possible voluntary steward (role, not an assigned person): '+seed.firstSteward+'\n\n'
   +'What would count as an inspectable return: '+seed.firstReceipt+'\n\n'
   +'Required boundary: '+seed.guardrail+'\n\n'
   +'No consent, actual institution, partner, legal registration, membership or completed act is asserted.\n\n'
   +'Source: '+ORIGIN+'/becoming/doors/seeds.json\n'
   +'Machine fragment: '+ORIGIN+'/'+base+'fragments/'+seed.id+'.json\n'
   +'FRAGMENT != BOOK. INVITATION != CONSENT. PROPOSAL != INSTITUTION.\n');
  index.push({id:seed.id,title:seed.title,status:'UNFORMED',fragment:ORIGIN+'/'+base+'fragments/'+seed.id+'.json',
   readingCard:ORIGIN+'/'+base+'chapters/'+seed.id+'.md',draftDoor:ORIGIN+'/becoming/doors/'});
 }
 await emit(base+'relations.jsonl',relations.join('\n')+'\n');
 await emit(base+'index.json',JSON.stringify({schema:'lemonpress/unformed-organizations/v1',status:'PROPOSAL_ONLY',
  sourceCommit:commit,sourceCatalog:ORIGIN+'/becoming/doors/seeds.json',
  manifest:ORIGIN+'/'+base+'manifest.json',entries:index,
  laws:source.laws,disclaimer:source.boundaries.important},null,2)+'\n');
 await emit(base+'README.md','# Books for Computers · The Unformed Organizations\n\n'
  +'A computer-readable nursery of six **proposals, not organizations**. The source is a public webZ seed catalog and the originating working identity.\n\n'
  +'[Manifest]('+ORIGIN+'/'+base+'manifest.json) · [Index]('+ORIGIN+'/'+base+'index.json) · [Human door]('+ORIGIN+'/becoming/doors/)\n\n'
  +source.seeds.map(x=>'- ['+x.title+']('+ORIGIN+'/'+base+'chapters/'+x.id+'.md): '+x.firstQuestion).join('\n')+'\n\n'
  +'No membership, legal status, volunteering, intake, institutional partnership, promises, actual domain activation or completed work is conferred by this book.\n');
 await emit(base+'index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Unformed Organizations · Books for Computers</title><meta name="description" content="Six machine-readable organizational ideas, not six organizations."></head><body><main><h1>The Unformed Organizations</h1><p>Six proposals. Zero presumed members. A door does not form an institution.</p><nav><a href="./manifest.json">Manifest (JSON)</a> · <a href="./index.json">Machine index</a> · <a href="./README.md">Reading guide</a> · <a href="/becoming/doors/">Human organization nursery</a></nav><ul>'
 +source.seeds.map(x=>'<li><a href="./chapters/'+e(x.id)+'.md">'+e(x.title)+'</a> — unformed</li>').join('')
 +'</ul></main></body></html>\n');
 return {work_id:WORK,fragments:source.seeds.length,generated,sourceCommit:commit,releaseStatus:'proposal-only'};
}
