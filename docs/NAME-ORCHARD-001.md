# NAME ORCHARD 001 — The Signed Missing Book

LBRY-inspired **name resolution, verifiable local custody and offline carry** on top of the MUSIC FIELD 004 experimental branch. This is a deliberately bounded spec and executable lab, not a token/blockchain deployment or a claim that reLATTE has admitted this envelope.

## Why this particular?

**Let It Find Us** is the actual song the operator supplied:
- Public Suno share URL (user-supplied, not fetched by this lab): https://suno.com/s/G0cLbwecX7g0qFUB
- Operator-supplied MP3 embedded title: \`Let It Find Us\`
- Embedded artist: \`thestaticcollective\`
- Locally observed duration: **186.504 seconds**
- SHA-256 of user-submitted MP3 bytes (not a platform attestation): \`59fb74c9553a310182f7542ff6cb4928f6fa5d09acceaa0723f72ba984342605\`

**The audio is not committed, uploaded, shared, embedded or fetched.** The digest is not a deed, license, copyright record or statement that every other copy of the song matches it.

## Runnable offline proof

Prerequisite: Node 22+; no \`npm install\` required for these scripts; only built-in Node crypto and filesystem APIs.

From this branch:

\`\`\`sh
npm test
npm run name:demo -- > /tmp/name-orchard-witness.json
npm run name:verify -- /tmp/name-orchard-witness.json
npm run serve
\`\`\`

Open \`http://127.0.0.1:8080/worlds/name-orchard/\` and choose \`/tmp/name-orchard-witness.json\`. JavaScript verifies the six Ed25519 signatures in-browser using WebCrypto and checks the intended claim and receipt hash references before rendering. With the default demo, **both custodians report ABSENT_UNVERIFIED**, because no audio file was selected.

To explicitly witness the actual operator-owned MP3 on a local computer:

\`\`\`sh
npm run name:demo -- --file "/path/to/Let It Find Us.mp3" > /tmp/name-orchard-with-bytes.json
npm run name:verify -- /tmp/name-orchard-with-bytes.json
\`\`\`

If selected bytes match the recorded SHA-256, custodian A signs \`VERIFIED_LOCAL_BYTES\`; if the file differs, A signs \`HASH_MISMATCH\`. Custodian B **always** signs \`ABSENT_UNVERIFIED\` in this laboratory: that is an actor-local simulated observation, not a network-wide claim. File bytes are never placed into JSON; no content is copied to B.

The CLI does not run on a remote server. It reads **only** a file path explicitly provided by the operator, solely for hashing. The browser loads **only** a JSON file explicitly selected by the operator; it performs no network request, auto-import, persistent save, media playback, or provider login. The browser visual inspection is not necessary for independent CLI verification.

## Six independently verifiable signed records

The specimen generates **three ephemeral Ed25519 signing identities** for one test run:
1. **A — original claim + custody observer + metadata sender.** A claims the name \`let-it-find-us\` for the user-supplied Suno source and optional local content hash witness.
2. **B — independent receiver/custody observer.** B reports the absence of a local supplied file and signs receipt of *metadata only*, \`HELD_FOR_REVIEW\`.
3. **C — independent fictional conflicting claimant.** C asserts the same human-readable name for a deliberately fictional, different subject. C does **not** claim any relation to the actual song or real external rights.

The signed records are:
- A's \`NAME_CLAIM\`, C's \`NAME_CLAIM\`
- A's \`CUSTODY\`, B's \`CUSTODY\`
- A's \`OFFER\` addressed to B, and B's \`RECEIPT\` bound to that offer.

The authority split:
\`\`\`text
name-orchard://let-it-find-us
        |-- A: signed assertion -> actual Suno link -> known SHA-256
        |-- C: signed assertion -> fictional other subject
        +-- RESULT: AMBIGUOUS, no stake-based claim winner

      A: local bytes?             B: local bytes?
      VERIFIED / MISMATCH / NONE  ABSENT_UNVERIFIED
          |                           ^
          +---- signed OFFER ---------+
                metadata only
                           |
                        signed RECEIPT
                        HELD_FOR_REVIEW
\`\`\`

All records are signed over canonicalized JSON with sorted object keys, and signer IDs are SHA-256 fingerprints of the Ed25519 SPKI key bytes. No keys or blockchain currency are embedded in the output. A verifier can check the signatures and exact linking digests offline without trusting the UI or the original producer.

### Semantic boundaries

- **KEY SIGNATURE ≠ HUMAN IDENTITY:** A, B and C are ephemeral demo keys, not authenticated accounts, artist keys or provider identities.
- **SOURCE LINK ≠ OWNERSHIP:** a user-supplied Suno URL is not independent confirmation of rights, publication or author origin.
- **NAME CLAIM ≠ EXCLUSIVE AUTHORITY:** distinct signed claimants retain an ambiguous \`AMBIGUOUS\` state. There is no winner, ranking algorithm, payment or stake.
- **HASH ≠ PERMISSION:** content-addressing is an integrity mechanism, not authorization for a remix, stream, distribution or physical print.
- **SIGNED ABSENCE ≠ NONEXISTENCE:** B's signed local \`ABSENT_UNVERIFIED\` cannot prove the file does not exist anywhere.
- **OFFER ≠ DELIVERY; RECEIPT ≠ MEDIA:** the receiver signs only \`HELD_FOR_REVIEW\`; \`media_bytes_received\` is false. This is **reLATTE-inspired**, not a formally validated reLATTE CrossingEnvelopeV0 or ReceiptV0.
- **FOSSIL ≠ PERMANENCE:** no IPFS, blockchain, permanent archive, DHT, seed-node discovery, hosting or content deletion guarantees are introduced.

## Test and release gate

- \`tests/name-orchard-001.test.mjs\`: signature tampering, identity confusion, missing and mismatched bytes, forged custody/receipts, colliding names, independent receiver refusal, metadata-only boundaries.
- \`tests/name_orchard_browser.py\`: real mobile Chromium WebCrypto Ed25519 verification, ambiguous name, local HOLD receipt, and rejection of modified signed JSON. No passive external requests or audio.
- \`.github/workflows/verify.yml\` runs both suites along with the inherited portal, Music Field and Suno tests.
- No auto-open in existing launch portal or modification of \`main\`; no production deployment, DNS change, or public media upload. This new world is experimental and not in the existing fixed service-worker asset inventory.

## Next genuine crossing (not yet implemented)

Two physical independently controlled devices should each generate and keep their own persistent keys locally (proper permissions and rotation), exchange signed claim and metadata envelope using explicit export/import (QR, local file or GrO transport), and report separate cold replay checks. Any artifact made public needs a human rights/admission decision. Later modules may replace this demo envelope with a reLATTE-validated portable crossing, or add genuinely distributed content availability without automatic transfer.

**NAME IS A DOOR, NOT A DEED. THE ABSENCE OF BYTES DOES NOT ERASE THE RECORD.**
