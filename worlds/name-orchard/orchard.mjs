/* Inspect only operator-selected signed witness JSON. No network or browser storage.
 * Signature validation confirms integrity of ephemeral demo keys only.
 */
const $=id=>document.getElementById(id);
const SONG_HASH='59fb74c9553a310182f7542ff6cb4928f6fa5d09acceaa0723f72ba984342605';
const encoder=new TextEncoder();
const requireThat=(ok,why)=>{if(!ok)throw Error(why)};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function canonical(v){
 if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 requireThat(plain(v),'NOT_OBJECT');
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
function decode64url(s){
 requireThat(typeof s==='string'&&/^[a-zA-Z0-9_-]+$/.test(s)&&s.length<200,'BASE64_INVALID');
 const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function sha(bytes){
 const b=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const hashRecord=async item=>sha(encoder.encode(canonical(item)));
async function verifySigned(record,schema){
 requireThat(plain(record)&&record.schema===schema&&plain(record.signer)&&plain(record.body),'RECORD_SCHEMA');
 const pub=decode64url(record.signer.public_key),sig=decode64url(record.signature);
 requireThat(pub.byteLength===44&&sig.byteLength===64,'ED25519_LENGTH');
 requireThat(record.signer.id==='ed25519:'+await sha(pub),'SIGNER_ID_MISMATCH');
 const key=await crypto.subtle.importKey('spki',pub,{name:'Ed25519'},false,['verify']);
 const material={schema:record.schema,body:record.body,signer:record.signer};
 requireThat(await crypto.subtle.verify('Ed25519',key,sig,encoder.encode(canonical(material))),'SIGNATURE_INVALID');
 return true;
}
async function examine(w){
 requireThat(plain(w)&&w.schema==='webz/name-orchard-witness/v1','WITNESS_SCHEMA');
 requireThat(Array.isArray(w.claims)&&w.claims.length===2&&Array.isArray(w.custody)&&w.custody.length===2,'WITNESS_SIZE');
 const [a,b]=w.claims;
 await verifySigned(a,'webz/name-orchard-claim/v1');await verifySigned(b,'webz/name-orchard-claim/v1');
 requireThat(a.body?.name==='let-it-find-us'&&b.body?.name===a.body.name,'NAME_MISMATCH');
 requireThat(a.body?.subject?.content_sha256===SONG_HASH&&
   a.body?.subject?.source_url==='https://suno.com/s/G0cLbwecX7g0qFUB'&&
   b.body?.subject?.source==='FICTIONAL'&&b.body.subject.content_sha256!==SONG_HASH,'SUBJECT_MISMATCH');
 const firstHash=await hashRecord(a);
 const computedClaims=[];
 for(const c of [a,b])computedClaims.push(await hashRecord(c));
 requireThat(w.resolution?.state==='AMBIGUOUS'&&w.resolution?.selection==='NONE'&&
  w.resolution?.candidates?.length===2&&
  computedClaims.every(h=>w.resolution.candidates.some(x=>x.claim_sha256===h)),'RESOLUTION_MISMATCH');
 for(const c of w.custody){
  await verifySigned(c,'webz/name-orchard-custody/v1');
  requireThat(c.body?.claim_sha256===firstHash&&c.body?.content_sha256===SONG_HASH&&
   ['ABSENT_UNVERIFIED','VERIFIED_LOCAL_BYTES','HASH_MISMATCH'].includes(c.body.status),'CUSTODY_MISMATCH');
 }
 requireThat(w.custody[0].signer.id!==w.custody[1].signer.id&&
  w.custody[1].body.status==='ABSENT_UNVERIFIED','INDEPENDENCE_MISMATCH');
 const offer=w.crossing?.offer,receipt=w.crossing?.receipt;
 await verifySigned(offer,'webz/name-orchard-offer/v1');
 await verifySigned(receipt,'webz/name-orchard-receipt/v1');
 requireThat(offer.signer.id===w.custody[0].signer.id&&
  offer.body?.claim_sha256===firstHash&&offer.body?.to===w.custody[1].signer.id&&
  offer.body?.carrier==='SIGNED_METADATA_ONLY'&&offer.body?.media_bytes_included===false&&
  offer.body?.disposition==='PROPOSE_FOR_LOCAL_REVIEW','OFFER_MISMATCH');
 requireThat(receipt.signer.id===w.custody[1].signer.id&&
  receipt.body?.offer_sha256===await hashRecord(offer)&&
  receipt.body?.claim_sha256===firstHash&&receipt.body?.state==='HELD_FOR_REVIEW'&&
  receipt.body?.media_bytes_received===false,'RECEIPT_MISMATCH');
 return w;
}
const el=(tag,className,words)=>{
 const node=document.createElement(tag);if(className)node.className=className;
 if(words!==undefined)node.textContent=words;return node;
};
function paint(w){
 const container=$('claims');container.replaceChildren();
 container.append(el('div','collision','AMBIGUOUS — 2 independently signed claims; no selected owner'));
 for(const claim of w.claims){
  const article=el('article','claim');
  article.append(el('strong',null,claim.body.subject.title));
  article.append(el('div',null,'Source: '+claim.body.subject.source+' / claim only, not proven authorship'));
  article.append(el('code',null,claim.signer.id));
  container.append(article);
 }
 const [a,b]=w.custody.map(x=>x.body.status);
 $('a-title').textContent=a==='VERIFIED_LOCAL_BYTES'?'Has verified local bytes':a==='HASH_MISMATCH'?'Hash mismatch':'File not supplied';
 $('a-state').textContent='Signed local observation: '+a+'. This does not authorize distribution.';
 $('x-title').textContent='Metadata received to HOLD';
 $('x-state').textContent='Signed offer + signed HELD_FOR_REVIEW receipt. No media bytes carried.';
 $('b-title').textContent='No local file witnessed';
 $('b-state').textContent='Signed local observation: '+b+'. This cannot establish global absence.';
 $('status').textContent='Cryptographically checked 6 signatures, claim hashes and metadata handoff. No identity, ownership or license verified.';
}
$('bundle').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';
 if(!file)return;
 $('status').textContent='Inspecting selected local witness…';
 try{
  requireThat(file.size>0&&file.size<=262144,'BUNDLE_TOO_LARGE');
  const witness=await examine(JSON.parse(await file.text()));
  paint(witness);
 }catch(err){
  $('claims').replaceChildren(el('div','empty','Witness rejected. No claim has been admitted.'));
  for(const id of ['a-title','b-title','x-title'])$(id).textContent='Unverified';
  for(const id of ['a-state','b-state','x-state'])$(id).textContent='Evidence unavailable or invalid.';
  $('status').textContent='HOLD: '+(err?.message||'INVALID_WITNESS')+'. No validity or ownership asserted.';
 }
});
