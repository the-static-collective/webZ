# webZ — GENESIS-001: The First Two Worlds

**Status:** Design proposal — human review required before implementation.  
**Date:** 2026-10-06  
**Owner:** `the-static-collective/webZ`  
**Origin:** Human instruction to build "our own wwwz layer," following the illustrated STORYSHIP Phase 01 experiment and approval of the WEBZ-DOOR-001 idea.  
**Method:** Superpowers architectural design; Riqor software architecture and evidence boundaries.

> **The Web connects documents. webZ connects inhabitable worlds.**
>
> **A hyperlink goes somewhere. A portal declares what may travel, and the traveler chooses whether to cross.**

## 1. The intended outcome

Build a **local-first, independently addressable world-linking layer** which can open worlds made by the Static Collective or others. The first witness must link two small authored worlds from STORYSHIP Phase 01: **Psychedelic Punk Sanctuary** and **The Orchard / 022100**. A person should be able to discover a doorway, elect to cross, see what was proposed to travel, reach the destination, return, and reconstruct the voyage after a browser restart.

The traveler is a person, not an account object owned by webZ. Narrative is navigational interpretation, not verified history. The worlds retain their own admission and consequence rules.

### Inputs and known facts

- `the-static-collective/webZ` exists and was empty when inspected for this genesis. This document must not invent prior implementation.
- The previous **STORYSHIP Phase 01** is a ten-scene offline-first HTML prototype built from nine manga pages supplied by the human. Its local browser log uses `storyship-phase1-voyage-local/v1`; that log is *not* the canonical STORYSHIP voyage ledger.
- STORYSHIP owns its own immutable voyage records, human steering and interpretation boundaries. Its founding constitution and Haunted Phonography customs are not changed by this work.
- A reported LIFE-CONVERGENCE-001 result is neighboring operator testimony; webZ does not adopt that report as a verified source without its own source cut and proof reference.

### Design assumptions for review

For Genesis-001, "our own WWW layer" means **our own addressing, portal and portable-voyage model above standard browser/HTTP infrastructure**, not a custom network stack, top-level domain, browser extension or registered URL scheme. The first worlds will be separate web documents on one ordinary static origin so we can reliably test navigation with no backend. **Same-origin documents do not provide a security isolation boundary:** both are trusted first-party code; untrusted third-party worlds are out of scope until distinct origins or equivalent sandboxing exist.

## 2. Architectural approaches and decision

| Approach | What it proves | Sacrifice |
| --- | --- | --- |
| A. One big single-page app, each room a route | Fast immersive demo | The worlds are not independent. The apparent "crossing" is one app changing screens. |
| **B. Two separate static worlds + a tiny resolver + explicit portable trace (chosen)** | World identity, true addressable boundaries, human-mediated crossing and return, deterministic receipts | The first version lacks real cross-origin autonomy, network discovery, authentication and live sync. |
| C. New protocol / custom browser / peer mesh | Eventual broad sovereignty and deep transport control | Premature protocol/security/deployment commitments before proving a single useful door. |

**Decision:** Choose B for WEBZ-DOOR-001. The architecture may later adopt signed manifests, alternative transports and distribution, but the first proof must fit in two documents, a small library, deterministic fixtures and tests.

## 3. Domain and owners

webZ owns only:

1. **Logical world addresses** and the mapping to a resolvable browser entry.
2. **World/door declarations**, with explicit source and version.
3. **Traveler-visible crossing proposals** and an optional portable local voyage record.
4. **Read-only atlas/return navigation**, with unresolved failures preserved.

webZ does **not** own the human's identity, a world’s creative canon, STORYSHIP's event ledger, GHoT's capabilities, reLATTE's crossings, SupaBardo's unresolved release/arrival state, or destination-local HOLD / REFUSE / ADMIT.

### Founding invariant table

| Claim | Rule |
| --- | --- |
| World ≠ page | A world is a distinct owner-described place with an address and doors. A web page is one renderer. |
| Address ≠ existence | Resolution of a locator does not prove a world is healthy or canonical. |
| Discovery ≠ entry | Displaying a portal does not navigate automatically. |
| Entry ≠ authority | Visiting a world cannot admit, authorize or control a person or another world. |
| Carry offer ≠ carry | A portal may ask to carry a trace; only an explicit traveler action can permit it. |
| Transport ≠ admission | Arriving at a destination is not the destination's acceptance of imported claims. |
| Narrative ≠ observation | Story text never rewrites the original event or becomes evidence through repetition. |
| Local record ≠ STORYSHIP canon | Browser history is local witness, not a STORYSHIP or reLATTE receipt. |
| Similar appearance ≠ shared identity | Distinct worlds and branches remain distinct even with identical renders. |

## 4. The smallest addressable world

The logical address grammar for Genesis-001 is **a label inside a manifest**, e.g.:

```text
webz:the-static-collective/sanctuary
webz:the-static-collective/orchard-022100
```

