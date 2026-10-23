# Ask JAR;VIS public return implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a usable public question-to-artifact loop behind the existing retro page.

**Architecture:** Fixed read-only document adapters feed a deterministic encounter and local artifact composer. Complete unsigned evidence binds the encounter, source observations, artifact and prepared Workbench handoff. Browser verification precedes rendering and optional audio.

**Tech Stack:** Node 22+, ES modules, Web APIs, Python Playwright for browser checks.

**Spec:** `docs/superpowers/specs/2026-10-23-ask-jarvis-public-return-design.md`

## Global constraints

- No new runtime dependencies. No question storage or project execution.
- Fixed source URLs and full commit pins only. Whole-document hashes.
- Preserve v0 response fields and 1999 visual identity.
- Production routing stays untouched until explicit promotion.

## Review focus

- Unknown or multilingual intent must preserve uncertainty.
- Failed or over-limit upstreams must never look inspected.
- Edited drafts must never inherit the original receipt.
- Stale requests and audio objects must not outlive a new question.
- Full receipt verification must bind all visible artifact content and source links.

### Task 1: Encounter, adapters and public API

**Files:** `ask-jarvis/src/{registry,encounter,worker}.mjs`, `ask-jarvis/public/evidence.mjs`, `ask-jarvis/api/ask.js`, `ask-jarvis/test/{worker,return}.test.mjs`.

**Interfaces:** `assemble(question, fetcher, {kind})` retains v0 fields and adds `encounter`, `return`, `workbenchRequest`, `evidence`; `verifyReturn(data)` recomputes the exact evidence and compares visible return fields. Registry entries expose fixed commit-pinned source addresses.

- [ ] Add failing tests for four return kinds, ambiguity, failures, byte hashes, evidence tampering, pinned URLs and input limits.
- [ ] Implement deterministic encounters, bounded document adapters, structured drafts, complete evidence and draft-only handoff.
- [ ] Run `node --test ask-jarvis/test/*.test.mjs`; expect zero failures; commit.

### Task 2: Retro response interface and playable songs

**Files:** `ask-jarvis/public/{index.html,style.css,app.mjs,song.mjs}`, `ask-jarvis/test/{song.test.mjs,browser.py}`, `ask-jarvis/scripts/serve.mjs`.

**Interfaces:** UI consumes Task 1's verified contracts. `songWav(song)` produces a bounded PCM WAV ArrayBuffer from a validated melody. Local development server serves the same Worker API without Wrangler.

- [ ] Add failing song and browser checks for all outputs, explicit return choices, edited drafts, audio/download, mobile layout, stale requests and error recovery.
- [ ] Implement the return selector and response panel, source status rendering, exports, explicit audio and cancellation.
- [ ] Run all Node tests and `python ask-jarvis/test/browser.py`; expect zero failures; inspect desktop/mobile screenshots; commit.

### Task 3: Reviewable release

**Files:** `ask-jarvis/{README.md,RELEASE-002.md,package.json}`, `.github/workflows/ask-jarvis.yml`, hosted smoke check.

**Interfaces:** Existing Vercel and Cloudflare adapters use the same assembly path. Release notes identify actual verified behavior and remaining local Workbench bridge.

- [ ] Run repository tests and package syntax checks; record actual counts.
- [ ] Review the full branch with a fresh reviewer; resolve material findings and verify fixes.
- [ ] Commit documentation, push the isolated feature branch and open a draft PR against the existing Ask JAR;VIS branch.
- [ ] Prepare and smoke-test a separate preview if hosting access is available; record its actual URL. Do not promote production.
