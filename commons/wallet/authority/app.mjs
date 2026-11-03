import {
  previewGrant,makePin,validatePin,validateRevocation,assess,
  signReviewReceipt,verifyReviewReceipt
} from './core.mjs';
import {getPin,savePin,getRevocations,saveRevocation,getReceiptKey,deleteDesk} from './store.mjs';
import {offerLinkToWallet} from '../handoff.mjs';

const $=id=>document.getElementById(id);
let currentGrant=null,preview=null,pin=null,revocations=[],pendingRevocation=null,lastReceipt=null,busy=false;
function message(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error)}
function disabled(){return !currentGrant||!preview||!pin||
  pin.public_key_fingerprint!==preview.public_key_fingerprint||
  pin.signed_grant_digest!==preview.signed_grant_digest}
function render(){
 $('pinState').textContent=pin
  ?'This device recognizes a pinned grant digest and a self-attested key fingerprint. No owner identity was independently verified. Signed grant must still be imported each visit.'
  :'No locally recognized signer. A valid signed grant alone does NOT enroll a key.';
 $('pinButton').disabled=!preview||!!pin;
 $('hold').disabled=disabled();
 $('refuse').disabled=disabled();
 $('saveReceipt').disabled=!lastReceipt;
 $('applyRevocation').disabled=!pendingRevocation||disabled();
 $('revocationState').textContent=revocations.length
  ?revocations.length+' verified owner-signed revocation(s) stored locally. These do not broadcast.'
  :'No owner-signed local revocation stored.';
}
async function fileJson(event){
 const file=event.target.files?.[0];
 if(!file||file.size<100||file.size>20000||!file.name.toLowerCase().endsWith('.json'))
  throw Error('Select a JSON signature file between 100 bytes and 20 KB.');
 return JSON.parse(await file.text());
}
async function run(task){
 if(busy)throw Error('A local operation is already running.');
 busy=true;
 try{return await task()}
 catch(e){message('REFUSED: '+(e?.message||String(e)),true);throw e}
 finally{busy=false;render()}
}
function download(name,value){
 const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function displayPreview(){
 $('grantPreview').hidden=!preview;
 if(!preview)return;
 $('signature').textContent='VALID — signed by the containing P-256 public key';
 $('fp').textContent=preview.public_key_fingerprint;
 $('grantHash').textContent=preview.signed_grant_digest;
 $('expiry').textContent=preview.expires_at;
 $('scopes').textContent=preview.scopes.join(', ');
}
async function load(){pin=await getPin();if(pin)validatePin(pin);
 revocations=await getRevocations();if(!Array.isArray(revocations)||revocations.length>30)
  throw Error('Local revocation store is invalid.');
 render();message('Owner desk ready. No owner grant has been uploaded or automatically enrolled.');}
$('grantFile').addEventListener('change',async event=>{
 try{await run(async()=>{
  currentGrant=null;preview=null;pendingRevocation=null;lastReceipt=null;displayPreview();
  const grant=await fileJson(event),checked=await previewGrant(grant);
  currentGrant=grant;preview=checked;displayPreview();
  if(pin&&(pin.public_key_fingerprint!==preview.public_key_fingerprint||
          pin.signed_grant_digest!==preview.signed_grant_digest))
   throw Error('This grant does not match your existing local pinned grant. No silent key substitution.');
  // The public grant deliberately remains only in this tab's memory.
  message('Cryptographic signature verified. Self-attested key only. '+
    (pin?'Exact local grant pin matches. Review requires a separate click.':
      'Confirm this exact fingerprint separately before proposal review.'));
 })}catch{}finally{render()}
});
$('pinButton').addEventListener('click',async()=>{
 try{await run(async()=>{
  if(!preview)throw Error('First import a signed grant.');
  const typed=$('confirmFingerprint').value.trim();
  const check=$('confirmIntent').checked;
  const record=makePin(preview,typed,check,new Date().toISOString());
  if(pin)throw Error('This device already has a pinned owner grant.');
  await savePin(record);pin=record;
  $('confirmFingerprint').value='';$('confirmIntent').checked=false;
  message('Exact fingerprint locally pinned. This confirms a key fingerprint, not a person or organization.');
 })}catch{}
});
async function recordDecision(kind){
 try{await run(async()=>{
  if(disabled())throw Error('Import a verified grant and separately confirm its exact key fingerprint first.');
  const decision=await assess({grant:currentGrant,pin,revocations,
    action:$('action').value,at:new Date().toISOString(),requestedDecision:kind});
  if(kind==='HOLD'&&decision.decision!=='HOLD')
   throw Error('HOLD prohibited by signed scope or locally received revocation: '+decision.reason);
  const keys=await getReceiptKey();
  const receipt=await signReviewReceipt(decision,keys);
  if(!(await verifyReviewReceipt(receipt)))
   throw Error('Separate local receipt key failed signature verification.');
  lastReceipt=receipt;
  $('receipt').textContent=JSON.stringify({
    decision:decision.decision,action:decision.action,reason:decision.reason,
    reviewer_public_key_fingerprint:receipt.body.receipt_signer_fingerprint,
    owner_key_fingerprint:decision.owner_fingerprint,
    receipt_id:receipt.body.id,
    signed_by_separate_local_key:true,
    actual_execution:false,native_relatte_r3:false
  },null,2);
  message('Signed '+decision.decision+' local review receipt. Nothing merged, paid, revoked remotely, or admitted. Download this public receipt to retain it.');
 })}catch{}
}
$('hold').addEventListener('click',()=>recordDecision('HOLD'));
$('refuse').addEventListener('click',()=>recordDecision('REFUSE'));
$('saveReceipt').addEventListener('click',()=>{
 if(!lastReceipt){message('No local signed receipt.',true);return}
 download('link-wallet-local-review-'+lastReceipt.body.decision.decision.toLowerCase()+'.json',lastReceipt);
 message('Local signed review receipt exported. It is not a native reLATTE R3 receipt.');
});
$('revokeFile').addEventListener('change',async event=>{
 try{await run(async()=>{
  pendingRevocation=null;
  if(disabled())throw Error('Import and confirm the exact signed grant before applying its revocation.');
  const incoming=await fileJson(event);
  pendingRevocation=await validateRevocation(incoming,currentGrant);
  message('Owner-signed revocation verified. Click Apply to record its local receipt.');
 })}catch{}
});
$('applyRevocation').addEventListener('click',async()=>{
 try{await run(async()=>{
  if(!pendingRevocation||disabled())throw Error('No valid revocation pending.');
  await validateRevocation(pendingRevocation,currentGrant);
  await saveRevocation(pendingRevocation);
  revocations=await getRevocations();
  pendingRevocation=null;lastReceipt=null;
  message('Matching owner-signed revocation recorded locally. The desk will now REFUSE later HOLD requests. No remote service was notified.');
 })}catch{}
});
$('keepWallet').addEventListener('click',()=>{
 try{
  offerLinkToWallet({
    title:'Owner Authority Desk · Local reviews',
    url:new URL('./',location.href).href,
    scope:'other',group:'reLATTE / Personal tools',
    note:'Shortcut only; no grant or signing key. Local proposal review.'
  },new URL('../',location.href).href);
  message('Link offered to your wallet in a separate window. Unlock the wallet and click Keep link to encrypt this public shortcut. No grant or key was sent.');
 }catch(e){message('Wallet shortcut not saved: '+String(e.message||e),true)}
});
$('clearDesk').addEventListener('click',async()=>{
 if(!confirm('Clear this device\'s owner key PIN, local revocations and separate receipt key? This does NOT revoke signed grants or change the encrypted Link Wallet.'))return;
 if(!confirm('Confirm local removal. Previously exported receipts remain valid, and other receiving worlds are unchanged.'))return;
 try{await run(async()=>{
  await deleteDesk();
  currentGrant=null;preview=null;pin=null;revocations=[];pendingRevocation=null;lastReceipt=null;
  $('grantFile').value='';$('revokeFile').value='';$('confirmFingerprint').value='';
  $('confirmIntent').checked=false;$('receipt').textContent='No review receipt created.';
  displayPreview();
  message('Local owner desk cleared. Encrypted Link Wallet and remote grants unchanged.');
 })}catch{}
});
load().catch(e=>{
 message('Desk UNAVAILABLE: '+String(e.message||e)+' No trust will be inferred.',true);
 for(const id of ['pinButton','hold','refuse','applyRevocation'])$(id).disabled=true;
});
