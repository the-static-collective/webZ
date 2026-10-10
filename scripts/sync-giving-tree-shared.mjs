#!/usr/bin/env node
// Derive Edge-internal portable modules from browser-owned protocol sources.
// Run with --check in CI: server/visitor packet rules must be byte-equivalent.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const from=[
 ['experiments/harmony-grove-001/engine.mjs','engine.mjs'],
 ['experiments/harmony-grove-001/gift.mjs','gift.mjs'],
 ['experiments/harmony-grove-001/commons/contract.mjs','contract.mjs'],
 ['experiments/harmony-grove-001/commons/service.mjs','service.mjs']
];
for(const [source,target] of from){
 const targetUrl=new URL('supabase/functions/_shared/giving-tree/'+target,root);
 let expected=await readFile(new URL(source,root),'utf8');
 if(target==='contract.mjs')expected=expected.replace("from '../gift.mjs'","from './gift.mjs'");
 if(process.argv.includes('--check')){
  const actual=await readFile(targetUrl,'utf8');if(actual!==expected)throw Error('EDGE_SHARED_DRIFT: '+target);
 }else{await mkdir(new URL('./',targetUrl),{recursive:true});await writeFile(targetUrl,expected);}
}
console.log('Giving Tree shared protocol verified (4 modules).');
