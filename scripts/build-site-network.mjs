// 2026-10-26 public observation register. Not a background crawler or claim of completeness.
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const observedOn='2026-10-26';
const sites=[
 {id:'apex',host:'abundent.org',pages:[
 ['/','ask JAR;VIS! — The Question Machine (1999-ish)'],
 ['/doors/','THE SWITCHBOARD ✳ Abundent'],
 ['/contact/','Stay in Touch — Abundent / The Static Collective'],
 ['/gather/','THE NEXT TABLE × GARDEN COMMONS · Abundent'],
 ['/tables/','The Seventh Table · Abundent'],
 ['/weave/','The Weaving Garden · Abundent'],
 ['/real-worldz/','REAL WORLDZ 001 ✳ THE RIVER GATE · Abundent'],
 ['/games/tomorrow/','WHO MURDERED TOMORROW? | A REALITY.2 Mystery Dinner']
 ]},
 {id:'connections',host:'connections.abundent.org',pages:[
 ['/','ask JAR;VIS! — The Question Machine (1999-ish)']]},
 {id:'garden',host:'garden.abundent.org',pages:[
 ['/','The Garden / Already Growing — Waseca field atlas'],
 ['/workbench/','The Garden — Working Center · Waseca']]},
 {id:'msyou',host:'msyou.abundent.org',pages:[
 ['/','MSyoU · The Community Infrastructure Stack']]},
 {id:'reality',host:'reality.abundent.org',pages:[
 ['/','Reality 2.0 / Waseca Field Experiment']]}
];
const sha=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=p=>p==='/'?'home':p.slice(1).replace(/\/$/,'').replace(/\//g,'--');
export async function buildSiteNetwork({output,files,commit}){
 let totalPages=0;
 async function emit(path,content){
  const bytes=Buffer.from(content),url=new URL(path,output);
  await mkdir(new URL('./',url),{recursive:true});
  await writeFile(url,bytes);
  files.push({path,sha256:sha(bytes),bytes:bytes.length,role:'observed-site-machine-projection'});
 }
 const summary=[];
 for(const site of sites){
  const id=site.id,base='for-computers/sites/'+id+'/';
  const work='lemonpress:abundent-site:'+id,edition=work+':crawler:observed-20261026';
  const fragments=site.pages.map(([path,title])=>({
   id:slug(path),path,title,url:'https://'+site.host+path
  }));
  totalPages+=fragments.length;
  const manifest={
   schema_version:'computer-book-manifest-v0',work_id:work,edition_id:edition,
   lane:'crawler',status:'dated-public-observation',
   title:'Abundent Site Volume — '+site.host,
   observation:{date:observedOn,method:'Read-only HTTP fetch of each listed URL; status 200 witnessed on date',
    scope:'Selected publicly observed pages; NOT full-site coverage, content approval or uptime monitoring'},
   retrieval_contract:{retrieved_is_read:false,chunk_is_book:false,fragment_is_context:false,
    retrieval_order_is_authority:false,reading_order_is_ancestry:false},
   source_ancestry:[{type:'site',locator:'https://'+site.host},
      {type:'derived-register',locator:'webZ:'+commit}],
   fragments:fragments.map(f=>({fragment_id:f.id,path:'fragments/'+f.id+'.json'}))
  };
  await emit(base+'manifest.json',JSON.stringify(manifest,null,2)+'\n');
  const edges=[];
  for(let i=0;i<fragments.length;i++){
   const f=fragments[i],next=fragments.length>1?fragments[(i+1)%fragments.length]:null;
   const continuation=next?[{relation:'observed-neighbor',target:next.id,scope:'local'}]:[];
   if(next)edges.push(JSON.stringify({from:f.id,relation:'observed-neighbor',to:next.id,scope:'local'}));
   await emit(base+'fragments/'+f.id+'.json',JSON.stringify({
    schema_version:'computer-book-fragment-v0',work_id:work,edition_id:edition,
    fragment_id:f.id,title:f.title,carrier:'Dated public website discovery: '+f.url,
    retrieval:{warning:'FRAGMENT != BOOK',manifest:'../manifest.json',continuations:continuation},
    ancestry:[{type:'observed-public-webpage',locator:f.url,observedOn},
     {type:'derived-register',locator:'webZ:'+commit}],
    authority:{level:'none',does_not_grant:['admission','publication','ownership','source-authority','execution']},
    uncertainty:['The page may have changed since the observation date.',
     'The site may have more pages than this bounded list.',
     'A HTTP 200 response does not verify claims, availability of linked services or real-world outcomes.']
   },null,2)+'\n');
  }
  await emit(base+'relations.jsonl',edges.join('\n')+(edges.length?'\n':''));
  const card={
   schema:'lemonpress/observed-site/v1',id:'abundent:site:'+id,
   host:site.host,url:'https://'+site.host+'/',observedOn,
   state:'observed-public-HTTP-200',authority:'none',
   caveat:'Dated selected-page observation, not an exhaustive site map or endorsement.',
   machineBookManifest:'https://'+site.host+'/for-computers/manifest.json',
   pages:fragments.map(f=>({url:f.url,title:f.title,status:'observed-http-200'})),
   sourceCommit:commit
  };
  await emit(base+'index.json',JSON.stringify(card,null,2)+'\n');
  await emit(base+'llms.txt',
   '# '+site.host+' — A Book for Computers\n\n'
   +'> This dated, limited record describes observed public pages; it is neither all content nor any transfer of authority.\n\n'
   +'- [This site’s machine-readable book](https://'+site.host+'/for-computers/manifest.json)\n'
   +'- [This site’s observed index](https://'+site.host+'/for-computers/index.json)\n'
   +'- [Abundent federation](https://abundent.org/for-computers/sites/index.json)\n\n'
   +'## Verified public pages on '+observedOn+'\n\n'
   +fragments.map(f=>'- ['+f.title+']('+f.url+')\n').join('')
   +'\nFRAGMENT != BOOK. HTTP 200 != VERIFIED OUTCOME. MISSING != NONEXISTENT.\n'
  );
  await emit(base+'index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Computer book · '+esc(site.host)+'</title></head><body><main><h1>Books for Computers: '+esc(site.host)+'</h1><p>Dated observation: '+observedOn+'. Not all pages or a live monitoring service.</p><p><a href="./index.json">Machine index</a> · <a href="./manifest.json">Book fragments</a> · <a href="./llms.txt">AI reading guide</a></p><ul>'+fragments.map(f=>'<li><a href="'+esc(f.url)+'">'+esc(f.title)+'</a></li>').join('')+'</ul><p><a href="https://abundent.org/for-computers/">The whole library</a></p></main></body></html>\n');
  summary.push({id,host:site.host,url:'https://'+site.host+'/',observedOn,
   observedPages:fragments.length,coverage:'selected-public-pages',book:'https://'+site.host+'/for-computers/manifest.json'});
 }
 await emit('for-computers/sites/index.json',JSON.stringify({
  schema:'lemonpress/abundent-site-network/v1',observedOn,sourceCommit:commit,
  scope:'Five independently observed live Abundent hosts. Dated snapshot, not full site inventory.',
  sites:summary
 },null,2)+'\n');
 return {hosts:summary.length,observedPages:totalPages};
}
