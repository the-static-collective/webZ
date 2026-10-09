# SKYMIRROR × webZ — OPTICAL-LAB-001

Status: **experimental local browser surface; no physical optical reception witnessed here.** This is a proposed cross-repository integration, not a merger of reLATTE and webZ authorities.

## Source ownership and pin

- Owner and original implementation: [reLATTE draft #95](https://github.com/the-static-collective/reLATTE/pull/95), branch `experiment/skymirror-002-two-phone-light-link`, source commit `540da48104a8a76a87f2acefd60df00ffa76237c`.
- Copied **byte-exact** from upstream: `labs/skymirror/protocol.mjs` (blob `cd3be6d7714564001351826f83d746c9b5c878f4`), `protocol.test.mjs` (blob `630776197b439c3cd7ca3226a7253bfb423867b7`), `style.css` (blob `d0ba9d22ecebb84b500b62b44c3e41c51d8bf3a3`).
- webZ-adapted copies: `labs/skymirror/index.html`, `app.mjs` (a small opt-in event hook, returning link, permission review panel).
- webZ-owned boundary: `app/optical-observation.mjs` and `labs/skymirror/webz-bridge.mjs`.

No changes are made to reLATTE's cryptographic signature profile, receiver, or R6 transport schema. The original SKYMIRROR-002 is **not** a signed crossing; it is a 24-byte, camera-measurable CRC16 text-packet lab. Therefore this integration makes no claim that it transports an entire reLATTE envelope.

## Operator experience

1. Open webZ over HTTPS and explicitly follow **Optical laboratory**. The laboratory is a first-party static instrument, not an admitted world.
2. Open that page on two devices. On the receiver, choose **Receive**, permit camera access, and aim at an indoor household mirror reflecting the transmitting screen. On the other phone, enter `HI`, choose **Transmit**, and allow the full blink sequence to complete.
3. Only a **real, checksum-valid camera decode** offers the button **Inspect light packet as untrusted observation**. Synthetic mode cannot enable it.
4. A human must click Inspect; a local `webz/optical-observation/v0` record then shows the payload hash, byte count, contrast, chip duration, and explicit non-authority fields. Decoded text is omitted.
5. Export is an additional explicit local download. It is not written into webZ's existing voyage trace, transferred to a world, or uploaded to a server. It contains **no actual carrier-authentication proof** and never unlocks the MAXHINAL rack.

## WebZ constitutional split

```
LAB != WORLD
REFLECTION != PERMISSION
CRC_VALID != SIGNATURE_VALID
CAPTURE != VERIFIED REMOTE DELIVERY
HASH != SOURCE IDENTITY
OBSERVATION != RECEIVE
RECEIVE != ADMISSION
BROWSER RECORD != SOVEREIGN RECEIPT
TRANSPORT != CROSSING
```

The established two-world `WORLDS` registry, default carry NONE, exact manifest validation, immutable unsigned observation journal, per-world HOLD/REFUSE/ADMIT rehearsal, proof viewer, and all source-owned verification stay untouched. No new reLATTE signature or local receiver event is invented.

## Offline and privacy boundary

- User must first visit the static lab while online. The existing service worker caches lab **code only on explicit visit**, not as part of its boot precache; subsequent visits work offline when browser caching succeeds.
- HTML, module scripts, CSS, and lab logic are static same-origin assets; no network API, radio interface, external telemetry, or service backend.
- Camera frames remain ephemeral in memory; the reLATTE lab can export raw sampled brightness **only on request**. webZ's separate review output exports only a digest/length and numeric capture descriptors. No decoded plaintext or video leaves the browser automatically.
- The laboratory is not a cryptographic authentication gate; a browser user can fabricate or mutate local data. A real captured receipt needs independently trusted acquisition.

## Verification gates

Automated: run `npm test` in webZ, including original SKYMIRROR-002 protocol tests and the webZ boundary tests in `tests/skymirror-lab.test.mjs`. Tests use synthetic data only.

Physical: two-phone indoor household-mirror capture, full brightness log, independent repeat, observed timing and contrast, evidence that both phones were offline during communication. Until done, status is **FIELD UNVERIFIED**.

Future: full signed crossing transport requires a separate independently verified wider-bandwidth optical protocol, exact canonical byte preservation, nonce/replay protection and the existing reLATTE receiver. It must not be inferred from the 24-byte toy packet or a static browser file.
