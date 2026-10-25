// RELAY-007: two explicitly separate handoffs: a question-only URL or an
// unsigned, visitor-chosen, compact AI proposal capsule in the URL fragment.
// Checksums detect editing in transit, not authorship, model identity or consent.
import {sha256,verifyInvestigation,matchesInvestigationSources} from './evidence.mjs';
import {shareableQuestion} from './cafe.mjs';

const SCHEMA='ask-jarvis/relay-v1';
const DIGEST=/^sha256:[0-9a-f]{64}$/;
const DOCUMENT=/^https:\/\/github\.com\/the-static-collective\/[a-zA-Z0-9-]+\/blob\/[0-9a-f]{40}\/[a-zA-Z0-9._/-]+$/;
const checkString=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max&&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
const textOnly=x=>typeof x==='string'&&x.length>0;
const sameKeys=(value,expected)=>Object.keys(value).sort().join('|')===expected.slice().sort().join('|');

function validPayload(p) {
  if(!p||typeof p!=='object'||Array.isArray(p)||
    !sameKeys(p,['schema','stage','question','kind','summary','firstTest','unknowns','connections','sourceReferences','modelReceiptHash','observedAt']))return false;
  if(p.schema!==SCHEMA||p.stage!=='MODEL_PROPOSAL'||!shareableQuestion(p.question)||
    !['auto','question','invitation','door','song','plan'].includes(p.kind)||
    !checkString(p.summary,8,650)||!checkString(p.firstTest,8,550)||
    !Array.isArray(p.unknowns)||p.unknowns.length<1||p.unknowns.length>3||
    p.unknowns.some(u=>!checkString(u,8,260))||
    !Array.isArray(p.connections)||p.connections.length<1||p.connections.length>3||
    p.connections.some(c=>!checkString(c,8,450))||
    !Array.isArray(p.sourceReferences)||p.sourceReferences.length<1||p.sourceReferences.length>3||
    !DIGEST.test(p.modelReceiptHash)||
    !textOnly(p.observedAt)||!Number.isFinite(Date.parse(p.observedAt)))return false;
  const ids=new Set();
  for(const source of p.sourceReferences) {
    if(!source||typeof source!=='object'||Array.isArray(source)||
      !sameKeys(source,['id','name','document','sha256','commit']))return false;
    if(!/^[a-z0-9-]{2,40}$/.test(source.id)||ids.has(source.id)||
      !checkString(source.name,2,80)||!DOCUMENT.test(source.document)||
      !DIGEST.test(source.sha256)||!/^[0-9a-f]{40}$/.test(source.commit)||
      !source.document.includes('/blob/'+source.commit+'/'))return false;
    ids.add(source.id);
  }
  return true;
}
function bytesToB64url(bytes) {
  let binary='';
  for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64urlToBytes(text) {
  const base=text.replace(/-/g,'+').replace(/_/g,'/');
  const binary=atob(base+'='.repeat((4-base.length%4)%4));
  return Uint8Array.from(binary,ch=>ch.charCodeAt(0));
}

export async function buildRelayCapsule(base,proposal) {
  if(!await verifyInvestigation(proposal)||!matchesInvestigationSources(base,proposal))
    throw Error('INVESTIGATION_NOT_OBSERVED');
  const investigation=proposal.investigation;
  const payload={
    schema:SCHEMA,stage:'MODEL_PROPOSAL',question:proposal.question,kind:base.return.kind,
    summary:investigation.summary,firstTest:investigation.firstTest,
    unknowns:investigation.unknowns.slice(0,3),
    connections:investigation.connections.map(c=>c.idea),
    sourceReferences:proposal.sourceReferences.map(s=>({
      id:s.id,name:s.name,document:s.document,sha256:s.sha256,commit:s.commit
    })),
    modelReceiptHash:proposal.receiptHash,observedAt:proposal.observedAt
  };
  if(!validPayload(payload))throw Error('UNSHAREABLE_PROPOSAL');
  return {payload,checksum:await sha256(JSON.stringify(payload))};
}

export function makeRelayLink(currentUrl,capsule) {
  if(!validPayload(capsule?.payload)||!DIGEST.test(capsule.checksum))
    throw Error('INVALID_RELAY_CAPSULE');
  const url=new URL(currentUrl);
  if(url.protocol!=='https:'&&url.hostname!=='localhost')throw Error('HTTPS_REQUIRED');
  const bytes=new TextEncoder().encode(JSON.stringify(capsule));
  if(bytes.length>7200)throw Error('RELAY_LINK_TOO_LARGE');
  url.pathname='/relay/';url.search='';url.hash='r='+bytesToB64url(bytes);
  if(url.hash.length>10500)throw Error('RELAY_LINK_TOO_LARGE');
  return url.toString();
}

export async function readRelay(hash) {
  if(typeof hash!=='string'||hash.length>10500||!hash.startsWith('#r='))return null;
  const encoded=hash.slice(3);
  if(!/^[A-Za-z0-9_-]{100,10497}$/.test(encoded))return null;
  try {
    const bytes=b64urlToBytes(encoded);
    if(bytes.length>7200)return null;
    const capsule=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!capsule||typeof capsule!=='object'||Array.isArray(capsule)||
      !sameKeys(capsule,['payload','checksum'])||
      !DIGEST.test(capsule.checksum)||!validPayload(capsule.payload))return null;
    return await sha256(JSON.stringify(capsule.payload))===capsule.checksum?capsule:null;
  } catch {return null;}
}
