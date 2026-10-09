// Synthetic fixture exists only in a temporary test site. It cannot admit the
// production field. Once a real human-admission file exists, witness that site.
import {cp,mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {seal,reviewIdentity} from '../app/field-lifecycle.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
if(existsSync(join(root,'census/static-web-002/human-admission.json')))execFileSync('python',['tests/moving-field-browser.py'],{cwd:root,stdio:'inherit'});
else{
 const temporary=await mkdtemp(join(tmpdir(),'webz-moving-preview-')),site=join(temporary,'site');
 try{
  await cp(root,site,{recursive:true,filter:p=>!p.includes('/.git')&&!p.includes('/node_modules')&&!p.includes('/__pycache__')});
  await writeFile(join(site,'TEST_FIXTURE_ONLY'),'Temporary synthetic test site; never export or publish.\n');
  const p=JSON.parse(await readFile(join(site,'census/static-web-002/public-review-proposal.json'),'utf8'));delete p.reviewHash;
  const a={schema:'webz/public-field-admission/v0',...p,authority:{kind:'HUMAN_PUBLIC_FIELD_REVIEW',reference:'SYNTHETIC TEST FIXTURE ONLY. Human public-field admission is pending; no actual human approval asserted.',reviewHash:await reviewIdentity(p),scope:'PUBLIC_REPRESENTATION_ONLY'}};
  await writeFile(join(site,'census/static-web-002/human-admission.json'),JSON.stringify(await seal(a,'admissionHash'),null,2)+'\n');
  execFileSync(process.execPath,['scripts/build-field.mjs'],{cwd:site,stdio:'pipe'});
  // Cold artifact replay and immutable-history refusals run in separate processes.
  execFileSync(process.execPath,['scripts/replay-moving-field.mjs'],{cwd:site,stdio:'pipe'});
  const pointer=JSON.parse(await readFile(join(site,'field/current.json'),'utf8')),immutable=join(site,'field',pointer.path),bytes=await readFile(immutable,'utf8');
  await writeFile(immutable,bytes+' ');let refused=false;try{execFileSync(process.execPath,['scripts/build-field.mjs'],{cwd:site,stdio:'pipe'});}catch(error){refused=String(error.stderr).includes('IMMUTABLE_SNAPSHOT_CONFLICT');}if(!refused)throw Error('IMMUTABLE_OVERWRITE_ACCEPTED');await writeFile(immutable,bytes);
  const originalPath=join(site,'field/public-field.json'),original=await readFile(originalPath,'utf8'),tampered=JSON.parse(original);tampered.worlds[0].label='Retroactive history';await writeFile(originalPath,JSON.stringify(tampered));refused=false;try{execFileSync(process.execPath,['scripts/build-field.mjs'],{cwd:site,stdio:'pipe'});}catch(error){refused=String(error.stderr).includes('FOUNDING_HISTORY_CHANGED');}if(!refused)throw Error('FOUNDING_MUTATION_ACCEPTED');await writeFile(originalPath,original);
  // Even a poisoned stale cache config cannot make a build cache census inputs.
  const cacheConfig=join(site,'scripts/public-field-cache.json'),cachePaths=JSON.parse(await readFile(cacheConfig,'utf8'));await writeFile(cacheConfig,JSON.stringify([...cachePaths,'census/static-web-002/inputs.json']));execFileSync(process.execPath,['scripts/build-field.mjs'],{cwd:site,stdio:'pipe'});if((await readFile(join(site,'sw.js'),'utf8')).includes('census/'))throw Error('CANDIDATE_CACHE_BOUNDARY');execFileSync(process.execPath,['scripts/build-field.mjs','--check'],{cwd:site,stdio:'pipe'});
  execFileSync('python',['tests/moving-field-browser.py'],{cwd:site,stdio:'inherit'});
  const output=join(root,'evidence/static-web-002/review-preview');await mkdir(output,{recursive:true});
  const result=JSON.parse(await readFile(join(site,'evidence/static-web-002/browser/result.json'),'utf8'));result.publicAdmission='PENDING';result.scope='Synthetic fixture preview of the exact review proposal. These screenshots and hashes do not assert public admission.';
  await cp(join(site,'evidence/static-web-002/browser'),output,{recursive:true});await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
 }finally{await rm(temporary,{recursive:true,force:true});}
}
