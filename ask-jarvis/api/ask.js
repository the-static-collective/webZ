// Temporary Vercel preview adapter. Canonical runtime remains Cloudflare Worker.
import {assemble} from "../src/worker.mjs";
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  const obj=req.body && typeof req.body==="object"?req.body:{};
  if(typeof obj.question!=="string")return res.status(400).json({error:"QUESTION_REQUIRED"});
  if(JSON.stringify(obj).length>1800)return res.status(413).json({error:"QUESTION_TOO_LARGE"});
  try{return res.status(200).json(await assemble(obj.question));}
  catch(error){return res.status(422).json({error:error.message==="PRIVATE_CONTACT"?"Please omit contact details. This demo is public-source only.":"Enter one question between 8 and 360 characters."});}
}
