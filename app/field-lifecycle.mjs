// Observation, editorial representation and execution are separate contracts.
import {canonical,exact,hash} from './model.mjs';
import {validateField,fieldReceipt,LAWS} from './field.mjs';
export const FOUNDING_HASH='sha256:d3fa28fa3e1e2d2e370287422242fc8eab3c0362e27b61f54d0392430f8e21d1';
export const MOVING_LAWS=Object.freeze(['THE FIELD MAY MOVE WITHOUT THE PORCH LYING','FRAGMENT != FIELD ENTRY','OBSERVATION != PUBLIC REPRESENTATION','CENSUS != ADMISSION','NOT OBSERVED != WITHDRAWN','MISSING INPUT != NEGATIVE FACT','CHANGE != IMPROVEMENT','LATEST != MOST AUTHORITATIVE','OLD SNAPSHOT != ERROR','NEW SNAPSHOT != RETROACTIVE TRUTH','CURRENT POINTER != CANON','MATCH != RECOMMENDATION','WAYFINDING != RANKING','WAYFINDING MAY END AT HOLD','PATH != CROSSING','PATH != EXECUTION','CANNON DISCOVERY != WEBZ PUBLIC ADMISSION','ROUTE EXISTS != WORLD ADMISSION','LAB != WORLD','NAMESPACE != HOSTED WORLD','PUBLIC OBSERVATION != CODE INTEGRATION','MORE OBSERVATIONS != MORE PUBLIC DOORS','CENSUS INPUT != PUBLIC CACHE']);
export const INTENTS=Object.freeze(['LISTEN','MAKE','BRING','SEND','WANDER','PROOF','BUILD','MACHINES','PRINT']);
const fail=m=>{throw Error(m);};
const text=(v,max=1400)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('BOUNDED_TEXT_REQUIRED');};
const list=(v,max=48)=>{if(!Array.isArray(v)||v.length>max)fail('BOUNDED_LIST_REQUIRED');};
const id=v=>{text(v,80);if(!/^[a-z][a-z0-9-]*$/.test(v))fail('INVALID_ID');};
const digest=v=>{if(!/^sha256:[a-f0-9]{64}$/.test(v))fail('DIGEST_REQUIRED');};
const pin=v=>{if(!/^[a-f0-9]{40}$/.test(v))fail('SOURCE_PIN_REQUIRED');};
const repo=v=>{if(!/^the-static-collective\/[A-Za-z0-9-]+$/.test(v))fail('REPOSITORY_REQUIRED');};
const path=v=>{text(v,240);if(!/^[A-Za-z0-9_.\/-]+$/.test(v)||v.includes('..')||v.startsWith('/'))fail('SOURCE_PATH_REQUIRED');};
const uniq=(xs,message)=>{if(new Set(xs).size!==xs.length)fail(message);};
export async function seal(value,key){return {...value,[key]:await hash(canonical(value))};}
export async function verifySeal(value,key){digest(value[key]);const body={...value};delete body[key];if(await hash(canonical(body))!==value[key])fail('IDENTITY_MISMATCH');return value;}
export function validateFragment(f){
 exact(f,['schema','fragmentId','source','history','subjectId','ownerClaim','kind','humanLabel','humanSummary','observedCapabilities','observedClosures','candidateDoors','relations','laws','verification','externalObservation']);
 if(f.schema!=='webz/public-field-fragment/v0'||canonical(f).length>24000)fail('INVALID_FRAGMENT');id(f.fragmentId);id(f.subjectId);
 exact(f.source,['repository','exactCommit','pathOrContract','observedAt']);repo(f.source.repository);pin(f.source.exactCommit);path(f.source.pathOrContract);
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(f.source.observedAt)||!Number.isFinite(Date.parse(f.source.observedAt)))fail('OBSERVATION_TIME_REQUIRED');
 exact(f.history,['pr','headBranch','baseBranch','state','mergedAt','closedAt']);if(!Number.isInteger(f.history.pr)||f.history.pr<1||!['OPEN','CLOSED','MERGED'].includes(f.history.state))fail('INVALID_SOURCE_HISTORY');
 text(f.history.headBranch,160);text(f.history.baseBranch,160);for(const k of ['mergedAt','closedAt'])if(f.history[k]!==null&&!Number.isFinite(Date.parse(f.history[k])))fail('INVALID_SOURCE_HISTORY');
 if((f.history.state==='MERGED')!==(f.history.mergedAt!==null))fail('INVALID_SOURCE_HISTORY');
 repo(f.ownerClaim);if(f.ownerClaim!==f.source.repository)fail('OWNER_CLAIM_MISMATCH');if(!['EXPERIMENT','OBSERVATION','WITHDRAWAL'].includes(f.kind))fail('INVALID_FRAGMENT_KIND');
 text(f.humanLabel,180);text(f.humanSummary);
 for(const k of ['observedCapabilities','observedClosures','laws']){list(f[k],24);f[k].forEach(v=>text(v));}if(!f.observedClosures.length||!f.laws.includes('FRAGMENT != FIELD ENTRY'))fail('FRAGMENT_LIMITS_REQUIRED');
 list(f.candidateDoors,12);uniq(f.candidateDoors.map(d=>d.doorId),'DUPLICATE_DOOR_ID');
 for(const d of f.candidateDoors){
  exact(d,['doorId','label','kind','effectClass','target','owner','availability','reason','requiredNextAuthority']);id(d.doorId);for(const k of ['label','owner','reason','requiredNextAuthority'])text(d[k]);
  if(d.effectClass==='REMOTE_EFFECT'){if(d.kind!=='CAPABILITY'||d.availability!=='HOLD'||d.target!==null)fail('REMOTE_EFFECT_CLOSED');}
  else if(d.kind!=='SOURCE'||d.effectClass!=='EXTERNAL_NAVIGATION'||d.availability!=='AVAILABLE'||d.owner!=='GitHub source inspection'||d.target!==`https://github.com/${f.source.repository}/tree/${f.source.exactCommit}`)fail('CANDIDATE_SOURCE_ONLY');
 }
 list(f.relations,24);for(const r of f.relations){exact(r,['from','to','kind','description']);id(r.from);id(r.to);text(r.description);if(r.from!==f.subjectId||r.from===r.to||!['observes','references','neighbor-of','can-propose-to','can-receive-from'].includes(r.kind))fail('RELATION_IS_NOT_AUTHORITY');}
 exact(f.verification,['sourceLevel','verifier','contentHash']);if(!['CLAIMED','CONTENT_ADDRESSED','LOCALLY_VERIFIED','INDEPENDENTLY_REPLAYED'].includes(f.verification.sourceLevel))fail('INVALID_PROOF_LEVEL');text(f.verification.verifier);digest(f.verification.contentHash);
 if(f.externalObservation!==null){const x=f.externalObservation;exact(x,['observedBy','relationClaim']);if(x.observedBy!=='CANNON')fail('UNKNOWN_EXTERNAL_OBSERVER');exact(x.relationClaim,['producer','consumer','compatibilityState','exactReceipt']);text(x.relationClaim.producer);text(x.relationClaim.consumer);if(!['CANDIDATE_ONLY','INSPECTED_COMPATIBILITY','INCOMPATIBLE','HOLD'].includes(x.relationClaim.compatibilityState))fail('COMPATIBILITY_IS_NOT_EXECUTION');const r=x.relationClaim.exactReceipt;if(r!==null){exact(r,['repository','exactCommit','path','sha256']);repo(r.repository);pin(r.exactCommit);path(r.path);digest(r.sha256);if(r.repository!==f.source.repository||r.exactCommit!==f.source.exactCommit||r.sha256!==f.verification.contentHash)fail('RECEIPT_SOURCE_MISMATCH');}}
 return f;
}
export async function fragmentHash(f){validateFragment(f);return hash(canonical(f));}
// No authority parameter or admission output exists on this door.
export async function census(fragments,previous){
 await validatePrevious(previous);
 list(fragments,64);if(!fragments.length)fail('EXPLICIT_INPUT_REQUIRED');fragments.forEach(validateFragment);uniq(fragments.map(f=>f.fragmentId),'DUPLICATE_FRAGMENT');
 const targets=new Set([...previous.field.worlds.map(w=>w.id),...fragments.map(f=>f.subjectId)]);
 for(const f of fragments)for(const r of f.relations)if(!targets.has(r.to))fail('UNKNOWN_RELATION_TARGET');
 const observations=[];for(const f of fragments)observations.push({fragmentHash:await fragmentHash(f),fragment:f});observations.sort((a,b)=>a.fragment.fragmentId<b.fragment.fragmentId?-1:a.fragment.fragmentId>b.fragment.fragmentId?1:0);
 return seal({schema:'webz/public-field-census/v0',parentSnapshotHash:previous.snapshotHash,observations,authority:'NONE',scope:'Explicit supplied observations only; not public admission, deployment or authority.'},'censusHash');
}

