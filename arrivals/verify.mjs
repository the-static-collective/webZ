// ABUNDENT / reLATTE crossing 001. Verify-only; no signing keys or remote receiver.
// This experiment pins one independently recoverable public LemonPRESS source.
const FROZEN = Object.freeze({
  repository: 'the-static-collective/lemonPRESS',
  commit: '02feb4454240d482a5e0e03258f24f8b5cc0b9f5',
  path: 'catalog.yaml',
  git_blob: '907759670a118e8a1098fe3350a0ad9f9ae37045',
  sha256: 'sha256:cbe0bca162dea2d7f828bbb3546f3de3ab7f787084fcc7f4b8b193ca0d866d75',
  experimental_key: {
    kty: 'EC', crv: 'P-256',
    x: 'vTCclg9Z3HuJMB9BbfymTGql6qFJ-GFN8RC_zgcWEb8',
    y: 'QvxVSuKAv4rpeOq86yGi378OkVnptTBeIGqGzufUEg4'
  }
});
const enc = new TextEncoder();
const keys = (o, expected) => {
  if (!o || typeof o !== 'object' || Array.isArray(o)
      || Object.keys(o).length !== expected.length
      || expected.some(k => !Object.hasOwn(o,k))) throw Error('UNEXPECTED_FIELDS');
};
export function canonical(v) {
  if (v === null || typeof v !== 'object') {
    if (v === undefined || typeof v === 'number' && !Number.isSafeInteger(v)) throw Error('INVALID_JSON');
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
const hex = bytes => Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
const digest = async (algorithm, data) => hex(await crypto.subtle.digest(algorithm,enc.encode(data)));
const b64 = s => {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s)) throw Error('INVALID_SIGNATURE_ENCODING');
  const raw = atob(s.replace(/-/g,'+').replace(/_/g,'/'));
  const bytes = Uint8Array.from(raw,c=>c.charCodeAt(0));
  if (bytes.length !== 64 || btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')!==s) throw Error('INVALID_SIGNATURE_ENCODING');
  return bytes;
};
const checkSource = s => {
  keys(s,['repository','commit','path','git_blob','sha256','content']);
  for (const k of ['repository','commit','path','git_blob','sha256'])
    if (s[k] !== FROZEN[k]) throw Error('SOURCE_PIN_MISMATCH');
  if (typeof s.content !== 'string') throw Error('SOURCE_CONTENT_MISSING');
};
export async function verifyArrival(input) {
  const raw = typeof input === 'string' ? input : JSON.stringify(input);
  if (enc.encode(raw).length > 32768) throw Error('BUNDLE_LIMIT_32KB');
  const b = JSON.parse(raw);
  keys(b,['schema','kind','source','crossing','source_owner_signed','receiver_status','demo_key_scope']);
  if (b.schema !== 'webz/arrival-demo/v0' || b.kind !== 'public-reference'
    || b.source_owner_signed !== false || b.receiver_status !== 'NOT_RECEIVED'
    || b.demo_key_scope !== 'ephemeral-experiment-key-not-owner-identity') throw Error('UNSUPPORTED_BUNDLE');
  checkSource(b.source);
  if ('sha256:'+await digest('SHA-256',b.source.content) !== b.source.sha256) throw Error('SOURCE_BYTES_CHANGED');
  const size = enc.encode(b.source.content).length;
  if (await digest('SHA-1','blob '+size+'\0'+b.source.content) !== b.source.git_blob) throw Error('SOURCE_GIT_BLOB_MISMATCH');

  const c=b.crossing;
  keys(c,['schema','protocol_version','source_particular','source_world','source_history_head','parents','declared_kind','payload_refs','requested_effect','capability_ref','privacy_policy','audience_policy','return_address','created_at','signing','extensions','crossing_id']);
  if (c.schema !== 'relatte.crossing-envelope/v0' || c.protocol_version !== '0'
    || c.source_world !== 'world:abundent-experimental-adapter'
    || c.source_particular !== 'particular:abundent-lemonpress-catalog-001'
    || c.declared_kind !== 'PUBLIC_SOURCE_REFERENCE'
    || c.source_history_head !== null || c.requested_effect !== null || c.capability_ref !== null
    || c.privacy_policy !== 'public-reference-only' || c.return_address !== null
    || !Array.isArray(c.parents) || c.parents.length !== 0
    || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(c.created_at)) throw Error('CROSSING_SCOPE');
  keys(c.audience_policy,['destination']);
  if (c.audience_policy.destination !== 'world:gro-local-review') throw Error('DESTINATION_CHANGED');
  if (!Array.isArray(c.payload_refs) || c.payload_refs.length!==1) throw Error('PAYLOAD_SCOPE');
  keys(c.payload_refs[0],['address','role','media_type']);
  if (c.payload_refs[0].address!==b.source.sha256 || c.payload_refs[0].role!=='source-bytes'
    || c.payload_refs[0].media_type!=='text/yaml') throw Error('PAYLOAD_CHANGED');
  keys(c.extensions,['source','claim']);
  keys(c.extensions.source,['repository','commit','path','git_blob']);
  if (c.extensions.claim!=='experiment-signer-not-source-owner') throw Error('AUTHORITY_CLAIM_CHANGED');
  for (const k of ['repository','commit','path','git_blob'])
    if (c.extensions.source[k] !== b.source[k]) throw Error('CROSSING_SOURCE_CHANGED');
  keys(c.signing,['algorithm','public_key','domain','signature']);
  if (c.signing.algorithm!=='ECDSA-P256-SHA256' || c.signing.domain!=='relatte.crossing-signature/v0') throw Error('SIGNING_PROFILE');
  keys(c.signing.public_key,['kty','crv','x','y']);
  if (canonical(c.signing.public_key)!==canonical(FROZEN.experimental_key)) throw Error('UNTRUSTED_EXPERIMENT_KEY');
  const {signature,...identitySigning}=c.signing;
  const {crossing_id,...others}=c;
  const body={...others,signing:identitySigning};
  const computedId='relatte-crossing-v0:'+await digest('SHA-256','reLATTE-CrossingEnvelope-v0|'+canonical(body));
  if (crossing_id!==computedId) throw Error('CROSSING_ID_CHANGED');
  const key=await crypto.subtle.importKey('jwk',c.signing.public_key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const data=enc.encode('reLATTE-CrossingSignature-v0|'+canonical({crossing_id,...body}));
  if (!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,b64(signature),data)) throw Error('INVALID_CROSSING_SIGNATURE');
  return Object.freeze({
    verified:true, crossing_id,
    source_sha256:b.source.sha256,
    source_repository:b.source.repository,
    source_commit:b.source.commit,
    source_path:b.source.path,
    source_git_blob:b.source.git_blob,
    destination:c.audience_policy.destination,
    authority:'EXPERIMENT_KEY_ONLY',
    owner_signature:'NOT_PRESENT',
    delivery:'NOT_ATTEMPTED',
    receipt:'NOT_ISSUED',
    disposition:'NOT_DECIDED',
    evidence:'SOURCE_BYTES_AND_EXPERIMENT_SIGNATURE_VERIFIED'
  });
}
export function holdObservation(verified) {
  if (!verified?.verified || verified.destination!=='world:gro-local-review') throw Error('UNVERIFIED_OFFER');
  return {
    schema:'webz/unsigned-local-review/v0',
    crossing_id:verified.crossing_id,
    source_sha256:verified.source_sha256,
    destination:verified.destination,
    decision:'HOLD',
    authority:'browser-local-observation-only',
    relatte_receipt_issued:false,
    no_delivery_claim:true
  };
}
