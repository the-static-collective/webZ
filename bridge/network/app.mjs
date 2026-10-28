import {allDoors,organs,relations,door,neighbors,dossierFor,draftFor,exportAtlas} from "./model.mjs";
const $=id=>document.getElementById(id);
const ns="http://www.w3.org/2000/svg";
let active=allDoors.some(d=>d.id===new URLSearchParams(location.search).get("door"))?new URLSearchParams(location.search).get("door"): "voqal";
let query="",domain="all",entry="all",order="deadline";
const nice=s=>s.toLowerCase().replaceAll("_"," ");
const unique=values=>[...new Set(values)].sort((a,b)=>a.localeCompare(b));
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x}
function sv(tag,attrs={}){const x=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))x.setAttribute(k,String(v));return x}
function text(id,value){$(id).textContent=value}
function save(name,data){const b=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});const u=URL.createObjectURL(b),a=el("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
function options(target,values){for(const value of values){const op=el("option","",nice(value));op.value=value;target.append(op)}}
options($("domain"),unique(allDoors.map(d=>d.category)));options($("entry"),unique(allDoors.map(d=>d.entry)));
text("room-count",String(allDoors.length));text("organ-count",String(organs.length));text("edge-count",String(relations.length));
function matches(d){return (domain==="all"||d.category===domain)&&(entry==="all"||d.entry===entry)&&(!query||[d.name,d.kind,d.category,d.alignment,d.request,d.organs.join(" ")].join(" ").toLowerCase().includes(query))}
function visible(){return allDoors.filter(matches).sort((a,b)=>order==="name"?a.name.localeCompare(b.name):(a.deadline||"9999").localeCompare(b.deadline||"9999")||a.name.localeCompare(b.name))}
function select(id){active=id;history.replaceState(null,"",location.pathname+"?door="+encodeURIComponent(id)+"#workspace");render()}
function renderRail(rows){const root=$("room-list");root.replaceChildren();text("shown-count",rows.length+" shown");
 for(const d of rows){const button=el("button","room-button");button.type="button";button.setAttribute("aria-current",String(d.id===active));
 button.append(el("strong","",d.name),el("small","",d.deadline||"Open inquiry"),el("span","",nice(d.category)+" · "+nice(d.entry)));
 button.onclick=()=>select(d.id);root.append(button)}}
function place(i,n,cx,cy,rx,ry,start=-Math.PI/2){const a=start+Math.PI*2*i/Math.max(n,1);return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]}
function node(label,x,y,kind,selected,click){const g=sv("g",{class:"map-node "+kind+(selected?" selected":""),transform:`translate(${x},${y})`,role:"button",tabindex:"0","aria-label":label});
 const c=sv("circle",{r:kind==="organ"?17:12});const title=sv("title");title.textContent=label;g.append(c,title);
 const t=sv("text",{y:kind==="organ"?-23:25,"text-anchor":"middle"});t.textContent=label.length>16?label.slice(0,15)+"…":label;g.append(t);
 g.addEventListener("click",click);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();click()}});return g}
function renderMap(rows){
 const svg=$("network-svg");[...svg.children].forEach(n=>{if(!["title","desc"].includes(n.tagName))n.remove()});
 const base=sv("g",{class:"base-links"}),highlight=sv("g",{class:"focus-links"}),points=sv("g",{class:"map-points"});
 const op=new Map(organs.map((p,i)=>[p.id,place(i,organs.length,450,280,150,115)]));
 const dp=new Map(rows.map((d,i)=>[d.id,place(i,rows.length,450,280,380,236)]));
 const keys=new Set(door(active).organs);
 for(const d of rows){for(const organId of d.organs){const a=dp.get(d.id),b=op.get(organId);
 if(!a||!b)continue;
 const path=sv("path",{d:`M ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q 450 280 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`});
 (d.id===active?highlight:base).append(path);
 }}
 for(const p of organs){const [x,y]=op.get(p.id);points.append(node(p.name,x,y,"organ",keys.has(p.id),()=>{
 const related=rows.find(d=>d.organs.includes(p.id));if(related)select(related.id);
 }))}
 for(const d of rows){const [x,y]=dp.get(d.id);points.append(node(d.name,x,y,"institution",d.id===active,()=>select(d.id)))}
 svg.append(base,highlight,points);
 text("map-caption","Selected: "+door(active).name+" · "+door(active).organs.length+" proposed capability fits · Other lines are hypotheses, not introductions or existing partnerships.");
}
function renderFocus(){
 const d=door(active);text("focus-name",d.name);text("focus-kind",d.kind+" / "+nice(d.entry));text("focus-due",d.due);
 text("focus-alignment",d.alignment);text("focus-ask",d.request);text("focus-offered",d.offered);text("focus-gate",d.gate);text("focus-next",d.next);
 $("focus-source").href=d.url;$("desk-link").href="../desk/?door="+encodeURIComponent(active);text("copy-state","Nothing has been sent, submitted, signed, or stored.");
 const box=$("focus-organs");box.replaceChildren();
 for(const id of d.organs){const o=organs.find(o=>o.id===id);const link=el("a","chip",o.name+" ↗");link.href=o.url;link.target="_blank";link.rel="noopener noreferrer";link.title=o.role;box.append(link)}
}
function renderStepstones(){const box=$("stepstones");box.replaceChildren();
 for(const n of neighbors(active)){const card=el("article","stepstone");const b=el("button","",n.name+" ↗");b.type="button";b.onclick=()=>{select(n.id);$("workspace").scrollIntoView({behavior:"smooth"})};
 card.append(el("small","",nice(n.category)+" · PROPOSED, NOT CONNECTED"),b,el("p","",n.overlap.length+" candidate shared instrument(s): "+n.routeReason));box.append(card)}
}
function render(){let rows=visible();if(!rows.some(d=>d.id===active)&&rows.length)active=rows[0].id;
 renderRail(rows);if(rows.length){renderMap(rows);renderFocus();renderStepstones()}
 else{$("network-svg").querySelectorAll("g").forEach(n=>n.remove());text("map-caption","No matching rooms. Clear a filter to see the graph.");$("stepstones").replaceChildren();}}
$("find").oninput=e=>{query=e.target.value.trim().toLowerCase();render()};
$("domain").onchange=e=>{domain=e.target.value;render()};
$("entry").onchange=e=>{entry=e.target.value;render()};
$("sort").onchange=e=>{order=e.target.value;render()};
$("export-all").onclick=()=>save("bridge-institutional-atlas-v1-PROSPECTS.json",exportAtlas());
$("export-dossier").onclick=()=>save("bridge-"+active+"-REVIEW-DRAFT.json",dossierFor(active));
$("copy-draft").onclick=async()=>{try{await navigator.clipboard.writeText(draftFor(active));text("copy-state","Unsent introduction copied. Verify source, personalize and secure permission before sending.")}catch{text("copy-state","Clipboard unavailable. Export the review dossier to inspect the draft.")}};
render();
