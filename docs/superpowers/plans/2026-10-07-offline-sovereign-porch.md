# Offline Sovereign Porch Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation and one fresh-context branch review.

**Goal:** Executable Sanctuary → Orchard → Sanctuary, explicit mobile porch, and read-only sanitized MAXHINAL evidence without extending authority.
**Architecture:** Separate first-party static documents; shared bounded local observation model; verify-only WebCrypto adapter; fixed offline asset cache. No backend, delivery, credentials, signing or LIVE grant.
**Tech Stack:** Browser ESM, CSS, WebCrypto, service worker; Node built-in tests; Python Playwright browser tests.
**Spec:** webZ PR #2 at b487aab92a8a2a572001cd91424a81b3a14abce9 and its GENESIS spec; Human-Witness PR #5 at 4f0143f; reLATTE PR #62 at ae3fd0f; PORCH issue #1.

## Global Constraints

Do not edit approved specifications or neighboring repositories. Separate webZ feature branch and stacked review PR. Default carry none. No secrets, remote calls, public relay, new infrastructure or third-party art. Browser observation != sovereign receipt. Source and destination custody checks remain separate; uploads never grant LIVE. Rack remains locked. Missing exact MX13 specimen cannot be replaced by porch text. Local human rehearsal choices are unsigned and independently scoped per world, not authenticated reLATTE owner decisions.

## Review Focus

Check malformed/extra JSON fields, secret-bearing reports, counterfeit booleans, fingerprint substitution, ambiguous custody, duplicate/conflicting receipts, ancestry gaps, URL/base traversal, denied/corrupt storage, navigation without consent, cached imported evidence, stale async verification, proposal consent and independent local decisions. Check offline and nested-base navigation, service-worker scope, fresh-context replay and scope labels. No invented proof.

## Task 1: Bounded local model

Produces: validated world manifests; append-only voyage/local decision records; deterministic export/import projection. Consumed by Task 3. Files: app/model.mjs, tests/model.test.mjs, scripts/replay.mjs.

- [ ] Write tests for explicit journey, safe destinations, manifests, sequence/tamper handling, consent/UTF-8 limits, separate world choices and deterministic cold replay.
- [ ] Run `node --test tests/model.test.mjs`; expected RED because model is missing.
- [ ] Implement strict local model with no protected carry or automatic authority.
- [ ] Run tests; expected GREEN. Commit.

## Task 2: Read-only proof verification

Produces: bounded sanitized report parser and independent signature/custody observations. Consumed by Task 3. Files: app/proof.mjs, tests/proof.test.mjs, evidence/public-simulation.json, evidence/provenance.json.

- [ ] Write tests against real public signed simulation for signatures, missing/counterfeit custody, tampering, source changes, key substitution, injected LIVE and secret fields.
- [ ] Run `node --test tests/proof.test.mjs`; expected RED because verifier is missing.
- [ ] Implement verify-only reLATTE v0 canonical ID/signature rules pinned to donor. Report unavailable evidence explicitly; do not authorize or unlock.
- [ ] Run full `npm test`; expected GREEN. Commit.

## Task 3: Static portal and browser witness

Consumes Task 1 model and Task 2 verifier. Produces separate world pages, offline cache, mobile porch, read-only proof page and real browser evidence. Files: index.html, worlds/*/index.html, porch/index.html, proof/index.html, app/ui.mjs, app/style.css, sw.js, scripts/serve.mjs, tests/browser.py.

- [ ] Write browser tests for inspect/remain/cross/return, no default carry, explicit local owner choices, proof lock, offline and nested base, cold import, mobile overflow and unsafe/corrupt inputs.
- [ ] Run browser tests; expected RED because documents are missing.
- [ ] Implement mobile documents and deterministic observation UI; fixed static cache only, imported reports memory-only.
- [ ] Run unit and browser suites; expected GREEN. Capture desktop/mobile screenshots and cold exports. Commit.

## Task 4: Reviewable delivery

- [ ] Add executable instructions, authority/verification report, blockers and CI. Preserve original specifications byte-for-byte.
- [ ] Verify full suite and fresh-process replay; inspect tracked files for secrets and fixture provenance.
- [ ] Obtain fresh-context whole-branch review; fix significant findings with regression RED→GREEN.
- [ ] Push feature branch and open stacked review PR against design/webz-maxhinal-porch-001. No merge or deployment.
