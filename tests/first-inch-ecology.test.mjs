import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  NODES, planningGraph, shortestPath, graphWithoutNode, dependencyGateCheck,
  makeDogramSpecimen, compareAblation, generateSixUp, keepCandidate, keptText,
  candidateParetoFrontier, verifySixUp
} from "../start/plan-ecology.mjs";

const input={goal:"Build a small community grocery table",have:"one table",needs:"site permission",kind:"community"};

test("Toaster-inspired six role slots are deterministic and preserve declaration",()=>{
  const a=generateSixUp(input);
  const b=generateSixUp({...input});
  assert.deepEqual(a,b);
  assert.equal(a.candidates.length,6);
  assert.deepEqual(a.candidates.map(x=>x.id),["QUESTION","INVENTORY","DRAFT","REQUEST","TRIAL","REVIEW"]);
  assert.deepEqual(a.candidates.map(x=>x.effortPoints),[1,2,5,3,12,14]);
  assert.equal(a.input.have,"one table");
  assert.equal(a.input.needs,"site permission");
  assert.deepEqual(a.candidates.filter(x=>x.withinDeclaredBudget).map(x=>x.id),
    ["QUESTION","INVENTORY","DRAFT","REQUEST"]);
  assert.equal(a.candidates.find(x=>x.id==="TRIAL").disposition,"HOLD — independent human evidence required");
  assert.deepEqual(a.candidates.find(x=>x.id==="REVIEW").humanGates,
    ["Independent human permission","Independently checked field outcome"]);
  assert.ok(a.units.includes("not hours"));
  assert.ok(verifySixUp(a));
});

test("SCRAPE creates a new exact set without a taste model or an invented resource",()=>{
  const first=generateSixUp(input),second=generateSixUp({...input,round:1});
  assert.notEqual(first.candidates[0].approach,second.candidates[0].approach);
  assert.deepEqual(first.candidates.map(x=>x.steps),second.candidates.map(x=>x.steps));
  assert.deepEqual(first.candidates.map(x=>x.effortPoints),second.candidates.map(x=>x.effortPoints));
  assert.deepEqual(first.input,{...second.input,round:0});
  assert.deepEqual(generateSixUp({...input,round:1}),second);
});

test("Dogram ablate specimen follows the exact public graph operator envelope",()=>{
  const specimen=makeDogramSpecimen("approval");
  assert.deepEqual(Object.keys(specimen).sort(),
    ["assumptions","inputs","metadata","operator","operator_version","schema","specimen_id"]);
  assert.equal(specimen.schema,"dogram.specimen/v0");
  assert.equal(specimen.operator,"ablate");
  assert.equal(specimen.operator_version,1);
  assert.deepEqual(specimen.inputs.target,{kind:"node",node:"approval"});
  assert.equal(new Set(specimen.inputs.graph.nodes).size,NODES.length);
  assert.equal(specimen.inputs.graph.edges.length,
    NODES.reduce((n,x)=>n+x.prerequisites.length,0));
  assert.ok(!JSON.stringify(specimen).includes(input.goal));
});

test("Dogram graph reachability is not AND-dependency readiness or consent",()=>{
  const g=planningGraph(), after=graphWithoutNode(g,"approval");
  assert.ok(shortestPath(g,"goal","trial"));
  // The *other* path through the draft still reaches trial graph-theoretically.
  assert.ok(shortestPath(after,"goal","trial"));
  // BUT the conjunctive prerequisite 'approval' is absent.
  assert.equal(dependencyGateCheck("trial","approval"),false);
  assert.equal(dependencyGateCheck("review","approval"),false);
  assert.equal(dependencyGateCheck("request","approval"),true);
  const report=compareAblation();
  assert.equal(report.trials[0].allPrerequisitesAfter,false);
  assert.ok(report.trials[0].graphPathAfter);
  assert.ok(report.note.includes("not sufficient"));
});

test("Pareto filtering keeps incomparable objectives; does not invent a winner",()=>{
  const p=generateSixUp(input);
  assert.deepEqual(candidateParetoFrontier(p),
    ["QUESTION","INVENTORY","DRAFT","REQUEST","TRIAL","REVIEW"]);
});

test("KEEP is only a verifiable specific private draft, never authority",()=>{
  const six=generateSixUp(input);
  const kept=keepCandidate(six,"TRIAL");
  const text=keptText(kept);
  assert.match(kept.status,/NO EXECUTION AUTHORITY/);
  assert.match(text,/HOLD — independent human evidence required/);
  assert.match(text,/one table/);
  assert.match(text,/site permission/);
  assert.throws(()=>keepCandidate(six,"MADE_UP"),RangeError);
  const corrupt=structuredClone(six);
  corrupt.candidates.find(c=>c.id==="TRIAL").humanGates=[];
  assert.equal(verifySixUp(corrupt),false);
  assert.throws(()=>keepCandidate(corrupt,"TRIAL"),TypeError);
});

test("refuses oversized input, impossible budget, invalid round and unknown graph cuts",()=>{
  assert.throws(()=>generateSixUp({...input,effortBudget:0}),RangeError);
  assert.throws(()=>generateSixUp({...input,effortBudget:51}),RangeError);
  assert.throws(()=>generateSixUp({...input,effortBudget:2.4}),RangeError);
  assert.throws(()=>generateSixUp({...input,round:-1}),RangeError);
  assert.throws(()=>generateSixUp({...input,round:3}),RangeError);
  assert.throws(()=>makeDogramSpecimen("ghost"),RangeError);
  assert.throws(()=>generateSixUp({...input,goal:"no"}),RangeError);
  const a=generateSixUp({...input,have:null,needs:null});
  assert.equal(a.input.have,"");
});

test("advanced mechanism is disclosed rather than replacing the simple doorway",()=>{
  const page=readFileSync(new URL("../start/index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../start/app.mjs",import.meta.url),"utf8");
  assert.ok(page.indexOf("Make a first-step card")<page.indexOf("Explore six possible approaches"));
  assert.match(page,/<details id="planning-lab"/);
  assert.match(page,/not time or money estimates/);
  assert.match(page,/Save Dogram graph-ablation specimen/);
  assert.doesNotMatch(app,/\bfetch\s*\(|localStorage|sessionStorage|sendBeacon/);
  assert.doesNotMatch(app,/innerHTML\s*=/);
});
