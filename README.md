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

## Wandering Lens / Question-machine lab

The independent exploratory [`Wandering Lens`](worlds/wandering-lens/) room uses exact 11×11 nested dial navigation, eleven spatial particulars and a **Miracle Automaton that asks rather than answers**. It is a first-party *discovery lab*, **not** a newly admitted sovereign crossing or a modification of Sanctuary/Orchard. You may optionally load the original Wandering Lens image and Jubilee Engine audio through local browser file pickers. Media is kept off the public repository and the network; no playback starts from tuning or question selection. Reflective answers stay in volatile page memory unless you review and explicitly download a private JSON export. Source photographs/art and lyrics are content, not authority. See [`docs/WANDERING-LENS-001.md`](docs/WANDERING-LENS-001.md).

## Founder Node 003 — independently keyed experimental child-world charter

The [Founder Node read-only inspector](worlds/founder-node/) verifies a separately selected candidate's and founder's Ed25519 signatures, admission, candidate acceptance and optional withdrawal. Run `npm run founder:003 -- ...` for the separate offline local key/paper ceremony. This can recognize a locally admitted Wandering Lens visitor WORLD_SKETCH as a **self-governed experimental namespace**, never a real institutional/legal world, authorized broadcaster, verified separate human operator, station integration or admitted WebZ sovereign crossing. No private keys, original image/music or personal reflections are published to the repository. See [FOUNDER-NODE-003.md](docs/FOUNDER-NODE-003.md).
