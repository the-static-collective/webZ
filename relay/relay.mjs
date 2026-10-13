import {inspectRelay} from '../app/relay-proof.mjs';
const $=id=>document.getElementById(id);
let generation=0;
const set=(id,v)=>{$(id).textContent=v;};
function clear(){generation++;$('details').replaceChildren();$('details').hidden=true;$('mark').textContent='?';$('mark').className='mark';set('verdict','Awaiting evidence');set('status','No record selected. All claims remain unverified.');$('proof-input').value='';}
function row(key,value){const dt=document.createElement('dt');dt.textContent=key;const dd=document.createElement('dd');dd.textContent=String(value);$('details').append(dt,dd);}
async function inspect(raw){const g=++generation;set('verdict','Inspecting');set('status','Checking SHA-256 identities, P-256 signatures, transport, and receiver-local disposition…');$('details').hidden=true;
 try{const p=await inspectRelay(raw);if(g!==generation)return;$('mark').textContent='✓';$('mark').className='mark verified';set('verdict','Signed HOLD observed');set('status','Three valid signatures. No admission or publication authority.');$('details').replaceChildren();for(const [a,b] of [['Source media',p.source_media_sha256],['Crossing',p.crossing_id],['Donor receipt',p.donor_receipt_id],['Receiver',p.receiver_world],['Disposition','HOLD / no semantic effect'],['Audio bytes','Not verified here'],['Signer identity','Self-asserted public keys']])row(a,b);$('details').hidden=false;
 }catch(error){if(g!==generation)return;$('mark').textContent='×';$('mark').className='mark rejected';set('verdict','Rejected / unverified');set('status',error.message);$('details').replaceChildren();$('details').hidden=true;}}
$('proof-input').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;const g=++generation;if(file.size>524288){set('verdict','Rejected / unverified');set('status','FILE_LIMIT_512_KIB');return;}try{const text=await file.text();if(g!==generation)return;await inspect(text);}catch(error){if(g!==generation)return;set('status','File read failed: '+error.message);}};
$('clear').onclick=clear;
const local=$('bundled-proof').textContent.trim();if(local){$('inspect-bundled').hidden=false;$('inspect-bundled').onclick=()=>inspect(local);inspect(local)}
const media=document.body.dataset.audioPath;if(media){$('song-audio').src=media;$('song-audio').hidden=false;}
