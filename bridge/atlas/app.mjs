import atlas from "./atlas.json" with {type:"json"};
const $=id=>document.getElementById(id);
const byName=Object.fromEntries(atlas.repositories.map(r=>[r.name,r]));
const findTrail=id=>atlas.paths.find(t=>t.id===id);
const unique=xs=>[...new Set(xs)].sort((a,b)=>a.localeCompare(b));
let selectedTrail=findTrail(new URLSearchParams(location.search).get("trail"))||atlas.paths[0];
let selectedRepo=byName[new URLSearchParams(location.search).get("repo")]||byName[selectedTrail.nodes[0]];
let term="",shelf="all",role="all";
function elt(tag,className,str){const e=document.createElement(tag);if(className)e.className=className;if(str!==undefined)e.textContent=str;return e}
function download(name,value){const b=new Blob([JSON.stringify(value,null,2)+"\n"],{type:"application/json"});const u=URL.createObjectURL(b),a=elt("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function setText(id,str){$(id).textContent=str}
setText("date",atlas.observation.captured.replace("T"," ").replace("+00:00"," UTC"));
setText("repoCount",atlas.totals.publicRepositories.toLocaleString());
setText("refCount",atlas.totals.branchRefs.toLocaleString());
setText("prCount",atlas.totals.openPullRequests.toLocaleString());
setText("studiedCount",atlas.totals.deepReadSources.toLocaleString());
function focusRepo(name){selectedRepo=byName[name];renderDetail();renderProjects();document.getElementById("inventory").scrollIntoView({behavior:"smooth",block:"start"});}
function renderTrail(){
 const t=selectedTrail;
 $("trailtabs").replaceChildren();for(const p of atlas.paths){
   const b=elt("button","",p.label);b.type="button";b.setAttribute("aria-pressed",String(t.id===p.id));b.onclick=()=>{selectedTrail=p;renderTrail();history.replaceState(null,"",location.pathname+"?trail="+encodeURIComponent(p.id)+"#trails")};$("trailtabs").append(b)
 }
 setText("trailName",t.label);setText("trailOutcome",t.outcome);
 setText("trailGate",t.gate);setText("trailStatus",t.status.replaceAll("_"," "));
 $("trailSteps").replaceChildren();
 t.nodes.forEach((n,i)=>{if(i){$("trailSteps").append(elt("span","arrow","→"))}const r=byName[n];const b=elt("button");b.type="button";b.setAttribute("aria-pressed",String(selectedRepo.name===n));b.append(elt("strong","",n),elt("small","",r?.role?.role||r?.shelf||"Unclassified"));b.onclick=()=>focusRepo(n);$("trailSteps").append(b)});
}
$("exportTrail").onclick=()=>download("between-rooms-"+selectedTrail.id+"-CANDIDATE.json",{schema:"abundent/bridge-atlas-route-v1",sourceSnapshot:atlas.observation.captured,classification:"CANDIDATE_ONLY_NOT_APPROVED",route:selectedTrail,sourceRefs:selectedTrail.nodes.map(n=>({name:n,url:byName[n].url,shaObservedAtSnapshot:byName[n].observedDefaultSha})),thirdPartyPermission:"NOT_ESTABLISHED",executed:false,reported:false,independentlyVerified:false});
function renderDetail(){
 const r=selectedRepo;setText("detailName",r.name);setText("detailDesc",r.role?.observed||"Found in the public Git snapshot. No reviewed capability note yet; inspect the repository and choose an exact source cut before suggesting a role.");
 const extra=$("detailExtra");extra.replaceChildren();const dl=elt("dl");const pairs=[["Map shelf",r.shelf],["Role",r.role?.role||"UNREVIEWED"],["Refs observed",String(r.refsObserved)],["Open PRs observed",String(r.prsObserved)],["Snapshot default ref",r.defaultRef+" @ "+(r.observedDefaultSha||"unknown").slice(0,10)],["Source type",r.role?.sourceStatus||"INVENTORY_ONLY"]];if(r.role)pairs.push(["Proposed crossing",r.role.candidate],["Next gate",r.role.nextGate]);
 for(const [key,value]of pairs){dl.append(elt("dt","",key),elt("dd","",value))}extra.append(dl);
 if(r.notableOpenPr){const p=elt("p","","Interesting open PR: ");const a=elt("a","", "Proposed GHoT worship-stage organ ↗");a.href=r.notableOpenPr;a.target="_blank";a.rel="noopener noreferrer";p.append(a);extra.append(p)}
 const source=$("detailSource");source.href=r.role?.sourceStatus==="READ_ME_OR_PROJECT_DOCUMENTED"?r.role.source:r.url;source.textContent="Inspect project-owned source ↗";
}
function addOptions(node,values,label){node.replaceChildren();for(const value of ["all",...values]){const opt=elt("option","",value==="all"?"All "+label:value);opt.value=value;node.append(opt)}}
addOptions($("shelf"),unique(atlas.repositories.map(r=>r.shelf)),"shelves");addOptions($("role"),unique(atlas.repositories.filter(r=>r.role).map(r=>r.role.role)),"roles");
function renderProjects(){
 const filtered=atlas.repositories.filter(r=>(shelf==="all"||r.shelf===shelf)&&(role==="all"||r.role?.role===role)&&(!term||[r.name,r.shelf,r.role?.role,r.role?.observed,r.role?.candidate].join(" ").toLowerCase().includes(term)));
 setText("resultCount",filtered.length+" of "+atlas.repositories.length+" source addresses shown. Counts are from a dated observation, not a live Git query.");
 const list=$("projects");list.replaceChildren();for(const r of filtered){const b=elt("button");b.type="button";b.setAttribute("aria-pressed",String(r.name===selectedRepo.name));b.append(elt("strong","",r.name),elt("span","",r.role?r.role.role.toUpperCase()+" · "+r.refsObserved+" refs":r.shelf+" · "+r.refsObserved+" refs"));b.onclick=()=>{selectedRepo=r;renderDetail();renderProjects()};list.append(b)}
}
$("search").oninput=e=>{term=e.target.value.toLowerCase().trim();renderProjects()};
$("shelf").onchange=e=>{shelf=e.target.value;renderProjects()};
$("role").onchange=e=>{role=e.target.value;renderProjects()};
function renderRelations(){
 const container=$("relationsList");for(const r of atlas.relations){const div=elt("article","relation");div.append(elt("b","",r.from+" → "+r.to));div.append(elt("p","",r.kind+" · SOURCE DECLARED"));div.append(elt("p","",r.note));const a=elt("a","", "Inspect relation source ↗");a.href=r.source;a.target="_blank";a.rel="noopener noreferrer";div.append(a);container.append(div)}
}
renderTrail();renderDetail();renderProjects();renderRelations();