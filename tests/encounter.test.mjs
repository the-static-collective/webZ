import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const E=await import('../app/encounter.mjs').catch(()=>({}));
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
