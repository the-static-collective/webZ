# RELAY-001 / the fourth organ — a read-only webZ evidence door

**Status:** review-only branch; not a live deployed service and not accepted canon.

webZ now has a distinct, local-first viewing door at \`relay/\`. It verifies the native reLATTE opaque crossing from the proposed GHoT media-probe adapter, without modifying the existing MAXHINAL-13 evidence viewer (\`proof/\`) or its custody requirements.

## Source-owner boundaries

1. LOADOUT owns the effect-fence BIND decision.
2. GHoT owns its media.probe execution and (unsigned) task/receipt.
3. reLATTE owns signed crossing syntax, transport frame, and locally signed RECEIVE/HOLD receipts.
4. webZ owns only its client-side, read-only **observation**.

**Signature consistency ≠ human identity.**
**RECEIVED ≠ ADMITTED.**
**HOLD ≠ PUBLISHED.**
**Observation ≠ receipt.**
**File-source hash cited in a crossing ≠ source bytes verified.**

## Inspect a record

Open \`/relay/\` through the local webZ server and select a reLATTE \`roundtrip-result.json\` file. Import stays in memory, with a 512 KiB input limit; no network upload, authority grant, or storage of imported evidence occurs. The app checks:

- original reLATTE P-256 signed crossing/RECEIVE/HOLD receipts and domain-separated IDs;
- exact canonical file-transport body, transport SHA-256 and transport ID;
- signed common crossing ID and receiver-key continuity;
- the explicit receiver-local \`R3_HOLD\` effect \`none\`;
- the GHoT donor family and five SHA-256 payload references.

The app **does not** authenticate signer identity; independently verify the 5 donor JSON files and original audio if asserting upstream execution/media provenance. The receiver snapshot is self-reported context, not independently signed state proof; the signed local HOLD receipt is independently verified.

## Reproducibility

The workflow \`relay001-fourth-organ.yml\` checks out known commits of the proposed reLATTE, GHoT, and LOADOUT bridges, generates a **synthetic WAV**, executes the native two-organ probe, creates a new native signed reLATTE HOLD, and checks the result through the actual webZ \`inspectRelay\` function with adversarial mutation tests. No user MP3, private receiver key, or private donor evidence appears in public CI.

The song-specific "Blue Night Morning Bloom" crossing was verified offline against the exact local file \`third-organ/public/roundtrip-result.json\` and remains in the separate private/user-delivered packet. No song media is committed to GitHub.

## Review frontiers

- Add optional exact five-donor-file verification in browser as a separate capability, never as implicit authority.
- Add checked portability into the public listening room, with no auto-publication.
- Consider third-party verifier conformance across browsers, particularly Safari/iOS WebCrypto support.

No deployment, CANNON selection or automatic navigation to another world is performed by this branch.
