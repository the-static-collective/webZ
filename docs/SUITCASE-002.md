# SUITCASE-002 — Independent Genesis and Voluntary Discovery
**Implementation scope:** webZ /bridge/suitcase/ (static HTTPS app, local-first). This is a testable digital field instrument, not physical deployment.

## Working crossing
1. Local room owner signs a bounded `SEED` invitation. No governance or right to contact a child is conveyed.
2. A separately generated local P-256 key signs a `GENESIS` statement with self-chosen name, purpose, operating rules and optional seed digest / ancestor fingerprint. A seed must be imported and match the origin key, have been issued before the genesis, and be unexpired *when the genesis was signed*. No ancestor key is reused.
3. Genesis with no seed is an independent root. Its signer is self-attested only: no legal incorporation, legal authority, human verification or facility permission follows.
4. Any key with exactly one locally validated genesis can sign a public-safe opt-in `CAPABILITY` referring to its precise genesis digest. Cards expire after 14 days by UI default (protocol maximum 30). No remote directory is contacted.
5. A receiving device imports the signed seed/genesis/capability files and can then discover them in its **device-local** directory. If the seed is missing, ancestry is not accepted locally as proven. Addressing an OFFER only fills an existing form; it does not send.
6. The original capability signer may sign `WITHDRAW`. A holder who receives/imports the signed withdrawal hides the capability. A third-party key cannot withdraw another key's capability. Remote copies may still circulate.
7. The existing OFFER → HOLD / REFUSE / REVIEW → separately signed DISPOSITION works without modifications to existing packet types. A receiver's refusal is a first-class signed outcome.

## Cryptographic and authority boundaries
- The signed envelope still uses SUITCASE-001's standalone canonical JSON / P-256 experimental protocol; **not reLATTE wire-compatible** and no automatic reLATTE admission. The signatures establish control of keys, not verified personal or institutional identities.
- Signed ancestry preserves a verifiable *invitation relation*, not legal descent, consent to contact, or authority. Without a source seed on a receiver's device, ancestry is unresolved. This version does not attempt a global immutable genealogy.
- The local directory is made only of user-exported/imported public-safe files. There is no broadcast, crawl, shared backend, private inbox, automatic discoverability, search endpoint, or promise of delivery. `PUBLIC_OPT_IN` means the card *may* be manually shared.
- Key custody remains nonexportable per browser origin. Local IndexedDB is not encrypted at rest. Losing/resetting that device/origin can permanently lose the key. No key migration, multi-person governance, revocation authority or secure successor process has been completed.
- A `WITHDRAW` is a cryptographically attributable statement to peers who actually receive it; it cannot erase previously transmitted files or revoke remote memory.
- No client identities, survivor records, shelter locations, exact residential sites, credentials, financial transfers, child records or confidential information belong in these plaintext messages.
- Every proposed capability remains **self-described**. Offers are NOT inventory availability, service commitments, host permission, licensed legal assistance, or independently verified fulfillment.
- The milestone inspector remains `NODE ALIVE: NOT VERIFIED` in all browser states. A legitimate field proof needs a separate witness of offline operation, steward governance, local refusal, and independently completed useful work.

## Printed fallback
`/bridge/suitcase/paper-kit.html` is the printable six-card checklist / founding instrument / hardware materials plan. The physical prototype currently specifies a case, an ordinary independently owned Android phone, printable records and an intact certified power bank. It does **not** pretend a radio, reclaimed battery pack or church installation already exists. Radio and GHoT energy integration require safe hardware and separate consent/regulatory review.

## Tests
`node --test tests/suitcase.test.mjs tests/suitcase-foundry.test.mjs`
`python tests/suitcase_browser.py`
The first is a local protocol/model proof, the second is existing two-independent-Chromium-context signed file / refused-response / offline-shell proof. Neither equals a two-human field pilot. `npm test` and the repo CI cover model tests.

## Milestone ledger (still conditional)
TABLE READY → TABLE LIT → SUITCASE ACCEPTED → WORK RETURNED → **NODE ALIVE**.

NODE ALIVE gates: (1) voluntary adopted rules, (2) independent identity and records, (3) founder absent/offline continuity, (4) independently consented signed crossing, (5) tested and respected refusal, (6) named real steward and safeguarding, (7) independent field report. Code records do not imply all gates passed.

## Nearby organs / integration gates
- **reLATTE:** native canonical crossing, signed disposition and replay adapter; avoid relabeling SUITCASE signatures as reLATTE receipts.
- **JAR;VIS / planZ:** optional proposed action plans; every receiver independently reviews before admission.
- **GRAFT:** record source revision and proof provenance as public, reviewable artifacts.
- **GHoT / RADIO HOUSE / RADIO EAR:** future owner-approved physical transport and energy work.
- **WEBZ Link Wallet / Outbox:** private keyring/drafts are separate trust domains, not automatically integrated.
