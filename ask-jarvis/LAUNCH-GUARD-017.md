# LAUNCH-GUARD-017 / PUBLIC BETA GO–NO GO

## Built, not assumed

This branch protects Vercel Ask JAR;VIS functions with a shared-request limiter in `src/usage-guard.mjs`. It uses an atomic Redis Lua script sent to an Upstash HTTPS REST endpoint. Counters are shared across serverless instances. They reserve allowance **before** external reads or model inference; failed inference still consumes a reservation to cap upstream attempts.

| Lane | Per visitor per minute | Per visitor per UTC day | All visitors per minute | All visitors per UTC day |
| --- | ---: | ---: | ---: | ---: |
| One-model AI (adaptive, investigator; Council counts as two) | 4 | 15 | 20 | 150 |
| Explicit external search | 3 | 18 | 25 | 250 |
| Ordinary question/source assembly | 10 | 120 | 120 | 2500 |

Rate-limit results return 429 and Retry-After; unavailable counter store, missing trusted client identity, or unconfigured production store returns 503 (no upstream work). Keys contain only HMAC-hashed Vercel-provided IP and fixed window IDs; no question, phone, secret, address or raw IP is stored as a counter key. HMAC secret and Upstash credentials stay server-side. IP quotas can inadvertently affect people sharing one network (library, shelter, household); adjust after field measurement, don't impose an account requirement.

The protected **preview** can remain unmetered when no shared store is configured, for backward compatibility with its SSO-gated testing; **this is NOT a public-ready model surface.** Public production AI requires an independent release switch, configured atomic counters, the individual Groq or Gemini free-plan allowlist, and all existing AI feature flags. NVIDIA trials, ambiguous OpenRouter free routing, and paid fallbacks are not eligible for automatic public AI.

The normal `/api/ask` adapter, `/api/discover`, `/api/investigate`, `/api/council`, and `/api/adaptive` all apply appropriate gates before any third-party call. Experimental model endpoints reject direct email/phone/credential-shaped questions before sending text to an external provider. Other sensitive material can evade pattern checks: clear disclosure and safe user practices remain essential.

## External setup still required

1. Create/attach a durable Upstash Redis instance for the correct Vercel project and restrict provider billing appropriately. Set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and a new random server-only `JARVIS_RATE_HASH_SECRET` (24+ characters). Store as sensitive environment variables. Never paste keys into chat, Git or browser JavaScript.
2. Keep `JARVIS_PUBLIC_AI_ENABLED` unset until all gates below pass. **It is an independent operator release, not a license to enable production just because builds are green.**
3. Configure Vercel Firewall rate limiting and bot challenge separately. Proposed WAF rule: POST paths matching `/api/(ask|adaptive|investigate|council|discover)`, fixed 30 requests / 60 sec per IP, action 429, watch logs for mistaken blocks; cost and WAF limits depend on Vercel plan. Also ensure preview SSO remains enabled.
4. Confirm no public development/test preview domain bypasses production toggles or runs unprotected external calls. Ensure any Cloudflare Worker or alternative runtime is separately limited: these safeguards cover only the Vercel adapters patched here.
5. Confirm actual free provider rate tiers and cost budget in the account, including what happens if a free quota is exhausted. Switch off automatic public AI on surprise billing/overuse.
6. Verify disabling `JARVIS_PUBLIC_AI_ENABLED` immediately holds all production AI; rerun a production environment deploy and inspect exact effective variables before moving domain/alias.
7. Test 429, 503, fail-closed network outage, same-IP shared devices, and mobile accessibility with a human.

## Quality test, with no invented pass claims

The deck at `quality/real-world-scenarios.json` contains 12 questions in the words of a prospective grocery, church, artist, park volunteer, technology steward, and outsider. It also includes an independent science question, a *live local closing time* question, an unverifiable partnership challenge, privacy and prompt injection.

Unit test `test/quality.test.mjs` checks that these are public-safe and that all receive a deterministic, source-hashed fallback. It is not an AI usefulness or human trial. Real model trials are opt-in:

`JARVIS_QUALITY_BASE_URL=https://<EXACT-SSO-PREVIEW>.vercel.app JARVIS_QUALITY_RUN_LIVE=I_APPROVE_MODEL_CALLS node scripts/quality-live.mjs`

Default: three diverse questions. `--all`: twelve, at a paced cadence respecting the published AI quota. The script writes a local JSON report, checks the two independent answer receipts and public source snapshot, and records candidate text for human review. It never automatically publishes answers, contacts people, or invents wins.

**Human scoring: five axes, each 0–2:** (a) responds to the actual question, (b) uses available source details *correctly*, (c) yields a draft/action usable within 15 minutes, (d) names essential unknowns without needless disclaimers, (e) handles privacy and outside-domain questions appropriately. Require at least 8/10 on 10 of the 12 cases, with zero fabricated permissions / statuses / personally identifying leaks, then review the two weak cases before release. Automated checks only test surface-level structural proxies and never replace human verification. New research is not available inside the adaptive model; time-sensitive questions must request an official source rather than invent live hours.

## Release recommendation

**Current recommendation: HOLD PUBLIC AI.** The code/test path is ready for review; no durable Redis binding, browser-level model smoke, public WAF traffic evidence, or human-rated 12-question report has been established here. Leave production domains and partner-owned sources unchanged. Ship a small reversible beta only after the above independently verified gates pass. Preserve a one-switch rollback to the deterministic question card.
