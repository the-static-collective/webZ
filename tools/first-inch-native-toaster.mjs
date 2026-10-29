#!/usr/bin/env node
// Review-only native source witness: executes original Toaster move-deck mechanically.
// Does NOT turn music-video mutations into planning authority or run a renderer.
import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {resolve,join} from "node:path";
import {generateSixUp} from "../start/plan-ecology.mjs";

const PIN="3652c2a96b6b287cda316d1c92daadf7c7417eaf";
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=="--toaster"){
  console.error("Usage: node tools/first-inch-native-toaster.mjs --toaster /path/to/clean/toaster");
  process.exit(2);
}
const dir=resolve(args[1]);
function git(args) {
  const p=spawnSync("git",args,{cwd:dir,encoding:"utf8",shell:false,timeout:20000,maxBuffer:1024*1024});
  if(p.status!==0||p.error)throw Error("Git inspection failed.");
  return p.stdout.trim();
}
try {
  const sha=git(["rev-parse","HEAD"]);
  if(sha!==PIN)throw Error("Toaster source HEAD does not match exact pin: "+sha);
  if(git(["status","--porcelain","--","src/full-measure/src/candidate-move-deck.cjs","src/full-measure/src/renderer/candidate-move-deck.js"])!=="")
    throw Error("Toaster move-deck source has uncommitted modifications.");
  const require=createRequire(import.meta.url);
  const {dealCandidateMoves,MOVE_DECK_POLICY}=require(join(dir,"src/full-measure/src/candidate-move-deck.cjs"));
  if(MOVE_DECK_POLICY!=="candidate-move-deck/v1"||typeof dealCandidateMoves!=="function")
    throw Error("Unexpected source-native Toaster contract.");

  // Deliberately fictional input. A source-native proposal is a move in a
  // music-video candidate ecology, NOT a computed community work plan.
  const family=generateSixUp({
    goal:"Fictional community art table with an imaginary venue",
    kind:"community",have:"one fictional folding table",
    needs:"fictional permission"
  });
  const candidates=family.candidates.map((candidate,index)=>({
    index,
    scoreAddress:"planning-draft:sha256:"+createHash("sha256").update(JSON.stringify([
      family.schema,candidate.id,candidate.approach,candidate.steps
    ])).digest("hex"),
    signature:candidate.id+" (synthetic planning label)",
    toastmoodLane:{id:candidate.id.toLowerCase(),name:candidate.label}
  }));
  const spec={familyHash:"planning-demo:sha256:"+createHash("sha256")
    .update(JSON.stringify(candidates)).digest("hex"),selectedIndex:2,dealIndex:0,
    locks:[],candidates};
  const deal=dealCandidateMoves(spec);
  const replay=dealCandidateMoves(structuredClone(spec));
  if(JSON.stringify(deal)!==JSON.stringify(replay))throw Error("Toaster replay changed identity.");
  if(deal.proposals.length!==6 ||
    deal.proposals.map(p=>p.kind).join(",")!=="expand,mutate,converge,stomp,cross,cross" ||
    deal.proposals.some(p=>!/^candidate-move:sha256:[a-f0-9]{64}$/.test(p.address)))
    throw Error("Toaster source-native move-deck invariant failed.");
  const next=dealCandidateMoves({...spec,dealIndex:1});
  if(next.dealAddress===deal.dealAddress)throw Error("Native re-deal failed to change address.");
  const result={
    schema:"abundent/first-inch-native-toaster-witness/v1",
    sourceCommit:sha,sourcePolicy:MOVE_DECK_POLICY,
    status:"PASS — NATIVE MOVE-DECK MECHANICS, NOT A PLANNING OR PARTNER VERDICT",
    selectedSyntheticRole:family.candidates[2].id,
    dealAddress:deal.dealAddress,
    proposals:deal.proposals.map(p=>({kind:p.kind,address:p.address,available:p.available!==false})),
    changedAddressOnRedraw:true,
    qualification:"Original Toaster code executed on a six-role fictional adapter. Actual Toaster outputs retain their original media meaning. No planning authority, render or participant contact."
  };
  process.stdout.write(JSON.stringify(result,null,2)+"\n");
} catch(e){
  console.error("HOLD: "+e.message);
  process.exit(1);
}
