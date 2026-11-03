#!/usr/bin/env node
/*
 * CIRCUIT 006 — Two-operator field crossing over manually transferred files.
 * Uses the original pinned Revival, GHoT (through 005) and reLATTE engines.
 * This program is a local ceremony tool, not proof of a person's identity.
 * Never enrolls an in-band key as an authenticated person; no ADMIT action.
 */
import {readFile, writeFile, mkdir, lstat} from 'node:fs/promises';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash, randomBytes} from 'node:crypto';
import {join, resolve, dirname, relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline/promises';

const RELATTE_COMMIT = 'd69a863943e071346527eafc79a63ef332d524af';
const REVIVAL_COMMIT = 'af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd';
const GHOT_COMMIT = '9748a0772c4a13135421c4fa84a9991e0a51e05f';
const MAX_BYTES = 65536;
const moduleDir = dirname(new URL(import.meta.url).pathname);

function requireCondition(value, reason) { if (!value) throw Error(reason); }
function option(args, name) {
  const idx=args.indexOf('--'+name);
  requireCondition(idx>=0 && typeof args[idx+1] === 'string' && !args[idx+1].startsWith('--'),
    'Missing required --'+name);
  return args[idx+1];
}
function has(args,name) {return args.includes('--'+name);}
function sha(bytes) {return createHash('sha256').update(bytes).digest('hex');}
function publicKey(input) {
  requireCondition(input && typeof input==='object' && !Array.isArray(input) &&
    Object.keys(input).sort().join(',')==='crv,kty,x,y' &&
    input.kty==='EC' && input.crv==='P-256', 'Expected ONLY an exportable P-256 PUBLIC JWK.');
  for (const k of ['x','y']) {
    requireCondition(typeof input[k]==='string' && /^[A-Za-z0-9_-]+$/.test(input[k]) &&
      Buffer.from(input[k],'base64url').length===32 &&
      Buffer.from(input[k],'base64url').toString('base64url')===input[k],
      'Invalid P-256 public coordinate '+k);
  }
  return {kty:'EC',crv:'P-256',x:input.x,y:input.y};
}
function fingerprint(key) {
  const k=publicKey(key);
  return 'sha256:'+sha(Buffer.from('ABUNDENT-CIRCUIT-006-P256-PUBLIC-KEY|'+
    JSON.stringify(k),'utf8'));
}
function exactCheckout(path, expected, marker) {
  const repo=resolve(path);
  const found=execFileSync('git',['-C',repo,'rev-parse','HEAD'],
    {encoding:'utf8',timeout:9000}).trim();
  requireCondition(found===expected,'Native donor checkout does not match pinned revision '+expected);
  return repo;
}
async function nativeApi(path) {
  const repo=exactCheckout(path,RELATTE_COMMIT,'src/receiver.ts');
  const [protocol,organ,transport,receiver]=await Promise.all(
    ['protocol.ts','organ.ts','transport.ts','receiver.ts'].map(file=>
      import(pathToFileURL(join(repo,'src',file)).href)));
  return {...protocol,...organ,...transport,...receiver};
}
async function strictFile(path, maximum=MAX_BYTES) {
  const bytes=await readFile(path);
  requireCondition(bytes.length>0 && bytes.length<=maximum,'File is empty or exceeds the bounded input limit.');
  return bytes;
}
async function jsonFile(path,maximum=MAX_BYTES) {
  return JSON.parse((await strictFile(path,maximum)).toString('utf8'));
}
async function absent(path) {
  try {await lstat(path);} catch(e) {
    if(e.code==='ENOENT')return;
    throw e;
  }
  throw Error('Refusing to overwrite an existing private identity or receiver directory: '+path);
}
function unrelated(a,b) {
  const x=relative(resolve(a),resolve(b));
  requireCondition(x==='..'||x.startsWith('..'+'/'),
    'Trusted enrollment must NOT live inside offered files or receiver directory.');
}
async function humanPrompt(title, expected) {
  requireCondition(process.stdin.isTTY && process.stdout.isTTY,
    'An interactive operator terminal is required. Automated test runs must be explicitly marked synthetic.');
  console.log(title);
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try {
    const response=await rl.question('Type '+expected+' exactly to continue: ');
    requireCondition(response.trim()===expected,'Operator did not authorize that local step.');
  } finally {rl.close();}
}
function mode(args) {
  const synthetic=has(args,'synthetic-ci');
  if(synthetic) {
    requireCondition(process.env.CI==='true','--synthetic-ci is reserved for explicit automated CI exercises.');
  }
  return synthetic ? 'CI_SYNTHETIC_INPUT_NOT_HUMAN' : 'SELF_ATTESTED_OPERATOR_CONSOLE_NOT_IDENTITY_PROOF';
}
function ensureDecision(v) {
  requireCondition(v==='HOLD'||v==='REFUSE','Only HOLD and REFUSE are valid. Admission is not implemented.');
  return v;
}
async function sourceVerifier(revival,sourcePath) {
  const pinned=exactCheckout(revival,REVIVAL_COMMIT,'src/revival/corpus.py');
  const python=spawnSync('python3',[join(moduleDir,'../crossing-005/source_005.py'),
      '--revival',pinned,'--check',sourcePath],
    {encoding:'utf8',timeout:30000});
  requireCondition(python.status===0,
    'Original Revival source re-derivation failed: '+(python.stderr||'').slice(0,450));
}
function checkCandidate(payload) {
  const corpus=payload?.source?.corpus;
  requireCondition(payload?.schema==='abundent.living-witness.candidate/v0' &&
    payload.status==='UNVERIFIED_METHOD_CANDIDATE' &&
    payload.source.revision===REVIVAL_COMMIT &&
    corpus?.id==='oshb-v2.2-genesis-opening' &&
    corpus.recipe_id==='surface' &&
    Array.isArray(corpus.witnesses) && corpus.witnesses.length===3 &&
    corpus.witnesses.map(w=>w.locator).join(',')==='Gen.1.1,Gen.1.2,Gen.1.3' &&
    Array.isArray(corpus.lemma_index?.['430']) && corpus.lemma_index['430'].length===3 &&
    payload?.bounded_compute?.commit===GHOT_COMMIT &&
    payload?.method?.reusable_only_as==='NEW_PROPOSED_UNAPPROVED_PROJECT' &&
    payload?.social_context?.event_occurred===false &&
    payload?.social_context?.real_people_present===false &&
    payload?.social_context?.independent_human_review===false &&
    typeof payload?.source?.oshb_source?.license?.attribution==='string',
    'Not the expected bounded, unapproved OSHB source candidate.');
}
async function offered(api,offerDir,expectedKey,revival) {
  const sourcePath=join(offerDir,'source-payload.json');
  const bytes=await strictFile(sourcePath);
  const payload=JSON.parse(bytes.toString('utf8'));
  checkCandidate(payload);
  const frame=await jsonFile(join(offerDir,'signed-crossing.json'),150000);
  requireCondition(frame.transport==='file-bundle','Only manually delivered file-bundle transport is allowed.');
  const crossing=await api.verifyAndExtractTransportFrame(frame);
  requireCondition(await api.verifyOpaqueOrganCrossing(crossing),
    'Native reLATTE opaque crossing signature/descriptor invalid.');
  const signer=publicKey(crossing.signing.public_key);
  requireCondition(fingerprint(signer)===fingerprint(expectedKey),
    'The signed sender key differs from the separately enrolled key.');
  const desc=crossing.extensions?.organ_adapter;
  const effects=crossing.requested_effect;
  requireCondition(crossing.source_world==='fictional-fellowship-workshop' &&
    crossing.source_particular==='synthetic-source-key-no-person-identified' &&
    crossing.declared_kind==='OPAQUE_ORGAN_ARTIFACT' &&
    crossing.payload_refs?.length===1 &&
    crossing.payload_refs[0].address==='sha256:'+sha(bytes) &&
    crossing.payload_refs[0].media_type==='application/json' &&
    crossing.payload_refs[0].role==='exact-public-source-and-method' &&
    desc?.family_ref==='abundent.revival.living-witness/v0' &&
    desc?.donor_contract_ref==='revival:'+REVIVAL_COMMIT+'/oshb-v2.2-genesis-opening' &&
    desc?.artifact_kind==='OPTIONAL_SCRIPTURE_METHOD_REVIEW_ONLY' &&
    desc?.donor_claims?.source_commit===REVIVAL_COMMIT &&
    desc?.donor_claims?.source_corpus_sha256===payload.source.corpus.corpus_sha256 &&
    desc?.donor_claims?.human_observation===false &&
    desc?.donor_claims?.source_license_attribution===payload.source.oshb_source.license.attribution &&
    effects?.kind==='REVIEW_ONLY' && effects.may_admit===false &&
    effects.may_publish===false && effects.may_spend===false,
    'Proposed source content or authority differs from the signed review-only scope.');
  await sourceVerifier(revival,sourcePath);
  return {bytes,payload,crossing,frame};
}
async function printFingerprint(args) {
  const input=await jsonFile(option(args,'key'),2048);
  console.log(fingerprint(input));
}
async function enroll(args) {
  const synthetic=mode(args);
  const key=publicKey(await jsonFile(option(args,'key'),2048));
  const pin=fingerprint(key);
  const expected=option(args,'confirm-fingerprint');
  requireCondition(expected===pin,'Fingerprint mismatch. Stop: source identity is not established.');
  const channel=option(args,'channel');
  requireCondition(['face-to-face','live-call','ci-synthetic'].includes(channel),
    'Enrollment channel must be face-to-face or live-call, or CI-only.');
  requireCondition((channel==='ci-synthetic')===(synthetic==='CI_SYNTHETIC_INPUT_NOT_HUMAN'),
    'Synthetic enrollment and human enrollment must remain distinct.');
  const trustDir=resolve(option(args,'trust-dir'));
  if(channel!=='ci-synthetic') {
    await humanPrompt('Verify the FULL SHA-256 fingerprint directly with the sender over the named independent channel. Comparing two files delivered together is NOT independent key enrollment.\nFingerprint: '+pin,
      'ENROLL');
  }
  await absent(trustDir);
  await mkdir(trustDir,{mode:0o700});
  await writeFile(join(trustDir,'source-public-key.json'),JSON.stringify(key,null,2)+'\n',
    {flag:'wx',mode:0o600});
  const policy={schema:'abundent.source-pin-enrollment/v1',pin,channel,
    ceremony:synthetic,identityVerifiedBySoftware:false,
    note:'Out-of-band peer confirmation is self-attested by the local operator; not cryptographically proven.'};
  await writeFile(join(trustDir,'enrollment.json'),JSON.stringify(policy,null,2)+'\n',
    {flag:'wx',mode:0o600});
  console.log('ENROLLED LOCAL PIN '+pin+'; source human identity is not independently proven by software.');
}
async function accept(args) {
  const synthetic=mode(args);
  const offerDir=resolve(option(args,'offer'));
  const trustDir=resolve(option(args,'trust-dir'));
  const receiverRoot=resolve(option(args,'receiver'));
  const revival=option(args,'revival');
  const api=await nativeApi(option(args,'relatte'));
  // The pinned copy and receiver private data must live outside offer folder.
  for(const dir of [trustDir,receiverRoot]) {
    const r=relative(offerDir,dir);
    requireCondition(r==='..'||r.startsWith('..'+'/'),
      'Trust state and private receiver state cannot live inside an offered folder.');
  }
  requireCondition(trustDir!==receiverRoot,'Local trust and receiver homes must be separate.');
  const policy=await jsonFile(join(trustDir,'enrollment.json'),4096);
  const trusted=publicKey(await jsonFile(join(trustDir,'source-public-key.json'),2048));
  requireCondition(policy.schema==='abundent.source-pin-enrollment/v1' &&
    policy.pin===fingerprint(trusted) && policy.identityVerifiedBySoftware===false &&
    (synthetic==='CI_SYNTHETIC_INPUT_NOT_HUMAN' ||
      policy.ceremony==='SELF_ATTESTED_OPERATOR_CONSOLE_NOT_IDENTITY_PROOF'),
      'Independent enrollment policy missing, altered or mixed with CI mode.');
  const {bytes,crossing}=await offered(api,offerDir,trusted,revival);
  await absent(receiverRoot);
  const decision=synthetic==='CI_SYNTHETIC_INPUT_NOT_HUMAN'
    ? ensureDecision(option(args,'scripted-test-choice'))
    : null;
  let chosen=decision;
  if(!chosen) {
    console.log('Source verified against locally enrolled pin: '+policy.pin);
    console.log('Receiving candidate: OPTIONAL GENESIS 1:1-3 HEBREW LEARNING METHOD.');
    console.log('Source data retains OSHB text and annotation attribution. Nothing is approved or published.');
    console.log('You may HOLD bytes in local quarantine or REFUSE retention. No ADMIT action exists.');
    requireCondition(process.stdin.isTTY && process.stdout.isTTY,'This decision requires an interactive local terminal.');
    const rl=createInterface({input:process.stdin,output:process.stdout});
    try {chosen=ensureDecision((await rl.question('Choose exactly HOLD or REFUSE: ')).trim());}
    finally {rl.close();}
  }
  const world='field-receiver-'+randomBytes(9).toString('hex');
  const rx=await api.LocalReceiver.create(receiverRoot,{
    world_id:world,receiver_particular:world+'-local-key',
    contract_ref:'relatte:circuit-006-operator-review-only/v0'
  });
  const receive=await rx.receive(crossing,new Date().toISOString());
  requireCondition(receive.kind==='RECEIVED' && await api.verifyReceipt(receive),
    'Native receiver did not sign RECEIVE.');
  const disposition=await rx.dispose(crossing.crossing_id,chosen,new Date().toISOString(),{
    note:'Operator-selected '+chosen+'; no personal identity established, no ADMIT or publication.'
  });
  requireCondition(disposition.kind==='R3_'+chosen &&
    disposition.semantic_effect==='none' && await api.verifyReceipt(disposition),
    'Native receiver failed to sign requested local disposition.');
  const custody=await rx.verifyPayloadBytes(crossing.crossing_id,new Uint8Array(bytes),
    new Date().toISOString());
  requireCondition(custody.kind==='PAYLOAD_BYTES_VERIFIED' &&
    await api.verifyReceipt(custody),'Native receiver did not verify exact payload bytes.');
  const cold=await api.LocalReceiver.open(receiverRoot);
  const snapshot=cold.snapshot();
  requireCondition(snapshot.admitted.length===0 &&
    snapshot[chosen==='HOLD'?'held':'refused'].includes(crossing.crossing_id),
    'Cold receiver state did not preserve selected disposition.');
  const receiptPublic=publicKey(disposition.signing.public_key);
  const packet={
    schema:'abundent.circuit-006.operator-return/v1',
    status:synthetic,
    identityVerifiedBySoftware:false,
    humanObservationAuthenticated:false,
    signerPinEnrollment:'REQUIRES_INDEPENDENT_CHANNEL',
    sourceCrossingId:crossing.crossing_id,
    sourcePayloadSha256:sha(bytes),
    sourceSignerFingerprint:policy.pin,
    receiverSignerFingerprint:fingerprint(receiptPublic),
    receiverWorld:world,
    selectedDisposition:chosen,
    scope:'REVIEW_ONLY_NO_ADMISSION',
    nativeRelatte:true,
    noAutomaticProjectAdmission:true,
    noPublication:true,
    noPayment:true,
    receiveReceipt:receive,
    dispositionReceipt:disposition,
    custodyReceipt:custody,
    coldSnapshot:snapshot,
    caveat:'Signing key controls receipt authenticity, not operator identity. Actual physical custody is claimed by receiver; source cannot independently inspect it.'
  };
  // Only this export file may leave the receiving computer; receiverRoot also includes private keys!
  await writeFile(join(receiverRoot,'RETURN_ONLY_THIS_FILE.json'),
    JSON.stringify(packet,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log('RECEIVER '+chosen+' — native receipts verified after cold restart.');
  console.log('Receiver public-key fingerprint to confirm OUT OF BAND: '+fingerprint(receiptPublic));
  console.log('Transfer ONLY this return file to source: '+join(receiverRoot,'RETURN_ONLY_THIS_FILE.json'));
  console.log('NEVER transfer receiver-key.json, receiver journal, or the whole receiver folder.');
}
async function verifyReturn(args) {
  const api=await nativeApi(option(args,'relatte'));
  const offerDir=resolve(option(args,'offer'));
  const revival=option(args,'revival');
  const trusted=publicKey(await jsonFile(join(offerDir,'source-public-key.json'),2048));
  const {bytes,crossing}=await offered(api,offerDir,trusted,revival);
  const report=await jsonFile(option(args,'return'),180000);
  requireCondition(report.schema==='abundent.circuit-006.operator-return/v1' &&
    report.identityVerifiedBySoftware===false &&
    report.humanObservationAuthenticated===false &&
    report.scope==='REVIEW_ONLY_NO_ADMISSION' && report.nativeRelatte===true &&
    report.noAutomaticProjectAdmission===true &&
    report.noPayment===true && report.noPublication===true &&
    ['CI_SYNTHETIC_INPUT_NOT_HUMAN','SELF_ATTESTED_OPERATOR_CONSOLE_NOT_IDENTITY_PROOF'].includes(report.status) &&
    ['HOLD','REFUSE'].includes(report.selectedDisposition) &&
    report.sourceCrossingId===crossing.crossing_id &&
    report.sourcePayloadSha256===sha(bytes) &&
    report.sourceSignerFingerprint===fingerprint(trusted),
    'Return packet carries invalid origin, status or authority.');
  const {receiveReceipt:r,dispositionReceipt:d,custodyReceipt:c}=report;
  requireCondition(r && d && c &&
    await api.verifyReceipt(r) && await api.verifyReceipt(d) && await api.verifyReceipt(c),
    'One or more native reLATTE receiver signatures are invalid.');
  const key=publicKey(d.signing.public_key);
  const fpr=fingerprint(key);
  requireCondition(option(args,'expected-receiver-fingerprint')===fpr,
    'Receiver signer fingerprint differs from separately confirmed expected value.');
  for(const item of [r,c]){
    requireCondition(fingerprint(item.signing.public_key)===fpr,
      'Receiver receipts do not share independently confirmed signer key.');
  }
  const id=crossing.crossing_id, which=report.selectedDisposition;
  const custody=c.extensions?.local_receiver?.payload_custody;
  requireCondition(report.receiverSignerFingerprint===fpr &&
    /^field-receiver-[0-9a-f]{18}$/.test(report.receiverWorld) &&
    r.kind==='RECEIVED' && r.semantic_effect==='none' &&
    d.kind==='R3_'+which && d.semantic_effect==='none' &&
    c.kind==='PAYLOAD_BYTES_VERIFIED' && c.semantic_effect==='none' &&
    [r,d,c].every(v=>v.crossing_id===id &&
      v.world_id===report.receiverWorld &&
      v.receiver_particular===report.receiverWorld+'-local-key') &&
    custody?.sha256===sha(bytes) &&
    custody?.byte_length===bytes.length &&
    custody?.disposition===which &&
    custody?.retained===(which==='HOLD') &&
    custody?.receive_receipt_id===r.receipt_id &&
    custody?.disposition_receipt_id===d.receipt_id &&
    c.pre_state_ref===c.post_state_ref &&
    report.coldSnapshot?.world_id===report.receiverWorld &&
    report.coldSnapshot?.admitted?.length===0 &&
    report.coldSnapshot?.[which==='HOLD'?'held':'refused']?.includes(id),
    'Returned receipts do not agree on exact source, receiver, disposition, or custody.');
  console.log('VERIFIED native receipt signatures and expected receiver key for '+which+'.');
  console.log('This verifies signed claims only. It does NOT independently prove a human identity, physical device, activity or source-byte retention.');
}
async function main() {
  const [cmd,...args]=process.argv.slice(2);
  if(cmd==='fingerprint') return printFingerprint(args);
  if(cmd==='enroll') return enroll(args);
  if(cmd==='receive') return accept(args);
  if(cmd==='verify-return') return verifyReturn(args);
  throw Error('Usage: node --experimental-strip-types field_006.mjs fingerprint|enroll|receive|verify-return with required flags. See FIELD_CARD.md.');
}
main().catch(e=>{console.error('CIRCUIT 006 REFUSED: '+e.message);process.exitCode=1;});
