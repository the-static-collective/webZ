// Voluntary Energy Commons — synthetic dry-run only, no hardware access.
export const CAPABILITIES=["aggregate","index","resize"];
export const NODES=[
 {id:"solar-workshop",label:"Solar workshop (fictional)",optIn:true,awake:true,power:"solar",surplus:true,battery:90,thermalC:45,maxWatts:100,budgetWh:24,capabilities:["aggregate","index"]},
 {id:"spare-desktop",label:"Spare desktop (fictional)",optIn:true,awake:true,power:"grid",surplus:false,battery:100,thermalC:57,maxWatts:150,budgetWh:35,capabilities:["aggregate","index","resize"]},
 {id:"travel-laptop",label:"Travel laptop (fictional)",optIn:false,awake:true,power:"battery",surplus:false,battery:19,thermalC:68,maxWatts:40,budgetWh:8,capabilities:["aggregate"]}
];
export const JOBS=[
 {id:"watershed",label:"Aggregate synthetic environmental readings",capability:"aggregate",watts:18,wh:2,heavy:false,deferrable:true},
 {id:"public-index",label:"Index fictional public documents",capability:"index",watts:75,wh:12,heavy:true,deferrable:true},
 {id:"poster",label:"Resize a fictional public event poster",capability:"resize",watts:30,wh:3,heavy:false,deferrable:false}
];
export function validateNode(n){
 return n&&typeof n.id==="string"&&typeof n.label==="string"&&typeof n.optIn==="boolean"&&
 typeof n.awake==="boolean"&&["solar","grid","battery"].includes(n.power)&&typeof n.surplus==="boolean"&&
 [n.battery,n.thermalC,n.maxWatts,n.budgetWh].every(Number.isFinite)&&n.battery>=0&&n.battery<=100&&
 n.thermalC>=-40&&n.thermalC<=160&&n.maxWatts>=0&&n.maxWatts<=2000&&n.budgetWh>=0&&n.budgetWh<=100000&&
 Array.isArray(n.capabilities)&&n.capabilities.every(x=>CAPABILITIES.includes(x));
}
export function validateJob(j){
 return j&&typeof j.id==="string"&&typeof j.label==="string"&&CAPABILITIES.includes(j.capability)&&
 Number.isFinite(j.watts)&&j.watts>0&&Number.isFinite(j.wh)&&j.wh>0&&
 typeof j.heavy==="boolean"&&typeof j.deferrable==="boolean";
}
export function inspect(n,j){
 if(!validateNode(n)||!validateJob(j))throw new Error("Invalid synthetic input");
 const reasons=[];
 if(!n.optIn)reasons.push("Owner did not opt in");
 if(!n.awake)reasons.push("Not awake");
 if(!n.capabilities.includes(j.capability))reasons.push("Capability absent");
 if(n.power==="battery"&&n.battery<=25)reasons.push("Protect battery reserve");
 if(n.thermalC>=95)reasons.push("Critical thermal pressure");
 if(n.thermalC>=85&&j.heavy)reasons.push("Withdraw heavy work under heat");
 if(n.maxWatts<j.watts)reasons.push("Power ceiling");
 if(n.budgetWh<j.wh)reasons.push("Energy budget");
 const score=(n.power==="solar"&&n.surplus?100:0)+(n.power!=="battery"?20:0);
 return {id:n.id,label:n.label,eligible:reasons.length===0,reasons,score,energyEstimateWh:j.wh};
}
export function route(nodes,job){
 if(!Array.isArray(nodes)||nodes.length>30||!validateJob(job)||nodes.some(n=>!validateNode(n)))throw new Error("Invalid planner inputs");
 if(new Set(nodes.map(n=>n.id)).size!==nodes.length)throw new Error("Duplicate resource ID");
 const reviewed=nodes.map(n=>inspect(n,job));
 const eligible=reviewed.filter(n=>n.eligible).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const selected=eligible[0]||null;
 return {status:selected?"CANDIDATE_ONLY":"HOLD",selected,reviewed,
  execution:"NONE",transport:"NONE",lease:"NONE",campusAccess:"NONE",energyMeasurement:"NOT_MEASURED"};
}