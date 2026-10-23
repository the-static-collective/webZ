// ask JAR;VIS / Genesis 001 — source-first, read-only Cloudflare Worker.
// This is not an agent executor. It constructs a bounded source-inspection machine.
export const CAPABILITIES = Object.freeze([
  {id:"jarvis",name:"JAR;VIS",repo:"JAR-VIS",ref:"fix/005-openmanus-venv",path:"README.md",tags:["question","ask","agent","automation","orchestrate","tool","worker","system","machine"],role:"Attention and bounded proposals"},
  {id:"cannon",name:"CANNON",repo:"CANNON",ref:"main",path:"README.md",tags:["evidence","proof","source","verify","law","history","witness","trust","research"],role:"Provenance and independent verification"},
  {id:"planz",name:"planZ",repo:"planZ",ref:"main",path:"README.md",tags:["plan","garden","food","farm","community","produce","event","project","build","organize"],role:"Possibilities and plans"},
  {id:"bananaspork",name:"BananaSpork",repo:"BananaSpork",ref:"main",path:"README.md",tags:["help","care","neighbor","food","produce","household","need","community","share"],role:"Voluntary care and household participation"},
  {id:"webz",name:"webZ / Abundent",repo:"webZ",ref:"feature/circulation-004-pando-field-lab",path:"circulation/004/index.html",tags:["card","print","music","art","question","website","web","demo","story","public"],role:"Public doors, cards, and demonstrations"},
  {id:"graft",name:"GRAFT",repo:"GRAFT",ref:"main",path:"README.md",tags:["repo","code","prototype","build","project","branch","source","software","creative"],role:"Inspect independent source branches"}
]);
const jsonHeaders={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:jsonHeaders});}
function sourceUrl(c){return "https://raw.githubusercontent.com/the-static-collective/"+c.repo+"/"+c.ref+"/"+c.path;}
function points(q,c){const terms=q.toLowerCase().match(/[a-z0-9]+/g)||[];const words=new Set(terms);return c.tags.reduce((sum,t)=>sum+(words.has(t)?3:q.toLowerCase().includes(t)?1:0),0);}
function pick(q){
  return [...CAPABILITIES].sort((a,b)=>points(q,b)-points(q,a)||a.id.localeCompare(b.id)).slice(0,3);
}
function strip(text){
  const lines=text.replace(/\r/g,"").split("\n");
  let title=lines.find(s=>/^# /.test(s))?.replace(/^# /,"").trim() || "";
  if(!title){const m=text.match(/<h1[^>]*>([^<]+)/i)||text.match(/<title[^>]*>([^<]+)/i);title=m?.[1]?.trim()||"Public source"; }
  const excerpt=lines.map(s=>s.trim()).find(s=>s.length>28&&!/^(#|>|<|[-*]|\[|!|$)/.test(s))||"Source document inspected; inspect the original for details.";
  return {title:title.slice(0,140),excerpt:excerpt.slice(0,235)};
}
async function digest(data){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(data));return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");}
async function inspect(c,fetcher){
  const url=sourceUrl(c);
  try {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),2800);
    let res;try{res=await fetcher(url,{signal:controller.signal,headers:{"accept":"text/plain"},redirect:"error",cf:{cacheTtl:180,cacheEverything:true}});}finally{clearTimeout(timer);}
    if(!res.ok)throw Error("UPSTREAM_"+res.status);
    const length=Number(res.headers.get("content-length")||0);
    if(length>90000)throw Error("SOURCE_TOO_LARGE");
    const body=(await res.text()).slice(0,90000);
    const sha256=await digest(body);
    return {id:c.id,name:c.name,role:c.role,status:"INSPECTED",source:url,sha256:"sha256:"+sha256,...strip(body)};
  } catch {
    return {id:c.id,name:c.name,role:c.role,status:"UNAVAILABLE",source:url,sha256:null,title:"Not inspected",excerpt:"Read-only source lookup did not succeed. No result is inferred."};
  }
}
export async function assemble(question,fetcher=fetch){
  const q=String(question||"").replace(/\s+/g," ").trim();
  if(q.length<8||q.length>360)throw Error("QUESTION_LENGTH");
  if(/[\u0000-\u001f\u007f]/.test(q))throw Error("QUESTION_CONTROL");
  // This public experiment deliberately avoids retaining private contact details.
  if(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}/.test(q))throw Error("PRIVATE_CONTACT");
  const targets=pick(q);
  const sources=await Promise.all(targets.map(c=>inspect(c,fetcher)));
  const found=sources.filter(s=>s.status==="INSPECTED");
  const guidance=found.length
    ? "I inspected "+found.length+" public source"+(found.length===1?"":"s")+" relevant to this question. They show possible tools, not commitments. The next step is to inspect their roles and choose what to ask or make."
    : "I could not verify a source document on this run. No result or connection is being claimed. You can still keep the question and inspect the public project links.";
  const nextQuestion="What is the smallest public-safe, permission-respecting experiment that would move this question forward?";
  const observedAt=new Date().toISOString();
  const lines=[
    "# ASK JAR;VIS / QUESTION CARD",
    "Question: "+q,
    "",
    "Observation: "+guidance,
    "",
    "Sources inspected (read-only):",
    ...sources.map(s=>"- "+s.name+" — "+s.status+" — "+s.source+(s.sha256?" ["+s.sha256+"]":"")),
    "",
    "Next question: "+nextQuestion,
    "",
    "No organizer affiliation, verified human consent, remote execution, partner commitment, or fulfilled service is claimed.",
    "Generated: "+observedAt
  ];
  const artifact=lines.join("\n");
  const proof={schema:"ask-jarvis/read-only-v0",question:q,observedAt,
    sourceDigestList:sources.map(s=>({id:s.id,status:s.status,sha256:s.sha256})),artifactSha256:"sha256:"+await digest(artifact)};
  const receiptHash="sha256:"+await digest(JSON.stringify(proof));
  const steps=[
    {name:"JAR;VIS",status:"DONE",detail:"Received a single question; no profile or server-side storage."},
    {name:"LOADOUT",status:"DONE",detail:"Selected "+targets.length+" bounded public-source capability candidates."},
    ...sources.map(s=>({name:s.name,status:s.status==="INSPECTED"?"READ":"HOLD",detail:s.status==="INSPECTED"?"Read public source and verified its SHA-256.":"Source unavailable; no substitute claims."})),
    {name:"CANNON boundary",status:"HOLD",detail:"No source-owner endorsement, signing, or runtime CANNON validation. Digest is not consent."},
    {name:"OpenManus / ELF",status:"NOT_RUN",detail:"Native agents are not launched by this public experiment."},
    {name:"RETURN",status:"DONE",detail:"Generated an inspectable local question-card artifact."}
  ];
  return {schema:"ask-jarvis/return-v0",mode:"LIVE_PUBLIC_SOURCE_INSPECTION_ONLY",question:q,observedAt,guidance,nextQuestion,sources,steps,artifact,receiptHash};
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/health"&&request.method==="GET")return response({ok:true,name:"ask JAR;VIS",mode:"read-only-source-inspection"});
    if(url.pathname==="/api/ask"&&request.method==="POST"){
      const len=Number(request.headers.get("content-length")||0);
      if(len>1800)return response({error:"QUESTION_TOO_LARGE"},413);
      let obj;try{obj=await request.json();}catch{return response({error:"INVALID_JSON"},400);}
      if(!obj||typeof obj.question!=="string")return response({error:"QUESTION_REQUIRED"},400);
      try{return response(await assemble(obj.question));}
      catch(e){return response({error:e.message==="PRIVATE_CONTACT"?"Please omit contact details. This demo is public-source only.":"Enter one question between 8 and 360 characters."},422);}
    }
    if(url.pathname.startsWith("/api/"))return response({error:"NOT_FOUND"},404);
    if(env?.ASSETS?.fetch)return env.ASSETS.fetch(request);
    return new Response("Static assets binding is unavailable. Deploy with Wrangler and assets configured.",{status:503});
  }
};