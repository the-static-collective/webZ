/**
 * CIRCULATION-003 / human-grounded field question, never an automatic donor command.
 *
 * Pure browser + Node ESM. Content hashes detect drift, NOT true consent.
 * No network, cookies, account, location access or cross-world transmission.
 */
export const SCHEMA = 'circulation.field-question/v0';
export const EVENT = 'coalition-of-care-greater-mankato-2026-10-24';
export const DOMAIN = 'CIRCULATION-003-FIELD-QUESTION|';
const KINDS = new Set(['OFFER', 'NEED', 'BUILD', 'QUESTION']);
const ROLES = new Set(['AUTHOR', 'FACILITATOR_WITH_PERMISSION']);
const forbidden = /@|https?:\/\/|\b(?:\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}\b|\b(?:[A-Za-z0-9._%+-]+)@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
const control = /[\u0000-\u001f\u007f]/;

export class FieldRefusal extends Error {
  constructor(reason) { super('CIRCULATION003_REFUSED:' + reason); this.name = 'FieldRefusal'; }
}
export function canonical(value) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new FieldRefusal('NONFINITE');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }
  throw new FieldRefusal('INVALID_CANONICAL_VALUE');
}
const encoder = new TextEncoder();
async function hash(payload) {
  if (!globalThis.crypto?.subtle) throw new FieldRefusal('SECURE_HASH_CONTEXT_REQUIRED');
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function keys(v, required) {
  return v && typeof v === 'object' && !Array.isArray(v) &&
    Object.keys(v).length === required.length && required.every(k => Object.hasOwn(v, k));
}
function question(q) {
  return typeof q === 'string' && q.trim() === q && q.length >= 14 && q.length <= 180 &&
    !control.test(q) && !forbidden.test(q) &&
    !/\b(?:ssn|social security|date of birth|passport|street address|phone number)\b/i.test(q);
}
/**
 * Explicit attestation is from the human operating THIS browser. No recipient
 * or project identity is authenticated, and real-world permission is not proven.
 */
export async function prepareFieldQuestion({ kind, text, authorRole, permissionReviewed, privacyReviewed }) {
  if (!KINDS.has(kind)) throw new FieldRefusal('INVALID_KIND');
  if (!ROLES.has(authorRole)) throw new FieldRefusal('INVALID_AUTHOR_ROLE');
  if (permissionReviewed !== true || privacyReviewed !== true) throw new FieldRefusal('REVIEW_NOT_ATTESTED');
  if (!question(text)) throw new FieldRefusal('UNSAFE_OR_EMPTY_QUESTION');
  const body = {
    schema: SCHEMA,
    event: EVENT,
    event_date: '2026-10-24',
    kind,
    public_question: text,
    source_role: authorRole,
    permission: 'LOCAL_OPERATOR_ATTESTS_PERMISSION_FOR_EXACT_PUBLIC_QUESTION',
    privacy: 'LOCAL_OPERATOR_ATTESTS_NO_IDENTIFIERS',
    evidence: 'SELF_ATTESTED_UNVERIFIED',
    state: 'UNPUBLISHED_CANDIDATE',
    recipient: 'NONE',
    recipient_acceptance: false,
    person_authenticated: false,
    organization_endorsed: false,
    fulfillment_claimed: false,
    publication_authorized: false,
    contact_collected: false
  };
  return { id: 'sha256:' + await hash(DOMAIN + canonical(body)), ...body };
}
export async function verifyFieldQuestion(candidate) {
  const bare = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ?
    { ...candidate } : null;
  if (!bare || typeof bare.id !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(bare.id)) {
    throw new FieldRefusal('INVALID_PACKET');
  }
  delete bare.id;
  if (!keys(bare, [
    'schema','event','event_date','kind','public_question','source_role','permission','privacy',
    'evidence','state','recipient','recipient_acceptance','person_authenticated',
    'organization_endorsed','fulfillment_claimed','publication_authorized','contact_collected'
  ])) throw new FieldRefusal('UNEXPECTED_FIELDS');
  if (bare.schema !== SCHEMA || bare.event !== EVENT || bare.event_date !== '2026-10-24' ||
      bare.permission !== 'LOCAL_OPERATOR_ATTESTS_PERMISSION_FOR_EXACT_PUBLIC_QUESTION' ||
      bare.privacy !== 'LOCAL_OPERATOR_ATTESTS_NO_IDENTIFIERS' ||
      bare.evidence !== 'SELF_ATTESTED_UNVERIFIED' ||
      bare.state !== 'UNPUBLISHED_CANDIDATE' || bare.recipient !== 'NONE' ||
      ['recipient_acceptance','person_authenticated','organization_endorsed',
       'fulfillment_claimed','publication_authorized','contact_collected'].some(k => bare[k] !== false)) {
    throw new FieldRefusal('FALSE_AUTHORITY_OR_SCOPE');
  }
  const reconstructed = await prepareFieldQuestion({
    kind: bare.kind, text: bare.public_question, authorRole: bare.source_role,
    permissionReviewed: true, privacyReviewed: true
  });
  if (candidate.id !== reconstructed.id || canonical(candidate) !== canonical(reconstructed)) {
    throw new FieldRefusal('SOURCE_DIGEST_MISMATCH');
  }
  return true;
}
