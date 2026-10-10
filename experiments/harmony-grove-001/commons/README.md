# GIVING-TREE-003 — moderated receiving commons

**Status: code-ready experimental branch. Not deployed. No public server or moderation service is claimed.** This is a separate proposed organ stacked on local gift handoff #34. The deployed abundent.org, `STATIC_PATHS`, founding catalog, service worker, DNS and existing Supabase projects remain untouched.

## What is real in this slice

- **A receiving contract** that verifies the exact Giving Tree 002 JSON gift hash, original seed hash, parent reference integrity, declared permission and publication opt-in. A self-declaration is not proof of rights.
- **A bounded HTTP API** accepting a whole-file opt-in under a proof-of-human challenge, returning `PENDING_HUMAN_REVIEW`, a private 256-bit withdrawal capability, and nothing public.
- **A private review queue** with authenticated `PUBLISH` / `REJECT` decisions; only `PUBLISHED` records appear in a public gallery.
- **A withdrawal operation** that removes a gift from future gallery responses and redacts stored content. Previously downloaded copies cannot be revoked.
- **A participant porch** built without a login and requiring intentional submission; a disabled `config.mjs` prevents accidental network effects. Gallery fetch is user-initiated, never passive.
- **A backend adapter and SQL** designed for a dedicated Supabase project. The service-role key is server-side only; database public roles have no direct table access and RLS is enabled.

## Deployment boundary — required before switching on

1. Create or explicitly designate a **dedicated** Supabase project. Do not reuse `pantry-gate`, WITNESS or other unrelated projects without a separate review. Apply `supabase/sql/giving-tree-003.sql` in that selected project after verifying schema and permissions. Check Supabase security advisors and verify `anon` / `authenticated` cannot read/write pending rows directly.
2. Deploy `supabase/functions/giving-tree-commons/index.ts` with all relative imports bundled. The code uses `verify_jwt=false` **only for the externally reachable public submission/gallery/withdrawal routes** and separately requires a private moderator secret for review. The backend itself rejects submissions until explicit gate settings are in place. Ensure the function has gateway WAF/rate limits and monitoring before public exposure. Supabase Edge must handle verified Turnstile tokens; `TREE_TURNSTILE_SECRET` never belongs in client code.
3. Set server secrets `TREE_MODERATOR_TOKEN_SHA256` (SHA-256 of a randomly generated 32-byte hex review capability), `TREE_TURNSTILE_SECRET`, `TREE_EXPECTED_HOSTNAME`, `TREE_ALLOWED_ORIGIN=https://abundent.org`. Never commit credentials or expose the service-role key. Set `TREE_GALLERY_ENABLED=true` only after a real moderation operator and deletion/abuse procedure are ready. Set `TREE_INTAKE_ENABLED=true` **last**, after smoke-tests and quota controls.
4. Install a same-origin `/api/giving-tree-commons` proxy or equivalent reviewed route on Abundent; configure `commons/config.mjs` with only this *same-origin* URL and the public Turnstile **site** key. Permit the Turnstile iframe/script using a **route-specific CSP**, because the existing global Vercel CSP forbids third-party scripts. Continue to refuse passive third-party requests on the rest of WebZ. Review 404s, Origin/CORS, WAF, turnstile hostname, 32-KiB payload cap, moderator token auth, and withdrawal on HTTPS.
5. Execute the browser flow on physical mobile and desktop, test screen readers, consent, moderation, public viewing, download, return and deletion. Revalidate `npm test`, the full browser suite, deterministic public export, release bytes and rollback before a separately approved promotion. New files stay **outside** `STATIC_PATHS` by default; this branch does not publish or merge itself.

### Statuses

`OFFERED` (participant request) → `PENDING` (private) → human `PUBLISHED` or `REJECTED`. Either `PENDING` or `PUBLISHED` → `WITHDRAWN` using the secret withdrawal capability. Rejection/withdrawal redacts the gift body; digest tombstone is retained against silent re-submission.

### Protocol

`GET /health`, `GET /gifts` (approved only, max 20), `POST /submit` (explicit consent + token → pending), `POST /withdraw` (private receipt), `GET /queue` and `POST /review` (moderator token only). The endpoint is `/functions/v1/giving-tree-commons` on a dedicated Supabase project; a same-site proxy may expose it at `/api/giving-tree-commons`.

The moderator CLI `scripts/review-giving-tree.mjs` reads `TREE_ENDPOINT` and `TREE_REVIEWER_TOKEN` from a private shell or secret manager, not URL query parameters. Moderators **must inspect the complete content for safety, rights, privacy, spam and child-related concerns** before publishing; automated hash verification is not content moderation.

### Checks

Run `node --test tests/giving-tree-commons.test.mjs tests/giving-tree-gift.test.mjs tests/harmony-grove.test.mjs`. Tests cover disable-by-default, forged/unknown permissions, explicit consent, verification challenge, private review authorization, pending invisibility, publication, checksum integrity, duplicate refusal, withdrawal and redaction. Tests use an in-memory store: **no real Supabase network integration or deployment is claimed**. The migration, remote API, Turnstile challenge, CSP, browsers and actual abuse defenses still require independent witness.

### What not to claim

A gift is not a public record until reviewed and published. Reviewer approval is not a verified license. A withdrawal stops future gallery output but not independently held copies. An IP or bot challenge is not the same as identity authentication. The public URL is not a content moderation service without an actual human reviewer. No payments, user accounts, authenticated authorship, newsletter signup, notification or creator payments are established.
