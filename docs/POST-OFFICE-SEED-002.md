# POST-OFFICE-SEED-002: the letter that plants a website

**State:** bounded experimental implementation, draft branch only. Not a live P2P service, not a mailed letter, not a human identity or cryptographic-signature authority.

## Hypothesis

The public preface Letter 000 can survive as a portable, content-addressed JSON seed. Two isolated readers, receiving the same file through voluntary/manual transport, can independently verify its SHA-256 and produce equivalent views. They can each generate a single-file website that opens with no network and no running Abundent server.

This **does not** demonstrate IPFS, Soulseek transfer, decentralized node discovery, an independently verified sender identity, email delivery, or unbounded self-authoring. It is the minimum falsifiable parcel format and renderer before experimentation with those transports.

## Implementation

- `post-office/seed-lab/seed-000.json`: bounded public seed transcribed from `post-office/archive/000/`, dated and marked `PUBLIC_PREFACE_NOT_EMAILED`. Public source is the Post Office draft PR #33. No subscriber identity, email address, private uploads, or recipient fields.
- `post-office/seed-lab/seed.mjs`: canonical JSON (recursive sorted keys), SHA-256 content verification using WebCrypto, strict schema, length and facet bounds, deterministic dial projections, HTML escaping, and one-file static HTML export.
- `post-office/seed-lab/reader.mjs`: explicit fixture load or user-controlled local JSON file import. All rendering uses `textContent`; nothing is posted, persisted, or automatically submitted. Reader A / Reader B are separately executed browser contexts. No auto-fetch on initial page load.
- `post-office/seed-lab/index.html`: two 11-position instruments (lens and detail). Unsupported lenses return an empty explanation, not fabricated content. Export the original seed JSON and an offline projection HTML for a selected dial combination.
- `post-office/seed-lab/style.css`: first-party layout, no external fonts or media.
- Release path allowlist lists only reviewed seed-lab public assets, outside the fixed PWA cache. Existing world contract and founding field identity are unchanged.

## Science protocol (manual)

1. Open the lab from the Post Office, click **Load public letter 000**, and confirm a content digest.
2. Turn lens from **all** to **music**, then to **engineering**. The latter should be explicitly empty rather than inventing any engineering claims.
3. Download **Carry the seed .json**, transfer it out of band to a second browser profile or different device.
4. Open **Reader B** on that device and import the JSON file. Compare hashes and rendered text at the same dial settings.
5. With a verified seed loaded, click **Grow offline page .html**, then open that standalone HTML file after disconnecting the device from the network. It has no script, remote stylesheet, fonts, images, iframe, form, or automatic network operation.
6. Change one byte of a text field in a copy of the JSON (without changing the digest). Reader B must HOLD with `SEED_HASH_MISMATCH` and display no contents. Also test invalid schema and unsupported source.
7. Independently compute `sha256(canonical(payload))` in Node or Python; the digest must match the seed. This is a different implementation than the reader verifier.

**Automated witnesses:** `npm test` covers same-hash cross-reader projections, source/metadata corruption, invalid schema, 11 dial positions, no fabricated output, and no external code in generated HTML. `python tests/seed_lab_browser.py` opens isolated Chromium contexts for A and B, transfers one byte-identical local JSON fixture, compares actual rendered output, checks tamper rejection, creates and reads an HTML projection under offline network emulation, and checks zero passive external requests/storage writes.

## Authority and constraints

- **SHA-256 ≠ signature.** An attacker can recompute a digest on a counterfeit seed. Author/key custody, signature trust anchor, consent provenance and replay/distribution authority remain HOLD.
- **File ≠ upload.** Import happens only on the local device. The browser never sends the seed to a server.
- **View ≠ original.** HTML is a derivative rendering; preserve original seed for independent verification. A static file can be edited later and is not sealed by the displayed digest.
- **Newsletter ≠ experiment.** Buttondown subscriber addresses are strictly outside this path.
- **Transport ≠ adoption.** Manual file handoff is only one experiment. P2P discovery/transfer, Cloudflare Workers, IPFS/Hypercore, AWS and inbox/identity integration require separate owner decisions, safety reviews, and tests.
- **Observed ≠ deployed.** PR source does not establish public release. Vercel previews may require sign-in; production is not automatically updated.

## Next falsifiable boundary

Run a witnessed physical two-device exchange with a second computer/phone and repeat the offline-opening test. If it works, extend the envelope with an actual **publisher-held signing key** and independent verifier trust rule before enabling remote relay or other automatic publication. Document success and failures without upgrading the unsigned seed to an authenticated artifact.
