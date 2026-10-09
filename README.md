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

Approved design sources remain unchanged: [GENESIS](docs/superpowers/specs/2026-10-06-webz-genesis-001-design.md) and [MAXHINAL/PORCH](docs/superpowers/specs/2026-10-06-webz-maxhinal-porch-001-design.md). The feature PR is stacked on webZ PR #2; it does not merge or deploy its design or alter neighboring approved baselines.

## GrO × WALL-E — Field Porch 001

The first opt-in **GrO/FORAGE field crossing** lives at [WEBZ Field Porch](forage/).
Bring the GrO local HOLD, FORAGE lead and original-byte photo evidence;
WEBZ independently replays the source files before allowing a reviewed,
sanitary **public invitation postcard**. It does **not** take the item,
transfer photos, admit a GrO prospect as property, or add any sovereign WEBZ
world. Explicit choice remains with the traveler and each receiver.

See [the field crossing guide](docs/FIELD-PORCH-001-WALLE-GRO.md).
The source files are runnable locally, but are **not** a verified live
internet deployment.
