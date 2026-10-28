// Temporary Vercel preview adapter. Canonical runtime remains Cloudflare Worker.
import {assemble,inputError,REQUEST_LIMIT} from "../src/worker.mjs";
import {readRecentWork} from "../src/recent-work.mjs";
import {readObservations} from "../src/source-observations.mjs";
import {readChangeCandidates} from "../src/change-review.mjs";
import {readReviewDecisions,selectDecisionsForQuestion} from "../src/review-decisions.mjs";
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  const obj=req.body && typeof req.body==="object"?req.body:{};
  if(typeof obj.question!=="string")return res.status(400).json({error:"QUESTION_REQUIRED"});
  if(new TextEncoder().encode(JSON.stringify(obj)).byteLength>REQUEST_LIMIT)return res.status(413).json({error:"QUESTION_TOO_LARGE"});
  try{const recent=await readRecentWork(obj.question,{fetcher:fetch});recent.observations=await readObservations(recent,{fetcher:fetch});recent.changeCandidates=await readChangeCandidates(recent,{fetcher:fetch});recent.reviewDecisions=selectDecisionsForQuestion(await readReviewDecisions({fetcher:fetch}),recent.changeCandidates);return res.status(200).json(await assemble(obj.question,fetch,{kind:obj.kind??'auto',recent}));}
  catch(error){return res.status(422).json({error:inputError(error)});}
}
