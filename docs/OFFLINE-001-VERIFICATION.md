# OFFLINE-001 — door and proof witness

## Reviewed contracts and preserved authority

| Owner | Pinned contract | This slice |
|---|---|---|
| webZ | [PR #2](https://github.com/the-static-collective/webZ/pull/2), b487aab92a8a2a572001cd91424a81b3a14abce9; [PORCH issue #1](https://github.com/the-static-collective/webZ/issues/1) | Addresses, explicit navigation, public invitation description, unsigned observations |
| MAXHINAL / Human-Witness | [PR #5](https://github.com/the-static-collective/Human-Witness/pull/5), 4f0143fcaf44dfe249ea7f2c769e7b39fed4dbfd | Owns protected bootstrap, exact specimen, P-256 custody, independent host histories and LIVE claims |
| reLATTE | [PR #62](https://github.com/the-static-collective/reLATTE/pull/62), ae3fd0f56860683245dfd27ff32edf64311046bf; canonical v0 donor pinned in provenance | Owns signed crossing/receipt rules and sovereign receiver decisions; loopback FIRST-CONTACT remains a fixture, never public relay |
| STORYSHIP | Existing narrative domain | Owns story/canon; no trace, consent, observation or local ADMIT writes its history |

Specifications and neighboring repositories are unchanged. Static first-party worlds share an origin and are not security-isolated tenants. No third-party manga assets are redistributed. No public delivery edge, capability redemption, backend mutation or new project is implemented.

## Executable witness

`npm test` checks unsafe/mismatched addresses, invalid manifests, explicit round trip and default carry, independent per-world human choices, UTF-8 bounds/consent, corrupt/tampered exports, real donor signatures, both custody scopes, missing history/return, conflicting/duplicate and out-of-order reports, tampered source/receipt/parent/key, credentials, private key material and invented LIVE flags.

`npm run test:browser` starts an isolated loopback static server and runs real Chromium. [Result](../evidence/browser/result.json), [frozen voyage](../evidence/browser/voyage.frozen.json), [proof observation](../evidence/browser/proof.observation.json), [mobile porch](../evidence/browser/porch-mobile.png), [mobile proof](../evidence/browser/proof-mobile.png), [mobile door](../evidence/browser/sanctuary-mobile.png), [desktop world](../evidence/browser/sanctuary-desktop.png).

It witnesses two complete round trips, one offline after precaching; optional durable reload; Sanctuary HOLD → ADMIT independent of Orchard REFUSE; delivery disabled; missing destination yielding webZ UNRESOLVED rather than arrival; corrupt storage visible without repair; storage denial allowing ordinary travel; nested-base routing; no default destination fetch or durable storage; no external requests or page errors. Fresh Node and fresh browser produce equal voyage projections and equal proof observations from the exact same frozen inputs. Import only inspects until explicit restore and never navigates.

The proof viewer does not assert that an arbitrary imported report was cold-replayed by a separate process: its `verification.cold_replay_checked` stays false. The separate browser witness records cold comparison for this frozen fixture only. `source_host_history_checked` and `destination_host_history_checked` also stay false because uploaded custody metadata is not independent authenticated HTTPS acquisition.

## Sanitized evidence contract

`webz/sanitized-maxhinal/v0` has exactly `schema`, `scope`, `fingerprints`, `traces`. Each trace has exactly `node_id`, `host_id`, `signed_crossing`, `signed_hold`, `signed_disposition`, `relation_observations`. Retain signed donor objects unchanged; do not rewrite or strip fields inside a signature. Pre-review public material outside the browser. Reports have a 512 KiB / 100 trace limit, bounded JSON depth and strict outer/protocol field checks; private keys, bearer/JWT text, credential fields and URL-bearing strings are rejected. Raw operator reports, credentials, tokens, host URLs and image bytes are not supported imports. Never automatically sanitize a secret and then silently accept it.

[Provenance](../evidence/provenance.json) identifies the original fixture, commit, protocol and SHA-256. The transformation removes unsigned attempts/replay/claims while preserving signed values. It contains 4 distinct crossings and 9 distinct signed receipts (including a SINEW HOLD observation). Self-loop custody is present; no nonself hop has both custodians. Each duplicate record is independently signature-checked; conflicting snapshots reject. Parent receipts must be observed and belong to the declared source world. Missing disposition remains unresolved.

An internally consistent source/destination pair still cannot prove separate acquisition: one person can copy signed public receipts and supply custodian labels. Supplied roster fingerprints bind signatures to declared keys, not to actual protected hosts. Accordingly even a fully paired import remains NOT_EARNED, with exact source bytes and HTTPS transport UNOBSERVED. Neither file import, observation hash, consent, synthetic human choices nor browser state can open the Rack. There is no LIVE-unlock API in this release; a future reviewed MAXHINAL trust/acquisition gate must earn that capability.

## Durable replay and privacy

`webz/voyage-local/v0` is an ordered non-sensitive observation log, not a receipt. `webz/local-export/v0` freezes that record with an integrity SHA-256 and explicit unsigned scope. Sequence and departure-basis checks reconstruct the same deterministic `webz/local-projection/v0`. Hashes detect accidental alteration; they do not authenticate a traveler or prevent someone from rewriting and rehashing their own unsigned record.

Drafts and imported proofs are memory-only; the service worker caches only a fixed allowlist of public documents/assets and the reviewed public simulation. Browser storage is optional and contains no freeform proposal text or credentials. Consent can be withdrawn and storage erased. Browser caches can be cleared through browser site-data controls; the trace ERASE control erases observation storage, not static assets. Future public multi-owner hosting needs a separate isolation/security review.

## MAXHINAL prerequisites — checked 2026-10-07

Read-only parallel readiness inspection found protected operator environment variables unset; both existing hosts had 0 identities, 0 peers and 0 active unexpired capabilities. No bootstrap was attempted. These are time-bounded observations, not signed proof of ongoing absence or network failure. No new Supabase project, key, capability or hosted mutation was created.

The original `mx13_specimen` INVITATION is still missing after inspecting 3,257 nondependency files and four archives:

- Observed filename: `1000018575.png`; actual bytes are JPEG/JFIF.
- Exact length: **670478 bytes**.
- Exact SHA-256: **af82b9a3b2d5eeb1ce3d58038b3415ca62f0815bd6f0a04662ec8cf5b773d171**.

A `porch_invite` text proposal is a different object and can never substitute. Original bytes and protected service-role/capability configuration must remain outside GitHub, this portal and browser storage.

## Next gates

1. Review the offline portal PR. This earns local navigability and browser replay only.
2. In a protected, actually configured operator environment, run MAXHINAL runbook step 3 to bootstrap independent host-local identities without exposing private material. Recover and hash the exact original specimen.
3. Execute actual HTTPS 01 → 02 → 01. Independently acquire both host histories, verify signed receipts/ancestry/byte identity and cold replay; earn MAXHINAL's genuine two-host LIVE report. Only then design the trusted read-only Rack unlock seam.
4. Public two-device PORCH/reLATTE delivery, 13-node routing and live SINEW each need their own review and proof gates. Navigation does not grant any of them.
