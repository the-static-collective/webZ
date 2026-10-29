#!/usr/bin/env node
// OFFLINE TRAINING PROOF ONLY. Creates fictional keys and public-only signed parcels.
// Node >=22. No endpoint, network, contacts, survivor data, or external file overwrite.
import {readFile,writeFile} from "node:fs/promises";
import {createRelationalInheritanceProof,verifyRelationalInheritanceProof} from "../bridge/first/relational-inheritance.mjs";
const [action,file]=process.argv.slice(2);
if(!["build","verify"].includes(action)||!file||process.argv.length!==4){
  console.error("Usage: node scripts/relational-inheritance.mjs build|verify ./public-demo.json");
  process.exitCode=2;
}else{
 try{
  if(action==="build"){
   const packet=await createRelationalInheritanceProof();
   const report=await verifyRelationalInheritanceProof(packet);
   await writeFile(file,JSON.stringify(packet,null,2)+"\n",{encoding:"utf8",flag:"wx"});
   console.log(JSON.stringify({file,stage:"BUILT_PUBLIC_FAKE_KEYS_NO_HUMAN_CLAIM",review:report},null,2));
  }else{
   const raw=await readFile(file,"utf8");
   if(raw.length>200000)throw Error("Oversized public demo rejected");
   const report=await verifyRelationalInheritanceProof(JSON.parse(raw));
   console.log(JSON.stringify(report,null,2));
  }
 }catch(err){console.error(String(err));process.exitCode=1;}
}
