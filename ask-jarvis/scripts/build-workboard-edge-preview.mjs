// Build the standalone, public, read-only Workboard preview from canonical source.
// Run in ask-jarvis/: node scripts/build-workboard-edge-preview.mjs
// The generated site.ts is bundled alongside workboard-preview/index.ts on deployment.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,posix} from 'node:path';
const here=resolve(import.meta.dirname,'..');
const base='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/workboard-preview';
const paths=[
 ['/board/','public/board/index.html'],
 ['/board/app.mjs','public/board/app.mjs'],
 ['/board/model.mjs','public/board/model.mjs'],
 ['/board/history.mjs','public/board/history.mjs'],
 ['/role-seeds.mjs','public/role-seeds.mjs'],
 ['/campfire/model.mjs','public/campfire/model.mjs'],
 ['/table-bridge.mjs','public/table-bridge.mjs'],
 ['/cafe.mjs','public/cafe.mjs']
];
const src=Object.fromEntries(paths.map(([url,file])=>[url,readFileSync(resolve(here,file),'utf8')]));
const target=s=>base+'?asset='+encodeURIComponent(s.slice(1));
let html=src['/board/'];
html=html.replaceAll('src="/board/app.mjs"','src="'+target('/board/app.mjs')+'"')
 .replaceAll('src="/board/history.mjs"','src="'+target('/board/history.mjs')+'"');
html=html.replaceAll('href="/board/"','href="'+base+'"');
for(const name of ['campfire','roles','tables','contact','doors','weave','town','gather'])
 html=html.replaceAll('href="/'+name+'/"','href="https://abundent.org/'+name+'/"');
html=html.replaceAll('href="/"','href="https://abundent.org/"');
src['/board/']=html;
for(const [path,js] of Object.entries(src)){
 if(!path.endsWith('.mjs'))continue;
 let result=js;
 for(const match of js.matchAll(/from ['"]([^'"]+)['"]/g)){
  const from=match[1];if(!from.startsWith('.'))continue;
  const normalized=posix.resolve(posix.dirname(path),from);
  if(!(normalized in src))throw Error('Missing module '+normalized);
  result=result.replace("from '"+from+"'","from '"+target(normalized)+"'");
 }
 src[path]=result;
}
src['/board/model.mjs']=src['/board/model.mjs'].replace(
 "url.pathname='/board/';","url.pathname='/functions/v1/workboard-preview';");
src['/board/app.mjs']=src['/board/app.mjs']
 .replace("new URL('/roles/',location.href)","new URL('https://abundent.org/roles/')")
 .replace("$('link-table').href='/tables/';","$('link-table').href='https://abundent.org/tables/';")
 .replace("location.assign('/contact/');","location.assign('https://abundent.org/contact/');");
const out=resolve(here,'database/supabase/functions/workboard-preview/site.ts');
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,'export const ASSETS = '+JSON.stringify(src)+';\n');
console.log(JSON.stringify({output:out,files:Object.keys(src).length,bytes:JSON.stringify(src).length}));
