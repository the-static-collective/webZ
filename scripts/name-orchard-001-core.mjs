/* NAME ORCHARD 001: offline signed assertions, ambiguous names, separate custody.
 * A signature verifies an assertion's integrity and signing key, NOT ownership.
 * No network, wallet, chain, account, upload, audio playback or auto-transfer.
 */
import {createHash,generateKeyPairSync,createPublicKey,sign,verify} from 'node:crypto';

export const BUNDLE='webz/name-orchard-witness/v1';
export const CLAIM='webz/name-orchard-claim/v1';
export const ATTEST='webz/name-orchard-custody/v1';
export const OFFER='webz/name-orchard-offer/v1';
export const RECEIPT='webz/name-orchard-receipt/v1';
export const SONG_HASH='59fb74c9553a310182f7542ff6cb4928f6fa5d09acceaa0723f72ba984342605';
export const SONG_ID='G0cLbwecX7g0qFUB';
const allowSchemas=new Set([CLAIM,ATTEST,OFFER,RECEIPT]);
const digest=s=>createHash('sha256').update(s).digest('hex');
const guard=(value,code)=>{if(!value)throw Error(code)};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const fields=(o,names)=>plain(o)&&Object.keys(o).length===names.length&&names.every(k=>Object.hasOwn(o,k));
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const safeText=(s,n=200)=>typeof s==='string'&&s.length>0&&s.length<=n&&!/[\u0000-\u001f\u007f<>]/.test(s);
const identifier=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{1,78}$/.test(s);
const canonical=v=>{
 if(v===null||typeof v==='string'||typeof v==='boolean')return JSON.stringify(v);
 if(typeof v==='number'){guard(Number.isFinite(v),'NONFINITE');return JSON.stringify(v)}
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 guard(plain(v),'NONPLAIN');
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
};
export const hashOf=v=>digest(canonical(v));
export function newDemoIdentity(){
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');
 const pub=publicKey.export({format:'der',type:'spki'}).toString('base64url');
 return {id:'ed25519:'+digest(Buffer.from(pub,'base64url')),public_key:pub,privateKey};
}
const pubOf=(identity)=>({id:identity.id,public_key:identity.public_key});
function validSigner(a){
 guard(fields(a,['id','public_key'])&&typeof a.public_key==='string'&&a.public_key.length<200,'SIGNER_SHAPE');
 const bytes=Buffer.from(a.public_key,'base64url');
 guard(bytes.toString('base64url')===a.public_key&&bytes.length===44,'SIGNER_KEY_ENCODING');
 let pk;try{pk=createPublicKey({key:bytes,format:'der',type:'spki'})}catch{throw Error('SIGNER_KEY_INVALID')}
 guard(pk.asymmetricKeyType==='ed25519'&&a.id==='ed25519:'+digest(bytes),'SIGNER_KEY_MISMATCH');
 return pk;
}
export function signRecord(identity,schema,body){
 guard(allowSchemas.has(schema)&&plain(body),'SIGNED_SCHEMA');
 guard(identity&&identity.privateKey&&identity.public_key,'PRIVATE_SIGNER_REQUIRED');
 const item={schema,body,signer:pubOf(identity)};
 const signature=sign(null,Buffer.from(canonical(item)),identity.privateKey).toString('base64url');
 return {...item,signature};
}
export function verifyRecord(record,expectedSchema){
 guard(fields(record,['schema','body','signer','signature']),'SIGNED_SHAPE');
 guard(allowSchemas.has(record.schema)&&(!expectedSchema||record.schema===expectedSchema),'SIGNED_KIND');
 guard(plain(record.body)&&typeof record.signature==='string'&&record.signature.length<200,'SIGNED_CONTENT');
 const pk=validSigner(record.signer);
 const unsigned={schema:record.schema,body:record.body,signer:record.signer};
 guard(verify(null,Buffer.from(canonical(unsigned)),pk,Buffer.from(record.signature,'base64url')),'BAD_SIGNATURE');
 return true;
}
function validSubject(s){
 guard(fields(s,['source','source_id','title','source_url','content_sha256']),'SUBJECT_SHAPE');
 guard(['SUNO','FICTIONAL'].includes(s.source)&&safeText(s.title,180)&&hex(s.content_sha256),'SUBJECT_FIELD');
 if(s.source==='SUNO'){
  guard(s.source_id===SONG_ID&&s.source_url==='https://suno.com/s/'+SONG_ID,'SUBJECT_SUNO_SOURCE');
 }else{
  guard(s.source_id==='specimen002'&&s.source_url==='https://example.org/specimen002','SUBJECT_FICTIONAL_SOURCE');
 }
}
export function makeClaim(identity,name,subject){
 guard(identifier(name),'NAME_INVALID');validSubject(subject);
 return signRecord(identity,CLAIM,{name,subject,origin:'DEMO_OPERATOR_ASSERTION_NOT_PROVIDER_OR_RIGHTS'});
}
export function checkClaim(c){
 verifyRecord(c,CLAIM);
 guard(fields(c.body,['name','subject','origin'])&&identifier(c.body.name)&&
   c.body.origin==='DEMO_OPERATOR_ASSERTION_NOT_PROVIDER_OR_RIGHTS','CLAIM_BODY');
 validSubject(c.body.subject);
 return true;
}
export function resolveClaims(claims,name){
 guard(identifier(name)&&Array.isArray(claims)&&claims.length<=64,'LOOKUP_INVALID');
 const matching=new Map();
 for(const c of claims){checkClaim(c);if(c.body.name===name)matching.set(hashOf(c),c)}
 const candidates=[...matching].map(([claim_sha256,c])=>({
  claim_sha256,signer:c.signer.id,source:c.body.subject.source,
  title:c.body.subject.title,content_sha256:c.body.subject.content_sha256
 })).sort((a,b)=>a.claim_sha256.localeCompare(b.claim_sha256));
 return {name,state:candidates.length===0?'NOT_FOUND':candidates.length===1?'ONE_UNTRUSTED_CLAIM':'AMBIGUOUS',
  candidates,selection:'NONE',reason:'SIGNED_CLAIM_IS_NOT_NAMESPACE_AUTHORITY'};
}
export function checkLocalBytes(bytes,expectedHash){
 guard(hex(expectedHash),'EXPECTED_DIGEST');
 if(bytes===null||bytes===undefined)return 'ABSENT_UNVERIFIED';
 guard(Buffer.isBuffer(bytes)||bytes instanceof Uint8Array,'NOT_BYTES');
 return digest(bytes)===expectedHash?'VERIFIED_LOCAL_BYTES':'HASH_MISMATCH';
}
export function custody(identity,claim,status){
 checkClaim(claim);
 guard(['ABSENT_UNVERIFIED','VERIFIED_LOCAL_BYTES','HASH_MISMATCH'].includes(status),'CUSTODY_STATUS');
 return signRecord(identity,ATTEST,{
  claim_sha256:hashOf(claim),content_sha256:claim.body.subject.content_sha256,
  status,scope:'DEMO_LOCAL_OBSERVATION_NOT_GLOBAL_AVAILABILITY'
 });
}
export function makeOffer(identity,receiverId,claim){
 checkClaim(claim);
 guard(typeof receiverId==='string'&&/^ed25519:[a-f0-9]{64}$/.test(receiverId),'RECEIVER_ID');
 return signRecord(identity,OFFER,{
  claim_sha256:hashOf(claim),to:receiverId,
  carrier:'SIGNED_METADATA_ONLY',media_bytes_included:false,
  disposition:'PROPOSE_FOR_LOCAL_REVIEW'
 });
}
export function receiveOffer(receiver,claim,offer){
 checkClaim(claim);verifyRecord(offer,OFFER);
 guard(fields(offer.body,['claim_sha256','to','carrier','media_bytes_included','disposition']),'OFFER_FIELDS');
 guard(offer.body.claim_sha256===hashOf(claim)&&offer.body.to===receiver.id&&
  offer.body.carrier==='SIGNED_METADATA_ONLY'&&offer.body.media_bytes_included===false&&
  offer.body.disposition==='PROPOSE_FOR_LOCAL_REVIEW','OFFER_INVALID');
 return signRecord(receiver,RECEIPT,{
  offer_sha256:hashOf(offer),claim_sha256:hashOf(claim),state:'HELD_FOR_REVIEW',
  media_bytes_received:false,origin:'RECEIVER_LOCAL_NOT_RELATTE_PROTOCOL_RECEIPT'
 });
}
export function verifyWitness(bundle){
 guard(fields(bundle,['schema','song','claims','custody','crossing','resolution','limitations'])&&
  bundle.schema===BUNDLE,'BUNDLE_SHAPE');
 guard(Array.isArray(bundle.claims)&&bundle.claims.length===2&&
   Array.isArray(bundle.custody)&&bundle.custody.length===2,'BUNDLE_RECORD_COUNTS');
 const [first,other]=bundle.claims;
 checkClaim(first);checkClaim(other);
 guard(first.body.name==='let-it-find-us'&&first.body.subject.source==='SUNO'&&
   first.body.subject.content_sha256===SONG_HASH,'FIRST_CLAIM');
 guard(other.body.name==='let-it-find-us'&&other.body.subject.source==='FICTIONAL'&&
  other.body.subject.content_sha256!==SONG_HASH,'COLLISION_CLAIM');
 for(const item of bundle.custody){
  verifyRecord(item,ATTEST);
  guard(fields(item.body,['claim_sha256','content_sha256','status','scope'])&&
    item.body.claim_sha256===hashOf(first)&&item.body.content_sha256===SONG_HASH&&
    ['ABSENT_UNVERIFIED','VERIFIED_LOCAL_BYTES','HASH_MISMATCH'].includes(item.body.status)&&
    item.body.scope==='DEMO_LOCAL_OBSERVATION_NOT_GLOBAL_AVAILABILITY','CUSTODY_INVALID');
 }
 guard(bundle.custody[0].signer.id!==bundle.custody[1].signer.id&&
   bundle.custody[1].body.status==='ABSENT_UNVERIFIED','CUSTODY_INDEPENDENCE');
 const {offer,receipt}=bundle.crossing;
 verifyRecord(offer,OFFER);verifyRecord(receipt,RECEIPT);
 guard(offer.signer.id===bundle.custody[0].signer.id,'CROSSING_SENDER');
 guard(fields(offer.body,['claim_sha256','to','carrier','media_bytes_included','disposition'])&&
  offer.body.claim_sha256===hashOf(first)&&
  offer.body.to===bundle.custody[1].signer.id&&
  offer.body.carrier==='SIGNED_METADATA_ONLY'&&offer.body.media_bytes_included===false&&
  offer.body.disposition==='PROPOSE_FOR_LOCAL_REVIEW','CROSSING_OFFER');
 guard(receipt.signer.id===bundle.custody[1].signer.id&&
  fields(receipt.body,['offer_sha256','claim_sha256','state','media_bytes_received','origin'])&&
  receipt.body.offer_sha256===hashOf(offer)&&receipt.body.claim_sha256===hashOf(first)&&
  receipt.body.state==='HELD_FOR_REVIEW'&&receipt.body.media_bytes_received===false&&
  receipt.body.origin==='RECEIVER_LOCAL_NOT_RELATTE_PROTOCOL_RECEIPT','CROSSING_RECEIPT');
 const resolved=resolveClaims(bundle.claims,'let-it-find-us');
 guard(resolved.state==='AMBIGUOUS'&&canonical(resolved)===canonical(bundle.resolution),'RESOLUTION_INVALID');
 guard(fields(bundle.song,['title','source_url','content_sha256','submitted_bytes_included'])&&
  bundle.song.title==='Let It Find Us'&&bundle.song.source_url==='https://suno.com/s/'+SONG_ID&&
  bundle.song.content_sha256===SONG_HASH&&bundle.song.submitted_bytes_included===false,'SONG_METADATA');
 guard(Array.isArray(bundle.limitations)&&bundle.limitations.length===3&&
   bundle.limitations.every(x=>safeText(x,180)),'LIMITATIONS');
 return {verified_signatures:6,claim_name:resolved.name,resolution:resolved.state,
  custodian_a:bundle.custody[0].body.status,custodian_b:bundle.custody[1].body.status,
  receiver:receipt.body.state,media_transferred:false,
  statement:'Cryptographic consistency only; publisher identity, license, truth and remote absence remain unproven.'};
}
export function buildWitness(localBytes=null){
 const a=newDemoIdentity(),b=newDemoIdentity(),c=newDemoIdentity();
 const subject={source:'SUNO',source_id:SONG_ID,title:'Let It Find Us',
  source_url:'https://suno.com/s/'+SONG_ID,content_sha256:SONG_HASH};
 const conflict={source:'FICTIONAL',source_id:'specimen002',title:'A different fictional work',
  source_url:'https://example.org/specimen002',content_sha256:digest('fictional-collision-specimen')};
 const first=makeClaim(a,'let-it-find-us',subject);
 const other=makeClaim(c,'let-it-find-us',conflict);
 const offer=makeOffer(a,b.id,first);
 const bundle={
  schema:BUNDLE,
  song:{title:subject.title,source_url:subject.source_url,content_sha256:SONG_HASH,submitted_bytes_included:false},
  claims:[first,other],
  custody:[custody(a,first,checkLocalBytes(localBytes,SONG_HASH)),
    custody(b,first,'ABSENT_UNVERIFIED')],
  crossing:{offer,receipt:receiveOffer(b,first,offer)},
  resolution:resolveClaims([first,other],'let-it-find-us'),
  limitations:[
   'Generated demo keys do not establish human or provider identity.',
   'No license, ownership or permission follows from these signatures.',
   'Absence is a local observation; a signature is not proof of global nonexistence.'
  ]
 };
 verifyWitness(bundle);
 return bundle;
}
