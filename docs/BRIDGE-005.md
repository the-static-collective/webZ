# BRIDGE-005 — The reviewed work-card crossing

**Status:** implemented public-only, owner-reviewed handoff from the Abundent **encrypted operator desk** into independently owned JAR;VIS or planZ. This is **not** a link, inbox send, automated action, journal sync, signed reLATTE envelope, recipient agreement or field verification.

## Exact handoff

The private operator desk at `/bridge/desk/` offers a new **BRIDGE-005 / REVIEWED HANDOFF** form. The operator picks one of the existing 23 candidate institution identifiers, one of two independently governed recipients (JARVIS or PLANZ), and one of four **closed, bounded action codes**:

- `VERIFY_ELIGIBILITY` — check current official program conditions.
- `ASK_LOCAL_PERMISSION` — ask an actual eligible person to review one possible task.
- `PREPARE_SYNTHETIC_DEMO` — prepare a public-safe, synthetic, source-linked demonstration.
- `REQUEST_CRITIQUE` — prepare an unsent request for critical review.

Before a download the browser displays the institution and its eligibility gate, and the operator must check an acknowledgment for the **exact** selection. Changing the selection resets that acknowledgment. The result is a **downloaded JSON file**, not a network transmission or permission grant.

The source-owned code lives at `bridge/desk/work-card.mjs`. Packet schema:

`abundent.bridge-work-card/v1`, exact source commit `27c280d5297e593512d85eb3c83d74904856cfdf` (the public 23-door snapshot in BRIDGE-NETWORK-003), exact official source path, snapshot `BRIDGE-NETWORK-003/2026-10-28`, `doorId`, `target`, `actionCode`, all of `manualExport:true`, `externalContact:false`, `applicationSubmitted:false`, `receiverAdmitted:false`, `fieldVerified:false`, `authority:"NONE"`, `classification:"PUBLIC_ONLY_HOLD_FOR_LOCAL_REVIEW"`.

`candidateId` is SHA-256 over `"BRIDGE-005|"+JSON.stringify(known-order-public-body)`. This detects accidental alteration; **anyone may recalculate the digest**. It is *not* a signature, institutional response, owner identity, acknowledgment, or proof that the source itself was independently read.

**Excluded:** journal events, notes, contact names, private case details, invitations, bearer links, historical response summaries, host identifiers, freeform instructions, arbitrary destinations, credential material. The desk retains encrypted local custody of its own journal. A successful download is not recorded as an external submission.

## Receiver-owned behaviors

**JAR;VIS:** Local loopback `http://127.0.0.1:7789/bridge` accepts a manually selected file; `POST /api/bridge/triage` requires same-origin CSRF, validates exact schema, source version, supported door + action codes and digest. Returns `jarvis.bridge-work-triage/v1` with `HOLD_FOR_OPERATOR_REVIEW`, independently selected action text and all effects explicitly blocked. No model execution, outside publication or outbound communication.

**planZ:** Offline `npm run triage:bridge -- /path/to/bridge005-...-PLANZ-HOLD.json` reads at most 3 KiB, validates the exact receiver-targeted packet, then returns `planz.bridge-work-triage/v1` as `HOLD_FOR_PLAN_OWNER_REVIEW`. No issues, attention index, repository files or external systems are changed.

Both receivers refuse a card directed to the other receiver, malformed or changed digests, unknown fields, invented authority states, unknown doors, or arbitrary injected text. The imported candidate remains *operator-authored public draft*, not an actual receiving organization's decision.

## The actual route

`23-room atlas → selected room in private ledger → reviewed public-only work-card download → manual file handoff → local JAR;VIS or planZ independent HOLD review`.

This is deliberately a reversible file-level transport; no cross-domain bearer tokens or automated transfers. reLATTE is the candidate owner of a **future** independently signed receiver crossing with genuine key custody and owner permissions; this implementation does not preauthorize it.

## Field-proof gate

To progress beyond HOLD, the operator must obtain separate permission from a real eligible applicant, current official eligibility evidence, a bounded source-approved task, and a real receiving organization/human's independent disposition. An application, award or independently completed physical result must be verified via external evidence in its proper custody. Do not auto-transfer private notes.

## Tests and release

webZ tests cover all `23 × 4 × 2` source candidate combinations, fixed golden digest, false authority, unsafe fields and explicit review UI. The JAR;VIS and planZ repositories contain independent validation tests and working localhost/offline receive surfaces.

The `webZ` copy is included in the existing static Switchboard build, but source/CI success does **not** prove the custom-domain route has deployed. Verify actual HTML, model and app assets at the right production hostname. Preserve Bridge production HOLD [#173](https://github.com/the-static-collective/webZ/issues/173) until independently verified.
