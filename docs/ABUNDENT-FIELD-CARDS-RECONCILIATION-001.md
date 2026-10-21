# FIELD-CARDS-RECONCILIATION-001 — Exact deployed Abundent ancestry

- Verified live Vercel deployment of `abundent.org`: `dpl_8pyC6dqZpWdbvGjDwDh5WirmzJsj`, project `webz-field-porch`.
- Deployment source: `the-static-collective/webZ`, branch `release/needs-001-abundent-live`, commit `65539f065db609c97e5c3ca1ca0b2d0f90c7498a`.
- Release build is immutable/commit-bound, `vercel.json` sets `git.deploymentEnabled=false`; changing a PR or branch does **not** mean deploying production.
- Existing route `/field/` already serves a 46KB source-pinned 11-world catalog. Do **not** replace it with the experimental card maker from webZ PR #66.
- New address: `/field/cards/`. This is an **additive sidecar**, not a modification of the existing field, home, composer, garden, NEEDS, music or listening room runtime.
- Expanded `scripts/build-release.mjs` immutable allowlist to include only the eight reviewable public cards files and vendored MIT QR library/license. The immutable manifest verifies every included byte.
- Nested `field/cards/sw.js` caches only its own local assets after HTTPS first visit; it does not claim root scope. Existing root `sw.js` and prebuilt public-field source maps stay unchanged.
- Scoped CSP allows QR generator data images only under `/field/cards/*`; whole-site CSP remains default-deny for external code, connections, frames and media.
- Original proposed /field/ app was tested on webZ PR #66 with Node and mobile Playwright and is here carried into the actual deployed ancestry.
- Adapted card copy is **not yet verified line-for-line against the original two PDFs**. Cards are clearly labeled independent prototype/adapted language and no affiliation, adoption, real-world delivery or verified contact is claimed.
- Public card links point at the current host. Preview URL/QR must not be handed out before actual production route validation and physical printer/phone scan test.
- No public write API, data collection, profile directory, co-op money, food custody, public returns or membership registration.

## Human gates

1. Evaluate CI: tests + generated-field reproducibility + immutable release build + nested/mobile browser checks.
2. Inspect a Vercel preview of this exact branch if available, including the card QR under deployed CSP.
3. Explicitly choose whether to promote a tested release after checking preservation of every pre-existing garden route.
4. On any production release, immediately verify `/field/`, `/composer/`, `/needs/`, `/week/`, `/music/rooms/`, `/field/cards/` and printed QR behavior. Revert to `dpl_8pyC6dqZpWdbvGjDwDh5WirmzJsj` if a regression is found.

**Merge != deployment. Scan != consent. A proposal is not adoption.**
