# POST OFFICE 004 — The Wandering Letter

**Scope:** bounded manual store–carry–forward experiment, **not** a FidoNet node, Bundle Protocol implementation, authenticated relay, background mesh, IPFS swarm, ActivityPub server, email sender, or physical three-device witness.

**Status:** draft, stacked on Peer 003 PR #39, Seed Lab 002 PR #36, Post Office 001 PR #33. Production, DNS, Buttondown and Cloudflare unchanged.

## Hypothesis

A public seed can be prepared at A, deliberately carried to B, held across a browser restart, and passed to C **after A disappears**. C can verify content and each transit-note hash locally, create a one-file offline website, and retain an unsigned local receipt. B can be disconnected before C receives.

The first implementation deliberately uses **user-controlled file transport**; it does *not* silently infer network reachability from local copies. Peer 003 supplies a separate opt-in browser-to-browser transfer seam, not automatic Seed 004 routing.

## What exists

- `post-office/seed-lab/courier/`: three-station interactive bench. A fetches the existing public Letter 000 **only on click**, verifies SHA-256 and exports a bounded JSON parcel.
- `courier-core.mjs`: strict envelope, one 128-bit journey ID, exactly allowed transitions A ISSUE → B FORWARD; each transit note hashes its own station/action/index, prior-note hash, and content digest. Only the original Seed 002 public preface passes `verify(seed)`. A changed source, hop link, extra field, disallowed station or chain index causes a HOLD.
- B must explicitly opt in to IndexedDB persistence. It can click Restore after page reload; no automatic forwarding or rereading of the local database. B must independently approve exporting the B→C parcel. B may clear its held copy with explicit confirmation. This browser-local database is not end-to-end encrypted and must **never** store private letters at this stage.
- C imports B's forwarded parcel, verifies content and all notes, and must explicitly consent to receiving before exporting one offline HTML projection and an *unsigned* local receipt. C's page stores the received parcel in memory only. Source A and courier B need not be online.
- `post-office/appropriation-atlas/`: eight source-inspired research lanes, with FidoNet-style mailbags as the first implemented **prototype** and the remaining ideas on explicit HOLD: DTN expiry/queues, signed personal feeds, collaborative CRDTs, optical QR, consented WebTorrent swarms, nearby phone couriers, and ActivityPub/AT distribution. Also sketches the future proposal-only self-writing site.
- The exact static public assets are review-allowlisted in `scripts/build-release.mjs`. They are not added to the PWA's fixed offline cache.

## Scientific experiment

1. Open Station A, prepare Letter 000, download A→B parcel.
2. Turn A completely off (or close A browser context and block access to source A).
3. Open Station B in a separate browser profile/device, import the A parcel, check the local HOLD consent, and click **Accept and store HOLD**. Reload B. Before clicking **Restore my saved HOLD**, nothing is automatically displayed or forwarded. Restore, independently inspect the exact original content digest, then consent to export B→C parcel.
4. Turn B off. Open Station C in a third independent browser profile/device and, if possible, disconnect C from the internet *after the page's code is loaded*. Import the locally transferred B parcel, verify every note, authorize receipt, download the offline HTML and local receipt.
5. Open the generated page from the file system disconnected from the internet. Verify its contents against the original Letter 000. Alter one byte of the source or one transit note and confirm rejection.
6. Clear B's saved local HOLD. Verify it cannot be reopened afterward.

## Test claims

- `tests/courier-004.test.mjs` checks source/chain immutability and known tampering, station limits, receipt verification, output and release boundaries.
- `tests/courier_browser.py` executes three **isolated Chromium contexts**. It closes A before B forwards; checks B holds via IndexedDB across page reload; closes B; puts C offline; accepts the forwarded parcel from an explicit file selection and exports a working standalone HTML file.
- `npm test`, `npm run field:verify`, `npm run build`, `node scripts/verify-release.mjs dist`, and `npm run test:browser` remain the required release gates.

## Authority / privacy

- A hash chain provides **self-consistency**, not a tamperproof log against an attacker who can recompute hashes; it is not cryptographic authentication or a signed reLATTE receipt. Seed authorship and chain custody remain unproven without independently trusted signature keys, including actual key rotation and trust on first use.
- Data remains in the holder's browser **only with opt-in**, using regular IndexedDB without encryption. Browsers and profiles can clear or lose storage. Do not use this for sensitive/private correspondence.
- No subscriber addresses, mailboxes, social accounts, remote execution, or unsanctioned files. A single reviewed public seed is accepted, not arbitrary network payloads.
- The site downloads source assets over HTTPS when opened. The **generated HTML** can then work without a server. This is not a fully offline-installed application.
- The three-context CI test is not evidence of three independent *physical* devices, different Wi-Fi networks, or working contact with intermittently connected physical peers.

## Sequential next gates (the other seven)

1. **DTN-style lifetime**: bounded queue, explicit expiry, dedupe and human dispositions; do not claim Bundle Protocol interoperability absent that actual protocol.
2. **Personal publisher signatures**: creator-controlled signing keys, independent trust-pinning, rejection of forged/old signatures, explicit revocation and loss recovery.
3. **Concurrent creative changes**: test an Automerge-style CRDT adapter with two conflicting modifications, preserve both source versions and make editorial selection explicit.
4. **Optical packets**: printed/static or animated QR with sequencing and error correction; measure frame recovery and brightness limitations with actual phone cameras.
5. **Permissioned media swarm**: only authorized/licensed media; isolate consent, rate limits and peer privacy before any live WebTorrent integration.
6. **Nearby transport**: native Bluetooth/Wi-Fi permissions, explicit discovery and opt-out, device compatibility review. Ordinary browser JS is not a native Briar mesh.
7. **Federation**: ActivityPub actor inbox/outbox and AT Protocol repo adapter require authenticated owner-controlled destinations and publication approval. No automatic private-reply distribution.

**The long-term synthesis:** allow approved sources to propose new derived pages, navigational maps or listening rooms. Recommendation ≠ selection; projection ≠ authority; no autonomous publication.
