# FREE-COMPUTE-007 — JAR;VIS free-resource switchboard

**State: feature-branch implementation / protected Vercel preview only. No public inference release.**

JAR (the provenance librarian) runs exactly as before. VIS adds an independently optional model investigation. The external provider receives only the public-safe question and up to three short excerpts of inspected commit-pinned documents. The model does NOT receive passwords, contact lists, repositories, environment variables or human authority to execute a plan. Its claims remain reviewed hypotheses, and the browser verifies the unsigned hash and source references. The deterministic question card still works with **zero** model calls.

## Routes and actual connectors

| User route | First configured allowed connector | Next eligible preference (selection only; NO automatic retry after failure) |
| --- | --- | --- |
| auto | NVIDIA Build trial Nemotron | Cloudflare Nemotron, Groq, Gemini, OpenRouter, Workers binding |
| nemotron | Cloudflare Workers AI REST Nemotron 3 Super | NVIDIA Build trial |
| fast | Groq GPT-OSS-120B | Workers binding, Gemini, OpenRouter |
| reason | Gemini 2.5 Flash-Lite | Cloudflare Nemotron, Groq, OpenRouter |
| explore | OpenRouter openrouter/free | Gemini, Groq, Workers binding |

**Only one model is selected per click.** The router never retries or switches provider after HTTP 429/500, a timeout or invalid model result. The separate, rules-only card stays available; the model result becomes HOLD. No automatic paid model, alternate endpoint, user-entered URL, tool call, remote action, or stored prompt is authorized.

Current implementations: **NVIDIA Build developer trial**, **Groq Free GPT-OSS-120B**, **Google Gemini free-tier Flash-Lite**, **OpenRouter free-model router**, **Cloudflare Workers AI Nemotron via REST**, and the existing **Cloudflare Worker AI binding**. The free-resource manifest describes Modal's monthly free compute as **PLANNED**, not a running GPU service. Vercel AI Gateway remains in the original VIS-006 evaluation adapter, not silently part of the free router.

These are tested source connectors, **not claims of authenticated real API calls or zero cost**. Per-provider quotas, availability, free-plan terms, retention policy and commercial use can change. A configured key is NOT proof that the connected account cannot be billed.

## Vercel protected preview activation

The Vercel project is `ask-jarvis-1999-preview`; the source is `webZ/ask-jarvis`. Enable the switchboard only in **Preview**:

- `JARVIS_AI_ENABLED=1` (already the VIS test gate)
- `JARVIS_FREE_COMPUTE_ENABLED=1` (turns on the new server router; must NOT be set in Production)
- `NVIDIA_API_KEY` (existing protected, evaluation-only NVIDIA developer key)
- `JARVIS_ALLOW_GROQ_FREE=1` plus server-only `GROQ_API_KEY` for Groq free-plan use
- `JARVIS_ALLOW_GEMINI_FREE=1` plus server-only `GEMINI_API_KEY` for Gemini free-tier use
- `JARVIS_ALLOW_OPENROUTER_FREE=1` plus server-only `OPENROUTER_API_KEY` for OpenRouter free router
- `JARVIS_ALLOW_CLOUDFLARE_FREE=1`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (32 hex chars) for Cloudflare REST
- `JARVIS_ALLOW_WORKERS_AI=1` plus real `env.AI` binding if deployed natively on a Worker.

Do **not** place a secret or access token in source, `public/`, a browser form, or a shared question URL. Keys are only read server-side. Non-NVIDIA providers need both explicit individual allow flags and keys. Adding a key alone does not activate routing.

When protected preview and flags are enabled, GET `/api/free-resources` returns **non-secret** provider readiness and catalog labels. On non-preview deployments it returns 404. POST `/api/investigate` accepts the existing question/kind plus an optional enumerated `route`; this is only callable when `VERCEL_ENV=preview` and `JARVIS_AI_ENABLED=1`. Even if someone accidentally sets all Production flags, the Vercel model route continues HOLD.

## Credit and abuse boundaries

- NVIDIA Build hosted free evaluation endpoint explicitly **not for production/business-critical workloads**; it may retain prompts and responses. Test only with synthetic, nonsensitive questions in SSO-protected preview.
- Groq free limits are account-specific; verify the account is actually on the Free plan. No paid escalation.
- Gemini free-tier prompts may be used by Google for product improvement. Verify the selected model has a free tier for the account.
- OpenRouter `openrouter/free` selects free upstreams, potentially across providers with different retention policies. This is not the paid OpenRouter automatic-routing product.
- Cloudflare Neurons are metered; usage beyond the free daily allowance may incur charges depending on plan and billing state. Check provider hard budgets/alerts and verify no billable usage before enabling.
- Vercel Preview protection must remain enabled. Public access requires global per-identity request limits at WAF/gateway, abuse controls, hard provider-side spend caps and logs that never contain prompts or secrets. A serverless in-memory counter is **not** adequate; none is claimed here.
- No automatic fallback after a failed provider call: some attempts are billable even if an upstream returns an error. Source hash, result hash, model ID, route and call-count metadata are observational only.
- Browser opt-in does NOT mean the same prompt may be silently sent to several providers. One selected external provider receives the bounded context per click.

## Demonstrate to grocery organizers

Use **ordinary JAR question cards on the public site**; no logins, secret keys, or model spend. For a supervised operator demo, use the protected preview with test questions containing no identifiable people or private details, e.g.:

> What single reversible grocery experiment could connect surplus food, a willing host and neighborhood volunteers without promising that anyone has agreed?

1. Ask JAR for the deterministic source-backed plan. Inspect fixed public citations and receipts.
2. Select NEMOTRON, FAST, REASON or EXPLORE (only configured routes work), then independently click VIS.
3. Read the clearly labeled model hypothesis, named provider, unknowns, and consent gate.
4. Ask one actual willing steward to approve a tiny pilot. Only afterward should any real-world actions occur.

**Completion gates:** run `npm test` in `ask-jarvis`, inspect preview build, run a protected browser smoke on a synthetic question for each configured provider, verify failed/429/offline requests HOLD with zero cross-provider retries, record the tested commit and budget counters, then decide separately about production-grade providers.

**Integrity > Continuity. SOURCE ≠ CONSENT. MODEL PROPOSAL ≠ ACTION. FREE TIER ≠ ZERO-BILLING GUARANTEE.**
