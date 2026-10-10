# POCKET DOOR CROSSING 006 — webZ × GrO × ROOTLINE

**State:** draft-only scientific cross, stacked on ROOTLINE 005 PR #44. No production release, DNS change, outbound SMS, subscriber use, private correspondence, creator signatures or untrusted world admission.

## End-to-end hypothesis

An **actual first-party public URL** (`/d/MOSS-042/`, `/d/ROSEMARY-001/`, `/d/LIGHT-KEEP-003/`) can be shared manually. A recipient opens the URL and expressly chooses to create a **verified, actor-local GrO encounter**. A person may optionally author a **distinct ROOTLINE public encouragement**, expressly approve it for public sharing, and voluntarily carry a bounded JSON bundle to a second browser. That browser independently verifies both components; the ROOTLINE seed can continue into ROOTLINE 005's existing human-carried A→B→C flow, with no compulsory forwarding.

## Authority split, made executable

- **webZ:** hosts the public door addresses and an explicitly reviewed static asset list; none of these routes is automatically added to the PWA shell cache. URLs only belong to the actual host serving the code. A preview URL is not `abundent.org`.
- **GrO:** exact copied public source modules from draft [GrO Pocket Doors PR #28](https://github.com/the-static-collective/GrO/pull/28), including `pocket-core.mjs`, `field-pocket-door.js` and `field.js`. Git blob SHAs pinned in unit tests:
  - `apps/pocket-door/pocket-core.mjs`: `6f8394eed09b20626333879506c207b78eba437d`
  - `src/field-pocket-door.js`: `e1eb208d689f5f17fd9ef85a510de6a0520c3000`
  - `src/field.js`: `5ffdf3e27804db43f47abc45218c2b1e7cf4785c`
  - The browser mirror at `d/src/receipt.js` is deliberately a **deny-only receipt stub** because GrO's native `src/receipt.js` uses Node crypto for executable actions; no action receipt is authorized through these web links. The GrO field and adapter code is otherwise mirrored exactly, with tests checking the Git blobs. Any drift needs a deliberate reviewed update.
  - An encounter uses the GrO native `projectPocketDoorEncounter` contract. GrO's `act` refuses the door, because its affordance is `kind: "encounter"` rather than an executable `kind: "action"`.
- **ROOTLINE:** reuse the *same* on-repository `post-office/rootline/rootline-core.mjs` as ROOTLINE 005. A person must check an explicit public-text consent box to create a new independent seed. The bridge preserves the exact full GrO door packet and ROOTLINE origin, with a separately checked SHA-256 binding over `{doorDigest, rootlineOrigin}`. The bundle is an **unsigned content-consistency claim**—not proof that the original author consented, or that a peer is who they say they are.
- **reLATTE:** nothing claims source ownership, admission, signed crossing receipt, delivery authority or legal custody. Future source-owned signatures and authorized boundaries require a separate gate.

## User journey

1. Open `/d/` (or one of the three exact public routes) on any browser. The page is static, with no passive third-party requests.
2. Click **Open this little world**. The code issues a GrO demo door packet and verifies it against the *exact accepted authored body*; then it creates the GrO local **encounter**. A URL alone is not a signed world claim or passive action.
3. Change `letter/sound/wander/workbench` and depth 0–10. A `sound` entrance is written sound imagery, not an audio player; there is no manga generation or remote equipment control.
4. Deliberately **Copy a text invitation** for the actual HTTPS host; copy or download verifiable GrO JSON; export a one-file offline HTML room. No SMS is sent by webZ.
5. Optionally write a 3–220-character public encouragement, confirm authorship + voluntary public sharing, then **Bind my encouragement locally**. This produces `abundent/pocket-door-rootline-crossing/v0` with independent source and note hashes, no recipient data, no mandatory reply and no file upload.
6. Deliberately copy or export the full combined JSON bundle. A second reader opens the **same exact door route**, pastes or imports the bundle, independently verifies its original source and note without talking to the sender.
7. The second reader can **Download ROOTLINE seed** and import it at `/post-office/rootline/?station=B`, then choose keep, add another separately attributed note, or stop. A third reader can verify the resulting ROOTLINE JSON offline after both A and B have left.
8. **Close this door** clears this tab's in-memory packet, note and sharing consent, without attempting to erase a text or file already deliberately copied elsewhere.

## Testable claims

- `tests/pocket-door-006.test.mjs`: three cross-repository source Git blob pins, exactly three accepted door IDs, 4 entrances × 11 depth stops per door, executable GrO encounter restrictions, forged/rehash-incompatible source rejection, ROOTLINE note binding, denial of oversized packets, non-HTTPS message-link failure, first-party-only static release list, no browser subscriber storage or send facilities.
- `tests/pocket_door_browser.py`: independent Chromium sender and receiver contexts. Open public MOSS route, create actual local GrO encounter, select the sound view, reject an HTTP-only copy URL, export offline HTML, explicitly compose a ROOTLINE seed and copy a bundle; close A; B pastes/independently verifies, downloads the separate ROOTLINE seed and voluntarily adds a note; close B; C reads and verifies it offline, keeps without replying, then rejects tampered content.
- Full repo CI: `npm test`, `npm run field:verify`, `npm run build`, `node scripts/verify-release.mjs dist`, `npm run test:browser`.

## Things still HOLD

- `abundent.org/d/` **production** addresses (draft preview only until separate release authorization).
- Physical Android testing, QR printing, separate network transfer, fully offline-installable reader, source publisher signatures, third-party world admission and public user-generated world publishing.
- Any automated SMS or reply-world operation: provider ownership, explicit consent, STOP/HELP, abuse controls and pricing would be a separate service.
- ROOTLINE B/C additions are carried as separate ROOTLINE JSON. This v0 door+ROOTLINE bundle binds **only the initial voluntary public note**, not every future downstream addition. Future resealing/recomposition needs its own authority decision.
- Anonymity is **not guaranteed**. A manually chosen SMS or social app might reveal numbers, accounts or metadata to its operator. Do not place sensitive or identifying information in public encouragement seeds.

**Law: ADDRESS ≠ PAYLOAD; DOOR ≠ CROSSING; ENCOUNTER ≠ ACTION; HASH ≠ AUTHORSHIP; REPLY ≠ PUBLICATION; KEEP ≠ OBLIGATION.**
