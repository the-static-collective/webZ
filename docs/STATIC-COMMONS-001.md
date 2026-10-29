# STATIC COMMONS-001 — The First True Yes

**Prepared 2026-10-28.** This is an executable, locally generated, printable **human field kit** inside the existing webZ/Bridge static Switchboard build. It **does not** create an organization, authenticate a steward, contact a partner, sign a reLATTE receipt or prove any real-world outcome.

## The composition

A community that has not yet formed can take shape around one independently governed useful act. Unlike a generic task tracker, this kit never promotes the asker's own claims into another party's permission. It keeps six different responsibilities visible:

| Hand / card | Local role | Status when generated | Proof required before promotion |
|---|---|---|---|
| 1. ASK | Proposer | DRAFT_UNSENT | Actual sent invitation recorded privately |
| 2. ANSWER | Receiving steward | NOT_RECEIVED | Their reply, including HOLD, DECLINE or discussion-only |
| 3. SCOPE | Host and task actors | NOT_AUTHORIZED | Explicit, safe agreement and right to withdraw |
| 4. ACT | Authorized actor | NOT_PERFORMED | Factual report and costs, including failure |
| 5. CONFIRM | Independent recipient or qualified reviewer | NOT_CONFIRMED | Independent review of original evidence, including disputes |
| 6. RETURN | Source and adopting community | WITHHELD | Permission to share redacted method, plus new local adoption |

The browser **only authors Card 1 and prints blank slots for Cards 2–6**. These are physical/private coordination forms, not digitally authenticated attestations. A typed mark on a printout does not alone establish identity or permission. Independent confirmation must happen outside the page.

## Use for a real Waseca first question

The default question is whether one receiving-side step in suitable food donations or permitted pickups would be worth improving. It intentionally belongs to **no enrolled institution**. The existing [BRIDGE-006 source review](BRIDGE-006.md) has a public WANSC food shelf contact and an unsent, human-reviewable opening message. The existing encrypted [Outbox](OUTBOX-001.md) preserves private drafts.

1. Open **/bridge/seed/** on the Switchboard's static host. Edit only public-safe organization-level questions; prepare and inspect the six forms.
2. Save or print the kit. Select one legitimate receiving organization and approach it through its own published/approved channel. No outreach is initiated by the page; preserve actual communication privately.
3. Treat a decline as useful information. If the receiver wants discussion, they must specify the need and independently approve any subsequent action. Never infer permission from a draft or link click.
4. For an authorized small test, identify separately the source/receiver, qualified transport/handling people, costs, safeguarding, host location approval, and revocation paths. No transport or food exchange is triggered by the kit.
5. Have the actor report what happened; a different qualified person checks it against actual records, costs and unintended effects. Rejected/disputed is a valid terminal state.
6. Only after source-side permission and redaction may a **method** be proposed to a second autonomous community. It needs its own opt-in; it does not inherit the first community's approval.

**First external opening:** request a response to one practical sourcing/donation/pickup question, *or learn that a software/process intervention would be counterproductive*. Do not substitute invented software usage metrics for a receiving-side outcome.

## Working implementation

- `bridge/seed/index.html` — phone-readable source and six-card printable workflow, without user accounts.
- `bridge/seed/model.mjs` — deterministic data contract, strict fixed `UNSENT_PUBLIC_SAFE_LOCAL_DRAFT`, six disjoint human gates, lightweight public-text rejection, and plain-text output.
- `bridge/seed/app.mjs` — browser-only preparation, download as text or inert JSON, clipboard, print. Text stays in page memory, and is not submitted, persisted, signed, or sent by the application.
- `bridge/seed/style.css` — accessible responsive and printable layouts.
- `tests/static-commons.test.mjs` — Node tests for gate statuses, form shape, public-only inputs and static locality. The existing `npm test` script picks it up.
- `apps/build.mjs` already copies the **entire bridge folder**, so no new Vercel project, custom domain, secret, backend, Supabase table, deployment hook or third-party integration is required. Publication still depends on the actual production/static hosting configuration and independent HTTP verification. A repository build is not proof of a working live hostname.

This can run from a local HTTP server or another static host without external API calls. **It is not automatically offline-cached** merely because the source is static; an installed local copy with a suitable server or a separately verified service-worker cache is necessary. Browser downloads/plain-text copy are deliberately unencrypted; never enter personal or private information.

## Existing independent organs

- [BRIDGE](BRIDGE-001.md): where the bounded invitation and source question originate.
- [Outbox](OUTBOX-001.md): private draft custody; `/bridge/seed/` does not read or expose the vault.
- [Living Inbox](LIVING-INBOX-002.md): optional owner-controlled capability exchange, **not** proof of identity or consent.
- [Link Wallet](LINK-WALLET-002.md): encrypted private bearer-link custody; **not** shared with this public packet.
- [SUITCASE](SUITCASE-001.md): separate signed OFFER/HOLD/REFUSE/REVIEW practice files. No ACT authorization or confirmed recipient identity.
- [Porchlight](PORCHLIGHT-COMMONS-001.md): possible Minnesota–Ghana method exchange after **each community** authorizes its own activity.
- [JAR;VIS](https://github.com/the-static-collective/JAR-VIS) / [planZ](https://github.com/the-static-collective/planZ): separate preparation and planning, without automated execution through this page.
- [reLATTE](https://github.com/the-static-collective/reLATTE): possible future signed evidence transport. This paper kit does not produce reLATTE receipts.
- [GRAFT](https://github.com/the-static-collective/GRAFT): candidate preservation of genuinely reviewed non-sensitive methods; not automatically invoked.
- [GHOT](https://github.com/the-static-collective/GHoT): possible future independently controlled offline host computing, not part of this prototype.

## Kill conditions

STOP for absent or disputed receiver authority, coercion, beneficiary data exposure, identification of vulnerable shelter sites, unsafe food or transport, missing host/volunteer/insurance permission, extra burden on staff, misleading review claims, or if unrestricted cash support is more useful than a new process. **Paper forms are not legal agreements or permits.**

**Core invariant:** `ASK != AGREED; REVIEW != PERMISSION; REPORTED != CONFIRMED; SIGNED != TRUE; ONE NODE'S METHOD != ANOTHER NODE'S AUTHORITY`.

**Next measurable proof:** one actual reply from an independently selected Waseca problem owner, followed *only if invited* by a safe one-task scope and independent outcome review. Until then, the field crossing remains unproven.
