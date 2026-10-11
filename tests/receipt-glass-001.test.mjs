import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSignedReceiptWitness} from './receipt-witness-002.mjs';
import {inspectReceipt,lensNames} from '../receipts/inspect.mjs';
const witness=()=>createSignedReceiptWitness();
test('real GrO journal verifies source, both signatures and local HOLD chain',async()=>{
 const result=await inspectReceipt(witness());
 assert.equal(result.schema,'webz/receipt-glass-001/v0');
 assert.equal(result.mode,'LOCAL_JOURNAL_VERIFIED');
 assert.equal(result.cryptographic_verification,true);
 assert.equal(result.fields.disposition,'HOLD');
 assert.equal(result.steps.length,3);
 assert.equal(result.operator_identity,'NOT_AUTHENTICATED');
 assert.equal(result.authority,'NO_AUTHORITY_GRANTED_BY_VIEWER');
 assert.equal(lensNames.length,11);
});
test('standalone reLATTE crossing is signed, not an authenticated delivery',async()=>{
 const r=await inspectReceipt(witness().carrier.crossing);
 assert.equal(r.mode,'SIGNATURE_ONLY');
 assert.equal(r.type,'reLATTE signed crossing');
 assert.equal(r.independent_material_custody,'NOT_ESTABLISHED');
 assert.equal(r.remote_delivery,'NOT_ESTABLISHED');
 assert.equal(r.steps.length,1);
});
test('standalone reLATTE receipt is signature-only, never state replay',async()=>{
 const j=witness(),r=await inspectReceipt(j.events[1].receipt);
 assert.equal(r.mode,'SIGNATURE_ONLY');
 assert.equal(r.fields.kind,'R3_HOLD');
 assert.match(r.lenses.ancestry,/not supplied/);
});
test('tampering and unsupported shapes are refused, never demoted to signed',async()=>{
 const forged=witness().events[1].receipt;
 forged.kind='R3_ADMIT';
 const extra=witness().carrier.crossing;
 extra.operator_authenticated=true;
 const altered=witness();
 altered.events[1].receipt.note='tampered';
 for(const b of [forged,extra,altered,{schema:'relatte.receipt/v0',kind:'R3_HOLD'},{schema:'unrelated/v1'},' '.repeat(131073)]){
  await assert.rejects(inspectReceipt(b));
 }
});
test('CANNON archived summary is explicitly NOT cryptographically verified',async()=>{
 const raw=readFileSync(new URL('../receipts/fixtures/cannon-009.json',import.meta.url),'utf8');
 const result=await inspectReceipt(raw);
 assert.equal(result.mode,'UNVERIFIED_ARCHIVE');
 assert.equal(result.cryptographic_verification,false);
 assert.equal(result.fields.disposition,'HOLD');
 assert.match(result.steps[2].detail,/does not independently verify/);
 const changed=JSON.parse(raw);changed.remote_effects=1;
 await assert.rejects(inspectReceipt(changed));
});
test('no transport, persistence or authority side effects in browser surface',()=>{
 const html=readFileSync(new URL('../receipts/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../receipts/ui.mjs',import.meta.url),'utf8');
 const core=readFileSync(new URL('../receipts/inspect.mjs',import.meta.url),'utf8');
 assert.match(html,/connect-src 'self'/);
 assert.match(html,/READ ONLY/);
 assert.ok(!/localStorage|sessionStorage|indexedDB|sendBeacon|WebSocket|fetch\(/.test(core));
 assert.ok(!/innerHTML|localStorage|sessionStorage|indexedDB/.test(ui));
 assert.match(ui,/textContent/);
 assert.match(ui,/aria-pressed/);
});
