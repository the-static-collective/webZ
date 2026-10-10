// Public-only static export. No docs, tests, labs, census, private inputs or env.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {STATIC_PATHS} from './render-field.mjs';
import {fieldArtifacts} from './build-field.mjs';
const root=new URL('../',import.meta.url),output=new URL('dist/',root);
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
await fieldArtifacts(true);
const commit=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
// Tracked shell drift cannot masquerade as an immutable committed release.
const paths=[...new Set([...STATIC_PATHS.map(p=>p===''||p.endsWith('/')?p+'index.html':p),'sw.js'])].sort();
const files=[];
for(const path of paths){
 const bytes=await readFile(new URL(path,root));
 const committed=execFileSync('git',['show',commit+':'+path],{cwd:root});
 if(!bytes.equals(committed))throw Error('UNCOMMITTED_RELEASE_ASSET: '+path);
 files.push({path,sha256:sha(bytes),bytes:bytes.length});
}
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const file of files){const url=new URL(file.path,output);await mkdir(new URL('./',url),{recursive:true});await writeFile(url,await readFile(new URL(file.path,root)));}
const receipt=JSON.parse(await readFile(new URL('field/public-field-receipt.json',root)));
const provenance=JSON.parse(await readFile(new URL('field/navigation-provenance.json',root)));
const manifest={schema:'webz/immutable-release/v0',sourceCommit:commit,sourceTree:tree,fieldHash:receipt.fieldHash,observationsHash:receipt.observationsHash,navigation:provenance,boundary:'Public first-party static code and committed inspection catalog only. No remote effects, visitor inputs, census admission or experimental routes.',files};
await writeFile(new URL('release.json',output),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({commit,tree,files:files.length,releaseHash:sha(JSON.stringify(manifest,null,2)+'\n')},null,2));
