/**
 * TRANSIENT operator-controlled self-test trigger for Vercel fetch transport.
 * No sender credentials or authorization secret are published here.
 * Delete this route immediately after a single attempt.
 * Expires on 2026-10-26T21:00:00Z regardless of deployment cleanup.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { makeProofHandler } from './proof.js';

const DEADLINE = Date.parse('2026-10-26T21:00:00Z');
const PURPOSE = 'post-office-owner-2026-10-26-v1';

function fail(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify({state:'HOLD'}));
}

export function makeTemporaryHandler({ env = process.env, send = fetch, now = Date.now } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag','noindex,nofollow');
    const secret = env.POST_OFFICE_OPERATOR_TOKEN;
    if (req.method !== 'GET' || !secret || secret.length < 32 || now() > DEADLINE) return fail(res);
    const signature = new URL(req.url ?? '', 'https://local.invalid').searchParams.get('sig');
    if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature)) return fail(res);
    const expected = createHmac('sha256', secret).update(PURPOSE).digest();
    const given = Buffer.from(signature, 'hex');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return fail(res);
    const innerReq = {method:'POST',headers:{authorization: 'Bearer ' + secret}};
    await makeProofHandler({env,send})(innerReq, res);
  };
}
export default makeTemporaryHandler();
