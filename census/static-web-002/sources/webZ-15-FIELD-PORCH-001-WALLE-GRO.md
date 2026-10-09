# WEBZ × GrO × FORAGE — FIELD PORCH 001

**Status:** runnable original-byte-grant-free bridge in WEBZ, not a live
cross-repository transport, signed reLATTE crossing, or deployed service.

WEBZ is the addressable *web of worlds*. GrO is the embodied encounter game.
FORAGE-001 is the bounded human authority/physical handoff ledger. Their
integration should preserve rather than flatten those roles.

## The three independent doors

| Owner | What actually happens here | What is not inherited |
|---|---|---|
| [GrO phone scout PR #21](https://github.com/the-static-collective/GrO/pull/21) | Original camera file → local hashed HOLD encounter | No title, pickup right, public GrO trace |
| [Static OS FORAGE-002 PR #83](https://github.com/the-static-collective/static-os/pull/83), [FORAGE-001 PR #80](https://github.com/the-static-collective/static-os/pull/80) | Source-specific permissions and later operator-reported handoff can be researched | No legal verification or automatic admission to inventory |
| **WEBZ Field Porch** | Replays GrO's local photo evidence, then (by explicit consent) drafts a minimal *unsigned* public-text candidate | No default carry, world admission, relay, publication, physical movement or royalty |

The current WEBZ Sanctuary/Orchard world manifests and local navigation
contracts are left unchanged. **The Field Porch is a first-party public
surface, not a new sovereign WEBZ world or playable pickup action.**

## Actually implemented

- `/forage/`: small-screen offline-capable HTML interface; four operator
  selected local files: FORAGE lead JSON, photo-evidence JSON, GrO local HOLD
  JSON, **unchanged original JPEG/PNG**. No GPS, network request or photo
  publication. No imported data is written to localStorage or browser cache.
- `forage/contracts/scout-core.mjs` pinned directly to the source in
  Static OS FORAGE-002 / GrO FORAGE-001, Git blob:
  `363c7127cb0405e32a86a58d79f6365151a1ed1d`.
- `forage/contracts/stable.mjs` pinned to GrO source:
  `27b22169d8061428410720dba9ce2a35f8f576e3`.
- `forage/contracts/gro-hold.mjs` pinned to GrO source:
  `16448017a8ef14c5a06a52e1d124fee5bf9d2325`.
  These exact blob digests are independently checked in the WEBZ test suite.
- `forage/bridge.mjs`: verifies the unmodified bytes through GrO's local
  HOLD verifier (original hash + exact FORAGE-001 lead + local actor/place/world
  claim). Treats its local world and operator identity as *unverified data*,
  never source authorization.
- Source-matched HOLD may produce **only by user consent** a short
  `webz/forage-public-card/v0`: a generic category, deterministic speculative
  use labels and a source encounter fingerprint, plus permanent language
  disclaiming owner rights and motion. Uses WEBZ's exact existing
  `proposal(value, consent)` 2048-byte limit and integrity hashing.
- `webz/forage-door-proposal/v0` is the unsigned JSON output with
  `receiver_choice: NOT_TAKEN`, no carry or signed crossing. The browser
  displays the **exact** public postcard and only copies/exports it on
  explicit click. There is no automatic link transmission or paste.
- Existing `sw.js` fixed static asset allowlist includes the new Field
  Porch and its source modules for offline operation. It does **not** cache
  uploaded files, extracted media, source records, clipboard contents or
  unreviewed private reports.

## Run locally

Node 22+, Python 3.12+ for Chromium/Playwright:

```sh
npm test
npm run serve
# Open http://127.0.0.1:8080/ and select Field Porch · GrO

python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:browser
```

Actual GrO scouting starts at its separate
[phone source app](https://github.com/the-static-collective/GrO/tree/experiment/gro-forage-001-wall-e-phone/apps/field-scout).
It currently has no confirmed public HTTPS deployment. If the code has not
yet been hosted, the GrO guide documents secure local operation and a
GitHub Pages workflow; these source pages do not constitute live apps.

In the GrO mobile app, photograph or choose an original JPEG/PNG (max 16 MiB)
and prepare a held record. Download three JSON records (lead, photo-evidence
and GrO HOLD) and retain the **original photo bytes**.

At WEBZ /forage/, supply those four files, explicitly review and consent to
the public fingerprint, and click **Prepare local WEBZ invitation**. Inspect
the exact postcard. Optionally **Copy reviewed public text** and go to
WEBZ's [original invitation porch](../porch/) to paste it as human public text.

The original porch still demands its own separate consent and human
HOLD/REFUSE/ADMIT decisions per world. Even its local ADMIT is an unsigned
rehearsal, NOT a reLATTE signed receipt or an actual physical recovery grant.
The field-side unverified metadata is never auto-uploaded or carried by
navigation.

## Privacy / provenance caveats

The public fingerprint is derived from a GrO local HOLD record that hashes
original source fields, so **it is correlatable** if other people have the
original GrO record or source. Your consent is explicit, and you can decline
the entire export. The webpage does not include raw photos, site/steward
references, freeform observations, actor IDs, world names or exact original
photo hashes in the public postcard. Browser view-only imported files are
held in page memory until changed, cleared or navigation closes the page;
this is not secure encrypted file storage. The user's browser/device still
controls clipboard and downloaded artifacts.

The original photo hash checks whether bytes match an earlier local claim;
it does not prove when or where a camera recorded them or whether the photo
depicts a particular lawful offer. The versioned GrO record and WEBZ postcard
have no independent device signature, independent owner attestation or
physical permission authority.

### Refusal tests

The Node suite and real Chromium witness test:
- No consent: hold and no public proposal.
- Correct original image and matching source lead/evidence/GrO HOLD:
  replayable public postcard only.
- Changed photo or a rehashed forged GrO identity/physical-inventory claim:
  no proposal.
- Changed or extra WEBZ authority fields: cold replay refuses.
- Original freeform notes, source owner/site references, photo bytes,
  photo digest, and actor/world metadata omitted from postcard.
- Existing Sanctuary and Orchard `default_carry=none` remains unchanged;
  no new world authority or history.
- Browser narrow-screen layout, nested base route, offline static shell,
  no private-photo cache, no third-party network requests.

## Next real doors

1. Publish GrO and WEBZ behind actual, verified HTTPS host URLs so an
   ordinary phone can open both.
2. Optional **explicit** inter-porch local transfer of the minimal postcard
   with same-origin opt-in; no private automatic carry.
3. Separate reLATTE signed crossing → destination owner-local receiving
   and independent full source and physical permission verification.
4. Optional GHoT opt-in visual inference with provenance and dissent.
   Current possible-use labels are **not** neural perception.
5. Robot Garden physical inspection, owner-admitted useful inventory,
   supervised robotics with independent human controls.

**Normative:** SEE != TAKE; GrO HOLD != FORAGE OWNER PERMISSION;
WEBZ PUBLIC PROPOSAL != TRANSMITTED PARCEL; SIGNED CROSSING != ADMISSION;
PHOTO != TITLE; HASH != SIGNATURE; WEBZ WORLD DOOR != ROBOT COMMAND.
