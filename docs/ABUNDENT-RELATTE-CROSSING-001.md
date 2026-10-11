# ABUNDENT × reLATTE CROSSING 001 — LemonPRESS → webZ → GrO review

**Status:** source-backed, signed **experimental** crossing; staged draft. Not published to `abundent.org`; not a GrO-owned receiver; no reLATTE RECEIVED receipt.

## Why this slice

Demonstrate one actual public source artifact from another repository crossing into an independently verifying webZ browser surface, then being manually carried into a second browser's local, GrO-themed HOLD review. This is not a hundred-repo census and makes no claim of production delivery, publisher authority, user adoption, or cross-world semantic effect.

## Exact donor

- Owning repository: `the-static-collective/lemonPRESS`.
- Real public carrier: `catalog.yaml`.
- Git commit: `02feb4454240d482a5e0e03258f24f8b5cc0b9f5`.
- Git blob SHA-1: `907759670a118e8a1098fe3350a0ad9f9ae37045`.
- Raw source SHA-256: `cbe0bca162dea2d7f828bbb3546f3de3ab7f787084fcc7f4b8b193ca0d866d75`.
- External authoritative read location: https://github.com/the-static-collective/lemonPRESS/blob/02feb4454240d482a5e0e03258f24f8b5cc0b9f5/catalog.yaml

This copy of the public catalog records a LemonPRESS admission. Its use as a specimen **does not itself** create another LemonPRESS publication or an endorsement of the webZ adapter.

## Crossing

`arrivals/lemonpress-catalog-001.json` preserves **exact** UTF-8 source bytes and a real `relatte.crossing-envelope/v0` body, crossing ID and P-256 signature. Both the SHA-256 of the source and Git blob SHA-1 are recomputed in-browser. The browser reconstructs the reLATTE identity body, recomputes the domain-separated ID and verifies the domain-separated signature using WebCrypto.

**Key limitation:** the demonstration signature is from an ephemeral experiment key, pinned in `arrivals/verify.mjs`, and **is not** a LemonPRESS key, public organization identity, operator identity or delegation. The signing private key is not published or shipped. The source-world is explicitly `world:abundent-experimental-adapter`, not LemonPRESS. This is source-referenced signed transport, not author-signed publication.

Destination in the crossing envelope: `world:gro-local-review` as a proposed destination *label* only. No GrO receiver ownership, reLATTE admission contract, automatic GrO action, GrO state mutation or world permission is established.

## Actual interaction

1. Host the branch locally with `npm run serve`, open `/arrivals/`.
2. Click **Inspect the traveler**. The browser rechecks original bytes, commit/blob pins, crossing ID and signature; failures reject.
3. Only after verification, click **Download verified parcel**.
4. Open `/arrivals/gro/` in another browser context or device; explicitly import the downloaded JSON.
5. The second browser independently verifies the same bytes/signature, and a human can **Record local HOLD** and export a separate `webz/unsigned-local-review/v0` observation.
6. Compare the exact original crossing ID in both results and local HOLD. No shared mutable receiver state is used.

Import and decisions remain in memory; the explicit downloads are outside browser-local custody. No localStorage, contact data, API calls to other owners, keys, telemetry or automatic sending are needed.

## What it earns / refuses

| Claim | State |
| --- | --- |
| Original public LemonPRESS bytes embedded and checked | Verifiable offline against pinned checksums |
| Source Git blob identity | Recomputable from copied file bytes; pin declared in verified demo code |
| Experimental reLATTE signature and crossing identity | Independently verifiable using WebCrypto |
| Manual export/reimport in separate contexts | Supported and testable; no delivery automatic |
| Receiver decision in a second browser | Browser-local **unsigned HOLD observation**, not a real receiver |
| LemonPRESS owner signature / GrO sovereign receipt | **NOT PRESENT** |
| Actual remote delivery, durable mirroring, newsletter, dispatch | **NOT ATTEMPTED** |
| Public `abundent.org` release | **HOLD** |
| General arbitrary origin key and policy verification | **NOT SUPPORTED**; one pinned experiment only |

### Laws

```text
PINNED_SOURCE != OWNER_SIGNATURE
VALID_SIGNATURE != OWNER_AUTHORITY
IMPORT != RECEIVED
LOCAL_HOLD != SIGNED_RECEIPT
DESTINATION_LABEL != WORLD_OWNERSHIP
RELEASE_LIST != PRODUCTION_DEPLOYMENT
```

## Architecture and safety

`arrivals/verify.mjs` is deliberately separate from the MAXHINAL proof viewer (which accepts only a specialized sanitized profile); the viewer is not silently generalized. The adapter targets exactly one known signed reLATTE specimen and rejects unknown keys, kinds, fields, changed destinations, source bytes, metadata, and signatures.

The site remains static. The experimental routes are added to `scripts/build-release.mjs`'s explicit public asset list, **not** the frozen service-worker shell list; no automatic deployment or DNS change is made. The pre-existing stack on PR #47 remains intact. No source-owner API secrets or private key material enter the web.

## Test / next gates

```sh
npm test
npm run field:verify
npm run build
node scripts/verify-release.mjs dist
npm run test:browser
```

`tests/arrival-crossing-001.test.mjs` covers successful verification/replay, bad original bytes, Git blob, exact source pins, signature, substituted key, modified destination, and no authority escalation.

Further separate gates:
- Native GrO receiver independently verifies and signs its own RECEIVE + HOLD receipts using a locally controlled key, preserving owner-local disposition.
- Public and developer-maintained trust anchor / key rotation; experimental key must never be represented as LemonPRESS's key.
- Multi-donor adapter profile with strict capability budgets and vetted public-release policy.
- Human-reviewed production staging/rollback and physical Android cross-device witness.

The core protocol remains owned by reLATTE. The source remains owned by LemonPRESS. webZ exposes a replaceable *view* and *manual route*. GrO receives no authority by being named.
