#!/usr/bin/env node
// Operator-only, optional, source-pinned native Dogram cross-check.
// Intentionally not imported into the browser, CI, or normal portal.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { makeDogramSpecimen, compareAblation } from "../start/plan-ecology.mjs";

const DOGRAM_EXACT_COMMIT = "551b5f9df18f17ec69b452ddcdff01718e0ff771";
const args = process.argv.slice(2);
if(args.length!==2 || args[0]!=="--dogram"){
  console.error("Usage: node tools/first-inch-native-dogram.mjs --dogram /path/to/clean/Dogram");
  process.exit(2);
}
const root=resolve(args[1]);
const run=(binary,argv,options={})=>{
  const result=spawnSync(binary,argv,{
    cwd:root,encoding:"utf8",timeout:20000,maxBuffer:1024*1024,shell:false,...options
  });
  if(result.error || result.status!==0) throw new Error(binary+" failed: "+String(result.error||result.stderr).slice(0,500));
  return result.stdout.trim();
};
try{
  const head=run("git",["rev-parse","HEAD"]);
  if(head!==DOGRAM_EXACT_COMMIT)throw new Error("Dogram source pin differs: "+head);
  if(run("git",["status","--porcelain","--","dogram","pyproject.toml","examples"])!=="")
    throw new Error("Source tree has uncommitted Dogram code changes.");
  const specimen=makeDogramSpecimen("approval");
  const raw=run("python3",["-m","dogram.cli","-"],{input:JSON.stringify(specimen)+"\n"});
  const receipt=JSON.parse(raw);
  if(receipt.schema!=="dogram.receipt/v0" || receipt.status!=="OK" ||
      receipt.operator!=="ablate" || receipt.operator_version!==1 ||
      receipt.specimen_id!==specimen.specimen_id)
    throw new Error("Dogram returned an unexpected receipt.");
  const comparison=compareAblation("approval");
  for(const local of comparison.trials){
    const native=receipt.result.requested_targets.find(x=>x.target===local.target && x.source==="goal");
    if(!native || native.reachable_before!==(local.graphPathBefore!==null) ||
       native.reachable_after!==(local.graphPathAfter!==null))
      throw new Error("Dogram disagrees with the independent browser graph calculation.");
  }
  const output={
    schema:"abundent/first-inch-native-dogram-check/v1",
    status:"PASS — GRAPH CALCULATION ONLY, NOT HUMAN AUTHORITY",
    dogramCommit:head,
    specimenId:specimen.specimen_id,
    nativeStatus:receipt.status,
    nativeGraph:receipt.result.requested_targets,
    independentAndRequirement:comparison.trials.map(x=>({target:x.target,allPrerequisitesAfter:x.allPrerequisitesAfter})),
    claim:"An independent native Dogram graph witness; no consent, practical feasibility, or real-world event verified."
  };
  process.stdout.write(JSON.stringify(output,null,2)+"\n");
}catch(error){
  console.error("HOLD: "+error.message);
  process.exit(1);
}
