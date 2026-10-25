// TOWN-010 / an editorial town-sized entry map that emits actual Free Graph
// v0 packets. No visitor-specific data or inferred real-world partnerships.
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const canonical=v=>JSON.stringify(normalize(v));
function normalize(v){
  if(Array.isArray(v))return v.map(normalize);
  if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])]));
  return v;
}
const digest=data=>'sha256:'+createHash('sha256').update(data).digest('hex');
const record=(prefix,value)=>({...value,id:prefix+':'+digest(canonical(value))});
export function makeTownPacket(catalog,originalBytes){
  if(catalog?.schema!=='abundent/town-options-v1'||!Array.isArray(catalog.ideas)||catalog.ideas.length<1||catalog.ideas.length>24)
    throw Error('INVALID_TOWN_CATALOG');
  const ids=new Set(),sources=[];
  for(const item of catalog.ideas){
    if(!/^[a-z0-9-]{2,35}$/.test(item.id)||ids.has(item.id))throw Error('INVALID_ID');
    ids.add(item.id);
    if(![item.title,item.question,item.test,item.category].every(x=>typeof x==='string'&&x.length>=3&&x.length<=400))
      throw Error('INVALID_EDITORIAL_TEXT');
  }
  const source=record('fgs',{
    access:'public',acquisition:'operator-authored editorial proposal',
    authority:'source-local',digest:digest(originalBytes),
    excerpt:'Candidate Waseca questions for review. No locally verified need, willing steward or commitment is asserted.',
    export:'portable',extensions:{owner:'the-static-collective/webZ',status:'EDITORIAL_SEEDS_ONLY'},
    locator:{system:'webZ',container:'Abundent Town Desk',
      coordinate:'ask-jarvis/town/catalog.json',revision:'editorial draft 2026-10-25',
      resolution:'exact source bytes in version-controlled repository'},
    observed_at:catalog.updated,source_class:'project-source'
  });
  sources.push(source);
  const nodes=[],links=[],index={};
  for(const idea of catalog.ideas) {
    const option=record('fgn',{
      kind:'claim',claim_class:'design',label:idea.title,
      aliases:['abundent://town/options/'+idea.id],
      source_ids:[source.id],status:'proposed',witness_requirement:'owner-defined',
      extensions:{category:idea.category,editorialStatus:idea.status,
        question:idea.question,proposedFirstTest:idea.test,scope:'HYPOTHETICAL_ONLY'}
    });
    const question=record('fgn',{
      kind:'question',label:idea.question,source_ids:[source.id],
      status:'unresolved',extensions:{category:idea.category,editorialStatus:'NO_LOCAL_EVIDENCE'}
    });
    const test=record('fgn',{
      kind:'test',label:idea.test,source_ids:[source.id],
      status:'proposed',extensions:{kind:'DRAFT_REVIEW_NOT_COMPLETED',humanGate:'REQUIRED'}
    });
    nodes.push(option,question,test);
    index[idea.id]=option;
    links.push(record('fgl',{from:question.id,to:option.id,verb:'connects',qualifier:'opens-unverified-design-option',
      status:'proposed',authority:'none',source_ids:[source.id]}));
    links.push(record('fgl',{from:option.id,to:test.id,verb:'connects',qualifier:'proposes-permission-first-draft-test',
      status:'proposed',authority:'none',source_ids:[source.id]}));
  }
  for(const [a,b,verb,qualifier] of catalog.paths) {
    if(!index[a]||!index[b]||!['connects','descends-from','tests','bears-on','constitutes'].includes(verb))throw Error('INVALID_RELATION');
    if(verb!=='connects')throw Error('UNSUPPORTED_EDITORIAL_VERB');
    links.push(record('fgl',{
      from:index[a].id,to:index[b].id,verb,qualifier,
      status:'proposed',authority:'none',source_ids:[source.id]
    }));
  }
  const result={
    schema:'free-graph.packet/v0',purpose:'Portable, no-promotion editorial map of possible Waseca-area questions and reversible first tests',
    modes:['seed','re-enter'],scope:{as_of:catalog.updated,task:'Browse and select one hypothetical town question before verifying a local need',
      resolution:'editorial draft only, no local field observations',worlds:['Abundent Town Desk','Waseca-area hypothetical options','Free Graph substrate']},
    task_world_cut:{status:'unresolved',selected_ids:[source.id,...nodes.map(x=>x.id),...links.map(x=>x.id)],
      owner_head_source_ids:[],
      omitted:[{door:'Real local needs and people willing to steward them',reason:'No consenting first-party witnesses inspected'},
        {door:'Site authorization and project-owner approvals',reason:'No effectful gate or partner affiliation verified'}],
      rationale:'Sufficient to seed questions, deliberately insufficient for evidence promotion or live service matching.'},
    sources,nodes,links,
    residual_fog:['No locally verified need or capacity.','No willing steward, venue permission, consented resource inventory or live outcome.'],
    non_imports:['A flyer visit is not proof of consent or participation.','Many similar inquiries do not make a claim true.',
      'No proposed link indicates that food, rides, tools, work or personal assistance is available.'],
    extensions:{site:'abundent.org',release:'TOWN-010',mode:'EDITORIAL_OPTIONS_NOT_LIVE_AVAILABILITY'}
  };
  return {...result,packet_id:'fgp:'+digest(canonical(result))};
}
export async function emitTownGraph(){
  const bytes=await readFile(join(root,'town/catalog.json'));
  const packet=makeTownPacket(JSON.parse(bytes.toString('utf8')),bytes);
  const target=join(root,'public/town/graph.json');
  await mkdir(dirname(target),{recursive:true});
  await writeFile(target,JSON.stringify(packet,null,2)+'\n');
  return packet;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const packet=await emitTownGraph();
  console.log('Free Graph seed:',packet.packet_id,'sources',packet.sources.length,'nodes',packet.nodes.length,'links',packet.links.length);
}
