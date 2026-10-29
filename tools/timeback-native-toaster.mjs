#!/usr/bin/env node
// TIMEBACK-CREATIVE-001: original Haunted Toaster candidate move-deck calculation.
// This is a creative branching proof with fictional score-like addresses, not a media render.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {join,resolve} from "node:path";
import {threeGifts} from "../apps/arcade/engine.mjs";

const SHA="3652c2a96b6b287cda316d1c92daadf7c7417eaf";
if(process.argv.length!==4||process.argv[2]!=="--toaster")
  throw Error("Usage: node tools/timeback-native-toaster.mjs --toaster /clean/pinned/checkout");
const repo=resolve(process.argv[3]);
function inspect(args){
  const p=spawnSync("git",args,{cwd:repo,encoding:"utf8",timeout:15000,shell:false});
  if(p.status!==0||p.error)throw Error("Source Git inspection failed.");
  return p.stdout.trim();
}
if(inspect(["rev-parse","HEAD"])!==SHA)throw Error("HOLD: exact original Toaster commit required.");
if(inspect(["-c","core.filemode=false","status","--porcelain","--untracked-files=no","--",
  "src/full-measure/src/candidate-move-deck.cjs",
  "src/full-measure/src/renderer/candidate-move-deck.js"]))
  throw Error("HOLD: Toaster original operator bytes have changed.");
const require=createRequire(import.meta.url);
const {MOVE_DECK_POLICY,dealCandidateMoves}=require(join(repo,"src/full-measure/src/candidate-move-deck.cjs"));
if(MOVE_DECK_POLICY!=="candidate-move-deck/v1")throw Error("HOLD: original move-deck policy mismatch.");
const gifts=threeGifts("A fictional cardboard spaceship sings in a library");
const candidates=gifts.flatMap((g,i)=>[0,1].map(variant=>{
 const address=createHash("sha256").update(JSON.stringify({
   synthetic:true,specimen:"TIMEBACK-CREATIVE-001",source:g.artifact,variant
 })).digest("hex");
 return {
   index:i*2+variant,
   signature:g.id+" / fictional source card / variation "+(variant+1),
   scoreAddress:"timeback-synthetic:sha256:"+address,
   toastmoodLane:{id:g.id,name:g.title}
 };
}));
const familyHash="timeback-synthetic-family:sha256:"+createHash("sha256")
  .update(JSON.stringify(candidates.map(x=>x.scoreAddress))).digest("hex");
const input={familyHash,candidates,selectedIndex:0,locks:[],dealIndex:0};
const first=dealCandidateMoves(input);
const replay=dealCandidateMoves(structuredClone(input));
const redeal=dealCandidateMoves({...input,dealIndex:1});
if(JSON.stringify(first)!==JSON.stringify(replay))throw Error("Native deterministic replay failed.");
if(first.proposals.length!==6||first.proposals.map(p=>p.kind).join(",")!=="expand,mutate,converge,stomp,cross,cross")
  throw Error("Unexpected original Toaster move types.");
if(first.dealAddress===redeal.dealAddress||
   first.proposals.some(p=>!/^candidate-move:sha256:[a-f0-9]{64}$/.test(p.address)))
  throw Error("Missing source-addressed original proposals.");
process.stdout.write(JSON.stringify({
 schema:"abundent/timeback-toaster-source-native-mechanics/v1",
 sourceOwner:"the-static-collective/the-haunted-toaster",
 sourceCommit:SHA,sourcePolicy:MOVE_DECK_POLICY,
 experimentalInput:"Fictional Three Bells text adapted to opaque candidate addresses; NOT an accepted VisualScore.",
 actualOriginalOperator:"dealCandidateMoves",
 proposals:first.proposals.map(x=>({kind:x.kind,address:x.address,available:x.available!==false})),
 replayIdentical:true,redealAddressChanged:true,
 renderedVideo:false,recognizedSongInput:false,verifiedCreativeMedia:false,
 qualification:"Original Toaster candidate-move machinery executed; this did not analyze or render a real song."
},null,2)+"\n");
