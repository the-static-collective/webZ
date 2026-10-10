# GROUNDS-006 — The work makes the world; attendance tends its paths

**Status:** local-only, opt-in research experiment. Not present on abundent.org, not within WebZ's shipped `STATIC_PATHS`, immutable release export, worker cache, or public Commons backend. The GROUNDS-006 scene is a projection of the Forest Walk's checked locally carried gifts, **not** ownership of the source or a canonical reLATTE crossing.

## The two distinct engines

1. **Particular → place.** Every gift in the current, locally checked Forest Walk becomes exactly one paper pavilion. The existing `forest/contract.mjs` owns ancestry verification: parent and child hashes must match; VIEW_ONLY parents cannot be silently treated as remix authority. Failed, missing and contradictory parent references remain explicit; nothing is fabricated. A map does not represent songs, games or images that do not exist in the packet.
2. **Deliberate attending → footpath.** An observer chooses *two distinct present artifacts*, a typed relationship (`RESONANCE`, `USEFUL_ALONGSIDE`, `QUESTION_BETWEEN`, `CONTRAST`), and writes a bounded explanatory note. A local, content-addressed `UNREVIEWED_LOCAL_ASSOCIATION` proposal adds a **dashed** navigational connection. The reversible local lens gently pulls its endpoint positions closer along X but never changes ancestry depth (Y). A route may shrink from two lineage hops to one voluntary footpath.

No passive attendance, visits, reactions, impressions, likes, or duplicate pair proposals build this map. One pair gets one local association, with no attention weights, metrics, reward, score, reputation or popularity ranking. Duplicate proposal ≠ independent agreement; checksum ≠ identity. A local visitor can remove a proposal without changing its source gifts. A proposal is always visibly distinguishable from `LOCAL_PARENT_MATCH`.

## Inputs and outputs

- Import one or more 32-KiB `giving-tree-local-gift/v0` JSON packets or a checked 1.5-MB `giving-tree-local-forest/v0` collection. The optional demo includes four explicitly fictional works.
- Author or inspect a small `webz/grounds-steward-footpath/v0` object with exact endpoint gift SHA-256 hashes, relation type, bounded note and self-declared keeper. Its own SHA-256 protects the downloaded bytes against accidental or undetected modification; it is **not** a signature.
- Download or import a detached `webz/grounds-local-attendance/v0` notebook (max 48 relations, 48 KiB); notes and keeper names are included, so exporting requires an explicit checkbox. Imported references to gifts not present locally are kept on `ADDRESS_NOT_PRESENT` HOLD and never generate phantom places or routes. Invalid imports leave prior state intact.
- Follow links via visible clickable landmarks, keyboard-operable site list and neighboring links. Compare shortest number of hops before/after a tended path. Download original gifts separately; never auto-publish or send their contents.

## Constitutional boundaries

`PARTICULAR ≠ TERRITORY` · `ASSOCIATION ≠ ANCESTRY` · `PROXIMITY ≠ CONSENSUS` · `LOOKING ≠ STEWARDSHIP` · `STEWARDSHIP ≠ LICENSE` · `PUBLICATION ≠ RENDERING` · `CHECKSUM ≠ SIGNATURE` · `LOCAL VIEW ≠ reLATTE ADMISSION` · `GROUNDS MAP ≠ CANONICAL 11×11 NAVIGATOR`.

The active footpath is a local curation proposal, not a verified relationship. It can juxtapose a `VIEW_ONLY` work for reading but **cannot** grant derivative use or alter the original gift's permission. A curator cannot force another visitor to adopt their notebook. A withdrawn work cannot be republished by displaying a cached copy; this local experiment does not query public withdrawal state and must not be presented as an up-to-date public commons. Before a real public rollout, independently define consent, moderation, account/capability scope, rate limiting, rights and removal, multi-party curation conflicts, and how references to withdrawn or private works degrade without leakage.

## Verification and release gate

Run `node --test tests/*.test.mjs` from the assembled WebZ source. `tests/grounds-stewardship.test.mjs` checks ten new cases: sites from real packets only, reduced hop-distance, spatial pull, deterministic ancestry depth, no vote farming, lineage/nonremix separation, checksum tamper rejection, deterministic projection, held missing endpoints, detached notebook export/import, and no invented route. Static browser preview: `python -m http.server 8080`, then `/experiments/harmony-grove-001/grounds/`.

The hosting environment used for prior WebZ browser tests blocked navigation to localhost; a proper independent browser/mobile/keyboard/written accessibility witness, static-export review, CSP and rollback verification are mandatory before merge/promotion. Production is not changed by this branch.
