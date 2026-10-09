import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {FOUNDING_HASH,verifySnapshot,snapshot} from '../app/field-lifecycle.mjs';
import {readFounding,runCensus} from './field-census.mjs';
import {renderMovingField,renderChanges,renderHistory,snapshotPath} from './render-moving-field.mjs';
const root=new URL('../',import.meta.url),json=v=>JSON.stringify(v,null,2)+'\n';
export async function movingArtifacts(check=false){
 const old=await readFounding(),{census:c,delta:d}=await runCensus(new URL('census/static-web-002/inputs.json',root).pathname,old);
 const a=JSON.parse(await readFile(new URL('census/static-web-002/human-admission.json',root),'utf8'));
 if(a.authority?.reference.startsWith('SYNTHETIC')&&!existsSync(new URL('TEST_FIXTURE_ONLY',root)))throw Error('SYNTHETIC_ADMISSION_NOT_PUBLIC');
 const next=await snapshot(old,c,a),receipt={schema:'webz/public-field-lifecycle-receipt/v0',authority:'NONE',foundingFieldHash:FOUNDING_HASH,fieldHash:next.fieldHash,snapshotHash:next.snapshotHash,censusHash:c.censusHash,deltaHash:d.deltaHash,admissionHash:a.admissionHash,candidateFragments:c.observations.length,candidateSubjects:new Set(c.observations.map(o=>o.fragment.subjectId)).size,admittedEntries:next.field.worlds.length,selectedFragments:a.selectedFragmentHashes.length};
 async function output(path,content,immutable=false){const url=new URL(path,root);let existing;try{existing=await readFile(url,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}if(check){if(existing!==content)throw Error('STALE_GENERATED_ASSET: '+path);}else {if(immutable&&existing!==undefined&&existing!==content)throw Error('IMMUTABLE_SNAPSHOT_CONFLICT: '+path);await mkdir(new URL('./',url),{recursive:true});await writeFile(url,content);}}
 await output(snapshotPath(old.snapshotHash),json(old),true);await output(snapshotPath(next.snapshotHash),json(next),true);
 const admissionPath='field/admissions/'+a.admissionHash.slice(7)+'.json';await output(admissionPath,json(a),true);
 await output('field/current.json',json({schema:'webz/public-field-current/v0',snapshotHash:next.snapshotHash,path:'snapshots/'+next.snapshotHash.slice(7)+'.json'}));
 await output('field/lifecycle-receipt.json',json(receipt));await output('field/index.html',renderMovingField(next));await output('field/changes/index.html',renderChanges(next,{fragments:receipt.candidateFragments,subjects:receipt.candidateSubjects}));
 const history=renderHistory(old,next);await output('field/history/index.html',history.index);await output('field/history/founding.html',history.oldPage);
 await output('census/static-web-002/census-and-delta.json',json({census:c,delta:d}));
 const cachePaths=['field/current.json','field/lifecycle-receipt.json','field/changes/','field/history/','field/history/founding.html',snapshotPath(old.snapshotHash),snapshotPath(next.snapshotHash),admissionPath,'app/wayfinding.mjs','app/field-lifecycle.mjs','app/field.mjs',...['fragment','census','delta','admission','snapshot','path','current'].map(name=>'field/contracts/'+name+'.schema.json')];
 await output('scripts/public-field-cache.json',json(cachePaths));
 await verifySnapshot(JSON.parse(await readFile(new URL(snapshotPath(next.snapshotHash),root),'utf8')),old,c,a);
 return {receipt,cachePaths};
}
