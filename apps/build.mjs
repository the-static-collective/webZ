import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));const out=join(root,'dist');
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const file of ['index.html','main.mjs','manifest.mjs','style.css'])cpSync(join(root,file),join(out,file));
console.log('Abundent Switchboard: static dist built (no accounts, API keys or shared database).');
