// FIRST-INCH-002: source-inspired deterministic planning ecology.
// This is an independent browser-safe graph kernel, NOT Dogram or Toaster runtime code.
import { createCard } from "./first-step.mjs";

export const NODES = Object.freeze([
  {id:"goal", prerequisites:[], effort:0},
  {id:"question", prerequisites:["goal"], effort:1},
  {id:"inventory", prerequisites:["goal"], effort:2},
  {id:"draft", prerequisites:["inventory"], effort:3},
  {id:"request", prerequisites:["question"], effort:2},
  {id:"approval", prerequisites:["request"], effort:0, gate:"Independent human permission"},
  {id:"trial", prerequisites:["draft","approval"], effort:4},
  {id:"outcome", prerequisites:["trial"], effort:0, gate:"Independently checked field outcome"},
  {id:"review", prerequisites:["outcome"], effort:2}
]);
const nodeMap = new Map(NODES.map(n=>[n.id,n]));
const ROLES = Object.freeze([
  {id:"QUESTION",target:"question",label:"Ask one sharp question",variants:[
    "Write one question that separates what is known from what needs a real person's answer.",
    "Identify the single unknown that would change the next decision; ask before planning further.",
    "Prepare a brief question for the person who owns the missing information."
  ]},
  {id:"INVENTORY",target:"inventory",label:"Map what's already here",variants:[
    "Make two columns: explicitly available resources and unconfirmed resources. Do not fill blanks by guessing.",
    "List the people, materials and spaces that have actually been offered; leave all other entries unknown.",
    "Write a small offer/need inventory using only what was declared."
  ]},
  {id:"DRAFT",target:"draft",label:"Make a paper prototype",variants:[
    "Draft one reversible paper or screen mockup; label assumptions and request review before publishing.",
    "Make a one-page version of the idea that a stranger could assess without background context.",
    "Build a small offline mock example. Use placeholders rather than invented partners or promises."
  ]},
  {id:"REQUEST",target:"request",label:"Prepare an invitation",variants:[
    "Draft an opt-in request naming the precise decision being sought. Do not interpret silence as yes.",
    "Write a permission request with a clear scope, easy refusal and an explicit next contact choice.",
    "Prepare a voluntary invitation for review only; record no response that has not happened."
  ]},
  {id:"TRIAL",target:"trial",label:"Design a tiny field trial",variants:[
    "Plan a reversible test with a named owner, safety check and stop condition. HOLD execution until consent.",
    "Design one small pilot with a measurable observation, fallback and explicit steward authorization gate.",
    "Write a test rehearsal plan with bounded resources. No invitation, purchase or real trial is executed."
  ]},
  {id:"REVIEW",target:"review",label:"Design the evidence check",variants:[
    "Prepare an independent witness checklist. A planned test is not a verified outcome.",
    "Draft a before/after comparison with named evidence that would be required after a real event.",
    "Design a review form that distinguishes reports, corroboration, gaps and refusals."
  ]}
]);
const roleMap = new Map(ROLES.map(r=>[r.id,r]));
const nodes = NODES.map(n=>n.id);
const edges = NODES.flatMap(n=>n.prerequisites.map(parent=>[parent,n.id]));
const gates = Object.freeze(["approval","outcome"]);

