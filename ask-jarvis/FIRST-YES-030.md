# FIRST-YES-030 · A public doorway without surrendering a private Campfire

**Live isolated public deployment (October 26, 2026):** https://abundent-first-yes-030.vercel.app/first-yes/

**Source:** [webZ PR #136](https://github.com/the-static-collective/webZ/pull/136), draft stacked on JAR-BRAIN-029. Existing `abundent.org` production alias, Cloudflare DNS, and `garden.abundent.org` were **not changed**.

## What a person can do immediately

1. Open the page without an account.
2. Enter **one community-level, non-identifying question**, optionally choose one Workboard topic and one thing they could prepare (listen, research, print, gather, build, create).
3. Click **Prepare one useful work card**. It creates a proposal in the visitor's browser with an immediate task, 90-minute next action, 24-hour invitation, consent gate, evidence criterion, and unfilled return questions.
4. Copy, save as Markdown, or print. **No submission occurs.** Decline and unresolved are valid endings.

The same public app is linked from the staging Ask JAR;VIS home and Workboard. This is one independently reachable, reviewable Vercel project, not an unreviewed change to the live apex.

## Public knowledge comes from an approved source, not invented peers

The local composer imports the existing `board/memory.mjs` six-topic model. By default, it says **EDITORIAL_ONLY_PUBLIC_HISTORY_NOT_REQUESTED**, without making any network request for the typed question.

Only if a visitor deliberately clicks **Read human-reviewed public updates** will the browser issue a bounded **GET** to:

`https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/workboard-history?thread=<public-topic>`

The request transmits **only a fixed public topic label, never the typed question, name or private details**. It demands the source's `reviewedOnly:true` contract and filters out unreviewed contributions through `summarizeHistory`.

A legitimate reviewed public comment may supply an id, kind and publication date as **reviewed-public-not-independently-verified evidence**. Even then we do **not** reprint the comment's body or assert its claim as fact. Withdrawn/pending records cannot anchor proposals. Empty reviewed history is not equivalent to an unavailable feed; an unavailable feed is explicitly editorial fallback.

## Independent from the private owner backend

The privately owned [NanaSpork SQLite Firebox](https://github.com/the-static-collective/BananaSpork/pull/20) and [JAR;VIS local owner bridge](https://github.com/the-static-collective/JAR-VIS/pull/10) already have an operator-only `campfire.operator-attention/v0` interface. That is a **different authority boundary**.

This public page intentionally **does not** proxy `/v1/admin/attention`, accept an operator key, connect to localhost private circles, invoke a model with survivor narratives, give a user an owner credential, or auto-post to GRAFT / Free Graph / LemonPRESS. Its `abundent/public-first-yes/v0` output is a *locally prepared voluntary question*, not `jarvis.campfire-first-yes/v0` owner observation and never a Jubilee fulfillment receipt.

The private crossing remains available only from its **own host** with an authorized operator key.

## Personal-case and privacy boundary

This is not a sensitive-information intake. The frontend advises against entering names, contact details, survivor stories, custody details, passwords or addresses. The composer rejects email, phone, URL, typical street address or bearer-secret strings before preparing portable outputs. Clear first-person abuse/custody/police cases trigger `PRIVATE_PATH_HOLD`, withholding the question and pointing to the separate Still Here self-directed tools. No text is appended to the link or URL.

These controls are best-effort, not a guarantee that any user text is anonymous. **No important survivor details should be entered here.** Work card text remains local until a visitor consciously copies or saves it; accessing public hosting inevitably involves ordinary HTTP logs, but the question does not transit in the page's public API calls.

## Tests and release evidence

- `cd ask-jarvis && npm test`: includes `test/first-yes-public.test.mjs`, testing reviewed/empty/unavailable/withdrawn sources, private-case HOLD, refusal of contacts/keys, unrelated-question hold, fixed Workboard routing and isolation from Firebox private endpoints.
- [Source-first contract CI](https://github.com/the-static-collective/webZ/actions/runs/40310644143) — passed.
- [Edge/Modal offline canary CI](https://github.com/the-static-collective/webZ/actions/runs/40310644081) — passed.
- [Offline portal/browser verification CI](https://github.com/the-static-collective/webZ/actions/runs/40310644125) — passed.
- Isolated Vercel public production project `abundent-first-yes-030` deployment `dpl_6wB5Rbq4hxGwXkr2fcRFSzoBbB8F` — **READY** at the URL above. External read confirmed the `/first-yes/` page and its links from `/` and `/board/` are reachable **without login**. Its live input interaction has not been separately exercised on a physical Android phone.
- Earlier staging deployment on `ask-jarvis-workboard-024-review` is **SSO-protected**; do not present that inaccessible review URL as the public doorway.

## The next gate

A real person could take one local action card and decide whether to invite a willing neighbor. A true steward/partner may correct or decline its assumptions. Any public learning or institutional claim must be separately reviewed and attributed; the website is not allowed to manufacture a success story.

Connecting the owned Firebox's operator-only Attention Desk to a publicly reachable service requires a **separate scoped, revocable authorization protocol with an attenuated read, no administrator-token exposure, a threat model and independent host**. Do not enable that merely because this client-side page works.

**Integrity > Continuity. A proposal isn't consent, and a published post isn't proof.**
