// Deliberately no network client, repository discovery or admission issuer.
import {readFile} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {census,delta,foundingSnapshot,fragmentHash} from '../app/field-lifecycle.mjs';
const root=new URL('../',import.meta.url);
export async function readInputs(filename){
 const base=dirname(resolve(filename)),manifest=JSON.parse(await readFile(filename,'utf8'));
 if(manifest.schema!=='webz/explicit-census-inputs/v0'||!Array.isArray(manifest.inputs)||manifest.inputs.length>64||Object.keys(manifest).sort().join()!=='inputs,schema')throw Error('EXPLICIT_INPUT_REQUIRED');
 const fragments=[];const seen=new Set();
 for(const input of manifest.inputs){
  if(Object.keys(input).sort().join()!=='input,patchHash,prUrl,sourceFile')throw Error('INVALID_INPUT_DESCRIPTOR');
  const safe=p=>{if(typeof p!=='string'||!p||p.includes('..')||! /^[a-zA-Z0-9_.\/-]+$/.test(p)||p.startsWith('/'))throw Error('LOCAL_INPUT_PATH_REQUIRED');const target=resolve(base,p);if(relative(base,target).startsWith('..'))throw Error('OFF_INPUT_BASE');return target;};
  const f=JSON.parse(await readFile(safe(input.input),'utf8'));await fragmentHash(f);
  if(seen.has(f.fragmentId))throw Error('DUPLICATE_FRAGMENT');seen.add(f.fragmentId);
  const bytes=await readFile(safe(input.sourceFile));const actual='sha256:'+createHash('sha256').update(bytes).digest('hex');if(actual!==f.verification.contentHash)throw Error('SOURCE_CONTENT_MISMATCH');
  fragments.push(f);
 }
 return fragments;
}
export async function runCensus(inputFile,previous){
 const fragments=await readInputs(inputFile);const c=await census(fragments,previous);return {census:c,delta:await delta(previous,c)};
}
export async function readFounding(){return foundingSnapshot(JSON.parse(await readFile(new URL('field/public-field.json',root),'utf8')),JSON.parse(await readFile(new URL('field/source-observations.json',root),'utf8')));}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const input=process.argv[2];if(!input)throw Error('Supply an explicit local inputs.json; no discovery default.');
 const previous=process.argv[3]?JSON.parse(await readFile(process.argv[3],'utf8')):await readFounding();
 const result=await runCensus(input,previous);
 console.log(JSON.stringify(result,null,2));
}
