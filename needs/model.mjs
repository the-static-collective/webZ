// NEEDS-001 is a device-local rehearsal, not shared Jubilee authority.
export const SCHEMA='webz/needs-local/v0';
const idOK=x=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9:_-]{5,95}$/.test(x);
const str=(x,n)=>typeof x==='string'&&x.trim().length>0&&x.length<=n&&!/[\u0000-\u001f\u007f]/.test(x);
const privateText=x=>/(?:-----BEGIN|Bearer\s+\S+|(?:password|api[_-]?key|access[_-]?token|secret)\s*[:=])/i.test(x);
function safe(x,n){if(!str(x,n)||privateText(x))throw Error('PUBLIC_TEXT_REQUIRED_NO_SECRETS');return x.trim();}
const clone=x=>JSON.parse(JSON.stringify(x));
export const empty=()=>({schema:SCHEMA,needs:[]});
export function validate(j){
 if(!j||j.schema!==SCHEMA||!Array.isArray(j.needs)||Object.keys(j).sort().join(',')!=='needs,schema'||j.needs.length>80)throw Error('INVALID_JOURNAL');
 const ids=new Set();
 for(const n of j.needs){
  if(!n||Object.keys(n).sort().join(',')!=='acceptedOfferId,confirmed,createdAt,effort,id,offers,origin,report,requirement,title'||!idOK(n.id)||ids.has(n.id)||!str(n.title,100)||!str(n.requirement,600)||privateText(n.title)||privateText(n.requirement)||!['small','medium','large'].includes(n.effort)||!['local','demo'].includes(n.origin)||!Number.isFinite(Date.parse(n.createdAt))||!Array.isArray(n.offers)||n.offers.length>12||typeof n.confirmed!=='boolean')throw Error('INVALID_NEED');
  ids.add(n.id);const seen=new Set();
  for(const o of n.offers){if(!o||Object.keys(o).sort().join(',')!=='id,text'||!idOK(o.id)||seen.has(o.id)||!str(o.text,320)||privateText(o.text))throw Error('INVALID_OFFER');seen.add(o.id);}
  if(n.acceptedOfferId!==null&&!seen.has(n.acceptedOfferId))throw Error('INVALID_SELECTION');
  if(n.report!==null&&(!str(n.report,600)||privateText(n.report)||n.acceptedOfferId===null))throw Error('INVALID_REPORT');
  if(n.confirmed&&(n.report===null||n.origin==='demo'))throw Error('INVALID_CONFIRMATION');
 }
 return j;
}
export function open(j,p){
 validate(j);if(p.consent!==true)throw Error('REVIEW_REQUIRED');
 if(!idOK(p.id)||!['small','medium','large'].includes(p.effort)||!Number.isFinite(Date.parse(p.createdAt))||j.needs.length>=80||j.needs.some(n=>n.id===p.id))throw Error('INVALID_OR_DUPLICATE_NEED');
 const n={id:p.id,title:safe(p.title,100),requirement:safe(p.requirement,600),effort:p.effort,createdAt:p.createdAt,origin:'local',offers:[],acceptedOfferId:null,report:null,confirmed:false};
 return validate({...j,needs:[...j.needs,n]});
}
function find(j,id){validate(j);const copy=clone(j),n=copy.needs.find(x=>x.id===id);if(!n)throw Error('UNKNOWN_NEED');return [copy,n];}
export function pledge(j,id,offerId,text){
 const [copy,n]=find(j,id);if(n.confirmed||n.acceptedOfferId!==null||n.offers.length>=12||!idOK(offerId)||n.offers.some(o=>o.id===offerId))throw Error('OFFER_NOT_AVAILABLE');
 n.offers.push({id:offerId,text:safe(text,320)});return validate(copy);
}
export function accept(j,id,offerId){
 const [copy,n]=find(j,id);if(n.acceptedOfferId!==null||!n.offers.some(o=>o.id===offerId))throw Error('ACCEPT_NOT_AVAILABLE');
 n.acceptedOfferId=offerId;return validate(copy);
}
export function report(j,id,text){
 const [copy,n]=find(j,id);if(n.confirmed||n.acceptedOfferId===null||n.report!==null)throw Error('REPORT_NOT_AVAILABLE');
 n.report=safe(text,600);return validate(copy);
}
export function confirm(j,id){
 const [copy,n]=find(j,id);if(n.origin==='demo'||n.report===null||n.confirmed)throw Error('CONFIRM_NOT_AVAILABLE');
 n.confirmed=true;return validate(copy);
}
export function stage(n){return n.confirmed?'local-confirmation':n.report?'unverified-report':n.acceptedOfferId?'accepted':n.offers.length?'pledge-available':'unmatched';}
export function recommend(j){
 validate(j);const pending=j.needs.filter(n=>!n.confirmed);
 const readiness=n=>n.report?4:n.acceptedOfferId?3:n.offers.length?2:1;
 pending.sort((a,b)=>Number(b.origin==='local')-Number(a.origin==='local')||readiness(b)-readiness(a)||['small','medium','large'].indexOf(a.effort)-['small','medium','large'].indexOf(b.effort)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
 return pending[0]||null;
}
export function demo(j,at){
 validate(j);let copy=clone(j);
 for(const [id,title,requirement,effort] of [
 ['demo-need-01','Phone-friendly appointment flow','Prove one reviewed appointment request workflow.','small'],
 ['demo-need-02','Creative ancestry','Link one published song to an earlier version.','medium'],
 ['demo-need-03','Two transports','Test one non-sensitive message across two different transport paths.','small']]){
 if(copy.needs.some(n=>n.id===id)||copy.needs.length>=80)continue;
 copy.needs.push({id,title,requirement,effort,createdAt:at,origin:'demo',offers:[],acceptedOfferId:null,report:null,confirmed:false});
 }return validate(copy);
}
export function helpSlip(j,id){
 const n=validate(j).needs.find(n=>n.id===id);
 if(!n||n.origin!=='local'||n.confirmed)throw Error('ONLY_UNRESOLVED_LOCAL_NEEDS_EXPORT');
 return {schema:'fulfillment-envelope/v0',envelopeId:n.id,purpose:n.title,createdAt:n.createdAt,requirements:[{id:n.id+':r1',kind:'help',description:n.requirement}],source:{system:'webz-needs-001'},disclosure:{includesOnlySelectedResiduals:true,omittedPrivateContext:true},status:'unmet'};
}
export function canonical(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';}
export async function digest(v){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v)));return 'sha256:'+Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,'0')).join('');}
export async function freeze(j){validate(j);return {schema:'webz/needs-local-export/v0',warning:'Unsigned local rehearsal; no publication or shared confirmation',journal:clone(j),checksum:await digest(j)};}
export async function thaw(e){
 if(!e||Object.keys(e).sort().join(',')!=='checksum,journal,schema,warning'||e.schema!=='webz/needs-local-export/v0'||e.warning!=='Unsigned local rehearsal; no publication or shared confirmation')throw Error('INVALID_EXPORT');
 validate(e.journal);if(await digest(e.journal)!==e.checksum)throw Error('CHECKSUM_MISMATCH');return clone(e.journal);
}
