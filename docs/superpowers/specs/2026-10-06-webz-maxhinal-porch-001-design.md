# WEBZ–MAXHINAL–PORCH–001 — A Door Without Borrowed Authority

**Status:** additive design/implementation brief; **no live crossing, browser runtime, or admission demonstrated by this document**.  
**Owner:** `the-static-collective/webZ` for human-facing world address, portal, and navigation.  
**Sibling sources:** [webZ GENESIS-001](../../superpowers/specs/2026-10-06-webz-genesis-001-design.md), [webZ PORCH-001](https://github.com/the-static-collective/webZ/issues/1), [reLATTE FIRST-CONTACT-001](https://github.com/the-static-collective/reLATTE/pull/62), [Human-Witness MAXHINAL-13 PR #5](https://github.com/the-static-collective/Human-Witness/pull/5), [MAXHINAL operator runbook](https://github.com/the-static-collective/Human-Witness/blob/implementation/maxhinal-13-issue-4/adapters/maxhinal13/OPERATOR.md).

## Purpose

Give the human an intelligible **webZ doorway** into a network crossing without turning the web page into the network's operator, source of truth, or owner of local disposition. The door should show what may be proposed, what is still unresolved, whose decision is needed, and where the independently checkable response can be inspected.

This is a *neighboring seam*, not a dependency that may postpone an existing proof gate. In particular:

- **WEBZ-DOOR-001** remains two static authored worlds, an explicit browser-local A → B → A journey, no-carry default, and deterministic local replay. It must be able to run with MAXHINAL, reLATTE, SupaBardo, and Supabase absent.
- **reLATTE FIRST-CONTACT-001** owns canonical signed crossings, durable owner-local decisions and signed response bundles for a later visitor-to-world encounter. Its current proof is bounded *loopback simulation*, not two real devices on the internet.
- **MAXHINAL-13** owns its own two-existing-host authenticated bootstrap, P-256 key custody, 01→01 and 01→02→01 HTTPS witness, independently fetched *both-host* histories, local SINEW dispositions and cold replay. webZ does not reissue its receipts, keys, capabilities, or LIVE claims.
- **STORYSHIP** owns story/canon and human narrative choices; visiting a world or showing a card cannot admit story content.

### The critical name collision: two INVITATIONs

1. **The MAXHINAL exact-byte particular named `INVITATION`** is the *original external image*: observed filename `1000018575.png`; size **670478 bytes**; SHA-256 **`af82b9a3b2d5eeb1ce3d58038b3415ca62f0815bd6f0a04662ec8cf5b773d171`**; JPEG/JFIF magic despite a `.png` filename. It is **not present** in the tested PR archive. Its bytes must be found and checked *without re-encoding or public vending* before MAXHINAL's image-route live proof.
2. **A webZ invitation** is a future short-lived, purpose-scoped permission to *approach a world*. It is **not** that image, not a signed receipt, not proof of human identity, not authorization to operate either Supabase host and not destination admission.

In schemas and UI, call the first `mx13_specimen` and the second `porch_invite` to prevent accidental substitution.

## Architecture: the soft door and the hard threshold

```text
person → webZ world address / atlas → inspect porch + scope
                    │
                    ├─ REMAIN / CLOSE  (no crossing)
                    │
                    └─ OFFER to approach (explicit person choice)
                               │
                    authorized edge / explicit local import
                               │
                    reLATTE source-signed contribution
                               │
                    receiving LocalReceiver: inert RECEIVE / HOLD
                               │
                    receiving owner chooses ADMIT / REFUSE / HOLD
                               │
                    signed return → independent verification
                               │
                    webZ displays linked evidence and permitted navigation
                               │
                    STORYSHIP *may* render a locally admitted consequence
```

Parallel and independent:

```text
protected operator environment (NOT a browser)
    └─ MAXHINAL bootstrap → 01→01 → 01→02→01 → independent histories
        └─ verified sanitized evidence / cold-replay report
            └─ optional read-only webZ proof-view import
                └─ AFTER actual two-host evidence: Constellation Rack may open
```

Neither diagram authorizes the other. A signed reLATTE HTTP loopback result does **not** make MAXHINAL LIVE. A webZ landing, HTTP 200, PNEUMA pulse or screenshot does **not** make either LIVE.

## Minimal interface, before a server exists

The first deliverable is an **offline-capable static porch and proof-view** behind the same safe resolver as webZ Genesis. It may display a *bounded* public descriptor and import a **sanitized, externally verified** evidence bundle as data. It must not call MAXHINAL operator/genesis/worker functions, hold Supabase tokens/JWTs/DB URLs, or ship personal image bytes.

A proposed public descriptor (contract **proposal**, not an implemented API):

```json
{
  "schema": "webz/porch/v0",
  "world_id": "webz:the-static-collective/sanctuary",
  "owner_label": "Host-authored label; not verified identity",
  "accepted_kind": "text/plain",
  "max_bytes": 2048,
  "invitation_state": "NOT_ISSUED",
  "carry_default": "none",
  "delivery_enabled": false
}
```

For now, `NOT_ISSUED` and `delivery_enabled: false` are correct. A later **real** invite has a public locator but *no reusable bearer secret in a URL*, plus separate short-lived authorization/redemption, expiration, revocation, abuse controls, TLS and origin validation. Do not deploy an unauthenticated reLATTE loopback fixture to a tunnel, and do not change STORYSHIP launch-v0 provider/spend gates.

A proposed proof-view adapter (also **not implemented**) accepts only an allowlisted report produced by an **independent evidence verifier**, displaying the report's scope, verifier version and hashes. The view is a projection, never the thing that signs, judges or upgrades the crossing:

```json
{
  "schema": "webz/proof-view/v0",
  "system": "MAXHINAL-13",
  "status": "NOT_EARNED",
  "verification": {
    "result": "UNAVAILABLE",
    "source_host_history_checked": false,
    "destination_host_history_checked": false,
    "exact_particular_checked": false,
    "independent_cold_replay_checked": false
  },
  "claim": "NO_LIVE_TWO_HOST_PROOF"
}
```

Those booleans cannot be set to true by the browser merely because a JSON file says so: an independent pinned verifier must validate source and destination signed durable histories, identity/world/payload binding and receipt ancestry, and establish whether the external operator's authenticated HTTPS transport observation exists. The UI must distinguish **verified report presented** from **browser independently reverified**; if no trusted basis is available, display `UNVERIFIED`. Imported reports must be stripped of project credentials, raw capabilities, URLs with bearer tokens, JWTs, DB credentials and personal image bytes, with review of any public node metadata before publication.

## State and claim laws

Keep **webZ local navigation** distinct from **reLATTE sovereign disposition** and **MAXHINAL operator evidence**. Do not collapse them into one generic `HOLD`.

| Field | Possible display | Evidence boundary |
| --- | --- | --- |
| webZ navigation | UNRESOLVED / INSPECTED / DEPARTED / ARRIVED_LOCAL | browser-local trace; not admission |
| webZ porch | CLOSED / INVITE_AVAILABLE / EXPIRED / REVOKED / UNREACHABLE | availability only; no permission to publish |
| reLATTE crossing | OFFERED / VERIFIED_RECEIVE_HELD / OWNER_ADMIT / OWNER_REFUSE / OWNER_HOLD / RETURN_VERIFIED | only with corresponding signed native evidence |
| MAXHINAL network proof | NOT_EARNED / BOOTSTRAP_VERIFIED / LIVE_TWO_HOST_VERIFIED / LIVE_THIRTEEN_VERIFIED | distinct operator history/trace gates |
| PNEUMA observation | UNKNOWN / RECOVERING / QUIET / PULSING | optional, ephemeral, observer-local; never a receipt |

**The current displayed MAXHINAL state is `NOT_EARNED`**: both hosts reported zero keys, peers and active operator capabilities, protected operator configuration was unavailable, and the exact original image bytes were absent. This report is current only as of the cited PR snapshot and should become `UNKNOWN`, not `LIVE`, when later evidence is missing or stale.

**Constellation Rack prohibition:** do not render it as a genuine live 13-card constellation until two-host authenticated proof passes the existing MAXHINAL gate. An inert explanatory page may describe the planned Rack, but not imitate a live grid. PNEUMA activity may never backfill missing durable proof.

## Executable build order for Codex

1. **webZ Genesis first:** preserve its approved-review gate. Implement static Sanctuary ↔ Orchard, world manifests, explicit inspect/cross/remain/return, no-carry, safe nested-base resolution, local export and independent cold replay. No network dependency.
2. **PORCH-001 local fixture:** add a separate static page displaying a safe world/porch descriptor, accepted formats, exact size limits, rights/consent text, and an *unavailable* submit control until a reviewed edge exists. Prove that merely viewing/importing the descriptor sends no data and grants no rights.
3. **MAXHINAL proof-view adapter:** start with fixture reports labeled *simulated*, *unavailable*, *tampered*, *missing destination history*, *missing exact bytes*, and *verified report*; all negative states must refuse LIVE. Do not expose operator environment controls. Later accept only strictly sanitized independent verifier output with locally inspectable ancestry references.
4. **Secure two-host gate outside webZ:** from authorized protected operator config, do the MAXHINAL bootstrap, then exact-byte loopback and 01→02→01, compare independently fetched source and destination durable histories, capture authenticated transport observations, and perform separate cold replay. If environment or image is absent, stop. **webZ is not a workaround.**
5. **Two-device visitor gate:** only after separate edge security review, implement webZ scoped opt-in visitor invitation → reLATTE signed candidate → inert receiving HOLD → explicit host decision → independently verified signed return. Prove intentional refusal and expiry/revocation. Keep this evidence **separate from** MX13 evidence.
6. **Only then** unlock read-only Constellation Rack from independently attested MAXHINAL two-host proof; PNEUMA is optional and pauses when the viewer closes/hides the page.

## Adversarial acceptance tests

- Public `webz:...` address cannot generate a browser scheme privilege or assert ownership.
- Browser navigation and fake `status: LIVE` JSON never upgrade the MAXHINAL claim.
- A single sender ACK, a valid but unpaired source receipt, a missing destination history, wrong exact image hash/size, wrong world identity, stale/forged signature, relabeled return or replay order violation all withhold LIVE.
- Browser fixtures cannot access host operator keys, Supabase service roles, JWTs or private-schema identifiers; query string, fragment, analytics and logs do not carry redeemable capabilities.
- Visitor invite expiry/revocation, wrong origin, oversized content, hostile HTML/filename, duplicate submission and lost return leave verified evidence durable and no automatic local consequence.
- Import/export corruption produces explicit UNVERIFIED/UNRESOLVED, not repaired history.
- Browser-local A→B→A cold replay passes without any network, browser account, Supabase project or personally owned media.
- Evidence of a refused visitor contribution cannot become STORYSHIP canon; an admitted contribution requires separately declared use/publication permission.
- Rack remains gated during zero-key, pending bootstrap, simulation-only, PNEUMA-only, and single-host-receipt states.

## Deliverable boundary

This document creates **no service** and grants **no operator permission**. No new Supabase projects; no hosted functions, public endpoints, secret distribution, signing-key rotation, image publication, or LIVE assertion. Implementation must have its own tested branch, provenance, mobile/desktop browser witnesses, security review, and scoped human authorization.

**Working laws:**

```text
ADDRESS != AUTHORITY
PORCH_INVITE != MX13_INVITATION_BYTES
DISCOVERY != CONSENT
DELIVERY != ADMISSION
HTTP_ACK != SIGNED_RECEIPT
PULSE != PROOF
VIEW != VERIFICATION
LOCAL_VOYAGE != CANON
EVIDENCE_FIRST; RACK_AFTER
```