export async function validatePrevious(s){
 if(s.schema==='webz/public-field-founding-snapshot/v0'){
  exact(s,['schema','snapshotHash','fieldHash','parentSnapshotHash','censusHash','admissionHashes','field','observations','fragments']);
  const expected=await foundingSnapshot(s.field,s.observations);if(canonical(expected)!==canonical(s))fail('FOUNDING_HISTORY_CHANGED');
 }else{
  exact(s,['schema','parentSnapshotHash','censusHash','admissionHashes','fieldHash','field','observations','fragments','provenance','doorTags','paths','publicChanges','laws','snapshotHash']);
  if(s.schema!=='webz/public-field-snapshot/v0')fail('ADMITTED_SNAPSHOT_REQUIRED');await verifySeal(s,'snapshotHash');
  if((await fieldReceipt(s.field,s.observations)).fieldHash!==s.fieldHash)fail('FIELD_IDENTITY_MISMATCH');validateLens(s.field,s.doorTags,s.paths);s.fragments.forEach(validateFragment);
 }
 return s;
}
export async function validateCensus(c,previous){
 exact(c,['schema','parentSnapshotHash','observations','authority','scope','censusHash']);await verifySeal(c,'censusHash');
 if(c.schema!=='webz/public-field-census/v0'||c.authority!=='NONE'||c.parentSnapshotHash!==previous.snapshotHash||c.scope!=='Explicit supplied observations only; not public admission, deployment or authority.')fail('CENSUS_IS_NOT_ADMISSION');
 list(c.observations,64);if(!c.observations.length)fail('EXPLICIT_INPUT_REQUIRED');uniq(c.observations.map(o=>o.fragment.fragmentId),'DUPLICATE_FRAGMENT');
 const targets=new Set([...previous.field.worlds.map(w=>w.id),...c.observations.map(o=>o.fragment.subjectId)]);
 for(const o of c.observations){exact(o,['fragmentHash','fragment']);if(await fragmentHash(o.fragment)!==o.fragmentHash)fail('FRAGMENT_IDENTITY_MISMATCH');for(const r of o.fragment.relations)if(!targets.has(r.to))fail('UNKNOWN_RELATION_TARGET');}
 return c;
}

