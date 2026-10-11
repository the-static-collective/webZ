import test from 'node:test';
import assert from 'node:assert/strict';
import {createSignedReceiptWitness} from './receipt-witness-002.mjs';
import {verifySignedHold} from '../arrivals/receipts.mjs';
const corrupt=fn=>{const j=createSignedReceiptWitness();fn(j);return j;};
test('independent reLATTE P256 signed RECEIVED/HOLD journal verifies, no authority inflated',async()=>{
 const r=await verifySignedHold(createSignedReceiptWitness());
 assert.equal(r.status,'SIGNED_RECEIVED_AND_HELD');
 assert.equal(r.operator_identity,'NOT_AUTHENTICATED_BY_THIS_BUNDLE');
 assert.equal(r.world_admission,false);
 assert.equal(r.remote_delivery,false);
 assert.match(r.receive_receipt_id,/^relatte-receipt-v0:/);
 assert.match(r.hold_receipt_id,/^relatte-receipt-v0:/);
});
test('signed journal rejects forged receipts and wrong receiver even when event hash is not the issue',async()=>{
 for(const j of [
   corrupt(x=>x.events[1].receipt.note='mutated'),
   corrupt(x=>x.events[0].receipt.signing.signature='A'.repeat(86)),
   corrupt(x=>x.events[1].receipt.pre_state_ref='not-the-RECEIVED-state'),
   corrupt(x=>x.events[1].receipt.kind='R3_ADMIT'),
   corrupt(x=>x.events[1].receipt.extensions.local_receiver.protected_payload_effect=true),
   corrupt(x=>x.events[1].previous_hash='relatte-local-event-v0:'+'0'.repeat(64)),
   corrupt(x=>x.config.world_id='world:another'),
   corrupt(x=>x.receiver_public_key.x='A'.repeat(43)),
   corrupt(x=>x.carrier.source.content+='forged')
 ])await assert.rejects(verifySignedHold(j));
});
test('extra fields, missing receipts and too-large imports are refused',async()=>{
 for(const j of [
   corrupt(x=>x.operator_authenticated=true),
   corrupt(x=>x.events.pop()),
   corrupt(x=>x.events[0].receipt.publisher_signed=true)
 ])await assert.rejects(verifySignedHold(j));
 await assert.rejects(verifySignedHold(' '.repeat(65537)));
});
