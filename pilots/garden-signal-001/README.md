# Garden Signal 001

An independent, account-free **Waseca community grocery listening porch**: six shareable questions, printable invitations, draft captions, private moderation-gated contributions, withdrawal receipts, and a public view restricted to human-approved Garden Ledger entries.

**Source:** `site.ts` is the full static HTML interface and `index.ts` is a narrow Supabase Edge Function relay. Deployed separately under `/functions/v1/garden-signal` on the existing pantry-gate Supabase project, without replacing the official co-op site, Garden atlas, or social accounts.

**Back end:** Reuses `garden-ledger` with server-side input validation, existing global and per-visitor quotas, PRIVATE/PENDING by default, and revocable receipt tokens. No raw user submissions or contact details are publicly exposed. No social platform integrations, automations, official co-op statements, or membership database access.

**Security:** No user authentication; strict same-origin writes; input bounds; no contact information or URLs; no third-party JavaScript; Content Security Policy; public feed is PUBLIC_REVIEWED only. Volunteer identities, consent, and verification remain with human stewards. Existing ledger records preserve the legacy `garden-workbench-v1` source label; this pilot doesn't claim analytics segregation.

**Editorial workflow:** The private reviewer uses the existing Garden entries queue to decide whether a human-reviewed redacted summary should become PUBLIC. Review does not prove the claims true. Rejection and withdrawal are supported. No status changes are made automatically.

**Handoff:** The co-op owns its governance, social accounts, logo, and publication approval. This independent pilot is available for review, not an adopted communications platform.
