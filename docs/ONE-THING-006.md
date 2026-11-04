# ONE THING 006 — real-world gleaning quest

**Date:** 2026-11-04. **Owner:** webZ / Abundent public visitor entrance.  
**Status:** Account-free, client-side, deterministic feature candidate. GitHub CI and production deployment status must be checked separately. **Not a live matching service.**

## First playable vertical slice

1. A visitor chooses a broad kind: **material**, **food/garden**, **skill**, **time/space**, or **one need**.
2. They name one non-sensitive thing and choose whether it could happen today, soon, or later.
3. The browser's `quest-core.mjs` builds three category-specific, immediately executable steps, beginning with checking what physically exists.
4. They mark attempted steps. Counts are always labeled **self-reported**. The browser never awards verified outcomes.
5. They record **worked / not yet / different** and can copy or download an honest report.
6. Device storage is optional. Nothing persists until they explicitly choose **Keep on this device**; after that, later changes to that quest are saved locally. **Start a different thing** erases that saved quest.
7. If they choose to circulate, the app generates a local public-safe `abundent.any-invitation/v1` using the existing `invites/engine.mjs`. The link contains user words in its **fragment**. Review before sharing.
8. If they independently opt into making it a public conversation, the app opens the existing `/invites/network/#i=…` interface. That separate receiver still requires explicit public consent. There is **no direct write** from the quest.

This is a completed code path for **discover → act → self-report → optional invitation → separate public consent**, not yet proof of anyone's real-world exchange.

## Why this is not the old recursive dead end

The first two steps must be something the visitor can **do**, not instructions to invite or register someone. Making an invitation is step three and optional. Having no one to invite does not make the quest fail.

Suggested first demonstrations:
- Spare screwdriver set → find and inspect → choose useful safe use → optional invitation.
- Extra squash → verify storage and food safety → use safely now → optional general food offer.
- Fifteen-minute skill → make a tiny, practical result → share only if wanted.
- Missing bike tool → isolate the missing step → try one action independently → ask for bounded help if needed.

A promise, draft, unverified self-report, and independently acknowledged outcome remain four different states. None is silently promoted.

## Boundaries

- **No account**, model API, telemetry, third-party tracker, external network call, notification, or automatic contact from the quest.
- Broad public descriptions only; obvious contact details, addresses, links and phone numbers are refused, but client-side validation **cannot guarantee** that all sensitive content is detected.
- No food suitability certification, owner identity verification, real-world safety guarantee, property-right claim, actual offer/need match, public upload, or independent fulfillment confirmation.
- If people need to exchange exact pickup information, arrange it privately and safely outside public posts.
- Public invitations share the text in the URL fragment; anyone with the URL can see the text. They cannot authenticate authorship or consent for third parties.
- Avoid publicly listing children's names, addresses, case histories, unsafe materials or other sensitive details.
- Existing `/invites/network/` holds its own public publication / review and separate matching permissions. No implicit new Supabase grants or migrations.

## Test gates

- `node --test tests/one-thing.test.mjs` — privacy bounds, category-specific useful actions, honest reports, link claims, and integration cues.
- `python tests/one_thing_browser.py` — Playwright Chromium, 390×844, nested base path, no external requests, local-only state, actual first step, report, opt-in save/reload, real invitation-link handoff.
- `npm test && npm run test:browser` — the whole repository checks. Green CI is evidence that tests passed, not a substitute for one uncoached real-person phone trial.
- Verify `https://abundent.org/one-thing/` **after** merging/deployment and before moving the associated Metricool draft to automatic publishing.

## Real-world field gate

A real first-time user completes one step without a developer explaining the product; a separate person acknowledges any claimed external outcome. Track known real cases, failures and refusals. **No fake users, fictitious materials, invented match rates or forced viral invites.**

## Comms

**The internet doesn't need another follower. It needs a neighbor.**  
Pick one real thing you have or need; try one useful action now. No account and no automatic posting.

The invitation should point to **/one-thing/** once that route is live, not to a speculative endpoint. Existing Porch and First Circle continue as distinct choices.
