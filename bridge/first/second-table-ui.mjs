// All interaction stays on this device; public-safe review-only workshop.
import {INTEREST_STATIONS,makeSecondTable} from './second-table.mjs';
const $=id=>document.getElementById(id);
let current=null;
for(const id of Object.keys(INTEREST_STATIONS)){
 const option=document.createElement('option');option.value=id;option.textContent=id;
 $('interest').append(option);
}
function tell(v){$('status').textContent=v;}
$('run').addEventListener('click',async()=>{
 $('run').disabled=true;$('download').disabled=true;current=null;
 try{
  const raw=$('packet').value.trim();
  current=await makeSecondTable({interest:$('interest').value,creativePacket:raw||null});
  $('proof').textContent=JSON.stringify(current,null,2);
  $('headline').textContent='Two fictional circles, separately governed';
  $('interpret').textContent='Original WebZ signed-key proof: '+current.signedSoftwareReview.verifiedDistinctKeyHolders+
   ' synthetic key holders, '+current.signedSoftwareReview.signedPacketsVerified+
   ' signed packets. A predecessor cannot revoke a descendant offer. No real people, meetings or grants are proved.';
  $('creative').textContent=current.creativeThoughtFood.accepted?
    current.creativeThoughtFood.questions.join('\n\n'):
    'No JAR;VIS thought-food packet pasted. The first/second-table software demonstration still runs.';
  $('download').disabled=false;
  tell('Local synthetic proof complete. No application, event, invitation, signup or network request.');
 }catch(error){
  $('headline').textContent='HOLD';$('interpret').textContent=String(error);
  $('creative').textContent='';$('proof').textContent='No trusted review result.';
  tell('No proof exported. Correct the locally pasted public-safe packet or run without it.');
 }finally{$('run').disabled=false;}
});
$('download').addEventListener('click',()=>{
 if(!current)return;
 const blob=new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.download='voqal-012-second-table-SYNTHETIC-HOLD.json';a.href=url;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 tell('Synthetic local review saved. Nothing was submitted or published.');
});