const sorted=xs=>[...new Set(xs)].sort();
function claims(fs){return {sources:sorted(fs.map(f=>f.source.repository+'@'+f.source.exactCommit)),capabilities:sorted(fs.flatMap(f=>f.observedCapabilities)),doors:sorted(fs.flatMap(f=>f.candidateDoors).map(d=>canonical(d))),holds:sorted(fs.flatMap(f=>f.observedClosures)),relations:sorted(fs.flatMap(f=>f.relations).map(canonical))};}
export async function delta(previous,c){
 await validatePrevious(previous);await validateCensus(c,previous);const subjects=sorted([...previous.field.worlds.map(w=>w.id),...c.observations.map(o=>o.fragment.subjectId)]),changes=[];
 for(const subjectId of subjects){
  const w=previous.field.worlds.find(w=>w.id===subjectId),now=c.observations.filter(o=>o.fragment.subjectId===subjectId),before=previous.fragments.filter(f=>f.subjectId===subjectId);let classifications=[];
  if(!now.length)classifications=['NOT_REOBSERVED'];else if(now.some(o=>o.fragment.kind==='WITHDRAWAL'))classifications=['WITHDRAWAL_CANDIDATE'];else if(!w)classifications=['NEW_CANDIDATE'];else if(before.length){const a=claims(before),b=claims(now.map(o=>o.fragment));for(const [k,kind] of [['sources','SOURCE_UPDATED'],['capabilities','CAPABILITY_CHANGED'],['doors','DOOR_CHANGED'],['holds','HOLD_CHANGED'],['relations','RELATION_CHANGED']])if(canonical(a[k])!==canonical(b[k]))classifications.push(kind);if(!classifications.length)classifications=['UNCHANGED'];}
  else {const old=sorted([w.source,...w.additionalSources].map(s=>s.repository+'@'+s.exactCommit)),current=claims(now.map(o=>o.fragment)).sources;classifications=canonical(old)===canonical(current)?['UNCHANGED']:['SOURCE_UPDATED'];}
  changes.push({subjectId,classifications,fragmentHashes:now.map(o=>o.fragmentHash),meaning:!now.length?'NOT OBSERVED IN THIS CENSUS; previous public representation retained. No withdrawal inferred.':now.some(o=>o.fragment.kind==='WITHDRAWAL')?'Explicit withdrawal observation requires separate human admission.':'Observation only; change is not improvement or public admission.'});
 }
 return seal({schema:'webz/public-field-delta/v0',parentSnapshotHash:previous.snapshotHash,censusHash:c.censusHash,changes,authority:'NONE'},'deltaHash');
}
export async function foundingSnapshot(field,observations){const receipt=await fieldReceipt(field,observations);if(receipt.fieldHash!==FOUNDING_HASH)fail('FOUNDING_HISTORY_CHANGED');return {schema:'webz/public-field-founding-snapshot/v0',snapshotHash:FOUNDING_HASH,fieldHash:FOUNDING_HASH,parentSnapshotHash:null,censusHash:null,admissionHashes:[],field,observations,fragments:[]};}
export function validateLens(field,tags,paths){
 list(tags,64);const doors=new Map(field.worlds.flatMap(w=>w.doors.map(d=>[d.doorId,{world:w,door:d}])));uniq(tags.map(t=>t.doorId),'DUPLICATE_DOOR_TAG');
 for(const t of tags){exact(t,['doorId','intents']);if(!doors.has(t.doorId))fail('UNKNOWN_TAG_DOOR');list(t.intents,9);uniq(t.intents,'DUPLICATE_INTENT');if(!t.intents.length||t.intents.some(i=>!INTENTS.includes(i)))fail('INVALID_INTENT');}
 list(paths,8);uniq(paths.map(p=>p.pathId),'DUPLICATE_PATH');
 for(const p of paths){exact(p,['schema','pathId','label','intent','steps','relationKeys','authority']);if(p.schema!=='webz/public-field-path/v0'||p.authority!=='NONE'||!INTENTS.includes(p.intent))fail('PATH_IS_NOT_EXECUTION');id(p.pathId);text(p.label);list(p.steps,8);if(p.steps.length<2)fail('PATH_STEPS_REQUIRED');let lastWorld=null;
  const needed=[];for(const step of p.steps){exact(step,['worldId','doorId','label']);text(step.label);const item=doors.get(step.doorId);if(!item||item.world.id!==step.worldId)fail('UNKNOWN_PATH_DOOR');if(lastWorld&&lastWorld!==step.worldId)needed.push([lastWorld,step.worldId]);lastWorld=step.worldId;}
  list(p.relationKeys,8);for(const key of p.relationKeys)if(!field.relations.some(r=>key===r.from+'|'+r.kind+'|'+r.to))fail('UNADMITTED_PATH_RELATION');for(const [from,to] of needed)if(!p.relationKeys.some(k=>k.startsWith(from+'|')&&k.endsWith('|'+to)))fail('PATH_REQUIRES_ADMITTED_RELATION');
  if(doors.get(p.steps.at(-1).doorId).door.availability!=='HOLD')fail('PATH_ENDS_AT_HOLD');
 }
}
export async function reviewIdentity(a){const keys=['parentSnapshotHash','censusHash','selectedFragmentHashes','field','observations','doorTags','paths','publicChanges'];return hash(canonical(Object.fromEntries(keys.map(k=>[k,a[k]]))));}
export async function validateAdmission(a,c,previous){
 await validatePrevious(previous);await validateCensus(c,previous);
 exact(a,['schema','parentSnapshotHash','censusHash','selectedFragmentHashes','field','observations','doorTags','paths','publicChanges','authority','admissionHash']);await verifySeal(a,'admissionHash');
 if(a.schema!=='webz/public-field-admission/v0'||a.censusHash!==c.censusHash||a.parentSnapshotHash!==previous.snapshotHash)fail('ADMISSION_BINDING_MISMATCH');
 exact(a.authority,['kind','reference','reviewHash','scope']);if(a.authority.kind!=='HUMAN_PUBLIC_FIELD_REVIEW')fail('HUMAN_ADMISSION_REQUIRED');text(a.authority.reference);digest(a.authority.reviewHash);if(a.authority.scope!=='PUBLIC_REPRESENTATION_ONLY')fail('ADMISSION_IS_NOT_SOURCE_AUTHORITY');
 if(await reviewIdentity(a)!==a.authority.reviewHash)fail('HUMAN_REVIEW_CONTENT_MISMATCH');
 for(const w of previous.field.worlds)if(!a.field.worlds.some(x=>x.id===w.id))fail('MISSING_INPUT_IS_NOT_WITHDRAWAL');
 list(a.selectedFragmentHashes,64);uniq(a.selectedFragmentHashes,'DUPLICATE_SELECTED_FRAGMENT');for(const h of a.selectedFragmentHashes)if(!c.observations.some(o=>o.fragmentHash===h))fail('UNOBSERVED_ADMISSION');
 validateField(a.field,a.observations);validateLens(a.field,a.doorTags,a.paths);
 for(const w of a.field.worlds){const old=previous.field.worlds.find(x=>x.id===w.id);if(!old&& (w.state!=='EXPERIMENTAL'||w.publicSurface.mode!=='SOURCE_ONLY'))fail('NEW_CANDIDATE_SOURCE_INSPECTION_ONLY');
 if(!old||canonical(w)!==canonical(old)){const fs=c.observations.filter(o=>a.selectedFragmentHashes.includes(o.fragmentHash)&&o.fragment.subjectId===w.id).map(o=>o.fragment);if(!fs.length||!fs.some(f=>f.source.repository===w.source.repository&&f.source.exactCommit===w.source.exactCommit))fail('UNBOUND_PUBLIC_REPRESENTATION');for(const source of [w.source,...w.additionalSources])if(!fs.some(f=>f.source.repository===source.repository&&f.source.exactCommit===source.exactCommit)&&![old?.source,...(old?.additionalSources??[])].some(s=>s&&s.repository===source.repository&&s.exactCommit===source.exactCommit))fail('UNOBSERVED_PUBLIC_SOURCE');
   const bounds=fs.flatMap(f=>f.observedClosures).join(' ');if(w.id==='wandering-lens'&&(!w.authoritySummary.includes('LAB != WORLD')||w.publicSurface.mode!=='SOURCE_ONLY'))fail('LAB_IS_NOT_WORLD');if(w.id==='founder-namespace'&&(!w.authoritySummary.includes('NAMESPACE != HOSTED WORLD')||w.publicSurface.mode!=='SOURCE_ONLY'))fail('NAMESPACE_IS_NOT_HOSTED');if(w.id==='suno-atlas'&&(!w.authoritySummary.includes('No Suno account')||w.publicSurface.mode!=='SOURCE_ONLY'))fail('NO_ACCOUNT_INTEGRATION');if(!bounds)fail('CLAIM_LIMITS_REQUIRED');
  }}
 list(a.publicChanges,32);for(const change of a.publicChanges){exact(change,['subjectId','kind','text']);if(!a.field.worlds.some(w=>w.id===change.subjectId)||!['NEWLY_ADMITTED','SOURCE_UPDATED','NOT_REOBSERVED','UNCHANGED'].includes(change.kind))fail('UNADMITTED_PUBLIC_CHANGE');text(change.text);}
 return a;
}
export async function snapshot(previous,c,a){
 await validateAdmission(a,c,previous);const fragments=c.observations.filter(o=>a.selectedFragmentHashes.includes(o.fragmentHash)).map(o=>o.fragment);
 const provenance=[];for(const w of a.field.worlds){const fs=fragments.filter(f=>f.subjectId===w.id);provenance.push({subjectId:w.id,fragmentHashes:await Promise.all(fs.map(fragmentHash)),censusHash:c.censusHash,admissionHash:a.admissionHash,representation:fs.length?'OBSERVED_AND_REVIEWED':'RETAINED_NOT_REOBSERVED',priorSnapshotHash:previous.snapshotHash});}
 return seal({schema:'webz/public-field-snapshot/v0',parentSnapshotHash:previous.snapshotHash,censusHash:c.censusHash,admissionHashes:[a.admissionHash],fieldHash:await hash(canonical(a.field)),field:a.field,observations:a.observations,fragments,provenance,doorTags:a.doorTags,paths:a.paths,publicChanges:a.publicChanges,laws:[...LAWS,...MOVING_LAWS]},'snapshotHash');
}
export async function verifySnapshot(s,previous,c,a){const expected=await snapshot(previous,c,a);if(canonical(expected)!==canonical(s))fail('SNAPSHOT_REPLAY_MISMATCH');return s;}
export function matchingDoors(s,intent,query=''){
 if(intent!==''&&!INTENTS.includes(intent))fail('INVALID_INTENT');if(typeof query!=='string'||query.length>160)fail('BOUNDED_QUERY_REQUIRED');
 const q=query.trim().toLowerCase();return s.field.worlds.map(world=>({world,doors:world.doors.filter(d=>(!intent||s.doorTags.some(t=>t.doorId===d.doorId&&t.intents.includes(intent)))&&(!q||[world.label,world.shortDescription,world.ownerSystem,world.current,world.authoritySummary,world.nextGate,d.label,d.reason,d.requiredNextAuthority].join(' ').toLowerCase().includes(q)))})).filter(x=>x.doors.length);
}
