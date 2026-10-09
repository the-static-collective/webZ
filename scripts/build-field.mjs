import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fieldReceipt} from '../app/field.mjs';
import {renderField,renderWorker,STATIC_PATHS,workerVersion} from './render-field.mjs';
const root=new URL('../',import.meta.url);
export async function fieldArtifacts(check=false){
 const field=JSON.parse(await readFile(new URL('field/public-field.json',root),'utf8'));
 const observations=JSON.parse(await readFile(new URL('field/source-observations.json',root),'utf8'));
 const receipt=await fieldReceipt(field,observations);
 async function output(path,content){
  const url=new URL(path,root);
  if(check){if(await readFile(url,'utf8')!==content)throw Error('STALE_GENERATED_ASSET: '+path);}
  else await writeFile(url,content);
 }
 await output('field/public-field-receipt.json',JSON.stringify(receipt,null,2)+'\n');
 await output('field/index.html',renderField(field,observations,receipt));
 const targets=field.worlds.flatMap(w=>[...(w.publicSurface.mode==='LOCAL_ROUTE'?[w.publicSurface.target]:[]),...w.doors.filter(d=>d.availability==='AVAILABLE'&&d.effectClass!=='EXTERNAL_NAVIGATION').map(d=>d.target)]);
 for(const route of targets)await readFile(new URL(route+'index.html',root));
 const assets=[];for(const path of STATIC_PATHS)assets.push([path,await readFile(new URL(path.endsWith('/')||path===''?path+'index.html':path,root))]);
 await output('sw.js',renderWorker(workerVersion(assets)));
 return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))console.log(JSON.stringify(await fieldArtifacts(process.argv.includes('--check')),null,2));
