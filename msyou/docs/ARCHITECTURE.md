# MSyoU-001 — the small, inspectable crossing

## What actually executes

```
Browser (index.html + app.js)
   ↳ src/field-kit.mjs
        createCard() → DRAFT
        advance()    → LOCAL_HOLD
        advance()    → HANDOFF_PREPARED
        makePacket()  → locally downloadable JSON
   ✕ no database
   ✕ no fetch / websocket / network POST
   ✕ no sign-in, human identity verifier, steward receiver, or publication service
```

The code is a **fresh, minimal independent prototype** informed by the source organs. It does **not** import or exercise native reLATTE, CANNON, GHoT, GrO, Full Measure, TABLElogic, or a remote webZ API. The diagram in the briefing is a possible architecture, not a claim of runtime integration.

## Protocol example

```json
{
  "schema": "msyou.handoff-packet/v0",
  "status": "PREPARED_NOT_SENT",
  "review": "NOT_RECEIVED",
  "publication": "NOT_PUBLISHED",
  "proofOfWork": "NONE",
  "exportedAt": "2026-10-24T22:02:00.000Z",
  "card": {
    "schema": "msyou.field-card/v0",
    "id": "demo-001",
    "kind": "NEED",
    "title": "Fictional pantry vegetables",
    "detail": "Only a fictional example.",
    "context": "independent community pilot",
    "scope": "LOCAL_DEMO_ONLY",
    "stage": "HANDOFF_PREPARED",
    "submitted": false,
    "identityVerified": false,
    "consentToPublish": false,
    "events": [
      {"stage":"DRAFT","at":"2026-10-24T22:00:00Z","actor":"LOCAL_UNVERIFIED"},
      {"stage":"LOCAL_HOLD","at":"2026-10-24T22:01:00Z","actor":"LOCAL_UNVERIFIED"},
      {"stage":"HANDOFF_PREPARED","at":"2026-10-24T22:02:00Z","actor":"LOCAL_UNVERIFIED"}
    ]
  }
}
```

This is an unsigned local assertion. Its ID is a correlation label, not authentication. The validator checks the bounded shape and allowed local transitions; it **does not** prove the actor or real-world content. Local event timestamps are untrusted device claims. JSON can be edited after export: validation prevents unsupported schema states, not adversarial evidence tampering.

## Upgrade seams (all unimplemented)

| Wanted capacity | Human/technical gate |
| --- | --- |
| Actual receiver | Named willing steward, opt-in consent, minimum-data rules, acknowledged receipt |
| Durable shared work | Explicit auth/authorization, privacy, secure storage, roles, tested deletion |
| Printed copies | Human-selected printer/venue and local custody rules |
| Institutional interface | Formal MSU approval and technical security assessment |
| Field quest | Physical steward permission, separate observed source result, distinct human confirmers |
| Verifiable source history | Stable refs, source-specific native checks, cryptographic review where warranted |
| Offline | Current app runs on localhost; no service worker or tested offline package included |

## How to run and test

`npm test` verifies local stage transition discipline, forbidden authority claims and a cheap static no-network scan. `npm run serve` starts a loopback-only static server bound to 127.0.0.1. This is a working demo, **not** a completed browser accessibility review or a hostile-input security audit.

For peer review, begin with [SOURCE-ATLAS](SOURCE-ATLAS.md) and compare against donor branch sources. Do not count this prototype's synthetic output as an independent third-party receipt.
