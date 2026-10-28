// Public read-only health view of the recent-work catalog; no query forwarded.
import {readRecentWork} from '../src/recent-work.mjs';
import {readObservations} from '../src/source-observations.mjs';
import {readChangeCandidates} from '../src/change-review.mjs';
import {readReviewDecisions} from '../src/review-decisions.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const cut=await readRecentWork('recent useful projects',{fetcher:fetch});
 const observations=await readObservations(cut,{fetcher:fetch});
 const changeCandidates=await readChangeCandidates(cut,{fetcher:fetch});
 const reviewDecisions=await readReviewDecisions({fetcher:fetch});
 return res.status(cut.status==='READ'?200:503).json({status:cut.status,
  release:cut.release,reviewedOn:cut.reviewedOn,sourceSha256:cut.sourceSha256,
  selectedIds:cut.selected.map(x=>x.id),
  reviewDecisions:{status:reviewDecisions.status,total:reviewDecisions.total??0},
  changeCandidates:{status:changeCandidates.status,pendingCount:changeCandidates.pendingCount||0,holdCount:changeCandidates.holdCount||0},
  observations:{status:observations.status,scannedAt:observations.scannedAt||null,observedCount:observations.observedCount||0,holds:observations.holds||[]},
  disclosure:cut.disclosure||'The catalog was not available; no project is inferred.'});
}
