import {inspectEncounter} from './encounter.mjs';
import {exact,sensitive} from './model.mjs';
const $=id=>document.getElementById(`encounter-${id}`);
let packet=null,trust=null,epoch=0;
function invalidate({approval=true}={}){epoch++;$('result').textContent='No accepted observation.';if(approval)$('approval').checked=false;return epoch;}
function boundedText(raw){if(new TextEncoder().encode(raw).length>131072)throw Error('PUBLIC_FILE_TOO_LARGE');return raw;}
function trustFile(raw){
 const f=JSON.parse(boundedText(raw));exact(f,['scope','at','trust']);
 if(typeof f.scope!=='string'||f.scope.length>200||sensitive(f.scope)||typeof f.at!=='string'||f.at.length>32)throw Error('INVALID_TRUST_FILE');
 exact(f.trust,'schema issuer_world_id source_world_id source_particular receiver_particular issuer_key_fingerprint source_key_fingerprint approved_origin revoked_invitation_ids'.split(' '));
 // Show only bounded public identity fields, never arbitrary imported JSON.
 for(const key of ['schema','issuer_world_id','source_world_id','source_particular','receiver_particular','issuer_key_fingerprint','source_key_fingerprint','approved_origin'])if(typeof f.trust[key]!=='string'||f.trust[key].length>512||sensitive(f.trust[key]))throw Error('INVALID_PUBLIC_PIN');
 if(!Array.isArray(f.trust.revoked_invitation_ids)||f.trust.revoked_invitation_ids.length>100||f.trust.revoked_invitation_ids.some(x=>typeof x!=='string'||!/^webz-porch-invitation-v0:[a-f0-9]{64}$/.test(x)))throw Error('INVALID_PUBLIC_REVOCATION');
 return f;
}
function setTrust(f){trust=f.trust;$('cut').value=f.at;$('pins').textContent=JSON.stringify({scope:f.scope,...trust},null,2);}
function reject(){ $('status').textContent='REJECTED · The public packet, pins, or verification cut did not satisfy this contract.'; }
for(const kind of ['packet','trust'])$(kind).addEventListener('change',async()=>{
 const version=invalidate();if(kind==='packet')packet=null;else{trust=null;$('pins').textContent='No public pins loaded.';}
 const file=$(kind).files[0];$('status').textContent='UNAVAILABLE · Reading public file.';
 try{if(!file||file.size>131072)throw Error('FILE_BOUND');const raw=boundedText(await file.text());if(version!==epoch)return;
  if(kind==='packet'){packet=raw;$('status').textContent='Packet file loaded · No verification or delivery performed.';}
  else{setTrust(trustFile(raw));$('status').textContent='Trust file loaded · Review pins independently before verification.';}
 }catch{if(version===epoch)reject();}
});
for(const button of document.querySelectorAll('[data-fixture]'))button.addEventListener('click',async()=>{
 const version=invalidate();packet=null;trust=null;$('pins').textContent='No public pins loaded.';$('status').textContent='UNAVAILABLE · Loading public synthetic fixture.';
 try{
  const name=button.dataset.fixture;
  const files=await Promise.all(['packet','trust'].map(async kind=>{const r=await fetch(new URL(`../evidence/first-encounter-002/${name}.${kind}.json`,import.meta.url),{credentials:'omit',redirect:'error'});if(!r.ok)throw Error('MISSING_FIXTURE');return boundedText(await r.text());}));
  if(version!==epoch)return;const f=trustFile(files[1]);packet=files[0];setTrust(f);
  $('status').textContent='Loaded synthetic fixture · No verification or delivery performed.';
 }catch{if(version===epoch)reject();}
});
$('cut').addEventListener('input',()=>{invalidate();$('status').textContent='UNAVAILABLE · Verification cut changed; review again.';});
$('approval').addEventListener('change',()=>{invalidate({approval:false});$('status').textContent='UNAVAILABLE · Pins acceptance changed; explicitly verify again.';});
$('verify').addEventListener('click',async()=>{
 const version=invalidate({approval:false});
 if($('approval').checked!==true||packet===null||trust===null){$('status').textContent='UNAVAILABLE · Load packet and pins, then explicitly accept the reviewed public pins.';return;}
 $('status').textContent='UNAVAILABLE · Checking signed public records.';
 try{const result=await inspectEncounter(packet,trust,$('cut').value);if(version!==epoch)return;$('result').textContent=JSON.stringify(result,null,2);$('status').textContent=result.return_verified?`RETURN VERIFIED · Receiving decision: ${result.decision}. Delivery remains unavailable.`:'PROPOSAL VERIFIED · Return UNOBSERVED. Delivery remains unavailable.';}
 catch{if(version===epoch)reject();}
});
$('clear').addEventListener('click',()=>{invalidate();packet=null;trust=null;for(const id of ['packet','trust','cut'])$(id).value='';$('pins').textContent='No public pins loaded.';$('status').textContent='UNAVAILABLE · Packet and pins cleared.';});
