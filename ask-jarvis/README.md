# ASK JAR;VIS — GENESIS 001

**One question. The whole house takes attendance.**

A deliberately 1999-looking, single-box temporary front door for Abundent, deployable as a standalone **Cloudflare Worker with static assets**. Built on the exact webZ CIRCULATION-004 ancestry. **LIVE RELEASE (2026-10-23):** By owner's explicit instruction, the tested Ask JAR;VIS Vercel deployment was assigned the `abundent.org` alias. No DNS records were changed, and no real agents or external project actions execute. The original Garden Workbench remains preserved at its own Vercel URL. **Cloudflare Worker deployment is still planned**, not claimed.

## Curiosity 005 — review-only enhancement

This branch improves the public deterministic attendant without adding accounts, model APIs, data retention, or project execution:

- Detect multiple question subjects (food, gatherings, art, stewardship, hardware, broadcast, software) instead of collapsing every question into one generic category.
- Offer at most four explicit *hypotheses for a small reversible crossing* when more than one subject is present. These are invitations to ask, not evidence that partners agreed.
- Rank the existing seven pinned, source-owned public documents by question relevance; remove the previous default bias toward CANNON.
- Choose a relevant line from each inspected public source when question words actually overlap. Otherwise label it only a general document; an unavailable source is not evidence.
- Include cross-topic ideas and conditional source notes in question cards and field plans, with the existing unsigned evidence receipt. Invitation drafts and songs remain distinct outputs.

**Not a model upgrade:** This is still a transparent rules engine; it does not reason across full repositories, query private records, run agents, or promise to execute a proposed plan. An opt-in, server-side language-model adapter with an explicitly bounded public context would be a separate reviewed phase. Do not send private contact details to this public endpoint.

**Deployment status:** branch/PR proposal only; the active Abundent alias is unchanged until a separately approved, tested release.

## VIS-006 — opt-in model investigator (feature branch; not live)

This proposal builds on Curiosity-005. JAR remains the source-first deterministic librarian. VIS adds a real but **disabled-by-default** model invocation door for willing visitors: a bounded public question and at most three 235-character source excerpts are sent to an AI provider only after a separate click. The server validates the returned JSON, blocks fabricated source identifiers and returns a separately hashed, **unsigned** model proposal. No action, partner approval, or canon authority crosses with it.

Vercel AI Gateway (`nvidia/nemotron-3.5-lightning-free`, protected trials only) and Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`) are supported by server-only adapters; neither is enabled on the live site from this branch. No model API key is supplied with the repository or existing Vercel project, and public activation requires external rate limiting, spending controls, source-injection tests and operator approval. See [VIS-006 protocol](VIS-006.md).

## What actually works

- GET / serves a responsive, keyboard-accessible retro HTML/CSS UI.
- POST /api/ask accepts one bounded question without contact details and responds with an inspectable trace.
- A deterministic LOADOUT selects 3 of 7 **hardcoded, source-owned** public project capability entries.
- The Vercel preview/production adapter and the Cloudflare Worker implementation both read only those specific public source files from the Static Collective on GitHub and hash the returned bytes. No user text goes to GitHub.
- JAR;VIS writes a truthful return with status per lane, an answer about the findings, a next question, a downloadable printable plain-text question card, and a content digest.
- The interface **never reports a HOLD or NOT_RUN lane as executed**. A failed source fetch is UNAVAILABLE, not evidence.
- No database, analytics, cookies, LLM token, GitHub write, community intake, contact information, persistence of visitors' questions, payments, or code execution.

**Not yet implemented on the live site:** general-purpose model-led question decomposition; dynamic LOADOUT/registry ingestion; native CANNON or OpenManus/ELF execution; durable workflow orchestration; verified consent and real partner routing. The source inspection uses a deterministic keyword selector, **not an LLM**. Hashes prove observed bytes, not human truth or project endorsement.

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

## TRIAD-008 + NATIVE-009 protected research engine

Selecting **ALEX × 3rdi × LOADOUT** inspects three pinned public owner documents and displays a source/observer/effect-fence research cut. A separate, explicit **Run Three Owner Kernels** button then calls the actual owner Python code through `api/native.py` when the protected Vercel preview enables it. ALEX evaluates an unsupported source-to-local-need claim, 3rdi compiles an observer-local question-arrival projection and LOADOUT refuses unapproved contact. Each returns a locally verifiable unsigned native receipt, not a warrant of real-world approval or action. The independent model-investigation and question/AI-proposal handoffs still work as before. See [NATIVE-009.md](NATIVE-009.md) and [TRIAD-008.md](TRIAD-008.md). Production/native auto-execution is **disabled**.

## MAGIC LEGO 014 — context-shaped front room (proposal)

The existing retro visual identity remains. The initial page shows JAR;VIS, one question box, a contact invitation and a collapsed whole-garden sitemap. The earlier town, ignition, café and table doors still exist inside that voluntary map, rather than occupying the first screen.

After a question is answered, a small **contextual instrument rack** suggests up to three real routes selected from a transparent local catalog. Relevant visits to the existing Seventh Table and Ignite doors carry the question in a URL fragment only when the person clicks; unrelated questions get a browsing route. This is client-side presentation, not automatic agent execution, automatic service routing, a partner match, or model reasoning.

Native share sheets (with clipboard/manual fallbacks) now share a question link or an edited invitation in one tap. The original evidence receipt and downloads stay under the optional technical shelf. **No server-side receipt ledger or account-free synchronized persistence is introduced:** a copied link is a voluntary handoff, not an exported receipt or an RSVP. Native share is not evidence of delivery. The private contact form remains separate and consent-based. The original pinned sources, reviewer gates, and human permission boundaries remain.

Validation: node --test includes magic-lego.test.mjs. Preview/release requires confirming mobile behavior, correct source statuses and browser sharing on actual devices. This change does not change the production alias by itself.
