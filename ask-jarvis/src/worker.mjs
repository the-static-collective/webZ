// Public draft composer and fixed read-only source adapters. No project dispatcher.
import {CAPABILITIES, selectSources, sourceUrl} from './registry.mjs';
import {formEncounter, composeReturn} from './encounter.mjs';
import {summarizeForQuestion} from './inquiry.mjs';
import {researchTargets,composeTriad,RESEARCH_LENSES} from './triad.mjs';
import {sha256, evidenceBody} from '../public/evidence.mjs';
import {readRecentWork} from './recent-work.mjs';
import {investigate,makeWorkersProvider} from './investigator.mjs';
import {orientQuestion} from './discovery.mjs';
import mission from '../context/mission-v1.json' with {type:'json'};
import catalog from '../town/catalog.json' with {type:'json'};
import {publicCommonsFor} from '../public/commons.mjs';
import {roleForQuestion,firstStewardshipMove} from '../public/role-seeds.mjs';
export {CAPABILITIES};

const SOURCE_LIMIT = 90000;
export const REQUEST_LIMIT = 1800;
const jsonHeaders={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:jsonHeaders});}

// Read the complete body under one deadline. Never hash a truncated document.
async function readBounded(res, limit, signal) {
  if (Number(res.headers.get('content-length')) > limit) {
    void res.body?.cancel().catch(()=>{});
    throw Error('BODY_TOO_LARGE');
  }
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const abort = () => { void reader.cancel().catch(()=>{}); };
  signal?.addEventListener('abort',abort,{once:true});
  try {
    let size=0; const chunks=[];
    while (true) {
      if(signal?.aborted) throw Error('TIMEOUT');
      const {value,done} = await reader.read();
      if(signal?.aborted) throw Error('TIMEOUT');
      if(done) break;
      size+=value.byteLength;
      if(size>limit) throw Error('BODY_TOO_LARGE');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return bytes;
  } finally {
    signal?.removeEventListener('abort',abort);
    void reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
}

async function inspect(c,fetcher,question) {
  const source=sourceUrl(c);
  const base={id:c.id,name:c.name,role:c.role,source,repo:c.repo,commit:c.ref,
    document:`https://github.com/the-static-collective/${c.repo}/blob/${c.ref}/${c.path}`};
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),2800);
  let res;
  try {
    res = await fetcher(source,{signal:controller.signal,headers:{accept:'text/plain'},redirect:'error',cf:{cacheTtl:180,cacheEverything:true}});
    if(!res.ok) throw Error('UPSTREAM');
    const bytes = await readBounded(res,SOURCE_LIMIT,controller.signal);
    if(!bytes.length) throw Error('EMPTY_SOURCE');
    const body = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    return {...base,status:'INSPECTED',sha256:await sha256(bytes),byteLength:bytes.byteLength,...summarizeForQuestion(body,question)};
  } catch {
    return {...base,status:'UNAVAILABLE',sha256:null,byteLength:null,title:'Not inspected',excerpt:'Read-only source lookup did not succeed. No result is inferred.'};
  } finally {
    controller.abort();
    void res?.body?.cancel().catch(()=>{});
    clearTimeout(timer);
  }
}

