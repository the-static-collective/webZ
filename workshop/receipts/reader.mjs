// Inspect one archived, human-reviewed CI result. Never claim independent signature verification.
const mk=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const validate=(r,p)=>{
 if(!r||r.schema!=='cannon.branch-work-receipt/v0'||r.disposition!=='HOLD'||r.remote_effects!==0)throw Error('UNEXPECTED_RECEIPT');
 if(r.actual_local_hash_executed!==true||r.receipt_signatures_cold_verified!==true||r.owner_operational_permission!==false)throw Error('UNSUPPORTED_RESULT');
 if(!p||p.schema!=='abundent/branch-work-provenance/v0'||!/^https:\/\/github\.com\/the-static-collective\/CANNON\/actions\/runs\/\d+$/.test(p.source_workflow))throw Error('UNVERIFIABLE_PROVENANCE');
 for(const field of ['source_loadout_report','ghot_source_sha256','relatte_source_sha256','ghot_receipt_sha256'])if(!/^sha256:[a-f0-9]{64}$/.test(r[field]))throw Error('BAD_DIGEST');
 for(const field of ['ghot_exact_sha','relatte_exact_sha'])if(!/^[0-9a-f]{40}$/.test(r[field]))throw Error('BAD_COMMIT');
 for(const field of ['crossing_id','receive_receipt_id','disposition_receipt_id'])if(!/^relatte-(?:crossing|receipt)-v0:[a-f0-9]{64}$/.test(r[field]))throw Error('BAD_RECEIPT_ID');
 if(!Array.isArray(r.nonClaims)||r.nonClaims.length<3)throw Error('MISSING_NONCLAIMS');
 return true;
};
const step=(name,note)=>{
 const box=mk('div',undefined,'step');box.append(mk('h2',name),mk('p',note));return box;
};
async function init(){
 try{
  const [a,b]=await Promise.all([fetch('./branch-work-009.json',{cache:'no-cache'}),fetch('./provenance.json',{cache:'no-cache'})]);
  if(!a.ok||!b.ok)throw Error('NOT_LOADED');
  const r=await a.json(),p=await b.json();validate(r,p);
  document.getElementById('status').textContent='Archived 11 October 2026 · original CI run reported success · disposition: HOLD';
  const stages=[
   ['CANNON · verified source','Two exact branch programs checked as original Git objects.'],
   ['GHoT · actual local work','One bounded '+r.ghot_operation+' job completed in a disposable runner.'],
   ['reLATTE · signed crossing','Original GHoT receipt reference carried into native file transport.'],
   ['Receiver · HOLD','Signed RECEIVED and receiver-local R3_HOLD verified by the original CI.']
  ];
  const chain=document.getElementById('chain');chain.replaceChildren();
  for(let i=0;i<stages.length;i++){if(i)chain.append(mk('div','↓','arrow'));chain.append(step(...stages[i]));}
  const fields=[['Loadout snapshot',r.source_loadout_report],['GHoT exact commit',r.ghot_exact_sha],
    ['GHoT local receipt',r.ghot_receipt_sha256],['reLATTE exact commit',r.relatte_exact_sha],
    ['Crossing ID',r.crossing_id],['RECEIVED receipt',r.receive_receipt_id],['HOLD receipt',r.disposition_receipt_id]];
  const dl=document.getElementById('fields');dl.replaceChildren();
  for(const [label,value]of fields){const item=mk('div',undefined,'row');item.append(mk('dt',label),mk('dd',value));dl.append(item);}
  for(const note of r.nonClaims)document.getElementById('nonclaims').append(mk('li',note));
  document.getElementById('run').href=p.source_workflow;
 }catch{
  document.getElementById('status').textContent='HOLD · Archived receipt could not be validated as a safe display record.';
  document.getElementById('run').removeAttribute('href');
 }
}
init();
