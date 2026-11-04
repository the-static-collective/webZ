# INVITATION NETWORK 002 — Public threads, active-page notices, two-receipt acknowledgment

**Deployment:** Supabase project `kbhqacsdvjsstzyplqij`, Edge Function `invitation-network-002` (verify_jwt=false intentionally, because users arrive without accounts; all sensitive operations use private bearer receipt keys). webZ companion `/invites/network/`. Backend is source-pinned to `backend/invitation-network-002/index.ts`.

## What is real

1. A person can take a self-declared, public-safe, portable invitation from `/invites/` to the optional network publisher. They select offering, needing, question or open and explicitly consent to **public** posting. The published thread is persisted in private Supabase tables and can be opened from a second device by its public URL.
2. Visitors can add a public response, no account, with a 43-character private reply receipt. This triggers database insert-time notifications to all explicit watchers. A watcher receives a private receipt, which can be saved voluntarily and used to resume; a visitor can revoke it.
3. While an opted-in watcher has the page open, the client checks for new notifications approximately every 20 seconds and displays notices; if additionally authorized and supported, it can show a browser desktop notification while the page is open.
4. A public offer and complementary need inside one thread can be nominated for a possible match **only using the invitation owner's key or the responder's key**. Each holder then separately confirms. A database-generated state becomes `MUTUALLY_ACKNOWLEDGED` only when both flags are true, and the transaction automatically creates watcher notices. One holder cannot confirm both sides with one key (but one physical person might possess both keys; no real-world independence is asserted).
5. Readers can find related public invitations in the same topic, with NOW candidates surfaced first. Discovery is **potential relevance**, never a verified match. Public threads and reply text never expose key hashes.
6. Owner and responder keys can withdraw entries; three distinct reported source fingerprints will place content into HIDDEN state. This is a basic automated safety hold, **not a substitute for a staffed moderation process**.

**Limits:** No automatic emails, SMS, Web Push for a closed browser, identity proof, location verification, resource reservation, safety screening, background AI matching, physical delivery or verified work completion. The term `MUTUALLY_ACKNOWLEDGED` is intentionally narrower than independently verified human identity or goods custody. Do not advertise this as completed real-world matching.

**Retention:** Thread visibility lasts 30 days. A daily database job deletes expired threads (cascading posts, watches, notifications, matches and reports) and expired quota buckets. A user can withdraw sooner, but previously shared copies cannot be recalled.

## Storage and security

- Seven dedicated `public.ic02_*` tables; all have RLS enabled and direct `anon`/`authenticated` access revoked. Only the Edge service account accesses table data. No browser service-role or secret key.
- Server-side allowlisted CORS origins, tightly shaped JSON input, character and PII/url filters, no HTML rendering of public text, global and per-source daily rate limits through an atomic RPC, and bounded result pages.
- Single-purpose opaque private receipt keys are generated with `crypto.getRandomValues`, stored only as SHA-256 hashes in database rows; keys are returned once over HTTPS. The visitor may voluntarily download their private receipts. Browser memory is default. Only the separate `Remember on this device` watch option writes to localStorage; unwatch clears it.
- A public link does **not** identify a human, demonstrate consent from the claimed organizer, or create a real-world permission to contact.
- Existing Abundent Porch Receiver 009 is *not* repurposed as everyone's personal inbox; this network has its own boundaries and data model.
- Security advisors: RLS with no policies is intentional; direct client roles have no table privileges. Keep reviewing other advisor findings separately.

## Evidence completed

A real synthetic, clearly labeled, short-lived test traversed:
`PUBLIC THREAD 201 → WATCH 201 → PUBLIC REPLY 201 → POLL 200 (REPLY) → MATCH PROPOSED → owner acknowledgment → responder acknowledgment (MUTUALLY_ACKNOWLEDGED) → automatic MATCH_CONFIRMED notice → WITHDRAW 200`.

The test fixture was then withdrawn. Its public content was not a real offer. The Edge Function health endpoint returned 200 after fixing a global `URL` shadowing issue. The first live deployment errored before that correction; the deployed function was corrected and rechecked. CI tests `tests/invitation_network.test.mjs` and `tests/invitation_network_browser.py` inspect the webZ client and run a mocked 390x844 browser journey, without making real public posts.

## Immediate follow-ups

- Build a scoped human moderation console with review/restore privileges, reporting visibility, and escalation before high-traffic promotion.
- Add **optional externally delivered notifications** using a verified provider (Web Push/email) with explicit per-channel opt-in and revocation; do not silently enroll people.
- Improve true match evidence with trusted source attestations, mutual scope/availability confirmation, and reLATTE-signed custody and completion receipts. Never conflate a two-key acknowledgement with real-world verification.
- Build repeatable notifications integration tests, including shutdown/resume, idempotency, and expired receipts. Link actual media assets only after capability-safe storage and user permission.

**Law:** Receiving is not admitting. A notification is not an obligation. Two acknowledgments are not proof of delivery.