export async function assemble(question,fetcher=fetch,{kind='auto',lens='standard',graft=null,recent=null}={}) {
  if(!RESEARCH_LENSES.includes(lens))throw Error('RESEARCH_LENS');
  if(typeof question!=='string') throw Error('QUESTION_REQUIRED');
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(question)) throw Error('QUESTION_CONTROL');
  if(question.length>360) throw Error('QUESTION_LENGTH');
  const q=question.replace(/\s+/g,' ').trim();
  if(q.length<8||q.length>360) throw Error('QUESTION_LENGTH');
  if(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}/.test(q)) throw Error('PRIVATE_CONTACT');
  const orientation=orientQuestion(q,mission,catalog);
  const encounter = formEncounter(question,kind);
  const targets = researchTargets(lens)||selectSources(q,encounter.kind,encounter.facets);
  const sources = await Promise.all(targets.map(c=>inspect(c,fetcher,q)));
  const found = sources.filter(s=>s.status==='INSPECTED').length;
  const returned = composeReturn(encounter,sources,await sha256(question));
  const observedAt = new Date().toISOString();
  const recentCut=recent??{schema:'jarvis/recent-work-cut-v1',status:'NOT_REQUESTED',selected:[]};
  const recentMatches=orientation.relation==='INDEPENDENT_QUESTION'?[]:recentCut.status==='READ'?recentCut.selected:[];
  const firstRecent=recentMatches[0]??null;
  const triad=lens==='triad'?composeTriad({question:q,kind:encounter.kind,sources,observedAt}):null;
  const commons=publicCommonsFor(q);
  const matches=orientation.relation==='INDEPENDENT_QUESTION' ? []
    :commons.selected.filter(x=>x.relevance==='KEYWORD_MATCH');
  const graftSnapshot=graft??{schema:'jarvis/graft-feed-v1',status:'NOT_REQUESTED',
    state:'NOT_ENABLED',selected:[]};
  const graftNotes=orientation.relation==='INDEPENDENT_QUESTION' ? []
    :(graftSnapshot.selected||[]).slice(0,3);
  const first=matches[0];
  const starterRole=orientation.relation==='INDEPENDENT_QUESTION'?null:roleForQuestion(q);
  const starterStep=starterRole?firstStewardshipMove(starterRole):null;
  const synthesis={
    schema:'ask-jarvis/synthesis-v1',basis:'EDITORIAL_CANDIDATES_NOT_REAL_WORLD_EVIDENCE',
    related:matches.slice(0,3).map(x=>({id:x.id,status:x.status,observation:x.observation,
      firstCheck:x.firstCheck})),
    graft:graftNotes.map(x=>({id:x.id,publication:x.publication,summary:x.summary,
      sourceUrl:x.sourceUrl})),
    firstMove:starterStep??first?.firstCheck??returned.nextQuestion,
    openStarterRole:starterRole?{id:starterRole.id,name:starterRole.name,
      state:'OPEN_ROLE_NO_INCUMBENT_REQUIRED',firstTask:starterRole.starter,
      interestDoor:'/roles/#role='+starterRole.id,appointment:false}:null,
    recentWork:recentMatches.slice(0,3).map(x=>({id:x.id,state:x.state,title:x.title,firstCheck:x.firstCheck,publicUrl:x.publicUrl,source:x.source,authority:x.authority})),
    verifiedProjectReads:found,
    humanGate:'Interested people may begin exploring an open role immediately with drafts and listening. Real-world access, public affiliation, food handling, volunteer assignments, service delivery and publishing still require the responsible owner’s specific consent.'
  };
  const nextQuestion=firstRecent?.firstCheck??starterStep??first?.firstCheck??returned.nextQuestion;
  const guidance=orientation.relation==='INDEPENDENT_QUESTION'
    ? 'This is an independent question, not a forced Collective project match. Here is an optional draft; verify external facts independently.'
    :!found
      ? `I could not verify the source documents this time. ${first?'One editorial possibility: '+first.observation:'Here is a draft from the question.'} ${starterStep||''} No project service or partner commitment is claimed.`
      :first
        ? `A useful starting connection: ${first.observation} ${starterStep} I inspected ${found} public project source document(s), not a live service or partner commitment.`
        : `I inspected ${found} public project documents. Here's a ${returned.kind} draft and a specific question to test next.`;
  const workbenchRequest = {schema:'ask-jarvis/workbench-request-v1',dispatch:'MANUAL_EXPORT_ONLY',authority:'NONE',
    task:{operation:'PREPARE_DRAFT',kind:returned.kind,question},
    encounter,sourceReferences:sources.map(s=>({id:s.id,commit:s.commit,sha256:s.sha256,status:s.status})),
    requiredBeforeDispatch:['Operator-reviewed endpoint and authentication','Owner-approved capability and input scope','Receiver-issued outcome and reconciliation contract'],
    ...(triad?{researchCut:triad.schema,capabilityFence:triad.loadout.fenced}: {})};
  const steps = [
    {name:'Recent work registry',status:recentCut.status==='READ'?'READ':'HOLD',detail:recentCut.status==='READ'?'Read dated owner editorial catalog; '+recentMatches.length+' topic-related entries. No source project or partner was independently verified by this feed.':'No recent feed available or requested; none inferred.'},
    {name:'Abundent North Star',status:'DONE',detail:orientation.relation==='INDEPENDENT_QUESTION'?'Read the mission and respected an independent question without forcing a project connection.':'Read the mission and identified optional related workstreams; no existing local commitment inferred.'},
    {name:'JAR;VIS',status:'DONE',detail:'Received one question; deterministic rules, no model or question storage.'},
    {name:'Workbench handoff',status:'PREPARED',detail:'Prepared a draft-only manual request. No local Workbench was contacted.'},
    {name:'TABLElogic encounter',status:'DONE',detail:'Locally separated the question, draft ideas and possible relations; unresolved gaps remain open. No TABLElogic runtime invoked.'},
    {name:'Public Commons',status:'READ',detail:'Selected '+matches.length+' question-relevant curated notes. These are proposals, not partner evidence.'},
    {name:'GRAFT publication bridge',status:graftSnapshot.status==='READ'?'READ':'HOLD',detail:graftSnapshot.status==='READ'?'Read '+graftNotes.length+' source-pinned GRAFT summaries ('+graftSnapshot.state+'). No donor code executed.':'No additional GRAFT source note verified.'},
    ...sources.map(s=>({name:s.name,status:s.status==='INSPECTED'?'READ':'HOLD',detail:s.status==='INSPECTED'?'Read the whole document at an exact source commit and hashed its bytes.':'Source unavailable; no substitute claims.'})),
    ...(triad?[
      {name:'ALEX provenance floor',status:found?'READ':'HOLD',detail:'Read pinned public owner sources with exact excerpt line loci; claim formation and native ALEX runtime NOT_RUN.'},
      {name:'3rdi observer cut',status:'PREPARED',detail:'Locally recorded what was available at this request cut; source occurrence and causation remain UNKNOWN. Native 3rdi runtime NOT_RUN.'},
      {name:'LOADOUT effect fence',status:'PREPARED',detail:'Selected only three bounded public reads; project writes, partner contact and real-world effects remain FENCED. Native LOADOUT bind NOT_RUN.'}
    ]:[]),
    ...(starterRole?[{name:'Open role invitation',status:'OPEN',detail:'Role '+starterRole.name+' is a voluntary possible responsibility, not an incumbent, enrollment or approved field operation. See /roles/#role='+starterRole.id}]:[]),
    {name:'CANNON boundary',status:'HOLD',detail:'No source-owner canon selection or native CANNON validation. Main is not inferred canon.'},
    {name:'GHoT / project execution',status:'NOT_RUN',detail:'Read-only adapters do not assign tasks or run project code.'},
    {name:'OpenManus / ELF',status:'NOT_RUN',detail:'Native agents are not launched by this public return loop.'},
    {name:'reLATTE boundary',status:'UNSIGNED',detail:'Complete public evidence is hashed. No signed reLATTE crossing or receiver admission is claimed.'},
    {name:'RETURN',status:'DONE',detail:`Composed an unsigned ${returned.kind} artifact; sharing and playback are your choice.`}
  ];
  const artifact = [
    '# ASK JAR;VIS / QUESTION CARD',`Question: ${q}`,'',returned.title,'',returned.body,'',
    `Observation: ${guidance}`,'',
    'Related public project notes (not commitments):',
    ...matches.slice(0,3).map(x=>'- '+x.id+': '+x.observation+' FIRST CHECK: '+x.firstCheck),
    'Recent public editorial leads (not inspected project evidence):',
    ...recentMatches.map(x=>'- '+x.title+' ['+x.state+'] '+x.publicUrl+' SOURCE: '+x.source+' FIRST CHECK: '+x.firstCheck),
    'Role seeds (interest is not appointment):',
    ...(starterRole?['- Open role: '+starterRole.name+' — /roles/#role='+starterRole.id,
      '- First independent starter task: '+starterRole.starter,
      '- Operating permission and organization authority are NOT granted.']:[]),
    'GRAFT project-source feed (read-only; not evidence of adoption):',
    ...graftNotes.map(x=>'- '+x.id+' ['+x.publication+']: '+x.summary+' '+x.sourceUrl),
    '','Sources inspected (read-only):',
    ...sources.map(s=>`- ${s.name} — ${s.status} — ${s.source}${s.sha256?' ['+s.sha256+']':''}`),'',
    `Next question: ${nextQuestion}`,'',
    'No organizer affiliation, verified human consent, remote execution, partner commitment, or fulfilled service is claimed.',
    `Generated: ${observedAt}`
  ].join('\n');
  const context={schema:'ask-jarvis/context-orientation-v1',missionRevision:orientation.missionRevision,
    goal:orientation.goal,relation:orientation.relation,
    workstreams:orientation.workstreams,ideas:orientation.ideas,
    caution:orientation.advice,grounding:'EDITORIAL_DIRECTION_NOT_LOCAL_EVIDENCE'};
  const result={schema:'ask-jarvis/return-v0',mode:'LIVE_PUBLIC_SOURCE_INSPECTION_ONLY',question:q,observedAt,guidance,nextQuestion,sources,steps,artifact,encounter,return:returned,workbenchRequest,context,commons,graft:graftSnapshot,synthesis,recent:recentCut,...(triad?{triad}: {})};
  result.evidence=evidenceBody(result);
  result.receiptHash=await sha256(JSON.stringify(result.evidence));
  return result;
}

