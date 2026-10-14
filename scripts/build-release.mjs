// Public-only static export. No docs, tests, labs, census, private inputs or env.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {STATIC_PATHS} from './render-field.mjs';
import {fieldArtifacts} from './build-field.mjs';
const root=new URL('../',import.meta.url),output=new URL('dist/',root);
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
await fieldArtifacts(true);
let commit,tree,sourceEntries;
try{commit=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}');}
catch{
 // Git-connected hosts may provide a source archive without .git. Verify it
 // against the exact public Git tree instead of trusting only a build variable.
 commit=process.env.VERCEL_GIT_COMMIT_SHA;
 if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('IMMUTABLE_SOURCE_COMMIT_REQUIRED');
 const get=path=>JSON.parse(execFileSync('curl',['--proto','=https','--max-time','30','--fail','--silent','--show-error','https://api.github.com/repos/the-static-collective/webZ/git/'+path],{maxBuffer:8*1024*1024}));
 const source=get('commits/'+commit);if(source.sha!==commit)throw Error('SOURCE_COMMIT_MISMATCH');
 tree=source.tree.sha;const listing=get('trees/'+tree+'?recursive=1');
 if(listing.sha!==tree||listing.truncated)throw Error('SOURCE_TREE_INCOMPLETE');
 sourceEntries=new Map(listing.tree.filter(e=>e.type==='blob').map(e=>[e.path,e.sha]));
}
// Tracked shell drift cannot masquerade as an immutable committed release.
const paths=[...new Set([...STATIC_PATHS.map(p=>p===''||p.endsWith('/')?p+'index.html':p),'sw.js'])].sort();
const files=[];
for(const path of paths){
 const bytes=await readFile(new URL(path,root));
 if(sourceEntries){
  const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  if(sourceEntries.get(path)!==blob)throw Error('UNCOMMITTED_RELEASE_ASSET: '+path);
 }else{
  const committed=execFileSync('git',['show',commit+':'+path],{cwd:root});
  if(!bytes.equals(committed))throw Error('UNCOMMITTED_RELEASE_ASSET: '+path);
 }
 files.push({path,sha256:sha(bytes),bytes:bytes.length});
}
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const file of files){const url=new URL(file.path,output);await mkdir(new URL('./',url),{recursive:true});await writeFile(url,await readFile(new URL(file.path,root)));}
const receipt=JSON.parse(await readFile(new URL('field/public-field-receipt.json',root)));
const provenance=JSON.parse(await readFile(new URL('field/navigation-provenance.json',root)));
const manifest={schema:'webz/immutable-release/v0',sourceCommit:commit,sourceTree:tree,fieldHash:receipt.fieldHash,observationsHash:receipt.observationsHash,navigation:provenance,boundary:'Public first-party static code and committed inspection catalog only. No remote effects, visitor inputs, census admission or experimental routes.',files};
await writeFile(new URL('release.json',output),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({commit,tree,files:files.length,releaseHash:sha(JSON.stringify(manifest,null,2)+'\n')},null,2));
