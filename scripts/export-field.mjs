// Host-neutral export copies the verified public allowlist, never census inputs.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {fieldArtifacts} from './build-field.mjs';
import {STATIC_PATHS,assetVersion} from './render-field.mjs';
if(existsSync(new URL('../TEST_FIXTURE_ONLY',import.meta.url)))throw Error('SYNTHETIC_TEST_SITE_NOT_EXPORTABLE');
await fieldArtifacts(true);
const output=process.argv[2];if(!output)throw Error('EXPLICIT_EXPORT_DIRECTORY_REQUIRED');
const root=fileURLToPath(new URL('../',import.meta.url)),dest=resolve(output);
if(dest===resolve(root)||!relative(root,dest).startsWith('..'))throw Error('EXPORT_OUTSIDE_REPOSITORY_REQUIRED');
await mkdir(dest,{recursive:true});if((await readdir(dest)).length)throw Error('EMPTY_EXPORT_DIRECTORY_REQUIRED');
const paths=[...new Set([...STATIC_PATHS.map(p=>!p||p.endsWith('/')?p+'index.html':p),'sw.js'])];
const assets=[];for(const p of paths){if(p.includes('..')||p.startsWith('/')||p.startsWith('census/'))throw Error('PUBLIC_EXPORT_BOUNDARY');const bytes=await readFile(new URL(p,new URL('../',import.meta.url)));const target=resolve(dest,p);await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,bytes);assets.push([p,bytes]);}
console.log(JSON.stringify({schema:'webz/public-static-export-receipt/v0',files:paths.length,assetHash:'sha256:'+assetVersion(assets),authority:'NONE',scope:'Verified public static files only; deployable, not deployed.'},null,2));