export function inputError(error) {
  return error.message==='PRIVATE_CONTACT' ? 'Please omit contact details. This demo is public-source only.'
    : error.message==='RETURN_KIND' ? 'Choose a question card, invitation, source door, song or field plan.'
    : error.message==='RESEARCH_LENS' ? 'Choose the normal question machine or the read-only ALEX × 3rdi × LOADOUT research lens.'
    : 'Enter one question between 8 and 360 characters without control characters.';
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname==='/api/health'&&request.method==='GET') return response({ok:true,name:'ask JAR;VIS',mode:'read-only-source-inspection',release:'public-return-008',returns:['question','invitation','door','song','plan'],bridge:'manual-export-only'});
    if(url.pathname==='/api/investigate') {
      if(request.method!=='POST')return response({error:'METHOD_NOT_ALLOWED'},405);
      if(env?.JARVIS_AI_ENABLED!=='1'||typeof env?.AI?.run!=='function')return response({
        schema:'ask-jarvis/investigation-v1',status:'HOLD',reason:'MODEL_NOT_ENABLED',
        message:'VIS model investigation is not enabled. The rules-only question machine still works.'
      },503);
      let obj;
      try {obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(request,REQUEST_LIMIT,AbortSignal.timeout(5000))));}
      catch(e){return response({error:e.message==='BODY_TOO_LARGE'?'QUESTION_TOO_LARGE':'INVALID_JSON'},e.message==='BODY_TOO_LARGE'?413:400);}
      if(!obj||typeof obj.question!=='string')return response({error:'QUESTION_REQUIRED'},400);
      try{return response(await investigate({question:obj.question,kind:obj.kind??'auto',lens:obj.lens??'standard',assemble,provider:makeWorkersProvider(env.AI)}));}
      catch(e){return response({error:inputError(e)},422);}
    }
    if(url.pathname==='/api/recent-work'){
      if(request.method!=='GET')return response({error:'METHOD_NOT_ALLOWED'},405);
      const cut=await readRecentWork('recent useful projects',{fetcher:fetch});
      return response({status:cut.status,release:cut.release,reviewedOn:cut.reviewedOn,
        sourceSha256:cut.sourceSha256,selectedIds:cut.selected.map(x=>x.id),
        disclosure:cut.disclosure||'The catalog was not available; no project is inferred.'},cut.status==='READ'?200:503);
    }
    if(url.pathname==='/api/ask') {
      if(request.method!=='POST') return response({error:'METHOD_NOT_ALLOWED'},405);
      let obj;
      try {obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(request,REQUEST_LIMIT,AbortSignal.timeout(5000))));}
      catch(e){return response({error:e.message==='BODY_TOO_LARGE'?'QUESTION_TOO_LARGE':'INVALID_JSON'},e.message==='BODY_TOO_LARGE'?413:400);}
      if(!obj||typeof obj.question!=='string')return response({error:'QUESTION_REQUIRED'},400);
      try{const recent=await readRecentWork(obj.question,{fetcher:fetch});return response(await assemble(obj.question,fetch,{kind:obj.kind??'auto',lens:obj.lens??'standard',recent}));}
      catch(e){return response({error:inputError(e)},422);}
    }
    if(url.pathname.startsWith('/api/'))return response({error:'NOT_FOUND'},404);
    if(env?.ASSETS?.fetch)return env.ASSETS.fetch(request);
    return new Response('Static assets binding is unavailable. Deploy with Wrangler and assets configured.',{status:503});
  }
};
