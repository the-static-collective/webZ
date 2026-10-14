// Founding, inspection-only profile. A valid descriptor never grants an effect.
import {canonical, exact, hash} from './model.mjs';
export const STATES = Object.freeze(['LIVE','LOCAL_ONLY','INSPECTABLE','PROPOSAL_ONLY','HOLD','NOT_CONNECTED','EXPERIMENTAL']);
export const EFFECTS = Object.freeze(['LOCAL_NAVIGATION','LOCAL_COMPUTE','LOCAL_PROPOSAL','PROOF_INSPECTION','EXTERNAL_NAVIGATION','REMOTE_EFFECT']);
export const RELATIONS = Object.freeze(['observes','references','can-propose-to','can-receive-from','neighbor-of']);
export const LAWS = Object.freeze([
 'THE WEB IS A PORCH, NOT THE HOUSE','VISIBLE DOOR != AUTHORITY','DOOR != EFFECT','CLICK != ADMISSION','LINK != CROSSING',
 'CODE EXISTS != SERVICE EXISTS','CI GREEN != PUBLIC DEPLOYMENT','DEPLOYABLE != DEPLOYED','RELATION != AUTHORITY',
 'PUBLIC SOURCE != PUBLIC CAPABILITY','HOLD != FAILURE','UNKNOWN != DENIED','FILE != UPLOAD',
 'WEBZ != RADIO PLAYER','WEBZ != BROADCASTER','WEBZ != STATION','WEB VISIBILITY != MACHINE CAPABILITY',
 'EXECUTOR EXISTS != PUBLIC EXECUTION SERVICE','SOURCE != EXECUTION','PROPOSAL != ADMISSION',
]);
const fail = message => {throw Error(message);};
const text = (value,max=1200) => {if(typeof value !== 'string'||!value.trim()||value.length>max) fail('BOUNDED_TEXT_REQUIRED');};
const list = (value,max=32) => {if(!Array.isArray(value)||value.length>max) fail('BOUNDED_LIST_REQUIRED');};
const id = value => {text(value,80);if(!/^[a-z][a-z0-9-]*$/.test(value)) fail('INVALID_ID');};
export function localTarget(value) {
 text(value,160);
 if(!/^(?:[a-z0-9-]+\/)*$/.test(value)) fail('UNSAFE_LOCAL_ROUTE');
 return value;
}
export function externalTarget(value) {
 text(value,500);let u;try{u=new URL(value);}catch{fail('UNSAFE_EXTERNAL_TARGET');}
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.href!==value) fail('UNSAFE_EXTERNAL_TARGET');
 return value;
}
export function validateField(field,observations) {
 exact(field,['schema','profile','observedOn','laws','worlds','relations']);
 if(field.schema!=='webz/public-field/v0'||field.profile!=='inspection-only-001'||!/^\d{4}-\d{2}-\d{2}$/.test(field.observedOn)) fail('INVALID_FIELD_PROFILE');
 if(canonical(field.laws)!==canonical(LAWS)) fail('FOUNDING_LAWS_REQUIRED');
 exact(observations,['schema','sources']);
 if(observations.schema!=='webz/source-observations/v0') fail('INVALID_OBSERVATIONS');
 list(observations.sources,24);
 const sourceKeys=['repository','ref','exactCommit','observedContract','experiment','notClaimed','reviewedFiles','pr','url','patchSha256'];
 const sourceMap=new Map();
 for(const s of observations.sources){
  exact(s,sourceKeys);text(s.repository,160);text(s.ref,160);text(s.observedContract);text(s.experiment,300);
  if(!/^the-static-collective\/[A-Za-z0-9-]+$/.test(s.repository)||!/^refs\/(pull\/\d+\/head|heads\/[a-z0-9/-]+)$/.test(s.ref)||! /^[a-f0-9]{40}$/.test(s.exactCommit)) fail('SOURCE_PIN_REQUIRED');
  if(!Number.isInteger(s.pr)||s.pr<1||s.url!==`https://github.com/${s.repository}/pull/${s.pr}`) fail('SOURCE_PR_MISMATCH');
  if(!/^sha256:[a-f0-9]{64}$/.test(s.patchSha256)) fail('SOURCE_DIGEST_REQUIRED');
  list(s.notClaimed);if(!s.notClaimed.length) fail('CLAIM_LIMITS_REQUIRED');s.notClaimed.forEach(v=>text(v,300));
  list(s.reviewedFiles,8);if(!s.reviewedFiles.length) fail('SOURCE_FILES_REQUIRED');
  for(const f of s.reviewedFiles){exact(f,['path','sha256']);text(f.path,240);if(!/^[a-zA-Z0-9_.\/-]+$/.test(f.path)||f.path.includes('..')||f.path.startsWith('/')||!/^sha256:[a-f0-9]{64}$/.test(f.sha256)) fail('INVALID_SOURCE_FILE');}
  const key=s.repository+'@'+s.exactCommit;if(sourceMap.has(key)) fail('DUPLICATE_SOURCE');sourceMap.set(key,s);
 }
 function source(s){
  exact(s,['repository','ref','exactCommit','observedContract']);
  const approved=sourceMap.get(s.repository+'@'+s.exactCommit);
  if(!approved||['repository','ref','exactCommit','observedContract'].some(k=>s[k]!==approved[k])) fail('UNREVIEWED_SOURCE_CLAIM');
 }
 list(field.worlds,16);if(!field.worlds.length) fail('EMPTY_FIELD');
 const ids=new Set(),doors=new Set();
 for(const w of field.worlds){
  exact(w,['id','label','shortDescription','category','ownerSystem','ownerRepo','source','additionalSources','state','current','publicSurface','doors','authoritySummary','nextGate','laws']);
  id(w.id);if(ids.has(w.id)) fail('DUPLICATE_WORLD_ID');ids.add(w.id);
  for(const k of ['label','shortDescription','ownerSystem','authoritySummary','nextGate','current'])text(w[k]);
  list(w.ownerRepo,4);if(!w.ownerRepo.length) fail('OWNER_REQUIRED');w.ownerRepo.forEach(r=>{text(r,160);if(!/^the-static-collective\/[A-Za-z0-9-]+$/.test(r)) fail('OWNER_REPO_REQUIRED');});
  if(!['ENTER','MAKE','LISTEN','READ','CROSS','BUILD','COMPUTE','PLAY','OBSERVE'].includes(w.category)||!STATES.includes(w.state)) fail('INVALID_STATE_OR_CATEGORY');
  source(w.source);list(w.additionalSources,8);w.additionalSources.forEach(source);
  if(!w.ownerRepo.includes(w.source.repository)) fail('SOURCE_OWNER_MISMATCH');
  // This profile has no independently reviewed public-service evidence. PRs,
  // CI, URLs, and prototype flags cannot be promoted by editing a descriptor.
  exact(w.publicSurface,['mode','target','deploymentEvidence','adoption']);
  if(w.state==='LIVE'||w.publicSurface.deploymentEvidence!==null||w.publicSurface.adoption!=='NOT_CLAIMED') fail('NO_REVIEWED_PUBLIC_AUTHORITY');
  if(!['LOCAL_ROUTE','SOURCE_ONLY'].includes(w.publicSurface.mode)) fail('INVALID_PUBLIC_SURFACE');
  if(w.publicSurface.mode==='LOCAL_ROUTE'){
   localTarget(w.publicSurface.target);
   if(!['LOCAL_ONLY','INSPECTABLE','PROPOSAL_ONLY'].includes(w.state))fail('LOCAL_SURFACE_STATE');
  }else if(w.publicSurface.target!==null||w.state==='LOCAL_ONLY') fail('SOURCE_IS_NOT_SERVICE');
  list(w.laws);if(!w.laws.length||w.laws.some(l=>!LAWS.includes(l))) fail('INVALID_WORLD_LAW');
  list(w.doors,12);
  for(const d of w.doors){
   exact(d,['doorId','label','kind','effectClass','target','owner','availability','reason','requiredNextAuthority']);
   id(d.doorId);if(doors.has(d.doorId)) fail('DUPLICATE_DOOR_ID');doors.add(d.doorId);
   for(const k of ['label','owner','reason','requiredNextAuthority'])text(d[k]);
   if(!['LOCAL','SOURCE','OWNER_SITE','CAPABILITY'].includes(d.kind)||!EFFECTS.includes(d.effectClass)||!['AVAILABLE','HOLD','NO','NOT_YET','UNKNOWN'].includes(d.availability)) fail('INVALID_DOOR');
   if(d.effectClass==='REMOTE_EFFECT'){
    if(d.availability!=='HOLD'||d.target!==null||d.kind!=='CAPABILITY') fail('REMOTE_EFFECT_CLOSED');
   }else if(d.availability==='AVAILABLE'){
    if(d.effectClass==='EXTERNAL_NAVIGATION'){
     externalTarget(d.target);
     if(d.kind==='SOURCE'){
      const sources=[w.source,...w.additionalSources];
      if(d.owner!=='GitHub source inspection'||!sources.some(s=>d.target===`https://github.com/${s.repository}/tree/${s.exactCommit}`)) fail('UNPINNED_SOURCE_DOOR');
     }else if(d.kind==='OWNER_SITE'){
      if(w.id!=='radio-world'||!['https://kinshipradio.org/main/','https://rockimpactmakersglobal.org/'].includes(d.target)||d.owner!==(d.target.includes('kinshipradio')?'Kinship Radio':'Rock Impact Makers')) fail('UNREVIEWED_OWNER_HANDOFF');
     }else fail('EXTERNAL_DOOR_KIND');
    }else{
     localTarget(d.target);
     if(d.kind!=='LOCAL'||w.publicSurface.mode!=='LOCAL_ROUTE'||!w.ownerRepo.includes('the-static-collective/webZ')||d.owner!=='webZ') fail('LOCAL_AUTHORITY_MISMATCH');
     const localEffects={LOCAL_NAVIGATION:['worlds/sanctuary/','worlds/orchard/'],LOCAL_PROPOSAL:['porch/','press/'],PROOF_INSPECTION:['proof/']};
     if(!localEffects[d.effectClass]?.includes(d.target)) fail('UNREVIEWED_LOCAL_EFFECT');
     if(d.effectClass==='LOCAL_PROPOSAL'&&d.target!=='press/'&&d.target!=='porch/') fail('PROPOSAL_ROUTE_REQUIRED');
     if(d.effectClass==='PROOF_INSPECTION'&&d.target!=='proof/') fail('PROOF_ROUTE_REQUIRED');
    }
   }else if(d.target!==null)fail('CLOSED_DOOR_HAS_TARGET');
  }
  if(w.state==='HOLD'&&!w.doors.some(d=>d.availability==='HOLD')) fail('HOLD_REASON_REQUIRED');
 }
 list(field.relations,32);const relations=new Set();
 for(const r of field.relations){
  exact(r,['from','to','kind','source','description']);text(r.description);source(r.source);
  if(!ids.has(r.from)||!ids.has(r.to)||r.from===r.to) fail('UNKNOWN_RELATION_TARGET');
  if(!RELATIONS.includes(r.kind)) fail('RELATION_IS_NOT_AUTHORITY');
  const key=r.from+'|'+r.kind+'|'+r.to;if(relations.has(key))fail('DUPLICATE_RELATION');relations.add(key);
 }
 return field;
}
export async function fieldReceipt(field,observations){
 validateField(field,observations);
 return {schema:'webz/public-field-receipt/v0',profile:field.profile,fieldHash:await hash(canonical(field)),observationsHash:await hash(canonical(observations)),worlds:field.worlds.length,doors:field.worlds.reduce((n,w)=>n+w.doors.length,0),authority:'NONE',scope:'Deterministic committed-source inspection only; no deployment, admission, execution, adoption or effect authorized.'};
}
