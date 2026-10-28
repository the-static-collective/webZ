# Post Office 007 — Owner desk, email-code sign-in, reviewed dispatch

## What is live if production deployment succeeds
`/post-office/` on the **webz-field-porch** Vercel hostname is a mobile-friendly private **operator interface**. It does not request, transmit, or store the Resend API key or the Post Office operator token in a browser. It does not appear in public navigation or search results.

- **Email me a sign-in code:** server emails a deterministic 12-digit code *only* to existing server-configured `POST_OFFICE_TEST_TO`; no visitor-supplied email. Requires `POST_OFFICE_PANEL_ENABLED=1`, existing strong `POST_OFFICE_OPERATOR_TOKEN` and `RESEND_API_KEY`. Resend idempotency groups requests within each 20-minute window; it is not a hard global rate limit. Do not claim delivery just from provider acceptance.
- **Unlock:** current/previous 20-minute code only. The session is server-signed, HTTP-only, Secure, SameSite=Strict, and 2 hours long. No browser-stored credentials or URLs containing secrets. Anyone with owner inbox access during the code window could authenticate; protect that mailbox and shared devices.
- **Review:** GET lists only pre-approved exact message text, destination and subject, with no authoring fields.
- **Send:** an individually checked authorization box permits an exact fixed envelope through existing Post Office 006. Server reuses existing operator authorization without disclosing secret to the browser. POST requires matching Origin and per-session CSRF token. No links or GET requests send.
- **Status:** distinguishes `HOLD`, code provider acceptance, and outreach `PROVIDER_ACCEPTED`. This is **not delivery**. The UI locks the send button after an attempt until page reload; **that is not durable deduplication**.

## Exact existing first letter
User-approved Still Here safeguarding-review invitation to `info@cadamn.org`, from `us@abundent.org`. No survivor narratives, case details or third-party partnership claims.

## Operational boundary
No full multi-user authentication, mailbox ingestion, delivery-event webhook, durable outbox, global anti-abuse store, operator review by a second individual, arbitrary-recipient drafting, bulk sending, or automatic follow-ups. Resend's provider idempotency is time-limited. If a send is ambiguous, do not retry before inspecting the provider's message history. Static UI is publicly reachable but contains no private credentials; **API content/actions are operator-authenticated**.

### Required production variables
Existing `RESEND_API_KEY`, `POST_OFFICE_TEST_TO`, `POST_OFFICE_OPERATOR_TOKEN`, `POST_OFFICE_OUTREACH_ENABLED=1` plus **new `POST_OFFICE_PANEL_ENABLED=1`**, server-side on Vercel. Preserve inbound MX/SPF/DKIM and other domains. Public source contains no API keys.

### Launch checks
- `node --test tests/post-office-panel.test.mjs`, then `npm test`
- GET panel API without session = 401, GET page = 200, unauthorized POST = HOLD.
- Test request-code to owner mailbox, verify on separate device, exact send with human approval, inspect actual provider receipt/delivery.
- If provider or domain verification fails, HOLD. Never infer a message was delivered from HTTP 202.
- Recipient additions require a code-reviewed, source-approved envelope and separate human authorization; do not convert this into a general unmoderated public mail proxy.

### Security caveat
Owner inbox OTP request can be triggered by an unauthenticated same-origin browser visitor. Resend idempotency can reduce repeated mail within the same 20-minute bucket but is **not** a complete anti-abuse solution. Add a durable per-network/per-day throttle and a proper send ledger before publicizing the admin URL widely or scaling beyond single-operator outreach.
