import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGrantBody,createRevocationBody,normalizePublicKey,randomNonce,
 signBody,grantDigest} from '../commons/wallet/authority/delegation-core.mjs';
import {previewGrant,makePin,validatePin,assess,validateRevocation,
 signReviewReceipt,verifyReviewReceipt} from '../commons/wallet/authority/core.mjs';

const AT='2026-11-03T21:00:00.000Z',NOW='2026-11-04T12:00:00.000Z',END='2026-11-10T21:00:00.000Z';
async function fixture(){
 const owner=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
 const exported=await crypto.subtle.exportKey('jwk',owner.publicKey);
 const ownerKey=normalizePublicKey({kty:exported.kty,crv:exported.crv,x:exported.x,y:exported.y});
 const grant=await signBody(createGrantBody({ownerPublicKey:ownerKey,issuedAt:AT,expiresAt:END,
   nonce:randomNonce(),scopes:['DRAFT_EXPERIMENT','PROPOSE_PULL_REQUEST','CHECK_MATH']
 }),owner.privateKey);
 const preview=await previewGrant(grant);
 const pin=makePin(preview,preview.public_key_fingerprint,true,NOW);
 const reviewKey=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
 return {owner,ownerKey,grant,preview,pin,reviewKey};
}
test('valid synthetic signed WF008 grant is only a PREVIEW until independently confirmed',async()=>{
 const f=await fixture();assert.equal(f.preview.signer_identity_independently_verified,false);
 assert.equal(f.preview.self_attested_only,true);
 assert.equal(validatePin(f.pin),true);
 assert.equal(f.pin.automatic_actions_enabled,false);
 assert.notEqual(f.preview.signed_grant_digest,f.preview.public_key_fingerprint);
});
test('typed complete fingerprint and explicit confirmation required',async()=>{
 const f=await fixture();
 assert.throws(()=>makePin(f.preview,'0'.repeat(64),true,NOW));
 assert.throws(()=>makePin(f.preview,f.preview.public_key_fingerprint,false,NOW));
 assert.throws(()=>makePin(f.preview,f.preview.public_key_fingerprint,true,END));
});
test('original grant signature tampering rejects import',async()=>{
 const f=await fixture();
 f.grant.body.scopes=['MERGE_CODE'];
 await assert.rejects(previewGrant(f.grant));
});
test('legitimate proposal yields bounded local HOLD not execution or native R3',async()=>{
 const f=await fixture();
 const d=await assess({grant:f.grant,pin:f.pin,action:'PROPOSE_PULL_REQUEST',at:NOW});
 assert.equal(d.decision,'HOLD');assert.equal(d.native_relatte_receipt,false);
 assert.equal(d.grants_third_party_access,false);
 assert.equal(d.automatic_merge,false);
 assert.equal(d.external_action_executed,false);
});
test('owner can explicitly refuse a currently allowed proposal',async()=>{
 const f=await fixture();const d=await assess({grant:f.grant,pin:f.pin,
   action:'CHECK_MATH',at:NOW,requestedDecision:'REFUSE'});
 assert.equal(d.decision,'REFUSE');assert.equal(d.policy_would_allow_review,true);
});
test('cannot HOLD a merge, spend, admission or unknown operation',async()=>{
 const f=await fixture();
 for(const action of ['MERGE_CODE','SPEND_FUNDS','ADMIT_CARTRIDGE','EXECUTE_SHELL']){
  const d=await assess({grant:f.grant,pin:f.pin,action,at:NOW});
  assert.equal(d.decision,'REFUSE');assert.equal(d.policy_would_allow_review,false);
 }
});
test('unrecognized identical-key different-grant nonce cannot substitute same local pin',async()=>{
 const f=await fixture();
 const second=await signBody(createGrantBody({ownerPublicKey:f.ownerKey,issuedAt:AT,expiresAt:END,
  nonce:randomNonce(),scopes:['PROPOSE_PULL_REQUEST']}),f.owner.privateKey);
 await assert.rejects(assess({grant:second,pin:f.pin,action:'PROPOSE_PULL_REQUEST',at:NOW}),/not the locally enrolled/);
});
test('changed owner cannot borrow a different pinned public fingerprint',async()=>{
 const f=await fixture(),other=await fixture();
 await assert.rejects(assess({grant:other.grant,pin:f.pin,action:'PROPOSE_PULL_REQUEST',at:NOW}));
});
test('signed exact grant revocation blocks later HOLD',async()=>{
 const f=await fixture();
 const rev=await signBody(createRevocationBody({ownerPublicKey:f.ownerKey,
  grantHash:await grantDigest(f.grant),revokedAt:NOW,nonce:randomNonce()}),f.owner.privateKey);
 await validateRevocation(rev,f.grant);
 const d=await assess({grant:f.grant,pin:f.pin,revocations:[rev],
   action:'DRAFT_EXPERIMENT',at:NOW});
 assert.equal(d.decision,'REFUSE');assert.equal(d.reason,'REVOKED_BY_OWNER');
});
test('revocation signed by a different key does not cancel original',async()=>{
 const f=await fixture(),other=await fixture();
 const bad=await signBody(createRevocationBody({ownerPublicKey:other.ownerKey,
  grantHash:await grantDigest(f.grant),revokedAt:NOW,nonce:randomNonce()}),other.owner.privateKey);
 await assert.rejects(validateRevocation(bad,f.grant),/exact pinned grant key/);
});
test('expired or not-yet-issued signed grants cannot HOLD',async()=>{
 const f=await fixture();
 assert.equal((await assess({grant:f.grant,pin:f.pin,action:'DRAFT_EXPERIMENT',at:END})).decision,'REFUSE');
 assert.equal((await assess({grant:f.grant,pin:f.pin,action:'DRAFT_EXPERIMENT',
  at:'2026-11-02T21:00:00.000Z'})).decision,'REFUSE');
});
test('local receipt signed by SEPARATE nonextractable P256 key and verifiable',async()=>{
 const f=await fixture();
 const decision=await assess({grant:f.grant,pin:f.pin,action:'PROPOSE_PULL_REQUEST',at:NOW});
 const signed=await signReviewReceipt(decision,f.reviewKey);
 assert.equal(await verifyReviewReceipt(signed),true);
 assert.equal(signed.body.receipt_signer_kind,'SEPARATE_BROWSER_LOCAL_KEY_NOT_GRANT_OWNER');
 assert.equal(signed.body.no_admission,true);
 assert.equal(signed.body.decision.native_relatte_receipt,false);
 assert.equal(signed.signer_public_key.d,undefined);
 assert.equal(f.reviewKey.privateKey.extractable,false);
});
test('no valid signature after modifying action/decision or recipient key',async()=>{
 const f=await fixture();
 const decision=await assess({grant:f.grant,pin:f.pin,action:'CHECK_MATH',at:NOW});
 const signed=await signReviewReceipt(decision,f.reviewKey);
 signed.body.decision.action='MERGE_CODE';
 assert.equal(await verifyReviewReceipt(signed),false);
});
test('no valid signature if malicious signer changes receipt to native R3 or auto admit',async()=>{
 const f=await fixture();
 const decision=await assess({grant:f.grant,pin:f.pin,action:'CHECK_MATH',at:NOW});
 const signed=await signReviewReceipt(decision,f.reviewKey);
 signed.body.decision.native_relatte_receipt=true;
 assert.equal(await verifyReviewReceipt(signed),false);
});
test('public Link Wallet link vault unmodified and owner metadata kept separate',()=>{
 const wallet=readFileSync(new URL('../commons/wallet/crypto.mjs',import.meta.url),'utf8');
 const store=readFileSync(new URL('../commons/wallet/authority/store.mjs',import.meta.url),'utf8');
 assert.match(wallet,/abundent\.link-wallet\/v1/);
 assert.match(store,/abundent_link_wallet_authority_003/);
 assert.doesNotMatch(store,/abundent_link_wallet_001/);
 assert.doesNotMatch(store,/localStorage|fetch\(|sendBeacon|navigator\.clipboard/);
});
test('wallet shortcut transfer still requires explicit same-origin approved save',()=>{
 const wallet=readFileSync(new URL('../commons/wallet/app.mjs',import.meta.url),'utf8');
 const sender=readFileSync(new URL('../commons/wallet/authority/app.mjs',import.meta.url),'utf8');
 assert.match(wallet,/openerPath\.endsWith\("\/commons\/wallet\/authority\/"\)/);
 assert.match(sender,/offerLinkToWallet/);
 assert.match(sender,/scope:'other'/);
 assert.doesNotMatch(sender,/URLSearchParams\(.*grant|fetch\(|localStorage/);
});
