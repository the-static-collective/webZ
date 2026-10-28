// Private IndexedDB ciphertext store; separate from the Link Wallet database.
// Compare-and-set revision prevents most simultaneous-tab lost updates.
const NAME="abundent_bridge_ledger_004",STORE="ciphertext",ID="operator-journal";
function open(){return new Promise((resolve,reject)=>{
 if(typeof indexedDB==="undefined")return reject(Error("Encrypted storage unavailable in this browser."));
 const req=indexedDB.open(NAME,1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error("Couldn't open encrypted ledger storage."));
 req.onblocked=()=>reject(Error("Close other ledger tabs and retry."));
})}
export async function readVault(){
 const db=await open();try{return await new Promise((resolve,reject)=>{
 const q=db.transaction(STORE,"readonly").objectStore(STORE).get(ID);
 q.onsuccess=()=>resolve(q.result??null);q.onerror=()=>reject(Error("Couldn't read encrypted ledger."));
 })}finally{db.close()}
}
export async function writeVault(envelope,expectedRevision){
 const db=await open();try{return await new Promise((resolve,reject)=>{
 const tx=db.transaction(STORE,"readwrite"),s=tx.objectStore(STORE);let issue="";
 const q=s.get(ID);q.onsuccess=()=>{
 if((q.result?.revision??null)!==expectedRevision){issue="The ledger changed in another tab. Lock and reopen; do not overwrite it.";tx.abort();return}
 s.put(envelope,ID);
 };q.onerror=()=>{issue="Unable to read current ledger state.";tx.abort()};
 tx.oncomplete=()=>resolve(true);tx.onabort=()=>reject(Error(issue||"Encrypted ledger update failed."));
 tx.onerror=()=>reject(Error("Encrypted ledger storage error."));
 })}finally{db.close()}
}
