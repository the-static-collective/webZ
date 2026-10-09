# STATIC-WEB-002 — the field moves

The browser reads a committed admitted snapshot. It never discovers repositories or calls their APIs. Current means current as of an explicit census, not eternally current or live-polled. Historical claims remain historical observations.

## Separate doors

1. **Fragment** — a source-specific observation, not a public entry. This census contains 34 fragments describing 17 subjects. The inspected contract bytes are committed alongside explicit local input paths and checked against SHA-256. Source level is CONTENT_ADDRESSED. No donor execution or independent replay is claimed. OPEN / MERGED / CLOSED, head branch and base branch are retained separately; neither merge nor CI establishes deployment. GHoT #113 is Riff Raft, not postal work. CANNON contracts do not masquerade as issued discovery receipts.
2. **Census** — consumes only the explicit local inputs. It preserves multiple observations of one subject, without choosing the latest commit as authority. It can issue neither admission nor a public door. CLI: `npm run field:census -- census/static-web-002/inputs.json [previous-snapshot.json]`. Stdout is deterministic; there is no default discovery path, API client, title scraper or private-chat reader.
3. **Delta** — compares an admitted snapshot with the census. It classifies observations, not merit. The founding comparison has 15 NEW_CANDIDATE subjects, one SOURCE_UPDATED set (reLATTE VM), one UNCHANGED pin (Radio World), and nine NOT_REOBSERVED founding subjects. Founding entries have no fragment-format baseline: the first comparison conservatively reports source-set changes rather than inventing finer capability/HOLD comparisons. Later snapshots retain fragment baselines and distinguish capability, door, closure/HOLD and relation changes. Explicit withdrawal observations still require separate public review; this release admits no withdrawals.
4. **Human admission** — an operator-supplied record binds exact field wording, states, exposed doors, closure reasons, relations, tags and observation-only paths to a census and selected fragments. The review identity covers that complete payload. The authority reference records actual human review; it is an attributed editorial record, not a cryptographic person signature or source-owner authorization. The census has no admission-issuing function. Hash integrity cannot establish that a person is honest or authorized. The executable profile permits no LIVE or open remote effects, even with an admission record.
5. **Snapshot** — a content-addressed immutable descendant binds field identity, parent, census, admitted fragments and admission. `field/current.json` is only an explicit pointer. A different pointer does not make the older snapshot false or less authoritative.

[Executable validators](../app/field-lifecycle.mjs) are the authoritative cold-verification contract; [structural schemas](../field/contracts/) describe the JSON surfaces. The legacy `inspection-only-001` field representation remains inside each snapshot, with all original authority refusals. Moving-field laws and provenance wrap it instead of rewriting the founding contract.

## Founding preservation and replay

`field/public-field.json`, `field/source-observations.json` and `field/public-field-receipt.json` retain their original bytes. Their original canonical field identity is `sha256:d3fa28fa3e1e2d2e370287422242fc8eab3c0362e27b61f54d0392430f8e21d1`.

The founding snapshot uses an explicit legacy envelope: its identity is the original field-manifest hash, not a newly invented wrapper hash. Its complete envelope is reconstructed from the frozen field and observation files and compared exactly. It has no retroactively invented census, fragment or human-admission record. Descendants use `webz/public-field-snapshot/v0`, whose snapshot hash covers the entire canonical body except its own hash. Field hash and snapshot hash are distinct and both are reported. No wall-clock generation timestamp affects their identity.

`npm run field:replay` independently rebuilds the census/delta, reconstructs the founding envelope, validates the supplied human admission and replays the descendant. It checks committed immutable files, pointer, HTML, provenance and cache allowlist. `npm run field:verify` also verifies the complete byte-versioned worker and every fixed asset. Existing immutable snapshot/admission files cannot be overwritten with different bytes. Receipts authorize nothing.

## A person finds doors

`/field/` offers LISTEN, MAKE, BRING, SEND, WANDER, PROOF, BUILD, MACHINES and PRINT. Intent tags are part of the admitted payload. Results stay in field order and explain the matched effect class plus chosen intent. Search uses admitted card/door text only. A closed matching door remains visible; print can end at authenticated real-machine / owner admission HOLD.

All choices stay in page memory. There is no persistence, profiling, telemetry, relevance score or transmission. Search text never enters URLs. Deep links use admitted IDs (`#radio-world`) or bounded intent enums (`#intent-print`). A hash change back to a card restores the complete field, so a shared card is not hidden by an earlier filter. Without JavaScript all human cards and native provenance details remain readable.

Paths bind existing doors and exact admitted relation keys. The media-neighbor path means an observed relationship, not compatible execution. Physical design, slicing and proposal stages are attributed to the existing composite fabrication card; no new cross-owner compatibility is inferred. PATH != CROSSING. PATH != EXECUTION.

`/field/changes/` shows public representation changes. `/field/history/` retains a human-readable founding page and both immutable machine-readable snapshots. A future read-only inspection client can inspect the snapshot without scraping HTML; this release runs no MCP server or connector.

## Public cache and static export

The service worker caches a fixed first-party public allowlist only. It includes admitted snapshots, admission records, changes/history pages and local filtering modules. It does not cache census inputs, source-contract input files, review proposals, private files, arbitrary requests, search URLs or third-party destinations. Fragment identifiers in an admitted snapshot are public; unrelated candidate fragments are not cache assets.

Use `npm run field:export -- /absolute/empty/directory` to copy the verified public allowlist and worker into a host-neutral release directory. Publish only that directory if hosting is later authorized. Do not publish the repository as a directory tree: it includes build-time census/review inputs. No deployment is performed by export.

The existing [hosting readiness](STATIC-WEB-001-DEPLOYMENT-READINESS.md) still applies: HTTPS (except loopback development), root/nested scope, strict CSP, correct JSON/module MIME, real 404, atomic complete-release update/rollback and no secrets. Revalidate worker, pointer and mutable shell files; immutable hashes may have long-lived host cache headers. Successful worker bootstrap fills a new byte-versioned cache before activation and removes stale same-scope caches. URL fragments identify local views of fixed routes, while query-bearing requests remain outside the cache. Cold offline bootstrap remains impossible; offline history/search/wayfinding follow successful bootstrap.

## Review boundary

The concrete [public review](STATIC-WEB-002-PUBLIC-REVIEW.md) is separate from implementation readiness. Candidate observation does not approve public wording. Synthetic test/preview admissions exercise verification and are never copied into the production field or recorded as human approvals.

Next aperture: watch a person follow a matching door to HOLD and ask which precise owner admission they expected next. That encounter can reveal a missing explanation, an observation that needs re-census, or a useful return path. It does not preselect deployment.
