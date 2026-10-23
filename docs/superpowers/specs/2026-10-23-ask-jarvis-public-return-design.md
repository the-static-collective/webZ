# Ask JAR;VIS — public return loop 002

The owner approved the public-return-first recommendation on 2026-10-23. Preserve the existing 1999 front page and grow the source-inspection engine into a useful, inspectable question → encounter → return loop. The local Workbench bridge follows later.

## Approaches

The approved approach builds public returns first, consulting source-owned documents through bounded adapters. An immediate authenticated connection to a local Workbench was considered and deferred because no operator endpoint or runtime credentials have been provisioned. Neither option turns source discovery into execution authority.

## Behavior

One question produces an in-memory structured encounter preserving the literal question, known context, unresolved gaps and candidate lanes. Deterministic rules are explicitly identified. Unknown intent yields a question card and a clarifying question. The visitor can explicitly select a question card, invitation draft, source door, or original song sketch. Draft invitations retain unknown time/place as blanks. Songs include original short lyrics, a deterministic original melody, and a browser-generated downloadable WAV played only on request. No external media/model service is needed.

Adapters read three relevant public documents from a fixed registry covering JAR;VIS, Workbench, TABLElogic, planZ, CANNON, GHoT and reLATTE. Full Git commit pins identify the observed revisions; main is a source address, never inferred canon. Whole-document SHA-256, fetch limits, timeout and unavailable states accompany observations. TABLElogic is a conceptual grammar; the local encounter applies its distinctions without claiming its runtime ran. CANNON and reLATTE source reads never become native validation or signed crossings.

Every return includes a complete unsigned evidence body, a reproducible digest, exportable text and JSON, and a prepared Workbench request describing a draft-only task with no execution authority. The browser independently verifies the returned evidence before showing artifacts. There is no public bridge dispatcher. Any edited invitation is separately labelled as an edited unsigned draft and saved independently of the original receipt.

## Constraints

- Node 22+; no new runtime dependencies; compatible with Vercel and Cloudflare Workers.
- No question storage, analytics, cookies, model calls, arbitrary URL fetching, external writes, project execution or automatic playback.
- Preserve the mascot, masthead, typography, palette and single question entry. Add controls inside the existing response surface and a compact optional return selector.
- Keep the v0 response fields for current consumers, adding versioned encounter/return/evidence contracts.
- Missing sources remain unavailable. Drafts can still be generated locally, but source doors must distinguish an unverified source address from an inspected document.
- Keep production routing untouched; prepare a reviewable branch and preview. A production release is a final explicit promotion.

## Builder decisions

Use small ES modules for registry/adapters, encounter/returns, evidence and WAV synthesis. Keep source text as data; render with textContent, never HTML. Preserve only fixed source endpoint URLs in external requests. Questions remain in request bodies and memory. A downloadable bridge request is a manual handoff, not authenticated dispatch.

## Verification

Test all four returns, ambiguous questions, explicit selection, partial/total source failure, byte-accurate receipts, evidence tampering, controls/contact/oversized input, stalled/oversized upstreams, injection strings, offline song playback/download and request handoff boundaries. Exercise real desktop and 320px Chromium, keyboard interaction, stale request cancellation and failure recovery. Run existing repository tests and record actual results.
