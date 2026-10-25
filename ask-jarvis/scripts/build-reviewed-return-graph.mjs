// FIELD-RETURN-013 · Operator-owned publication projection.
// Exactly zero public returns until an operator intentionally commits a reviewed
// anonymous candidate to town/reviewed-returns/*.json. Publication is NOT
// independent confirmation of any claimed event, work or third-party consent.
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {makeTownPacket} from './build-town-graph.mjs';
import {validateCandidate} from '../public/ignite/return.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
function canon(value){
 if(Array.isArray(value))return '['+value.map(canon).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canon(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
const digest=v=>'sha256:'+createHash('sha256').update(canon(v)).digest('hex');
function uniqueRecords(records,kind){
 const map=new Map();
 for(const r of records) {
  if(!r||typeof r.id!=='string')throw Error('BAD_'+kind+'_RECORD');
  if(map.has(r.id)&&canon(map.get(r.id))!==canon(r))throw Error('HASH_COLLISION_CONFLICT');
  map.set(r.id,r);
 }
 return [...map.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
export async function makeReviewedReturnProjection(graph,entries){
 if(graph?.schema!=='free-graph.packet/v0'||!Array.isArray(entries))throw Error('INVALID_REVIEW_BASE');
 if(entries.length>40)throw Error('TOO_MANY_REVIEWED_RETURNS_FOR_STATIC_SITE');
 const known=new Set(graph.nodes.filter(n=>n.extensions?.scope==='HYPOTHETICAL_ONLY').map(n=>n.id));
 const seen=new Set(),accepted=[];
 for(const entry of entries){
  if(entry?.schema!=='abundent/reviewed-return-entry-v1')throw Error('UNKNOWN_REVIEW_FORMAT');
  const review=entry.publication;
  if(review?.decision!=='EDITORIAL_ANONYMOUS_CANDIDATE_APPROVED'
     ||review.evidenceIndependentlyVerified!==false
     ||review.humanReviewed!==true
     ||review.noPrivateDetailsChecked!==true
     ||review.publicSharingChosen!==true
     ||typeof review.reviewedAt!=='string'
     ||!Number.isFinite(Date.parse(review.reviewedAt)))
    throw Error('HUMAN_PUBLICATION_GATE_MISSING');
  const candidate=entry.graph;
  if(!await validateCandidate(candidate))throw Error('INVALID_CANDIDATE_HASH_OR_BOUNDARY');
  if(candidate.extensions.originGraphPacketId!==graph.packet_id)throw Error('DIFFERENT_TOWN_SOURCE');
  const seed=candidate.nodes.find(n=>known.has(n.id));
  if(!seed)throw Error('MISSING_ORIGINAL_OPTION');
  if(seen.has(candidate.packet_id))throw Error('DUPLICATE_RETURN_PACKET');
  seen.add(candidate.packet_id);
  if(candidate.sources.some(s=>s.access!=='public'&&s.export!=='pointer-only'))throw Error('PRIVATE_SOURCE_NOT_REDACTED');
  if(JSON.stringify(candidate).match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/))throw Error('PERSONAL_DATA_SUSPECTED');
  accepted.push({entry,candidate,seed});
 }
 const sources=uniqueRecords([...graph.sources,...accepted.flatMap(e=>e.candidate.sources)],'SOURCE');
 const nodes=uniqueRecords([...graph.nodes,...accepted.flatMap(e=>e.candidate.nodes)],'NODE');
 const links=uniqueRecords([...graph.links,...accepted.flatMap(e=>e.candidate.links)],'LINK');
 const asOf='2026-10-25'; // Fixed calendar label for first experimental release. This is NOT a freshness assertion.
 const body={
  schema:'free-graph.packet/v0',
  purpose:'No-promotion union of editorial Town Desk source plus manually published anonymous, self-reported return candidates',
  modes:['seed','re-enter'],
  scope:{as_of:asOf,task:'Traverse town options and reviewed-for-publication anonymous candidate returns',
    worlds:['Abundent Town Desk','Free Graph candidate return history'],
    resolution:'editorial options + self-report history; no independently evidenced current service availability'},
  task_world_cut:{status:'unresolved',
    selected_ids:[...sources.map(s=>s.id),...nodes.map(n=>n.id),...links.map(l=>l.id)],
    owner_head_source_ids:[],
    omitted:[{door:'Independent confirmation of community service',reason:'No externally evidenced completed action admitted'},
      {door:'Partner/venue/steward authority',reason:'No owner gate or signed permission in this projection'}],
    rationale:'Enough to inspect candidate-history roads without treating self-reports as observed project outcomes.'},
  sources,nodes,links,
  residual_fog:['A human approved publication of the anonymous candidate, not its factual correctness.',
    'No independent field outcome, ownership/partner approval or current availability established.'],
  non_imports:['Public curation does not verify that an action happened.',
    'No public/private raw notes, contact details or partner commitments are imported.',
    'Only explicit owner-local gate receipts could constitute a future effect; none included.'],
  extensions:{mode:'REVIEWED_ANONYMOUS_CANDIDATES_NOT_VERIFIED_FIELD_WORK',
    originGraphPacketId:graph.packet_id,reviewedCandidateCount:accepted.length,
    verifiedCompletedWorkCount:0}
 };
 const combined={...body,packet_id:'fgp:'+digest(body)};
 const summaries=accepted.map(e=>{
  const question=e.candidate.nodes.find(n=>n.kind==='question'&&n.extensions?.stage==='NEXT_INVITATION_CANDIDATE');
  return {
   graphPacketId:e.candidate.packet_id,
   optionId:e.candidate.extensions.privateReceiptId?e.seed.aliases?.[0]?.split('/').at(-1):null,
   optionTitle:e.seed.label,
   reportedOutcome:e.candidate.extensions.reportedOutcome,
   proposedNextQuestion:question?.label||'No next question supplied',
   editorialStatus:'HUMAN_REVIEWED_FOR_ANONYMOUS_PUBLICATION',
   actualActionVerification:'NOT_VERIFIED',partnerConsent:'NOT_ESTABLISHED',
   fieldReportPublished:false,
   approvedForPublicSummaryAt:e.entry.publication.reviewedAt
  };
 }).sort((a,b)=>a.graphPacketId.localeCompare(b.graphPacketId));
 return {graph:combined,summary:{schema:'abundent/reviewed-returns-index-v1',mode:'ANONYMOUS_UNVERIFIED_CANDIDATES',count:summaries.length,entries:summaries,
  disclaimer:'Editorially shared self-reports, not independent confirmation of fieldwork, volunteers, events or services.'}};
}
export async function buildReviewedReturnGraph(){
 const input=await readFile(join(root,'town/catalog.json'));
 const graph=makeTownPacket(JSON.parse(input.toString('utf8')),input);
 let names=[];
 try{names=await readdir(join(root,'town/reviewed-returns'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const entries=[];
 for(const name of names.filter(n=>n.endsWith('.json')).sort()){
  if(!/^[a-z0-9][a-z0-9-]{0,80}\.json$/.test(name))throw Error('INVALID_REVIEW_FILENAME');
  const bytes=await readFile(join(root,'town/reviewed-returns',name));
  if(bytes.byteLength>60000)throw Error('REVIEW_ENTRY_TOO_LARGE');
  entries.push(JSON.parse(bytes.toString('utf8')));
 }
 const result=await makeReviewedReturnProjection(graph,entries);
 await mkdir(join(root,'public/town'),{recursive:true});
 await writeFile(join(root,'public/town/returns.json'),JSON.stringify(result.summary,null,2)+'\n');
 await writeFile(join(root,'public/town/returns-graph.json'),JSON.stringify(result.graph,null,2)+'\n');
 console.log('Published anonymized, self-reported candidate summaries:',result.summary.count,'verified field wins: 0');
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildReviewedReturnGraph();
