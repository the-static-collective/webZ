export default function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  return res.status(200).json({ok:true,name:"ask JAR;VIS",mode:"read-only-source-inspection",host:"vercel-temporary-preview"});
}
