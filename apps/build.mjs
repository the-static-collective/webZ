import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));const out=join(root,'dist');
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const file of ['index.html','main.mjs','manifest.mjs','style.css'])cpSync(join(root,file),join(out,file));
// Keep this public, browser-only Commons room in the same portable static artifact.
// The source is local to this repository: no service credentials or remote network.
cpSync(join(root,'../commons'),join(out,'commons'),{recursive:true});
// Include the Jubilee Circuit public field kit on the same verified Abundent hostname.
cpSync(join(root,'../jubilee'),join(out,'jubilee'),{recursive:true});
console.log('Abundent Switchboard: static dist built (no accounts, API keys or shared database).');
