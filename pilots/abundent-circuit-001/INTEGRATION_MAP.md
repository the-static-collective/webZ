**Circuit 003 update:** The native donor now has an optional bounded, HMAC-paired remote `system.hash` worker. It is not the GHoT automatic distributed capability composer; node authority, reLATTE signing, human witnessing and independent physical-device operation remain separate tests. See `RELEASE_NOTES_003.md`.

# Circuit 001 — Native Donor Adapter Roadmap

Status: integration proposal with a runnable local field slice. Not native donor integration.

## Contract ownership

- **Abundent / webZ** owns opt-in public invitation creation, local UI, and navigation. Invitation drafts are not messages and have no invitation-token security properties.
- **reLATTE** must own all later cryptographic crossing checks; this pilot uses deliberately unsigned JSON and independent local disposition.
- **Full Measure** owns admitted Deeds/Harvests; this pilot produces only local non-authoritative projections using two *typed actor labels*. Native Full Measure must use actual authorization and human-witness rules.
- **GrO** owns admitted consequence/affordance state; this pilot's named possible capability is a local illustration, not admitted GrO consequence.
- **Jubilee Campfire / Treasury / PENNY** own consented resource coordination and their separate economic objects. Financial amounts here are self-reported notes, never balances.
- **Static Workbench / STATIC OS** own the operator desk and governed host environment. This prototype makes no OS changes or fabrications.
- **GHoT** owns task capability advertisement, execution, liveness, energy admission and receipts. The bounded word-count example runs in the local browser only.
- **Festival Foundry / Lemon Press** will own the reviewed editorial release and licensed publication of reusable host procedures. No external publish action happens here.

## Admission-and-evidence requirements for first native release

1. Input should be locally authored and reviewed; every export has typed purpose, bounded fields, and no PII by default.
2. Receiving owner authenticates its own authority, verifies any cryptographic receipt using a donor-native verifier, and then independently `HOLD`, `REFUSE` or `ADMIT_FOR_REVIEW`.
3. Human report and independently authenticated recipient review do not collapse into transport acceptance.
4. Full Measure/GrO projection receives only verified donor-native final events, never browser text labels.
5. Economic movement requires independent accounting ownership and reconciliation; tickets and games are not funds.
6. Native GHoT task execution: use a bounded registered capability with no arbitrary shell, review energy/data-locality and trust policy, then obtain and verify the donor-native receipt.
7. Physical implementation requires human-reviewed fabrication plans, operator authorization, independent inspection, safe custody and real-world receipts.
8. An offspring node imports **method**, not the originating node's permissions, participants, claims or source identities.

## Release gates

- **L0 — This commit:** a coherent local-first no-account training apparatus with review gates, export/import and tests.
- **L1 — Distinct physical devices:** signed source/destination identities, privacy-safe authenticated handoff, schema migration and real human audit paths.
- **L2 — Native donor adapters:** independently verifiable real runtime receipts from GHoT and reLATTE; Full Measure and GrO maintain local authority and cannot be mutated through draft imports.
- **L3 — Governed field trial:** at least one willing actual host, accessibility/safety review, privacy review, independent human review, genuine consent, legitimate funding/accounting and documented fallbacks.
- **L4 — Reproduction:** independently hosted second node runs a gathering with a method cartridge and records what did and did not carry.

**Zero-cost test comes first.** Do not require an account, paid model, service-role key, website deployment, or centralized platform for the initial social test.

## First actual donor interface landed — Circuit 002 / GHoT native local hash

**GHoT source-owned runtime:** `GHoT/ghot/reference_node.py hash <text>`.
**Circuit-owned bridge:** `ghot_local_server.py`; localhost-only HTTP; no GHoT
source modification. The bridge checks `kind=ghot.receipt`,
`capability=system.hash`, native task and receipt IDs, `status=ok`, and a
SHA-256 match. A separately checked browser WebCrypto digest must also match
before Circuit creates `GHOT_NATIVE_EXECUTED_LOCAL` notebook record with
`actualGHoT:true`. No grant of a Full Measure Deed follows from compute alone.

**Source responsibility:** native GHoT task + receipt, its own persistence.
**Adapter responsibility:** one opt-in bounded donor call, local receipt check.
**Circuit responsibility:** record reference and nonclaims; no human truth
promotion. **Operator responsibility:** provide a real GHoT checkout, a compatible
Python runtime, and decide whether any input should be hashed at all.

Native **one-body** GHoT ≠ multi-node GHoT, verified human identity, encrypted
transport, signed reLATTE settlement, real-world work, or physical fabrication.
Next donor-native gate: operate two genuine independent GHoT bodies, inspect
capability selection and remote receipt provenance, and test refusal if a body
loses eligibility; only then consider Workbench/Static OS orchestration.


### Native Minecraft Java rehearsal (Circuit 004)

Proposed / now executable adapter: Abundent local browser -> allowlisted `ghot_local_server.py` route -> `minecraft_foundry.py` stdlib RCON -> official vanilla Java test world -> actual lever/lamp readback -> real GHoT `system.hash` donor output -> locally stored `GAME_ONLY_HOLD` reference. The hosted website cannot use RCON. The separate test world is operator-owned and never inferred from any third-party harbor. No fake game event makes a reLATTE ADMIT, local human Deed, money, or physical change. See `RELEASE_NOTES_004.md`.
