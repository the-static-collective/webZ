# Abundent Circuit 001 — The Next Harbor

**Status:** runnable **local field pilot**, not an operational multi-user social network, verified-human witnessing system, native donor composition, money platform, or safety-certified event organizer.

A paper-friendly, phone-readable, no-account vertical slice connecting:

1. **Invitations:** public-safe, unsent drafts (inspired by the Seven-Day Table and Weaving Garden).
2. **Gatherings/projects:** local proposals with an explicit accepting actor, scope, completion report, and separate review.
3. **Full Measure / GrO-shaped projection:** only separate-review-confirmed projects open a local Deed and new named affordance. **No native Full Measure or GrO database is modified.**
4. **Economy:** separate books for actual-vs-planned money, goods, equipment and proposals. **No payments, credits, asset valuation, play-token or cash transfers.**
5. **GHoT-shaped compute:** a bounded real in-browser word/character/line count with an accurate local execution receipt; **does not run actual GHoT or remotely distribute work.**
6. **reLATTE-shaped crossings:** source prepares portable JSON; importing at the exact addressed independent node creates a HOLD. A steward can ADMIT_FOR_REVIEW or REFUSE and return a receipt. **Not cryptographically signed; not authenticated or production reLATTE.**
7. **Festival Foundry:** a locally confirmed project can create a documented, reusable cartridge. Importing it at another node creates a brand-new **PROPOSED** seed, not inherited authority.

## Try it now: one file, no installation

Open **`Abundent_Circuit_001_Offline.html`** in an ordinary browser, including on a reasonably recent Mac with macOS Mojave or on a phone that permits opening local HTML. The file includes its JavaScript and CSS; it makes **zero network requests**.

Click **Load fictional two-harbor demo**, then try:

- **Build & Grow:** accept a sample project as `Alice`, report it as `Alice`, then enter a separate review as `Bob` and name one newly established capacity. This is typed self-attestation, not authenticated eyewitness evidence.
- **Crossings:** prepare a crossing to the Workshop, click the *same-browser demo* delivery, switch to Workshop, record a local HOLD disposition, prepare a return, switch back to original node, inspect the return. It **does not** automatically finish the project.
- **Economy:** record *planned* funds, *self-reported* expenditures, and a noncash gift. They remain distinct.
- **Compute:** run a local text count; inspect the receipt, which explicitly says `actualGHoT:false`.
- **Foundry:** after separate review, write a method and limits; export a cartridge. Switch to the Workshop and import it. It becomes a **new proposed** project.

Data is held in browser localStorage where available. Storage may be denied or cleared by browser policies; use **Backup JSON** and keep the file private. Sensitive or identifying information should **not** be entered in a pilot. For more durable local use, serve the one HTML file from a trusted local static host; no backend is required.

## Manual crossing between separate devices

1. Create a local harbor on **receiver device B**. On its Dashboard, copy its **public routing address** (`harbor-...`). The address is a random public locator, not a personal identity or secret credential.
2. Independently create a **source harbor on device A**. Propose one public-safe seed.
3. In **Crossings** select **External harbor**, paste B's exact address, and prepare a crossing. Download its JSON packet and deliver it to B through a separately approved means (USB, AirDrop, attachment, etc.). There is **no automatic message transport**.
4. On B, choose its own harbor, **Import JSON**, inspect the HOLD item, then locally admit *for review* or refuse. Export the return JSON and carry it back to A.
5. On A, **Import JSON** the return. Its local project remains unchanged, pending independently authorized next actions.

If both devices are using the same browser shared backup, that isn't independent device custody. The `tests/circuit.test.js` suite includes a source and target with completely separate local notebooks and public address handoff.

## Run tests / rebuild

Requires Node.js 20+ for testing and Python 3 for bundling:

```sh
node --test tests/circuit.test.js
python3 build.py
```

`tests/browser_smoke.py` is an optional Playwright+Chromium UI smoke test. It executes the fully bundled HTML via Playwright's `set_content` because browser navigation to local URLs can be blocked in restricted test environments. Its test harness intentionally has no localStorage permission and reports that limitation; local save persistence is not automatically proven by this smoke test.

The reproducible single-file HTML is generated from `index.html`, `core.js` and `app.js` with `build.py`. The bundled HTML is also committed for direct use.

## Proposed next genuine donor integrations (not yet landed)

| Port | Native system owns | First integration proof |
| --- | --- | --- |
| Invitation / publishing | Seven-Day Table, webZ, owner of each event | Real opt-in invitation response with data deletion and contact confidentiality |
| Completion / Deed | Full Measure world layer and authorized human review | Native receiving project independently validates evidence and refuses self-confirmation |
| Possibility opening | GrO | Native `RECEIPT → CONSEQUENCE → NEW AFFORDANCE`, with strict local admission |
| Crossing signature and acceptance | reLATTE | Signed envelope verified by separate receiver before HIT/HOLD/REFUSE; no auto-admission |
| Compute | GHoT | A real permitted `system.hash` or `media.probe` on a second hardware node with signed/verified response |
| Operator | Static Workbench | Human-approved read-only event import; no project state mutation by discovery |
| Physical capacity | Static OS / physical workshop | Approved job → fabrication → inspection → custody receipt; no autonomous printing |
| Economy | Jubilee Campfire/Treasury/PENNY and standard money ledgers | Separate legal/accounting owner and reconciliation; no ticket-to-money conversion |
| Cartridge publication | Lemon Press / Foundry | Explicit reviewed release with licensing, privacy, versioning, locally adaptable procedure |

## Invariants

`INVITED != ENROLLED`, `PROPOSED != ACCEPTED`, `REPORTED != CONFIRMED`, `SAME LABEL != VERIFIED PERSON`, `RECEIVED != ADMITTED`, `ADMIT FOR REVIEW != WORK AUTHORIZED`, `TICKET != MONEY`, `GIFT != WAGE`, `METHOD != ANOTHER NODE'S AUTHORITY`, `LOCAL BROWSER TASK != GHOT DISTRIBUTED COMPUTE`.

**Threats / unresolved:** no accounts, multi-party auth, signature verification, tamper-resistant journal, encryption, secure backups, user data erasure across copies, remote messaging, permission registry, real-money audit, human identity verification, or event-specific legal approvals. The local pilot is for non-sensitive planning and rehearsal. Never interpret it as a live co-op, festival, church, or civic service.

**Source concepts:** `the-static-collective/webZ`, `full-measure-world-layer`, `GrO`, `reLATTE`, `GHoT`, `static-workbench`, `static-os`, `Jubilee-Campfire`, `Jubilee-treasury`; user-owned Festival Foundry charters in Drive. This project does not make any donor's source, runtime or governance subordinate to its own.
