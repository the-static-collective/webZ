// BANANAS-001 — pure, read-only composition model for Abundent.
// Suggestive ranking is not a compatibility test or project admission.
const expectedGroups = Object.freeze({N:12,M:10,V:9,W:10,P:11,C:12});
export const KINDS = Object.freeze(['song','story','world','question','need','object','machine']);
export const AFFINITY = Object.freeze({
  song:['FOSSIL-JUKEBOX','ORCHARD-CINEMA','RHYTHM-MUTANT','NEEDFUL-PORCH','ROOMSHIP','GHOST-POST','MISSION-FORGE','TRAVELING-JUBILEE'],
  story:['ORCHARD-CINEMA','ROOMSHIP','RHYTHM-MUTANT','FOSSIL-JUKEBOX','MISSION-FORGE','NEEDFUL-PORCH','GHOST-POST','TRAVELING-JUBILEE'],
  world:['ROOMSHIP','MISSION-FORGE','GHOST-POST','ORCHARD-CINEMA','NEEDFUL-PORCH','TRAVELING-JUBILEE','FOSSIL-JUKEBOX','RHYTHM-MUTANT'],
  question:['MISSION-FORGE','ROOMSHIP','ORCHARD-CINEMA','NEEDFUL-PORCH','FOSSIL-JUKEBOX','GHOST-POST','RHYTHM-MUTANT','TRAVELING-JUBILEE'],
  need:['NEEDFUL-PORCH','TRAVELING-JUBILEE','GHOST-POST','MISSION-FORGE','ORCHARD-CINEMA','ROOMSHIP','RHYTHM-MUTANT','FOSSIL-JUKEBOX'],
  object:['RHYTHM-MUTANT','GHOST-POST','ORCHARD-CINEMA','TRAVELING-JUBILEE','FOSSIL-JUKEBOX','ROOMSHIP','MISSION-FORGE','NEEDFUL-PORCH'],
  machine:['MISSION-FORGE','GHOST-POST','RHYTHM-MUTANT','TRAVELING-JUBILEE','ROOMSHIP','NEEDFUL-PORCH','ORCHARD-CINEMA','FOSSIL-JUKEBOX']
});
const fail = message => { throw Error('REACTOR_CATALOG_INVALID: '+message); };
const isString = x => typeof x==='string' && x.trim().length>0;
export function validateReactor(catalog){
 if(catalog?.schema!=='abundent/seed-reactor-catalog/v1'||catalog?.state!=='PROPOSED_UNVERIFIED')fail('schema or authority');
 if(!Array.isArray(catalog.seeds)||catalog.seeds.length!==64||!Array.isArray(catalog.chambers)||catalog.chambers.length!==8)fail('counts');
 if(!/^[a-f0-9]{40}$/.test(catalog.provenance?.sourceCommit||'')||
    !/^[a-f0-9]{40}$/.test(catalog.provenance?.harvestBlobSha||'')||
    !/^[a-f0-9]{40}$/.test(catalog.provenance?.recipeBlobSha||''))fail('source pins');
 const ids = new Set();
 const counts = {};
 for(const seed of catalog.seeds){
  if(!/^PLZ-CHAT-20261016-[NMVWPC][0-9]{2}$/.test(seed.planId)||
      seed.id!==seed.planId.slice(-3)||ids.has(seed.id)||!isString(seed.title))fail('seed identity');
  if(seed.disposition!=='UNKNOWN'||seed.confidence!=='LOW')fail('illicit seed promotion');
  ids.add(seed.id);counts[seed.id]=0;
 }
 for(const [group,size] of Object.entries(expectedGroups)){
  for(let i=1;i<=size;i++)if(!ids.has(group+String(i).padStart(2,'0')))fail('missing seed '+group+i);
 }
 const chamberIds=new Set();
 for(const c of catalog.chambers){
  if(!/^[A-Z0-9-]+$/.test(c.id||'')||chamberIds.has(c.id)||
    !isString(c.name)||!isString(c.door)||!isString(c.question)||
    !isString(c.smallestProof)||!isString(c.proposedReturn))fail('chamber');
  if(!Array.isArray(c.primary)||c.primary.length<3||!Array.isArray(c.orbit)||
    !Array.isArray(c.gates)||c.gates.length<2||
    !Array.isArray(c.ownerCandidates)||!c.ownerCandidates.length)fail('composition gate');
  const members=[...c.primary,...c.orbit];
  if(new Set(members).size!==members.length)fail('duplicate local member');
  for(const id of members){if(!ids.has(id))fail('unrecognized member '+id);counts[id]++;}
  chamberIds.add(c.id);
 }
 const memberships=Object.values(counts).reduce((a,b)=>a+b,0);
 const repeated=Object.values(counts).filter(n=>n>1).length;
 if(Object.values(counts).some(n=>n===0)||memberships!==98||repeated!==34||
   catalog.coverage?.seeds!==64||catalog.coverage?.chambers!==8||
   catalog.coverage?.memberships!==98||catalog.coverage?.multiChamberSeeds!==34)fail('incomplete coverage');
 for(const ids of Object.values(AFFINITY))if(ids.length!==8||ids.some(id=>!chamberIds.has(id)))fail('affinity');
 return true;
}
const kindFor = kind => {
 if(['song','room','album','letter','music'].includes(kind))return 'song';
 if(['story','panel','manga'].includes(kind))return 'story';
 if(['field','world','gallery','witness'].includes(kind))return 'world';
 if(['need','community','porch'].includes(kind))return 'need';
 if(['machine','instrument','workbench'].includes(kind))return 'machine';
 if(['photo','object','artifact'].includes(kind))return 'object';
 return KINDS.includes(kind)?kind:'question';
};
export function selectedCatalogParticular(node){
 if(!node||!isString(node.id)||!isString(node.label)||!isString(node.kind))throw Error('PARTICULAR_REQUIRED');
 return Object.freeze({kind:kindFor(node.kind),sourceKind:'COMMITTED_CATALOG',id:node.id,
  label:node.label.slice(0,200),owner:isString(node.owner)?node.owner:'Owner not verified',
  source:isString(node.source)?node.source:'Catalog reference',url:node.url||null});
}
export function selectedLocalParticular(text,kind='question'){
 if(!KINDS.includes(kind))throw Error('INVALID_LOCAL_KIND');
 if(typeof text!=='string')throw Error('PARTICULAR_REQUIRED');
 const label=text.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 if(!label||label.length>160)throw Error('PARTICULAR_LENGTH');
 return Object.freeze({kind,sourceKind:'LOCAL_UNVERIFIED',id:null,label,owner:null,
  source:'Visitor entered in this browser only; not submitted or source-verified',url:null});
}
export function rankChambers(catalog,particular){
 validateReactor(catalog);
 if(!particular||!isString(particular.label))throw Error('PARTICULAR_REQUIRED');
 const ranking=AFFINITY[kindFor(particular.kind)];
 return ranking.map((id,index)=>({chamber:catalog.chambers.find(c=>c.id===id),
  rank:index+1,score:8-index,
  basis:'Curated medium affinity only; no source, rights, owner or implementation compatibility verified'}));
}
export function composeCandidate(catalog,particular,chamberId){
 validateReactor(catalog);
 if(!particular||!isString(particular.label))throw Error('PARTICULAR_REQUIRED');
 const chamber=catalog.chambers.find(c=>c.id===chamberId);
 if(!chamber)throw Error('UNKNOWN_CHAMBER');
 const byId=new Map(catalog.seeds.map(x=>[x.id,x]));
 const selected=id=>({planId:byId.get(id).planId,title:byId.get(id).title,
   confidence:byId.get(id).confidence,disposition:byId.get(id).disposition,
   ownerCandidate:byId.get(id).ownerCandidate,nextGate:byId.get(id).nextGate});
 return Object.freeze({
  schema:'abundent/seed-reactor-offer/v1',status:'PROPOSED_UNVERIFIED',authority:'NONE',
  selectedByVisitor:'A CHAMBER CHOICE, NOT OWNER APPROVAL',
  particular:{kind:kindFor(particular.kind),label:particular.label,sourceKind:particular.sourceKind,
    catalogId:particular.sourceKind==='COMMITTED_CATALOG'?particular.id:null,
    source:particular.source,url:particular.url||null},
  chamber:{id:chamber.id,name:chamber.name,door:chamber.door,question:chamber.question,
    ownerCandidatesNotConsent:chamber.ownerCandidates,
    coreProposalsNotDependencies:chamber.primary.map(selected),
    orbitPossibilitiesNotRequirements:chamber.orbit.map(selected),
    smallestUnperformedProof:chamber.smallestProof,
    proposedReturnNotProduced:chamber.proposedReturn,
    unsatisfiedGates:chamber.gates},
  lineage:{edition:catalog.edition,sourceCommit:catalog.provenance.sourceCommit,
    harvestBlobSha:catalog.provenance.harvestBlobSha,recipeBlobSha:catalog.provenance.recipeBlobSha,
    sourcePR:catalog.provenance.sourcePR},
  effects:{published:false,executed:false,ownerAdmitted:false,mediaTransferred:false},
  boundary:['CONVERSATION != SOURCE WITNESS','CHOICE != APPROVAL',
    'MEMBERSHIP != TECHNICAL COMPATIBILITY','PROPOSAL != EXECUTION','PUBLICATION REQUIRES A SEPARATE DECISION']
 });
}
