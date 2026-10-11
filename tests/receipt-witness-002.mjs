// Test-only independent creator of reLATTE receipt v0 proof packets.
// Never deployed or exported by webZ. No stable/private production signer.
import {readFile} from 'node:fs/promises';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {canonical} from '../arrivals/verify.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const hash=(p,x)=>sha(p+canonical(x));
const config={schema:'relatte.local-receiver-config/v0',world_id:'world:gro-local-review',
 receiver_particular:'particular:gro-abundent-intake-001',contract_ref:'gro.abundent-public-reference-intake/v0'};
const initial=JSON.parse(await readFile(new URL('../arrivals/lemonpress-catalog-001.json',import.meta.url),'utf8'));
export function createSignedReceiptWitness(){
 const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const jwk=pair.publicKey.export({format:'jwk'});
 const public_key={kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y};
 const x=initial.crossing.crossing_id,at='2026-10-11T11:00:00.000Z';
 const state=status=>'relatte-local-state-v0:'+hash('reLATTE-LocalReceiverState-v0|',{
  world_id:config.world_id,receiver_particular:config.receiver_particular,
  status:status==='NONE'?[]:[{crossing_id:x,disposition:status}]
 });
 const seal=draft=>{
  const head={algorithm:'ECDSA-P256-SHA256',public_key,domain:'relatte.receipt-signature/v0'};
  const body={...draft,signing:head};
  const receipt_id='relatte-receipt-v0:'+hash('reLATTE-Receipt-v0|',body);
  const signature=sign('sha256',Buffer.from('reLATTE-ReceiptSignature-v0|'+canonical({receipt_id,...body})),
   {key:pair.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
  return {...draft,receipt_id,signing:{...head,signature}};
 };
 const make=(kind,pre,post,ext,note)=>seal({
  schema:'relatte.receipt/v0',crossing_id:x,world_id:config.world_id,
  receiver_particular:config.receiver_particular,kind,semantic_effect:'none',
  contract_ref:config.contract_ref,pre_state_ref:state(pre),post_state_ref:state(post),
  descendant_refs:[],residual_refs:[initial.source.sha256],note,created_at:at,extensions:{local_receiver:ext}
 });
 const event=(seq,prev,event_type,crossing,receipt)=>{
  const b={schema:'relatte.local-receiver-event/v0',seq,previous_hash:prev,event_type,crossing_id:x,crossing,receipt,created_at:at};
  return {...b,event_hash:'relatte-local-event-v0:'+hash('reLATTE-LocalReceiverEvent-v0|',b)};
 };
 const receive=make('RECEIVED','NONE','NONE',{law:'RECEIVED != ADMITTED',history_head_before:null},'Locally verified');
 const e1=event(1,null,'RECEIVE',initial.crossing,receive);
 const hold=make('R3_HOLD','RECEIVED','HOLD',{
  disposition:'HOLD',receive_receipt_id:receive.receipt_id,protected_payload_effect:false,
  history_head_before:e1.event_hash,laws:['RECEIPT != ADMISSION','REFUSE != DELETE','HOLD != ADMIT','RETURN != TRANSFER OF AUTHORITY']
 },'Held');
 const e2=event(2,e1.event_hash,'DISPOSITION',null,hold);
 return {schema:'gro.abundent-signed-receiver/v0',claim:'OWNER_LOCAL_PROCESS_NOT_AUTHENTICATED_OPERATOR',
  config,receiver_public_key:public_key,carrier:initial,events:[e1,e2],history_head:e2.event_hash};
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).href===import.meta.url)
 process.stdout.write(JSON.stringify(createSignedReceiptWitness()));
