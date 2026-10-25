import {NODES,JOBS,route} from "../src/resource-router.mjs";
const nodes=structuredClone(NODES);
const byId=id=>document.getElementById(id);
const nodeBox=byId("nodes"),job=byId("job"),reviews=byId("reviews");
function item(tag,txt){const e=document.createElement(tag);e.textContent=txt;return e;}
for(const [i,n] of nodes.entries()){
 const panel=item("article","");panel.style.cssText="display:inline-block;vertical-align:top;width:min(100%,315px);background:#fff;padding:20px;margin:10px 14px 10px 0;border:1px solid #a4bba4;";
 panel.append(item("h3",n.label),item("p","Power: "+n.power+" · battery: "+n.battery+"% · temperature: "+n.thermalC+"°C"),item("p","Budget: "+n.budgetWh+" Wh · ceiling: "+n.maxWatts+" W"),item("p","Capabilities: "+n.capabilities.join(", ")));
 const label=item("label"," Fictional owner opts in"),check=document.createElement("input");check.type="checkbox";check.checked=n.optIn;check.setAttribute("aria-label",n.label+" fictional owner consent");
 check.addEventListener("change",()=>{nodes[i].optIn=check.checked;replan();});
 label.prepend(check);panel.append(label);nodeBox.append(panel);
}
for(const j of JOBS){const opt=item("option",j.label);opt.value=j.id;job.append(opt);}
function replan(){
 const j=JOBS.find(x=>x.id===job.value)||JOBS[0],p=route(nodes,j);
 byId("jobInfo").textContent="Task: "+j.capability+" · estimated "+j.watts+" W / "+j.wh+" Wh (not measurements)";
 byId("status").textContent=p.status;
 byId("explanation").textContent=p.selected?"Suggested: "+p.selected.label+"; local approval still required.":"No eligible volunteer offer. The request stays on HOLD.";
 reviews.replaceChildren();
 for(const x of p.reviewed){
 const line=item("p",x.label+": "+(x.eligible?"eligible for consideration":x.reasons.join("; ")));
 line.style.cssText="padding:12px;background:#e9efe6;border-left:4px solid #2b5945";
 reviews.append(line);
 }
}
job.addEventListener("change",replan);byId("plan").addEventListener("click",replan);replan();