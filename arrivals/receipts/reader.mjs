import {verifySignedHold} from '../receipts.mjs';
const $=id=>document.getElementById(id);
let generation=0;
const reset=()=>{
 generation++;
 $('journal').value='';
 $('status').textContent='No receipts inspected.';
 $('result').textContent='Nothing verified.';
 $('claim').textContent='No receiver key has been authenticated.';
};
$('clear').addEventListener('click',reset);
$('journal').addEventListener('change',async e=>{
 const g=++generation;
 const file=e.target.files[0];
 if(!file)return;
 $('status').textContent='Verifying signed RECEIVED and HOLD receipts…';
 $('result').textContent='Checking.';
 $('claim').textContent='No identity claim accepted until verification.';
 try{
  if(file.size>65536)throw Error('SIGNED_RECEIPT_LIMIT_64KB');
  const result=await verifySignedHold(await file.text());
  if(g!==generation)return;
  $('status').textContent='VALID · independent signature checks · RECEIVED → HOLD · no admission';
  $('result').textContent=JSON.stringify(result,null,2);
  $('claim').textContent='Receiver public key fingerprint: '+result.receiver_key_fingerprint+
    '. This is a self-declared local operator key. Verify its assignment by an independent trusted channel; uploading it here establishes no operator identity.';
 }catch(err){
  if(g!==generation)return;
  $('status').textContent='REJECTED / HOLD — '+err.message;
  $('result').textContent='No accepted receipt history.';
  $('claim').textContent='Untrusted or incomplete receipts are not evidence of a local receiving act.';
 }
});