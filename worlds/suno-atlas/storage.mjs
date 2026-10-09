/* Optional browser-local IndexedDB. Never silently saves imported songs. */
import {validateCatalog} from './model.mjs';
const DB='webz-suno-atlas-001',TABLE='named-snapshots',MAX_SNAPSHOTS=24;
export const snapshotName=x=>typeof x==='string'&&x.trim()===x&&x.length>=1&&x.length<=60&&!/[<>\u0000-\u001f]/.test(x);
function open(){
 if(typeof indexedDB==='undefined')return Promise.reject(Error('INDEXEDDB_UNAVAILABLE'));
 return new Promise((resolve,reject)=>{
  const q=indexedDB.open(DB,1);
  q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(TABLE))q.result.createObjectStore(TABLE,{keyPath:'name'})};
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('INDEXEDDB_OPEN_FAILED'));
 });
}
async function query(mode,work){
 const db=await open();
 try{
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction(TABLE,mode),store=tx.objectStore(TABLE);
   let result;tx.oncomplete=()=>resolve(result);
   tx.onerror=()=>reject(Error('SNAPSHOT_TRANSACTION_FAILED'));
   tx.onabort=()=>reject(Error('SNAPSHOT_TRANSACTION_ABORTED'));
   try{work(store,x=>result=x)}catch(err){tx.abort();reject(err)}
  });
 }finally{db.close()}
}
export const names=()=>query('readonly',(store,set)=>{
 const r=store.getAllKeys();r.onsuccess=()=>set(r.result.slice().sort());
});
export async function saveNamed(name,catalog){
 if(!snapshotName(name))throw Error('SNAPSHOT_NAME_INVALID');
 validateCatalog(catalog);
 const all=await names();
 if(all.length>=MAX_SNAPSHOTS&&!all.includes(name))throw Error('SNAPSHOT_QUOTA');
 await query('readwrite',(store)=>{store.put({name,catalog:structuredClone(catalog),schema:'webz/suno-atlas-local-snapshot/v0'})});
 return name;
}
export async function loadNamed(name){
 if(!snapshotName(name))throw Error('SNAPSHOT_NAME_INVALID');
 const row=await query('readonly',(store,set)=>{const r=store.get(name);r.onsuccess=()=>set(r.result)});
 if(!row)throw Error('SNAPSHOT_MISSING');
 if(row.schema!=='webz/suno-atlas-local-snapshot/v0'||row.name!==name)throw Error('SNAPSHOT_CONTRACT');
 return structuredClone(validateCatalog(row.catalog));
}
export async function deleteNamed(name){
 if(!snapshotName(name))throw Error('SNAPSHOT_NAME_INVALID');
 await query('readwrite',store=>store.delete(name));
}
