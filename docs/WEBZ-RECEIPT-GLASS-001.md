# WEBZ-RECEIPT-GLASS-001 — common observation surface

**Status: experimental, draft, not merged, not deployed.** This branch stacks on webZ PR #49 (real GrO receipt verifier) and treats CANNON PR #52 as a distinct archival donor, not as equivalent proof.

## The particular

A public, static, first-party /receipts/ route accepts deliberate local JSON files and presents a single eleven-lens inspection surface. It does not receive a crossing, issue a receipt, adopt a policy, sign a response, store a notebook, or contact a remote service.

Supported input profiles:

1. gro.abundent-signed-receiver/v0 — delegates to the existing verifySignedHold for original LemonPRESS material, crossing signature, two GrO-owned signed receipts, local state references, and journal hash linkage. Outcome: LOCAL_JOURNAL_VERIFIED; actual disposition remains HOLD.
2. relatte.crossing-envelope/v0 — recomputes canonical ID and verifies embedded ECDSA P-256 signature under existing reLATTE v0 domain profile. Outcome: SIGNATURE_ONLY; no source bytes, payloads, ancestor chain, receiver admission or signer identity inferred.
3. relatte.receipt/v0 — recomputes canonical receipt ID and verifies P-256 signature. Outcome: SIGNATURE_ONLY; neither journal replay nor real-world operator admission.
4. cannon.branch-work-receipt/v0 — structurally inspects an unsigned archival CI summary. Outcome: UNVERIFIED_ARCHIVE; original receipt signatures not independently verifiable from this summary. An archived exact source JSON for CANNON 009 is included in receipts/fixtures/cannon-009.json, copied from webZ PR #52. Source CI witness: https://github.com/the-static-collective/CANNON/actions/runs/38134430085.

### Lenses

Identity, Ancestry, Custody, Time, Witness, Policy, Effect, Material, Contradiction, Survival, Fog. Changing lens changes presentation only. Every category exposes unobserved parts instead of creating an answer. There is no global graph inference, key enrollment, world capability, or owner-opinion laundering.

### Release and privacy

- Public immutable release export explicitly includes five reader assets: receipts/index.html, style.css, inspect.mjs, ui.mjs, and the pinned archived CANNON summary.
- Excluded from existing service worker's fixed offline cache. No unreviewed directory copies.
- No telemetry, automatic remote source lookups, upload API, persistent drafts, private key material, external scripts, signing, or reLATTE receiver operations.
- Browser imports bounded to 128 KiB; GrO journal remains subject to narrower 64 KiB envelope.
- Strict P-256 signature profile checks and canonical IDs; unsigned claims never gain a VERIFIED label.
- Responsive controls, keyboard buttons, accessible inspection statuses; all incoming values rendered through textContent.

## Test and review gates

Run npm test, npm run field:verify, npm run build, node scripts/verify-release.mjs dist, and npm run test:browser (Chromium required). New Node tests cover signed journal, signed crossing, signed receipt, tamper/refusal, unsigned archive boundary, and browser no-side-effect surface. Browser integration must also verify root/nested paths and mobile.

## Authority law

SIGNATURE != HUMAN IDENTITY. RECEIPT != RECEIVER AUTHORITY. SIGNED HOLD != ADMIT. ARCHIVED CI REPORT != ORIGINAL SIGNATURE VERIFICATION. LENS != WORLD MUTATION. UNKNOWN != FALSE.

**Next gate:** extract a generic bounded reLATTE journal profile from reLATTE-owned code, and independently audit canonicalization and signature parity across diverse fixture families before claiming general journal verification or authorizing production deployment.
