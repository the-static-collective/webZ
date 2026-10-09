# STATIC-WEB-002 — verification and admission boundary

Parent: draft webZ #7, `b0ef20554df647edded47e2a9c20d8f7807598d4`. No merge or deployment.

## Status

Implementation and the isolated proposal preview are verified. **Human public-field admission is pending.** The production `/field/` and its manifest retain the original eleven entries. The moving renderer, changes/history routes and proposed descendant are exercised in an isolated synthetic test site; its admission is not copied into the production field.

- 34 candidate fragments / 17 subjects; eight fragments selected by the review proposal.
- Currently admitted: 11 entries. Proposed: 13 entries (ten retained exactly, one updated, two added).
- Original field: `sha256:d3fa28fa3e1e2d2e370287422242fc8eab3c0362e27b61f54d0392430f8e21d1`.
- Proposed field: `sha256:52a93ca9cbf1c2efb1bad9a44634d9475f078994bcf3e2722c8647561e2a3990` — not admitted.
- Census: `sha256:71e00c48ac8e79dd54655d40b9ba90abb4d227e7d08fc8d5da735a528a1122b3`.
- Delta: `sha256:821cc5cdccc83d04bc090d6357f3ce653060e90dbb926c28e76612fa6fd76e8d`.
- Review: `sha256:b7ff79e825c8a40362855f3b15760daa180232e585a83a5bc7c129e2f7120bf1`.

There is no new admitted snapshot hash yet. Synthetic snapshot hashes in preview evidence describe test fixtures and must not be reported as public admission.

## Verification

112 Node tests pass: all inherited 72 plus 40 lifecycle/deep-link cases. Chromium inherits the nested-base/offline, crossing/storage and delayed-operation race witnesses, then exercises LISTEN, MAKE, BUILD, SEND, WANDER and PRINT under root and nested scopes at 320px. Preview evidence records zero passive external requests, zero CSP violations, zero candidate-cache entries and zero persistent wayfinding choices. Touch, keyboard/native details without JavaScript, reduced motion, enlarged text, offline search/provenance/history and exact founding-hash reconstruction pass. The inherited field witness still reconstructs the original eleven-card shell, rather than weakening its assertions.

The isolated fixture additionally runs cold artifact replay in a fresh Node process, refuses immutable snapshot overwrite and founding-history mutation, and rebuilds a poisoned cache configuration without incorporating a census input. External navigation is explicitly clicked and intercepted locally; no source-owner availability is claimed. These are scripted software witnesses, not independent human usability testing or a physical Android test.

Commands: `npm test`, `npm run field:verify`, `npm run field:replay`, `npm run test:browser`, `npm run replay -- evidence/browser/voyage.frozen.json`. CI run IDs and the exact committed head belong in the draft PR, avoiding a self-referential commit hash in this document.

## Exact candidate delta

| Subject | Classification |
| --- | --- |
| conversation-collider | NEW_CANDIDATE |
| crossing-evidence | NOT_REOBSERVED |
| fabrication | NOT_REOBSERVED |
| field-porch | NEW_CANDIDATE |
| field-quests | NEW_CANDIDATE |
| forage-glean | NEW_CANDIDATE |
| founder-namespace | NEW_CANDIDATE |
| gro-forage | NEW_CANDIDATE |
| groove-post | NEW_CANDIDATE |
| haunted-arcade | NOT_REOBSERVED |
| invitation-porch | NOT_REOBSERVED |
| kinship-bridge | NOT_REOBSERVED |
| optical-bench | NEW_CANDIDATE |
| postal-custody | NEW_CANDIDATE |
| publishing | NOT_REOBSERVED |
| radio-house | NOT_REOBSERVED |
| radio-world | UNCHANGED |
| relatte-mcp | NEW_CANDIDATE |
| relatte-vm | SOURCE_UPDATED |
| riff-raft | NEW_CANDIDATE |
| sanctuary-orchard | NOT_REOBSERVED |
| skymirror-lab | NEW_CANDIDATE |
| static-pressing | NOT_REOBSERVED |
| suno-atlas | NEW_CANDIDATE |
| transport-composition | NEW_CANDIDATE |
| wandering-lens | NEW_CANDIDATE |

NOT_REOBSERVED means missing census input. All nine prior representations are retained; no withdrawal, death or deletion is inferred. The latest VM source is a proposed observation update, not greater authority.

## Intentionally not admitted

26 fragments across 13 candidate subjects stay outside the proposed public entries. They may be source-inspectable in their own histories, but this PR grants no new public door:

| Subject | Observed repository / PRs |
| --- | --- |
| conversation-collider | the-static-collective/CANNON #12; the-static-collective/CANNON #13; the-static-collective/CANNON #14 |
| field-porch | the-static-collective/webZ #15 |
| field-quests | the-static-collective/GrO #22 |
| forage-glean | the-static-collective/static-os #80; the-static-collective/static-os #83; the-static-collective/static-os #85 |
| founder-namespace | the-static-collective/webZ #16 |
| gro-forage | the-static-collective/GrO #21 |
| groove-post | the-static-collective/groove-rooms #11; the-static-collective/groove-rooms #12 |
| optical-bench | the-static-collective/reLATTE #94; the-static-collective/reLATTE #95 |
| postal-custody | the-static-collective/GHoT #112; the-static-collective/GHoT #114; the-static-collective/GHoT #115; the-static-collective/GHoT #116; the-static-collective/GHoT #117; the-static-collective/GHoT #118 |
| relatte-mcp | the-static-collective/reLATTE #100; the-static-collective/reLATTE #98; the-static-collective/reLATTE #99 |
| riff-raft | the-static-collective/GHoT #113 |
| skymirror-lab | the-static-collective/webZ #9 |
| transport-composition | the-static-collective/reLATTE #93 |

## Read-only webZ branch history

These are source observations, not integrated routes. At this census the specifically requested six PRs were OPEN or MERGED; none was CLOSED/unmerged. Historical closure is not fabricated from an earlier description.

| PR | Head | Base | Observed status | Exact commit |
| --- | --- | --- | --- | --- |
| #10 | `experiment/wandering-lens-001-question-engine` | `main` | OPEN | `36a18117f31b7ade59148a3b82ac1fb9167b1d01` |
| #12 | `experiment/wandering-lens-002-visitor-annex` | `experiment/wandering-lens-001-question-engine` | OPEN | `785a075c8be867f6e8d9a6a115ff457151f53970` |
| #15 | `experiment/webz-gro-forage-001-field-porch` | `main` | MERGED | `237da36c0503c998ccc003b47fa26d1e9102c03d` |
| #16 | `experiment/founder-node-003-dual-custody` | `experiment/wandering-lens-002-visitor-annex` | OPEN | `45ca3f586cda98fc19ee84d6bf76a3eef0f0a1e3` |
| #20 | `experiment/suno-atlas-001-library-dials` | `main` | OPEN | `c56b2298d992fb06ab6ed80c61c4bda579e4d1e0` |
| #9 | `experiment/skymirror-webz-optical-lab-001` | `main` | OPEN | `a890a1ca30b2327262909a8eed58e0fc5db5fc87` |

Merge status is not deployment. Field Porch and neighboring forage/glean changes can be merged into their own main branches without becoming part of this exact #7-based checkout. No donor code was cherry-picked.

## Next human aperture

[Review the exact public wording](STATIC-WEB-002-PUBLIC-REVIEW.md). Once admitted, the first visitor can follow a declared intent to an owner-local HOLD. Watch which precise source, owner or next gate they expected there; that observation may reveal a missing explanation or a useful return path. Deployment is not preselected.
