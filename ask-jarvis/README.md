# ASK JAR;VIS — GENESIS 001

**One question. The whole house takes attendance.**

A deliberately 1999-looking, single-box temporary front door for Abundent, deployable as a standalone **Cloudflare Worker with static assets**. Built on the exact webZ CIRCULATION-004 ancestry. This branch is a staging candidate. It has **not** replaced the existing site, changed DNS, published person-related information, or executed real agents.

## What actually works

- GET / serves a responsive, keyboard-accessible retro HTML/CSS UI.
- POST /api/ask accepts one bounded question without contact details and responds with an inspectable trace.
- A deterministic LOADOUT selects 3 of 6 **hardcoded, source-owned** public project capability entries.
- Cloudflare Worker reads only those specific public source files from the Static Collective on GitHub and hashes the returned bytes. No user text goes to GitHub.
- JAR;VIS writes a truthful return with status per lane, an answer about the findings, a next question, a downloadable printable plain-text question card, and a content digest.
- The interface **never reports a HOLD or NOT_RUN lane as executed**. A failed source fetch is UNAVAILABLE, not evidence.
- No database, analytics, cookies, LLM token, GitHub write, community intake, contact information, persistence of visitors' questions, payments, or code execution.

**Not yet implemented:** real model-led question decomposition; dynamic LOADOUT/registry ingestion; native CANNON or OpenManus/ELF execution; durable workflow orchestration; verified consent and real partner routing. The source inspection uses a deterministic keyword selector, **not an LLM**. Hashes prove observed bytes, not human truth or project endorsement.

## Run locally

Requires Node 22+ and Wrangler. From this folder:

    node --test test/*.test.mjs
    npm install
    npx wrangler dev

Visit the local URL from Wrangler and ask a public-safe question. To publish a standalone Cloudflare test Worker (requires your authenticated Cloudflare credentials):

    npx wrangler deploy

Wrangler config does **not** include a custom domain, production route, or secret. Do not bind abundent.org until source and UI tests, privacy checks, live source fetches, and human review are complete.

## Existing production stays on its shelf

The current Abundent production site remains deployed on Vercel. This Worker is a separate entrypoint. After validating on a Cloudflare workers.dev preview, a separate DNS/routing decision can move the **apex hostname** to Cloudflare and keep the old Garden Workbench reachable from an explicit archive address. Do not take over www, ph, or other subdomains as collateral damage.

## Machine boundaries

OBSERVE → SELECT → READ-ONLY SOURCE FETCH → HASH → LOCAL CARD → RETURN

No auto-execution, real partner contact, real CANNON attestation, or OpenManus dispatch. To extend the machine, make each native donor adapter pass an explicit capability contract, human authorization gate for effects, isolated runtime, idempotency, timeout, and content-addressed receipts. CANNON's validation is a separate source-owned step, not claimed by this version.

## Testing and release

- Run node tests; verify rejection, unavailable upstreams, provenance, source allowlisting, and non-execution flags.
- Check mobile, keyboard, desktop, printing, and browser network (only API POST to same origin; Worker source reads to GitHub).
- Test the deployment GET /api/health and one ordinary /api/ask end-to-end.
- Protect the public endpoint with Cloudflare WAF rate limits before broad promotion.
- Only after an explicit release and rollback decision, assign the domain.

GitHub source: https://github.com/the-static-collective/webZ/tree/feature/ask-jarvis-1999/ask-jarvis

**AN OBSERVED SOURCE ≠ A RUNNING PROJECT. A HASH ≠ CONSENT. A PROPOSAL ≠ AUTHORITY.**
