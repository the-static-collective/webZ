# GIVING-TREE-005 — Forest Walk (local-only)

This is a stacked experiment after Giving Tree 004 Crossing Tent. It is **not on abundent.org**. The route is excluded from `STATIC_PATHS`, Vercel immutable release and fixed worker cache. No public discovery service, account, signature, canonical reLATTE receipt, server admission or automatic creative producer is claimed.

## Visitor journey

1. Enter freely and plant an explicitly **fictional** four-work demo, or import separately received Giving Tree 002 `.json` gifts.
2. Select nodes on the scrollable map or in its accessible linear list. Follow parent and descendant buttons. URL `#gift=<sha256>` names an item in this session only; it does not make content available on a server.
3. Inspect the complete original text, declared creator, scope and parent/seed hashes. A parent missing from imported packets stays `UNSEEN_PARENT`, never synthesized.
4. Download one gift and choose to import it into the separate Crossing Tent if its verified-local packet and declared remix scope permit it. Forest selection itself does not transfer, compose or publish.
5. To carry all branches to another device, explicitly consent to exporting all text and attribution, then download a SHA-256-bound local collection. Reimporting verifies the collection and each gift independently.

## Authority and graph boundaries

- Each node contains a real, locally inspected GIVING-TREE-002 gift packet. A checksum only says these bytes agree with a carried checksum; self-declared attribution and rights have **not** been authenticated.
- A **LOCALLY_MATCHED_REFERENCES** path is drawn only when both parent and child bundles are present, the child's immediate parent gift and seed hashes match, and the parent's observed declaration is REMIX_ALLOWED. This is not proof of historical causation or underlying rights.
- Missing parents, conflicting seed references, view-only parents, cycles and malformed inputs do not make edges. The `ancestors` list is displayed as an unverified count, never used to manufacture connections.
- All files stay in the browser tab unless deliberately downloaded. No automatic fetches, storage, telemetry, third-party scripts, accounts, upload or publication. Up to 40 bundles (32 KiB per gift) and 1.5 MB per collection file. Invalid imports are atomic: the prior forest remains unchanged.
- The independent founding 11×11 catalog and creative eleven-dial rack retain their own contracts. This map does not admit gifts into reLATTE. Commons 003 publication still demands separate human review and a deployed gate; neither is active here.

## Verification and release HOLD

`node --test tests/*.test.mjs` passes 31/31 tests on assembled 001–005 sources, including nine new forest cases: siblings, grandchild, deterministic graph/layout, missing ancestor, contradictory parent seed, VIEW_ONLY parent, atomic rejection, checksum roundtrip, duplicate rejection and capacity. `node scripts/sync-giving-tree-shared.mjs --check` passes on the assembled source.

Preview under a local static server, e.g. `python -m http.server 8080`, at `/experiments/harmony-grove-001/forest/`. Browser E2E was attempted but the runner blocks localhost with `ERR_BLOCKED_BY_ADMINISTRATOR`. Independent mobile, keyboard/screen-reader, download/reimport, CSP/offline and production release audits **remain unwitnessed**. Do not merge/promote into the immutable public export until these complete.
