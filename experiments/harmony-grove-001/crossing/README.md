# GIVING-TREE-004 · the Crossing Tent

**Experimental local-first adapter; review-only, not deployed.** Stacked on draft Giving Tree Commons #35. The /crossing/ path is not in the production `STATIC_PATHS`, offline cache or deterministic release manifest. Nothing has been merged or deployed to abundent.org. The dedicated Supabase commons intake stays disabled.

## What a visitor can actually do

1. At Giving Tree 002, manually download a remix-invited gift, or, if the separately governed Commons is ever active, download a human-approved gift there.
2. At `/experiments/harmony-grove-001/crossing/`, load the JSON file locally. Verify the incoming gift and original seed hashes; if VIEW_ONLY or origin rights UNKNOWN, stay on HOLD.
3. Add *their own observation* and tune **eleven separate local creative controls**: weather, distance, human entropy, rhythm, silence, memory, chance, closeness, light, tension, return. These are **not** the founding exact-address 11×11 navigator or an authoritative mapping to its 11 founding worlds.
4. A single **Manga storyboard** adapter creates a deterministic three-panel *text storyboard*, retaining immediate parent gift hash, parent seed hash, and bounded, unverified ancestral references. No images or machine output are generated.
5. The crossing packet includes the complete original gift, local creative inputs, prepared descendant and SHA-256 integrity receipt. A verifier recomputes both parent checksums and the entire text transformation; even an attacker who rehashes a forged child cannot call the result a valid replay of that deterministic adapter.
6. Download the unsigned crossing receipt; independently choose whether to wrap the new descendant as a new gift. Export requires full-text disclosure consent. The eventual public Commons submission must be made independently, subject to a private review queue and human approval.

## Authority boundaries

- `RELATTE_INSPIRED_UNSIGNED_ONLY` is a clearly marked **proposal profile**, **not** `CrossingEnvelopeV0`/`ReceiptV0` and not cryptographic proof of personhood. There are no sender/receiver signatures, signed organ contracts, authenticated live receivers, reLATTE RECEIVE, or ADMIT events. Project ownership remains with reLATTE and any potential producer, not this experiment.
- An integrity match proves only that the bytes match their own reported digest and, for this local adapter, that the descendant's deterministic transformations replay from the supplied source and controls. It cannot authenticate a creator, publication permission, originating source or someone else's claimed ancestry.
- `VIEW_ONLY` cannot be remixed. `REMIX_ALLOWED` is still a self-declaration, not independent rights verification. No parcel is uploaded, saved to localStorage, or submitted by this route. Link navigation back to the Commons does not submit anything.
- A visitor can choose not to carry anything. The receiver has no authority to force contribution or publication.
- **One adapter is real** (Manga text storyboard). Other creative worlds are not claimed to be wired and have no synthetic content returned under their names.

## Verification

`node --test tests/giving-tree-crossing.test.mjs` verifies eleven controls, deterministic replay, parent scope, tamper refusal, refabrication refusal, descendant re-gifting and two-generation lineage. In the assembled offline copy with inherited suites, `node --test tests/*.test.mjs` passes 22/22 tests, including existing Giving Tree 001–003 tests. Browser navigation was attempted with system Chromium but blocked by the execution environment (`ERR_BLOCKED_BY_ADMINISTRATOR`); live mobile/Desktop keyboard and file-download testing remain a release HOLD. No release/prod assertions inherit from these local Node tests.

## Next gates

Browser E2E from a real allowed environment; inspect privacy, CSP, no passive egress, small-screen keyboard and downloaded parcel bytes. Independently verify the deployed Commons backend and moderation controls before enabling public submission. For genuine reLATTE interoperability, introduce a separately reviewed donor adapter using canonical JCS, proper signatures, portable CrossingEnvelopeV0, and source-owned receiver-local disposition/receipts rather than relabeling this unsigned package.
