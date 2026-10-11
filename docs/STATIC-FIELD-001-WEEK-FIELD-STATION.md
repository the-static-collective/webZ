# STATIC FIELD 001 — A Week Together field station

**Status: experimental sidecar, not published, deployed, or a signed receiver.**

Entry: `/week/field/` alongside the unchanged listening room at `/week/`.

## Grounded catalog

The existing public `webZ/week/index.html` defines seven editorial letters and fourteen linked tracks. The sidecar catalog is a bounded transcription pinned to the exact Git blob SHA-1 of that page. The included test refuses source drift and requires re-witnessing before reuse. This SHA-1 is an identity of the Git source blob—not a Suno recording hash, artist signature, rights proof, or audio-generation ancestry certificate.

The eleven windows report only what that public page supports: song identity, letter placement, and another song placed in the same letter. Audio bytes, vocal timbre, lyrics, generation style, artwork ancestry, alternate takes and musical relations remain explicitly **not witnessed**. An editorial pairing is not evidence of generation lineage.

## Running locally

Node 22+ from the existing `webZ` repository root:

```sh
npm test
npm run serve
# open http://127.0.0.1:8080/week/field/
```

No account, backend, remote submission, telemetry, browser storage, automatic remote retrieval, or image/audio harvesting. Opening an external source song link is an **explicit user action**, not a covert page request. Nothing changes in the public `/week/` route and the experiment adds no service-worker caching or auto-deployment behavior.

Notes are bounded human assertions with one of three statuses: observation, interpretation, question. A local export creates an unsigned checksum-carrying JSON file. A second computer running the *same source version* can import it. The parser checks the known track, exact source blob identity and SHA-256 internal consistency, then returns `HOLD`. The operator may explicitly place the notes on their in-memory desk or discard them. Unexported notes vanish on page exit. Imported notes are not made canonical or published.

**Checksum is not identity:** Because the checksum travels alongside an unsigned payload, an adversary can edit both. This is no authenticated exchange, independent reLATTE source verification, TranchNode custody, sovereign receiver disposition, or transferable authority. Human self-assertions remain self-assertions.

## Next, gated work

1. Witness one independently acquired, permissioned original audio asset in Autodiscography Vault with its actual cryptographic receipt. Link to the owner-held artifact, do not clone or leak it.
2. Attach genuine alternate-take, lyrics, voice, generated-image and dual-audio relationships only where their source evidence exists.
3. Build a reLATTE owner-local adapter against the *real* envelope and verifier, so a signed arrival can be held independently; do not relabel unsigned notes.
4. Demonstrate cold offline replay and deliberate file transfer between two real reclaimed computers.
5. Seek separate human approval before exposing this experimental sidecar through public navigation or email outreach.

Failure: fake ancestry, unexplained source drift, auto-admission, public leakage, conflating a portal with custody, or turning a local note into provider metadata.
