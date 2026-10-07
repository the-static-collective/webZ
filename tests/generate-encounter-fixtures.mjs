// Explicit fixture generator, never loaded by the portal or its server.
// Native reLATTE remains protocol/receiver owner. Keys exist only in a private temp tree.
import {readFile,writeFile,mkdtemp,rm,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const donor=resolve(process.argv[2]??''),out=resolve(process.argv[3]??'evidence/first-encounter-002');
const pinned={
 'protocol.ts':'856b2c9da5403c204e64c35899a50b9ec9efaacf9a65a1464eca9cfcb40ffb31',
 'canonical.ts':'b6d24d216b4b58da105f3f776021b34fd4ed73984dae676f776b070e477c35b3',
 'receiver.ts':'0ee04e45dc66f4aac25b66148eb272ac56f5f22b00ca2b87f4326273321564c5',
 'sovereign.ts':'647953a82b2c09c8d4ee76e20726e9e370718758a36718b39f3a41fc4b259890',
};
const digest=s=>createHash('sha256').update(s).digest('hex');
for(const [name,expected] of Object.entries(pinned))if(digest(await readFile(join(donor,'src',name)))!==expected)throw Error('DONOR_HASH_MISMATCH_'+name);
const {canonicalize,canonicalizeDomainValue,sha256Hex}=await import(pathToFileURL(join(donor,'src/canonical.ts')));
const {generateP256KeyPair,sealCrossingEnvelope}=await import(pathToFileURL(join(donor,'src/protocol.ts')));
const {LocalReceiver}=await import(pathToFileURL(join(donor,'src/receiver.ts')));
const {buildSovereignResponseBundle,verifySovereignResponseBundle}=await import(pathToFileURL(join(donor,'src/sovereign.ts')));
const fp=k=>'sha256:'+digest(canonicalize({kty:k.kty,crv:k.crv,x:k.x,y:k.y}));
await mkdir(out,{recursive:true});const temp=await mkdtemp(join(tmpdir(),'webz-encounter-fixture-'));
try{
 for(const decision of ['HOLD','REFUSE','ADMIT']){
  const root=join(temp,decision);const receiver=await LocalReceiver.create(root,{world_id:'world:first-encounter-a',receiver_particular:'particular:first-encounter-a',contract_ref:'FIRST-ENCOUNTER-002/v0'});
  const stored=JSON.parse(await readFile(join(root,'receiver-key.json'),'utf8'));
  const issuerKey=await crypto.subtle.importKey('jwk',stored.private_jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const b=await generateP256KeyPair();const identity={algorithm:'ECDSA-P256-SHA256',public_key:{kty:stored.public_jwk.kty,crv:stored.public_jwk.crv,x:stored.public_jwk.x,y:stored.public_jwk.y},domain:'webz.porch-invitation-signature/v0'};
  const body={schema:'webz/porch-invitation/v0',issuer_world_id:receiver.config.world_id,receiver_particular:receiver.config.receiver_particular,source_world_id:'world:first-encounter-b',source_key_fingerprint:fp(b.publicKeyJwk),purpose:'FIRST-ENCOUNTER-002',origin:'https://world-a.example',media_type:'text/plain',max_bytes:2048,issued_at:'2026-10-06T20:10:00.000Z',expires_at:'2026-10-06T20:25:00.000Z',rights:'inspection-only-no-publication',signing:identity};
  const invitation_id='webz-porch-invitation-v0:'+sha256Hex(canonicalizeDomainValue('webZ-PorchInvitation-v0|',body));
  const signature=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},issuerKey,canonicalizeDomainValue('webZ-PorchInvitationSignature-v0|',{invitation_id,...body}))).toString('base64url');
  const invitation={...body,invitation_id,signing:{...identity,signature}};
  const material='One small seed, offered for inspection only.';const address='sha256:'+digest(Buffer.from(material));
  const crossing=await sealCrossingEnvelope({schema:'relatte.crossing-envelope/v0',protocol_version:'0',source_particular:'particular:first-encounter-b',source_world:'world:first-encounter-b',source_history_head:null,parents:[],declared_kind:'FIRST_ENCOUNTER_002_TEXT',payload_refs:[{address,role:'proposed-contribution',media_type:'text/plain',byte_length:Buffer.byteLength(material)}],requested_effect:{kind:'bounded-text-candidate',authority:'receiver-local'},capability_ref:invitation_id,privacy_policy:{publication:'not-granted'},audience_policy:{destination:receiver.config.world_id},return_address:'world:first-encounter-b',created_at:'2026-10-06T20:11:00.000Z',extensions:{specimen:'FIRST-ENCOUNTER-002',rights:'inspection-only-no-publication',payload_is_synthetic:true}},b);
  await receiver.receive(crossing,'2026-10-06T20:12:00.000Z');
  const heldBefore=receiver.snapshot();if(heldBefore.admitted.length)throw Error('AUTO_ADMISSION');
  await receiver.dispose(crossing.crossing_id,decision,'2026-10-06T20:13:00.000Z',{admit_effect:'encounter-local-candidate-only'});
  const response=buildSovereignResponseBundle(receiver,crossing.crossing_id);
  if(!await verifySovereignResponseBundle(response,crossing.crossing_id))throw Error('NATIVE_VERIFY_FAILED');
  const reopened=await LocalReceiver.open(root);if(canonicalize(reopened.snapshot())!==canonicalize(receiver.snapshot()))throw Error('NATIVE_REOPEN_MISMATCH');
  const packet={schema:'webz/encounter-packet/v0',invitation,crossing,material,response};
  const trust={schema:'webz/encounter-trust/v0',issuer_world_id:receiver.config.world_id,source_world_id:crossing.source_world,source_particular:crossing.source_particular,receiver_particular:receiver.config.receiver_particular,issuer_key_fingerprint:fp(stored.public_jwk),source_key_fingerprint:fp(b.publicKeyJwk),approved_origin:body.origin,revoked_invitation_ids:[]};
  const name=decision.toLowerCase();
  await writeFile(join(out,name+'.packet.json'),JSON.stringify(packet,null,2)+'\n');
  await writeFile(join(out,name+'.trust.json'),JSON.stringify({scope:'SYNTHETIC_FIXTURE_PINS; not authenticated host or human identity',at:'2026-10-06T20:14:00.000Z',trust},null,2)+'\n');
  await writeFile(join(out,name+'.native-journal.jsonl'),await readFile(join(root,'journal.jsonl')));
 }
 await writeFile(join(out,'provenance.json'),JSON.stringify({schema:'webz/encounter-fixture-provenance/v0',scope:'native signed synthetic fixtures; no transport, actual participant or two-device encounter',protocol_owner:'https://github.com/the-static-collective/reLATTE/pull/62',commit:'ae3fd0f56860683245dfd27ff32edf64311046bf',native_modules_sha256:pinned,generator:'tests/generate-encounter-fixtures.mjs',keys:'temporary protected native receiver and independent visitor key; private material deleted',files:Object.fromEntries(await Promise.all(['hold','refuse','admit'].flatMap(n=>[n+'.packet.json',n+'.trust.json',n+'.native-journal.jsonl']).map(async n=>[n,digest(await readFile(join(out,n)))])))},null,2)+'\n');
 console.log('Generated public native fixtures; all native response signatures and receiver reopens verified.');
}finally{await rm(temp,{recursive:true,force:true});}
