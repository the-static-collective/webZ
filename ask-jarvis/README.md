# ASK JAR;VIS — GENESIS 001

**One question. The whole house takes attendance.**

A deliberately 1999-looking, single-box temporary front door for Abundent, deployable as a standalone **Cloudflare Worker with static assets**. Built on the exact webZ CIRCULATION-004 ancestry. **LIVE RELEASE (2026-10-23):** By owner's explicit instruction, the tested Ask JAR;VIS Vercel deployment was assigned the `abundent.org` alias. No DNS records were changed, and no real agents or external project actions execute. The original Garden Workbench remains preserved at its own Vercel URL. **Cloudflare Worker deployment is still planned**, not claimed.

## What actually works

- GET / serves a responsive, keyboard-accessible retro HTML/CSS UI.
- POST /api/ask accepts one bounded question without contact details and responds with an inspectable trace.
- A deterministic LOADOUT selects 3 of 6 **hardcoded, source-owned** public project capability entries.
- The Vercel preview/production adapter and the Cloudflare Worker implementation both read only those specific public source files from the Static Collective on GitHub and hash the returned bytes. No user text goes to GitHub.
- JAR;VIS writes a truthful return with status per lane, an answer about the findings, a next question, a downloadable printable plain-text question card, and a content digest.
- The interface **never reports a HOLD or NOT_RUN lane as executed**. A failed source fetch is UNAVAILABLE, not evidence.
- No database, analytics, cookies, LLM token, GitHub write, community intake, contact information, persistence of visitors' questions, payments, or code execution.

**Not yet implemented:** real model-led question decomposition; dynamic LOADOUT/registry ingestion; native CANNON or OpenManus/ELF execution; durable workflow orchestration; verified consent and real partner routing. The source inspection uses a deterministic keyword selector, **not an LLM**. Hashes prove observed bytes, not human truth or project endorsement.

## Run locally

Requires Node 22+ and Wrangler. From this folder:

    node --test test/worker.test.mjs
    npm install
    npx wrangler dev

Visit the local URL from Wrangler and ask a public-safe question. To publish a standalone Cloudflare test Worker (requires your authenticated Cloudflare credentials):

    npx wrangler deploy

Wrangler config does **not** include a custom domain, production route, or secret. Cloudflare runtime cutover remains a separate operation. Current hostname release is Vercel alias routing, not a Cloudflare Worker deployment.

## Live front door and original Garden shelf

**Current homepage:** https://abundent.org/ is served by the standalone Ask JAR;VIS Vercel project through a reassigned Vercel alias.

**Preserved Garden Workbench:** https://webz-field-porch-theotherlucasv-1250s-projects.vercel.app/ and the immutable older deployment https://webz-field-porch-eb7chh2s9-theotherlucasv-1250s-projects.vercel.app/ continue to serve the original garden and related routes. The older deployment is the rollback candidate.

**Cloudflare:** Authoritative DNS remains at Cloudflare, but content is still hosted on Vercel. Worker cutover must preserve these aliases, including `www` redirect behavior, and must not disrupt `ph.abundent.org`.

See `RELEASE-2026-10-23.md` for current mappings, exact deployment identifiers, and rollback.

## Machine boundaries

OBSERVE → SELECT → READ-ONLY SOURCE FETCH → HASH → LOCAL CARD → RETURN

No auto-execution, real partner contact, real CANNON attestation, or OpenManus dispatch. To extend the machine, make each native donor adapter pass an explicit capability contract, human authorization gate for effects, isolated runtime, idempotency, timeout, and content-addressed receipts. CANNON's validation is a separate source-owned step, not claimed by this version.

## Testing and release

- Run node tests; verify rejection, unavailable upstreams, provenance, source allowlisting, and non-execution flags.
- Check mobile, keyboard, desktop, printing, and browser network (only API POST to same origin; Worker source reads to GitHub).
- Test the deployment GET /api/health and one ordinary /api/ask end-to-end.
- Protect the public endpoint with Cloudflare WAF rate limits before broad promotion.
- The owner's release authorization was given and the apex alias reassigned on 2026-10-23. Further releases and a Cloudflare origin migration require their own review.

GitHub source: https://github.com/the-static-collective/webZ/tree/feature/ask-jarvis-1999/ask-jarvis

**AN OBSERVED SOURCE ≠ A RUNNING PROJECT. A HASH ≠ CONSENT. A PROPOSAL ≠ AUTHORITY.**

## Interactive game doors: Tomorrow 001 → 002 (live)

The original 1999 question machine remains the homepage. The **fully fictional, source-first game** at https://abundent.org/games/tomorrow/ is a paper-or-browser murder mystery in which no one was murdered. Solving the case opens a Question Key maker requiring three distinct clues; that local game key opens the **Town That Waits** at https://abundent.org/games/tomorrow/town/ . The town features a real, unmodified **Full Measure Alchematrix-001 experimental reducer**, pinned to donor source, with deterministic fictional crafting and a new explorable room projected from the actual in-game opening. It imports no external identities or canonical Full Measure authority. Details, provenance, and tests: [Tomorrow 002 README](public/games/tomorrow/README.md); active alias and rollback: [Release Ledger](RELEASE-2026-10-23.md).

## Recent-work relay (October 28, 2026)

A bounded, read-only source-owned editorial index now lives at [JAR-VIS/commons/recent-work-v1.json](https://github.com/the-static-collective/JAR-VIS/blob/main/commons/recent-work-v1.json). The public question machine fetches this fixed manifest, hashes it, validates each public reference and privately selects up to three topic-relevant summaries. A visitor question is never sent to GitHub. Outages HOLD, never fabricate a match. Entries are included in the original unsigned downloadable return and browser-verified receipt. This is not live partner discovery, automatic dispatch or source-project adoption.

## Source observatory / automatic updates

The scheduled source pointer observatory in JAR-VIS publishes `commons/source-observations-v1.json` from 11 allowlisted public Git repositories. Every regular question can cross-reference a relevant curated editorial note with the observed source branch tip. The public health endpoint `GET /api/source-observations` returns the exact checked-at timestamp, source-feed digest, counts and HOLDs. A branch ref, including main, is **not canon, deployment evidence, consent, or verified fulfillment**. Stale or invalid feeds HOLD; they never overwrite editorial meaning. No user question is sent to GitHub by either fixed manifest fetch.
