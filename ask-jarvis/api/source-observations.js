// Read-only status of independently observed public Git refs.
import {readObservations} from '../src/source-observations.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const cut=await readObservations(null,{fetcher:fetch});
 return res.status(cut.status==='READ'?200:503).json(cut);
}
