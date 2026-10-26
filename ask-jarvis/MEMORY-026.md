# MEMORY-026 · The community's return path

## What changed

The Workboard's existing persistent, human-reviewed conversation history now has an **actionable memory layer**. It reads *only* entries already returned by the reviewed-history API (no raw pending data, no direct database access).

The six familiar topics appear as contextual action cards:

1. What is actually in the reviewed public conversation (quoted as a post, not independently verified)?
2. What concern/question/proposal/offer/return might be worth clarifying next?
3. What's the smallest reversible, permissioned first move?
4. Which source post, if any, anchors that suggestion?
5. How can someone carry the thought onward by copying or printing an invitation or saving a portable candidate JSON?

Each output has `communityCommitment:NONE`, `workCompleted:NOT_ESTABLISHED`, `publication:NOT_SUBMITTED`, and `evidenceStatus:PROPOSAL_NOT_ADMISSION`. If there are **zero** reviewed posts, the only suggestions are labeled `EDITORIAL_STARTER_NOT_COMMUNITY_EVIDENCE`.

A reviewed concern leads to a test of the objection, not dismissal. An offer isn't a promise. A self-reported return is not independent outcome verification. A withdrawal carries no text to actionable memory. All suggestions remain human-gated.

## Implementation

- `public/board/memory.mjs`: deterministic, reproducible, no network or model access. Creates contextual summaries, source-bound candidate receipts, printable invitations. Deduplicates entries and ignores malformed, unreviewed and withdrawn content.
- `public/board/memory-ui.mjs`: mobile-friendly action cards, read thread, copy, print, save; no account, telemetry, hidden submission or AI cost.
- `public/board/history.mjs`: emits the reviewed-only, loaded-page data and a visible load failure event. Never broadens DB access.
- `public/board/index.html`: renders a clearly labeled “What could we do next?” section.
- `scripts/build-workboard-edge-preview.mjs`: makes the public edge preview reproducibly from the canonical source.
- `test/workboard-memory.test.mjs`: checks that pending/withdrawn/invalid content cannot become cited community memory, no fake participants or finished actions, and portable receipts are accurately labeled.

## Honest limitations

- This is **suggested action**, not an autonomous execution engine. JAR;VIS/GRAFT/FreeGraph do not silently consume a candidate receipt. It can be exported *by a person* as a future human-reviewed input.
- The UI summarizes the **currently loaded page(s)** of reviewed public history, defaulting to the latest 25. Without opening older pages, it cannot assert that a question has never been addressed. The coverage indicator says so.
- Reviewed public posts have no claim-verification or task-authority state. Publication alone is not evidence of truth.
- A suggested matching offer and need cannot enroll anyone or contact a contributor; no personal directory is invented.
- The seven-day experiment remains voluntary; the generated invitation is a proposal, not a deadline.
- This branch is stacked over PR #126, which in turn depends on the Campfire PR chain. Do not merge it alone or represent it as the already-live Abundent production route.

## Next honest crossing

After public-post consent and moderation are fully exercised by a real participant, the next layer is a **reviewed transition ledger**: source-linked state changes `QUESTION→INVESTIGATED→PERMISSIONED_TRIAL→SELF_REPORTED_RETURN→HUMAN_REVIEWED_LEARNING`, including cancellation and dissent. Separate **claim review** from **permission to act** and from **organizer acceptance**. Then feed only that *reviewed* learning, with original source IDs and explicit limits, into GRAFT or a shareable LemonPRESS report. Never elevate suggestions into accepted tasks by counting clicks.

**Invariant:** The system makes it easier to continue work together, without ever taking away the person's right to say no.
