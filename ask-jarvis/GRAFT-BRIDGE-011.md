# GRAFT-BRIDGE-011 — An actual source-fed Commons, with a publication boundary

**A user arrives at Abundent with a question. Nobody uploads a context pack.** JAR's existing static 15-note Commons remains available without any external service; the new GRAFT bridge adds an independent, updateable stream of **source-pinned, reviewed public project summaries**.

## Current working slice

- **GRAFT owner-publication side:** `the-static-collective/GRAFT` branch `feature/commons-approved-feed-001` proposes a machine-readable `commons-feed.json` and its `docs/COMMONS-FEED-001.md` release protocol. Initial candidates cite the exact documentation commits for LIVE-SCOUT-002, LIVE-WORK-002, ATTEND-001, Free Graph and Black Star/MEMENTO reconstruction.
- **Site reader side:** `src/graft-feed.mjs` fetches ONLY the public GRAFT feed at `raw.githubusercontent.com/the-static-collective/GRAFT`. On protected Vercel **Preview**, it reads the candidate branch and clearly marks it `STAGED_FOR_REVIEW`. In **production**, it reads *only GRAFT main* and **filters out** anything not explicitly marked `PUBLIC_SUMMARY_APPROVED`. No private GitHub token is sent, and no arbitrary user-supplied URL is fetched.
- The reader rejects oversized responses, unrecognized source paths, unexpected state labels, private contact formats, and secret-like strings. It reconstructs exact-commit source links rather than accepting arbitrary links from the feed. It selects at most **three** relevant summaries per question and caches for three minutes. A failure yields explicit `HOLD`, not a fallback claim.
- `/api/ask` now includes GRAFT's selected source notes and SHA256 of the fetched GRAFT feed in the original *unsigned* question return. The local `verifyReturn` checks that these selected observations match the returned receipt. The source hash is a content receipt, NOT a trusted signature.
- The site asks for **no upload or account**. Visitors see separate GRAFT source cards alongside the earlier static Commons and may open the exact-commit source document.
- The library `/commons.html#graft` has an independent read-only source panel using `GET /api/graft-feed?q=...`, which can update independently from webZ builds. Browsing the Commons requires no model call or external model quota.
- In protected Preview only, one deliberate Council click sends a **bounded 6+up-to-3 selection** of site-published static Commons notes and GRAFT notes to Groq scout and Gemini critic, unless the user deliberately imported a different local file. The browser compares the source pack hash; if the mutable GRAFT feed changes between Ask and Council, verification refuses to accept mismatched content. A GRAFT staged note remains labeled **review pending** inside the model prompt.
- The Cloudflare canonical worker and public Abundent release paths are not redeployed or granted model credentials by this PR.

## New work → shared knowledge (without silent publication)

1. **Observe:** GRAFT's existing LIVE-SCOUT can inspect current allowlisted public GitHub source heads and assemble local reports with digests. This is deliberately a one-time observation, not continuous truth or CANNON canon.
2. **Stage:** a willing editor records a *specific, bounded, public-safe summary* and exact Git commit in GRAFT's candidate feed on its own publication branch. New work is **not automatically published** just because a branch is pushed or a test passes.
3. **Review:** source owner verifies privacy, licenses, facts, effects, data minimization and independent approval. A real project partnership or field outcome needs its own external human receipt.
4. **Release:** with human-reviewed adoption, GRAFT main's entry is marked `PUBLIC_SUMMARY_APPROVED`. **Only then** will the public JAR endpoint read it, without a new per-visitor upload or a new JAR code deployment (within the short cache lifetime).
5. **Revise/withdraw:** a later GRAFT main change or removal becomes visible after cache expiry. An older SHA receipt still identifies the past source cut; it does not grant its contents permanence as current.
6. **Question:** JAR selects the relevant *source summaries*, not arbitrary unseen private documents. Future optional GRAFT graph queries can add more topics but require separate scaling/verification work.

## Tested and not tested

- Unit tests cover staging vs release, source and secret validation, 3-item selection, full return receipt integrity, opt-in Groq/Gemini council with automatically included GRAFT context, and explicit no-upload browser support.
- Preview live GET confirms a GRAFT source feed can be read and pinned. It does NOT prove a human has approved a production release, a local print kit has been delivered, or that an AI model successfully reasoned from the new joined context on a real provider invocation.
- The GitHub LIVE-WORK printed file artifact is genuine *local CI output from a fictional scenario*, NOT a community food delivery.
- GRAFT import branches are public, not private; do not automatically transplant raw donor files, records or contact details.

## Next extensions

- Staged candidate suggestions from fresh GRAFT scout reports, under an independent human publication check.
- Public-safe owner-approved source digests from connected Drive; never mirror private Drive into a public repo.
- A more comprehensive Free Graph/reLATTE relation index with revocations, source-level licensing/consent and bounded search costs.
- Production release review and abuse/rate safeguards before making interactive external model inference broadly available.

**No new sources are declared canon, no volunteer is enrolled, no person contacted, no funds moved, no real-world work executed.**
