# WEBZ 009 — the two TranchNodes (code-only fossil gallery)

This is a separate, undeployed webZ branch. Public page: `/lineage/`; the webZ home nav points there in the experiment checkout.

The bundled `lineage/source-index.json` is a **static source-code index** copied from the shape of CANNON 015's public-code-only output. It is NOT a live cryptographic receipt or automatically synchronized artifact: it records source commit identifiers, declared roles and static enum labels, not mutable backend activity.

It names:
- `the-static-collective/tranchNode-v1` @ `c1ab651e55f85d9f13551c89c1de39097d6b16a4`: the historical Autodiscography / digital porch application schema.
- `the-static-collective/tranchnode` @ `7fbb0c868befd5f6a7478bdd0447477a0e8e075e`: source of immutable exact-byte artifact storage.
- `the-static-collective/project0` @ `08f892eb379ef538cce5b3ca081ecf683b448a4b`: source of semantic continuity with explicitly unresolved authority.

The CANNON experiment that independently inspects the two TranchNode source trees, stores a synthetic **PRIVATE** archive in the modern native artifact-store, runs original Project0 continuity and locally signs reLATTE R14 HOLD is [CANNON PR #22](https://github.com/the-static-collective/CANNON/pull/22). The WEBZ page does not authenticate that result; it only presents fixed public source code knowledge.

## What users can inspect

The three named source commits and their separate roles; a description of the historical album/porch/annotations data models and the four originally declared TAO annotation labels; exact public repository commit links.

## What is deliberately impossible

Uploading any private album, lyric, song, archive, export or foreign-seed payload; seeing record counts, personal record fingerprints/hashes, owner IDs or tokens; claiming public consent or authority; using a live remote backend; admitting a new world or granting a crossing.

The page makes exactly one same-origin static JSON fetch and uses textContent to render source titles and descriptions. The service worker caches only this fixed public index and HTML/CSS/JS. No private artifacts are served, indexed, cached or transferred.

The fixed `inspectPublicLineage` function accepts only one source-code index layout, pinned to three exact commit digests. It fails closed if unknown fields, sensitive additions or false release/authority bits are supplied. Tests cover hostile additions and the offline-cache boundary.

## What this does *not* yet solve

A real owner-directed local export/review UI on Abundent would require a separate private-device or authenticated local application. Native TranchNode storage is a local Node filesystem capability and cannot be replaced by a service-worker cache or a static HTML page. Public archive publication would require explicit human content selection, consent, and independent receiving-world admission.

**SOURCE CODE != HISTORICAL EVENT. PRIVATE BYTES != PUBLIC INDEX. SIGNED LOCAL HOLD != LIVE WEBSITE.**
