// Public draft composer and fixed read-only source adapters. No project dispatcher.
import {CAPABILITIES, selectSources, sourceUrl} from './registry.mjs';
import {formEncounter, composeReturn} from './encounter.mjs';
import {summarizeForQuestion} from './inquiry.mjs';
import {sha256, evidenceBody} from '../public/evidence.mjs';
import {investigate,makeWorkersProvider} from './investigator.mjs';
import {selectRoute,ROUTES} from './free-compute.mjs';
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

export async function assemble(question,fetcher=fetch,{kind='auto'}={}) {
  if(typeof question!=='string') throw Error('QUESTION_REQUIRED');
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(question)) throw Error('QUESTION_CONTROL');
  if(question.length>360) throw Error('QUESTION_LENGTH');
  const q=question.replace(/\s+/g,' ').trim();
  if(q.length<8||q.length>360) throw Error('QUESTION_LENGTH');
  if(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}/.test(q)) throw Error('PRIVATE_CONTACT');
  const encounter = formEncounter(question,kind);
  const targets = selectSources(q,encounter.kind,encounter.facets);
  const sources = await Promise.all(targets.map(c=>inspect(c,fetcher,q)));
  const found = sources.filter(s=>s.status==='INSPECTED').length;
  const returned = composeReturn(encounter,sources,await sha256(question));
  const observedAt = new Date().toISOString();
  const guidance = found ? `I inspected ${found} of ${sources.length} public source documents and composed this ${returned.kind==='question'?'question card':returned.kind+' draft'}. The draft uses local rules; the documents show possible tools, not commitments.`
    : 'I could not verify a source document on this run. The draft below is locally composed from your question; no project connection is being claimed.';
  const workbenchRequest = {schema:'ask-jarvis/workbench-request-v1',dispatch:'MANUAL_EXPORT_ONLY',authority:'NONE',
    task:{operation:'PREPARE_DRAFT',kind:returned.kind,question},
    encounter,sourceReferences:sources.map(s=>({id:s.id,commit:s.commit,sha256:s.sha256,status:s.status})),
    requiredBeforeDispatch:['Operator-reviewed endpoint and authentication','Owner-approved capability and input scope','Receiver-issued outcome and reconciliation contract']};
  const steps = [
    {name:'JAR;VIS',status:'DONE',detail:'Received one question; deterministic rules, no model or question storage.'},
    {name:'Workbench handoff',status:'PREPARED',detail:'Prepared a draft-only manual request. No local Workbench was contacted.'},
    {name:'TABLElogic encounter',status:'DONE',detail:'Locally separated the question, draft ideas and possible relations; unresolved gaps remain open. No TABLElogic runtime invoked.'},
    ...sources.map(s=>({name:s.name,status:s.status==='INSPECTED'?'READ':'HOLD',detail:s.status==='INSPECTED'?'Read the whole document at an exact source commit and hashed its bytes.':'Source unavailable; no substitute claims.'})),
    {name:'CANNON boundary',status:'HOLD',detail:'No source-owner canon selection or native CANNON validation. Main is not inferred canon.'},
    {name:'GHoT / project execution',status:'NOT_RUN',detail:'Read-only adapters do not assign tasks or run project code.'},
    {name:'OpenManus / ELF',status:'NOT_RUN',detail:'Native agents are not launched by this public return loop.'},
    {name:'reLATTE boundary',status:'UNSIGNED',detail:'Complete public evidence is hashed. No signed reLATTE crossing or receiver admission is claimed.'},
    {name:'RETURN',status:'DONE',detail:`Composed an unsigned ${returned.kind} artifact; sharing and playback are your choice.`}
  ];
  const artifact = [
    '# ASK JAR;VIS / QUESTION CARD',`Question: ${q}`,'',returned.title,'',returned.body,'',
    `Observation: ${guidance}`,'','Sources inspected (read-only):',
    ...sources.map(s=>`- ${s.name} — ${s.status} — ${s.source}${s.sha256?' ['+s.sha256+']':''}`),'',
    `Next question: ${returned.nextQuestion}`,'',
    'No organizer affiliation, verified human consent, remote execution, partner commitment, or fulfilled service is claimed.',
    `Generated: ${observedAt}`
  ].join('\n');
  const result={schema:'ask-jarvis/return-v0',mode:'LIVE_PUBLIC_SOURCE_INSPECTION_ONLY',question:q,observedAt,guidance,nextQuestion:returned.nextQuestion,sources,steps,artifact,encounter,return:returned,workbenchRequest};
  result.evidence=evidenceBody(result);
  result.receiptHash=await sha256(JSON.stringify(result.evidence));
  return result;
}

