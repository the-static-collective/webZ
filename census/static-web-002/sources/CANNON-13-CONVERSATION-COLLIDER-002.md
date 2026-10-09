# CONVERSATION COLLIDER 002 — Real pinned source discovery

**Crossing question:** can CANNON derive candidate relationships by reading exact Git object content rather than accepting hand-labeled simulated `offers` and `needs`?

## What is actually proved

The scanner reads version-pinned **JSON source objects** through `readSource()` from PRESENT USE 003, checking actual Git commit SHA-1 object bytes, commit tree, blob identity, file SHA-256, safe source path, and declared origin config. A matching label is extracted directly from `INSTANCE.schema` and `JSON_SCHEMA_CONTRACT.properties.schema.const`. No supplied edge or hard-coded producer/consumer pair is necessary.

Every discovered pair undergoes the real bounded `validateInstance()` from TYPED COMPATIBILITY 004. A matching schema identity is **not** assumed fit. Results preserve exact pointer violations and report HOLD for absent Git objects or unsupported JSON Schema features. Signature authenticity, remote repository ownership, release evidence, application semantics, rights and receiver admission remain outside this test.

## Real first excavation

| Original donor | Immutable Git commit | Exact original file | Role |
| --- | --- | --- | --- |
| Static OS | `7bc551610421bd60a8dbf624d93d7a6682ce3987` | `fixtures/bardo-boot-witness-001/crossing.json` | instance |
| reLATTE | `dcc8cdca84c440aa4294134f020fb7095bf87f24` | `schemas/crossing-envelope-v0.schema.json` | contract |
| reLATTE | `dcc8cdca84c440aa4294134f020fb7095bf87f24` | `fixtures/genesis-signed-crossing.json` | independent baseline |

These two actual repositories claim `relatte.crossing-envelope/v0` in their original source bytes. The Static OS specimen includes `/payload_refs/0/byte_length`, which the original reLATTE contract does **not** permit (`additionalProperties:false`). **Expected:** Static OS pair `INCOMPATIBLE` and baseline `STRUCTURALLY_COMPATIBLE`; both source objects remain unchanged. This discovers an interface boundary, not a working adapter.

## Run (Node 24+, Git)

Check out the original pinned commits locally. Declare the two repository roots in an untracked JSON file, for example:

```json
{
  "the-static-collective/static-os": "/absolute/path/static-os",
  "the-static-collective/reLATTE": "/absolute/path/reLATTE"
}
```

```bash
node --test test/conversation-collider-source.test.mjs
node scripts/conversation-collider-source.mjs scan --plan examples/conversation-collider-002.sources.json --roots work/roots-002.json --out work/collider-002.json
node scripts/conversation-collider-source.mjs verify --plan examples/conversation-collider-002.sources.json --roots work/roots-002.json --out work/collider-002.json
```

Output uses write-exclusive `wx` and mode 0600, with no overwrite; verification runs from a fresh process and re-reads source objects. It is a read-only report: no source code import, source writes, network calls by the scanner, keys, deployment, platform API calls or native reLATTE crossing.

## Method/limits

- Strict 2–12 artifact manifest; only `INSTANCE` and `JSON_SCHEMA_CONTRACT`, repository, exact commit hash, safe relative path and unique ID. No raw chat input fields.
- This version can only discover **JSON with a literally declared `schema` identity** under the matching schema contract. It deliberately misses useful cross-domain links without this common interface. `NO MATCH != NO POSSIBILITY`.
- Distinguish `SAME_REPOSITORY_BASELINE` from `CROSS_REPOSITORY`, so a reference self-check cannot be presented as external interoperability.
- Read errors, unsupported schemas, missing roles and malformed contracts produce HOLD or refusal; no automatic schema fixing. Lack of independent repository owner authentication is explicit.
- The exact content-bound receipts and cold replay make observations reproducible, not true, licensed, safe, signature-verified, or authoritative.

## Next doors

1. Independent JSON-object source attestation for real donor interfaces beyond one exact string-matched contract (e.g. actual GHoT body/receipt contract snapshots).
2. Link CANNON 005 adapter's preserved-loss proposal to the discovered incompatible pair, without inheriting the old signature.
3. Human-reviewed, consent-scoped translation of selected conversations into typed artifact descriptions; no bulk private chat indexing or automatic publication.
4. ReLATTE native signed candidate crossing and receiver-local HOLD only after source and rights review, with explicit owner selection.

**DISCOVERY != TRUST. LABEL != FIT. STRUCTURAL FIT != SEMANTIC FIT. SOURCE OBJECT != RIGHTS. HOLD != NONEXISTENCE.**
