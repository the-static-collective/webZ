# FIRST-INCH-003 — Source-owned public pointers + original native calculation witnesses

**Status: Draft stacked on FIRST-INCH-002 (#202), not deployed, not merged, not claimed as a real-world matchmaking service.** This slice improves the deterministic mechanism in two deliberately separate directions.

## 1. Public source pointers: a bounded, real data crossing

The visitor still sees one question and, only after generating a local draft and **explicitly requesting it**, can choose **Find relevant work already documented**.

Source: `the-static-collective/JAR-VIS/commons/recent-work-v1.json`, release `RECENT-2026-10-28-008`, authored/reviewed Oct 28, 2026. Exact Git **blob SHA** `4faa7039c0ce74afa7fc623020619a124b859f4c`. Its bytes are preserved at `start/jarvis-recent-work.upstream.json` and the independently testable projection resides in `start/public-doors-v1.json`. Source identity is checked by rehashing its exact Git blob bytes and comparing every projected entry, including source URLs and status. There are 19 public editorial entries in this frozen release.

The local browser fetches the bundled projection **from the same origin** after the visitor presses the button; it never transmits the person's goal or resource text to GitHub, JAR;VIS, any LLM or analytics provider. `start/source-match.mjs` performs deterministic, finite lexical token matching and reports exact matching words and original source-owner links. It does not infer semantically related people, locate current stock, verify a provider, claim a service is open, grant permission, or turn a prototype into an available offering. A zero-match result remains empty. Catalog versions only change by an explicit, reviewed source update.

A reader can inspect a source link by a **second deliberate click**. This navigates to public GitHub, outside the local goal-processing flow; it does not send the goal as a query.

### Test specimen

For `We want a grocery pickup table for Waseca neighbors`, lexical matching should retrieve the public Garden and shelf-research pointers with `RESEARCH_PROPOSAL` labels. It **must not** claim a grocery has opened, a venue consents, a partner has joined, or food is available.

For `Plan a live music festival with church bands`, the public Jubilee notes should be among matches. For arbitrary nonsense, the system returns no matches.

## 2. Actual original algorithms, not transplanted authority

### Dogram native

`tools/first-inch-native-dogram.mjs` from FIRST-INCH-002 can now run in an isolated CI job against the **original, unmodified** Dogram checkout at commit `551b5f9df18f17ec69b452ddcdff01718e0ff771`. It exports the canonical `ablate@1` planning-graph specimen and calls Dogram's original Python CLI. The wrapper refuses a mismatched commit or uncommitted source modifications and compares Dogram reachability results against an independent browser-side graph computation. **Dogram confirms a graph calculation, not physical readiness or participant permission.**

### Haunted Toaster native

`tools/first-inch-native-toaster.mjs` executes the **actual original** `candidate-move-deck/v1` operator from Haunted Toaster's unmodified checkout at commit `3652c2a96b6b287cda316d1c92daadf7c7417eaf`. A synthetic planning six-up is adapted into the original Toaster candidate-envelope shape, explicitly labeled fictional and using original role identifiers as *synthetic score-addressed candidates*. The original source deals `expand, mutate, converge, stomp, cross, cross` proposals, with original content-addressing and replay. The wrapper checks deterministic identical deals, altered addresses for a second deal, and exactly six addressed proposals.

**The original engine's actions retain their media meaning**. We do not mutate a real food distribution plan by calling Toaster's `mutate`, treat a media `cross` as a lawful resource exchange, or claim Toaster approved the planning candidates. We use the genuinely executed source engine as a separate conformance instrument demonstrating deterministic branching on a declared synthetic carrier.

### CI

`.github/workflows/first-inch-native.yml` checks out three repositories at exact source commits and runs both original operators, with JSON machine witnesses uploaded as CI artifacts. It runs independently from normal webZ browser verification. It makes no network requests to real institutions, sends no outreach and handles no real person records.

**Local reproduction (separate clean checkouts):**

```sh
npm test
node tools/first-inch-native-dogram.mjs --dogram ../Dogram
node tools/first-inch-native-toaster.mjs --toaster ../the-haunted-toaster
python tests/first-inch_browser.py
```

All checkouts must match the pinned commits; ordinary latest/main is deliberately insufficient.

## Next gate

A JAR;VIS **opt-in candidate handoff** should be built only after a receiver-owned schema, explicit local export and proper refusal handling. Public editorial pointers must remain pointers. A verified real-world resource requires a separately attributable offer from a real owner, a time/scope and revocable permission, plus independent review where appropriate. Real-world operations remain unavailable here.

### Non-collapse laws

- Public source citation **≠** verified resource availability.
- Source code executed **≠** partner or beneficiary consent.
- Graph path **≠** all prerequisites satisfied.
- Six addressed Toaster moves **≠** six valid execution plans.
- Local draft KEEP **≠** external human agreement.
- GitHub CI green **≠** deployed public product or completed field trial.
