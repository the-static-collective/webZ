// REVIEW-DECISION-001: fixed source-owned, write-reviewed public GitHub ledger.
import {sha256} from '../public/evidence.mjs';
export const LEDGER_URL='https://raw.githubusercontent.com/the-static-collective/JAR-VIS/main/commons/review-decisions-v1.json';
const SHA=/^[a-f0-9]{40}$/,TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const USER=/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const DISP=new Set(['HOLD','NEEDS_EVIDENCE','SOURCE_CHANGE_REVIEWED','DISMISS']);
const cache={data:null,digest:null,expires:0};
export function parseReviewLedger(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>320000)throw Error('REVIEW_SIZE');
 let v;try{v=JSON.parse(raw)}catch{throw Error('REVIEW_JSON')}
 if(!v||v.schema!=='static-collective/review-decisions-v1'||v.authority!=='GITHUB_WRITE_REVIEWERS'
   ||!Array.isArray(v.records)||v.records.length>400)throw Error('REVIEW_SCHEMA');
 const ids=new Set(),root='https://github.com/the-static-collective/JAR-VIS/issues/';
 for(const r of v.records){
  if(!r||!/^COMMENT-[1-9][0-9]{0,17}$/.test(r.id)||ids.has(r.id)
    ||!/^DIFF-[A-F0-9]{20}$/.test(r.candidateId)||!SHA.test(r.from)||!SHA.test(r.to)||r.from===r.to
    ||!DISP.has(r.disposition)||!USER.test(r.reviewer)||!['write','admin'].includes(r.reviewerPermission)
    ||!Number.isSafeInteger(r.issueNumber)||r.issueNumber<1
    ||!Number.isSafeInteger(r.commentId)||r.commentId<1
    ||!TIME.test(r.reviewedAt)||!(/^[a-f0-9]{64}$/.test(r.issueBodySha256))
    ||r.authority!=='GITHUB_WRITE_REVIEWERS'
    ||r.claim!=='SOURCE_REVIEW_ONLY_NOT_DEPLOYMENT_OR_FIELD_PROOF'
    ||r.issueUrl!==root+r.issueNumber||r.commentUrl!==r.issueUrl+'#issuecomment-'+r.commentId)throw Error('REVIEW_ENTRY');
  ids.add(r.id);
 }
 return v;
}
export function reviewProjection(ledger){
 const latest=new Map();
 for(const r of ledger.records)latest.set(r.candidateId,r);
 return {total:ledger.records.length,
  latest:[...latest.values()].map(r=>({id:r.id,candidateId:r.candidateId,repo:r.repo,disposition:r.disposition,
   reviewer:r.reviewer,reviewedAt:r.reviewedAt,commentUrl:r.commentUrl,authority:r.authority,
   claim:r.claim})), recent:ledger.records.slice(-20).map(r=>({
    id:r.id,candidateId:r.candidateId,repo:r.repo,disposition:r.disposition,
    reviewer:r.reviewer,reviewedAt:r.reviewedAt,commentUrl:r.commentUrl
   }))};
}
export async function readReviewDecisions({fetcher=fetch,now=Date.now}={}){
 const t=now();if(!cache.data||cache.expires<=t){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),3500);
  try{
   const r=await fetcher(LEDGER_URL,{headers:{accept:'application/json'},redirect:'error',signal:ctrl.signal});
   if(!r.ok||Number(r.headers.get('content-length'))>320000)throw Error('REVIEW_UNAVAILABLE');
   const body=await r.text();const data=parseReviewLedger(body);
   cache.data=data;cache.digest=await sha256(body);cache.expires=t+90000;
  }catch{cache.data=null;cache.digest=null;cache.expires=t+12000}
  finally{clearTimeout(timer);ctrl.abort()}
 }
 if(!cache.data)return {schema:'jarvis/review-decisions-cut-v1',status:'HOLD',reason:'REVIEW_LEDGER_UNAVAILABLE_OR_INVALID',latest:[],recent:[]};
 return {schema:'jarvis/review-decisions-cut-v1',status:'READ',
  ledgerSha256:cache.digest,...reviewProjection(cache.data),
  disclosure:'Only GitHub write/admin reviewers can record decisions. A source-only review is not approval, deployment, partner consent or completed field work.'};
}

export function selectDecisionsForQuestion(decisions,candidates){
 const ids=new Set((candidates?.selected||[]).map(c=>c.id));
 return {status:decisions.status,total:decisions.total??0,
  ledgerSha256:decisions.ledgerSha256??null,
  selected:decisions.status==='READ'?(decisions.latest||[]).filter(r=>ids.has(r.candidateId)).slice(0,5):[],
  disclosure:'An authenticated source-only review does not verify a production deployment or human outcome.'};
}
