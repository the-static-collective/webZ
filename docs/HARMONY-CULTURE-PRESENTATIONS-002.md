# HARMONY CULTURE PRESENTATIONS 002 — One doorway into the whole thing

**2026-10-29.** Public-source-linked, browser-only presentation composer. **Not a verified end-to-end integration**, a formal partnership, a grant acceptance, an installation, a finished film, an authorized book release or a field outcome.

## What is implemented

The static `/bridge/harmony/presentation.html` page generates a **14-scene presentation** for each of the eight mission profiles already admitted in HARMONY-001 (food, fellowship, campus, festival, care, farm, civic, founder). It begins with that institution's specific question and one existing useful instrument; then reveals the whole ecosystem: starting/founding, locally confirmed action, music, visual art, publishing, source and memory, runtime, circulation. It prints to paper/PDF through the browser and exports a public-safe JSON candidate.

The checked-in `bridge/harmony/culture.mjs` catalog explicitly labels 40 project/source surfaces. Its `culture-presentation.mjs` module exports `composeCulturePresentation(profileId)` and `cultureIndex()`. The files are static ES modules, need no external API, collect no identities, upload no questions and work without Vercel. `apps/build.mjs` already ships the whole `bridge/**` tree in the independent static bundle. A URL path is not proof that a recipient organization is participating.

## Why this belongs in a presentation

The whole is strongest as a **cultural production ecology**, not a pile of AI product demos:

`ACTUAL QUESTION → VOLUNTARY FOUNDING / COMPOSITION → OWNER-APPROVED ACT → CREATIVE EXPRESSIONS → SOURCE-AWARE PUBLICATION → RECEPTION / REINTERPRETATION → ATTRIBUTABLE RETURN → INDEPENDENT DESCENDANTS`

A local useful act can become a song, short film, photo set, manga-like sequence, printed guide, performance, playable world or teaching practice **if** its authors, hosts and recipients choose. The expressive work is not ancillary advertising; it is one of the means by which people actually pass cultural knowledge forward. The receiving community remains an author and can refuse or adapt the method.

## Evidence, no claim laundering

- **Haunted Toaster:** repository describes source-aware six-up creation and a proposed BETA reconciliation; do not advertise an unmerged BETA release as shipped.
- **Haunted Phonograph:** source music becomes evidence-tagged proposals and resolved playable performances; distinct from Toaster's video.
- **Haunted Pol-ish-roids:** README calls it **design/specification**, not a tested production camera organism.
- **Haunted Blender:** main currently contains only `.gitignore`, but the advanced, **unmerged** [FRANKEN BLENDER 008g branch](https://github.com/the-static-collective/the-haunted-blender/tree/integration/franken-blender-008g-cutout-puppet-factory) carries tested local puppets, media pipelines and downstream work. Source link explicitly points to that branch; no merged/released full app is claimed.
- **Manga/sequential panels:** a creative lane; private/source-held work is **not copied to public Git** or presented as a verified executable repo.
- **PlayDeck:** project-described visual deck runtime; no assumed rights over contributed media.
- **lemonPRESS:** real catalog and admitted multi-edition specimen; proofs and source rights remain different from public distribution.
- **Band Runtime / Groove Rooms / Static Live:** different authorities (event kernel, room interface, stage projection); no claim they all automatically interoperate live.
- **Autodiscography Vault:** bounded personal preservation; no corpus mirroring or distribution rights.
- **WORLDSEED / HOUSE / Founder Node:** advanced branches may contain real tested work but remain **unmerged**; these are not part of a deployed public culture-generation platform.
- **Project0 / MEMENTO / STORYSHIP / reLATTE:** continuity, local admission, non-erasure and portable ancestry; they are independently authored modules, not universally installed service dependencies.
- **GHoT / STATIC OS:** GHoT has local-body and LAN prototypes; STATIC OS does not have a verified bootable OS/installed house.
- **Commons / Garden / Full Measure:** code and synthetic loops; real-world permissions, actual outcomes and independent confirmation require a field trial.
- **Source Map:** a dated visibility snapshot; source-owned current status overrides map editorial placement.

Every public entry links to a project-owned GitHub README. Entries without a publicly verified source explicitly say so. **No private Drive bytes, names, media, legal records, survivor stories, house addresses, correspondence or credentials are imported.**

## One strong pitch, many first questions

- Food access: one accountable handoff and an optional printable/creative method.
- Fellowship: one optional music-and-meal night with independent venue and artist consent.
- Campus/MIT: two local devices, one independently reviewed test, an expressive explanation and reproducible source trail.
- Festival: one permissioned live encounter, transparent stage roster, optional community kit.
- Care: one anonymous fictional help question with no dossier.
- Farm/co-op: one provider-neutral, bounded proposed handoff.
- Civic host: one paper-first question with optional voluntary community storytelling.
- Founder: self-attested independent room, one creative output and an independently inherited method.

**This is a presentation and source-linked catalog, not the asserted automatic implementation of all those pipelines.** Genuine next work is owner-selected source inspection, permissioned adapter proof, published cultural output with rights and a separately confirmed bounded human outcome.

## Verification

`node --test tests/harmony-culture.test.mjs`, `npm --prefix apps test`, `npm --prefix apps run build`. CSS print exposes all slides while screen navigation shows one at a time. No analytics, fetch or remote side effects occur in the deck.
