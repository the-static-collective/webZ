# webZ — World Wide Web of Worlds

A world gets an address. A door gets a contract. A traveler gets a choice. A crossing gets a trace.

The first executable slice is **Sanctuary → Orchard → Sanctuary**: two distinct first-party documents, a mobile invitation porch, and a read-only MAXHINAL proof viewer. It works offline after one successful initial load and static cache installation. No backend, accounts, telemetry, external media, signing keys or new infrastructure.

```sh
# Node 22+; no runtime dependencies
npm test
npm run serve
# Open http://127.0.0.1:8080/
```

Use **Inspect door**, then **Cross** or **Remain**. Orchard offers an explicit **Return**. Default carry is always none. Optionally enable a non-sensitive local trace; inspect/export it, then reconstruct the same projection in a new browser or process:

```sh
npm run replay -- evidence/browser/voyage.frozen.json
node scripts/verify-report.mjs evidence/public-simulation.json
```

Mobile/browser validation requires Python 3.12+ and Playwright with Chromium:

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:browser
```

The browser test starts its own loopback server under a nested `/nested/webZ/` base. It exercises online/offline round trips, independent unsigned human decisions, failed destinations, corrupt/denied storage, counterfeit LIVE imports, static-cache privacy, Node/fresh-browser cold replay, and delayed crossing/export/import cancellation. [Browser results and screenshots](evidence/browser/) are generated from real Chromium.

The porch is **NOT_ISSUED / delivery disabled**. Prepare up to 2048 UTF-8 bytes of consented public text; rehearse each world's HOLD / REFUSE / ADMIT independently. Draft text stays in page memory. Only proposal hashes, lengths and unsigned local decisions enter an optional trace. Neither consent nor ADMIT grants publication, reuse, execution or STORYSHIP canon. Closing/clearing the draft revokes the local offer; there is no remote receiver or capability.

The evidence viewer accepts only a bounded `webz/sanitized-maxhinal/v0` public carrier; it independently checks reLATTE v0 signatures, identity hashes, world/particular binding, ancestry, conflicting duplicates and each custodian record. It produces a `webz/proof-view/v0` observation. Imported reports remain in memory. The included signed fixture is a simulation with incomplete paired custody. Uploaded fingerprints cannot authenticate actual hosts, and flags cannot grant LIVE. The **Constellation Rack stays locked**.

[Crossing and verification report, boundaries, blockers, next gates](docs/OFFLINE-001-VERIFICATION.md) · [Implementation plan](docs/superpowers/plans/2026-10-07-offline-sovereign-porch.md).

Approved design sources remain unchanged: [GENESIS](docs/superpowers/specs/2026-10-06-webz-genesis-001-design.md) and [MAXHINAL/PORCH](docs/superpowers/specs/2026-10-06-webz-maxhinal-porch-001-design.md). The feature PR is stacked on webZ PR #2; it does not merge or deploy its design or alter neighboring approved baselines.

## Living Cards 001 — first real-world round trip

[Open Living Cards](cards/). A mobile, no-account instrument to convert an actual HAVE / NEED / CAN_DO into a portable shareable **unsigned** card; another person can manually return an unverified reply, and an operator can report a real action for a second person to confirm or dispute. No volunteers, server, payment or fabricated demand are prerequisites. All links carry their own data; local saving is opt-in only. The `/cards/` workbench is distinct from source-bound GrO FORAGE and from WANTED financial hypotheses. [Field protocol, privacy and proof gates](docs/LIVING-CARDS-001.md). Tests: `node --test tests/living-cards.test.mjs`.

## GrO × WALL-E — Field Porch 001

The first opt-in **GrO/FORAGE field crossing** lives at [WEBZ Field Porch](forage/).
Bring the GrO local HOLD, FORAGE lead and original-byte photo evidence;
WEBZ independently replays the source files before allowing a reviewed,
sanitary **public invitation postcard**. It does **not** take the item,
transfer photos, admit a GrO prospect as property, or add any sovereign WEBZ
world. Explicit choice remains with the traveler and each receiver.

See [the field crossing guide](docs/FIELD-PORCH-001-WALLE-GRO.md).
The source files are runnable locally, but are **not** a verified live
internet deployment.

## GLEAN-001 · The Remainder Porch

A distinct source of opportunity from scavenging: a steward **offers a
bounded remainder** while maintaining control over the original resource.
The [GLEAN porch](glean/) accepts the Static OS donor-offer and GrO local
HOLD, verifies matching source records, and proposes a **consent-only,
unsigned** limited invitation for manual WEBZ porch review. It does not
transmit, collect or authenticate actual physical resources.

See [GLEAN-001 guide](docs/GLEAN-001-REMAINDER-PORCH.md).

## Porchlight Commons 001 — Organizational Exchange Desk

The new [Porchlight Commons prototype](commons/) drafts privacy-conscious organizational needs and compares **local purchase / distant donation / knowledge transfer**, without network submission, accounts, partner claims, case data or unverified delivery confirmation. [Plan, first crossing, gates and limitations](docs/PORCHLIGHT-COMMONS-001.md). Tests: `node --test tests/commons.test.mjs`.

## Jubilee Circuit 001 — Music carries the culture

[The Road Brings the Feast](jubilee/) provides a static, print-ready two-hour field kit and local-only invitation composer for a proposed festival × church × community-led network. [Operating protocol](docs/JUBILEE-CIRCUIT-001.md). No partners, songs, services or outcomes are presented as confirmed. Tests: node --test tests/jubilee.test.mjs.

## Living Receiver 001 — account-free community review

The [Living Receiver](commons/receiver/) extends the Commons exchange desk. A person can locally open a small, non-sensitive HOLD card or JAR;VIS planZ return candidate, record an **unsigned self-attested** HOLD/REFUSE/ACCEPT_FOR_LOCAL_REVIEW note, and prepare a separately unverified field report. Export and re-import JSON on any device without installing our software. No provider authentication, cryptographic signature, sending, shared storage, verified recipient receipt, money flow or service placement is implied. [Field protocol](docs/LIVING-RECEIVER-001.md).

## Living Receiver 002 — Private invitation inbox

The [persistent Living Inbox](commons/inbox/) connects to an isolated Supabase Edge Function and private commons_inbox_* tables. The creator receives three random bearer capabilities: owner (manage), reviewer (read and self-attested review), and submitter (blind proposal submission). Only token hashes are stored. All tables use RLS and have no anon/authenticated direct grants. The service role stays server-side. A capability link is not verified identity; a review is not signed reLATTE ADMIT, and a report is not confirmed fulfillment. Owners can rotate reviewer/submitter links, close, or permanently delete. [Full protocol](docs/LIVING-INBOX-002.md).

## Abundent Link Wallet 001 — private account-free keyring

[Open the Link Wallet](commons/wallet/). Stores up to 200 HTTPS invitation links and public bookmarks in a **single AES-256-GCM encrypted local vault**, with a 600,000-iteration PBKDF2-SHA256 passphrase-derived key. Encrypted ciphertext, salt, IV and revision alone are stored in IndexedDB. Decrypted URLs, labels and in-memory CryptoKey exist only while the vault is unlocked in that browser tab. You can search, group and label doors; open/copy with deliberate clicks; lock, delete local vault, re-encrypt with a new passphrase, and export/import an encrypted JSON backup to move across devices or domains. No backend, account, synchronizer or third-party script. [Security and recovery guide](docs/LINK-WALLET-001.md).

**Important:** A wallet is a protective container for bearer links, not an authentication system, proof of invitation legitimacy, or authority to act. Losing the passphrase and backup is irreversible. External access must be revoked at each originating service, not by deleting a wallet item. Browser-origin storage is not automatically shared across Abundent / Vercel / GitHub Pages hostnames.

## One-tap Keep this link (002)

[Live Link Wallet](commons/wallet/) now accepts explicit same-origin, one-time postMessage offers from the Living Inbox (owner/reviewer/submitter/current/rotated invitations) and each configured public Switchboard door. Offers travel without secrets in the popup URL, clipboard, or storage and appear in a human confirmation panel. They are encrypted only after the person creates/unlocks their local wallet and presses **Keep link**. [Boundary and test record](docs/LINK-WALLET-002.md).
