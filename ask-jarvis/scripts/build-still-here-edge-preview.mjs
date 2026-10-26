// STILL-HERE-028: generate the static, read-only Supabase porch preview assets
// from canonical public/still-here sources. Run inside ask-jarvis/ with Node 22+.
// Output is intentionally git-ignored build output for manual review/deployment.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const here=resolve(import.meta.dirname,'..');
const root='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/porch-doors';
const path=resolve(here,'database/supabase/functions/porch-doors/site.ts');
const load=fn=>readFileSync(resolve(here,'public/still-here',fn),'utf8');
const assets={'index.html':load('index.html'),'app.mjs':load('app.mjs'),'model.mjs':load('model.mjs')};
const original='<script type="module" src="./app.mjs"></script>';
if(!assets['index.html'].includes(original))throw Error('MISSING_SAFE_ENTRY');
assets['index.html']=assets['index.html'].replace(original,
 '<script type="module" src="'+root+'?asset=app.mjs"></script>');
const imp="from './model.mjs'";
if(!assets['app.mjs'].includes(imp))throw Error('MISSING_LOCAL_MODEL_IMPORT');
assets['app.mjs']=assets['app.mjs'].replace(imp,"from '"+root+"?asset=model.mjs'");
if(/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|indexedDB/.test(assets['app.mjs']))
 throw Error('NO_NETWORK_OR_BROWSER_STORAGE_ON_SURVIVOR_DOOR');
mkdirSync(dirname(path),{recursive:true});
writeFileSync(path,'export const ASSETS = '+JSON.stringify(assets)+';\n','utf8');
console.log(JSON.stringify({path,files:Object.keys(assets),bytes:JSON.stringify(assets).length}));
