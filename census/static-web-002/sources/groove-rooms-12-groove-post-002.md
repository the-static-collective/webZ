# GROOVE POST 002 — Addressable private room correspondence

**Draft implementation only.** Branch `feat/groove-post-mailboxes-002` stacks on POST 001, itself stacked on RETURN ADDRESS IMPORT 001. No production migration was applied, no current-user collaborators were contacted, and no deployed app is claimed.

## New usable surfaces once deployed

Inside RETURN ADDRESS → GROOVE POST, the existing local parcel workshop gains a real **Room Mail** panel. A logged-in person selects an existing authenticated room participant, seals a parcel locally, and explicitly clicks **Deposit in recipient inbox**. The Supabase backend, not sender labels or browser state, authorizes the membership and binds immutable sender and recipient user UUIDs.

The intended recipient can read their own inbox, explicitly append an `OPENED` receipt, or append `KEEP`, `REFUSE`, `WRONG`, `INTERESTING` observations. The sender can inspect their own outbox and the recipient's appended receipts. Other room members cannot inspect mail not addressed to them. Only the recipient can record those responses. Refresh reconstructs the ledger from the database.

Replying to the original mail is a separate explicit action. POST 001's verified `parent_parcel_id` and source artifact digest must match the original row. The sender and recipient UUIDs must reverse exactly, and the prior sender must have asserted both `make_private_derivative` and `return_to_sender`. Client and database each check the relationship. Sending a reply does not mutate the original.

## Grounding and boundaries

### Server authority

- New dedicated `groove_post_mail` and `groove_post_mail_receipts` tables; **never** reuse the existing `events.return_packet` JSONB field restricted to Autodisco listener returns.
- `auth.uid()` + existing `room_members` / `is_room_member` gate sending to a specific room member; same-room membership alone does not grant permission to read others' letters.
- Server-side RLS SELECT restricts to sender and recipient; receipt INSERT requires the recipient. Tables grant no UPDATE or DELETE privileges or RLS policies. Neither sender nor receiver can rewrite historical mail/receipt rows.
- The migration adds an insert trigger that refuses invented rights, invalid format/parent references, fake sender identity, cross-room reply, stale parent lineage, invalid returned address, and binary bytes embedded in a JSON envelope.
- Original self-described parcel SHA-256 still requires independent client-side hashing and verification; Postgres guards digest *shapes* and limits but does not independently implement POST 001's canonical hashing format. `DIGEST SHAPE != VERIFIED BYTES`.
- The mailbox database itself is not end-to-end encrypted. Authenticated recipient privacy depends on RLS and the backend operator; never describe it as zero-knowledge delivery.

### Delivery

`INSERT CONFIRMED` means **a durable inbox deposit**, not an external network delivery receipt, a human opening, or acceptance. `OPENED` and decision observations require an affirmative recipient action. Non-text parcels transport **metadata and hashes only**; original image/audio/video/3D bytes still require a separately authorized transfer and independent verification. Binary replies must verify the actual source file before the local workshop offers a return.

### Creative rights

All envelope rights are sender assertions, not independently proven copyright licenses. The POST 001 contract still forbids publication, commercial use, model training, synthetic voice, and automatic admission. Receipt decisions are `semantic_effect:none` correspondence and not Band Runtime's `events` append; authentic RoomEvent integration remains future work.

## Verification

The workflow runs original POST 001 Node 24 tests, plus eleven new hostile mailbox-address/lineage tests. A separate job starts a **throwaway Postgres 16 server**, creates a constrained fake room/auth directory, applies the new migration there only, then asserts:

- Alice's addressed parcel appears for Alice and Bob, but remains invisible to Charlie (same room) and David (other room);
- impersonating Bob's sender ID and addressing a nonmember fail;
- parcel `publish=true` is rejected;
- Bob alone may append an opening receipt, which Alice may observe but may not forge;
- Bob's cross-media reply with correct ancestry and reversed authenticated addresses is admitted as a new row; bad ancestry fails;
- no UPDATE or DELETE grants exist for mailbox or receipts.

The SQL fixture has self-described digest-shaped test IDs. These exercise membership/RLS/parent structure, not actual SHA-256 calculations or a deployed app. No network or real-user contact is part of CI.

## Post-merge dependencies

1. Independently approve and apply migration to the selected Supabase project after verifying its current `room_members` and `is_room_member` schemas, migration order, policies, and role grants.
2. Upgrade the TanStack Start version through the separate framework security issue (#8). No vulnerable-dependency bypass or production deployment is attempted.
3. Regenerate Lovable-managed Supabase types from the installed schema; this branch uses an isolated migration-facing client type, leaving its generated file untouched.
4. Add source-byte verified, permission-scoped media transport; room authorizations and RLS-secured attachment access must be checked independently.
5. Add native, locally authorized Band Runtime room witness appends and reLATTE crossings as *additional* acts. Sending a mail row cannot cause publication or recording in shared encounter history without a new consent boundary.

**ADDRESS != DELIVERY · DEPOSIT != OPEN · OPEN != ACCEPT · ROOM MEMBER != POSTAL ADDRESSEE · HASH != SIGNATURE · RETURN != RELEASE.**

## Independent application-typecheck finding (not release ready)

An optional CI typecheck detected an already unsynchronized `package.json` / `package-lock.json` (a normal `npm ci` fails before compilation). For diagnostic purposes only, the ephemeral CI runner uses `npm install --package-lock=false --ignore-scripts`; no lockfile or production dependency is rewritten. The first run exposed one new POST 001 `TEXT`-exclusion comparison, corrected in this branch. Remaining errors originate in the existing `src/lib/return-address.ts` index-signature accesses and `src/routes/__root.tsx` error-boundary signature under the currently resolved dependency versions. **Until those are fixed and the framework security issue #8 is resolved, no successful full application typecheck, build, or deploy is claimed.**
