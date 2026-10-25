// Read-only publication feed: protected Preview sees reviewed candidates;
// general production readers see explicitly APPROVED GRAFT-main entries only.
import {readGraftFeed} from '../src/graft-feed.mjs';
export default async function handler(req,res){
  res.setHeader('Cache-Control','public, s-maxage=180, stale-while-revalidate=180');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
  const q=typeof req.query?.q==='string'?req.query.q:'';
  if(q.length>360||/[\u0000-\u001f\u007f]/.test(q))return res.status(400).json({error:'QUESTION_INVALID'});
  const result=await readGraftFeed(q,{env:process.env,fetcher:fetch});
  return res.status(200).json(result);
}
