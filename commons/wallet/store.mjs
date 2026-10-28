// IndexedDB stores ONLY ciphertext envelopes, never link URLs or plaintext metadata.
const NAME="abundent_link_wallet_001",STORE="ciphertext",ID="vault";
function openDb(){return new Promise((resolve,reject)=>{
 if(typeof indexedDB==="undefined")return reject(Error("Encrypted browser storage is unavailable."));
 const req=indexedDB.open(NAME,1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(Error("Encrypted browser storage could not open."));
 req.onblocked=()=>reject(Error("Close other wallet tabs and retry."));
})}
export async function readVault(){
 const db=await openDb();try{return await new Promise((resolve,reject)=>{
  const req=db.transaction(STORE,"readonly").objectStore(STORE).get(ID);
  req.onsuccess=()=>resolve(req.result??null);
  req.onerror=()=>reject(Error("Could not read encrypted wallet."));
 })}finally{db.close()}
}
export async function writeVault(envelope,expectedRevision){
 const db=await openDb();try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite"),store=tx.objectStore(STORE);
  let issue="";
  const req=store.get(ID);
  req.onsuccess=()=>{
   if((req.result?.revision??null)!==expectedRevision){
    issue="Vault changed in another tab. Lock, then unlock again.";tx.abort();return;
   }
   store.put(envelope,ID);
  };
  req.onerror=()=>{issue="Encrypted store read failed.";tx.abort()};
  tx.oncomplete=()=>resolve(true);
  tx.onabort=()=>reject(Error(issue||"Encrypted vault could not be saved."));
  tx.onerror=()=>reject(Error("Encrypted vault save failed."));
 })}finally{db.close()}
}
export async function deleteVault(expectedRevision){
 const db=await openDb();try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite"),store=tx.objectStore(STORE);
  let issue="";const req=store.get(ID);
  req.onsuccess=()=>{
   if((req.result?.revision??null)!==expectedRevision){issue="Vault changed in another tab. Reload first.";tx.abort();return}
   store.delete(ID);
  };
  req.onerror=()=>{issue="Encrypted store read failed.";tx.abort()};
  tx.oncomplete=()=>resolve(true);
  tx.onabort=()=>reject(Error(issue||"Encrypted vault deletion failed."));
 })}finally{db.close()}
}
