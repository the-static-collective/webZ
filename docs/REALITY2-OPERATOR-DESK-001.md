# Reality 2.0 — Waseca operator desk (2026-10-26)

## Production

**Public:** https://reality.abundent.org/  
**Operator:** https://reality.abundent.org/operator/

The operator desk is a static UI whose privileged operations occur ONLY in a Supabase Edge Function, `reality2-operator` (separate from visitor-facing `reality2-waseca`). It has no access without a 256-bit cryptorandom operator capability. Operator capabilities are hashed SHA-256 on the server, expire after 30 days, and can be revoked. The first operator's token is issued out of band to the project owner; never store it in Git, in documents, on the public page, or in unencrypted logs. The frontend accepts a key via an initial URL **fragment**, then immediately removes the fragment and retains the key only in this browser tab's `sessionStorage` until the owner locks the panel.

### Powers and boundaries

- **Private queue**: list newest 100 pending contributions, including private text, after operator authorization.
- **Review**: manually approve a separately redacted `public_title`, `public_step`, and optional `public_update`, or reject.
- **Public progress**: update `progress` and a reviewed public comment; remove an entry from publication when necessary.
- **Audit trail**: metadata-only record of operator actions with no private text copied.
- **No auto-publication / no autonomous model moderation / no inference of institutional consent.** JAR;VIS's public feed only reads human-reviewed entries.
- **Automatic hourly notification** of pending counts is a separate ChatGPT task, not a server process.
- **No moderation sharing:** the initial key is for a single trusted operator, not a role granting team access.
- **No verified human wins** until separately documented; public progress is only a reviewed claim.

### Underlying data & API

Postgres migration: `reality2_operator_console_keyed_review_003`.  
Tables: `public.reality2_operator_keys`, `public.reality2_operator_audit`. Both RLS-enabled and direct anon/authenticated table access revoked. Audit trigger on `public.reality2_entries`.

POST `https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/reality2-operator` with `Authorization: Bearer <operator-key>` and `Content-Type: application/json` from allowed public site origins only. Actions:

- `me`: verify expiry and operator capability; return label/expiry.
- `list`: private pending rows, public review rows, metadata-only audit.
- `review`: publish an expressly edited public-safe copy or reject a still-pending row.
- `progress`: update label and public progress note for an already-approved row.
- `unpublish`: erase public copy from the feed for a reviewed row, keep private trace.

All write actions are explicit and compare `status` in the database to prevent acting on withdrawn or changed items. The gateway uses an allowlisted Origin, fixed bounded request bodies, rejection of common PII patterns in **public** publication text, server-only service key, and never returns the operator key.

**Important:** the PII detector is conservative but incomplete; human review is mandatory. The bearer key is a pilot-only authorization method and should be replaced with named Supabase Auth accounts + an administrator allowlist + MFA before adding multiple human operators or permitting sensitive intake. A reviewer must not use the console for survivor case evidence, legal advice, children's details, or confidential requests.

### Operator first login

Obtain the private owner-issued key directly, navigate to `/operator/`, paste it, and click Unlock. Keep the original key in a password manager. If a one-time fragment-bearing link is provided, the page consumes it and clears the address bar. The page's Lock button clears the session. The operator key is valid for 30 days; the existing project owner can revoke or rotate it in Supabase.

### Verification limits

The editor, route, and Edge deployment can be verified independently. An end-to-end publish-and-reject test requires running from a browser with the owner key or a disposable QA capability; do **not** claim one happened merely because the API returned healthy. Use tiny synthetic public-safe material only for those tests and remove it after verifying visibility.

### Future

With owner approval, add named Supabase Auth operators, invitations, safety workflows, and more explicit human witness receipts. Do not expose a general-public moderation queue or place private texts into JAR;VIS model prompts.
