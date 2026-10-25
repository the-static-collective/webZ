// Temporary Vercel preview adapter. Canonical runtime remains Cloudflare Worker.
import {assemble,inputError,REQUEST_LIMIT} from "../src/worker.mjs";
import {readGraftFeed} from "../src/graft-feed.mjs";
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  const obj=req.body && typeof req.body==="object"?req.body:{};
  if(typeof obj.question!=="string")return res.status(400).json({error:"QUESTION_REQUIRED"});
  if(new TextEncoder().encode(JSON.stringify(obj)).byteLength>REQUEST_LIMIT)return res.status(413).json({error:"QUESTION_TOO_LARGE"});
  try{
    const graft=await readGraftFeed(obj.question,{env:process.env,fetcher:fetch});
    return res.status(200).json(await assemble(obj.question,fetch,{kind:obj.kind??'auto',lens:obj.lens??'standard',graft}));
  }
  catch(error){return res.status(422).json({error:inputError(error)});}
}
