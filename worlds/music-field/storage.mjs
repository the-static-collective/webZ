/* Music Field's independent optional local IndexedDB snapshots. */
import {validate} from './model.mjs';
const DB='webz-music-field-002',STORE='collections';
const good=n=>typeof n==='string'&&n===n.trim()&&n.length>0&&n.length<=60&&!/[\u0000-\u001f<>]/.test(n);
function dbOpen(){
 if(!('indexedDB' in globalThis))return Promise.reject(Error('INDEXEDDB_UNAVAILABLE'));
 return new Promise((ok,no)=>{
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'name'})};
  req.onerror=()=>no(Error('DATABASE_OPEN_FAILED'));req.onsuccess=()=>ok(req.result);
 });
}
async function transact(mode,callback){
 const db=await dbOpen();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),table=tx.objectStore(STORE);let result;
  tx.onerror=()=>reject(Error('DATABASE_TRANSACTION_FAILED'));
  tx.onabort=()=>reject(Error('DATABASE_TRANSACTION_ABORTED'));
  tx.oncomplete=()=>resolve(result);
  try{callback(table,value=>result=value)}catch(err){tx.abort();reject(err)}
 })}finally{db.close()}
}
export async function names(){
 return transact('readonly',(table,set)=>{const r=table.getAllKeys();r.onsuccess=()=>set(r.result.sort())});
}
export async function save(name,catalog){
 if(!good(name))throw Error('SNAPSHOT_NAME');
 validate(catalog);
 const saved=await names();if(saved.length>=24&&!saved.includes(name))throw Error('SNAPSHOT_QUOTA');
 await transact('readwrite',table=>table.put({name,schema:'webz/music-field-snapshot/v0',catalog:structuredClone(catalog)}));
}
export async function load(name){
 if(!good(name))throw Error('SNAPSHOT_NAME');
 const row=await transact('readonly',(table,set)=>{const r=table.get(name);r.onsuccess=()=>set(r.result)});
 if(!row||row.name!==name||row.schema!=='webz/music-field-snapshot/v0')throw Error('SNAPSHOT_INVALID');
 return structuredClone(validate(row.catalog));
}
export async function remove(name){
 if(!good(name))throw Error('SNAPSHOT_NAME');
 await transact('readwrite',table=>table.delete(name));
}
