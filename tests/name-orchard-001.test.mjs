import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 BUNDLE,CLAIM,OFFER,RECEIPT,SONG_HASH,SONG_ID,newDemoIdentity,hashOf,
 makeClaim,checkClaim,resolveClaims,checkLocalBytes,makeOffer,receiveOffer,
 verifyRecord,verifyWitness,buildWitness
} from '../scripts/name-orchard-001-core.mjs';

const mk=()=>buildWitness();
const clone=x=>structuredClone(x);
test('signed independent identities: integrity, not creator authorization',()=>{
 const a=newDemoIdentity(),b=newDemoIdentity();
 assert.notEqual(a.id,b.id);
 assert.ok(a.id.startsWith('ed25519:'));
 const subject={source:'SUNO',source_id:SONG_ID,title:'Let It Find Us',
  source_url:'https://suno.com/s/'+SONG_ID,content_sha256:SONG_HASH};
 const c=makeClaim(a,'let-it-find-us',subject);
 assert.equal(c.schema,CLAIM);assert.equal(checkClaim(c),true);
 assert.ok(!JSON.stringify(c).includes('PRIVATE KEY'));
 assert.ok(!Object.hasOwn(c,'privateKey'));
 assert.throws(()=>checkClaim({...c,body:{...c.body,name:'another-name'}}),/BAD_SIGNATURE/);
 assert.throws(()=>checkClaim({...c,signer:{...c.signer,id:b.id}}),/SIGNER_KEY_MISMATCH/);
});
test('one claim, zero claims and two same-name signers never silently pick a winner',()=>{
 const b=mk();
 const first=resolveClaims([b.claims[0]],'let-it-find-us');
 assert.equal(first.state,'ONE_UNTRUSTED_CLAIM');
 assert.equal(first.selection,'NONE');
 const none=resolveClaims(b.claims,'unregistered-name');
 assert.equal(none.state,'NOT_FOUND');
 assert.deepEqual(none.candidates,[]);
 const conflict=resolveClaims(b.claims,'let-it-find-us');
 assert.equal(conflict.state,'AMBIGUOUS');
 assert.equal(conflict.candidates.length,2);
 assert.equal(conflict.selection,'NONE');
 assert.deepEqual(resolveClaims([...b.claims,b.claims[0]],'let-it-find-us'),conflict);
});
test('portable six-signature witness for uploaded first song remains metadata-only',()=>{
 const b=mk(),audit=verifyWitness(b);
 assert.equal(b.schema,BUNDLE);
 assert.equal(audit.verified_signatures,6);
 assert.equal(audit.custodian_a,'ABSENT_UNVERIFIED');
 assert.equal(audit.custodian_b,'ABSENT_UNVERIFIED');
 assert.equal(audit.resolution,'AMBIGUOUS');
 assert.equal(audit.receiver,'HELD_FOR_REVIEW');
 assert.equal(audit.media_transferred,false);
 assert.equal(b.song.content_sha256,SONG_HASH);
 assert.equal(b.song.submitted_bytes_included,false);
 assert.equal(b.crossing.offer.body.media_bytes_included,false);
 assert.equal(b.crossing.receipt.body.media_bytes_received,false);
 assert.ok(JSON.stringify(b).length<262144);
 assert.ok(!JSON.stringify(b).includes('BEGIN PRIVATE KEY'));
});
test('custodian A checks actual bytes independently, not asserted availability',()=>{
 const bytes=Buffer.from('content-addressed lab specimen');
 const digest=hashOf('not a content digest');
 assert.equal(checkLocalBytes(null,SONG_HASH),'ABSENT_UNVERIFIED');
 assert.equal(checkLocalBytes(bytes,SONG_HASH),'HASH_MISMATCH');
 const b=buildWitness(bytes);
 assert.equal(verifyWitness(b).custodian_a,'HASH_MISMATCH');
 assert.equal(verifyWitness(b).custodian_b,'ABSENT_UNVERIFIED');
 assert.notEqual(digest,SONG_HASH);
});
test('metadata crossing signed by sender and accepted only by target receiver',()=>{
 const a=newDemoIdentity(),b=newDemoIdentity(),wrong=newDemoIdentity();
 const c=mk().claims[0]; // Its signer is not necessarily the sender; assertions may be carried.
 const offer=makeOffer(a,b.id,c);
 assert.equal(offer.schema,OFFER);
 assert.equal(verifyRecord(offer,OFFER),true);
 const receipt=receiveOffer(b,c,offer);
 assert.equal(receipt.schema,RECEIPT);
 assert.equal(verifyRecord(receipt,RECEIPT),true);
 assert.equal(receipt.body.offer_sha256,hashOf(offer));
 assert.equal(receipt.body.media_bytes_received,false);
 assert.throws(()=>receiveOffer(wrong,c,offer),/OFFER_INVALID/);
 const tampered=clone(offer);
 tampered.body.media_bytes_included=true;
 assert.throws(()=>receiveOffer(b,c,tampered),/BAD_SIGNATURE/);
});
test('attempts to replace local custody or received HOLD are rejected',()=>{
 const a=mk();
 for(const edit of [
  b=>b.custody[1].body.status='VERIFIED_LOCAL_BYTES',
  b=>b.custody[0].body.content_sha256='0'.repeat(64),
  b=>b.crossing.offer.body.carrier='AUDIO_TRANSFER',
  b=>b.crossing.receipt.body.media_bytes_received=true,
  b=>b.claims[1].body.name='somebody-else',
  b=>b.resolution.selection='fake-winner',
  b=>b.song.submitted_bytes_included=true
 ]){
  const t=clone(a);edit(t);assert.throws(()=>verifyWitness(t));
 }
});
test('independent receiver cannot impersonate sender or claim a transferred file',()=>{
 const b=mk();
 const forged=clone(b);
 forged.crossing.offer.signer=forged.crossing.receipt.signer;
 assert.throws(()=>verifyWitness(forged));
 const swapped=clone(b);
 swapped.custody=[...swapped.custody].reverse();
 assert.throws(()=>verifyWitness(swapped),/CUSTODY_INDEPENDENCE/);
});
test('source identity and hash values are explicit, not inferred from song title',()=>{
 const b=mk();
 assert.equal(b.claims[0].body.subject.source,'SUNO');
 assert.equal(b.claims[1].body.subject.source,'FICTIONAL');
 assert.equal(b.claims[0].body.name,b.claims[1].body.name);
 assert.notEqual(b.claims[0].body.subject.content_sha256,b.claims[1].body.subject.content_sha256);
 assert.equal(b.resolution.reason,'SIGNED_CLAIM_IS_NOT_NAMESPACE_AUTHORITY');
});
test('name orchard UI is offline-first: user-selected JSON, no implicit playback',()=>{
 const html=readFileSync(new URL('../worlds/name-orchard/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../worlds/name-orchard/orchard.mjs',import.meta.url),'utf8');
 const cli=readFileSync(new URL('../scripts/name-orchard-001.mjs',import.meta.url),'utf8');
 assert.ok(html.includes('id="bundle"'));
 assert.ok(html.includes("connect-src 'none'"));
 assert.ok(html.includes("media-src 'none'"));
 assert.ok(js.includes("crypto.subtle.verify('Ed25519'"));
 assert.ok(!js.includes('fetch('));
 assert.ok(!js.includes('new Audio('));
 assert.ok(!html.includes('<audio'));
 assert.ok(!html.includes('<iframe'));
 assert.ok(cli.includes("buildWitness(bytes)"));
 assert.ok(!cli.includes('http'));
 assert.ok(!readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes('.mp3'));
});
