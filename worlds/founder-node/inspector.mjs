/* Read-only first-party founder charter inspector. No network or signing. */
const $=id=>document.getElementById(id);
const fail=s=>{throw Error(s)};
const exact=(o,keys)=>{
 if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||
 keys.some(k=>!Object.prototype.hasOwnProperty.call(o,k)))fail('FIELD_CONTRACT');
};
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):
 Array.isArray(v)?'['+v.map(canonical).join(',')+']':
 '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
const decode=b=>Uint8Array.from(atob(b),x=>x.charCodeAt(0));
const bytes=v=>new TextEncoder().encode(v);
async function hash(o){
 const digest=await crypto.subtle.digest('SHA-256',bytes(canonical(o)));
 return 'sha256:'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
function pubkey(p){
 exact(p,['schema','algorithm','spki']);
 if(p.schema!=='webz/founder-identity/v0'||p.algorithm!=='Ed25519'||typeof p.spki!=='string'||p.spki.length>130||
 !/^[A-Za-z0-9+/]+={0,2}$/.test(p.spki))fail('PUBLIC_PIN_INVALID');
 if(btoa(String.fromCharCode(...decode(p.spki)))!==p.spki)fail('NONCANONICAL_PIN');
 return p;
}
const same=(a,b)=>canonical(a)===canonical(b);
async function paper(p,role,pin){
 exact(p,['schema','role','body','pub','signature']);pubkey(pin);pubkey(p.pub);
 if(p.schema!=='webz/founder-signed/v0'||p.role!==role||!same(pin,p.pub))fail('PAPER_ROLE_OR_PIN');
 if(typeof p.signature!=='string'||!/^[-+A-Za-z0-9/=]+$/.test(p.signature))fail('SIGNATURE_ENCODING');
 const signature=decode(p.signature);
 if(signature.length!==64)fail('SIGNATURE_LENGTH');
 const {signature:discard,...payload}=p;
 const key=await crypto.subtle.importKey('spki',decode(pin.spki),'Ed25519',false,['verify']);
 if(!await crypto.subtle.verify('Ed25519',key,signature,bytes('WEBZ/FOUNDER-NODE/003\n'+canonical(payload))))
  fail('SIGNATURE_INVALID');
 return p.body;
}
const worldId=async p=>'webz:founder-lab/'+(await hash(p)).slice(7,39);
function address(s){
 return typeof s==='string'&&/^MWF1\/(?:t(?:0[1-9]|1[01])g(?:0[1-9]|1[01])\/){0,96}t(?:0[1-9]|1[01])g(?:0[1-9]|1[01])$/.test(s);
}
async function verifyBundle(bundle,candidate,founder,withdrawal){
 exact(bundle,['schema','petition','admission','acceptance']);
 if(bundle.schema!=='webz/founder-charter-bundle/v0')fail('BUNDLE_INVALID');
 pubkey(candidate);pubkey(founder);
 if(same(candidate,founder))fail('IDENTITIES_NOT_SEPARATE');
 const p=await paper(bundle.petition,'CANDIDATE_PETITION',candidate);
 exact(p,['schema','scope','proposal_id','source','world','candidate']);
 exact(p.source,['annex_export_ref','reflection_ref','source_address']);
 exact(p.world,['title','description','parent_address','child_address','type']);
 if(p.schema!=='webz/founder-petition/v0'||p.scope!=='EXPERIMENTAL_NAMESPACE_ONLY'||
 !same(p.candidate,candidate)||!/^wl2-\d{3}$/.test(p.proposal_id)||
 !/^sha256:[a-f0-9]{64}$/.test(p.source.reflection_ref)||
 !/^sha256:[a-f0-9]{64}$/.test(p.source.annex_export_ref)||
 !address(p.source.source_address)||p.world.parent_address!==p.source.source_address||
 p.world.child_address!==p.source.source_address+'/t06g06'||
 p.world.type!=='INDEPENDENT_EXPERIMENTAL_WORLD'||
 typeof p.world.title!=='string'||p.world.title.length>64||!p.world.title.trim()||
 typeof p.world.description!=='string'||p.world.description.length>420||!p.world.description.trim())
 fail('PETITION_CONTRACT');
 const wid=await worldId(p);
 const a=await paper(bundle.admission,'FOUNDER_ADMISSION',founder);
 exact(a,['schema','scope','petition_ref','world_id','candidate','founder','decision','rights','delegated_by_founder']);
 if(a.schema!=='webz/founder-admission/v0'||a.scope!=='EXPERIMENTAL_NAMESPACE_ONLY'||
 a.petition_ref!==await hash(bundle.petition)||a.world_id!==wid||!same(a.candidate,candidate)||
 !same(a.founder,founder)||a.decision!=='ADMIT_EXPERIMENTAL_NAMESPACE'||
 a.rights!=='NO_MEDIA_NO_CROSSING_NO_DEPLOYMENT'||a.delegated_by_founder!==false)
 fail('ADMISSION_CONTRACT');
 const x=await paper(bundle.acceptance,'OWNER_ACCEPTANCE',candidate);
 exact(x,['schema','scope','petition_ref','admission_ref','world_id','owner','decision','source_rights','external_adoption']);
 if(x.schema!=='webz/owner-acceptance/v0'||x.scope!=='EXPERIMENTAL_NAMESPACE_ONLY'||
 x.petition_ref!==await hash(bundle.petition)||x.admission_ref!==await hash(bundle.admission)||
 x.world_id!==wid||!same(x.owner,candidate)||x.decision!=='ACCEPT_LOCAL_CUSTODY'||
 x.source_rights!=='NOT_VERIFIED'||x.external_adoption!=='NONE')
 fail('OWNER_ACCEPTANCE_CONTRACT');
 let state='ACTIVE_LOCAL_EXPERIMENTAL';
 if(withdrawal){
  const w=await paper(withdrawal,'OWNER_WITHDRAWAL',candidate);
  exact(w,['schema','scope','petition_ref','admission_ref','acceptance_ref','world_id','owner','decision']);
  if(w.schema!=='webz/owner-withdrawal/v0'||w.scope!=='EXPERIMENTAL_NAMESPACE_ONLY'||
  w.petition_ref!==await hash(bundle.petition)||w.admission_ref!==await hash(bundle.admission)||
  w.acceptance_ref!==await hash(bundle.acceptance)||w.world_id!==wid||
  !same(w.owner,candidate)||w.decision!=='WITHDRAW_EXPERIMENTAL_NAMESPACE')
  fail('WITHDRAWAL_CONTRACT');
  state='OWNER_WITHDRAWN_LOCAL';
 }
 return {world_id:wid,title:p.world.title,description:p.world.description,
  parent_address:p.world.parent_address,child_address:p.world.child_address,
  status:state,proof:'TWO_PINNED_ED25519_KEYS_AND_CANDIDATE_ACCEPTANCE',
  registered_in_original_webz_worlds:false,
  legal_owner_identity_established:false,media_and_delivery_permissions:'NONE'};
}
async function selected(id,optional=false){
 const file=$(id).files?.[0];
 if(!file){if(optional)return null;fail('FILE_REQUIRED: '+id);}
 if(file.size>160000||file.size<1)fail('FILE_BOUNDS: '+id);
 return JSON.parse(await file.text());
}
$('verify').addEventListener('click',async()=>{
 $('proof').hidden=true;$('message').textContent='Verifying pinned public-key signatures locally…';
 try{
  if(!crypto.subtle)throw Error('SECURE_CONTEXT_REQUIRED');
  const [bundle,candidate,founder,withdrawal]=await Promise.all([
   selected('bundle'),selected('candidate'),selected('founder'),selected('withdrawal',true)
  ]);
  const result=await verifyBundle(bundle,candidate,founder,withdrawal);
  $('title').textContent=result.title;$('worldid').textContent=result.world_id;
  $('disposition').textContent=result.status;
  $('summary').textContent=JSON.stringify(result,null,2);
  $('proof').hidden=false;
  $('message').textContent='Verified key custody. This is a local experimental namespace, not a sovereign crossing.';
 }catch(error){$('message').textContent='HOLD — '+error.message+'. No world was activated.'}
});
$('clear').addEventListener('click',()=>{
 for(const id of ['bundle','candidate','founder','withdrawal'])$(id).value='';
 $('proof').hidden=true;$('message').textContent='Selection cleared. Nothing retained in this page.';
});
