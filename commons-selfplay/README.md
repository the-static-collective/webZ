# COMMONS SELF-PLAY 001 — World-fork rehearsal

**Browser:** `/commons-selfplay/` (served from the static webZ tree). **Test:** `node --test tests/commons_selfplay.test.mjs`.

This is a **deterministic, single-operator, local-only, fictional micro-village**, explicitly borrowing the **mechanisms**, not the game engine, of the real Minecraft Lantern world-cartridge experiments:

- `origin(seed)` makes an eight-by-eight map with twelve scripted villagers and accounted food/wood/tool stocks.
- `seal(world)` records a SHA-256 content hash on a complete independent snapshot. Hashes detect accidental mutation; they **are not signatures** or human testimony.
- `fork(parent, policy, intervention)` preserves ancestry and the parent snapshot and creates alternatives. Compare **isolated** and **voluntary commons** against the same starting world and operator event.
- `step()` accounts for produced/injected/spent/consumed/spoiled resources; it throws on conservation mismatch.
- Scripts may **refuse** to give. A shared bridge consumes separate voluntary wood and tool units and can improve reach during a simulated storm. These are code policies, **not agent autonomy, personhood or human consent**.
- Director-origin drought, storm and relief interventions remain visibly different from voluntary actions; six created relief rations are never described as community production.
- Fork from a later preserved cartridge to develop another generation; download and import a hash-checked fictional family. No backend, paid services, dependencies, live matching, credits, field activity, or GitHub/Minecraft server access.

**Three distinct claims:** (1) deterministic local code produces an output, (2) the output is a toy simulation result, (3) it does *not* show people cooperated in the world or that a live system deployed. Nothing in this lab can promote `GAME_ONLY_HOLD` into external authority.

## Contract and release gate
- Run full webZ `npm test` and browser workflow before merging.
- Verify deterministic replay from the same seed and event, independent unchanged parents, conservation, explicit non-consent, director injection accounting, limits, tampering rejection, cold import hashes, nested static routes and mobile layout.
- Preserve separately the parent PR `#253` for the smaller two-role lab; this PR is stacked on it.
- Future scoped crossing: connect a real JAR;VIS planner or independent agent policies under local review and make the resulting test artifacts replayable. Do **not** label scripted agents as trained/connected AI or issue actual signed reLATTE receipts.

## Scope limits
The Minecraft Lantern 010/011/012 whole-world saves, Mineflayer game actors, vanilla Minecraft ticks, and reLATTE receivers remain **separate** from this lightweight browser toy. The browser's board is a visual 8×8 projection; it is not a Minecraft save. Comparisons under these fixed rules do not estimate real community welfare.
