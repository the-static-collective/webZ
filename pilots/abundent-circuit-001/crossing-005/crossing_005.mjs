#!/usr/bin/env node
/* Living Witness 005: native reLATTE signed source candidate and sovereign HOLD/REFUSE.
 * Never implies human identity, church consent, translation authority or adoption. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const RELATTE_PIN = 'd69a863943e071346527eafc79a63ef332d524af';
const REVIVAL_PIN = 'af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function guard(ok, reason) {if (!ok) throw Error(reason);}
function field(args,name) {
  const i=args.indexOf('--'+name);
  guard(i>=0 && typeof args[i+1] === 'string' && !args[i+1].startsWith('--'), 'Missing --'+name);
  return args[i+1];
}
function exactRepo(repo, pin, marker) {
  const found=execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',timeout:7000}).trim();
  guard(found===pin,'Donor must be pinned at '+pin);
  return repo;
}
async function donors(repo) {
  const root=exactRepo(resolve(repo),RELATTE_PIN,'src/organ.ts');
  const [organ,protocol,transport,receiver] = await Promise.all(
    ['organ.ts','protocol.ts','transport.ts','receiver.ts'].map(x =>
      import(pathToFileURL(join(root,'src',x)).href))
  );
  return {...organ,...protocol,...transport,...receiver};
}
function validateSource(payload) {
  guard(payload && payload.schema==='abundent.living-witness.candidate/v0' &&
    payload.status==='UNVERIFIED_METHOD_CANDIDATE' &&
    payload.social_context?.real_people_present===false &&
    payload.social_context?.event_occurred===false &&
    payload.social_context?.independent_human_review===false &&
    payload.method?.reusable_only_as==='NEW_PROPOSED_UNAPPROVED_PROJECT' &&
    payload.source?.revision===REVIVAL_PIN, 'Candidate violates fixed unapproved source rules.');
  const c=payload.source.corpus;
  guard(c.id==='oshb-v2.2-genesis-opening' && c.recipe_id==='surface' &&
    c.witnesses.length===3 &&
    c.witnesses.map(v=>v.locator).join(',')==='Gen.1.1,Gen.1.2,Gen.1.3' &&
    c.lemma_index['430']?.length===3, 'OSHB corpus not the pinned source-backed Genesis opening.');
  guard(payload.source.oshb_source.license?.annotations &&
    payload.source.oshb_source.license?.attribution &&
    payload.bounded_compute?.commit==='9748a0772c4a13135421c4fa84a9991e0a51e05f',
    'Source attribution or bounded compute record missing.');
}
async function issue(args) {
  const api=await donors(field(args,'relatte'));
  const raw=await readFile(field(args,'candidate'));
  guard(raw.length>0 && raw.length<=65536,'Payload exceeds verified native receiver limit.');
  const payload=JSON.parse(raw.toString('utf8'));
  validateSource(payload);
  const output=resolve(field(args,'out'));
  await mkdir(output);
  const keys=await api.generateP256KeyPair(); // Ephemeral demonstration signer; NOT user's private key.
  const createdAt=new Date().toISOString();
  const spec={
    schema:'relatte.opaque-organ-spec/v0',
    family_ref:'abundent.revival.living-witness/v0',
    donor_contract_ref:'revival:'+REVIVAL_PIN+'/oshb-v2.2-genesis-opening',
    artifact_kind:'OPTIONAL_SCRIPTURE_METHOD_REVIEW_ONLY',
    source_world:'fictional-fellowship-workshop',
    source_particular:'synthetic-source-key-no-person-identified',
    source_history_head:null,
    payload_refs:[{address:'sha256:'+sha(raw),role:'exact-public-source-and-method',
      media_type:'application/json'}],
    donor_claims:{
      source_repo:'the-static-collective/revival',
      source_commit:REVIVAL_PIN,
      source_corpus_sha256:payload.source.corpus.corpus_sha256,
      classification:'UNVERIFIED_METHOD_CANDIDATE',
      source_license_attribution:payload.source.oshb_source.license.attribution,
      human_observation:false
    },
    requested_effect:{kind:'REVIEW_ONLY',may_admit:false,may_publish:false,may_spend:false},
    return_address:null,
    created_at:createdAt
  };
  const crossing=await api.sealOpaqueOrganCrossing(spec,keys);
  guard(await api.verifyOpaqueOrganCrossing(crossing),'Native reLATTE opaque organ signing failed.');
  const frame=await api.makeTransportFrame(crossing,'file-bundle',createdAt,
    'Manual file transfer to an independently governed receiver, not delivery proof');
  guard((await api.verifyAndExtractTransportFrame(frame)).crossing_id===crossing.crossing_id,
    'Native reLATTE transport verification failed.');
  await writeFile(join(output,'source-payload.json'),raw,{flag:'wx',mode:0o600});
  await writeFile(join(output,'signed-crossing.json'),JSON.stringify(frame,null,2)+'\n',{flag:'wx',mode:0o600});
  // Public pin MUST be established independently by the receiver. Placing the pin alongside
  // the offered file is only a CI demonstration, NOT an authenticated enrollment channel.
  const pub={kty:'EC',crv:'P-256',x:keys.publicKeyJwk.x,y:keys.publicKeyJwk.y};
  await writeFile(join(output,'source-public-key.json'),JSON.stringify(pub,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log('PASS: native signed source-bounded reLATTE envelope + transport created; ephemeral key only.');
}
async function verifyOffered(api,frame,raw,pin) {
  guard(raw.length>0 && raw.length<=65536,'Invalid source bytes.');
  const crossing=await api.verifyAndExtractTransportFrame(frame);
  guard(await api.verifyOpaqueOrganCrossing(crossing),'Native reLATTE opaque organ crossing invalid.');
  guard(crossing.signing?.public_key?.x===pin.x && crossing.signing?.public_key?.y===pin.y &&
    pin.kty==='EC' && pin.crv==='P-256' && !('d' in pin), 'Source signer does not match OUT-OF-BAND expected key.');
  guard(crossing.declared_kind==='OPAQUE_ORGAN_ARTIFACT' &&
    crossing.source_world==='fictional-fellowship-workshop' &&
    crossing.source_particular==='synthetic-source-key-no-person-identified' &&
    crossing.payload_refs?.length===1 &&
    crossing.payload_refs[0].address==='sha256:'+sha(raw), 'Signed source byte/metadata binding mismatch.');
  const payload=JSON.parse(raw.toString('utf8'));validateSource(payload);
  const claims=crossing.extensions?.organ_adapter?.donor_claims;
  guard(claims?.source_commit===REVIVAL_PIN &&
    claims?.source_corpus_sha256===payload.source.corpus.corpus_sha256 &&
    claims?.classification==='UNVERIFIED_METHOD_CANDIDATE' &&
    claims?.human_observation===false &&
    claims?.source_license_attribution===payload.source.oshb_source.license.attribution &&
    crossing.requested_effect?.kind==='REVIEW_ONLY' &&
    crossing.requested_effect?.may_admit===false &&
    crossing.requested_effect?.may_publish===false &&
    crossing.requested_effect?.may_spend===false, 'Signed claim or authority escalation refused.');
  return {crossing,payload};
}
function rederiveSource(args,candidate) {
  const revival=resolve(field(args,'revival'));
  exactRepo(revival,REVIVAL_PIN,'src/revival/corpus.py');
  const run=spawnSync('python3',[
    join(import.meta.dirname,'source_005.py'),'--revival',revival,'--check',candidate
  ],{encoding:'utf8',timeout:30000});
  guard(run.status===0, 'Independent native Revival source re-derivation failed: '+run.stderr?.slice(0,450));
}
async function receive(args) {
  const api=await donors(field(args,'relatte'));
  const directory=resolve(field(args,'offer'));
  const receiverRoot=resolve(field(args,'receiver'));
  const key=JSON.parse(await readFile(field(args,'trusted-key'),'utf8'));
  const raw=await readFile(join(directory,'source-payload.json'));
  const frame=JSON.parse(await readFile(join(directory,'signed-crossing.json'),'utf8'));
  const {crossing}=await verifyOffered(api,frame,raw,key);
  rederiveSource(args,join(directory,'source-payload.json'));
  const decision=field(args,'decision');
  guard(['HOLD','REFUSE'].includes(decision),'Only HOLD or REFUSE are available; never ADMIT.');
  const world=field(args,'world');
  guard(/^fictional-receiver-[a-z0-9-]{1,40}$/.test(world),'Only explicitly fictional receiver world allowed.');
  const rx=await api.LocalReceiver.create(receiverRoot,{
    world_id:world,receiver_particular:world+'-local-synthetic',
    contract_ref:'relatte:circuit-005-review-only/v0'
  });
  const receipt=await rx.receive(crossing,new Date().toISOString());
  guard(receipt.kind==='RECEIVED' && await api.verifyReceipt(receipt),'Native receiver did not sign RECEIVE.');
  const disposition=await rx.dispose(crossing.crossing_id,decision,new Date().toISOString(),{
    note:'Local synthetic '+decision+' — no human act, no admission or publication'
  });
  guard(disposition.kind==='R3_'+decision && disposition.semantic_effect==='none' &&
    await api.verifyReceipt(disposition),'Native receiver did not sign correct HOLD/REFUSE.');
  const custody=await rx.verifyPayloadBytes(crossing.crossing_id,new Uint8Array(raw),new Date().toISOString());
  guard(custody.kind==='PAYLOAD_BYTES_VERIFIED' && await api.verifyReceipt(custody),
    'Native exact-byte custody was not independently signed.');
  const cold=await api.LocalReceiver.open(receiverRoot);
  const snapshot=cold.snapshot();
  guard(snapshot.admitted.length===0 && snapshot[decision==='HOLD'?'held':'refused'].includes(crossing.crossing_id),
    'Cold receiver replay did not preserve independent disposition.');
  const report={
    schema:'abundent.living-witness.receiver-proof/v0',
    status:'SYNTHETIC_RECEIVER_TEST_NOT_HUMAN_EVIDENCE',
    sourceKeyPolicy:'EXPLICIT_TEST_PIN_SUPPLIED_SEPARATELY',
    sourceCrossingId:crossing.crossing_id,
    sourcePayloadSha256:sha(raw),
    disposition:decision,
    receiverWorld:world,
    actualNativeRelatte:true,
    independentLocalReceiver: true,
    humanAuthenticated:false,
    sourceSignerAuthenticatedAsHuman:false,
    localAdmit:false,
    methodAdopted:false,
    published:false,
    received:receipt,dispositionReceipt:disposition,payloadCustodyReceipt:custody,
    coldSnapshot:snapshot
  };
  await writeFile(join(receiverRoot,'circuit-005-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log('PASS: cold native reLATTE receiver '+decision+' and '+(decision==='HOLD'?'retained':'discarded')+' verified bytes. No ADMIT.');
}
async function verify(args) {
  const api=await donors(field(args,'relatte'));
  const directory=resolve(field(args,'offer')), receiverRoot=resolve(field(args,'receiver'));
  const report=JSON.parse(await readFile(join(receiverRoot,'circuit-005-report.json'),'utf8'));
  const raw=await readFile(join(directory,'source-payload.json'));
  const frame=JSON.parse(await readFile(join(directory,'signed-crossing.json'),'utf8'));
  const key=JSON.parse(await readFile(field(args,'trusted-key'),'utf8'));
  const {crossing}=await verifyOffered(api,frame,raw,key);
  rederiveSource(args,join(directory,'source-payload.json'));
  guard(report.schema==='abundent.living-witness.receiver-proof/v0' &&
    report.status==='SYNTHETIC_RECEIVER_TEST_NOT_HUMAN_EVIDENCE' &&
    report.humanAuthenticated===false && report.localAdmit===false &&
    report.methodAdopted===false && report.published===false &&
    report.sourcePayloadSha256===sha(raw) &&
    report.sourceCrossingId===crossing.crossing_id &&
    ['HOLD','REFUSE'].includes(report.disposition), 'Reported independent receipt overclaims authority.');
  const cold=await api.LocalReceiver.open(receiverRoot);
  const r=cold.getReceiveReceipt(crossing.crossing_id);
  const d=cold.getDispositionReceipt(crossing.crossing_id);
  const c=cold.getPayloadCustodyReceipt(crossing.crossing_id);
  guard(r && d && c &&
    JSON.stringify(r)===JSON.stringify(report.received) &&
    JSON.stringify(d)===JSON.stringify(report.dispositionReceipt) &&
    JSON.stringify(c)===JSON.stringify(report.payloadCustodyReceipt) &&
    await api.verifyReceipt(r) && await api.verifyReceipt(d) && await api.verifyReceipt(c),
    'Receiver-local signed receipts failed cold replay comparison.');
  const snap=cold.snapshot();
  guard(snap.history_head===report.coldSnapshot.history_head &&
    snap.state_ref===report.coldSnapshot.state_ref &&
    snap.admitted.length===0 &&
    snap[report.disposition==='HOLD'?'held':'refused'].includes(crossing.crossing_id) &&
    c.extensions?.local_receiver?.payload_custody?.retained===(report.disposition==='HOLD'),
    'Receiver local state/custody contradicts receipt.');
  console.log('PASS: independent cold receiver '+report.disposition+' with native cryptographic receipts and zero admission.');
}
async function main() {
  const [op,...args]=process.argv.slice(2);
  if(op==='issue')return issue(args);
  if(op==='receive')return receive(args);
  if(op==='verify')return verify(args);
  throw Error('Usage: node --experimental-strip-types crossing_005.mjs issue|receive|verify --relatte donor-path ...');
}
main().catch(error=>{console.error('LIVING WITNESS 005 REFUSED: '+error.message);process.exitCode=1;});
