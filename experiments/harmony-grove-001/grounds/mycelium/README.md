# MYCELIUM-007 — Free Graph × MEMENTO / UNDERSTORY × Living Grounds

**Status:** standalone, disabled-from-release, browser-local WebZ experiment. No public deployment, new Supabase tables, automatic attention tracking, remote MEMENTO writes, authenticated persons, or signed reLATTE admissions. This is not biological fungal simulation; mycelium is an interaction grammar for observable, attributable relationships.

## The architecture

- **Free Graph** contributes the portable `connects` relation idea, not a central truth database. Existing graph/lineage paths still belong to locally inspected Giving Tree gift packets. Proposed footpaths use GROUNDS-006's existing `webz/grounds-steward-footpath/v0` protocol and are deliberately not `descends-from` or `constitutes` edges.
- **MEMENTO** remains the sole owner of its conscious proposal/admission/ledger boundary. This site does not write to MEMENTO, change story canon, or import its private corpus.
- **UNDERSTORY** inspires six *separate*, explicit observer-local residue families: CONTACT, ATTENTION, DECODER, STANCE, ASSOCIATION, ACTIVATION. The adapter also has REST (dormancy) and RESURFACE (new occurrence referencing an old association) as local view actions, never MEMENTO-native events or inferred historical memory.
- **Living Grounds** projects active associations as optional routes in an individual observer's map; mere availability, importing a forest, reading a page, a hash match, or another steward's notebook does not create contact or attention.

## One local journey

1. Import verified original gifts or opt in to the four-gift fictional demo. The page records **zero** contact receipts merely for importing, browsing or showing an artifact.
2. Deliberately select two present works, report having considered them, explain a relation, provide a decoder and an observer stance. One explicit action records separate CONTACT/ATTENTION/DECODER/STANCE records for each work and one latent ASSOCIATION. No edge is activated by this step.
3. Choose ACTIVATE later and separately, **only while both source stances are OPEN**. An active proposed route makes the two works more conveniently navigable; it does not change their ancestry, rights, receipts or public standing. The original VIEW_ONLY remains VIEW_ONLY.
4. Choose REST to remove that route from the local navigation graph without erasing its contact history. Choose RESURFACE to record another occurrence. RESURFACE never silently implies the old observer knew what this meant, and does not activate the route.
5. Export the private notebook after explicit disclosure consent. A separate notebook from another observer is *not* merged into one numeric reputation or public score. Imported notebooks replace the current local view and never publish.

## Data and integrity

`webz/grounds-mycelium-notebook/v0` contains self-declared observer attribution, ordered event bodies, previous-event hash pointers and SHA-256 event IDs. `webz/grounds-mycelium-carrier/v0` adds an envelope checksum. 96 events and 95,000 UTF-8 JSON bytes max. Each event is checked for shape, chronology, and valid state transition. Older event bodies remain immutable when a later event changes how an observer attends to a relation. The carrier preserves only addresses and observer notes, not full source gift text; originals must arrive separately through Forest Walk. Export can still reveal sensitive notes and which works an observer examined, so it must remain opt-in and local by default.

**Limitations:** A self-authored checksum chain can be recomputed. It checks structural integrity, not truthful encounter, authenticated identity or non-repudiation. The system does not claim that all six events reflect independent real-world witnesses—only that the user intentionally recorded those categories. This is neither a drop-in implementation of MEMENTO's UNDERSTORY schema nor an authorized bridge into its private ledger. The site offers no global person model, durable cloud storage, automatic discovery, decay, ranking, scoring or shared hive.

## Laws

`AVAILABLE != CONTACT` · `CONTACT != ATTENTION` · `DECODED != ACCEPTED` · `REJECTED != FALSE` · `RESURFACED != PREVIOUSLY KNOWN` · `ASSOCIATION != ANCESTRY` · `TRACE != MEMORY != CANON` · `PROXIMITY != CONSENSUS` · `PRIVATE NOTEBOOK != PUBLISHED COMMONS` · `LOCAL CHECKSUM != SIGNATURE`.

## Tests and release boundary

From the assembled WebZ source: `node --test tests/*.test.mjs` (51/51 passing at first authoring). `node --check` the new ESM modules, and `node scripts/sync-giving-tree-shared.mjs --check` to preserve the Commons shared adapter. Static preview from a local web server at `/experiments/harmony-grove-001/grounds/mycelium/`.

The new route remains excluded from WebZ `STATIC_PATHS`, immutable release export, fixed service worker cache, and Vercel production. Browser/device E2E, accessibility, privacy review, withdrawal/deletion semantics for any future public sync, WAF/rate limits, and the separate moderation gate **must** be independently witnessed before any public activation. Existing user-controlled production at abundent.org stays unchanged.
