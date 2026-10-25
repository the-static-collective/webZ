# TRIAD-008 — ALEX × 3rdi × LOADOUT / the bounded observer desk

**Status:** experimental owner-attributed **public document** integration for the existing source-first JAR;VIS preview; no native tool invocation or production promotion.

## One explicit switch
A visitor chooses **ALEX × 3rdi × LOADOUT — research lens (read-only)** before submitting a question. The existing default mode remains unchanged. The lens reads exactly three fixed commit-pinned public owner READMEs (one per project); the visitor cannot supply a repository, commit, URL, runtime, decoder, executable, arbitrary model or capability.

| Owner | What our adapter actually does | What it does NOT claim |
| --- | --- | --- |
| [ALEX.2](https://github.com/the-static-collective/ALEX.2) | Bounded UTF-8 owner-document read; retain exact commit, SHA-256 of **entire** document and the selected question-relevant original Markdown line | Scan/edition/text/translation pipeline, authoritative claims about local events, or native ALEX invocation |
| [3rdi](https://github.com/the-static-collective/3rdi) | Observer-local cut of this request: observedAt, inspected vs HOLD availability, attention locus and relevance; historical source occurrence remains UNKNOWN | Deterministic 3rdi compiler, exact past availability before this request, causal inference or global truth |
| [LOADOUT](https://github.com/the-static-collective/Loadout) | Fixed minimal read-only three-document plan and explicit effect fence: no posting, booking, payments, project execution or partner contact | Native LOADOUT effect compiler, provider authorization, permission from owner or effectful binding |

Read-only adapter: `src/triad.mjs` + `src/worker.mjs` + `src/inquiry.mjs`. This is **method-inspired, locally compiled metadata**, not a copy of the other repositories' Python runtimes. Cross-repository code is not fetched, evaluated or executed.

## Boundaries
- Per-request source selection: exactly three owner documents; full bytes are hashed without truncation and each read is subject to existing size/time limits.
- Entire locally produced triad cut enters the **unsigned JAR evidence receipt**, so a byte changed in the local output invalidates the receipt.
- Optional VIS/Nemotron step receives at most three 235-character **observed** public excerpts plus bounded provenance, observer and fence metadata. No private documents or additional source URLs.
- On source unavailability: mark that owner's formation, projection and selection HOLD; do not fabricate a witnessed fact.
- A question shared by URL remains an invitation to **ask**, not a computed research trace. A separately reviewed model proposal may be passed via RELAY-007; sender/recipient choice is required.
- This prototype produces no actual native ALEX, 3rdi or LOADOUT executor receipts, and no owner/adopter agreement is inferred. No trusted signatures or steward verification.
- No fees or upgrades to Vercel. The protected NVIDIA Build preview remains developer-only, not a public production model.

## Field application
For the food-access question, the triad helps ask:
1. **ALEX:** Which exact public source passage supports this idea? Do we have *local* observations from a willing steward, or only project methodology?
2. **3rdi:** What was observed by this visitor at this cut? What was already known and what was only inferred as relevant afterward?
3. **LOADOUT:** Can a willing person review a single draft or needs card, with **no** people contacted or supplies distributed automatically?

### Release gate
`node --test ask-jarvis/test/triad.test.mjs` checks exact pins, read-only selection, local line locus, observer time, effect fencing, no invented missing source claims, model payload scope and unsigned receipt tampering. Dedicated CI and Vercel build run the project suite. Deploy as a separate protected preview and verify real source documents, plus optional Nemotron responses, before merging.
