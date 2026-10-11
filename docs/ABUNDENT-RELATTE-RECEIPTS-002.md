# ABUNDENT × reLATTE RECEIPTS 002 — independent verification

**Status:** draft, local-only. Builds on [webZ PR #49](https://github.com/the-static-collective/webZ/pull/49) and the GrO receiver-owned work in [GrO PR #29](https://github.com/the-static-collective/GrO/pull/29).

## Protocol crossing

The original visitor-carried LemonPRESS catalog stays unchanged. A distinct process in GrO imports the exact parcel, independently verifies its original source bytes and experimental crossing signature, then uses its **own** new locally persisted P-256 key to sign:

1. `relatte.receipt/v0` `kind=RECEIVED`, `semantic_effect=none`.
2. `relatte.receipt/v0` `kind=R3_HOLD`, `semantic_effect=none`, with `extensions.local_receiver.receive_receipt_id` pointing at receipt 1.

The GrO process records the two receipts in a **two-event single-crossing journal**. Event ordering and event hashes use reLATTE's exact `relatte.local-receiver-event/v0` canonical-domain profile. State reference hashes use reLATTE's `relatte.local-receiver-snapshot` state-address grammar. A repeat returns the unchanged journal, and restart reconstructs and verifies it. The journal is create-only and designed for exactly this pinned public crossing; it is **not** a general multi-arrival concurrency-safe LocalReceiver.

## Abundent reader

At `/arrivals/receipts/`, the visitor manually imports `journal.json`. The static read-only verifier:

- independently rechecks the *embedded* original LemonPRESS source and experiment-key crossing;
- checks both P-256 receipt signatures and receipt IDs using reLATTE's domain-separated canonical profile;
- verifies receiver key continuity, receipt-world identity and receive-to-HOLD linkage;
- computes expected local state references, checks both event hashes and `previous_hash` chain;
- explicitly refuses changed bytes, counterfeit keys, invalid order, switched effect, missing events, changed authorities and unauthorized fields;
- displays the receiver's public-key fingerprint to support **independent** key identification, while refusing to authenticate a named operator merely because a public key appeared in a JSON file.

The static reader has no receiving-world key, no private input storage, no account and no live network receive endpoint. The GrO-signed JSON remains manually exported/imported. Both pages stay outside the immutable offline service-worker cache.

## Verification

`npm test` invokes `tests/receipt-002.test.mjs`, a separately implemented ephemeral signer producing real v0 signature material. `npm run test:browser` invokes `tests/signed_receipt_browser.py`, testing the real read-only page on root and nested paths in Chromium, valid evidence, forged receipt refusal, no local storage and mobile layout.

GrO's CI separately tests signed receipt persistence/restart and runs `examples/abundent-relatte-compatibility-002.mjs` against an exact pinned checkout of **reLATTE's own `verifyReceipt`** implementation. No private signer is in a repository or the website.

## Unclaimed / HOLD

- Source-owner authentication is not claimed; the original crossing remains signed by an **experiment adapter key**.
- The GrO local key is cryptographically persistent but not authenticated as an organization operator; human trust must be established out-of-band.
- The website sees and verifies manually delivered data; it cannot claim that the remote host delivered anything to it.
- These receipts establish the bounded local signing process and persistent journal, not Internet-scale availability, independent custody of the original artifact bytes, authorization, ADMIT, or global truth.
- There is no production release, domain change, multi-party federation, remote receiver server, phone hardware verification or content sharing by default.

**Law:** RECEIPT VERIFIED ≠ RECEIVER IDENTITY AUTHENTICATED. RECEIVED ≠ ADMITTED. HOLD ≠ PERMISSION. RECONSTRUCTIBLE LOCAL JOURNAL ≠ IMMORTAL HOST.
