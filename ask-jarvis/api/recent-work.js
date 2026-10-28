// Public read-only health view of the recent-work catalog; no query forwarded.
import {readRecentWork} from '../src/recent-work.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const cut=await readRecentWork('recent useful projects',{fetcher:fetch});
 return res.status(cut.status==='READ'?200:503).json({status:cut.status,
  release:cut.release,reviewedOn:cut.reviewedOn,sourceSha256:cut.sourceSha256,
  selectedIds:cut.selected.map(x=>x.id),
  disclosure:cut.disclosure||'The catalog was not available; no project is inferred.'});
}
