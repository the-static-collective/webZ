#!/usr/bin/env node
/* Local-only offline witness generator / verifier; never connects to provider services. */
import {readFile,stat} from 'node:fs/promises';
import {buildWitness,verifyWitness} from './name-orchard-001-core.mjs';

async function run(args){
 const [action,...rest]=args;
 if(action==='demo'){
  let file=null;
  if(rest.length===2&&rest[0]==='--file')file=rest[1];
  else if(rest.length!==0)throw Error('USAGE_DEMO_OPTIONAL_FILE');
  let bytes=null;
  if(file){
   const details=await stat(file);
   if(!details.isFile()||details.size>32*1024*1024)throw Error('FILE_NOT_REGULAR_OR_TOO_LARGE');
   bytes=await readFile(file);
  }
  process.stdout.write(JSON.stringify(buildWitness(bytes),null,2)+'\n');
 }else if(action==='verify'){
  if(rest.length!==1)throw Error('USAGE_VERIFY_FILE');
  const info=await stat(rest[0]);
  if(!info.isFile()||info.size>262144)throw Error('BUNDLE_TOO_LARGE');
  const parsed=JSON.parse(await readFile(rest[0],'utf8'));
  process.stdout.write(JSON.stringify(verifyWitness(parsed),null,2)+'\n');
 }else{
  throw Error('USAGE: npm run name:demo -- [--file "/path/to/song.mp3"] > witness.json; npm run name:verify -- witness.json');
 }
}
run(process.argv.slice(2)).catch(err=>{process.stderr.write('HOLD: '+err.message+'\n');process.exitCode=1});
