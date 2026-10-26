# WORKBOARD-024 · Conversation → opportunity → useful work → learning

> Every conversation is a possible doorway. Every doorway can uncover an opportunity. Every opportunity can become useful work. Every completed effort can enrich what the next visitor knows.

This is the **front-facing interaction model** for JAR;VIS / Abundent. It borrows the recognizable format of a message board and the classic BBS idea of a *door*: a discussion can open a specialized capability, then return with actual learning. The software does not grant anyone authority merely for clicking or speaking.

## Implemented, reviewable first slice

`/board/` contains six editorial starter threads (grocery, a **secondhand/unverified** milk-supply lead, Coalition-adjacent care networking, artist-led gathering, park stewardship and an optional church/community conversation) and a public-safe locally created question. Each offers:

- a precise question;
- what is known **and how uncertain it is**;
- what remains missing;
- a small reversible first move and the human permission gate;
- five equally respectable response moves: investigate, dissent/correct, bounded offer, propose an experiment, or self-report a return;
- a contextual role suggestion, entry to the Campfire, and the Seventh Table door;
- account-free browsing and explicit copy/share/print invitation; optional private contact desk handoff;
- no silent network calls, user tracking, auto-enrollment, public posts, organizer attribution, success count, or purported evidence of completed work.

The current shared Garden Signal pilot is linked **only** from the grocery/milk cards, with its own separate explicit submission and moderation flow. An Abundent visitor draft never silently posts there.

An opportunity link contains either a **fixed public topic ID** or one screened short question in a URL fragment, never people, names, emails, a roster, or a status claim. Locally drafted contributions do *not* ride in the URL. Downloaded personal receipts state `LOCAL_DRAFT_NOT_SUBMITTED` and `verified: false`.

## Next production slice — do not mislabel the first one as finished

A real community *message board* must keep conversations visible across devices. This is **not implemented** in BOARD-024. Proposed production work:

1. Reviewable, rate-limited, privacy-minimizing shared thread and contribution persistence. Separate `private pending`, `reviewed public`, `withdrawn`, `rejected`, and `archived` states. Default to private review. No public contact information or unapproved quotations.
2. Only human-approved, redacted publication; transparent moderation and correction/appeal path. Each material claim has an observation/source label. Opposition and refusals have a first-class field.
3. Durable event ledger with typed transitions: `QUESTION → INVESTIGATING → PROPOSED → PERMISSIONED_TRIAL → SELF_REPORTED_RETURN → REVIEWED_LEARNING`; a `PAUSED / DECLINED / WITHDRAWN` branch remains lawful. **Approval of a post is not verification of its claims**, and a proposal is not admission.
4. GRAFT and Commons may suggest sourced background; FreeGraph may suggest overlaps; JAR;VIS may compose next steps; reLATTE may carry portable receipts. All are *suggestions or bounded evidence*, never independent permission to act or publish.
5. Seven-day windows as *invitations*, not required deadlines or continuity demands. Invite up to two people or an optional ambassador, chosen by each sender. No invitation is automatically sent.
6. Human-readable, mobile-first moderation; real deletion/withdrawal policy, safeguarding, spam protection and access logs retention limits. Test a complete submission → review → public thread → correction/withdrawal loop before encouraging public posting.
7. When partners want an independent cross-post or print bulletin via LemonPRESS, **separately approve exact content and provenance**; no automatic attribution to co-op, church, Coalition, or venue.

## Acceptance criteria before calling it community-ready

- Anonymous visitors can read public content without login; no account required to draft or invite.
- Submitted private content does not leak through HTML, search, graph, cached response, analytics, or app links.
- A real moderator can reject, redact, publish, correct and withdraw without developer access.
- Every entry accurately distinguishes reported, observed, independently verified, and proposed.
- An adverse comment, dissent, refusal and local pause are representable without punitive scoring.
- Mobile copy/share/print is actually tested; screen-reader and keyboard flows pass.
- A prospective participant can get one useful draft in minutes while remaining free not to contact anyone.
- The site never states a community action, partner commitment or verified outcome based on a click, local receipt, AI answer or submission count.

## Source and release boundaries

Canonical source is `the-static-collective/webZ`, stacked over `feature/jarvis-campfire-right-to-try-022`. Parent Campfire is itself draft, stacked on the shared JAR branch chain; the board cannot be released in isolation without reconciling these dependencies. Creating a PR or passing unit tests does **not** publish `/board/` to abundent.org.

Keep the existing official co-op communications under their own control; this remains an independent Static Collective / Abundent experiment until genuine partners approve a specific collaboration.
