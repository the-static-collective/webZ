# Post Office 006 — External Recipient Gate

**Status:** scoped outbound endpoint, no automated dispatch.

The work email `us@abundent.org` can send to **preapproved external recipients** via Resend without allowing website visitors to choose arbitrary email addresses or content. The first fixed reviewed envelope is the user's October 28, 2026 request for an independent safeguarding consultation from CADA, to its public organizational email `info@cadamn.org` (not the survivor advocacy intake address).

## Enforced conditions

- `POST /api/post-office/outreach` is POST-only and accepts exactly `{"messageId":"still-here-cada-safeguarding-001","confirm":"SEND"}`. Unknown ID or additional body fields fail.
- Requires **private server-side** `POST_OFFICE_OPERATOR_TOKEN` bearer authentication (32+ characters), the existing production `RESEND_API_KEY`, and production-only `POST_OFFICE_OUTREACH_ENABLED=1`.
- The public request may select only the single reviewed envelope already stored in source. `from`, `to`, `reply_to`, `subject`, `text` are never provided by request.
- No browser client is wired to this send route. No emails are sent by deploying code, setting environment variables, or GET.
- `PROVIDER_ACCEPTED` + provider ID does **not** mean delivered or read. Resend's idempotency window is **24 hours**, not a durable outbox; don't blindly retry outside that window. Review Resend logs and independently confirm arrival/reply.

## Private operator trigger

After production environment has been configured and deployment refreshed, from a trusted terminal using the operator token (never put it in the query string, logs or GitHub):

```bash
curl -i -X POST https://webz-field-porch-theotherlucasv-1250s-projects.vercel.app/api/post-office/outreach \
  -H "Authorization: Bearer ${POST_OFFICE_OPERATOR_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data '{"messageId":"still-here-cada-safeguarding-001","confirm":"SEND"}'
```

If the operation fails, status remains HOLD; inspect Resend's provider history before any retries. The next frontier for routine external correspondence is a private owner-authenticated outbox with durable review, receipts and corrections, not an open arbitrary-recipient endpoint.

**Privacy:** no case histories, identities of survivors/children, or personal evidence are in the approved email. No DNS, MX, SPF, DKIM, inbound forwarding, or other Post Office endpoints are modified.

Verify: `node --test tests/post-office-outreach.test.mjs` and `npm test`. Separate a code/deployment success from a real provider acceptance.