This is **not** a browser-registerable `webz://` protocol. Clicking a door resolves to an ordinary **relative or HTTPS URL**. In the first same-origin fixture (shown relative to the **site base**, not the origin root; GitHub Pages project paths must work):

```text
/worlds/sanctuary/
/worlds/orchard/
```

The manifest declares the mapping rather than deriving network authority from the string.

A minimal `webz/world/v0` JSON document:

```json
{
  "schema": "webz/world/v0",
  "world_id": "webz:the-static-collective/sanctuary",
  "revision": "genesis-001",
  "title": "Psychedelic Punk Sanctuary",
  "entry": "./index.html",
  "doors": [
    {
      "door_id": "sanctuary-to-orchard",
      "label": "Follow the orchard light",
      "to_world_id": "webz:the-static-collective/orchard-022100",
      "to_entry": "../orchard/",
      "default_carry": "none"
    }
  ],
  "origin_note": "Fictional scene interpreted from user-supplied manga; not a claim of historical occurrence."
}
```

A symmetrical orchard manifest has its own `world_id`, entry and return door. Door IDs are unique within a world. The world declaration is author testimony, not verified content provenance or a signature.

### Resolver contract

- Reject unknown schemas, duplicate world IDs, duplicate door IDs, missing required fields and malformed manifest data.
- Reject `javascript:`, `data:`, `blob:`, script injection strings as destinations, protocol-relative `//` and URLs outside the explicit allowed static base for Genesis-001.
- Resolve declared relative links against a known base; make no background redirects.
- Display the destination world ID/title, manifest source, and carry mode before departure.
- If target is missing, present **UNRESOLVED / HOLD** with a return control; never invent successful arrival.
- Opening a path does not automatically import its claims or the origin world's values.

## 5. A first crossing, A → B → A

```text
[A] SANCTUARY (own manifest, own world ID)
    visitor sees door → chooses INSPECT
    portal displays: origin / destination / declared carry / unknowns
    traveler presses CROSS (or REMAIN)
    browser opens ordinary destination URL
                    |
                    v
[B] ORCHARD (separate page, independent manifest)
    browser visibly confirms destination world
    webZ records an "arrived" local navigation observation
    destination has its own doors and may decline any offered trace
    traveler chooses RETURN
                    |
                    v
[A] SANCTUARY
    earlier A and B entries remain attributable
    page reload + cold browser reopening can reconstruct the same itinerary
```

**Do not encode private helm notes, memories, access credentials or other sensitive payloads into query strings, fragments, referrers or implicit `postMessage` handshakes.** Even URL fragments can be captured in history, screenshots and client telemetry. For Genesis-001, the default carry is **none**. The permitted optional carry is a **non-sensitive, traveler-selected voyage summary** explicitly reviewed on-screen, held in same-origin local storage or manually imported/exported as a JSON file. Both first-party worlds can access same-origin local storage, so it cannot be used as a secret vault or an inter-world security boundary. No sensitive notes are written into the shared voyage store. A future untrusted-world experiment requires origin separation.

A destination can display a received proposal. Only the receiving owner can constitute destination-local authority. "HOLD" in webZ's local navigation UI is not a claim to be reLATTE/SupaBardo HOLD; use distinct namespaced statuses and explain them.

## 6. The voyage trace (local, not canonical)

An append-only local navigation transcript uses `webz/voyage-local/v0`. Minimal fields for each occurrence:

```json
{
  "seq": 2,
  "kind": "arrived",
  "from_world_id": "webz:the-static-collective/sanctuary",
  "to_world_id": "webz:the-static-collective/orchard-022100",
  "door_id": "sanctuary-to-orchard",
  "carry_mode": "none",
  "basis_departure_seq": 1,
  "authority": "browser-local-observation"
}
```

Events are append-only and sequence-ordered. Replaying a sealed sequence gives a deterministic projection. Do not use wall-clock timestamps, physical location or model summaries to decide identity or authoritative event order. A human may export/erase the private local record. A corrupted or partially missing log produces an explicit unavailable state and an opportunity to export the raw record, not a silently repaired historical narrative.

Versioned exports must include the schema, exact included event sequence, and scope disclaimers. Any SHA-256 checksum is a **content-integrity aid**, not a signature, author identity proof or source attestation.

### Cold replay definition

An independent fresh process or fresh browser instance consuming the *same exported fixture bytes* must produce an identical canonical itinerary projection. A reload of the same browser reading its persisted local events is a separate operational test. Test both; do not conflate them.

## 7. User experience: two authored rooms, one door between them

First screen: a scene-led, readable Sanctuary entry that draws on the STORYSHIP visual language (night, music, glowing fruit, welcome). Door treatment should feel **physical**—a labeled threshold and a visible destination—rather than a generic nav menu. Orchard should be independently legible (the table, blue rose, `022100`, bus marked PATH ALL HOME).

The GUI shows **current world**, **available doors**, **what would carry**, and **local voyage log**. The traveler can always choose REMAIN, RETURN or ERASE. Color and decoration must not obscure the distinction between a real recorded action and fiction. Provide keyboard navigation, visible focus, legible contrast, reduced-motion fallbacks and responsive mobile sizing.

