import {verify,portableHtml} from '../seed.mjs';
import {newParcel,verifyParcel,forwardParcel,receiveReceipt,size,MAX_PARCEL_BYTES} from './courier-core.mjs';
const $=id=>document.getElementById(id),role=new URL(location.href).searchParams.get('station')?.toUpperCase()||'A';
const station=['A','B','C'].includes(role)?role:'A';
$('station').textContent='STATION '+station;
for(const tag of ['A','B','C'])$('station-'+tag).hidden=tag!==station;
let current=null,pending=null,receipt=null,busy=false;
const set=(txt,error=false)=>{$('status').textContent=txt;$('status').dataset.error=String(error)};
const fail=e=>set('HOLD · '+(e?.message||'INVALID_PARCEL'),true);
function download(name,content,type='application/json'){
 const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function work(fn){
 if(busy)return;busy=true;try{await fn()}catch(e){fail(e)}finally{busy=false;update()}
}
function update(){
 $('source-export').disabled=station!=='A'||!current;
 $('save-hold').disabled=station!=='B'||!pending||!$('hold-consent').checked;
 $('forward-export').disabled=station!=='B'||!current||!$('forward-consent').checked;
 $('accept-c').disabled=station!=='C'||!pending||!$('receive-consent').checked;
 $('export-page').disabled=station!=='C'||!current;
 $('export-receipt').disabled=station!=='C'||!receipt;
}
function explain(p){
 $('digest').textContent=p.seed.digest;
 $('hops').textContent=p.journey.hops.map(h=>h.station+' '+h.action).join(' → ');
 $('journey').textContent=p.journey.id+' · '+p.journey.hops.at(-1).link;
}
function clearDisplay(){$('digest').textContent='No seed selected';$('hops').textContent='—';$('journey').textContent='—'}
const DB='abundent-courier-004',STORE='held-seeds',KEY='one-consented-public-seed';
async function database(){
 if(!globalThis.indexedDB)throw Error('INDEXED_DB_UNAVAILABLE');
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};
  r.onerror=()=>reject(Error('LOCAL_STORAGE_UNAVAILABLE'));r.onsuccess=()=>resolve(r.result);
 });
}
async function disk(type,value){
 const db=await database();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,type==='get'?'readonly':'readwrite'),store=tx.objectStore(STORE);
  const req=type==='get'?store.get(KEY):type==='put'?store.put(value,KEY):store.delete(KEY);
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(Error('LOCAL_HOLD_FAILED'));
  tx.onabort=()=>reject(Error('LOCAL_HOLD_ABORTED'));
 })}finally{db.close()}
}
$('create-a').addEventListener('click',()=>work(async()=>{
 const response=await fetch('../seed-000.json',{cache:'no-store'});
 if(!response.ok)throw Error('PUBLIC_SEED_UNAVAILABLE');
 const raw=await response.text();if(size(raw)>25000)throw Error('SEED_TOO_LARGE');
 const seed=JSON.parse(raw);await verify(seed);
 current=await newParcel(seed);explain(current);set('ORIGIN A · VERIFIED · READY FOR INTENTIONAL FILE EXPORT');
}));
$('source-export').addEventListener('click',()=>{if(current&&station==='A')download('seed-004-A-to-B.json',JSON.stringify(current,null,2)+'\n')});
$('import-b').addEventListener('change',e=>work(async()=>{
 pending=null;const f=e.target.files?.[0];if(!f)return;
 if(f.size>MAX_PARCEL_BYTES)throw Error('PARCEL_TOO_LARGE');
 const p=await verifyParcel(await f.text());
 if(p.journey.hops.length!==1)throw Error('B_REQUIRES_ORIGIN_PARCEL');
 pending=p;explain(p);set('B VERIFIED PUBLIC PARCEL · CONSENT TO HOLD NOT YET GIVEN');e.target.value='';
}));
$('save-hold').addEventListener('click',()=>work(async()=>{
 if(station!=='B'||!pending||!$('hold-consent').checked)throw Error('EXPLICIT_HOLD_CONSENT_REQUIRED');
 await disk('put',JSON.stringify(pending));current=pending;pending=null;
 set('B HELD · VERIFIED PARCEL SAVED TO THIS BROWSER ONLY · RELOAD TO TEST RESUMABILITY');
}));
$('restore').addEventListener('click',()=>work(async()=>{
 if(station!=='B')throw Error('NOT_STATION_B');
 const raw=await disk('get');if(!raw)throw Error('NO_SAVED_HOLD');
 const p=await verifyParcel(raw);
 if(p.journey.hops.length!==1)throw Error('SAVED_HOLD_INVALID');
 current=p;explain(p);set('B REOPENED LOCAL HOLD · NO AUTOMATIC FORWARD');
}));
$('forward-export').addEventListener('click',()=>work(async()=>{
 if(station!=='B'||!current||!$('forward-consent').checked)throw Error('FORWARD_CONSENT_REQUIRED');
 const p=await forwardParcel(current);
 download('seed-004-B-to-C.json',JSON.stringify(p,null,2)+'\n');
 set('B FORWARD PARCEL EXPORTED · NO AUTOMATIC DELIVERY');
}));
$('clear-hold').addEventListener('click',()=>work(async()=>{
 if(station!=='B'||!$('clear-consent').checked)throw Error('CLEAR_CONFIRMATION_REQUIRED');
 await disk('delete');current=null;pending=null;clearDisplay();
 $('clear-consent').checked=false;
 set('LOCAL HOLD CLEARED · NO COPY OF SAVED PARCEL IN THIS BROWSER DATABASE');
}));
$('import-c').addEventListener('change',e=>work(async()=>{
 pending=null;receipt=null;current=null;
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>MAX_PARCEL_BYTES)throw Error('PARCEL_TOO_LARGE');
 const p=await verifyParcel(await f.text());
 if(p.journey.hops.length!==2)throw Error('C_REQUIRES_B_FORWARDED_PARCEL');
 pending=p;explain(p);set('C VERIFIED INCOMING PARCEL · RECEIVE CONSENT REQUIRED');e.target.value='';
}));
$('accept-c').addEventListener('click',()=>work(async()=>{
 if(station!=='C'||!pending||!$('receive-consent').checked)throw Error('EXPLICIT_RECEIVE_CONSENT_REQUIRED');
 receipt=await receiveReceipt(pending);current=pending;pending=null;
 set('C RECEIVED · SOURCE CONTENT REVERIFIED · UNSIGNED LOCAL RECEIPT');
}));
$('export-page').addEventListener('click',()=>{
 if(station!=='C'||!current)return;
 // Verify again on import and require consent, no passive HTML execution.
 work(async()=>{await verifyParcel(current);
 download('abundent-letter-000-at-C.html',portableHtml(current.seed,0,10),'text/html');
 set('C EXPORTED ONE-FILE OFFLINE WEBSITE · ORIGINAL A MAY BE DISCONNECTED');
 });
});
$('export-receipt').addEventListener('click',()=>{if(station==='C'&&receipt)download('seed-004-unsigned-receipt-C.json',JSON.stringify(receipt,null,2)+'\n')});
for(const id of ['hold-consent','forward-consent','receive-consent','clear-consent'])$(id).addEventListener('change',update);
update();
