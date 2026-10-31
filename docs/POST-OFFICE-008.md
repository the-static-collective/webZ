# POST OFFICE 008 — persistent owner-editable outgoing email drafts

**Status (2026-10-31):** Source and private Supabase storage created, four Nexus invitation drafts persisted, and the owner's existing Vercel email-code desk extended. **Production deployment is currently blocked by Vercel Hobby's 100 deployments/day quota (HTTP 402).** Source success and database entries are not evidence that the feature is live yet.

## Why
Outbox 001 was entirely client-side and stored encrypted drafts on one browser. Public GitHub seeds could import public-safe templates, but this assistant could not write to the owner's locally encrypted vault. They asked to save actual unsent correspondence for editing and sending.

## New operator workflow
- Existing operator authentication remains: `/post-office/` on `webz-field-porch.vercel.app`; owner receives a code at the server-configured private mailbox and gets a short-lived HTTP-only session.
- New **Saved letters** list: create, select, edit recipient/subject/body/notes/readiness, save, refresh, delete, copy, and *Open email app*. No automatic sends.
- Opening an email app creates a `mailto:` draft. The user must verify the *From* account and choose to send. Long messages should be copied into the email client manually.
- Drafts persist server-side in `public.operator_mail_drafts` on the connected **pantry-gate** Supabase project, with RLS enabled, no public policies, and no anon/authenticated table grants. The assistant can stage drafts using the authorized Supabase connector. This is separate from client-only encrypted Outbox 001. It is not end-to-end encrypted; privileged project administrators may access the records.
- Four Nexus invitation drafts were saved as `DRAFT`, without recipient addresses: Deb / Coalition, Waseca co-op contact, Mark / Coalition, and Ashley / church. Their wording requires human review.

## Security and architectural boundary
- Owner browser never receives the Supabase bridge token, Resend token, Supabase secret key, or Post Office operator token.
- Existing Post Office panel `/api/post-office/panel` requires same-origin JSON, a short-lived signed operator cookie, and per-session CSRF for draft operations.
- Vercel sends a separate 256-bit private bridge credential to Supabase Edge Function `post-office-drafts` (verify_jwt=false but with its own constant-size hash check). The database stores only its SHA-256 hash. Without a match, the Edge Function refuses read/write.
- Writes use optimistic revisions. Stale edits return HOLD/conflict rather than silently overwriting. Each edit is explicit.
- No free-text draft can be dispatched through the existing approved-envelope Resend sender. Sender remains separate and unchanged; there is **no auto-send, schedule, batch, or background retry**. Email-app drafts still require user to press Send.
- This is an operator-only correspondence desk, not a community intake, bulk marketing service, client record system, or storage for children/survivor histories.

## Release/verification
1. The GitHub project source is `the-static-collective/webZ` on `main`, including `post-office/index.html`, `post-office/ui.js`, `post-office/style.css`, and `api/post-office/panel.js`.
2. Supabase Edge Function `post-office-drafts` v1 is active. Private tables have RLS on and no public grants. Four draft rows confirmed in SQL.
3. Vercel production env names `POST_OFFICE_DRAFTS_BRIDGE_KEY` and `POST_OFFICE_DRAFTS_BRIDGE_URL` were added without exposing the key.
4. Vercel rejected an explicit production Git deployment with `402 api-deployments-free-per-day`; no claim of live release until a future deployment actually reaches READY on the current commit.
5. Once deployment is possible, sign into `https://webz-field-porch.vercel.app/post-office/` and verify saved letters load, edit one and save, refresh to verify persistence, copy, and open the mail app (without sending). Check the verified sender account.
6. Keep failed or ambiguous sends on HOLD. This workflow does not send automatically.

**Security note:** Avoid putting genuinely sensitive personal narratives or third-party private records in these drafts without separate authorization and assessment.