**Asset rights / publication:** The chat's nine supplied manga pages are evidence of user-provided visual material, but their exact redistribution licensing for a public repository is not established here. The first executable specimen uses reversible CSS art placeholders or locally supplied opt-in assets. Do not silently publish the image bundle to a public repo. Support a later asset binding with provenance and confirmed publication scope.

## 8. Boundaries to neighboring systems

- **STORYSHIP** supplies optional read-only narrative context; webZ must not promote a `storyship-phase1-voyage-local/v1` log to canonical STORYSHIP events. Future crossings require explicitly mapped owners and schema versions.
- **STATIC OS / Static Workbench** may render webZ atlas and portal cockpit, but cannot secretly select a destination.
- **reLATTE** may later supply signed crossing envelopes when both worlds opt in; not required for Genesis-001.
- **SupaBardo** may later carry released-but-not-yet-constituted parcels; never equate a broken browser link with a formal Bardo crossing.
- **TranchNode / TranchNOSE** may assist memory and causal questioning, but retrieved evidence and inferred causality cannot grant entry.
- **LIFE / JUBILEE / GHoT** may create or host playable worlds and capabilities without auto-admitting their products here.

No new foundational dependency may block the first door's offline/local launch.

## 9. Acceptance proof: WEBZ-DOOR-001

The first executable implementation is complete only if tests and an inspected browser run show:

1. **Two independent world manifests and entry documents**, with distinct logical IDs and discoverable doors.
2. **A → B → A** through explicit choices, with no automatically executed crossing.
3. **No-carry default** and inspectable, explicitly gated optional non-sensitive summary.
4. **Scope-correct browser-local receipt** on departure and arrival; no destination authorization or STORYSHIP provenance falsely claimed.
5. **Cold replay**: identical canonical itinerary across fresh-process runs from the same exported events; history survives ordinary browser reload.
6. **Negative cases**: unknown destination, rejected scheme, invalid manifest, malformed/corrupted local log, browser storage denied, attempted transfer of protected/sensitive notes, and a nested GitHub Pages-style base path.
7. **Static, no-spend execution**: no login, cloud backend, third-party API, undocumented browser extension or special protocol handler.
8. **Usable interface**: responsive desktop/mobile, keyboard focus, readable labels, visible return/erase and reduced motion.
9. **No silent adoption**: textual narrative, a LIFE sibling, or a foreign crossing receipt cannot become owner-local authoritative state merely because a portal displayed it.
10. **Publish proof**: reproducible run commands, a frozen fixture, browser screenshots/evidence and a concise known-limitations report. Do not claim browser validation based only on unit tests.

## 10. Expected future implementation shape (not yet written)

```text
README.md
docs/superpowers/specs/2026-10-06-webz-genesis-001-design.md
docs/superpowers/plans/2026-10-06-webz-door-001.md       # after spec approval
src/manifest.mjs           # schema and safe resolution
src/voyage.mjs             # browser-local record / pure replay
src/portal.mjs             # proposal + human gate
worlds/sanctuary/index.html
worlds/sanctuary/world.webz.json
worlds/orchard/index.html
worlds/orchard/world.webz.json
worlds/shared/styles.css
fixtures/webz-door-001/voyage.json
test/manifest.test.mjs
test/voyage.test.mjs
test/portal.test.mjs
test/reentry.test.mjs
package.json               # Node >=22; no runtime dependencies initially
```

The final file map is decided during the implementation plan, not smuggled into the spec as completed code. Small modules, one-way dependencies, and deliberate failure states are preferred over an abstract federation framework.

## 11. ADR-001 — Two static worlds before a new network

**Status:** Proposed.

**Context:** STORYSHIP Phase 01 proves an inhabitable single-document narrative world. It does not prove addressable autonomous worlds or an accountable boundary between them.

**Decision:** Implement manifest-declared logical world IDs, two independent static browser documents, human-gated portals and a local reproducible voyage trace above ordinary URLs.

**Consequences:** Easy offline proof, portable artifacts, understandable failure handling, no hosting bill. Federation, multi-origin claims, network trust and cryptographic identity remain future work. Logical world IDs do not establish authority, and localStorage is not secure cross-origin storage.

**Evidence required to promote:** Passing negative-gate tests, a real A→B→A browser witness, cold replay, and owner review of the resulting PR.

## 12. What Genesis-001 intentionally does not solve

Global naming; contested world identity; federation governance; cryptographic world authorship; private encrypted carry; reliable browser-to-browser peer transport; access-control identities; formal reLATTE/SupaBardo execution; true multiplayer; autonomous agent entry; equivalence between fictional travel and physical movement. Those are legitimate later questions, not gaps to pretend completed in Phase 1.

### Founding summary

> **A world gets an address. A door gets a contract. A traveler gets a choice. A crossing gets a trace. No one inherits authority by arriving.**

**Next gate:** human reviews this written spec; after approval, use Superpowers `writing-plans` to prepare the executable plan. Only then choose an execution method and write runtime code.
