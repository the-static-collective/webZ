/** 
 * POST OFFICE 003 — deliberately narrow, operator-only self-test.
 * Vercel serverless API; never accepts a recipient, subject or body from visitors.
 * Sending remains HOLD until private production environment secrets are supplied.
 * Contact route /api/post-office/proof (POST only).
 */
import { createHash, timingSafeEqual } from 'node:crypto';

const ADDRESS = 'us@abundent.org';
const SUBJECT = 'The Static Collective — Post Office proof 001';
const TEXT = [
  'The first outbound Abundent Post Office letter.',
  '',
  'If this reaches your inbox showing us@abundent.org as the sender,',
  'please reply to confirm the return path.',
  '',
  'This is an explicitly requested, owner-directed email test.'
].join('\n');

function response(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function equalSecret(submitted, expected) {
  if (typeof submitted !== 'string' || !submitted.startsWith('Bearer ')) return false;
  const supplied = submitted.slice(7);
  if (!supplied || !expected) return false;
  const a = createHash('sha256').update(supplied).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export function makeProofHandler({env = process.env, send = fetch} = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return response(res, 405, {state: 'HOLD', reason: 'post-only'});
    }
    const operator = env.POST_OFFICE_OPERATOR_TOKEN;
    // Check strength before authentication, with no detail about which secrets exist.
    if (typeof operator !== 'string' || operator.length < 32) {
      return response(res, 503, {state: 'HOLD', reason: 'operator-not-provisioned'});
    }
    if (!equalSecret(req.headers?.authorization ?? '', operator)) {
      return response(res, 401, {state: 'HOLD', reason: 'not-authorized'});
    }
    const apiKey = env.RESEND_API_KEY;
    const recipient = env.POST_OFFICE_TEST_TO;
    const validEmail = typeof recipient === 'string'
      && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient)
      && !/[\r\n]/.test(recipient);
    if (!apiKey || !validEmail) {
      return response(res, 503, {state: 'HOLD', reason: 'sending-service-or-private-test-recipient-not-ready'});
    }
    const idempotencyKey = createHash('sha256')
      .update('post-office-v003-owner-proof' + '\0' + ADDRESS + '\0' + recipient.toLowerCase())
      .digest('hex');
    const payload = {
      from: 'The Static Collective <' + ADDRESS + '>',
      to: [recipient],
      reply_to: ADDRESS,
      subject: SUBJECT,
      text: TEXT
    };
    try {
      const provider = await send('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });
      if (!provider.ok) {
        return response(res, 502, {state: 'HOLD', reason: 'provider-not-accepted', providerStatus: provider.status});
      }
      const data = await provider.json();
      if (typeof data?.id !== 'string' || !data.id) {
        return response(res, 502, {state: 'HOLD', reason: 'provider-receipt-not-verifiable'});
      }
      // Provider acceptance is never represented as confirmed delivery.
      return response(res, 202, {state: 'PROVIDER_ACCEPTED', providerId: data.id, delivered: false});
    } catch {
      return response(res, 502, {state: 'HOLD', reason: 'provider-unreachable-or-unconfirmed'});
    }
  };
}
export default makeProofHandler();
