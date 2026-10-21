# ABUNDENT FIELD 001 — the first printable byte

Independent, **unmerged and undeployed** `/field/` sidecar for the October 24–26 Coalition of Care → Waseca community grocery field window.

**Source:** [planZ Grand Shard 001 PR #24](https://github.com/the-static-collective/planZ/pull/24). Two user-provided PDF decks were transcribed as seed cards (18 Coalition + 16 Waseca). This seed library is an *independent prototype*, not an authorized publication by the Coalition, the co-op, or Real Life Church.

## Run

From the webZ repository root with Node 22+:

```sh
npm test
npm run serve
# visit http://127.0.0.1:8080/field/
```

Or serve the files from any static HTTPS host at `/field/`. After the first successful HTTPS load, the field-scoped service worker may cache local assets for offline reuse. There are no runtime package dependencies or external API calls. The QR renderer is vendored [qrcodejs](https://github.com/davidshimjs/qrcodejs) under its MIT license in `field/vendor/LICENSE.qrcodejs.txt`.

## One complete, honest byte

- Browse/search 34 transcribed, attributed POSTYMON and REALITY.2 seed cards across both 2026 decks.
- Print one card, or 4-up / 9-up US Letter sheets through the browser print dialog; each card carries a generated QR and human-readable URL.
- Make an *unreviewed* local descendant referring to one seed (or none), without sending it anywhere.
- Carry that draft in a URL **fragment**, which encodes its full public-safe draft contents: an entirely client-side portable handoff, **not a permanently hosted record**. The QR can open the draft in another browser **after** the real site route is published.
- Save the draft as JSON; save an anonymous observation/question/proposed connection as a separate JSON file. Returns are unverified personal notes, not public posts or receipts of completed actions.
- No automatic collection of people's contacts, account logins, analytics, membership, payments, publication or claim of real physical encounters.

### Print and URL boundary

A running localhost/staging preview prints **PREVIEW URL ONLY — NOT DISTRIBUTABLE**. The QR code contains that preview URL, so **do not distribute preview cards**. A verified HTTPS host of `abundent.org` or `www.abundent.org` gets the public-seed label; even then, a printed card still cannot claim a real co-op or Coalition partnership.

A local draft QR contains an URL fragment, not a server-side permanent ID. Copying it carries only the text written into that draft. Never put names, contacts, private needs or commitments into the form. The input validator rejects obvious email addresses, US phone patterns and markup, but **no text filter can prove privacy**. The checkboxes and steward-reviewed public publication remain separate gates.

The browser can open the ordinary print dialog; it cannot silently choose or control a meeting printer. Test QR decoding and physical dimensions on actual printer/paper before an event.

### Known proof gaps

- No review/publishing backend; no multiplayer or shared server state.
- No cryptographically authenticated identity, source-card issuance, participant consent or independently witnessed physical action.
- No actual public deployment, existing garden integration, shareable hosted drafts or origin verification completed.
- Service worker offline behavior and printer/QR scanning require an actual browser/device test; Node tests cover model and document shape only.
- webZ's `main` does not reflect all known deployed Abundent garden features. The sidecar is additive and **must be reconciled with the exact deployed tree** before site-owner approval. The root page, root SW, `/week/`, `/composer/` and related garden routes are deliberately untouched.

## Pilot gate

B0: locally inspect and run Node tests; manually exercise search, print, QR, descendant, return export and mobile.  
B1: identify deployed Abundent source, approve a site-specific change, verify live URL and field-scoped SW, print/scan on a real device, then optionally add a link from the existing site's navigation.  
B2+: only after consented steward review and organizational authority may a submitted question become a public record or real help coordination.

**PRINT != PARTICIPATION · SHARE != ACCEPTANCE · REPORT != CONFIRMATION · PROPOSAL != ADMISSION · NO PARTICIPATION REQUIRED TO LEAVE.**
