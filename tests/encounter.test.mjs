import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const E=await import('../app/encounter.mjs').catch(()=>({}));
import {canonical,hash} from '../app/model.mjs';
// Fresh in-memory signers create hostile records with valid signatures. No private
// material is exported or persisted; production has no sealing capability.
async function resignedReceive(extensions,alter=()=>{}){
 const f=await fixture(),p=structuredClone(f.packet),t=structuredClone(f.trust);
 const keys=await Promise.all([0,1].map(()=>crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify'])));
 const pubs=await Promise.all(keys.map(async k=>{const {kty,crv,x,y}=await crypto.subtle.exportKey('jwk',k.publicKey);return {kty,crv,x,y};}));
 t.issuer_key_fingerprint=await hash(canonical(pubs[0]));t.source_key_fingerprint=await hash(canonical(pubs[1]));
 async function seal(o,idField,prefix,idDomain,signDomain,domain,k){
  const {[idField]:old,signing:previous,...fields}=o;
  const body={...fields,signing:{algorithm:'ECDSA-P256-SHA256',public_key:pubs[k],domain}};
  const id=prefix+(await hash(idDomain+canonical(body))).slice(7);
  const signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys[k].privateKey,new TextEncoder().encode(signDomain+canonical({[idField]:id,...body})))).toString('base64url');
  return {...fields,[idField]:id,signing:{...body.signing,signature}};
 }
 p.invitation.source_key_fingerprint=t.source_key_fingerprint;
 p.invitation=await seal(p.invitation,'invitation_id','webz-porch-invitation-v0:','webZ-PorchInvitation-v0|','webZ-PorchInvitationSignature-v0|','webz.porch-invitation-signature/v0',0);
 p.crossing.capability_ref=p.invitation.invitation_id;
 alter('crossing',p);
 p.crossing=await seal(p.crossing,'crossing_id','relatte-crossing-v0:','reLATTE-CrossingEnvelope-v0|','reLATTE-CrossingSignature-v0|','relatte.crossing-signature/v0',1);
 const b=p.response;b.crossing_id=p.crossing.crossing_id;
 for(const r of [b.receive_receipt,b.disposition_receipt])r.crossing_id=p.crossing.crossing_id;
 if(extensions!==undefined)b.receive_receipt.extensions=extensions;
 alter('receive',p);
 const sealReceipt=r=>seal(r,'receipt_id','relatte-receipt-v0:','reLATTE-Receipt-v0|','reLATTE-ReceiptSignature-v0|','relatte.receipt-signature/v0',0);
 b.receive_receipt=await sealReceipt(b.receive_receipt);
 b.disposition_receipt.extensions.local_receiver.receive_receipt_id=b.receive_receipt.receipt_id;
 alter('disposition',p);
 b.disposition_receipt=await sealReceipt(b.disposition_receipt);
 const {bundle_id:old,...body}=b;b.bundle_id='relatte-sovereign-response-v0:'+(await hash('reLATTE-SovereignResponseBundle-v0|'+canonical(body))).slice(7);
 return {packet:p,trust:t,at:f.at};
}
async function fixture(name='refuse'){
 const packet=JSON.parse(await readFile(new URL(`../evidence/first-encounter-002/${name}.packet.json`,import.meta.url),'utf8'));
 const {trust,at}=JSON.parse(await readFile(new URL(`../evidence/first-encounter-002/${name}.trust.json`,import.meta.url),'utf8'));return {packet,trust,at};
}
for(const decision of ['hold','refuse','admit'])test(`native ${decision} return is pinned, bound to exact text and observation only`,async()=>{
 assert.equal(typeof E.inspectEncounter,'function');const {packet,trust,at}=await fixture(decision);const r=await E.inspectEncounter(packet,trust,at);
 assert.equal(r.decision,decision.toUpperCase());assert.equal(r.proposal_sha256,packet.crossing.payload_refs[0].address);
 assert.equal(r.return_verified,true);assert.equal(r.delivery_enabled,false);assert.equal(r.two_device_encounter,'UNOBSERVED');assert.equal(r.authenticated_transport,'UNOBSERVED');
 assert.deepEqual(await E.inspectEncounter(JSON.stringify(packet),trust,at),r);
});
test('trust is mandatory and not adopted from an embedded invitation or return key',async()=>{
 assert.equal(typeof E.inspectEncounter,'function');const f=await fixture();await assert.rejects(()=>E.inspectEncounter(f.packet,null,f.at));
 for(const key of ['issuer_key_fingerprint','source_key_fingerprint']){const trust=structuredClone(f.trust);trust[key]='sha256:'+'0'.repeat(64);await assert.rejects(()=>E.inspectEncounter(f.packet,trust,f.at));}
 const packet=structuredClone(f.packet);packet.trust=f.trust;await assert.rejects(()=>E.inspectEncounter(packet,f.trust,f.at));
});
test('pending expired/revoked invitations refuse approach while completed returns remain historical evidence',async()=>{
 assert.equal(typeof E.inspectEncounter,'function');const {packet,trust,at}=await fixture();const pending={...packet,response:null};
 const p=await E.inspectEncounter(pending,trust,at);assert.equal(p.return_verified,false);assert.equal(p.decision,'UNOBSERVED');
 await assert.rejects(()=>E.inspectEncounter(pending,trust,'2026-10-06T20:26:00.000Z'),/EXPIRED/);
 const revoked={...trust,revoked_invitation_ids:[packet.invitation.invitation_id]};await assert.rejects(()=>E.inspectEncounter(pending,revoked,at),/REVOKED/);
 const historical=await E.inspectEncounter(packet,revoked,'2026-10-06T20:26:00.000Z');assert.equal(historical.return_verified,true);assert.equal(historical.invitation_available_at_cut,false);assert.equal(historical.delivery_enabled,false);
});
test('changed material, foreign signed return and receipt tampering reject',async()=>{
 assert.equal(typeof E.inspectEncounter,'function');const f=await fixture(),other=await fixture('admit');
 for(const mutate of [p=>p.material+='!',p=>p.crossing.source_world='world:intruder',p=>p.response=other.packet.response,p=>p.response.disposition_receipt.note='tampered',p=>p.response.crossing_id='wrong',p=>p.response.disposition_receipt=null]){
  const p=structuredClone(f.packet);mutate(p);await assert.rejects(()=>E.inspectEncounter(p,f.trust,f.at));
 }
});
test('unsafe invitation origins, secret fields, oversized packets and malformed trust reject',async()=>{
 assert.equal(typeof E.inspectEncounter,'function');const f=await fixture();
 for(const origin of ['http://world-a.example','https://world-a.example/?cap=x','https://user:pass@world-a.example','https://world-a.example/#x','https://world-a.example/path','https://evil.example']){
  const p=structuredClone(f.packet);p.invitation.origin=origin;await assert.rejects(()=>E.inspectEncounter(p,f.trust,f.at));
 }
 const privateKey=structuredClone(f.packet);privateKey.invitation.signing.public_key.d='secret';await assert.rejects(()=>E.inspectEncounter(privateKey,f.trust,f.at));
 const extra={...f.packet,bearer:'secret'};await assert.rejects(()=>E.inspectEncounter(extra,f.trust,f.at));
 await assert.rejects(()=>E.inspectEncounter(' '.repeat(131073),f.trust,f.at));
 await assert.rejects(()=>E.inspectEncounter(f.packet,{...f.trust,revoked_invitation_ids:'false'},f.at));
 await assert.rejects(()=>E.inspectEncounter(f.packet,f.trust,'not a clock'));
});
test('correctly signed native receipt extensions must be objects, not arrays/null/scalars',async()=>{
 const control=await resignedReceive();assert.equal((await E.inspectEncounter(control.packet,control.trust,control.at)).return_verified,true);
 for(const value of [[],null,true,0,'claimed authority']){
  const f=await resignedReceive(value);await assert.rejects(()=>E.inspectEncounter(f.packet,f.trust,f.at),/NATIVE_EXTENSIONS_OBJECT_REQUIRED/);
 }
});
test('valid source and receiver signatures cannot launder wrong scope or a wrong receive link',async()=>{
 for(const [stage,change] of [
  ['crossing',p=>p.crossing.source_world='world:other-source'],
  ['crossing',p=>p.crossing.source_particular='particular:other-source'],
  ['crossing',p=>p.crossing.audience_policy={destination:'world:other-receiver'}],
  ['receive',p=>p.response.receive_receipt.world_id='world:other-receiver'],
  ['receive',p=>p.response.receive_receipt.receiver_particular='particular:other-receiver'],
  ['receive',p=>p.response.receive_receipt.crossing_id='relatte-crossing-v0:'+'0'.repeat(64)],
  ['disposition',p=>p.response.disposition_receipt.extensions.local_receiver.receive_receipt_id='relatte-receipt-v0:'+'0'.repeat(64)],
  ['disposition',p=>p.response.disposition_receipt.semantic_effect='global-authority']
 ]){
  const f=await resignedReceive(undefined,(where,p)=>{if(where===stage)change(p);});
  await assert.rejects(()=>E.inspectEncounter(f.packet,f.trust,f.at),/PROPOSAL_SCOPE|FOUNDING_PROPOSAL_BINDING|RETURN_RECEIPT_BINDING|OWNER_DISPOSITION_BINDING|DISPOSITION_EFFECT/);
 }
});
