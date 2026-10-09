import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,chmodSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fresh,holdReflection,emptyJournal} from '../worlds/wandering-lens/model.mjs';
import {emptyAnnex,proposeAnnex,inspectProposal,disposeProposal,exportAnnex} from '../worlds/wandering-lens/annex.mjs';
import {LAB,SIGNED,BUNDLE,ACK,newIdentity,publicOf,checkPub,sha,canonical,
 candidatePetition,founderAdmission,ownerAcceptance,ownerWithdrawal,makeBundle,
 verifyCharter,verifyPaper,worldId} from '../founder-node/founder.mjs';

const source=async()=>{
 const journal=holdReflection(emptyJournal(),fresh(),'Private visitor thought never publicly reproduced.');
 let annex=await proposeAnnex(emptyAnnex(),journal,1,'WORLD_SKETCH','The Side Room',
  'An independently governed idea, not a claim about history.');
 annex=await inspectProposal(annex,journal,'wl2-001');
 annex=await disposeProposal(annex,journal,'wl2-001','ADMIT');
 return exportAnnex(annex,journal);
};
const forged=async()=>{
 const founder=newIdentity(),candidate=newIdentity(),annex=await source();
 const petition=await candidatePetition(annex,'wl2-001',candidate.privatePem);
 const admission=founderAdmission(petition,candidate.public,founder.privatePem,ACK);
 const acceptance=ownerAcceptance(petition,admission,candidate.privatePem,founder.public);
 const bundle=makeBundle(petition,admission,acceptance);
 const pins={candidatePin:candidate.public,founderPin:founder.public};
 return {founder,candidate,annex,petition,admission,acceptance,bundle,pins};
};
test('source export is independently verified and creates a redacted candidate-signed petition',async()=>{
 const a=await forged();assert.equal(a.petition.role,'CANDIDATE_PETITION');
 assert.equal(a.petition.body.world.title,'The Side Room');
 assert.equal(a.petition.body.source.source_address,'MWF1/t06g06');
 assert.equal(a.petition.body.world.child_address,'MWF1/t06g06/t06g06');
 assert.equal(a.petition.body.candidate.algorithm,'Ed25519');
 const serialized=JSON.stringify(a.petition);
 assert.ok(!serialized.includes('Private visitor thought'));
 assert.ok(!serialized.includes('UNVERIFIED_VISITOR_REFLECTION'));
});
test('candidate/founder public keys are different and separately pinned',async()=>{
 const a=await forged();assert.notDeepEqual(a.candidate.public,a.founder.public);
 assert.deepEqual(publicOf(a.candidate.privatePem),a.candidate.public);
 assert.deepEqual(publicOf(a.founder.privatePem),a.founder.public);
 assert.deepEqual(checkPub(a.candidate.public),a.candidate.public);
});
test('full two-key and owner acknowledgement chain yields experiment only',async()=>{
 const a=await forged(),v=verifyCharter(a.bundle,a.pins);
 assert.equal(v.status,'ACTIVE_LOCAL_EXPERIMENTAL');
 assert.equal(v.world.id,worldId(a.petition.body));
 assert.equal(v.world.registered_in_webz_sovereign_worlds,false);
 assert.equal(v.world.deployable,false);assert.equal(v.world.entry_url,null);
 assert.equal(v.crossings,0);assert.equal(v.media_plays,0);
 assert.equal(v.identity_or_legal_ownership_verified,false);
 assert.equal(v.verification,'TWO_DISTINCT_ED25519_KEY_POSSESSIONS');
});
test('acceptance must bind exact founder admission and owner',async()=>{
 const a=await forged(),p=a.acceptance.body;
 assert.equal(p.admission_ref,sha(a.admission));
 assert.equal(p.petition_ref,sha(a.petition));
 assert.deepEqual(p.owner,a.candidate.public);
 assert.equal(p.source_rights,'NOT_VERIFIED');
});
test('founder must explicitly opt into this exact non-sovereign scope',async()=>{
 const a=await forged();
 for(const s of [undefined,null,'YES','ADMIT','BROADCAST'])
 assert.throws(()=>founderAdmission(a.petition,a.candidate.public,a.founder.privatePem,s));
});
test('cannot assign identical key to candidate and founder roles',async()=>{
 const a=await forged();
 assert.throws(()=>founderAdmission(a.petition,a.candidate.public,a.candidate.privatePem,ACK),
  /TWO_DISTINCT_KEYS_REQUIRED/);
});
test('failed unsigned proposal or refusal never becomes a founder petition',async()=>{
 const candidate=newIdentity(),journal=holdReflection(emptyJournal(),fresh(),'Not yet admitted');
 const pending=await proposeAnnex(emptyAnnex(),journal,1,'WORLD_SKETCH','Pending World','A held trial.');
 await assert.rejects(()=>candidatePetition(await exportAnnex(pending,journal),'wl2-001',candidate.privatePem),/NOT_LOCAL_ADMITTED_SKETCH/);
 const inspected=await inspectProposal(pending,journal,'wl2-001');
 const refused=await disposeProposal(inspected,journal,'wl2-001','REFUSE');
 await assert.rejects(()=>candidatePetition(await exportAnnex(refused,journal),'wl2-001',candidate.privatePem),/NOT_LOCAL_ADMITTED_SKETCH/);
});
test('ordinary OBJECT overlays are never independently founded worlds',async()=>{
 const candidate=newIdentity(),journal=holdReflection(emptyJournal(),fresh(),'Object only');
 let l=await proposeAnnex(emptyAnnex(),journal,1,'OBJECT','A trunk','Only an object.');
 l=await inspectProposal(l,journal,'wl2-001');
 l=await disposeProposal(l,journal,'wl2-001','ADMIT');
 await assert.rejects(()=>candidatePetition(await exportAnnex(l,journal),'wl2-001',candidate.privatePem),/NOT_LOCAL_ADMITTED_SKETCH/);
});
test('tampered private annex is rejected before any petition is signed',async()=>{
 const a=await forged();const altered=structuredClone(a.annex);
 altered.payload.journal.entries[0].answer='Injected claim';
 await assert.rejects(()=>candidatePetition(altered,'wl2-001',a.candidate.privatePem));
});
test('wrong candidate signer fails pinned source identity',async()=>{
 const a=await forged(),third=newIdentity();
 assert.throws(()=>founderAdmission(a.petition,third.public,a.founder.privatePem,ACK),/PIN_MISMATCH/);
});
test('wrong founder pin denies admission and acceptance',async()=>{
 const a=await forged(),stranger=newIdentity();
 assert.throws(()=>ownerAcceptance(a.petition,a.admission,a.candidate.privatePem,stranger.public),/PIN_MISMATCH/);
 assert.throws(()=>verifyCharter(a.bundle,{candidatePin:a.candidate.public,founderPin:stranger.public}),/PIN_MISMATCH/);
});
test('attacker replacing candidate pin cannot verify inherited owner charter',async()=>{
 const a=await forged(),stranger=newIdentity();
 assert.throws(()=>verifyCharter(a.bundle,{candidatePin:stranger.public,founderPin:a.founder.public}),/PIN_MISMATCH/);
});
test('wrong owner key cannot counter-accept founder admission',async()=>{
 const a=await forged(),other=newIdentity();
 assert.throws(()=>ownerAcceptance(a.petition,a.admission,other.privatePem,a.founder.public),/PIN_MISMATCH/);
});
test('tampered petition title or source digest breaks candidate signature',async()=>{
 const a=await forged();
 for(const mutator of [
   p=>p.body.world.title='Other title',
   p=>p.body.source.reflection_ref='sha256:'+'a'.repeat(64),
   p=>p.body.world.child_address='MWF1/t10g10',
   p=>p.body.scope='GLOBAL_WORLD_AUTHORITY'
 ]){
  const item=structuredClone(a.bundle);mutator(item.petition);
  assert.throws(()=>verifyCharter(item,a.pins));
 }
});
test('tampered rights or namespace id break founder signature',async()=>{
 const a=await forged();
 for(const mutator of [
   b=>b.admission.body.rights='WORLDWIDE_MUSIC_LICENSE',
   b=>b.admission.body.world_id='webz:the-static-collective/sanctuary',
   b=>b.admission.body.delegated_by_founder=true
 ]){
  const copy=structuredClone(a.bundle);mutator(copy);
  assert.throws(()=>verifyCharter(copy,a.pins));
 }
});
test('swapped founder admissions cannot be accepted across petitions',async()=>{
 const a=await forged(),b=await forged();
 const wrong=makeBundle(a.petition,b.admission,a.acceptance);
 assert.throws(()=>verifyCharter(wrong,a.pins));
});
test('owner acknowledgment signature and exact founder binding required',async()=>{
 const a=await forged();
 const fake=structuredClone(a.bundle);
 fake.acceptance.signature='A'.repeat(88);
 assert.throws(()=>verifyCharter(fake,a.pins));
 const another=structuredClone(a.bundle);
 another.acceptance.body.admission_ref='sha256:'+'f'.repeat(64);
 assert.throws(()=>verifyCharter(another,a.pins));
});
test('signed withdrawal changes current local projection without altering provenance',async()=>{
 const a=await forged();
 const withdrawal=ownerWithdrawal(a.bundle,a.candidate.privatePem,a.founder.public);
 const v=verifyCharter(a.bundle,{...a.pins,withdrawal});
 assert.equal(v.status,'OWNER_WITHDRAWN_LOCAL');
 assert.equal(v.world.id,worldId(a.petition.body));
 assert.equal(v.media_plays,0);
});
test('a stranger cannot sign a valid owner withdrawal',async()=>{
 const a=await forged(),stranger=newIdentity();
 assert.throws(()=>ownerWithdrawal(a.bundle,stranger.privatePem,a.founder.public),/PIN_MISMATCH/);
});
test('withdrawal for another charter cannot revoke this charter',async()=>{
 const a=await forged(),b=await forged();
 const wrong=ownerWithdrawal(b.bundle,b.candidate.privatePem,b.founder.public);
 assert.throws(()=>verifyCharter(a.bundle,{...a.pins,withdrawal:wrong}));
});
test('forged withdrawal fields or decision are denied',async()=>{
 const a=await forged(),w=ownerWithdrawal(a.bundle,a.candidate.privatePem,a.founder.public);
 for(const modify of [
  e=>e.body.decision='REPLAY_LICENSE',
  e=>e.body.owner=a.founder.public,
  e=>e.body.extra='permission'
 ]){
  const bad=structuredClone(w);modify(bad);
  assert.throws(()=>verifyCharter(a.bundle,{...a.pins,withdrawal:bad}));
 }
});
test('independent cold replay is deterministic across identical signed packets',async()=>{
 const a=await forged(),copy=JSON.parse(JSON.stringify(a.bundle));
 assert.deepEqual(verifyCharter(copy,a.pins),verifyCharter(a.bundle,a.pins));
 assert.equal(sha(copy),sha(a.bundle));
});
test('malformed keys, noncanonical base64 or algorithm substitution fail',async()=>{
 const a=await forged();
 for(const mod of [
  k=>k.algorithm='RSA',k=>k.extra='INSTITUTIONAL_GRANT',k=>k.spki='!!!!!',
  k=>k.spki=k.spki+'='
 ]){
  const pub=structuredClone(a.candidate.public);mod(pub);assert.throws(()=>checkPub(pub));
 }
});
test('the public petition never carries source reflection content or private PEM',async()=>{
 const a=await forged(),data=JSON.stringify(a.bundle);
 assert.ok(!data.includes('Private visitor thought'));
 assert.ok(!data.includes('BEGIN PRIVATE KEY'));
 assert.ok(!data.includes('Local visitor questions'));
});
test('a saved key must not be overwritten or group-readable by CLI',()=>{
 const temp=mkdtempSync(join(tmpdir(),'webz-founder-cli-'));
 const key=join(temp,'owner.pem'),cli=join(process.cwd(),'scripts/founder-node-003.mjs');
 const run=(...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
 const first=run('init','--key',key);assert.equal(first.status,0,first.stderr);
 assert.ok(existsSync(key+'.pub.json'));
 assert.equal(run('init','--key',key).status,1);
 chmodSync(key,0o644);
 assert.equal(run('petition','--key',key,'--annex','does-not-exist','--proposal','wl2-001','--out',join(temp,'p.json')).status,1);
});
test('separate CLI subprocesses verify and withdraw an actual complete public-paper ceremony',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'webz-founder-cli-roundtrip-'));
 const cli=join(process.cwd(),'scripts/founder-node-003.mjs');
 const run=(...args)=>{
  const out=spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
  assert.equal(out.status,0,out.stderr);return JSON.parse(out.stdout);
 };
 const owner=join(temp,'candidate.pem'),founder=join(temp,'founder.pem');
 run('init','--key',owner);run('init','--key',founder);
 const privateAnnex=join(temp,'annex.json');writeFileSync(privateAnnex,JSON.stringify(await source()),{mode:0o600});
 const petition=join(temp,'petition.json'),admission=join(temp,'admission.json');
 const acceptance=join(temp,'acceptance.json'),bundle=join(temp,'bundle.json'),withdrawal=join(temp,'withdrawal.json');
 run('petition','--annex',privateAnnex,'--proposal','wl2-001','--key',owner,'--out',petition);
 const noApproval=spawnSync(process.execPath,[cli,'admit','--petition',petition,'--candidate-pin',owner+'.pub.json','--key',founder,'--out',admission],{encoding:'utf8'});
 assert.equal(noApproval.status,1);
 run('admit','--petition',petition,'--candidate-pin',owner+'.pub.json','--key',founder,'--approve-local-world','--out',admission);
 run('accept','--petition',petition,'--admission',admission,'--founder-pin',founder+'.pub.json','--key',owner,'--out',acceptance);
 run('bundle','--petition',petition,'--admission',admission,'--acceptance',acceptance,'--out',bundle);
 const v=run('verify','--bundle',bundle,'--candidate-pin',owner+'.pub.json','--founder-pin',founder+'.pub.json');
 assert.equal(v.status,'ACTIVE_LOCAL_EXPERIMENTAL');
 run('withdraw','--bundle',bundle,'--founder-pin',founder+'.pub.json','--key',owner,'--out',withdrawal);
 const held=run('verify','--bundle',bundle,'--candidate-pin',owner+'.pub.json','--founder-pin',founder+'.pub.json','--withdrawal',withdrawal);
 assert.equal(held.status,'OWNER_WITHDRAWN_LOCAL');
 assert.ok(!JSON.stringify(JSON.parse(readFileSync(petition,'utf8'))).includes('Private visitor thought'));
});
