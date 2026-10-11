// Receipt Glass 002 × GOATnote: explicit, source-bound, local file handoff.
// The signed source is carried unchanged; this adapter never grants authority.
import {canonical} from '../arrivals/verify.mjs';
const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
const hash=async text=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)));
const row=(id,label,posture)=>({id,label,posture});
const edge=(from,to,relation,posture)=>({from,to,relation,posture});
const str=x=>typeof x==='string'?x:null;
export function projectAncestry(raw, report){
 const source=typeof raw==='string'?JSON.parse(raw):raw;
 if(!source||!report||report.schema!=='webz/receipt-glass-001/v0')throw Error('NOT_INSPECTED');
 const f=report.fields,nodes=[],edges=[];
 if(report.type==='GrO signed local journal'&&report.mode==='LOCAL_JOURNAL_VERIFIED'){
  nodes.push(row(f.crossing_id,'Signed crossing','VERIFIED_OBJECT'),
    row(f.receive_receipt_id,'Receiver RECEIVED','VERIFIED_OBJECT'),
    row(f.hold_receipt_id,'Receiver HOLD','VERIFIED_OBJECT'));
  edges.push(edge(f.crossing_id,f.receive_receipt_id,'received-as','VERIFIED_JOURNAL_LINK'),
    edge(f.receive_receipt_id,f.hold_receipt_id,'held-after','VERIFIED_JOURNAL_LINK'));
 }else if(report.type==='reLATTE signed crossing'&&report.mode==='SIGNATURE_ONLY'){
  nodes.push(row(f.crossing_id,'Signed crossing','VERIFIED_OBJECT'));
  const parents=source.parents;
  if(!Array.isArray(parents)||parents.length>24)throw Error('ANCESTRY_PARENT_LIMIT');
  for(let i=0;i<parents.length;i++){
   const value=parents[i],id=typeof value==='string'?value:typeof value?.address==='string'?value.address:null;
   if(!id||id.length>256)throw Error('UNSUPPORTED_PARENT_REFERENCE');
   if(!nodes.some(n=>n.id===id))nodes.push(row(id,'Unretrieved parent','REFERENCE_ONLY'));
   edges.push(edge(id,f.crossing_id,'parent-reference','SIGNED_REFERENCE_ONLY'));
  }
 }else if(report.type==='reLATTE signed receipt'&&report.mode==='SIGNATURE_ONLY'){
  nodes.push(row(f.crossing_id,'Unretrieved crossing','REFERENCE_ONLY'),row(f.receipt_id,'Signed receipt','VERIFIED_OBJECT'));
  edges.push(edge(f.crossing_id,f.receipt_id,'receipt-claims-crossing','SIGNED_REFERENCE_ONLY'));
 }else if(report.type==='CANNON archived run report'&&report.mode==='UNVERIFIED_ARCHIVE'){
  nodes.push(row(f.crossing_id,'Archived crossing ID','ARCHIVE_CLAIM'),
    row(f.receive_receipt_id,'Archived RECEIVE ID','ARCHIVE_CLAIM'),
    row(f.hold_receipt_id,'Archived HOLD ID','ARCHIVE_CLAIM'));
  edges.push(edge(f.crossing_id,f.receive_receipt_id,'reported-receive','ARCHIVE_CLAIM'),
    edge(f.receive_receipt_id,f.hold_receipt_id,'reported-hold','ARCHIVE_CLAIM'));
 }else throw Error('UNSUPPORTED_ANCESTRY_PROFILE');
 if(nodes.length>32||edges.length>32)throw Error('ANCESTRY_LIMIT');
 return {schema:'webz/receipt-ancestry/v0',reconstruction:'BOUND_ONLY_TO_SUPPLIED_EVIDENCE',nodes,edges,
  missing:'Unretrieved ancestors, absent material and foreign histories remain UNRESOLVED',
  historical_crossing_authorized:false};
}
export async function makeGoatnoteHandoff(raw,report,createdAt=new Date().toISOString()){
 if(typeof raw!=='string'||encoder.encode(raw).length>131072)throw Error('HANDOFF_SOURCE_LIMIT');
 const value=JSON.parse(raw);
 if(!value||value.schema!=='gro.abundent-signed-receiver/v0'&&
  value.schema!=='relatte.crossing-envelope/v0'&&value.schema!=='relatte.receipt/v0'&&
  value.schema!=='cannon.branch-work-receipt/v0')throw Error('HANDOFF_PROFILE');
 if(!report||!['SIGNATURE_ONLY','LOCAL_JOURNAL_VERIFIED','UNVERIFIED_ARCHIVE'].includes(report.mode))throw Error('MISSING_INSPECTION');
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(createdAt))throw Error('HANDOFF_TIME');
 const ancestry=projectAncestry(value,report);
 const source={schema:value.schema,bytes:encoder.encode(raw).length,sha256:'sha256:'+await hash(raw),json:raw};
 const inspection={type:report.type,mode:report.mode,cryptographic_verification:report.cryptographic_verification,
  fields:report.fields,steps:report.steps};
 const unsigned={schema:'webz.goatnote-receipt-handoff/v0',origin:'WEBZ_USER_EXPLICIT_EXPORT',
  authority:'NO_AUTHORITY_TRANSFER',created_at:createdAt,source,inspection,ancestry};
 return {...unsigned,checksum:'sha256:'+await hash('WEBZ-GOATNOTE-RECEIPT-001|'+canonical(unsigned))};
}