export function inputError(error) {
  return error.message==='PRIVATE_CONTACT' ? 'Please omit contact details. This demo is public-source only.'
    : error.message==='RETURN_KIND' ? 'Choose a question card, invitation, source door, song or field plan.'
    : 'Enter one question between 8 and 360 characters without control characters.';
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname==='/api/health'&&request.method==='GET') return response({ok:true,name:'ask JAR;VIS',mode:'read-only-source-inspection',release:'public-return-006',returns:['question','invitation','door','song','plan'],bridge:'manual-export-only'});
    if(url.pathname==='/api/investigate') {
      if(request.method!=='POST')return response({error:'METHOD_NOT_ALLOWED'},405);
      if(env?.JARVIS_AI_ENABLED!=='1'||(env?.JARVIS_FREE_COMPUTE_ENABLED!=='1'&&typeof env?.AI?.run!=='function'))return response({
        schema:'ask-jarvis/investigation-v1',status:'HOLD',reason:'MODEL_NOT_ENABLED',
        message:'VIS model investigation is not enabled. The rules-only question machine still works.'
      },503);
      let obj;
      try {obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(request,REQUEST_LIMIT,AbortSignal.timeout(5000))));}
      catch(e){return response({error:e.message==='BODY_TOO_LARGE'?'QUESTION_TOO_LARGE':'INVALID_JSON'},e.message==='BODY_TOO_LARGE'?413:400);}
      if(!obj||typeof obj.question!=='string')return response({error:'QUESTION_REQUIRED'},400);
      try {
        const route=obj.route??'auto';
        if(!ROUTES.includes(route))return response({error:'ROUTE_NOT_ALLOWED'},422);
        const enabled=env.JARVIS_FREE_COMPUTE_ENABLED==='1';
        const choice=enabled?selectRoute(env,route,fetch,env.AI):null;
        if(enabled&&!choice)return response({schema:'ask-jarvis/investigation-v1',
          status:'HOLD',reason:'FREE_PROVIDER_NOT_CONFIGURED',
          message:'No allowed model provider is configured for this route. The rules-only card still works.'},503);
        const result=await investigate({question:obj.question,kind:obj.kind??'auto',assemble,
          provider:choice?.provider||makeWorkersProvider(env.AI)});
        if(result.status==='MODEL_PROPOSAL'&&choice) {
          result.routing={provider:choice.id,model:choice.model,mode:choice.mode,route:choice.route,
            modelCalls:1,automaticPaidFallback:false};
          delete result.receiptHash;
          result.receiptHash=await sha256(JSON.stringify(result));
        }
        return response(result);
      } catch(e){return response({error:inputError(e)},422);}
    }
    if(url.pathname==='/api/ask') {
      if(request.method!=='POST') return response({error:'METHOD_NOT_ALLOWED'},405);
      let obj;
      try {obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(request,REQUEST_LIMIT,AbortSignal.timeout(5000))));}
      catch(e){return response({error:e.message==='BODY_TOO_LARGE'?'QUESTION_TOO_LARGE':'INVALID_JSON'},e.message==='BODY_TOO_LARGE'?413:400);}
      if(!obj||typeof obj.question!=='string')return response({error:'QUESTION_REQUIRED'},400);
      try{return response(await assemble(obj.question,fetch,{kind:obj.kind??'auto'}));}
      catch(e){return response({error:inputError(e)},422);}
    }
    if(url.pathname.startsWith('/api/'))return response({error:'NOT_FOUND'},404);
    if(env?.ASSETS?.fetch)return env.ASSETS.fetch(request);
    return new Response('Static assets binding is unavailable. Deploy with Wrangler and assets configured.',{status:503});
  }
};