function requireNode(id) {
  if (!nodeMap.has(id)) throw new RangeError("Unknown graph node.");
}
function closureFor(id, removed = null, done = new Set()) {
  requireNode(id);
  if (id === removed) return null;
  if (done.has(id)) return done;
  const node = nodeMap.get(id);
  for (const dep of node.prerequisites) {
    if (closureFor(dep, removed, done) === null) return null;
  }
  done.add(id);
  return done;
}
function ordered(set) {return NODES.filter(n=>set.has(n.id)).map(n=>n.id);}
function effortFor(steps) {return steps.reduce((sum,id)=>sum+nodeMap.get(id).effort,0);}
export function shortestPath(graph, start, end) {
  if (!graph.nodes.includes(start) || !graph.nodes.includes(end)) return null;
  let queue = [[start]], visited = new Set([start]);
  while(queue.length){
    const path = queue.shift(), tail = path.at(-1);
    if(tail===end) return path;
    for(const next of graph.edges.filter(e=>e[0]===tail).map(e=>e[1]).sort()){
      if(!visited.has(next)){visited.add(next);queue.push([...path,next]);}
    }
  }
  return null;
}
export function graphWithoutNode(graph, removed) {
  if(!graph.nodes.includes(removed)) throw new RangeError("Missing ablation node.");
  return {
    nodes:graph.nodes.filter(x=>x!==removed),
    edges:graph.edges.filter(([a,b])=>a!==removed && b!==removed).map(e=>[...e])
  };
}
export function dependencyGateCheck(target, removed) {
  return closureFor(target, removed) !== null;
}
export function planningGraph() {
  return {nodes:[...nodes],edges:edges.map(e=>[...e])};
}
export function makeDogramSpecimen(removed = "approval") {
  requireNode(removed);
  return {
    schema:"dogram.specimen/v0",
    specimen_id:"first-inch-002-" + removed + "-ablation",
    operator:"ablate",
    operator_version:1,
    inputs:{
      graph:planningGraph(),
      target:{kind:"node",node:removed},
      requested_targets:[["goal","request"],["goal","trial"],["goal","review"]]
    },
    assumptions:["The graph models declared planning dependencies, not real resources or real-world events."],
    metadata:{project:"abundent/first-inch-002",meaning:"Graph path != conjunctive prerequisites != authorization"}
  };
}
export function compareAblation(removed = "approval") {
  const graph = planningGraph(), cut = graphWithoutNode(graph,removed);
  return {
    removed,
    trials:["trial","review"].map(target=>({
      target,
      graphPathBefore:shortestPath(graph,"goal",target),
      graphPathAfter:shortestPath(cut,"goal",target),
      allPrerequisitesAfter:dependencyGateCheck(target,removed)
    })),
    note:"A directed graph path is not sufficient for AND-dependent readiness, and neither is human permission."
  };
}
export function generateSixUp({goal, have="", needs="", kind="other", effortBudget=8, round=0}={}) {
  const card = createCard({goal,have,needs,kind});
  if (!Number.isSafeInteger(effortBudget) || effortBudget<1 || effortBudget>50) throw new RangeError("Effort budget must be a whole number from 1 to 50.");
  if (!Number.isSafeInteger(round) || round<0 || round>99) throw new RangeError("Rehearsal round must be 0–99.");
  const candidates = ROLES.map((role,index)=>{
    const steps = ordered(closureFor(role.target));
    const effortPoints = effortFor(steps);
    const humanGates = gates.filter(g=>steps.includes(g)).map(g=>nodeMap.get(g).gate);
    return {
      id:role.id,
      label:role.label,
      target:role.target,
      round,
      approach:role.variants[(round+index)%role.variants.length],
      steps,
      effortPoints,
      withinDeclaredBudget:effortPoints<=effortBudget,
      humanGates,
      disposition:humanGates.length ? "HOLD — independent human evidence required" :
        effortPoints>effortBudget ? "OVER DECLARED EFFORT BUDGET" : "DRAFTABLE ONLY — NOT EXECUTED",
      possiblePath:shortestPath(planningGraph(),"goal",role.target)
    };
  });
  return {
    schema:"abundent/first-inch-six-up/v1",
    input:{goal:card.goal,have:have.trim(),needs:needs.trim(),kind,effortBudget,round},
    units:"Declared abstract planning-effort points; not hours, money, or real-world estimates.",
    candidates,
    rules:["Six distinct structural roles, not AI-generated answers.",
      "HOLD gates cannot be satisfied by browser text, a graph path, or a model guess.",
      "A planning graph shows possibilities; only people can grant real permission."]
  };
}
export function candidateParetoFrontier(sixUp) {
  const candidates=sixUp.candidates;
  return candidates.filter(b=>!candidates.some(a=>{
    if(a.id===b.id || a.effortPoints>b.effortPoints)return false;
    const covers = b.steps.every(s=>a.steps.includes(s));
    return covers && (a.effortPoints<b.effortPoints || a.steps.length>b.steps.length);
  })).map(x=>x.id);
}
export function keepCandidate(sixUp, id) {
  if(sixUp?.schema!=="abundent/first-inch-six-up/v1") throw new TypeError("Invalid six-up.");
  const candidate=sixUp.candidates.find(x=>x.id===id);
  if(!candidate || !roleMap.has(id))throw new RangeError("Cannot KEEP an unknown candidate.");
  return Object.freeze({
    schema:"abundent/first-inch-kept-draft/v1",
    status:"KEPT FOR PRIVATE DRAFT CONTINUATION — NO EXECUTION AUTHORITY",
    goal:sixUp.input.goal,
    available:sixUp.input.have||"Not declared",
    missing:sixUp.input.needs||"Not declared",
    selected:{...candidate,steps:[...candidate.steps],humanGates:[...candidate.humanGates]},
    reminder:"KEEP authorizes only this local draft's continuation. It does not grant human consent, partner status or a real trial."
  });
}
export function keptText(kept) {
  if(kept?.schema!=="abundent/first-inch-kept-draft/v1") throw new TypeError("Invalid kept draft.");
  const c=kept.selected;
  return [
    "ABUNDENT / FIRST-INCH-002 / KEPT PLANNING DRAFT",
    kept.status,"",
    "GOAL: "+kept.goal,
    "DECLARED RESOURCES: "+kept.available,
    "DECLARED UNKNOWNS: "+kept.missing,
    "CHOSEN PATH: "+c.label+" / variant "+(c.round+1),
    "SUGGESTION: "+c.approach,
    "DEPENDENCY CLOSURE: "+c.steps.join(" -> "),
    "DECLARED EFFORT POINTS: "+c.effortPoints,
    "BUDGET PASS: "+c.withinDeclaredBudget,
    "STATUS: "+c.disposition,
    "UNFULFILLED HUMAN GATES: "+(c.humanGates.join("; ")||"None required to prepare this draft"),
    "",
    kept.reminder
  ].join("\n");
}
export function verifySixUp(sixUp) {
  if(sixUp?.schema!=="abundent/first-inch-six-up/v1")return false;
  try{return JSON.stringify(generateSixUp(sixUp.input))===JSON.stringify(sixUp);}
  catch{return false;}
}
