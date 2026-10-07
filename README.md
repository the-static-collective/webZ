# webZ — World Wide Web of Worlds

A world gets an address. A door gets a contract. A traveler gets a choice. A crossing gets a trace.

The first executable slice is **Sanctuary → Orchard → Sanctuary**: two distinct first-party documents, a mobile invitation porch, and a read-only MAXHINAL proof viewer. It works offline after one successful initial load and static cache installation. No backend, accounts, telemetry, external media, signing keys or new infrastructure.

```sh
# Node 22+; no runtime dependencies
npm test
npm run serve
# Open http://127.0.0.1:8080/
```

Use **Inspect door**, then **Cross** or **Remain**. Orchard offers an explicit **Return**. Default carry is always none. Optionally enable a non-sensitive local trace; inspect/export it, then reconstruct the same projection in a new browser or process:

```sh
npm run replay -- evidence/browser/voyage.frozen.json
node scripts/verify-report.mjs evidence/public-simulation.json
```

Mobile/browser validation requires Python 3.12+ and Playwright with Chromium:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:browser
```

The browser test starts its own loopback server under a nested `/nested/webZ/` base. It exercises online/offline round trips, independent unsigned human decisions, failed destinations, corrupt/denied storage, counterfeit LIVE imports, static-cache privacy, Node/fresh-browser cold replay, and delayed crossing/export/import cancellation. [Browser results and screenshots](evidence/browser/) are generated from real Chromium.

The porch is **NOT_ISSUED / delivery disabled**. Prepare up to 2048 UTF-8 bytes of consented public text; rehearse each world's HOLD / REFUSE / ADMIT independently. Draft text stays in page memory. Only proposal hashes, lengths and unsigned local decisions enter an optional trace. Neither consent nor ADMIT grants publication, reuse, execution or STORYSHIP canon. Closing/clearing the draft revokes the local offer; there is no remote receiver or capability.

The evidence viewer accepts only a bounded `webz/sanitized-maxhinal/v0` public carrier; it independently checks reLATTE v0 signatures, identity hashes, world/particular binding, ancestry, conflicting duplicates and each custodian record. It produces a `webz/proof-view/v0` observation. Imported reports remain in memory. The included signed fixture is a simulation with incomplete paired custody. Uploaded fingerprints cannot authenticate actual hosts, and flags cannot grant LIVE. The **Constellation Rack stays locked**.

[Crossing and verification report, boundaries, blockers, next gates](docs/OFFLINE-001-VERIFICATION.md) · [Implementation plan](docs/superpowers/plans/2026-10-07-offline-sovereign-porch.md).

Approved design sources remain unchanged: [GENESIS](docs/superpowers/specs/2026-10-06-webz-genesis-001-design.md) and [MAXHINAL/PORCH](docs/superpowers/specs/2026-10-06-webz-maxhinal-porch-001-design.md). PR #2 merged before PR #3; the offline implementation is now on main. Neighboring repositories retain their independent authority.

FIRST-ENCOUNTER-002 begins at **[Encounter preflight](encounter/)**, a separate read-only page. Load a public signed invitation/proposal/return packet, independently supply and review public identity pins, then explicitly verify. It uses native reLATTE v0 source and receiver signatures, exact text hashes, receiver binding, and the receive/disposition link. Historical signed returns remain inspectable when an invitation expires or is locally revoked. Public delivery stays unavailable; no signing keys, receiver, or sovereign history live in this page. The new page does not install an offline cache.

```sh
node scripts/inspect-encounter.mjs evidence/first-encounter-002/refuse.packet.json evidence/first-encounter-002/refuse.trust.json
```

The native HOLD / REFUSE / ADMIT fixtures are synthetic automation. Two isolated browser processes/origins and fresh Node replay test the same frozen public records; they do **not** earn authenticated transport, real participant action, or two-device field proof. [Encounter report, public fixture provenance and next gates](docs/FIRST-ENCOUNTER-002-VERIFICATION.md) · [Invitation and authenticated-edge design](docs/superpowers/specs/2026-10-07-first-encounter-002-design.md).

The visitor encounter has its own security and protected endpoint gates. It does **not** wait for MAXHINAL's missing invitation image. MAXHINAL's protected bootstrap, exact-byte image recovery, independent two-host LIVE proof, and Rack gate remain separate and unchanged.
