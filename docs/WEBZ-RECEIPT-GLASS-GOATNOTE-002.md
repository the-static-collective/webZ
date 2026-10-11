# Receipt Glass 002 — bounded ancestry × GOATnote handoff

**Draft / unmerged / not deployed.** Builds on Receipt Glass 001, webZ PR #56. A separate GOATnote draft contains the human-owned importer.

## Evidence graph

Receipt Glass 002 projects only edges supported by the inspected object. There is no graph crawl and no automatic source lookup.

- GrO signed receiver journal: crossing → RECEIVED → HOLD, with **VERIFIED_JOURNAL_LINK** because the inherited verifier independently checks the bounded receiver history.
- Standalone reLATTE crossing: signed source is a **VERIFIED_OBJECT**, while referenced parents remain **REFERENCE_ONLY** and unobserved. No parent bytes, receiver state or ancestry is silently fabricated.
- Standalone reLATTE receipt: its signature can be verified, but its crossing reference remains **REFERENCE_ONLY** and not independently fetched.
- CANNON unsigned archive: all displayed nodes and edges are **ARCHIVE_CLAIM**. This does not re-run CI or verify original signed receipts.

These graph edges are visual evidence relationships, never GOATedges **admitted** staircases.

## Exportable carrier

The explicit **Export source + ancestry for GOATnote** button downloads `webz.goatnote-receipt-handoff/v0` including:
- exact source JSON *text*, source bytes length, SHA-256;
- the already-produced WebZ inspection result subset and bounded ancestry projection;
- export time and a deterministic canonicalized-packet checksum.

A SHA-256 checksum without an authenticated trust anchor is **integrity against accidental alteration, not cryptographic authenticity**: a new forged packet can be recomputed by anyone. The receiver MUST preserve verification status as **imported WebZ testimony** unless it independently re-runs P-256 verification. No automatic handoff, cloud sync, private keys, third-party fetch, consent substitution or publication.

## Authority

Viewer stage != owner action. A historic edge is not a presently traversable route. Source reference != source bytes. An imported signature claim != independent signer authentication. GOATnote margins and Return Threads are observer-local and cannot rewrite the underlying reLATTE record.

## Tests

`npm test` now includes the new graph/portable-handoff regression. The existing Chromium browser suite additionally exercises mobile/nested routes. Run `npm run build` and `node scripts/verify-release.mjs dist` to check commit-bound export. Public release still requires review/merge and a distinct deployment gate.
