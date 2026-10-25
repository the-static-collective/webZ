# EDGE-019 / Cloudflare → Modal canary (not yet deployed)

This is **not** the live `abundent.org` site or an existing Worker replacement. It is a reversible `workers.dev` canary and requires human-authenticated Cloudflare/Modal deployment. Vercel stays online.

## What is built

The `jarvis-compute-lab` Worker serves the existing Ask JAR static UI (and `/field-kit-lab.html`), read-only `/api/ask`, `/api/health` and explicitly triggered `/api/field-kit`. All POSTs require a real Cloudflare-provided client IP and a signed, atomic Supabase request (shared with Vercel). A model/compute request reserves the `ai` budget **before** external GitHub source reads or the Modal call. The input is public-safe and under 360 characters; no contact details, credentials, arbitrary provider URL, payment request, upload, publishing or outbound message is accepted. A failed quota or Modal upstream fails closed. Only at most three exact-commit, SHA-pinned public source metadata references, a short first-move direction and the public question travel to Modal.

Modal Python app `jarvis-field-kit` is intentionally deterministic, with CPU/memory bounds and `max_containers=2`. It generates a human-reviewable printable invitation and useful first test. This demonstrates actual paid-by-compute Python execution, **not AI inference**. Model-backed synthesis can be added only after quality/safety/cost evidence.

## Modal operator action (after setting up a workspace)

Use `python -m pip install modal`, then `modal setup` for local browser auth. In Modal's Billing / Budgets UI set a low spend limit or spending notification, check that Starter compute credits cover *functions* but not paid shared-model endpoints. Create one independently random 32+ byte token (do NOT share it in chat or Git):

`modal secret create jarvis-modal-bridge JARVIS_MODAL_BRIDGE_SECRET=<random-32-plus-byte-token>`

From `ask-jarvis/` run:

`modal deploy cloudflare-modal/modal_field_kit.py`

Create a Modal **proxy token** so requests without credentials are rejected before a billable container starts:

`modal workspace proxy-tokens create --name jarvis-cloudflare-canary`

Save the returned `wk-...` key and `ws-...` secret securely. The Modal ASGI endpoint declares `requires_proxy_auth=True`. Its secondary timestamped HMAC is defense in depth, not a substitute for Modal proxy authorization.

The resulting `https://<workspace>--jarvis-field-kit-app.modal.run`-style function URL is entered as Cloudflare Worker secret `MODAL_FIELD_KIT_URL` (not a URL chosen by a visitor). Store the exact same random token as Worker secret `MODAL_BRIDGE_SECRET`. Also put the Modal proxy credentials into the Worker **secrets** `MODAL_PROXY_KEY` and `MODAL_PROXY_SECRET` respectively. If preferred, use Modal dashboard secrets; no token belongs in source control.

## Cloudflare operator action

From `ask-jarvis/`, after authenticating Wrangler with the **same Cloudflare account as abundent.org**:

`npx wrangler secret put JARVIS_RATE_HASH_SECRET --config wrangler.edge-modal.jsonc`

Value: copy the existing shared Supabase `jarvis_guard.settings.v1_hmac` from secure deployment secret management, **without exposing it in chat or logs**. Reusing this secret makes the Worker debit the *same global counters* as Vercel. Do not change the Supabase HMAC secret without coordinating both runtimes.

`npx wrangler secret put MODAL_BRIDGE_SECRET --config wrangler.edge-modal.jsonc`

 `npx wrangler secret put MODAL_FIELD_KIT_URL --config wrangler.edge-modal.jsonc`

`npx wrangler secret put MODAL_PROXY_KEY --config wrangler.edge-modal.jsonc`

`npx wrangler secret put MODAL_PROXY_SECRET --config wrangler.edge-modal.jsonc`

Deploy initially with `JARVIS_MODAL_ENABLED=0`, confirm `GET /api/health` and bounded `POST /api/ask`, and inspect Supabase quota increments and 429 behavior. Then set `JARVIS_MODAL_ENABLED=1` in the Wrangler config and deploy again, verify one real compute call and an 8/10 human-quality score. `JARVIS_MODAL_ENABLED` is the immediate kill switch for new Modal calls.

## DNS and ownership

Do not edit Porkbun's retired DNS zone. **Cloudflare currently answers abundent.org's authoritative DNS.** Cloudflare Workers Custom Domains automatically provision routing/DNS when configured in Wrangler. Once the Worker is deployed, budgets and fail-closed paths pass, review an isolated `lab.abundent.org` custom-domain route (instead of `connections.abundent.org` or the apex). Only then update config with `routes: [{pattern:"lab.abundent.org",custom_domain:true}]` and redeploy through the authorized Cloudflare account; inspect the live Cloudflare DNS record after deploy. Never manually create a conflicting `lab` DNS record before Custom Domain creation.

No live hostnames, Vercel production deployments, or Cloudflare DNS records were changed by this branch.
