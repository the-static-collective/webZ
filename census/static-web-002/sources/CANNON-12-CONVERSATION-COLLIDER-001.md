# CONVERSATION COLLIDER 001 — When inventions find each other

**Experimental, offline, synthetic by default.** CANNON proposes cross-project test candidates without reading chats, inspecting connected accounts, executing code, minting canon, or performing a reLATTE crossing.

## Question

Could a large conversation history be treated as a reservoir of partially specified artifacts, where an explicitly described output from one can suggest a *test* of a separately described input from another?

```text
human-curated, non-sensitive artifact manifest
           ↓
producer OFFER ── exact typed contract + version ── consumer NEED
           ↓                              ↓
     typed test candidate          version mismatch: HOLD
           ↓
independent source-object verification (CANNON 003)
           ↓
actual structural fit and adapter review (CANNON 004/005)
           ↓
semantics, rights, owner choice, then receiver-local reLATTE disposition
```

**MATCH != FIT. FIT != RIGHTS. PROPOSAL != ADMISSION. CHAT TITLE != CHAT CONTENT.**

## Run (Node 24+)

```sh
node --test test/conversation-collider.test.mjs
mkdir -p work
node scripts/conversation-collider.mjs scan examples/conversation-collider-001.lab.json work/collider-output.json
node scripts/conversation-collider.mjs verify examples/conversation-collider-001.lab.json work/collider-output.json
```

Output files are created with exclusive-write mode; the command refuses overwrite. Omit the output argument to print only. The engine uses Node built-ins, no network and no package dependencies.

## Strict small protocol

- Input schema: `cannon.conversation-collider.inventory/v1`, up to 100 explicitly supplied artifacts with unique IDs, title, source, typed `offers`, typed `needs`, and optional display-only tags. No freeform transcript or raw chat field is accepted.
- Source is either `LAB_FIXTURE` with an explicit label, or `GIT_PIN_CLAIM` with a repo name, exact-shaped 40-character SHA and safe relative path. A syntactically well-formed Git pin remains **unverified** by this tool. It has not authenticated repository ownership.
- Producer's output `contract` and `version` must exactly equal a different consumer's declared need. Literal type match produces `TYPED_TEST_CANDIDATE`, **not verified interface fit**.
- Same contract with different versions becomes `VERSION_MISMATCH_HOLD`. No auto-conversion or inherited signing. Shared tags/keywords cannot create an edge.
- Every edge preserves both source labels, integrity warning and the independent verification gates that remain. Unmatched items appear in the report instead of being erased.
- Results are deterministic and carry SHA-256 commitments. Cold replay checks a result against the given input and refuses changed status/edges. This proves reproducibility, **not factual truth**.

## Deliberately synthetic collision

The lab kettle offers hypothetical `heat.flow/v1` and needs `route.policy/v1`; the lab GHoT node offers the routing policy and needs `proof.receipt/v1`; a lab reLATTE node offers that receipt but needs `heat.flow/v2`. Two exact typed **candidates**, one **version mismatch HOLD**. A photobooth shares the word `routing` but has no contract and remains unmatched. These labels do not assert that these real systems presently implement any of these interfaces.

## What is still missing

1. Human-selected local extraction from chosen conversations, with consent and redaction review before any public artifact; never silently publish chat history or connected-account information.
2. Real source-repository interfaces, signatures, contract schemas and independently verified exact Git objects. Manifest authors' claims are not evidence of interface support.
3. Existing CANNON structural-compatibility check on a concrete pinned pair, followed by semantic tests and explicit adapter-loss accounting.
4. An owner-selected, independently authorized native reLATTE crossing and receiver-local decision. The collider must never decide for either owner.
5. Quantified comparison with a lexical matching baseline, including misses and false positives.

**No donor writes, no financial effect, no hardware actuation, no private-user-data import, no release or deploy permission.**
