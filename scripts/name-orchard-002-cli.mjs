#!/usr/bin/env node
/* No network/SMS API. Writes text frames on stdout, reads files selected on CLI. */
import {readFile,stat} from 'node:fs/promises';
import {checkClaim} from './name-orchard-001-core.mjs';
import {packClaim,assembleTexts,postcard} from './name-orchard-002-sms.mjs';
async function readBound(path,limit){
 const info=await stat(path);
 if(!info.isFile()||info.size<=0||info.size>limit)throw Error('FILE_NOT_ALLOWED');
 return readFile(path,'utf8');
}
async function run(){
 const [action,filename,...extra]=process.argv.slice(2);
 if(extra.length)throw Error('TOO_MANY_ARGUMENTS');
 if(action==='postcard'&&!filename){process.stdout.write(postcard()+'\n');return}
 if(!filename)throw Error('INPUT_FILE_REQUIRED');
 if(action==='pack'){
  const json=JSON.parse(await readBound(filename,262144));
  if(json.schema!=='webz/name-orchard-witness/v1'||!Array.isArray(json.claims)||json.claims.length!==2)
   throw Error('WITNESS_REQUIRED');
  checkClaim(json.claims[0]);
  process.stdout.write(packClaim(json.claims[0]).join('\n')+'\n');
 }else if(action==='verify'){
  const result=assembleTexts(await readBound(filename,10000));
  if(result.state!=='SIGNED_CLAIM_VERIFIED'){
   throw Error('HOLD_MISSING_PARTS:'+result.missing.join(','));
  }
  process.stdout.write(JSON.stringify({state:result.state,tag:result.tag,
   parts:result.total,name:result.claim.body.name,source:result.claim.body.subject.source,
   signer:result.claim.signer.id,warning:result.warning},null,2)+'\n');
 }else throw Error('USAGE: npm run name:sms -- postcard | pack witness.json | verify sms.txt');
}
run().catch(e=>{process.stderr.write('HOLD: '+(e?.message||'INVALID')+'\n');process.exitCode=1});
