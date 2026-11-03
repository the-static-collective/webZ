#!/usr/bin/env node
/* Independent, read-only compiler for a previously exported Blueprint Bridge draft. */
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const C=require('./blueprint_core.js');
if(process.argv.length!==4){console.error('Usage: node convert_cartridge.cjs <draft-cartridge.json> <output-dir>');process.exit(2);}
const source=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
try{
  if(fs.statSync(source).size>300000)throw Error('Cartridge is too large');
  const raw=JSON.parse(fs.readFileSync(source,'utf8'));
  if(raw.schema!==C.CARTRIDGE||raw.status!=='DRAFT_REQUIRES_OPERATOR_REVIEW')throw Error('Not an unapproved Blueprint Bridge draft');
  C.validated(raw.plan); const compiled=C.commands(raw.plan);
  fs.mkdirSync(out,{recursive:true});
  const filename=path.join(out,'abundent_blueprint_DRAFT.mcfunction');
  fs.writeFileSync(filename,compiled.text,'utf8');
  const digest=crypto.createHash('sha256').update(compiled.text).digest('hex');
  const rec={schema:'abundent.blueprint.compilation/v1',status:'HOLD_USER_REVIEW',source_cartridge:path.basename(source),sha256:digest,
    ...compiled.summary,limits:'Generated command draft only; no game-world readback or physical verification'};
  fs.writeFileSync(path.join(out,'compilation_receipt.json'),JSON.stringify(rec,null,2)+'\n','utf8');
  console.log(JSON.stringify(rec,null,2));
}catch(e){console.error('Refused:',e.message);process.exit(1);}
