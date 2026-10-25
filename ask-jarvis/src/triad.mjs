// TRIAD-008: ALEX × 3rdi × LOADOUT *public read-only* research lens.
// These are owner-attributed constitutional projections, not invocations of
// ALEX.2, 3rdi or LOADOUT native runtimes. No owner authority is inherited.
export const RESEARCH_LENSES=Object.freeze(['standard','triad']);
const OWNERS=Object.freeze([
  {id:'alex',name:'ALEX.2',repo:'ALEX.2',ref:'7d116b716df82ee2379b399d90936d2fc01b7b16',path:'README.md',
    role:'Layered provenance: source is not transcription, reading or claim',
    tags:['research','source','provenance','historical','evidence','citation']},
  {id:'3rdi',name:'3rdi',repo:'3rdi',ref:'e631167a04c6bd1bf95c62cbe5a415994ebb8134',path:'README.md',
    role:'Observer-local cut: occurrence, availability, attention and relevance remain distinct',
    tags:['observer','view','time','cut','projection','perspective']},
  {id:'loadout',name:'LOADOUT',repo:'Loadout',ref:'1adcb3d82f736f3ca8329c3c1d0d9eba398d49ee',path:'README.md',
    role:'Minimal capability selection and effects fence; knowledge is not authority',
    tags:['loadout','world','capability','effect','bind','fence']}
].map(o=>Object.freeze({...o,tags:Object.freeze(o.tags)})));
export function researchTargets(lens) {
  if(!RESEARCH_LENSES.includes(lens))throw Error('RESEARCH_LENS');
  return lens==='triad'?OWNERS:null;
}
export function composeTriad({question,kind,sources,observedAt}) {
  // No remote execution: use *only* observations already made by JAR's
  // bounded fixed-owner read-only inspection path.
  if(!Array.isArray(sources)||sources.length!==3||sources.some((s,i)=>s.id!==OWNERS[i].id))
    throw Error('TRIAD_SOURCE_CUT_INVALID');
  const sourceCut=sources.map(s=>({
    id:s.id,owner:s.repo,commit:s.commit,path:OWNERS.find(o=>o.id===s.id).path,
    status:s.status,sha256:s.status==='INSPECTED'?s.sha256:null,
    locus:s.status==='INSPECTED'&&Number.isInteger(s.excerptLine)?s.repo+'/README.md#L'+s.excerptLine:null,
    match:s.status==='INSPECTED'?s.relevance:'UNAVAILABLE'
  }));
  const inspected=sourceCut.filter(s=>s.status==='INSPECTED');
  return {
    schema:'ask-jarvis/research-cut-v1',mode:'READ_ONLY_INTERPRETATION',nativeRuntimesInvoked:false,
    authority:'NONE',task:{kind,question},
    alex:{
      stage:'SOURCE_WITNESS_NOT_CLAIM',sourceLayer:'PUBLIC_OWNER_DOCUMENT',claimLayer:'UNESTABLISHED',
      formation:sourceCut.map(s=>({id:s.id,owner:s.owner,commit:s.commit,sha256:s.sha256,
        excerptLocus:s.locus,status:s.status})),
      warning:'Public owner documents and excerpts are not verified statements about local food access, willing stewards or field outcomes.'
    },
    rdi:{
      stage:'OBSERVER_LOCAL_PROJECTION_NOT_SOURCE',
      cut:{observer:'THIS_JARVIS_REQUEST',observedAt,
        occurrenceTime:'UNKNOWN_FOR_SOURCE_HISTORY',availableAt:'REQUEST_TIME_IF_INSPECTED',
        attention:'QUESTION_MATCHED_EXCERPT_OR_GENERAL_DOCUMENT',
        relevance:'QUESTION_WORD_MATCH_IS_NOT_CAUSATION'},
      projections:sourceCut.map(s=>({id:s.id,availability:s.status==='INSPECTED'?'OBSERVED':'HOLD',
        attentionLocus:s.locus,relation:s.match})),
      warning:'New relevance never rewrites the earlier source, events or authorizations.'
    },
    loadout:{
      stage:'MINIMAL_WORLD_PLANNED_NOT_NATIVE_BIND',
      declaredTask:'READ_PUBLIC_SOURCE_AND_PREPARE_UNSIGNED_PROPOSAL',
      selected:sourceCut.map(s=>({id:s.id,decision:s.status==='INSPECTED'?'READ_OBSERVED':'UNAVAILABLE_HOLD'})),
      permitted:['fixed_commit_public_document_read','in_memory_analysis','unsigned_draft'],
      fenced:['partner_contact','venue_booking','payments','file_write','project_code_execution','public_post','human_consent'],
      operatorGate:'REQUIRED_BEFORE_ANY_REAL_WORLD_EFFECT',
      nativeBind:false,
      warning:'Selection and observation grant no source-owner or real-world execution authority.'
    },
    usableWitnesses:inspected.length,
    unresolved:inspected.length===3?[]:['At least one pinned owner document could not be inspected; no substitute witness admitted.']
  };
}
