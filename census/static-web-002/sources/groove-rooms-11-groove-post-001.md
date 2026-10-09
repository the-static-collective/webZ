# GROOVE POST 001 — the traveling artwork

**Experimental. Offline local parcel workshop inside Groove Rooms RETURN ADDRESS. No live posting, transport, or reLATTE receiver action.**

## What the user can do now

Open a Groove Room on the `feat/groove-post-001` branch and find the **GROOVE POST 001** workshop inside RETURN ADDRESS. Compose a text letter or choose a local image, recording, video or model file. The browser uses Web Crypto SHA-256 to seal the parcel and exports `groove-post-<digest>.json`. The app does not upload, message, publish or persist that parcel. If it references binary art, separately send the original file by a mutually agreed, independently authorized channel.

A recipient pastes/imports the JSON, checks the envelope hash, optionally selects the original binary file to independently verify its bytes, and—only if the source explicitly asserts private-derivative *and* return permission—composes a new response in a different or identical medium. `ancestry.parent_parcel_id` plus `ancestry.parent_artifact_sha256` binds the return to the first letter. The second parcel never overwrites the first.

Parcels carry `version`, `origin`, `created_at`, `artifact`, `ancestry`, `rights`, `semantic_effect:none`, `parcel_id` (SHA-256 of deterministic JSON body). A TEXT parcel embeds exact text verbatim and verifies it independently. All non-text parcels contain **metadata only**, plus content digest and byte length; the recipient must possess the original file to verify the bytes. `sender` and `recipient` labels are declarations, not proven identity or a delivering address.

Rights are deliberately restrictive in v0.1. It can carry sender-asserted permission for a private derivative and private return; it can never declare publication, commercial, model training or synthetic-voice rights. Even a sender permission checkbox does not authenticate license ownership. External rights and artist consent remain separate. All self-described rights are explicitly `SENDER_ASSERTION_NOT_VERIFIED_LICENSE`.

## Postal witness grammar

```text
capture.recorded   — original parcel claimed/observed
handoff.recorded   — DECLARED send, never fictional delivery proof
return.recorded    — independently sealed child with original parcel ancestry
decision.recorded  — KEEP / REFUSE / WRONG / INTERESTING
```

`projectWitnesses()` requires cold-verified parent/return correspondence and returns a **local-only projection**, not actual RoomEvents or Band Runtime records. No database schema migrations, room writes, remote calls or native reLATTE crossings are performed. The existing RETURN ADDRESS voice-letter relay and Listener Return remain independent; the v0.1 postal UI is placed adjacent to them, NOT smuggled into their listener-return-only `return_packet` column.

## Offline test

Node 24+ is enough to test the core without the currently security-blocked TanStack Start dependency:

```sh
node --test test/groove-post.node.test.mjs
```

An additional Vitest suite lives at `src/lib/groove-post.test.ts` for a later whole-app package upgrade.

## Live-system boundaries and next crossing

1. Resolve Groove Rooms dependency-security deployment blocker (tracked in issue #8) through a supported package upgrade, not a bypass.
2. Introduce a *distinct* `groove-post/0.1` correspondence table/column or owner-local artifact store with migration, RLS and authorization tests. **Do not** reuse the `listener-return/0.1` restricted JSONB field.
3. Tie an actual sender and recipient to authenticated room/channel consent, while separating privacy and public release decisions; never equate UI labels with identities.
4. Bind original media bytes to a consented blob store and explicit retention; verify rights before transmission or derivative creation.
5. Add a native reLATTE transport profile with signed sender/receiver crossings and receiver-local HOLD. Do not claim the current JSON export is a signed reLATTE receipt.
6. Explicitly integrate CAPTURE → HANDOFF → RETURN → DECISION into Band Runtime's append-only event log, retaining separate local and external parent references.
7. Optionally hand a later independently authorized public release to Autodisco, or a physical delivery request to postEmahh'n. Neither follows from a parcel.

**HASH != SIGNATURE · CLAIMED RIGHTS != VERIFIED LICENSE · MAIL != RELEASE · EXTERNAL ANCESTRY != ROOM PARENT · SENT != DELIVERED · RETURN != CANON.**
