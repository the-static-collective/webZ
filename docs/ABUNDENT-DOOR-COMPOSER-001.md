# ABUNDENT DOOR COMPOSER 001 — The path is not the proof

## Working slice

A visitor can move through **one relation-aware space** instead of navigating an HTML category menu. The same particular is projected as a porch, a field, or a source trace. All three projections use the same source-backed graph; none of them changes an owner-owned artifact.

Entry: `/composer/`, with explicit entry doors in `/week/` and `/music/rooms/`.

The public field and music sources are loaded verbatim from `/field/public-field.json` and `/music/rooms/catalog.json`. The engine composes:

- ten curated **entry landmarks** (garden, field, navigator, week, music rooms, 2DAY, welcome, forage, glean, Front Room);
- all **11 source-pinned public-field worlds**, plus the field's observed inter-world relations;
- **seven published letters**, their exact Suno song IDs and two observed playlist rooms;
- track membership by **exact recording ID**, never guessed title equivalence;
- witnessed neighbor relations as distinct from authored navigation invitations.

This creates a genuine recomposable map: the center particular determines nearby possibilities, the 0–10 dial changes disclosure quantity, and the Porch/Field/Trace projection changes ordering and visual language. A visitor can deep-link to any particular, return to a prior focus, search, or follow a nearby link. Browser Back and Forward replay the hash address.

## Rules of the instrument

1. **DOOR ≠ CROSSING.** Only the explicit Enter action visits a source page. No effect is executed by focus, inspection, rearrangement, or search.
2. **PROJECTION ≠ AUTHORITY.** Modes and ranking are local interpretation, not a claim about the underlying system.
3. **MEMBERSHIP ≠ ANCESTRY.** A recording appears in a letter and playlist only where the exact Suno ID matches the committed manifest. That does not prove remixes, lineage, album creation, or authorship.
4. **OMISSION ≠ NONEXISTENCE.** A finite graph is a bounded public snapshot, not all of the Collective, all releases, or the complete network.
5. **HOLD ≠ FAILURE.** Field worlds carry their recorded state and authority summary. An unbuilt remote effect is not marked as available.
6. **THE WEB IS A PORCH, NOT THE HOUSE.** The owning source always remains the source of truth.

No user-generated artifact, consent, address book entry, signed receipt, account, payment, upload, or remote cross-world request is collected. The view address is encoded in the fragment, not submitted. Search runs in browser memory. Page fetches use same-origin public catalogs with omitted credentials.

## Release integration and why it is staged

`scripts/build-release.mjs` includes the composer source and assets in the commit-bound public release manifest. Music rooms and the seven-letter week link visitors to the new instrument. The homepage and its generated service worker are intentionally unchanged in this slice, preserving `STATIC_PATHS`, the committed offline cache, and existing 11×11 address behavior.

**The composer is not yet part of the offline precache.** A clean, offline-only first visit to `/composer/` is not guaranteed. That is an explicit implementation boundary, not a claim that a new world has been deployed. Incorporating the route into the primary landing and offline service worker is a separate follow-up, with generated artifacts and browser checks.

`npm test` includes `tests/composer.test.mjs` to cover:
- source record counts and owners;
- exact track identity across the week and playlist rooms;
- pinned inter-world relations;
- deterministic projections at every dial position;
- hash address replay and malformed address fallback;
- conservation of known HOLD states.

## Next seam

Move the composer's model into a portable organ contract with adapters (music, field, future book/story/machine source), then use the same model in Garden, workbench, and offline receiving worlds without centralizing their authority. Any discovered relation needs its own source and admission story; suggestions remain visibly speculative until independently accepted.
