# QUOTA-018 — shared database connected / platform map

## Verified live platform map (2026-10-25)

**Porkbun** is the registrar for abundent.org. **Cloudflare** answers its authoritative DNS (damien/lilith nameservers). DNS is NOT the same as hosting. In Cloudflare's ACTIVE zone, root A records are DNS-only; `www.abundent.org` points to a Vercel DNS endpoint. Vercel independently confirms `abundent.org` and `www.abundent.org` attached to `webz-field-porch`. Other DNS-only Cloudflare records point `connections.abundent.org` to Vercel Ask JAR;VIS, `garden.abundent.org` to Vercel Garden Atlas and `msyou.abundent.org` to Vercel. `ph.abundent.org` is explicitly proxied by Cloudflare and points to a `pages.dev` origin. Cloudflare's DNS authority or orange-cloud proxy status does **not** mean the full site is hosted as a Cloudflare Worker. Actual origin and request path still matter.

This rollout does not change live DNS or move the domain. Vercel protection and functions apply to Vercel projects; Cloudflare zone WAF applies only to proxied Cloudflare traffic. DNS-only subdomains will not be protected by Cloudflare's HTTP WAF.

## Actual shared database resource

Existing owner project **Supabase pantry-gate** `kbhqacsdvjsstzyplqij` is active and reused rather than adding a paid Upstash service. A private `jarvis_guard` schema holds the HMAC secret and hashed rate counters. An atomic Postgres procedure `public.jarvis_quota_reserve` has EXECUTE granted only to service_role and none to anon/authenticated. Row-level security is enabled on both internal tables.

Function `jarvis-quota`, deployed as a Supabase Edge Function at `https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-quota`, accepts a HMAC-signed bounded JSON request from server-side clients, calls the service-role-only RPC, and returns a machine-readable accept / 429 rate limit / 503 unavailable response. The internal RPC checks HMAC, clock skew, identity format, allowable kind and cost before acquiring a transaction lock and atomically reserving all four counters. No client IPs, question text or contact information are stored in the counter database: only server-HMACed client digests and fixed minute/day windows. Old counters expire and are pruned. Do not put the HMAC secret in browser JS or git.

**The Vercel Ask JAR;VIS preview project has real server-side Preview environment variables** `JARVIS_SUPABASE_QUOTA_URL` and sensitive `JARVIS_RATE_HASH_SECRET`, matched to the database's secret without printing it. `src/usage-guard.mjs` selects this shared Supabase authority (or optional Upstash) and fails closed when unavailable. Ordinary questions, AI and search share the same strict global accounting across Vercel instances. This HTTPS quota service is platform-neutral and can be called by a Cloudflare Worker later; Cloudflare deployment is separate and needs its own trusted client-IP adaptation, secret configuration, smoke tests and production gate.

## What is NOT done

This is a **preview-only** binding. Vercel `webz-field-porch` (the main production project) is separate from `ask-jarvis-1999-preview`. We did not switch its source branch, update the apex site, flip a production AI flag, enable DNS proxy, or change Cloudflare Worker routes. Source owner PRs are draft and stacked. The owner must evaluate real model outputs and source permissions before any public release.

The Supabase guard responds under the provider's service envelope; it is not a substitute for Vercel firewall or Cloudflare bot rules where applicable. It does not certify responses, users, or agreements. The local database connection/procedure test returned `{"ok":true,"window":0}` for a synthetic, unsigned field-independent test request. Additional real HTTP smoke and human review are still required.

## Verification steps

- Deploy the nested `ask-jarvis/` project from this branch with the existing preview environment configured.
- Run `npm test`; in particular `test/supabase-quota.test.mjs`, `test/usage-guard.test.mjs`, `test/quality.test.mjs`.
- Open preview `/api/adaptive` to inspect enabled/not enabled; for a real request, verify one signed counter debit and no more than the stated quotas.
- Conduct the phone field test at `/quality-lab.html`, export local human scores, and review fabricated-field-effect test cases.
- Enable production only after an explicit production deployment/configuration and WAF/human checklist pass. Keep the one-switch AI rollback.
