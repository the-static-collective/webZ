# ABUNDENT POST OFFICE 001 — letters before feeds

Status: PROVIDER USERNAME WIRED IN DRAFT / production HOLD until a consenting mailbox verifies submission, confirmation, unsubscribe, and release smoke tests.

## Purpose
Abundent owns the public front door and archives. The Static Collective is its founding voice. The Daily Slice owns its dated, sourced public witness; the Post Office curates a human letter from that body without turning a summary into project authority. Replies are correspondence, not automatic consent to publication.

User promise: occasional music, creative work, discoveries, unfinished experiments, and open invitations. Email is optional and sufficient. No phone number, account, tracking pixel, forced identity, or social follow.

## Created in this slice
- /post-office/ — one-page landing with a form activated by JS when the public Buttondown username is present (currently only in the draft branch).
- /post-office/archive/ and /post-office/archive/000/ — public, explicitly *not emailed* preface.
- Provider adapter uses a standard browser HTML POST to Buttondown's documented public embed endpoint. It does not use fetch or store a visitor email. CAPTCHA and confirmation steps remain handled by Buttondown.
- The public Buttondown username `luv` was provided by the owner; `https://buttondown.com/luv` responds with a newsletter titled **Lu V** as of 2026-10-10. The draft branch form can POST only on a deliberate user submission. `abundent.org` is not yet promoted to this branch, and end-to-end delivery is not yet verified.
- The immutable release allowlist explicitly includes the Post Office static files. Existing frozen offline cache and legacy world/door code remain unchanged. These pages require a network connection and are not part of the PWA fixed cache.
- CSP permits deliberate form submission only to https://buttondown.com. The older browser tools retain their per-page no-form CSP where present.

## Open delivery gate
1. Newsletter owner should change Buttondown's public display name (currently 'Lu V') to Letters from the Field if desired, and configure its description, reply-to identity, unsubscribe and confirmation appearance. Buttondown documents double opt-in as default for standard signup forms, but an actual consenting mailbox must verify the specific newsletter.
2. PUBLIC username `luv` is set in post-office/provider.mjs. No API key or subscriber list is included.
3. Run npm test, npm run field:verify, npm run build, verify the release manifest, and run existing browser suites. Confirm zero passive third-party requests on page load, hidden/disabled forms without JS, JS activation using the verified username, live signup only after explicit action, provider captcha/confirmation, and unsubscribe via the vendor.
4. Before any promotion, perform a real end-to-end test with a consenting mailbox. Revert to HOLD if validation fails. Verify exact production domain and staged branch; respect existing manual Vercel release/rollback gates. Do not redirect or mutate DNS just to make this feature work.
5. Only after release tests add a prominent homepage navigation link and regenerate worker assets with npm run field:build (then build and review cache versions). The Post Office itself stays outside offline caching to avoid stale provider configuration.
6. Create first actual email inside the newsletter provider only after opt-in and sender verification. The public Issue 000 is not proof of email delivery.

## Provider and ownership
Current adapter: Buttondown public HTML form. Their documented endpoint is https://buttondown.com/api/emails/embed-subscribe/{username}. Standard form POST is required because captcha/errors may need page navigation. The provider owns confirmations, sending, unsubscribe handling and subscriber storage. Subscriber export, deletion, and provider portability should be exercised before going live. No API keys are needed for the embedded form.

Not implemented: private responses, contact database, sender domain reputation/authentication, actual delivery, welcome automations, scheduled sending, preference segmentation, analytics, print/postage, outbound publishing hooks, payment or broad user admission. None should be inferred from the Post Office static artifact.

## Evidence and style
- Source: the-static-collective/the-daily-slice, the August 24 2026 candidate for an in/out newsletter, not project-level authorization.
- Canonical sender text drafted: Letters from the Field — music, stories, worlds, and strange machines.
- Newsletter practice: record public source and date where applicable; distinguish observation, interpretation, and speculation; allow replies as private correspondence until separately authorized.
