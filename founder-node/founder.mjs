/* webZ FOUNDER NODE 003 — dual key self-governed experimental world charter.
 * Ed25519 signatures prove key possession and continuity ONLY.
 * No authority over unrelated WebZ worlds, media, source rights or persons.
 */
import {createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify} from 'node:crypto';
import {importAnnex,projectAnnex} from '../worlds/wandering-lens/annex.mjs';

export const LAB='webz/founder-node/003';
export const SIGNED='webz/founder-signed/v0';
export const BUNDLE='webz/founder-charter-bundle/v0';
export const DOMAIN='WEBZ/FOUNDER-NODE/003\n';
export const ACK='I_ACCEPT_EXPERIMENTAL_NAMESPACE_ONLY';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function exact(o,keys){
 if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||
    keys.some(k=>!own(o,k)))throw Error('FIELD_CONTRACT');
}
const requireThat=(v,code)=>{if(!v)throw Error(code)};
const hex=v=>typeof v==='string'&&/^sha256:[a-f0-9]{64}$/.test(v);
const label=(v,max=420)=>typeof v==='string'&&v.length>0&&v.length<=max&&
 v.trim()===v&&!/[<>\u0000-\u001f\u007f]/.test(v);
export function canonical(v){
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
export const sha=v=>'sha256:'+createHash('sha256').update(canonical(v),'utf8').digest('hex');
export function newIdentity(){
 const {privateKey,publicKey}=generateKeyPairSync('ed25519');
 return {
  privatePem:privateKey.export({format:'pem',type:'pkcs8'}).toString(),
  public:{schema:'webz/founder-identity/v0',algorithm:'Ed25519',
   spki:publicKey.export({format:'der',type:'spki'}).toString('base64')}
 };
}
export function publicOf(keyPem){
 const key=createPrivateKey(keyPem);
 requireThat(key.asymmetricKeyType==='ed25519','KEY_ALGORITHM');
 return {schema:'webz/founder-identity/v0',algorithm:'Ed25519',
  spki:createPublicKey(key).export({format:'der',type:'spki'}).toString('base64')};
}
export function checkPub(p){
 exact(p,['schema','algorithm','spki']);
 requireThat(p.schema==='webz/founder-identity/v0'&&p.algorithm==='Ed25519'&&
   typeof p.spki==='string'&&p.spki.length<=130&&/^[A-Za-z0-9+/]+={0,2}$/.test(p.spki),'PUBLIC_KEY_FORMAT');
 const b=Buffer.from(p.spki,'base64');
 requireThat(b.toString('base64')===p.spki,'PUBLIC_KEY_BASE64');
 const key=createPublicKey({key:b,format:'der',type:'spki'});
 requireThat(key.asymmetricKeyType==='ed25519','PUBLIC_KEY_ALGORITHM');
 requireThat(key.export({format:'der',type:'spki'}).equals(b),'PUBLIC_KEY_DER');
 return p;
}
const identityEq=(a,b)=>canonical(a)===canonical(b);
export function signPaper(role,body,privatePem){
 requireThat(['CANDIDATE_PETITION','FOUNDER_ADMISSION','OWNER_ACCEPTANCE','OWNER_WITHDRAWAL'].includes(role),'ROLE_INVALID');
 const pub=publicOf(privatePem),header={schema:SIGNED,role,body,pub};
 const signature=sign(null,Buffer.from(DOMAIN+canonical(header),'utf8'),createPrivateKey(privatePem)).toString('base64');
 return {...header,signature};
}
export function verifyPaper(item,role,pin){
 exact(item,['schema','role','body','pub','signature']);
 requireThat(item.schema===SIGNED&&item.role===role,'PAPER_TYPE');
 checkPub(item.pub);checkPub(pin);
 requireThat(identityEq(item.pub,pin),'PIN_MISMATCH');
 requireThat(typeof item.signature==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(item.signature)&&
   item.signature.length<160,'SIGNATURE_FORMAT');
 const sig=Buffer.from(item.signature,'base64');
 requireThat(sig.length===64&&sig.toString('base64')===item.signature,'SIGNATURE_SIZE');
 const {signature,...header}=item;
 requireThat(verify(null,Buffer.from(DOMAIN+canonical(header),'utf8'),
  createPublicKey({key:Buffer.from(pin.spki,'base64'),format:'der',type:'spki'}),sig),'BAD_SIGNATURE');
 return item.body;
}
function validatePetition(b){
 exact(b,['schema','scope','proposal_id','source','world','candidate']);
 requireThat(b.schema==='webz/founder-petition/v0'&&b.scope==='EXPERIMENTAL_NAMESPACE_ONLY','PETITION_SCOPE');
 exact(b.source,['annex_export_ref','reflection_ref','source_address']);
 requireThat(hex(b.source.annex_export_ref)&&hex(b.source.reflection_ref)&&typeof b.source.source_address==='string'&&
  /^MWF1\/(?:t(?:0[1-9]|1[01])g(?:0[1-9]|1[01])\/){0,96}t(?:0[1-9]|1[01])g(?:0[1-9]|1[01])$/.test(b.source.source_address),'SOURCE_REFERENCE');
 requireThat(/^wl2-\d{3}$/.test(b.proposal_id),'PROPOSAL_ID');
 exact(b.world,['title','description','parent_address','child_address','type']);
 requireThat(label(b.world.title,64)&&label(b.world.description,420)&&
  b.world.type==='INDEPENDENT_EXPERIMENTAL_WORLD'&&
  b.world.parent_address===b.source.source_address&&
  typeof b.world.child_address==='string','WORLD_DESCRIPTION');
 // Child location is strictly an appended centered dial.
 requireThat(b.world.child_address===b.world.parent_address+'/t06g06','CHILD_ADDRESS_INVALID');
 checkPub(b.candidate);
 return b;
}
export async function candidatePetition(annexExport,proposalId,candidatePem){
 const inspected=await importAnnex(annexExport);
 const view=await projectAnnex(inspected.annex,inspected.journal);
 const p=view.proposals.find(x=>x.id===proposalId);
 requireThat(!!p&&p.state==='ADMIT'&&p.kind==='WORLD_SKETCH','NOT_LOCAL_ADMITTED_SKETCH');
 const pub=publicOf(candidatePem);
 const record=inspected.annex.proposals.find(x=>x.id===proposalId);
 const body={schema:'webz/founder-petition/v0',scope:'EXPERIMENTAL_NAMESPACE_ONLY',
  proposal_id:proposalId,source:{
   annex_export_ref:sha(annexExport),reflection_ref:record.source_digest,
   source_address:p.source_address},
  world:{title:p.title,description:p.detail,
   parent_address:p.source_address,child_address:p.local_placement.child_address,
   type:'INDEPENDENT_EXPERIMENTAL_WORLD'},
  candidate:pub};
 validatePetition(body);
 return signPaper('CANDIDATE_PETITION',body,candidatePem);
}
export function worldId(petition){
 const b=validatePetition(petition);
 return 'webz:founder-lab/'+sha(b).slice(7,39);
}
function requireCandidate(petition,candidatePin){
 const b=verifyPaper(petition,'CANDIDATE_PETITION',candidatePin);
 validatePetition(b);
 requireThat(identityEq(b.candidate,candidatePin),'CANDIDATE_KEY_MISMATCH');
 return b;
}
export function founderAdmission(petition,candidatePin,founderPem,ack){
 const p=requireCandidate(petition,candidatePin),founder=publicOf(founderPem);
 requireThat(ack===ACK,'EXPLICIT_FOUNDER_CHOICE_REQUIRED');
 requireThat(!identityEq(founder,candidatePin),'TWO_DISTINCT_KEYS_REQUIRED');
 const body={schema:'webz/founder-admission/v0',scope:'EXPERIMENTAL_NAMESPACE_ONLY',
  petition_ref:sha(petition),world_id:worldId(p),
  candidate:candidatePin,founder,decision:'ADMIT_EXPERIMENTAL_NAMESPACE',
  rights:'NO_MEDIA_NO_CROSSING_NO_DEPLOYMENT',
  delegated_by_founder:false};
 return signPaper('FOUNDER_ADMISSION',body,founderPem);
}
function admissionProof(petition,admission,candidatePin,founderPin){
 const p=requireCandidate(petition,candidatePin);
 requireThat(!identityEq(candidatePin,founderPin),'TWO_DISTINCT_KEYS_REQUIRED');
 const a=verifyPaper(admission,'FOUNDER_ADMISSION',founderPin);
 exact(a,['schema','scope','petition_ref','world_id','candidate','founder','decision','rights','delegated_by_founder']);
 requireThat(a.schema==='webz/founder-admission/v0'&&a.scope==='EXPERIMENTAL_NAMESPACE_ONLY'&&
  a.petition_ref===sha(petition)&&a.world_id===worldId(p)&&
  identityEq(a.candidate,candidatePin)&&identityEq(a.founder,founderPin)&&
  a.decision==='ADMIT_EXPERIMENTAL_NAMESPACE'&&a.rights==='NO_MEDIA_NO_CROSSING_NO_DEPLOYMENT'&&
  a.delegated_by_founder===false,'ADMISSION_CONTRACT');
 return {p,a};
}
export function ownerAcceptance(petition,admission,candidatePem,founderPin){
 const candidatePin=publicOf(candidatePem);
 const {a}=admissionProof(petition,admission,candidatePin,founderPin);
 const body={schema:'webz/owner-acceptance/v0',scope:'EXPERIMENTAL_NAMESPACE_ONLY',
  petition_ref:a.petition_ref,admission_ref:sha(admission),
  world_id:a.world_id,owner:candidatePin,decision:'ACCEPT_LOCAL_CUSTODY',
  source_rights:'NOT_VERIFIED',external_adoption:'NONE'};
 return signPaper('OWNER_ACCEPTANCE',body,candidatePem);
}
function acceptedProof(bundle,candidatePin,founderPin){
 exact(bundle,['schema','petition','admission','acceptance']);
 requireThat(bundle.schema===BUNDLE,'BUNDLE_SCHEMA');
 const {p,a}=admissionProof(bundle.petition,bundle.admission,candidatePin,founderPin);
 const x=verifyPaper(bundle.acceptance,'OWNER_ACCEPTANCE',candidatePin);
 exact(x,['schema','scope','petition_ref','admission_ref','world_id','owner','decision','source_rights','external_adoption']);
 requireThat(x.schema==='webz/owner-acceptance/v0'&&x.scope==='EXPERIMENTAL_NAMESPACE_ONLY'&&
  x.petition_ref===sha(bundle.petition)&&x.admission_ref===sha(bundle.admission)&&
  x.world_id===a.world_id&&identityEq(x.owner,candidatePin)&&
  x.decision==='ACCEPT_LOCAL_CUSTODY'&&x.source_rights==='NOT_VERIFIED'&&
  x.external_adoption==='NONE','OWNER_ACCEPTANCE_CONTRACT');
 return {p,a,x};
}
export function ownerWithdrawal(bundle,candidatePem,founderPin){
 const owner=publicOf(candidatePem);const {a}=acceptedProof(bundle,owner,founderPin);
 return signPaper('OWNER_WITHDRAWAL',{
  schema:'webz/owner-withdrawal/v0',scope:'EXPERIMENTAL_NAMESPACE_ONLY',
  petition_ref:sha(bundle.petition),admission_ref:sha(bundle.admission),
  acceptance_ref:sha(bundle.acceptance),world_id:a.world_id,
  owner,decision:'WITHDRAW_EXPERIMENTAL_NAMESPACE'
 },candidatePem);
}
export function verifyCharter(bundle,{candidatePin,founderPin,withdrawal=null}){
 checkPub(candidatePin);checkPub(founderPin);
 const {p,a}=acceptedProof(bundle,candidatePin,founderPin);
 let state='ACTIVE_LOCAL_EXPERIMENTAL';
 if(withdrawal!==null){
  const w=verifyPaper(withdrawal,'OWNER_WITHDRAWAL',candidatePin);
  exact(w,['schema','scope','petition_ref','admission_ref','acceptance_ref','world_id','owner','decision']);
  requireThat(w.schema==='webz/owner-withdrawal/v0'&&w.scope==='EXPERIMENTAL_NAMESPACE_ONLY'&&
   w.petition_ref===sha(bundle.petition)&&w.admission_ref===sha(bundle.admission)&&
   w.acceptance_ref===sha(bundle.acceptance)&&w.world_id===a.world_id&&
   identityEq(w.owner,candidatePin)&&w.decision==='WITHDRAW_EXPERIMENTAL_NAMESPACE','WITHDRAWAL_INVALID');
  state='OWNER_WITHDRAWN_LOCAL';
 }
 return {schema:'webz/founder-verified-projection/v0',status:state,
  world:{schema:'webz/experimental-independent-world/v0',
   id:a.world_id,title:p.world.title,description:p.world.description,
   parent_address:p.world.parent_address,child_address:p.world.child_address,
   namespace_holder:candidatePin,founder_receipt_key:founderPin,
   source_private_payload_included:false,entry_url:null,deployable:false,
   publication_rights:'NOT_VERIFIED',registered_in_webz_sovereign_worlds:false},
  verification:'TWO_DISTINCT_ED25519_KEY_POSSESSIONS',
  admission_ref:sha(bundle.admission),acceptance_ref:sha(bundle.acceptance),
  media_plays:0,radio_transmissions:0,compute_jobs:0,crossings:0,
  identity_or_legal_ownership_verified:false,
  public_chain_only:true};
}
export function makeBundle(petition,admission,acceptance){
 return {schema:BUNDLE,petition,admission,acceptance};
}
