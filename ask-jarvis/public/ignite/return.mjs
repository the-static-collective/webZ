// FIELD-RETURN-013 · Browser-local human self-report -> native Free Graph
// CANDIDATE. Deliberately unsigned, unverified, not uploaded or published.
// A return is a claim from one person, NOT proof of completed work or consent.
const PRIVATE=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|\b(?:api[_ -]?key|password|private key|bearer token)\b|\b\d{1,5}\s+(?:[\w-]+\s+){0,4}(?:st|street|ave|avenue|rd|road|lane|ln|blvd|drive|dr)\b|https?:\/\/|www\./i;
export const outcomes=Object.freeze([
 {id:'NO_CONTACT',label:'I made the draft, but did not ask anyone yet'},
 {id:'DECLINED',label:'Someone declined the invitation'},
 {id:'REVIEWED',label:'A willing person reviewed the draft'},
 {id:'CORRECTED',label:'Someone suggested a correction'},
 {id:'DONE_SELF_REPORTED',label:'I report that a small action occurred (not verified)'}
]);
const FOLLOW_UP={
 NO_CONTACT:'What would make this first invitation easier for one willing person to review?',
 DECLINED:'What alternative small, welcome contribution could someone choose without pressuring the person who declined?',
 REVIEWED:'What single uncertainty from the review needs a clearer, smaller test?',
 CORRECTED:'Could someone willingly examine the corrected version of this question?',
 DONE_SELF_REPORTED:'What independent evidence would verify the reported action, and what could be tried next if confirmed?'
};
const copy=v=>JSON.parse(JSON.stringify(v));
function canonical(v){
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
 return JSON.stringify(v);
}
async function digestText(s){
 const data=new TextEncoder().encode(s);
 const buf=await globalThis.crypto.subtle.digest('SHA-256',data);
 return 'sha256:'+Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
const hash=async v=>digestText(canonical(v));
async function record(prefix,value){return {...value,id:prefix+':'+await hash(value)};}
function safeNotes(text){
 if(typeof text!=='string'||text.length>260||/[\x00-\x1f\x7f]/.test(text)||PRIVATE.test(text))
   throw Error('PRIVATE_OR_INVALID_FIELD_NOTE');
 return text.trim();
}
function checkOriginal(ignition,graph){
 if(ignition?.schema!=='ask-jarvis/ignition-v1'||ignition.status!=='DRAFT_READY_NOT_EXECUTED')
   throw Error('VALID_IGNITION_REQUIRED');
 if(graph?.schema!=='free-graph.packet/v0'||!/^fgp:sha256:[a-f0-9]{64}$/.test(graph.packet_id||''))
   throw Error('SOURCE_GRAPH_REQUIRED');
 if(ignition.option?.status!=='EDITORIAL_PROPOSAL'||!graph.nodes?.some(n=>
  n.id===ignition.option.graphNodeId&&n.status==='proposed'&&n.extensions?.scope==='HYPOTHETICAL_ONLY'))
   throw Error('IGNITION_SOURCE_DISAGREES');
 if(!graph.sources?.length)throw Error('MISSING_GRAPH_SOURCE');
}
export async function makeFieldReturn({ignition,graph,outcome,privateNote='',observedAt=new Date().toISOString()}){
 checkOriginal(ignition,graph);
 const valid=outcomes.find(o=>o.id===outcome);
 if(!valid)throw Error('UNSUPPORTED_RETURN_OUTCOME');
 const note=safeNotes(privateNote);
 if(outcome!=='NO_CONTACT'&&note.length<12)throw Error('FIELD_NOTE_NEEDED');
 if(typeof observedAt!=='string'||!Number.isFinite(Date.parse(observedAt))||observedAt.length>36)
   throw Error('INVALID_OBSERVATION_TIME');
 const question=FOLLOW_UP[outcome];
 const privateBody={
  schema:'ask-jarvis/field-return-private-v1',
  status:'SELF_REPORTED_UNVERIFIED',
  outcome,originalQuestion:ignition.question,originalSeedId:ignition.option.id,
  originalGraphPacketId:graph.packet_id,
  claimedAt:observedAt,privateNote:note,
  verifier:'NONE',signature:'NONE',stewardApproval:'NOT_ESTABLISHED',
  effectsByJarvis:'NONE',nextQuestion:question,
  warning:'Visitor-authored self-report, not evidence that other people agreed or that work was completed. Keep this original file private.'
 };
 const privateReceipt={...privateBody,id:'frp:'+await hash(privateBody)};
 const originalSource=copy(graph.sources.find(s=>graph.nodes.find(n=>n.id===ignition.option.graphNodeId)?.source_ids.includes(s.id))||graph.sources[0]);
 const privateSource=await record('fgs',{
  source_class:'human-witness',
  locator:{system:'browser-local',container:'JAR;VIS private field return',
    coordinate:'private-record-held-by-the-person-who-wrote-it',revision:privateReceipt.id,
    resolution:'private local file; no server copy and no independent authentication'},
  observed_at:observedAt,acquisition:'explicit visitor-authored offline return, not independent field verification',
  digest:await hash(privateReceipt),access:'private',export:'pointer-only',authority:'source-local',
  redaction:'All raw field notes and any human identifiers are withheld. Only the selected outcome classification is represented.',
  extensions:{trust:'SELF_REPORTED_UNVERIFIED',humanAgreement:'UNKNOWN',completedAct:'NOT_ESTABLISHED'}
 });
 const seed=copy(graph.nodes.find(n=>n.id===ignition.option.graphNodeId));
 const testimony=await record('fgn',{
  kind:'testimony',label:'Private field-return claim: '+valid.label,
  source_ids:[privateSource.id],status:'unresolved',witness_requirement:'human',
  extensions:{outcome,authority:'NONE',evidenceGrade:'SELF_REPORTED_UNVERIFIED',
    rawNoteExported:false,identityVerified:false,partnerConsent:'UNKNOWN'}
 });
 const next=await record('fgn',{
  kind:'question',label:question,source_ids:[originalSource.id,privateSource.id],
  status:'unresolved',extensions:{stage:'NEXT_INVITATION_CANDIDATE',
    trigger:'VISITOR_SELECTED_OUTCOME_NOT_FIELD_PROOF',originSeed:ignition.option.id}
 });
 const a=await record('fgl',{
  from:seed.id,to:testimony.id,verb:'connects',
  qualifier:'visitor claims a return after making a draft; field occurrence is unverified',
  status:'proposed',source_ids:[privateSource.id,originalSource.id],authority:'none'
 });
 const b=await record('fgl',{
  from:testimony.id,to:next.id,verb:'connects',
  qualifier:'self-reported outcome suggests a possible follow-up; consent and reality unresolved',
  status:'proposed',source_ids:[privateSource.id],authority:'none'
 });
 const sources=[originalSource,privateSource],nodes=[seed,testimony,next],links=[a,b];
 const body={
  schema:'free-graph.packet/v0',
  purpose:'Private, source-linked candidate return from one JAR;VIS field-kit draft; not accepted community evidence',
  modes:['seed','re-enter'],
  scope:{as_of:observedAt,task:'Remember an unverified visitor return and propose a next question without making a community claim',
    resolution:'visitor-authored field-return claim, no independent verification',
    worlds:['JAR;VIS local field kit','Free Graph candidate return']},
  task_world_cut:{status:'unresolved',selected_ids:[...sources.map(s=>s.id),...nodes.map(n=>n.id),...links.map(l=>l.id)],
    owner_head_source_ids:[],omitted:[
      {door:'Independent field verification',reason:'No independently authenticated evidence inspected'},
      {door:'Steward consent and ownership gates',reason:'No third-party authorization recorded'},
      {door:'Public publication and local adoption',reason:'Separate human review and owned project gates are required'}
    ],rationale:'Enough for an unverified candidate crossing; insufficient for testing, bearing, constitution, or public claim.'},
  sources,nodes,links,
  residual_fog:['Was an action actually completed? Not independently established.',
    'Was any invitation accepted, declined or corrected? Visitor self-report only.',
    'No independently authenticated person, permission, quantity or downstream outcome.'],
  non_imports:['A self-report is not proof of service delivered or partner agreement.',
    'This graph candidate is not published or automatically merged into the Town Desk.',
    'Raw visitor notes stay in their private downloadable receipt; their digest is not a public witness.'],
  extensions:{site:'abundent.org',originGraphPacketId:graph.packet_id,
    privateReceiptId:privateReceipt.id,mode:'UNVERIFIED_CANDIDATE_NOT_PUBLISHED',
    reportedOutcome:outcome,readablePublicFacts:false}
 };
 const candidate={...body,packet_id:'fgp:'+await hash(body)};
 return {privateReceipt,candidateGraph:candidate,nextQuestion:question,
  nextSeedId:ignition.option.id,interpretation:valid.label,
  summary:'This is an unverified, visitor-authored return. A next question was proposed, but no field result was admitted or published.'};
}
export async function validateCandidate(packet){
 if(packet?.schema!=='free-graph.packet/v0')return false;
 const {packet_id,...body}=packet;
 if(packet_id!=='fgp:'+await hash(body))return false;
 for(const [name,prefix] of [['sources','fgs'],['nodes','fgn'],['links','fgl']]){
  for(const e of packet[name]||[]){const {id,...v}=e;if(id!==prefix+':'+await hash(v))return false;}
 }
 return packet.extensions?.mode==='UNVERIFIED_CANDIDATE_NOT_PUBLISHED'
  &&packet.task_world_cut?.status==='unresolved'
  &&packet.links.every(x=>x.verb==='connects'&&x.authority==='none'&&x.status==='proposed')
  &&packet.sources.some(x=>x.access==='private'&&x.export==='pointer-only');
}
