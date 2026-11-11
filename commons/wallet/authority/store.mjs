// This is intentionally a SEPARATE local authority ledger, not a Link Wallet
// v1 ciphertext migration. IndexedDB contains public key hashes and signed
// revocations (public metadata), not owner grants, invitation URLs or owner
// private keys. A distinct NONEXPORTABLE receipt CryptoKey is stored here.
export const DB_NAME='abundent_link_wallet_authority_003';
const STORE='local',VERSION=1;
function open(){
 return new Promise((ok,no)=>{
  const req=indexedDB.open(DB_NAME,VERSION);
  req.onupgradeneeded=()=>{
   if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);
  };
  req.onsuccess=()=>ok(req.result);
  req.onerror=()=>no(Error('Local owner desk IndexedDB unavailable.'));
  req.onblocked=()=>no(Error('Close other owner desk tabs and retry.'));
 });
}
async function get(id){
 const db=await open();
 try{return await new Promise((ok,no)=>{
  const q=db.transaction(STORE,'readonly').objectStore(STORE).get(id);
  q.onsuccess=()=>ok(q.result??null);q.onerror=()=>no(Error('Owner desk could not read local storage.'));
 })}finally{db.close()}
}
async function put(id,val,replace=false){
 const db=await open();
 try{return await new Promise((ok,no)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  let issue='Local trust pin already exists; no silent replacement.';
  const r=store.get(id);
  r.onsuccess=()=>{
   if(r.result!==undefined&&!replace){tx.abort();return;}
   store.put(val,id);
  };
  tx.oncomplete=()=>ok(true);
  tx.onerror=()=>no(Error(issue));
  tx.onabort=()=>no(Error(issue));
 })}finally{db.close()}
}
export const getPin=()=>get('pin');
export const getRevocations=async()=>await get('revocations')??[];
export async function savePin(pin){return put('pin',pin,false)}
export async function saveRevocation(rev){
 const list=await getRevocations();
 if(!Array.isArray(list)||list.length>=30||list.some(x=>JSON.stringify(x)===JSON.stringify(rev)))
  throw Error('Local revocation ledger full, corrupt or duplicate.');
 return put('revocations',[...list,rev],true);
}
export async function getReceiptKey(){
 let keys=await get('receiver-key');
 if(keys){
  if(keys.privateKey?.extractable!==false||keys.privateKey?.algorithm?.name!=='ECDSA'
    ||keys.privateKey?.algorithm?.namedCurve!=='P-256')
    throw Error('Unsafe local review key material.');
  return keys;
 }
 const generated=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
 try{await put('receiver-key',generated,false)}
 catch{
  // A concurrent tab may have provisioned one. Re-read; never silently rotate it.
  keys=await get('receiver-key');
  if(!keys)throw Error('Local key generation failed.');
  return keys;
 }
 return generated;
}
export async function deleteDesk(){
 const db=await open();db.close();
 return new Promise((ok,no)=>{
  const q=indexedDB.deleteDatabase(DB_NAME);
  q.onsuccess=()=>ok(true);
  q.onblocked=()=>no(Error('Close other owner desk tabs before clearing local data.'));
  q.onerror=()=>no(Error('Could not clear local owner desk data.'));
 });
}
