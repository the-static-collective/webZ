// Thin boundary from reLATTE's physical observation to webZ's *untrusted* local review.
// Does not send, navigate, persist or automatically record webZ voyage events.
import { inspectOpticalCandidate } from '../../app/optical-observation.mjs';
const $ = id => document.getElementById(id);
let candidate = null, observation = null, epoch = 0;
function reset() {
  ++epoch; candidate=null;observation=null;
  $('webz-review').disabled=true;
  $('webz-download').hidden=true;
  $('webz-preview').hidden=true;
  $('webz-preview').textContent='';
  $('webz-status').textContent='No camera-recovered candidate. Synthetic runs never open this gate.';
}
window.addEventListener('webz:optical-reset',reset);
window.addEventListener('webz:optical-recovered',event=>{
  reset();
  const r=event.detail;
  if(r?.status==='VALID' && r?.authentication==='NONE_CRC_ONLY' && r?.payload instanceof Uint8Array) {
    candidate={...r,payload:Uint8Array.from(r.payload)};
    $('webz-review').disabled=false;
    $('webz-status').textContent='CRC-valid camera packet observed. Human inspection required; no world entry or delivery follows.';
  }
});
$('webz-review').addEventListener('click', async()=>{
  if(!candidate)return;
  const generation=epoch;
  try {
    const reviewed=await inspectOpticalCandidate(candidate);
    if(generation!==epoch)return;
    observation=reviewed;
    $('webz-preview').textContent=JSON.stringify(reviewed,null,2);
    $('webz-preview').hidden=false;
    $('webz-download').hidden=false;
    $('webz-status').textContent='Reviewed as an unsigned local observation only. Crossings and receiver decisions remain closed.';
  } catch {
    if(generation!==epoch)return;
    reset();
    $('webz-status').textContent='REJECTED: malformed or unverified optical candidate.';
  }
});
$('webz-download').addEventListener('click',()=>{
  if(!observation)return;
  const blob=new Blob([JSON.stringify(observation,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url; link.download='webz-optical-observation.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
